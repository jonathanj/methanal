import time
from warnings import warn

from epsilon.extime import FixedOffset, Time

from xmantissa.ixmantissa import IColumn, IWebTranslator
from xmantissa.webtheme import ThemedElement

from methanal.util import getArgsDict


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
        columns = (IColumn(col) for col in columns)
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
        return {u'columnIDs': [cid for (cid, col) in self.columns],
                u'rows':      [self.dictifyItem(row, i)
                               for i, row in enumerate(self.rows)]}

    @expose
    def performAction(self, name, rowIndex):
        method = getattr(self, 'action_' + name)
        item = self.rows[rowIndex]
        return method(item)
