import time
from warnings import warn

from zope.interface import implements

from epsilon.extime import FixedOffset, Time

from twisted.python.components import registerAdapter

from axiom.item import SQLAttribute

from nevow.athena import expose

from xmantissa.ixmantissa import IWebTranslator, IColumn as mantissaIColumn
from xmantissa.webtheme import ThemedElement

from methanal.imethanal import IColumn
from methanal.util import getArgsDict


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
        return {u'columnIDs':     [cid for cid, col in self.columns],
                u'columnAliases': dict((cid, col.attribute.doc or None)
                                       for cid, col in self.columns),
                u'rows':          [self.dictifyItem(row, i)
                                   for i, row in enumerate(self.rows)]}

    @expose
    def performAction(self, name, rowIndex):
        method = getattr(self, 'action_' + name)
        item = self.rows[rowIndex]
        return method(item)
