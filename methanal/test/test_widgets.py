"""
Unit tests for L{methanal.widgets}.
"""
from twisted.trial import unittest
from twisted.internet.defer import succeed

from nevow import inevow

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


    def test_createGroup(self):
        """
        Creating a L{methanal.widgets.TabView} widget initialises
        L{methanal.widgets.TabView._tabIDs}, L{methanal.widgets.TabView.tabs}
        and L{methanal.widgets.TabView._tabGroups} with the values originally
        specified, tab groups are merged in and managed.
        """
        tabGroup = widgets.TabGroup(u'group1', u'Group', tabs=[
            widgets.Tab(u'id4', u'Title 4', self.contentFactory)])
        tabs = self.tabs + [
            tabGroup,
            widgets.Tab(u'id5', u'Title 5', self.contentFactory)]
        tabView = widgets.TabView(tabs)
        self.assertEquals(
            tabView._tabIDs,
            set([u'id1', u'id2', u'id3', u'id4', u'id5']))
        self.assertEquals(
            tabView._tabGroups,
            {u'group1': tabGroup})


    def test_appendDuplicateTab(self):
        """
        Appending a L{methanal.widgets.Tab} widget with an C{id} attribute that
        matches one already being managed raises C{ValueError}.
        """
        self.assertRaises(ValueError,
            self.tabView.appendTab, self.tabView.tabs[0])


    def test_appendTabs(self):
        """
        Appending tabs on the server side manages them and invokes methods
        on the client side to insert them.
        """
        self.result = None

        def callRemote(methodName, *a):
            self.result = methodName == '_appendTabsFromServer'

        tab = widgets.Tab(u'id4', u'Title 4', self.contentFactory)
        self.patch(self.tabView, 'callRemote', callRemote)
        self.tabView.appendTabs([tab])
        self.assertTrue(self.result)
        self.assertIn(u'id4', self.tabView._tabIDs)
        self.assertIdentical(self.tabView.tabs[-1], tab)


    def test_appendDuplicateGroup(self):
        """
        Appending a L{methanal.widgets.TabGroup} widget with an C{id} attribute
        that matches one already being managed raises C{ValueError}.
        """
        tabGroup = widgets.TabGroup(u'group1', u'Group', tabs=[
            widgets.Tab(u'id4', u'Title 4', self.contentFactory)])
        self.tabView._manageGroup(tabGroup)
        self.assertRaises(ValueError,
            self.tabView.appendGroup, tabGroup)


    def test_appendGroup(self):
        """
        Appending a group on the server site manages it, and all the tabs it
        contains, and invokes methods on the client side to insert them.
        """
        self.result = None

        def callRemote(methodName, *a):
            self.result = methodName == '_appendTabsFromServer'

        tab = widgets.Tab(u'id4', u'Title 4', self.contentFactory)
        group = widgets.TabGroup(u'group1', u'Group', tabs=[tab])
        self.patch(self.tabView, 'callRemote', callRemote)
        self.tabView.appendGroup(group)
        self.assertTrue(self.result)
        self.assertIn(u'id4', self.tabView._tabIDs)
        self.assertIn(u'group1', self.tabView._tabGroups)
        self.assertIdentical(self.tabView.tabs[-1], tab)



class StaticTabTests(unittest.TestCase):
    """
    Tests for L{methanal.widgets.StaticTab}.
    """
    def test_create(self):
        """
        Creating a L{methanal.widgets.StaticTab} instance, with the C{content}
        argument, wraps the content in a factory method. Passing a
        C{contentFactory} argument works as intended.
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



class TabGroupTests(unittest.TestCase):
    """
    Tests for L{methanal.widgets.TabGroup}.
    """
    def test_athenaSerializable(self):
        """
        Tab groups implement L{nevow.inevow.IAthenaTransportable}.
        """
        tabs = [
            widgets.Tab(u'id1', u'Title 1', None),
            widgets.Tab(u'id2', u'Title 2', None)]
        tabGroup = widgets.TabGroup(u'id', u'title', tabs=tabs)
        self.assertEquals(
            inevow.IAthenaTransportable(tabGroup).getInitialArguments(),
            [u'id', u'title', [u'id1', u'id2']])
