from axiom.attributes import (boolean, integer, text, textlist, timestamp,
    reference, AbstractFixedPointDecimal)

from nevow.util import Expose

from methanal import errors


def propertyMaker(func):
    return property(*func())


constraint = Expose(
    """
    Register one or more functions as constraints for a particular form
    parameter.
    """)


class Value(object):
    """
    A simple value in a form model.

    @type name: C{str}
    @ivar name: The name of this parameter

    @ivar value: Initial value of this parameter

    @type doc: C{unicode}
    @ivar doc: A long description of this parameter
    """
    def __init__(self, name, value=None, doc=None, **kw):
        super(Value, self).__init__(**kw)
        self.name = name
        self.value = value
        if doc is None:
            doc = name.decode('ascii')
        self.doc = doc

    @classmethod
    def fromAttr(cls, attr, **kw):
        """
        Construct a parameter from an Axiom attribute.
        """
        kw.setdefault('name', attr.name)
        kw.setdefault('value', attr.default)
        kw.setdefault('doc', attr.doc or None)
        return cls(**kw)

    def validate(self, value):
        """
        Validate a value provided for this parameter against all constraints.

        If any constraints were violated a descriptive message is returned,
        otherwise C{None} is returned upon successful validation.
        """
        for constraintName in constraint.exposedMethodNames(self):
            result = constraint.get(self, constraintName)(value)
            if result is not None:
                return result

    def isValid(self, value):
        """
        Determine whether C{value} is valid data for this parameter.
        """
        return self.validate(value) is None

    def getValue(self):
        """
        Retrieve the value for this parameter.

        @raise errors.ConstraintError: If validation for this parameter's value
            failed
        """
        error = self.validate(self.value)
        if error:
            raise errors.ConstraintError(error)
        return self.value

# XXX: backwards compat, deprecate this
ValueParameter = Value


class ListParameter(ValueParameter):
    """
    A parameter consisting of multiple values.
    """
    @constraint
    def isIterable(self, value):
        """
        Enforce the iterable constraint.
        """
        try:
            iter(value)
        except TypeError:
            if value is not None:
                return u'Value is not an iterable'


class EnumerationParameter(ValueParameter):
    """
    An enumeration value in a form model.

    The value for this parameter must be chosen from a sequence of predefined
    possibilities.

    @ivar values: a sequence of values present in the enumeration
    """
    def __init__(self, values, **kw):
        super(EnumerationParameter, self).__init__(**kw)
        self.values = values

    @constraint
    def valueInEnumeration(self, value):
        """
        Enforce the enumeration constraint.
        """
        if value not in self.values:
            return u'Value not present in enumeration'


class MultiEnumerationParameter(EnumerationParameter):
    """
    A multi-value enumeration parameter.
    """
    @constraint
    def valueInEnumeration(self, value):
        """
        Enforce the enumeration constraint.
        """
        for v in value:
            if v not in self.values:
                return u'Value not present in enumeration'


class ReferenceParameter(ValueParameter):
    """
    XXX: hax :<

    Really, don't use this unless you know what you are doing.
    """
    def __init__(self, model, **kw):
        self.model = model
        super(ReferenceParameter, self).__init__(**kw)

    @propertyMaker
    def value():
        def get(self):
            return self.model.item
        def set(self, data):
            self.model.item = data
        return get, set

    def getValue(self):
        return self.model.process()


class Decimal(ValueParameter):
    """
    A decimal number parameter.
    """
    def __init__(self, decimalPlaces, **kw):
        super(Decimal, self).__init__(**kw)
        self.decimalPlaces = decimalPlaces

    @classmethod
    def fromAttr(cls, attr, **kw):
        kw.setdefault('decimalPlaces', attr.decimalPlaces)
        return super(Decimal, cls).fromAttr(attr, **kw)

DecimalParameter = Decimal


class StoreIDParameter(ValueParameter):
    """
    Reference by storeID.
    """
    def __init__(self, itemType, store, **kw):
        super(StoreIDParameter, self).__init__(**kw)
        self.itemType = itemType
        self.store = store


def mandatory(value):
    """
    An external constraint that prohibits a value of C{None}.
    """
    if value is None:
        return u'Value is mandatory'


class Model(object):
    """
    A Methanal form model.
    """
    def __init__(self, params, callback=lambda **d: d, doc=u''):
        """
        Initialise the model.

        @type params: C{iterable} of parameter instances
        @param params: Model parameters

        @type callback: C{callable} taking parameters named the same as the
            model parameters

        @type doc: C{unicode}
        @param doc: A description for the model's action
        """
        self.params = {}
        for param in params:
            self.params[param.name] = param

        self.callback = callback
        self.doc = doc

    def process(self):
        data = self.getData()
        value = self.callback(**data)
        return value

    def getData(self):
        data = {}
        for param in self.params.itervalues():
            data[param.name] = param.getValue()
        return data


_paramTypes = {
    integer: ValueParameter,
    text: ValueParameter,
    boolean: ValueParameter,
    textlist: ListParameter,
    timestamp: ValueParameter}

def paramFromAttribute(store, attr, value, name=None):
    doc = attr.doc or None

    if name is None:
        name = attr.attrname

    if isinstance(attr, reference):
        model = ItemModel(itemClass=attr.reftype, store=store)
        return ReferenceParameter(name=name,
                                  value=value,
                                  doc=doc,
                                  model=model)
    elif isinstance(attr, AbstractFixedPointDecimal):
        return DecimalParameter(name=name,
                                value=value,
                                doc=doc,
                                decimalPlaces=attr.decimalPlaces)
    else:
        factory = _paramTypes.get(type(attr))
        if factory:
            return factory(name=name,
                           value=value,
                           doc=doc)


def paramsFromSchema(store, itemClass, item=None, ignoredAttributes=set()):
    """
    Construct L{Model} parameters from an Axiom item schema.
    """
    for name, attr in itemClass.getSchema():
        if name in ignoredAttributes:
            continue

        if item is not None:
            value = getattr(item, name)
        else:
            value = attr.default

        yield paramFromAttribute(store, attr, value, name)


class ItemModel(Model):
    """
    A model automatically synthesized from an Item class or instance.
    """
    def __init__(self, item=None, itemClass=None, store=None, ignoredAttributes=set(), **kw):
        """
        Initialise model.

        Either C{item} or C{itemClass} must be specified, specifying only
        an item class will result in an item of that type being created
        when the model's callback is triggered.  This can be useful for
        providing a model for an item type that you wish to create but
        have no instance of yet.

        @type item: C{axiom.item.Item} or C{None}
        @param item: An Axiom item to synthesize a model for or C{None}

        @type itemClass: C{type} for an C{axiom.item.Item} or C{None}
        @param itemClass: An Axiom item type to synthesize a model and
            create an instance for, or C{None}

        @type store: C{axiom.store.Store}

        @type ignoredAttibutes: C{container}
        @param ignoredAttributes: Attribute names to ignore when synthesizing
            the model
        """
        if item is None:
            if itemClass is None:
                raise ValueError('You must pass in either item or itemClass')

            self.item = None
            self.itemClass = itemClass
        else:
            self.item = item

        self.itemClass = itemClass or type(item)
        self.store = store or item.store

        self.ignoredAttributes = ignoredAttributes
        params = paramsFromSchema(self.store, self.itemClass, self.item, self.ignoredAttributes)

        super(ItemModel, self).__init__(params=params, callback=self.storeData, doc=u'Save', **kw)

    def storeData(self, **data):
        """
        Model callback.

        Write model parameter values back to our item, creating a new one if
        no item instance was given.

        @rtype: C{axiom.item.Item}
        @return: The newly modified or created item
        """
        def _storeData():
            if self.item is None:
                self.item = self.itemClass(store=self.store, **data)
            else:
                for name, value in data.iteritems():
                    setattr(self.item, name, value)
            return self.item

        if self.store is not None:
            return self.store.transact(_storeData)
        else:
            return _storeData()


def modelFromItem(item, ignoredAttributes=set()):
    """
    Automatically synthesize a model from an Item instance.
    """
    return ItemModel(item=item, ignoredAttributes=ignoredAttributes)


def modelFromItemClass(itemClass, store=None, ignoredAttributes=set()):
    """
    Automatically synthesize a model from an Item class.
    """
    return ItemModel(itemClass=itemClass, store=store, ignoredAttributes=ignoredAttributes)
