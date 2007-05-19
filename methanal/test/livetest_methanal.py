from nevow import tags
from nevow.livetrial import testcase
from nevow.athena import expose

from axiom.store import Store
from axiom.dependency import installOn

from xmantissa.website import WebSite

from methanal.model import Model, ValueParameter, EnumerationParameter, MultiEnumerationParameter
from methanal.view import LiveForm, FormGroup, TextInput, IntegerInput, CheckboxInput, MultiCheckboxInput, SelectInput
from methanal.test.test_methanal import _DummyChildItem, _DummyParentItem, _GroupTestView

class TestLiveForm(LiveForm):
    jsClass = u'Methanal.Test.TestLiveForm'


class FormTest(object):
    def getStore(self):
        try:
            return self._store
        except AttributeError:
            s = self._store = Store()
            installOn(WebSite(store=s), s)
            return s

    def getWidgetTag(self):
        view = self.getView()
        view.setFragmentParent(self)
        return tags.div[view]

class TextInputTests(FormTest, testcase.TestCase):
    jsClass = u'Methanal.Test.TextInput'

    def submit(self, param):
        self.assertEquals(param, u'hello world')

    def getView(self):
        param = ValueParameter(name='param', value=u'hello world')
        model = Model([param], self.submit, u'Test')

        view = TestLiveForm(self.getStore(), model)
        control = TextInput(parent=view, name='param')
        return view

class IntegerInputTests(FormTest, testcase.TestCase):
    jsClass = u'Methanal.Test.IntegerInput'

    def submit(self, param):
        self.assertEquals(param, 42)

    def getView(self):
        param = ValueParameter(name='param', value=42)
        model = Model([param], self.submit, u'Test')

        view = TestLiveForm(self.getStore(), model)
        control = IntegerInput(parent=view, name='param')
        return view

class MultiCheckboxInputTests(FormTest, testcase.TestCase):
    jsClass = u'Methanal.Test.MultiCheckboxInput'

    def submit(self, param):
        self.assertEquals(param, [u'foo', u'baz'])

    def getView(self):
        values = [
            (u'foo', u'Foo Choice'),
            (u'bar', u'Bar Choice'),
            (u'baz', u'Baz Choice'),
            (u'quux', u'Quux Choice'),
        ]

        param = MultiEnumerationParameter(name='param', values=zip(*values)[0], value=[u'foo', u'baz'])
        model = Model([param], callback=self.submit, doc=u'Test')

        view = TestLiveForm(self.getStore(), model)
        control = MultiCheckboxInput(parent=view, name='param', values=values)
        return view

class CheckboxInputTests(FormTest, testcase.TestCase):
    jsClass = u'Methanal.Test.CheckboxInput'

    def getView(self):
        def _cb(param):
            self.assertEquals(param, True)

        param = ValueParameter(name='param', value=True, doc=u'Parameter')
        model = Model([param], callback=_cb, doc=u'Test')

        view = TestLiveForm(self.getStore(), model)
        control = CheckboxInput(parent=view, name='param')
        return view

class SelectInputTests(FormTest, testcase.TestCase):
    jsClass = u'Methanal.Test.SelectInput'

    def submit(self, param):
        self.assertEquals(param, u'baz')

    def getView(self):
        values = [
            (u'foo', u'Foo Choice'),
            (u'bar', u'Bar Choice'),
            (u'baz', u'Baz Choice'),
            (u'quux', u'Quux Choice'),
        ]

        param = EnumerationParameter(name='param', values=zip(*values)[0], value=u'baz')
        model = Model([param], self.submit, u'Test')

        view = TestLiveForm(self.getStore(), model)
        control = SelectInput(parent=view, name='param', values=values)
        return view

class SubmitSuccess(FormTest, testcase.TestCase):
    jsClass = u'Methanal.Test.MethanalSubmitSuccess'

    def getInitialArguments(self):
        return (True,)

    def submit(self):
        return u'success'

    def getView(self):
        model = Model([], self.submit, u'Test')
        view = TestLiveForm(self.getStore(), model)
        view.jsClass = u'Methanal.Test.MethanalSubmitForm'
        return view

class SubmitFailure(FormTest, testcase.TestCase):
    jsClass = u'Methanal.Test.MethanalSubmitFailure'

    def getInitialArguments(self):
        return (False,)

    def submit(self):
        raise Exception('Synthetic failure')

    def getView(self):
        model = Model([], self.submit, u'Test')
        view = LiveForm(self.getStore(), model)
        view.jsClass = u'Methanal.Test.MethanalSubmitForm'
        return view

class ChangingValues(FormTest, testcase.TestCase):
    jsClass = u'Methanal.Test.ChangingValues'

    def __init__(self, *a, **kw):
        super(ChangingValues, self).__init__(*a, **kw)
        self.expectedValues = set((u'hello world', u'world hello!'))

    def getInitialArguments(self):
        return (u'world hello!',)

    def submit(self, param):
        self.assertIn(param, self.expectedValues)
        self.expectedValues.remove(param)

    def getView(self):
        param = ValueParameter(name='param', value=u'hello world')
        model = Model([param], self.submit, u'Test')

        view = TestLiveForm(self.getStore(), model)
        control = TextInput(parent=view, name='param')
        return view

class FormWithGroups(FormTest, testcase.TestCase):
    jsClass = u'Methanal.Test.FormWithGroups'

    def submit(self, param1, param2):
        return [param1, param2]

    def getView(self):
        param1 = ValueParameter(name='param1', value=u'hello world')
        param2 = ValueParameter(name='param2', value=u'dlrow olleh')
        model = Model(params=[param1, param2], callback=self.submit, doc=u'Test')

        view = TestLiveForm(self.getStore(), model)
        group1 = FormGroup(parent=view, doc='Group 1')
        TextInput(parent=group1, name='param1')
        group2 = FormGroup(parent=view, doc='Group 2')
        TextInput(parent=group2, name='param2')
        return view

class FormWithSubForms(FormTest, testcase.TestCase):
    jsClass = u'Methanal.Test.FormWithSubForms'

    def getView(self):
        store = self.getStore()
        self.dummyChild = _DummyChildItem(store=store)
        self.dummyParent = _DummyParentItem(store=store, r=self.dummyChild)
        return _GroupTestView(item=self.dummyParent)

    @expose
    def getValue(self):
        return self.dummyParent.r.i


class ValidatorsForm(LiveForm):
    jsClass = u'Methanal.Test.ValidatorsForm'


class Validators(FormTest, testcase.TestCase):
    jsClass = u'Methanal.Test.Validators'

    def getView(self):
        param = ValueParameter(name='param', value=u'valid', doc=u'Parameter')
        model = Model(params=[param], callback=lambda *a, **kw: None, doc=u'Test')

        view = ValidatorsForm(self.getStore(), model)
        control = TextInput(parent=view, name='param')
        return view
