from twisted.trial import unittest

from methanal.imethanal import IEnumeration
# Adapter registration side-effect.
from methanal import view
# To quell Pyflakes' fears.
view



class EnumerationAdapterTests(unittest.TestCase):
    """
    Tests for L{IEnumeration} adapters.
    """
    def test_list(self):
        """
        Adapting a C{list} to L{IEnumeration} results in an L{Enum} accurately
        representing the list.
        """
        values = [
            (u'foo', u'Foo'),
            (u'bar', u'Bar')]
        enum = IEnumeration(values)
        self.assertEquals(enum.as_pairs(), values)
        for value, desc in values:
            item = enum.get(value)
            self.assertEquals(item.value, value)
            self.assertEquals(item.desc, desc)


    def test_groupList(self):
        """
        Adapting a C{list} of nested C{list}s, as used by
        L{methanal.view.GroupedSelectInput}, results in an L{Enum} with
        L{EnumItems} with a C{'group'} extra value the same as the first
        element in each C{tuple}. L{IEnumeration.as_pairs} returns a flat
        C{list} for nested C{list}s adapted to L{IEnumeration}.
        """
        values = [
            (u'Group', [
                (u'foo', u'Foo'),
                (u'bar', u'Bar')]),
            (u'Group 2', [
                (u'quux', u'Quux'),
                (u'frob', u'Frob')])]

        enum = IEnumeration(values)
        for groupName, innerValues in values:
            for value, desc in innerValues:
                item = enum.get(value)
                self.assertEquals(item.value, value)
                self.assertEquals(item.desc, desc)
                self.assertEquals(item.get('group'), groupName)

        pairs = sum(zip(*values)[1], [])
        self.assertEquals(enum.as_pairs(), pairs)


    def test_notAdapted(self):
        """
        Adapting C{tuple}, C{iter} or generator expression raises L{TypeError}.
        """
        values = (n for n in xrange(5))
        self.assertRaises(TypeError, IEnumeration, tuple(values))
        self.assertRaises(TypeError, IEnumeration, iter(values))
        self.assertRaises(TypeError, IEnumeration, values)
