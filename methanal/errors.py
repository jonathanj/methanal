from fusion_util.errors import InvalidEnumItem



class ConstraintError(ValueError):
    """
    One or more constraints specified in the data model were unmet.
    """



class InvalidIdentifier(ValueError):
    """
    An invalid identifier was specified.
    """



__all__ = ['InvalidEnumItem', 'ConstraintError', 'InvalidIdentifier']
