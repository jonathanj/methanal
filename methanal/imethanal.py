"""
Public interfaces used in Methanal.
"""
from zope.interface import Interface, Attribute



class IColumn(Interface):
    """
    Represents a column that can be viewed via a query list, and provides hints
    and metadata about the column.
    """
    attributeID = Attribute(
        """
        An ASCII-encoded C{str} uniquely describing this column.
        """)


    title = Attribute(
        """
        C{unicode} text for a human-readable column title.
        """)


    def extractValue(model, item):
        """
        Extract a value for the column from an Item.

        @type model: L{methanal.widgets.Table}

        @type  item: L{axiom.item.Item}
        @param item: Item from which to extract a value

        @return: Underlying value for this column
        """


    def extractLink(model, item):
        """
        Extract a URI for the column from an Item.

        @type model: L{methanal.widgets.Table}

        @type  item: L{axiom.item.Item}
        @param item: Item from which to extract a URI

        @rtype: C{unicode}
        @return: A URI somehow relevant for this column, or C{None}
        """


    def getType():
        """
        Get a name identifying the type of data this column contains.

        @rtype: C{str}
        """



class IEnumeration(Interface):
    """
    An enumeration.
    """
    def asPairs():
        """
        Represent the enumeration as a sequence of pairs.

        @rtype: C{list} of 2-C{tuple}s
        @return: A sequence of C{(value, description)}
        """
