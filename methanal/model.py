from axiom.attributes import boolean, integer, text, textlist, timestamp, reference, AbstractFixedPointDecimal

from nevow.util import Expose

from methanal import errors


def propertyMaker(func):
    return property(*func())


constraint = Expose(
    """
    Register one or more functions as constraints for a particular form
    parameter.
    """)


class ValueParameter(object):
    """
    A simple value in a form model.

    @ivar name: the name of this parameter
    @ivar doc: a long description of this parameter
    """
    def __init__(self, name, value=None, doc=None, **kw):
        super(ValueParameter, self).__init__(**kw)
        self.name = name
        self.value = value
        if doc is None:
            doc = name.decode('ascii')
        self.doc = doc

    def validate(self, value):
        """
        Validate a value provided for this parameter against all constraints,
        returning a descriptive message if any constraints were violated, and
        C{None} if validation was successful.
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
        error = self.validate(self.value)
        if error:
            raise errors.ConstraintError(error)
        return self.value


class ListParameter(ValueParameter):
    """
    A parameter consisting of multiple values.
    """
    @constraint
    def isIterable(self, value):
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


class DecimalParameter(ValueParameter):
    """
    A decimal number parameter.
    """
    def __init__(self, decimalPlaces, **kw):
        super(DecimalParameter, self).__init__(**kw)
        self.decimalPlaces = decimalPlaces


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
    timestamp: ValueParameter,
}

def paramsFromSchema(store, itemClass, item=None, ignoredAttributes=set()):
    for name, attr in itemClass.getSchema():
        if name in ignoredAttributes:
            continue

        doc = attr.doc or None
        if item is not None:
            value = getattr(item, name)
        else:
            value = attr.default

        if isinstance(attr, reference):
            model = ItemModel(itemClass=attr.reftype, store=store)
            yield ReferenceParameter(name=name, value=value, model=model, doc=doc)
        elif isinstance(attr, AbstractFixedPointDecimal):
            yield DecimalParameter(decimalPlaces=attr.decimalPlaces, name=name, value=value, doc=doc)
        else:
            factory = _paramTypes.get(type(attr))
            if factory:
                yield factory(name=name, value=value, doc=doc)


class ItemModel(Model):
    """
    A model automatically synthesized from an Item class or instance.
    """
    def __init__(self, item=None, itemClass=None, store=None, ignoredAttributes=set(), **kw):
        if item is None:
            if itemClass is None:
                raise ValueError('You must pass in either item or itemClass')

            self.item = None
            self.itemClass = itemClass
            self.store = store
        else:
            self.item = item
            self.itemClass = type(item)
            self.store = item.store

            if itemClass is not None and itemClass is not self.itemClass:
                raise ValueError('Passed in item of type %r but itemClass of %r' % (self.itemClass, itemClass))

            if store is not None and store is not self.store:
                raise ValueError('Passed in item in store %r but store of %r' % (self.store, store))

        self.ignoredAttributes = ignoredAttributes
        params = paramsFromSchema(self.store, self.itemClass, self.item, self.ignoredAttributes)

        super(ItemModel, self).__init__(params=params, callback=self.storeData, doc=u'Save', **kw)

    def storeData(self, **data):
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
