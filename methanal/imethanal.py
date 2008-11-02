"""
Public interfaces used in Methanal.
"""
from zope.interface import Interface, Attribute

class IColumn(Interface):
    """
    Represents a column that can be viewed via a query list, and provides hints
    & metadata about the column.
    """
    attributeID = Attribute(
        """
        An ASCII-encoded str object uniquely describing this column.
        """)

    def extractValue(model, item):
        """
        @type model: L{methanal.widgets.QueryList}
        @param item: the L{axiom.item.Item} from which to extract column value

        @return: the underlying value for this column
        """
