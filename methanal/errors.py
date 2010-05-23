class ConstraintError(ValueError):
    """
    One or more constraints specified in the data model were unmet.
    """



class InvalidEnumItem(ValueError):
    """
    An invalid enumeration value was specified.
    """



class InvalidIdentifier(ValueError):
    """
    An invalid identifier was specified.
    """
