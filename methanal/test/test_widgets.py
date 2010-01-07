from twisted.trial import unittest
from twisted.internet.defer import succeed

from methanal import widgets



class TabViewTests(unittest.TestCase):
    """
    Tests for L{methanal.widgets.TabView}.
    """
    def setUp(self):
        self.contentFactory = lambda: []
        self.tabs = [
            widgets.Tab(u'id1', u'Title 1', self.contentFactory),
            widgets.Tab(u'id2', u'Title 2', self.contentFactory),
            widgets.Tab(u'id3', u'Title 3', self.contentFactory)]
        self.tabView = widgets.TabView(self.tabs)


    def test_create(self):
        """
        Creating a L{TabView} widget initialises L{TabView._tabIDs} and
        L{TabView.tabs} with the values originally specified.
        """
        self.assertEquals(
            self.tabView._tabIDs,
            set([u'id1', u'id2', u'id3']))
        self.assertEquals(
            self.tabView.tabs,
            self.tabs)


    def test_appendDuplicateTab(self):
        """
        Appending a L{Tab} widget with an C{id} attribute that matches one
        already being managed raises C{ValueError}.
        """
        self.assertRaises(ValueError,
            self.tabView.appendTab, self.tabView.tabs[0])


    def test_appendTab(self):
        """
        Appending a tab on the server side manages the tab and invokes methods
        on the client side to insert the widget.
        """
        def callRemote(methodName, *a):
            return succeed(methodName == '_appendTabFromServer')

        def checkResult(result):
            self.assertTrue(result)
            self.assertIn(u'id4', self.tabView._tabIDs)
            self.assertIdentical(self.tabView.tabs[-1], tab)

        tab = widgets.Tab(u'id4', u'Title 4', self.contentFactory)
        self.patch(self.tabView, 'callRemote', callRemote)
        d = self.tabView.appendTab(tab)
        d.addCallback(checkResult)
        return d



class StaticTabTests(unittest.TestCase):
    def test_create(self):
        """
        Creating a L{StaticTab}, instance with the C{content} argument, wraps
        the content in a factory method. Passing a {contentFactory} argument
        works as intended.
        """
        content = u'A content.'
        tab = widgets.StaticTab(
            id=u'id',
            title=u'Title',
            content=content)
        self.assertEquals(tab.contentFactory(), content)

        tab = widgets.StaticTab(
            id=u'id',
            title=u'Title',
            contentFactory=lambda: content * 2)
        self.assertEquals(tab.contentFactory(), content * 2)
