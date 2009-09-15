from twisted.trial import unittest

from methanal.imethanal import IEnumeration
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
