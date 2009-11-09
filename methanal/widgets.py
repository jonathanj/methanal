import time
from warnings import warn

from zope.interface import implements

from epsilon.structlike import record
from epsilon.extime import FixedOffset, Time

from twisted.internet.defer import maybeDeferred
from twisted.python.components import registerAdapter

from axiom.item import SQLAttribute

from nevow.inevow import IAthenaTransportable
from nevow.tags import invisible
from nevow.athena import expose, LiveElement
from nevow.page import renderer

from xmantissa.ixmantissa import IWebTranslator, IColumn as mantissaIColumn
from xmantissa.webtheme import ThemedElement

from methanal.imethanal import IColumn
from methanal.util import getArgsDict
from methanal.view import (liveFormFromAttributes, containerFromAttributes,
    ObjectSelectInput, SimpleForm, FormInput, LiveForm, SubmitAction,
    ActionButton, ActionContainer)
from methanal.model import ValueParameter



class TimeTransportable(object):
    """
    An C{IAthenaTransportable} implementation for L{Time} instances.
    """
    implements(IAthenaTransportable)

    jsClass = u'Methanal.Util.Time.fromTimestamp'


    def __init__(self, time):
        self.time = time


    def getInitialArguments(self):
        return [self.time.asPOSIXTimestamp() * 1000]

registerAdapter(TimeTransportable, Time, IAthenaTransportable)



class AttributeColumn(object):
    """
    An L{methanal.imethanal.IColumn} provider for Axiom attributes.

    @type attribute: L{axiom.attributes.SQLAttribute}

    @type attributeID: C{str}
    @param attributeID: Attribute column identifier, defaults to the attribute
        name
    """
    implements(IColumn)


    def __init__(self, attribute, attributeID=None, title=None):
        self.attribute = attribute
        if attributeID is None:
            attributeID = attribute.attrname
        self.attributeID = attributeID
        if title is None:
            title = getattr(self.attribute, 'doc', None)
            if not title:
                title = unicode(attributeID, 'ascii')
        self.title = title


    # IColumn

    def extractValue(self, model, item):
        """
        Extract a simple value for this column from a given item, suitable for
        serialization via Athena's client-communication layer.

        This implementation differs from the one in Mantissa in that it uses
        C{getattr}, instead of C{__get__}, thus allowing it to work on items
        wrapped in a C{SharedProxy}.

        @param model: The query list object requesting the value

        @param item: An instance of the class that this L{AttributeColumn}'s
            L{attribute} was taken from, to retrieve the value from

        @return: A value of an attribute of C{item}, of a type dependent upon
            this L{AttributeColumn}'s L{attribute}
        """
        return getattr(item, self.attribute.attrname)


    def extractLink(self, model, item):
        webTranslator = IWebTranslator(item.store, None)
        if webTranslator is not None:
            return unicode(webTranslator.toWebID(item), 'ascii')
        return None


    def getType(self):
        return type(self.attribute).__name__

registerAdapter(AttributeColumn, SQLAttribute, IColumn)



class LinkColumn(object):
    """
    Provide a custom link for an existing L{IColumn}.

    @type column: L{IColumn}
    @ivar column: Existing column to provide a custom link for

    @ivar extractLink: A callable matching the signature of
        L{IColumn.extractLink}
    """
    implements(IColumn)


    def __init__(self, column, extractLink):
        self._column = column
        self.extractLink = extractLink
        self.extractValue = self._column.extractValue
        self.getType = self._column.getType
        self.attributeID = self._column.attributeID
        self.title = self._column.title



class Row(object):
    """
    A L{Table} row.

    @ivar id: Row identifier
    
    @type cells: Mapping of C{unicode} to L{Cell}
    @ivar cells: Mapping of column identifiers to cell objects
    """
    def __init__(self, item, index, table):
        self.id = index
        self.cells = dict()
        for column in table.columns:
            columnID = unicode(column.attributeID, 'ascii')
            value = column.extractValue(table, item)
            link = column.extractLink(table, item)
            self.cells[columnID] = Cell(value, link)



class RowTransportable(record('row')):
    """
    An C{IAthenaTransportable} implementation for L{Row} instances.
    """
    implements(IAthenaTransportable)

    jsClass = u'Methanal.Widgets.Row'


    def getInitialArguments(self):
        return [self.row.id, self.row.cells]

registerAdapter(RowTransportable, Row, IAthenaTransportable)



class Cell(object):
    """
    A L{Table} cell.

    @ivar value: Cell value

    @type link: C{unicode}
    @ivar link: Hyperlink for the cell, or C{None} if the cell is not
        hyperlinked
    """
    def __init__(self, value, link):
        self.value = value
        self.link = link



class CellTransportable(record('cell')):
    """
    An C{IAthenaTransportable} implementation for L{Cell} instances.
    """
    implements(IAthenaTransportable)

    jsClass = u'Methanal.Widgets.Cell'


    def getInitialArguments(self):
        return [self.cell.value, self.cell.link]

registerAdapter(CellTransportable, Cell, IAthenaTransportable)



class ColumnTransportable(record('column')):
    """
    An C{IAthenaTransportable} implementation for L{IColumn}.
    """
    implements(IAthenaTransportable)

    columnTypes = {
        'text': u'Methanal.Widgets.TextColumn',
        'integer': u'Methanal.Widgets.IntegerColumn',
        'boolean': u'Methanal.Widgets.BooleanColumn',
        'timestamp': u'Methanal.Widgets.TimestampColumn'}


    @property
    def jsClass(self):
        """
        Determine the Javascript class name based on the column type.
        """
        return self.columnTypes.get(self.getColumnType(), 'text')


    def getColumnType(self):
        """
        Get the type of a column, if it has one.
        """
        columnType = self.column.getType()
        if columnType is not None:
            columnType = unicode(columnType, 'ascii')
        return None


    def getInitialArguments(self):
        columnID = unicode(self.column.attributeID, 'ascii')
        return [columnID, self.column.title, self.getColumnType()]

registerAdapter(ColumnTransportable, IColumn, IAthenaTransportable)



class Table(ThemedElement):
    """
    Tabulate data with column values derived from Items.

    @type items: C{list} of C{axiom.item.Item}

    @type columns: C{list} of C{(unicode, methanal.imethanal.IColumn)}
    @ivar columns: A sequence of C{(columnID, column)}
    """
    jsClass = u'Methanal.Widgets.Table'
    fragmentName = 'methanal-table'


    def __init__(self, items, columns, **kw):
        super(Table, self).__init__(**kw)
        self.items = list(items)
        self.columns = [IColumn(column) for column in columns]


    def getInitialArguments(self):
        return [getArgsDict(self)]


    def getArgs(self):
        return {u'columns': self.columns,
                u'rows': [Row(item, index, self)
                          for index, item in enumerate(self.items)]}


    @expose
    def performAction(self, name, rowIndex):
        method = getattr(self, 'action_' + name)
        item = self.items[rowIndex]
        return method(item)



class QueryList(ThemedElement):
    """
    A widget that displays data tabulated according to a set of columns.

    Actions are supported too.
    """
    jsClass = u'Methanal.Widgets.QueryList'
    fragmentName = 'methanal-table'


    def __init__(self, rows, columns, webTranslator=None, timezone=None, **kw):
        warn('QueryList is deprecated, use methanal.widgets.Table instead')
        super(QueryList, self).__init__(**kw)

        self.rows = list(rows)
        def _adapt(col):
            try:
                return IColumn(col)
            except TypeError:
                col = mantissaIColumn(col)

            warn('use methanal.imethanal.IColumn instead of '
                 'xmantissa.ixmantissa.IColumn', DeprecationWarning, 2)
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
                return value.asDatetime(self.timezone).strftime(
                    '%a, %d %h %Y %H:%M:%S').decode('ascii')
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
    def __init__(self, store, filterAttrs, callback, resultColumns,
                 timezone=None, webTranslator=None, **kw):
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

        resultWidget = lambda rows: QueryList(rows=rows,
                                              columns=resultColumns,
                                              webTranslator=webTranslator,
                                              timezone=timezone)

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
        rollupFactory = self._getRollupFactory()
        rollupContent = invisible[
            rollupFactory.load(preprocessors=LiveElement.preprocessors)]
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



class Lookup(FormInput):
    fragmentName = 'methanal-lookup'
    jsClass = u'Methanal.Widgets.Lookup'


    def __init__(self, form, populator, describer, objects=None, **kw):
        if objects is None:
            objects = []

        super(Lookup, self).__init__(**kw)

        self.form = form
        self.form.setFragmentParent(self)
        self.populator = populator
        self.describer = describer
        self.objects = objects


    @expose
    def populate(self, *a):
        self.objects = list(self.populator(*a))
        return list(enumerate(self.describer(o) for o in self.objects))


    @renderer
    def filterForm(self, req, tag):
        return tag[self.form]



class SimpleLookup(Lookup):
    def __init__(self, store, filterAttrs, timezone=None, **kw):
        fact = lambda model: SimpleForm(store=store, model=model)
        form = containerFromAttributes(containerFactory=fact,
                                       store=store,
                                       attributes=filterAttrs,
                                       callback=None,
                                       doc=None,
                                       timezone=timezone)
        form.jsClass = u'Methanal.Widgets.SimpleLookupForm'

        super(SimpleLookup, self).__init__(form=form, **kw)

        form.model.params['__results'] = ValueParameter(name='__results',
                                                        doc=u'Result')

        values = [(o, self.describer(o)) for o in self.objects]
        ObjectSelectInput(parent=form, name='__results', values=values)



class ModalDialog(ThemedElement):
    """
    Modal dialog widget.

    @type title: C{unicode}
    @ivar title: Dialog title

    @type content: C{nevow.athena.LiveElement}
    @ivar content: Athena widget to serve as the content for the dialog
    """
    jsClass = u'Methanal.Widgets.ModalDialog'
    fragmentName = 'methanal-modal-dialog'


    def __init__(self, title, content, **kw):
        super(ModalDialog, self).__init__(**kw)
        self.title = title
        self.content = content


    @renderer
    def dialogTitle(self, req, tag):
        return tag[self.title]


    @renderer
    def dialogContent(self, req, tag):
        self.content.setFragmentParent(self)
        return tag[self.content]



class CancelAction(ActionButton):
    """
    Form action for dismissing a dialog.
    """
    jsClass = u'Methanal.Widgets.CancelAction'
    defaultName = u'Cancel'
    allowViewOnly = True



class ModalDialogForm(LiveForm):
    """
    L{methanal.view.LiveForm} for L{methanal.widgets.ModalDialog}.
    """
    jsClass = u'Methanal.Widgets.ModalDialogForm'


    def __init__(self, actions=None, **kw):
        if actions is None:
            actions = ActionContainer(
                actions=[SubmitAction(name=u'OK'), CancelAction()])
        super(ModalDialogForm, self).__init__(actions=actions, **kw)
