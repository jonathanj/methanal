from twisted.trial import unittest

from methanal.imethanal import IEnumeration
from methanal import enums, errors
# Adapter registration side-effect.
from methanal import view



class EnumerationAdapterTests(unittest.TestCase):
    """
    Tests for L{IEnumeration} adapters.
    """
    def test_list(self):
        """
        Adapting a C{list} to L{IEnumeration} results in an identical list.
        """
        values = [
            (u'foo', u'Foo'),
            (u'bar', u'Bar')]
        self.assertEquals(IEnumeration(values).asPairs(), values)


    def test_groupList(self):
        """
        Adapting a C{list} of nested C{list}s, as used by
        L{methanal.view.GroupedSelectInput}, results in an identical list.
        """
        values = [
            (u'Group', [
                (u'foo', u'Foo'),
                (u'bar', u'Bar')]),
            (u'Group', [
                (u'quux', u'Quux'),
                (u'frob', u'Frob')])]

        pairs = IEnumeration(values).asPairs()
        for i, (groupName, innerValues) in enumerate(pairs):
            self.assertEquals(groupName, u'Group')
            self.assertEquals(pairs[i][1], innerValues)


    def test_notAdapted(self):
        """
        Adapting C{tuple}, C{iter} or generator expression raises L{TypeError}.
        """
        values = (n for n in xrange(5))
        self.assertRaises(TypeError, IEnumeration, tuple(values))
        self.assertRaises(TypeError, IEnumeration, iter(values))
        self.assertRaises(TypeError, IEnumeration, values)



class EnumTests(unittest.TestCase):
    """
    Tests for L{methanal.enums.Enum}.
    """
    def setUp(self):
        self.values = [
            enums.EnumItem(u'foo', u'Foo', quux=u'hello', frob=u'world'),
            enums.EnumItem(u'bar', u'Bar', quux=u'goodbye'),
            enums.EnumItem(u'doh', u'Doh', frob=u'world')]
        self.enum = enums.Enum('Doc', self.values)


    def test_duplicateValues(self):
        """
        Constructing an enumeration with duplicate values results in
        C{ValueError} being raised.
        """
        values = [
            enums.EnumItem(u'foo', u'Foo'),
            enums.EnumItem(u'bar', u'Bar'),
            enums.EnumItem(u'foo', u'Not Foo', quux=u'frob')]
        self.assertRaises(ValueError, enums.Enum, 'Doc', values)

        pairs = [(e.value, e.desc) for e in values]
        self.assertRaises(ValueError, enums.Enum.fromPairs, 'Doc', pairs)


    def test_fromPairs(self):
        """
        Construct an enumeration from an iterable of pairs.
        """
        pairs = [
            (u'foo', u'Foo'),
            (u'bar', u'Bar')]
        enum = enums.Enum.fromPairs('Doc', pairs)
        self.assertEquals(enum.doc, 'Doc')
        self.assertEquals(enum.asPairs(), pairs)


    def test_asPairs(self):
        """
        Representing an enumeration as a list of pairs.
        """
        pairs = [(e.value, e.desc) for e in self.values]
        self.assertEquals(self.enum.asPairs(), pairs)


    def test_get(self):
        """
        Getting an enumeration item by value returns the relevant
        L{methanal.enums.EnumItem} instance or raises L{InvalidEnumItem} in the
        case where no item is represented by the given value.
        """
        for e in self.values:
            self.assertEquals(self.enum.get(e.value), e)
        self.assertRaises(errors.InvalidEnumItem,
                          self.enum.get, u'DOESNOTEXIST')


    def test_getDesc(self):
        """
        Getting an enumeration item's description by value returns the
        description or an empty C{unicode} string if no item is represented
        by the given value.
        """
        for e in self.values:
            self.assertEquals(self.enum.getDesc(e.value), e.desc)
        self.assertEquals(self.enum.getDesc(u'DOESNOTEXIST'), u'')


    def test_getExtra(self):
        """
        Getting an enumeration item extra value by enumeration value returns
        the extra's value or a default value, defaulting to C{None}.
        """
        self.assertEquals(self.enum.getExtra(u'foo', 'quux'), u'hello')
        self.assertEquals(self.enum.getExtra(u'foo', 'frob'), u'world')
        self.assertEquals(self.enum.getExtra(u'bar', 'quux'), u'goodbye')

        self.assertEquals(self.enum.getExtra(u'bar', 'nope'), None)
        self.assertEquals(self.enum.getExtra(u'bar', 'nope', u''), u'')


    def test_extra(self):
        """
        Extra parameters are retrieved by L{methanal.enums.EnumItem.get} if they
        exist otherwise a default value is returned instead. Extra parameters
        can also be accessed via attribute access but C{AttributeError} is
        raised if no such extra parameter exists.
        """
        self.assertEquals(self.enum.get(u'foo').get('quux'), u'hello')
        self.assertEquals(self.enum.get(u'foo').get('frob'), u'world')
        self.assertEquals(self.enum.get(u'bar').get('quux'), u'goodbye')

        self.assertEquals(self.enum.get(u'bar').get('boop'), None)
        self.assertEquals(self.enum.get(u'bar').get('beep', 42), 42)

        self.assertEquals(self.enum.get(u'foo').quux, u'hello')
        self.assertEquals(self.enum.get(u'foo').frob, u'world')
        self.assertEquals(self.enum.get(u'bar').quux, u'goodbye')

        e = self.assertRaises(AttributeError,
                              getattr, self.enum.get(u'bar'), 'boop')
        self.assertIn('boop', str(e))
        e = self.assertRaises(AttributeError,
                          getattr, self.enum.get(u'bar'), 'beep')
        self.assertIn('beep', str(e))


    def test_hidden(self):
        """
        Enumeration items that have their C{hidden} flag set are not listed in
        the result of L{methanal.eums.Enum.asPairs}.
        """
        values = [
            enums.EnumItem(u'foo', u'Foo', hidden=True),
            enums.EnumItem(u'bar', u'Bar'),
            enums.EnumItem(u'pop', u'Pop')]
        enum = enums.Enum('Doc', values)
        enum.get(u'pop').hidden = True

        pairs = enum.asPairs()
        self.assertEquals(pairs, [(u'bar', u'Bar')])


    def test_find(self):
        """
        Finding an enumeration item by extra value gets the first matching item
        or C{None} if there are no matches. Passing fewer or more than one
        query raises C{ValueError}.
        """
        self.assertEquals(self.enum.find(quux=u'hello'), self.values[0])
        self.assertEquals(self.enum.find(frob=u'world'), self.values[0])
        self.assertEquals(self.enum.find(quux=u'goodbye'), self.values[1])

        self.assertEquals(self.enum.find(haha=u'nothanks'), None)
        self.assertRaises(ValueError, self.enum.find)
        self.assertRaises(ValueError, self.enum.find, foo=u'foo', bar=u'bar')


    def test_findAll(self):
        """
        Finding all enumeration items by extra value gets an iterable of all
        matching items. Passing fewer or more than one
        query raises C{ValueError}.
        """
        results = list(self.enum.findAll(frob=u'world'))
        self.assertEquals(len(results), 2)
        for res in results:
            self.assertIn(res, self.values)

        self.assertEquals(list(self.enum.findAll(asdf=u'qwer')), [])

        # Consume the generators to trigger the exception.
        self.assertRaises(ValueError, list, self.enum.findAll())
        self.assertRaises(ValueError, list, self.enum.findAll(foo=u'foo',
                                                              bar=u'bar'))
