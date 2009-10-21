from datetime import datetime
from decimal import Decimal

from twisted.trial import unittest

from epsilon.extime import FixedOffset, Time

from axiom import attributes
from axiom.store import Store
from axiom.item import Item

from nevow import athena, loaders
from nevow.testutil import renderLivePage

from methanal.imethanal import IEnumeration
from methanal.model import ItemModel, Value, DecimalValue, Model
from methanal import view



class MockParent(object):
    def __init__(self, param):
        self.store = None
        self.param = param

        self.page = self
        self.liveFragmentChildren = []

        self.model = self


    def getParameter(self, name):
        return self.param


    def addFormChild(self, child):
        pass



def renderWidget(widget):
    """
    Flatten and render a widget.

    @rtype: C{Deferred} -> C{str}
    @return: A deferred that fires with the flattened output
    """
    page = athena.LivePage(docFactory=loaders.stan(widget))
    widget.setFragmentParent(page)
    return renderLivePage(page)



class LiveFormTests(unittest.TestCase):
    """
    Tests for L{methanal.view.LiveForm}.
    """
    def setUp(self):
        self.form = view.LiveForm(store=None, model=Model())


    def test_renderActions(self):
        """
        The actions of a LiveForm are rendered according to the given actions.
        """
        def verifyRendering(result):
            # XXX: This is not the best thing ever.
            self.assertIn('<div id="athenaid:1-actions"', result)
            self.assertIn('Submit</button>', result)

        return renderWidget(self.form).addCallback(verifyRendering)



class FormInputTests(unittest.TestCase):
    """
    Test for L{methanal.view.FormInput}.

    Also serves as the base class for other input tests.

    @type controlType: L{methanal.view.FormInput} subclass
    @cvar controlType: Type of control to create with L{createControl}

    @type createArgs: C{list} of C{dict}
    @cvar createArgs: Sequence of arguments that will create controls of
        type L{controlType}

    @type brokenCreateArgs: C{list} of C{(Exception, dict)}
    @cvar brokenCreateArgs: Sequence of C{(exceptionRaised, args)} that will
        fail to create controls of type L{controlType}
    """
    controlType = view.FormInput

    createArgs = []

    brokenCreateArgs = []


    def setUp(self):
        self.name = 'test'


    def createParent(self, args):
        """
        Create a parent control.
        """
        return MockParent(self.createParam(args))


    def createParam(self, args):
        """
        Create a model parameter.
        """
        return Value(self.name)


    def createControl(self, args):
        """
        Create a control of type L{controlType}.
        """
        args.setdefault('name', self.name)
        args.setdefault('parent', self.createParent(args))
        return self.controlType(**args)


    def test_creation(self):
        """
        Creating a control succeeds.

        Try each set of parameters from L{createArgs}.
        """
        for args in self.createArgs:
            control = self.createControl(args)
            self.assertTrue(isinstance(control.name, unicode))
            self.assertIdentical(control.param, control.parent.param)


    def test_creationFails(self):
        """
        Creating a control fails.

        Try each set of parameters from L{brokenCreateArgs}, ensuring that
        the correct exception is raised in each case.
        """
        for errorType, args in self.brokenCreateArgs:
            self.assertRaises(errorType, self.createControl, args)



class TextAreaInputTests(FormInputTests):
    """
    Tests for L{methanal.view.TextAreaInput}.
    """
    controlType = view.TextAreaInput

    createArgs = [
        dict()]



class TextInputTests(FormInputTests):
    """
    Tests for L{methanal.view.TextInput}.
    """
    controlType = view.TextInput

    createArgs = [
        dict(),
        dict(embeddedLabel=True)]



class FilteringTextInputTests(FormInputTests):
    """
    Tests for L{methanal.view.FilteringTextInput}.
    """
    controlType = view.FilteringTextInput

    createArgs = [
        dict(),
        dict(expression=u'[a-zA-Z]')]



class PrePopulatingTextInputTests(FormInputTests):
    """
    Tests for L{methanal.view.PrePopulatingTextInput}.
    """
    controlType = view.PrePopulatingTextInput

    createArgs = [
        dict(targetControlName='bbq')]

    brokenCreateArgs = [
        (TypeError, dict())]



class DateInputTests(FormInputTests):
    """
    Tests for L{methanal.view.DateInput}.
    """
    controlType = view.DateInput

    createArgs = [
        dict(timezone=FixedOffset(0, 0)),
        dict(timezone=FixedOffset(0, 0), twentyFourHours=True)]

    brokenCreateArgs = [
        (TypeError, dict()),
        (TypeError, dict(twentyFourHours=True))]


    def test_getValue(self):
        """
        L{methanal.view.DateInput.getValue} retrieves an empty string in the
        C{None} case and a string representing the C{Time} specified by
        parameter's value, in the case where a value exists.
        """
        control = self.createControl(dict(timezone=FixedOffset(0, 0)))
        param = control.parent.param

        param.value = None
        self.assertEquals(control.getValue(), u'')

        param.value = Time.fromDatetime(datetime(2007, 1, 1))
        self.assertTrue(isinstance(control.getValue(), unicode))
        self.assertEquals(control.getValue(), u'2007-01-01')

        param.value = Time.fromDatetime(datetime(542, 12, 18))
        self.assertEquals(control.getValue(), u'0542-12-18')



class IntegerInputTests(FormInputTests):
    """
    Tests for L{methanal.view.IntegerInput}.
    """
    controlType = view.IntegerInput


    def test_getValue(self):
        """
        L{methanal.view.IntegerInput.getValue} retrieves an empty string in the
        C{None} case and an C{int} in the case where a value exists.
        """
        control = self.createControl(dict())
        param = control.parent.param

        param.value = None
        self.assertEquals(control.getValue(), u'')

        param.value = u'5'
        self.assertTrue(isinstance(control.getValue(), int))
        self.assertEquals(control.getValue(), 5)
        param.value = 5
        self.assertTrue(isinstance(control.getValue(), int))
        self.assertEquals(control.getValue(), 5)



class DecimalInputTests(FormInputTests):
    """
    Tests for L{methanal.view.DecimalInput}.
    """
    controlType = view.DecimalInput

    decimalPlaces = 3

    createArgs = [
        dict(),
        dict(decimalPlaces=1)]


    def createParam(self, args):
        decimalPlaces = args.get('decimalPlaces', self.decimalPlaces)
        return DecimalValue(name=self.name, decimalPlaces=decimalPlaces)


    def test_getValue(self):
        """
        L{methanal.view.DecimalInput.getValue} retrieves an empty string in the
        C{None} case and a C{float} in the case where a value exists.
        """
        control = self.createControl(dict(decimalPlaces=2))
        param = control.parent.param

        param.value = None
        self.assertEquals(control.getValue(), u'')

        param.value = u'12.34'
        self.assertTrue(isinstance(control.getValue(), float))
        self.assertEquals(control.getValue(), 12.34)


    def test_invoke(self):
        """
        L{methanal.view.DecimalInput.invoke} sets the parameter value to C{None}
        in the C{None} case and a C{Decimal} in the case where a value exists.
        """
        control = self.createControl(dict(decimalPlaces=2))
        param = control.parent.param

        data = {param.name: None}
        control.invoke(data)
        self.assertIdentical(param.value, None)

        data = {param.name: u'12.34'}
        control.invoke(data)
        self.assertEquals(param.value, Decimal('12.34'))



class VerifiedPasswordInputTests(FormInputTests):
    """
    Tests for L{methanal.view.VerifiedPasswordInput}.
    """
    controlType = view.VerifiedPasswordInput

    createArgs = [
        dict(),
        dict(minPasswordLength=3),
        dict(strengthCriteria=['ALPHA'])]



class ChoiceInputTestsMixin(object):
    """
    Mixin for L{methanal.view.ChoiceInput} based controls.
    """
    def createControl(self, args):
        """
        Create a L{methanal.view.ChoiceInput} from C{values} and assert that
        L{methanal.view.ChoiceInput.values} provides L{IEnumeration}.
        """
        control = super(ChoiceInputTestsMixin, self).createControl(args)
        self.assertTrue(IEnumeration.providedBy(control.values))
        return control



class ChoiceInputTests(ChoiceInputTestsMixin, FormInputTests):
    """
    Tests for L{methanal.view.ChoiceInput}.
    """
    controlType = view.ChoiceInput

    createArgs = [
        dict(values=[
            (u'foo', u'Foo'),
            (u'bar', u'Bar')])]

    brokenCreateArgs = [
        (TypeError, dict())]


    def createControl(self, args):
        """
        Create a L{methanal.view.ChoiceInput} from C{values}, assert that
        L{methanal.view.ChoiceInput.value} provides L{IEnumeration} and
        calling C{asPairs} results in the same values as C{values}.
        """
        control = super(ChoiceInputTests, self).createControl(args)
        self.assertEquals(control.values.asPairs(), list(args.get('values')))
        return control


    def test_createDeprecated(self):
        """
        Passing values that are not adaptable to IEnumeration are converted
        to a C{list}, adapted to L{IEnumeration} and a warning is emitted.
        """
        # Not a list.
        values = tuple([
            (u'foo', u'Foo'),
            (u'bar', u'Bar')])
        self.createControl(dict(values=values))
        self.assertEquals(len(self.flushWarnings()), 1)



class GroupedSelectInputTests(ChoiceInputTests):
    """
    Tests for L{methanal.view.GroupedSelectInput}.
    """
    controlType = view.GroupedSelectInput


    def test_renderOptions(self):
        """
        The options of a GroupedSelectInput are rendered according to the given
        values.
        """
        values = [(u'Group', [(u'foo', u'Foo'),
                              (u'bar', u'Bar')])]

        control = self.createControl(dict(values=values))

        def verifyRendering(result):
            for group, subvalues in values:
                self.assertIn('<optgroup label="%s">' % (group,), result)
                for value, desc in subvalues:
                    elem = '<option value="%s">%s</option>' % (value, desc)
                    self.assertIn(elem, result)

        return renderWidget(control).addCallback(verifyRendering)



class IntegerSelectInputTests(ChoiceInputTests):
    """
    Tests for L{methanal.view.IntegerSelectInput}.
    """
    controlType = view.IntegerSelectInput


    def test_getValue(self):
        """
        L{methanal.view.IntegerSelectInput.getValue} retrieves an empty string in the
        C{None} case and an C{int} in the case where a value exists.
        """
        values = [
            (1, u'Foo'),
            (2, u'Bar')]
        control = self.createControl(dict(values=values))
        param = control.parent.param

        param.value = u'1'
        self.assertTrue(isinstance(control.getValue(), int))
        self.assertEquals(control.getValue(), 1)
        param.value = 1
        self.assertTrue(isinstance(control.getValue(), int))
        self.assertEquals(control.getValue(), 1)



class ObjectSelectInputTests(ChoiceInputTestsMixin, FormInputTests):
    """
    Test for L{methanal.view.ObjectSelectInput}.
    """
    controlType = view.ObjectSelectInput

    values = [
        (int, u'Foo'),
        (str, u'Bar')]

    createArgs = [
        dict(values=values)]


    def test_choiceValues(self):
        """
        ObjectSelectInput provides C{(int, unicode)} pairs to ChoiceInput
        and maintains a mapping of object identities to objects.
        """
        control = self.createControl(dict(values=self.values))

        _objects = control._objects
        self.assertIdentical(_objects.get(id(int)), int)
        self.assertIdentical(_objects.get(id(str)), str)

        self.assertEquals(control.values.asPairs(), [
            (id(int), u'Foo'),
            (id(str), u'Bar')])


    def test_getValue(self):
        """
        L{methanal.view.ObjectSelectInput.getValue} retrieves an empty string
        in the C{None} case and a C{unicode} string representing an object
        identity in the case where a value exists.
        """
        control = self.createControl(dict(values=self.values))
        param = control.parent.param

        param.value = int
        self.assertEquals(control.getValue(), unicode(id(int)))

        param.value = None
        self.assertEquals(control.getValue(), u'')


    def test_invoke(self):
        """
        L{methanal.view.ObjectSelectInput.invoke} sets the parameter value to
        C{None} in the C{None} (or unknown object identity) case and a Python
        object, representing the object with the specified identity, in the
        case where a value exists.
        """
        control = self.createControl(dict(values=self.values))
        param = control.parent.param

        data = {param.name: unicode(id(int))}
        control.invoke(data)
        self.assertIdentical(param.value, int)

        data = {param.name: u''}
        control.invoke(data)
        self.assertIdentical(param.value, None)



class CheckboxInputTests(FormInputTests):
    """
    Tests for L{methanal.view.CheckboxInput}.
    """
    controlType = view.CheckboxInput


    def test_renderNotChecked(self):
        """
        An unchecked CheckboxInput renders no C{checked} attribute.
        """
        control = self.createControl(dict())
        control.parent.param.value = False

        def verifyRendering(result):
            self.assertNotIn('checked="checked"', result)

        return renderWidget(control).addCallback(verifyRendering)


    def test_renderChecked(self):
        """
        An checked CheckboxInput renders a C{checked} attribute.
        """
        control = self.createControl(dict())
        control.parent.param.value = True

        def verifyRendering(result):
            self.assertIn('checked="checked"', result)

        return renderWidget(control).addCallback(verifyRendering)


    def test_renderInlineLabel(self):
        """
        Specifying an C{inlineLabel} value results in that label being used
        when renderering the CheckboxInput.
        """
        control = self.createControl(dict(inlineLabel=u'HELLO WORLD'))
        control.parent.param.value = True

        def verifyRendering(result):
            self.assertIn('HELLO WORLD</label>', result)

        return renderWidget(control).addCallback(verifyRendering)



class TestItem(Item):
    """
    A test Item with some attributes.
    """
    foo = attributes.text(doc=u'Foo')
    bar = attributes.boolean(doc=u'Bar?')



class ItemViewBaseTests(unittest.TestCase):
    """
    Tests for L{methanal.view.ItemViewBase}.
    """
    def setUp(self):
        self.store = Store()
        self.item = TestItem(store=self.store)


    def test_createWithItem(self):
        """
        Create an ItemViewBase with an axiom Item instance.
        """
        iv = view.ItemViewBase(item=self.item)
        self.assertIdentical(iv.store, self.store)
        self.assertIdentical(iv.itemClass, type(self.item))
        self.assertIdentical(iv.original, self.item)


    def test_createWithItemClass(self):
        """
        Create an ItemViewBase with an axiom Item type and store, an exception
        is raised if the C{store} parameter is not given.
        """
        iv = view.ItemViewBase(itemClass=type(self.item), store=self.store)
        self.assertIdentical(iv.store, self.store)
        self.assertIdentical(iv.itemClass, type(self.item))
        self.assertIdentical(iv.original, type(self.item))

        self.assertRaises(ValueError,
            view.ItemViewBase, itemClass=type(self.item))


    def test_customModelFactory(self):
        """
        Creating an ItemViewBase subclass with a custom model factory.
        """
        class TestModel(ItemModel):
            pass

        class CustomItemView(view.ItemViewBase):
            modelFactory = TestModel

        iv = CustomItemView(item=self.item)
        self.assertTrue(isinstance(iv.model, TestModel))
