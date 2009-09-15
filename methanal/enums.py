from zope.interface import implements

from methanal.imethanal import IEnumeration



class ListEnumeration(object):
    """
    An L{IEnumeration} implementation for the C{list} type.
    """
    implements(IEnumeration)


    def __init__(self, theList):
        self.theList = theList


    # IEnumeration

    def asPairs(self):
        return self.theList
