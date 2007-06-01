from decimal import Decimal

from epsilon.extime import Time

from nevow.page import renderer
from nevow.athena import expose

from xmantissa.ixmantissa import IWebTranslator
from xmantissa.webtheme import ThemedElement

from methanal.model import ItemModel
from methanal.util import getArgsDict

class LiveForm(ThemedElement):
    """
    A form view implemented as an Athena widget.
    """
    fragmentName = 'methanal-liveform'
    jsClass = u'Methanal.View.LiveForm'

    def __init__(self, store, model, viewOnly=False, **kw):
        super(LiveForm, self).__init__(**kw)
        self.store = store
        self.model = model
        self.viewOnly = viewOnly
        self.formChildren = []

    def getInitialArguments(self):
        return [self.viewOnly,
                dict.fromkeys((c.name for c in self.getAllControls()), 1)]

    def addFormChild(self, child):
        self.formChildren.append(child)

    def getParameter(self, name):
        return self.model.params[name]

    def getAllControls(self):
        def _getChildren(container, form):
            for child in container.formChildren:
                if hasattr(child, 'formChildren'):
                    if child.model is form.model:
                        for child in _getChildren(child, form):
                            yield child
                else:
                    yield child

        return _getChildren(self, self)

    @renderer
    def controls(self, req, tag):
        return self.formChildren

    @renderer
    def button(self, req, tag):
        if self.viewOnly:
            return []
        return tag[self.model.doc]

    @expose
    def invoke(self, data):
        if self.viewOnly:
            raise RuntimeError('Attempted to submit view-only form')

        for child in self.formChildren:
            child.invoke(data)
        return self.model.process()

class InputContainer(ThemedElement):
    jsClass = u'Methanal.View.InputContainer'

    def __init__(self, parent, doc=u'', **kw):
        super(InputContainer, self).__init__(**kw)
        parent.addFormChild(self)
        self.setFragmentParent(parent)
        self.parent = parent
        self.doc = doc
        self.model = self.parent.model
        self.formChildren = []

    @property
    def store(self):
        return self.parent.store

    def addFormChild(self, child):
        self.formChildren.append(child)

    def getParameter(self, name):
        return self.parent.getParameter(name)

    @renderer
    def caption(self, req, tag):
        return tag[self.doc]

    @renderer
    def children(self, req, tag):
        return self.formChildren

    def invoke(self, data):
        for child in self.formChildren:
            child.invoke(data)

class FormGroup(InputContainer):
    """
    Container for grouping controls.
    """
    fragmentName = 'methanal-group'

class FormRow(InputContainer):
    """
    Container for organising form inputs in rows.
    """
    fragmentName = 'methanal-form-row'
    jsClass = u'Methanal.View.FormRow'

class GroupInput(FormGroup):
    """
    Container for grouping controls belonging to a ReferenceParameter submodel.

    XXX: This API should be considered extremely unstable.
    """
    jsClass = u'Methanal.View.GroupInput'

    def __init__(self, parent, name, **kw):
        self.param = parent.getParameter(name)
        super(GroupInput, self).__init__(parent=parent, doc=self.param.doc)
        self.model = self.param.model
        self.name = name

    def getInitialArguments(self):
        return [self.param.name.decode('ascii'),
                dict.fromkeys((unicode(n, 'ascii') for n in self.model.params), 1)]

    def getParameter(self, name):
        return self.model.params[name]

    def invoke(self, data):
        ourData = data[self.name]
        for child in self.formChildren:
            child.invoke(ourData)

class FormInput(ThemedElement):
    """
    Abstract form widget class.
    """
    def __init__(self, parent, name, label=None, **kw):
        super(FormInput, self).__init__(**kw)
        self.parent = parent
        self.name = unicode(name, 'ascii')
        self.param = parent.getParameter(name)
        if label is None:
            label = self.param.doc
        self.label = label

        if not isinstance(parent, FormRow):
            container = FormRow(parent=parent, doc=self.param.doc)
            container.addFormChild(self)
            self.setFragmentParent(container)
        else:
            parent.addFormChild(self)
            self.setFragmentParent(parent)

    @property
    def store(self):
        return self.parent.store

    def getInitialArguments(self):
        return [getArgsDict(self)]

    def getArgs(self):
        return {u'name': self.name, u'value': self.getValue(), u'label': self.label}

    def coerce(self, value):
        return value

    @renderer
    def value(self, req, tag):
        return tag[self.getValue()]

    def invoke(self, data):
        value = data[self.param.name]
        self.param.value = value

    def getValue(self):
        return self.param.value

class TextAreaInput(FormInput):
    """
    Form widget for entering large amounts of text.
    """
    fragmentName = 'methanal-text-area-input'
    jsClass = u'Methanal.View.TextAreaInput'

class TextInput(FormInput):
    """
    Form widget for entering text.
    """
    fragmentName = 'methanal-text-input'
    jsClass = u'Methanal.View.TextInput'

    def __init__(self, embeddedLabel=False, **kw):
        super(TextInput, self).__init__(**kw)
        self.embeddedLabel = embeddedLabel

    def getArgs(self):
        return {u'embeddedLabel': self.embeddedLabel}

class DateInput(TextInput):
    """
    Form widget for entering dates.
    """
    fragmentName = 'methanal-date-input'
    jsClass = u'Methanal.View.DateInput'

    def __init__(self, timezone, **kw):
        super(DateInput, self).__init__(**kw)
        self.timezone = timezone

    def getValue(self):
        value = self.param.value
        if value is None:
            return u''

        dt = value.asDatetime(self.timezone)
        return '%04d-%02d-%02d' % (dt.year, dt.month, dt.day)

    def invoke(self, data):
        value = data[self.param.name]
        if value is not None:
            value = Time.fromPOSIXTimestamp(value / 1000)
        self.param.value = value

class DecimalInput(TextInput):
    """
    Form widget for entering decimals.
    """
    fragmentName = 'methanal-decimal-input'
    jsClass = u'Methanal.View.DecimalInput'

    def __init__(self, decimalPlaces=None, showRepr=True, minValue=None, maxValue=None, **kw):
        super(DecimalInput, self).__init__(**kw)
        if decimalPlaces is None:
            decimalPlaces = self.param.decimalPlaces
        self.decimalPlaces = decimalPlaces
        self.showRepr = showRepr
        self.minValue = minValue
        self.maxValue = maxValue

    def getArgs(self):
        def _floatOrNone(value):
            if value is not None:
                return float(value)
            return None

        return {u'decimalPlaces': self.decimalPlaces,
                u'showRepr': self.showRepr,
                u'minValue': _floatOrNone(self.minValue),
                u'maxValue': _floatOrNone(self.maxValue)}

    def getValue(self):
        value = self.param.value
        if value is None:
            return u''

        return float(value)

    def invoke(self, data):
        value = data[self.param.name]
        if value is None:
            self.param.value = None
        else:
            self.param.value = Decimal(str(value))

class IntegerInput(DecimalInput):
    """
    Form widget for entering integers.
    """
    jsClass = u'Methanal.View.IntegerInput'

    def __init__(self, **kw):
        super(IntegerInput, self).__init__(decimalPlaces=0, showRepr=False, **kw)

    def getValue(self):
        value = self.param.value
        if value is None:
            return u''

        return int(value)

    def invoke(self, data):
        value = data[self.param.name]
        self.param.value = value

class ChoiceInput(FormInput):
    """
    Abstract form widget with multiple options.
    """
    def __init__(self, values, **kw):
        super(ChoiceInput, self).__init__(**kw)
        self.values = values

    @renderer
    def options(self, req, tag):
        option = tag.patternGenerator('option')
        for value, description in self.values:
            o = option()
            o.fillSlots('value', value)
            o.fillSlots('description', description)
            yield o

class MultiCheckboxInput(ChoiceInput):
    """
    Form widget with multiple checkbox selections.
    """
    fragmentName = 'methanal-multicheck-input'
    jsClass = u'Methanal.View.MultiCheckboxInput'

class SelectInput(ChoiceInput):
    """
    Form widget with a dropdown box.
    """
    fragmentName = 'methanal-select-input'
    jsClass = u'Methanal.View.SelectInput'


class MultiSelectInput(ChoiceInput):
    """
    Form widget with a list box that accepts multiple selections.
    """
    fragmentName = 'methanal-multiselect-input'
    jsClass = u'Methanal.View.MultiSelectInput'


class GroupedSelectInput(ChoiceInput):
    """
    Form widget with a dropdown box, where the entries are grouped together as follows::

        (u'Group name',    [(u'value', u'Description),
                            ...]),
         ...)
    """
    fragmentName = 'methanal-select-input'
    jsClass = u'Methanal.View.GroupedSelectInput'

    @renderer
    def options(self, req, tag):
        option = tag.patternGenerator('option')
        optgroup = tag.patternGenerator('optgroup')

        for groupName, values in self.values:
            g = optgroup().fillSlots('label', groupName)
            for value, description in values:
                o = option()
                o.fillSlots('value', value)
                o.fillSlots('description', description)
                g[o]
            yield g

class CheckboxInput(FormInput):
    """
    Form widget with a single checkbox.
    """
    fragmentName = 'methanal-check-input'
    jsClass = u'Methanal.View.CheckboxInput'

    @renderer
    def value(self, req, tag):
        if self.param.value:
            tag(checked="checked")
        return tag

class ItemView(LiveForm):
    """
    A view for an Item that automatically synthesizes a model; in the case of a
    specific Item instance, for editing it, and in the case of an Item
    subclass, for creating a new instance.
    """
    def __init__(self, item=None, itemClass=None, store=None, switchInPlace=False, ignoredAttributes=set(), **kw):
        self.item = item

        if item is not None:
            self.itemClass = itemClass or type(item)
            self.store = store or item.store
            self.original = item
        elif itemClass is not None:
            self.itemClass = itemClass
            self.store = store
            self.original = itemClass
        else:
            raise ValueError('You must pass either item or itemClass')

        self.model = ItemModel(item=self.item, itemClass=self.itemClass, store=self.store, ignoredAttributes=ignoredAttributes)

        super(ItemView, self).__init__(store=self.store, model=self.model, **kw)

        self.switchInPlace = switchInPlace

    @expose
    def invoke(self, *a, **kw):
        item = super(ItemView, self).invoke(*a, **kw)
        if self.item is None and item is not None:
            if self.switchInPlace:
                self.item = item
                self.createItem(item)
            else:
                return IWebTranslator(item.store).linkTo(item.storeID).decode('ascii')

    def createItem(self, item):
        """
        A callback that is invoked when an item is created and the form is
        switched in place to editing mode.
        """

class ReferenceItemView(ItemView):
    """
    I am an ItemView associated with a reference attribute on another
    attribute; I can switch from creating a new item to editing the created
    item in-place, and also delete the item to switch back to creation mode,
    all the while maintaining the reference link.
    """
    def __init__(self, parentItem, refAttr, **kw):
        value = refAttr.__get__(parentItem, type(parentItem))
        super(ReferenceItemView, self).__init__(
            item=value,
            itemClass=refAttr.reftype,
            store=parentItem.store,
            switchInPlace=True,
            **kw)

        self.parentItem = parentItem
        self.refAttr = refAttr

    def createItem(self, item):
        super(ReferenceItemView, self).createItem(item)
        self.refAttr.__set__(self.parentItem, item)
