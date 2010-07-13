import textwrap
from zope.interface import implements

from twisted.python.versions import Version
from twisted.python.deprecate import deprecated

from methanal.errors import InvalidEnumItem
from methanal.imethanal import IEnumeration



@deprecated(Version('methanal', 0, 2, 1))
def ListEnumeration(theList):
    """
    An L{IEnumeration} adapter for the C{list} type.

    This is deprecated, use L{Enum.fromPairs} instead.
    """
    # If this isn't a grouped input, turn it into one with one unnamed group.
    if (theList and
        len(theList[0]) > 1 and
        not isinstance(theList[0][1], (tuple, list))):
        theList = [(None, theList)]

    items = []
    for groupName, values in theList:
        for value, desc in values:
            items.append(EnumItem(value, desc, group=groupName))

    return Enum('', items)



class Enum(object):
    """
    An enumeration.

    L{Enum} objects implement the iterator protocol.

    @ivar _order: A list of enumeration items, used to preserve the original
        order of the enumeration

    @ivar _values: A mapping of enumeration values to L{EnumItem}s
    """
    implements(IEnumeration)


    def __init__(self, doc, values):
        """
        Initialise an enumeration.

        @type values: C{iterable} of L{EnumItem}
        """
        self.doc = doc

        _order = self._order = []
        _values = self._values = {}
        for value in values:
            key = self._getValueMapping(value)
            if key in _values:
                raise ValueError(
                    '%r is already a value in the enumeration' % (key,))
            _order.append(value)
            _values[key] = value


    def __iter__(self):
        for item in self._order:
            if not item.hidden:
                yield item


    def __repr__(self):
        lines = textwrap.wrap(textwrap.dedent(self.doc.strip()))
        line = 'undocumented'
        if lines:
            line = lines[0]
            if len(lines) > 1:
                line += '...'
            line = '"""%s"""' % (line,)
        return '<%s %s>' % (
            type(self).__name__,
            line)


    def _getValueMapping(self, value):
        """
        Determine the key to use when constructing a mapping for C{value}.
        """
        return value.value


    @classmethod
    def fromPairs(cls, doc, pairs):
        """
        Construct an enumeration from an iterable of pairs.

        @param doc: A brief description of the enumeration's intent

        @param pairs: C{iterable} of C{(value, description)} pairs

        @rtype: L{Enum}
        """
        values = (EnumItem(value, desc) for value, desc in pairs)
        return cls(doc=doc, values=values)


    # IEnumeration

    def get(self, value):
        item = self._values.get(value)
        if item is None:
            raise InvalidEnumItem(value)
        return item


    def getDesc(self, value):
        try:
            return self.get(value).desc
        except InvalidEnumItem:
            return u''


    def getExtra(self, value, extraName, default=None):
        try:
            return self.get(value).get(extraName, default)
        except InvalidEnumItem:
            return default


    def find(self, **names):
        for res in self.findAll(**names):
            return res
        return None


    def findAll(self, **names):
        values = names.items()
        if len(values) != 1:
            raise ValueError('Only one query is allowed at a time')

        name, value = values[0]
        for item in self:
            if item.get(name) == value:
                yield item


    def asPairs(self):
        return [(i.value, i.desc) for i in self]



class ObjectEnum(Enum):
    """
    An enumeration for arbitrary Python objects.

    Pass the Python object as the C{value} parameter to L{EnumItem}.
    C{ObjectEnum} will automatically create an C{'id'} extra value for
    L{EnumItem}s that do not already have such a value.
    """
    def _getValueMapping(self, value):
        key = unicode(id(value.value))
        if value.get('id') is None:
            value._extra['id'] = key
        return key


    def get(self, value):
        value = unicode(id(value))
        return super(ObjectEnum, self).get(value)


    # IEnumeration

    def asPairs(self):
        return [(i.id, i.desc)
                for i in self]



class EnumItem(object):
    """
    An enumeration item contained by L{Enum}.

    @ivar value: The enumeration item's enumeration value

    @ivar desc: A brief-textual description of the enumeration item

    @type hidden: C{bool}
    @ivar hidden: Is this enumeration item hidden?

    @type _extra: C{dict} mapping C{str} to values
    @ivar _extra: Mapping of names to values, accessed via L{EnumItem.get}
    """
    def __init__(self, value, desc, hidden=False, **extra):
        """
        Initialise an enumeration item.

        @param **extra: Additional extra values, accessed via L{EnumItem.get}
        """
        self.value = value
        self.desc = desc
        self.hidden = hidden
        self._extra = extra


    def __repr__(self):
        return '<%s value=%r desc=%r hidden=%r>' % (
            type(self).__name__,
            self.value,
            self.desc,
            self.hidden)


    def __getattr__(self, name):
        """
        Get an extra value by name.
        """
        if name in self._extra:
            return self.get(name)
        raise AttributeError(
            '%r object has no attribute %r' % (type(self).__name__, name))


    def get(self, name, default=None):
        """
        Get the value of an extra parameter.
        """
        return self._extra.get(name, default)
