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


    def extractValue(model, item):
        """
        @type model: L{methanal.widgets.QueryList}

        @param item: L{axiom.item.Item} from which to extract column value

        @return: The underlying value for this column
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
