import time
from warnings import warn

from zope.interface import implements

from epsilon.extime import FixedOffset, Time

from twisted.internet.defer import maybeDeferred
from twisted.python.components import registerAdapter

from axiom.item import SQLAttribute

from nevow.tags import invisible
from nevow.athena import expose, LiveElement
from nevow.page import renderer

from xmantissa.ixmantissa import IWebTranslator, IColumn as mantissaIColumn
from xmantissa.webtheme import ThemedElement

from methanal.imethanal import IColumn
from methanal.util import getArgsDict
from methanal.view import liveFormFromAttributes


class AttributeColumn(object):
    """
    Implement a mapping between Axiom attributes and the query list-based
    L{IColumn}.
    """
    implements(IColumn)

    def __init__(self, attribute, attributeID=None):
        """
        Create an L{AttributeColumn} from an Axiom attribute.

        @param attribute: an axiom L{SQLAttribute} subclass.

        @param attributeID: an optional client-side identifier for this
        attribute.  Normally this will be this attribute's name; it isn't
        visible to the user on the client, it's simply the client-side internal
        identifier.
        """
        self.attribute = attribute
        if attributeID is None:
            attributeID = attribute.attrname
        self.attributeID = attributeID


    def extractValue(self, model, item):
        """
        Extract a simple value for this column from a given item, suitable for
        serialization via Athena's client-communication layer.

        This implementation differs from the one in Mantissa in that it uses
        C{getattr}, instead of C{__get__}, thus allowing it to work on items
        wrapped in a C{SharedProxy}.

        @param model: The query list object requesting the value.

        @param item: An instance of the class that this L{AttributeColumn}'s
        L{attribute} was taken from, to retrieve the value from.

        @return: a value of an attribute of C{item}, of a type dependent upon
        this L{AttributeColumn}'s L{attribute}.
        """
        return getattr(item, self.attribute.attrname)

registerAdapter(AttributeColumn, SQLAttribute, IColumn)



class QueryList(ThemedElement):
    """
    A widget that displays data tabulated according to a set of columns.

    Actions are supported too.
    """
    jsClass = u'Methanal.Widgets.QueryList'
    fragmentName = 'methanal-query-list'

    def __init__(self, rows, columns, webTranslator=None, timezone=None, **kw):
        super(QueryList, self).__init__(**kw)

        self.rows = list(rows)
        def _adapt(col):
            try:
                return IColumn(col)
            except TypeError:
                col = mantissaIColumn(col)

            warn('use methanal.imethanal.IColumn instead of xmantissa.ixmantissa.IColumn', DeprecationWarning, 2)
            return col

        columns = (_adapt(col) for col in columns)
        self.columns = [(col.attributeID.decode('ascii'), col)
                        for col in columns]
        self.webTranslator = webTranslator

        if timezone is None:
            hour, minute = divmod(time.timezone, -3600)
            timezone = FixedOffset(hour, minute)
            warn('not passing in timezone is deprecated', DeprecationWarning, 2)

        self.timezone = timezone

    def dictifyItem(self, item, index):
        def _formatValue(value):
            if isinstance(value, Time):
                return value.asDatetime(self.timezone).strftime('%a, %d %h %Y %H:%M:%S').decode('ascii')
            return value

        if isinstance(item, tuple):
            link, item = item
        else:
            if self.webTranslator is None:
                self.webTranslator = IWebTranslator(item.store)
            link = unicode(self.webTranslator.toWebID(item), 'ascii')

        d = dict((cid, _formatValue(col.extractValue(self, item)))
                 for (cid, col) in self.columns)
        d[u'__link__'] = link
        d[u'__id__'] = index

        return d

    def getInitialArguments(self):
        return [getArgsDict(self)]

    def getArgs(self):
        IDs = []
        aliases = {}
        for cid, col in self.columns:
            IDs.append(cid)
            if isinstance(col, AttributeColumn):
                alias = col.attribute.doc
            else:
                alias = col
            aliases[cid] = unicode(alias)

        return {u'columnIDs':     IDs,
                u'columnAliases': aliases,
                u'rows':          [self.dictifyItem(row, i)
                                   for i, row in enumerate(self.rows)]}

    @expose
    def performAction(self, name, rowIndex):
        method = getattr(self, 'action_' + name)
        item = self.rows[rowIndex]
        return method(item)


class FilterList(ThemedElement):
    """
    A filtering search widget.

    Essentially just a form that results in a server-side call, on submission,
    and a result widget.

    One particularly common application is a search widget: A form containing
    inputs representing fields to filter by, which, when submitted, results in
    a server-side database query and a QueryList widget.
    """
    jsClass = u'Methanal.Widgets.FilterList'
    fragmentName = 'methanal-filter-list'

    def __init__(self, form, resultWidget, title, **kw):
        """
        Initialise the filter widget.

        @type form: C{methanal.view.LiveForm}
        @param form: Form to display for filter inputs, the form's
            C{submitSuccess} client method will be passed the result
            widget; considering deriving client objects from
            C{Methanal.Widgets.FilterListForm}

        @type resultWidget: C{callable}
        @param resultWidget: A callable passed the result of C{form}'s
            callback and expected to return a renderable representing the
            filter results

        @type title: C{unicode}
        @param title: A title to display along with the filter widget
        """
        super(FilterList, self).__init__(**kw)
        self.form = form
        self.form.setFragmentParent(self)
        self.resultWidget = resultWidget
        self.title = title

        self.originalCallback = self.form.model.callback
        self.form.model.callback = self.filterCallback

    def filterCallback(self, **kw):
        """
        Handle form submission.

        Call the original form callback and create the result widget.

        @rtype: C{Deferred}
        """
        def makeResultWidget(data):
            w = self.resultWidget(data)
            w.setFragmentParent(self)
            return w

        return maybeDeferred(self.originalCallback, **kw
            ).addCallback(makeResultWidget)

    @renderer
    def formTitle(self, req, tag):
        return tag[self.title]

    @renderer
    def filterForm(self, req, tag):
        return tag[self.form]


class SimpleFilterList(FilterList):
    """
    A simple L{FilterList} implementation.

    Intended to generate a C{LiveForm} from a sequence of attributes, call a
    user-specified callback and display the results in a L{QueryList} with the
    desired columns.
    """
    def __init__(self, store, filterAttrs, callback, resultColumns, timezone=None, webTranslator=None, **kw):
        """
        Initialise the filter widget.

        @type store: C{axiom.store.Store}
        @param store: Store that the specified attributes reside in

        @type filterAttrs: C{sequence} of Axiom attributes
        @param filterAttrs: The attributes to provide form inputs for the
            attributes to filter on

        @type callback: C{callable} returning an C{iterable} of
            C{axiom.item.Item}s
        @param callback: The callable that is triggered when the filter form
            is submitted, passed parameters named according to the
            attribute names specified by the attributes in L{filterAttrs},
            returning result items

        @type resultColumns: C{list} of L{methanal.imethanal.IColumn}
        @param resultColumns: Columns for display in the result widget

        @type timezone: C{tzinfo}
        @param timezone: Timezone used for displaying timestamps.

        @type webTranslator: L{xmantissa.ixmantissa.IWebTranslator}
        @param webTranslator: The translator used for linking items.
        """
        form = liveFormFromAttributes(store=store,
                                      attributes=filterAttrs,
                                      callback=callback,
                                      doc=u'Filter',
                                      timezone=timezone)
        form.jsClass = u'Methanal.Widgets.FilterListForm'

        resultWidget = lambda rows: QueryList(rows=rows, columns=resultColumns, webTranslator=webTranslator, timezone=timezone)

        super(SimpleFilterList, self).__init__(form=form,
                                               resultWidget=resultWidget,
                                               **kw)


class Rollup(ThemedElement):
    jsClass = u'Methanal.Widgets.Rollup'

    def __init__(self, fragmentParent=None, label=None):
        super(Rollup, self).__init__(fragmentParent=fragmentParent)
        self.label = label or u''
        self._rollupFactory = None

    def _getRollupFactory(self):
        if self._rollupFactory is None:
            self._rollupFactory = self.getDocFactory('methanal-rollup')
        return self._rollupFactory

    def makeRollup(self, summary, content):
        rollupContent = invisible[self._getRollupFactory().load(preprocessors=LiveElement.preprocessors)]
        rollupContent.fillSlots('label', self.label)
        rollupContent.fillSlots('summary', summary)
        rollupContent.fillSlots('content', content)
        return rollupContent

    @renderer
    def rollup(self, req, tag):
        summary = tag.onePattern('summary')
        content = tag.onePattern('content')
        tag[self.makeRollup(summary, content)]
        return self.liveElement(req, tag)


class SimpleRollup(Rollup):
    fragmentName = 'methanal-simple-rollup'

    def __init__(self, content=None, **kw):
        super(SimpleRollup, self).__init__(**kw)
        self.content = content

    def getInitialArguments(self):
        params = self.getParams()
        return [params]

    def getParams(self):
        return {}

    @renderer
    def rollup(self, req, tag):
        summary = tag.onePattern('summary')
        tag[self.makeRollup(summary, self.content)]
        return self.liveElement(req, tag)
