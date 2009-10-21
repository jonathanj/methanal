from warnings import warn

from decimal import Decimal

from epsilon.extime import Time

from twisted.python.components import registerAdapter

from axiom.attributes import text, integer, timestamp

from nevow.page import renderer
from nevow.athena import expose

from xmantissa.ixmantissa import IWebTranslator
from xmantissa.webtheme import ThemedElement

from methanal.imethanal import IEnumeration
from methanal.model import ItemModel, Model, paramFromAttribute
from methanal.util import getArgsDict
from methanal.enums import ListEnumeration



class FormAction(ThemedElement):
    """
    L{LiveForm} action.

    @type defaultName: C{unicode}
    @cvar defaultName: Default name for the action

    @type allowViewOnly: C{bool}
    @cvar allowViewOnly: Allow this action to be present in a "view only" form

    @type name: C{unicode}
    @ivar name: Action name

    @type id: C{unicode}
    @ivar id: Action identifier
    """
    defaultName = None
    allowViewOnly = False


    def __init__(self, name=None, **kw):
        super(FormAction, self).__init__(**kw)
        if not name:
            name = self.defaultName
        self.name = name
        self.id = unicode(id(self))


    def getInitialArguments(self):
        return [getArgsDict(self)]


    def getArgs(self):
        return {u'actionID': self.id}



class ActionButton(FormAction):
    """
    L{LiveForm} action represented by a push button.

    @type button: C{str}
    @cvar button: Button type, should correspond with values for the C{button}
        element in HTML forms
    """
    fragmentName = 'methanal-action-button'
    type = 'button'


    @renderer
    def button(self, req, tag):
        return tag(type=self.type)[self.name]



class SubmitAction(ActionButton):
    """
    L{LiveForm} action for submitting a form.
    """
    jsClass = u'Methanal.View.SubmitAction'
    defaultName = u'Submit'



class ResetAction(ActionButton):
    """
    L{LiveForm} action for resetting a form's controls.
    """
    jsClass = u'Methanal.View.ResetAction'
    defaultName = u'Reset'
    type = 'reset'



class ActionContainer(ThemedElement):
    """
    Container for L{FormAction}s.

    @type actions: C{list} of L{FormAction}
    """
    fragmentName = 'methanal-action-container'
    jsClass = u'Methanal.View.ActionContainer'


    def __init__(self, actions, **kw):
        super(ActionContainer, self).__init__(**kw)
        self.actions = []
        for action in actions:
            self.addAction(action)


    def getInitialArguments(self):
        return [getArgsDict(self)]


    def getArgs(self):
        actionIDs = dict.fromkeys(action.id for action in self.actions)
        return {u'actionIDs': actionIDs}


    def addAction(self, action):
        """
        Add an action to the form.

        @type action: L{FormAction}
        """
        self.actions.append(action)


    @renderer
    def formActions(self, req, tag):
        form = self.fragmentParent
        for action in self.actions:
            if not form.viewOnly or action.allowViewOnly:
                action.setFragmentParent(self)
                yield action



class SimpleForm(ThemedElement):
    """
    A simple form.

    Simple forms do not contain any submission mechanism.

    @type store: L{axiom.store.Store}
    @ivar store: Backing Axiom store

    @type model: L{Model}
    @ivar model: Model supporting the form inputs
    """
    fragmentName = 'methanal-simple-form'
    jsClass = u'Methanal.View.SimpleForm'


    def __init__(self, store, model, **kw):
        """
        Initialise the form.
        """
        super(SimpleForm, self).__init__(**kw)
        self.store = store
        self.model = model
        self.formChildren = []


    def getInitialArguments(self):
        keys = (c.name for c in self.getAllControls())
        return [dict.fromkeys(keys, 1)]


    def getAllControls(self):
        """
        Get all of the form's child inputs recursively.
        """
        def _getChildren(container, form):
            for child in container.formChildren:
                if hasattr(child, 'formChildren'):
                    if child.model is form.model:
                        for child in _getChildren(child, form):
                            yield child
                else:
                    yield child

        return _getChildren(self, self)


    def addFormChild(self, child):
        """
        Add a new child to the form.

        @param child: Input to add as a child of the form
        """
        self.formChildren.append(child)


    def getParameter(self, name):
        """
        Get a model parameter by name.

        @type name: C{str}
        @param name: Model parameter name

        @rtype: C{methanal.model.Value}
        @return: Named model parameter
        """
        return self.model.params[name]


    @renderer
    def children(self, req, tag):
        """
        Render the child inputs.
        """
        return self.formChildren



class LiveForm(SimpleForm):
    """
    A form view implemented as an Athena widget.

    @type viewOnly: C{bool}
    @ivar viewOnly: Flag indicating whether model values are written back when
        invoked

    @type actions: L{ActionContainer}
    """
    fragmentName = 'methanal-liveform'
    jsClass = u'Methanal.View.LiveForm'


    def __init__(self, store, model, viewOnly=False, actions=None, **kw):
        super(LiveForm, self).__init__(store=store, model=model, **kw)
        if self.model.doc is None:
            viewOnly = True
        self.viewOnly = viewOnly

        if actions is None:
            actions = ActionContainer(
                actions=[SubmitAction(name=self.model.doc)])
        self.actions = actions


    def getInitialArguments(self):
        args = super(LiveForm, self).getInitialArguments()
        return [self.viewOnly] + args


    @renderer
    def formActions(self, req, tag):
        self.actions.setFragmentParent(self)
        return tag[self.actions]


    @expose
    def invoke(self, data):
        """
        Process form data for each child input.

        The callback for L{self.model} is invoked once all the child inputs
        have been invoked.

        @type data: C{dict}
        @param data: Form data

        @raise RuntimeError: If L{self.viewOnly} is C{True}

        @return: The result of the model's callback function.
        """
        if self.viewOnly:
            raise RuntimeError('Attempted to submit view-only form')

        for child in self.formChildren:
            child.invoke(data)
        return self.model.process()



class InputContainer(ThemedElement):
    """
    Generic container for form inputs.
    """
    jsClass = u'Methanal.View.InputContainer'


    def __init__(self, parent, doc=u'', **kw):
        """
        Initialise the container.

        @param parent: Parent input

        @type doc: C{unicode}
        @param doc: Input caption
        """
        super(InputContainer, self).__init__(**kw)
        parent.addFormChild(self)
        self.setFragmentParent(parent)
        self.parent = parent
        self.doc = doc
        self.model = self.parent.model
        self.store = self.parent.store
        self.formChildren = []


    def addFormChild(self, child):
        """
        Add a new child to the form.
        """
        self.formChildren.append(child)


    def getParameter(self, name):
        """
        Get a model parameter, from the container parent, by name.

        @type name: C{str}
        @param name: Model parameter name

        @rtype: C{methanal.model.Value}
        @return: Named model parameter
        """
        return self.parent.getParameter(name)


    @renderer
    def caption(self, req, tag):
        """
        Render the input's caption.
        """
        return tag[self.doc]


    @renderer
    def children(self, req, tag):
        """
        Render the input's child inputs.
        """
        return self.formChildren


    def invoke(self, data):
        """
        Process form data for each child input.

        @type data: C{dict}
        @param data: Form data
        """
        for child in self.formChildren:
            child.invoke(data)



class FormGroup(InputContainer):
    """
    Container for visually grouping inputs.

    A C{FormGroup} will be set inactive (and thus hidden) if all of its
    child controls are inactive too.
    """
    fragmentName = 'methanal-group'



class FormRow(InputContainer):
    """
    Container for visually organising inputs into rows.
    """
    fragmentName = 'methanal-form-row'
    jsClass = u'Methanal.View.FormRow'



# XXX: Do we still need this revolting hack?
class GroupInput(FormGroup):
    """
    Container for grouping controls belonging to a ReferenceParameter submodel.

    XXX: This API should be considered extremely unstable.
    """
    jsClass = u'Methanal.View.GroupInput'


    def __init__(self, parent, name):
        self.param = parent.getParameter(name)
        super(GroupInput, self).__init__(parent=parent, doc=self.param.doc)
        self.model = self.param.model
        self.name = name


    def getInitialArguments(self):
        keys = (unicode(n, 'ascii') for n in self.model.params)
        return [self.param.name.decode('ascii'),
                dict.fromkeys(keys, 1)]


    def getParameter(self, name):
        """
        Get a model parameter by name.

        @type name: C{str}
        @param name: Model parameter name

        @rtype: C{methanal.model.Value}
        @return: Named model parameter
        """
        return self.model.params[name]


    def invoke(self, data):
        ourData = data[self.name]
        for child in self.formChildren:
            child.invoke(ourData)



class FormInput(ThemedElement):
    """
    Abstract input widget class.
    """
    def __init__(self, parent, name, label=None, **kw):
        """
        Initialise the input.

        @param parent: Parent input

        @type name: C{str}
        @param name: Name of the model parameter this input represents

        @type label: C{unicode}
        @param label: Input's label or caption, or C{None} to use the
            model parameter's C{doc} attribute
        """
        super(FormInput, self).__init__(**kw)
        self.parent = parent
        self.name = unicode(name, 'ascii')
        self.param = parent.getParameter(name)

        self.store = parent.store

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


    def getInitialArguments(self):
        return [getArgsDict(self)]


    def getArgs(self):
        """
        Get input-specific arguments.
        """
        return {u'name':  self.name,
                u'value': self.getValue(),
                u'label': self.label}


    @renderer
    def value(self, req, tag):
        """
        Render the input's value.
        """
        value = self.getValue()
        if value is None:
            value = u''
        return tag[value]


    def invoke(self, data):
        """
        Set the model parameter's value from form data.
        """
        self.param.value = data[self.param.name]


    def getValue(self):
        """
        Get the model parameter's value.
        """
        return self.param.value



class TextAreaInput(FormInput):
    """
    Multi-line text input.
    """
    fragmentName = 'methanal-text-area-input'
    jsClass = u'Methanal.View.TextAreaInput'



class TextInput(FormInput):
    """
    Text input.
    """
    fragmentName = 'methanal-text-input'
    jsClass = u'Methanal.View.TextInput'


    def __init__(self, embeddedLabel=False, **kw):
        super(TextInput, self).__init__(**kw)
        self.embeddedLabel = embeddedLabel


    def getArgs(self):
        return {u'embeddedLabel': self.embeddedLabel}



class FilteringTextInput(TextInput):
    """
    A L{TextInput} that allows real time filtering on the input and provides
    customizable default validation.

    See the JavaScript docstrings for more detail.

    @type expression: C{unicode}
    @ivar expression: A regular expression that specifies what characters
        are allowed to be part of the value of the input field, or C{None}
        for no validation

        For example::

            - Allow alphanumerics: [a-zA-z0-9]
            - Allow either the string "cat" or "dog": cat|dog
    """
    jsClass = u'Methanal.View.FilteringTextInput'


    def __init__(self, expression=None, **kw):
        super(FilteringTextInput, self).__init__(**kw)
        self.expression = expression


    def getArgs(self):
        return {u'expression': self.expression}



class PrePopulatingTextInput(TextInput):
    """
    Text input that updates another input's value with its own in real time.

    @type targetControlName: C{str}
    @ivar targetControlName: The name of the input to pre-populate
    """
    jsClass = u'Methanal.View.PrePopulatingTextInput'


    def __init__(self, targetControlName, **kw):
        super(PrePopulatingTextInput, self).__init__(**kw)
        self.targetControlName = unicode(targetControlName, 'ascii')


    def getArgs(self):
        return {u'targetControlName': self.targetControlName}



class DateInput(TextInput):
    """
    Textual date input.

    A variety of date formats is supported, in order make entering an
    absolute date value as natural as possible. See the Javascript
    docstrings for more detail.

    @type timezone: C{datetime.tzinfo}
    @ivar timezone: A C{tzinfo} implementation, representing the timezone
        this date input is relative to

    @type twentyFourHours: C{bool}
    @ivar twentyFourHours: Display human readable time in 24-hour
        format?
    """
    jsClass = u'Methanal.View.DateInput'


    def __init__(self, timezone, twentyFourHours=False, **kw):
        super(DateInput, self).__init__(**kw)
        self.timezone = timezone
        self.twentyFourHours = twentyFourHours


    def getArgs(self):
        return {u'twentyFourHours': self.twentyFourHours}


    def getValue(self):
        value = self.param.value
        if value is None:
            return u''

        dt = value.asDatetime(self.timezone)
        return u'%04d-%02d-%02d' % (dt.year, dt.month, dt.day)


    def invoke(self, data):
        value = data[self.param.name]
        if value is not None:
            value = Time.fromPOSIXTimestamp(value / 1000)
        self.param.value = value



class IntegerValueMixin(object):
    """
    Mixin to convert parameter values to C{int} when a value is present, or
    the empty string when the value is C{None}.
    """
    def getValue(self):
        value = self.param.value
        if value is None:
            return u''
        return int(value)



class IntegerInput(IntegerValueMixin, TextInput):
    """
    Integer input.
    """
    jsClass = u'Methanal.View.IntegerInput'



class DecimalInput(TextInput):
    """
    Decimal input.
    """
    jsClass = u'Methanal.View.DecimalInput'


    def __init__(self, decimalPlaces=None, **kw):
        """
        Initialise the input.

        @type decimalPlaces: C{int}
        @param decimalPlaces: The number of decimal places to allow, or C{None}
            to use the model parameter's value
        """
        super(DecimalInput, self).__init__(**kw)
        if decimalPlaces is None:
            decimalPlaces = self.param.decimalPlaces
        self.decimalPlaces = decimalPlaces


    def getArgs(self):
        return {u'decimalPlaces': self.decimalPlaces}


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



class PercentInput(DecimalInput):
    """
    Decimal input, with values interpreted as percentages.
    """
    jsClass = u'Methanal.View.PercentInput'



class VerifiedPasswordInput(TextInput):
    """
    Password input with verification and strength checking.

    @type minPasswordLength: C{int}
    @ivar minPasswordLength: Minimum acceptable password length, or C{None}
        to use the default client-side value

    @type strengthCriteria: C{list} of C{unicode}
    @ivar strengthCriteria: A list of criteria names for password strength
        testing, or C{None} for no additional strength criteria. See
        L{Methanal.View.VerifiedPasswordInput.STRENGTH_CRITERIA} in the
        Javascript source for possible values
    """
    fragmentName = 'methanal-verified-password-input'
    jsClass = u'Methanal.View.VerifiedPasswordInput'


    def __init__(self, minPasswordLength=None, strengthCriteria=None, **kw):
        super(VerifiedPasswordInput, self).__init__(**kw)
        self.minPasswordLength = minPasswordLength
        if strengthCriteria is None:
            strengthCriteria = []
        self.strengthCriteria = strengthCriteria


    def getArgs(self):
        return {u'minPasswordLength': self.minPasswordLength,
                u'strengthCriteria':  self.strengthCriteria}



class ChoiceInput(FormInput):
    """
    Abstract input with multiple options.

    @type values: L{IEnumeration}
    @ivar values: An enumeration to be used for choice options
    """
    def __init__(self, values, **kw):
        super(ChoiceInput, self).__init__(**kw)
        _values = IEnumeration(values, None)
        if _values is None:
            _values = IEnumeration(list(values))
            warn('ChoiceInput: "values" should be adaptable to IEnumeration',
                 DeprecationWarning, 2)
        self.values = _values


    @renderer
    def options(self, req, tag):
        """
        Render all available options.
        """
        option = tag.patternGenerator('option')
        for value, description in self.values.asPairs():
            o = option()
            o.fillSlots('value', value)
            o.fillSlots('description', description)
            yield o


registerAdapter(ListEnumeration, list, IEnumeration)



class MultiCheckboxInput(ChoiceInput):
    """
    Multiple-checkboxes input.
    """
    fragmentName = 'methanal-multicheck-input'
    jsClass = u'Methanal.View.MultiCheckboxInput'



class SelectInput(ChoiceInput):
    """
    Dropdown input.
    """
    fragmentName = 'methanal-select-input'
    jsClass = u'Methanal.View.SelectInput'



class MultiSelectInput(ChoiceInput):
    """
    Multiple-selection list box input.
    """
    fragmentName = 'methanal-multiselect-input'
    jsClass = u'Methanal.View.MultiSelectInput'



class GroupedSelectInput(SelectInput):
    """
    Dropdown input with grouped values.

    Values should be structured as follows::

        (u'Group name', [(u'value', u'Description'),
                         ...]),
         ...)
    """
    @renderer
    def options(self, req, tag):
        option = tag.patternGenerator('option')
        optgroup = tag.patternGenerator('optgroup')

        for groupName, values in self.values.asPairs():
            g = optgroup().fillSlots('label', groupName)
            for value, description in values:
                o = option()
                o.fillSlots('value', value)
                o.fillSlots('description', description)
                g[o]
            yield g



class IntegerSelectInput(IntegerValueMixin, SelectInput):
    """
    Dropdown input backed by integer values.
    """
    jsClass = u'Methanal.View.IntegerSelectInput'



class ObjectSelectInput(SelectInput):
    """
    Choice input for arbitrary Python objects.

    @type _objects: C{dict} mapping C{int} to C{object}
    @ivar _objects: Mapping of object identities to objects
    """
    def __init__(self, values, **kw):
        """
        Initialise the select input.

        @type values: C{iterable} of C{(obj, unicode)}
        @param values: An iterable of C{(object, description)} pairs
        """
        self._objects = objects = {}
        selectValues = []
        for obj, desc in values:
            value = id(obj)
            objects[value] = obj
            selectValues.append((value, desc))
        super(ObjectSelectInput, self).__init__(values=selectValues, **kw)


    def getValue(self):
        value = super(ObjectSelectInput, self).getValue()
        if value is None:
            return u''
        return unicode(id(value))


    def invoke(self, data):
        try:
            objID = int(data[self.param.name])
        except (ValueError, TypeError):
            value = None
        else:
            value = self._objects.get(objID)
        self.param.value = value



class CheckboxInput(FormInput):
    """
    Checkbox input.
    """
    fragmentName = 'methanal-check-input'
    jsClass = u'Methanal.View.CheckboxInput'


    def __init__(self, inlineLabel=None, **kw):
        """
        Initialise the input.

        @type inlineLabel: C{unicode}
        @param inlineLabel: Inline caption to use, or C{True} to use the model
            parameter's C{doc} attribute, or C{None} for no inline label
        """
        super(CheckboxInput, self).__init__(**kw)
        self.inlineLabel = inlineLabel


    @renderer
    def checkLabel(self, req, tag):
        """
        Render the inline caption.
        """
        if not self.inlineLabel:
            return tag

        doc = self.inlineLabel
        if doc is True:
            doc = self.param.doc
        return tag[doc]


    @renderer
    def value(self, req, tag):
        if self.param.value:
            tag(checked="checked")
        return tag



class ItemViewBase(LiveForm):
    """
    Base class for common item view behaviour.

    @type modelFactory: C{callable} with the signature
        C{item, itemClass, store, ignoredAttributes}
    @cvar modelFactory: Callable to invoke when synthensizing a L{Model}
    """
    modelFactory = ItemModel


    def __init__(self, item=None, itemClass=None, store=None,
                 ignoredAttributes=None, **kw):
        """
        Initialise the item view.

        Either L{item} or L{itemClass} must be given.

        @type item: L{Item}
        @param item: An item to synthesize a model for, and commit changes
            back to, or C{None} if there is no specific item

        @type itemClass: L{Item} type
        @param itemClass: An item type to synthesize a model for, and create
            for the first time when the view is invoked, or C{None} if a new
            item is not to be synthesized

        @type store: L{axiom.store.Store}
        @param store: The store the synthesized L{Model} is backed by; if
            C{None}, the store of L{item} is used, if given

        @type ignoredAttributes: C{set} of C{str}
        @param ignoredAttributes: A set of parameter names to ignore when
            synthesizing a model, or C{None}; useful for omitting parameters
            that are not intended for editing, such as timestamps

        @raise ValueError: If neither L{item} nor L{itemClass} is given
        """
        self.item = item

        if item is not None:
            self.itemClass = itemClass or type(item)
            self.store = store or item.store
            self.original = item
        elif itemClass is not None:
            self.itemClass = itemClass
            if store is None:
                raise ValueError('You must pass "store" with "itemClass"')
            self.store = store
            self.original = itemClass
        else:
            raise ValueError('You must pass either "item" or "itemClass"')

        self.model = self.modelFactory(item=self.item,
                                       itemClass=self.itemClass,
                                       store=self.store,
                                       ignoredAttributes=ignoredAttributes)

        super(ItemViewBase, self).__init__(store=self.store,
                                           model=self.model,
                                           **kw)



class ItemView(ItemViewBase):
    """
    A view for an L{Item} that automatically synthesizes a model.

    In the case of a specific L{Item} instance, for editing it, and in the case
    of an L{Item} subclass, for creating a new instance.
    """
    def __init__(self, switchInPlace=False, **kw):
        """
        Initialise the item view.

        @type switchInPlace: C{bool}
        @param switchInPlace: Switch to item editing mode upon creating
            a new instance
        """
        super(ItemView, self).__init__(**kw)
        self.switchInPlace = switchInPlace


    @expose
    def invoke(self, *a, **kw):
        item = super(ItemView, self).invoke(*a, **kw)
        if self.item is None and item is not None:
            self.createItem(item)
            if self.switchInPlace:
                self.item = item
            else:
                link = IWebTranslator(item.store).linkTo(item.storeID)
                return link.decode('ascii')


    def createItem(self, item):
        """
        A callback that is invoked when an item is created.
        """



class ReferenceItemView(ItemView):
    """
    An L{ItemView} associated with an attribute reference on another item.

    When the referenced item is created the view will be switched, in-place,
    to editing mode.
    """
    def __init__(self, parentItem, refAttr, itemClass=None, **kw):
        if not isinstance(refAttr, str):
            warn('refAttr should be an attribute name, not an attribute',
                 DeprecationWarning, 2)
            refAttr = refAttr.attrname

        if itemClass is None:
            itemClass = getattr(type(parentItem), refAttr).reftype

        value = getattr(parentItem, refAttr)
        super(ReferenceItemView, self).__init__(
            item=value,
            itemClass=itemClass,
            store=parentItem.store,
            switchInPlace=True,
            **kw)

        self.parentItem = parentItem
        self.refAttr = refAttr


    def createItem(self, item):
        super(ReferenceItemView, self).createItem(item)
        setattr(self.parentItem, self.refAttr, item)



class AutoItemView(ItemView):
    """
    An L{ItemView} that automatically synthesizes a form.
    """
    def __init__(self, env=None, **kw):
        """
        Initialise the view.

        Any additional keyword arguments are passed on to L{ItemView}.

        @type env: C{dict}
        @param env: Additional parameters to pass when creating inputs
        """
        super(AutoItemView, **kw)

        if env is None:
            env = {}

        for name, attr in self.itemClass.getSchema():
            inputTypeFromAttribute(attr, **env)(parent=self, name=name)



_inputTypes = {
    text:       lambda env: TextInput,
    integer:    lambda env: IntegerInput,
    timestamp:  lambda env:
        lambda **kw: DateInput(timezone=env['timezone'], **kw)}

def inputTypeFromAttribute(attr, **env):
    """
    Create a form input from an Axiom attribute.
    """
    return _inputTypes[type(attr)](env)



def containerFromAttributes(containerFactory, store, attributes, callback, doc,
                            **env):
    """
    Generate a model and view, with inputs, from Axiom attributes.

    Any additional keyword arguments are passed to L{inputTypeFromAttribute},
    when creating the inputs.

    @type containerFactory: C{callable} taking a L{Model} parameter
    @param containerFactory: Callable to create an input container

    @type store: L{axiom.store.Store}
    @param store: Store backing the synthesized L{Model}

    @type attributes: C{iterable} of Axiom attributes
    @param attributes: Attributes to synthesize a model and view for

    @type callback: C{callable} taking keyword arguments with names matching
        those of L{attributes}
    @param callback: Model callback

    @type doc: C{unicode}
    @param doc: Model caption

    @return: View container with child inputs for L{attributes}
    """
    attributes = tuple(attributes)

    model = Model(callback=callback,
                  params=[paramFromAttribute(store, attr, None)
                          for attr in attributes],
                  doc=doc)

    container = containerFactory(model)

    for attr in attributes:
        inputType = inputTypeFromAttribute(attr, **env)
        inputType(parent=container, name=attr.attrname)

    return container



def liveFormFromAttributes(store, attributes, callback, doc, **env):
    """
    Generate a L{LiveForm} from attributes.

    Any additional keyword arguments are passed to L{inputTypeFromAttribute},
    when creating the inputs.

    @type store: L{axiom.store.Store}
    @param store: Store backing the synthesized L{Model}

    @type attributes: C{iterable} of Axiom attributes
    @param attributes: Attributes to synthesize a model and view for

    @type callback: C{callable} taking keyword arguments with names matching
        those of L{attributes}
    @param callback: Model callback

    @type doc: C{unicode}
    @param doc: Model caption

    @return: L{LiveForm} with child inputs for L{attributes}
    """
    fact = lambda model: LiveForm(store, model)
    return containerFromAttributes(
        fact, store, attributes, callback, doc, **env)
