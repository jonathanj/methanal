from datetime import datetime

from twisted.trial import unittest

from epsilon.extime import FixedOffset, Time

from methanal.imethanal import IEnumeration
from methanal.model import Value
from methanal import view



class MockParent(object):
    def __init__(self, param):
        self.store = None
        self.param = param

        self.page = self
        self.liveFragmentChildren = []

        self.model = self


    def getParameter(self, name):
        return self.param


    def addFormChild(self, child):
        pass



class DateInputTests(unittest.TestCase):
    def setUp(self):
        self.param = Value('test')
        self.control = view.DateInput(
            parent=MockParent(self.param),
            name='test',
            timezone=FixedOffset(0, 0))


    def test_getValue(self):
        self.param.value = Time.fromDatetime(datetime(2007, 1, 1))
        self.assertTrue(isinstance(self.control.getValue(), unicode))
        self.assertEqual(self.control.getValue(), u'2007-01-01')

        self.param.value = Time.fromDatetime(datetime(542, 12, 18))
        self.assertEqual(self.control.getValue(), u'0542-12-18')



class ChoiceInputTests(unittest.TestCase):
    def setUp(self):
        self.param = Value('test')


    def _createChoice(self, values):
        """
        Create a L{methanal.view.ChoiceInput} from C{values}, assert that
        L{methanal.view.ChoiceInput.value} provides L{IEnumeration} and
        calling C{asPairs} results in the same values as C{values}.
        """
        control = view.ChoiceInput(
            parent=MockParent(self.param),
            name=self.param.name,
            values=values)
        self.assertTrue(IEnumeration.providedBy(control.values))
        self.assertEquals(control.values.asPairs(), list(values))
        return control


    def test_create(self):
        """
        Create a L{methanal.view.ChoiceInput} by adapting values to
        L{IEnumeration}.
        """
        values = [
            (u'foo', u'Foo'),
            (u'bar', u'Bar')]
        self._createChoice(values)


    def test_createDeprecated(self):
        """
        Passing values that are not adaptable to IEnumeration are converted
        to a C{list}, adapted to L{IEnumeration} and a warning is emitted.
        """
        # Not a list.
        values = tuple([
            (u'foo', u'Foo'),
            (u'bar', u'Bar')])
        self._createChoice(values)
        self.assertEquals(len(self.flushWarnings()), 1)
