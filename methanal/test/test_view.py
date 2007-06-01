from datetime import datetime

from twisted.trial.unittest import TestCase

from epsilon.extime import FixedOffset, Time

from methanal.model import ValueParameter, Model
from methanal.view import DateInput

class MockParent(object):
    def __init__(self, param):
        self.param = param

        self.page = self
        self.liveFragmentChildren = []

        self.model = self

    def getParameter(self, name):
        return self.param

    def addFormChild(self, child):
        pass

class TestDateInput(TestCase):
    def setUp(self):
        self.param = ValueParameter('test')
        self.control = DateInput(parent=MockParent(self.param), name='test', timezone=FixedOffset(0, 0))

    def test_getValue(self):
        self.param.value = Time.fromDatetime(datetime(2007, 1, 1))
        self.assertTrue(isinstance(self.control.getValue(), unicode))
        self.assertEqual(self.control.getValue(), u'2007-01-01')

        self.param.value = Time.fromDatetime(datetime(542, 12, 18))
        self.assertEqual(self.control.getValue(), u'0542-12-18')
