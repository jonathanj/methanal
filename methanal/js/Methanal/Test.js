// import Nevow.Athena
// import Mantissa.Test
// import Methanal.View

Methanal.Test.TestLiveForm = Methanal.View.LiveForm.subclass('Methanal.Test.TestLiveForm');
Methanal.Test.TestLiveForm.methods(
    function submitSuccess(self, value) {
        return value;
    },

    function submitFailure(self, value) {
        return value;
    });


Methanal.Test.Forms = Mantissa.Test.Forms.subclass('Methanal.Test.Forms');


Methanal.Test.TextInput = Methanal.Test.Forms.subclass('Methanal.Test.TextInput');


Methanal.Test.IntegerInput = Methanal.Test.Forms.subclass('Methanal.Test.IntegerInput');


Methanal.Test.CheckboxInput = Methanal.Test.Forms.subclass('Methanal.Test.CheckboxInput');


Methanal.Test.MultiCheckboxInput = Methanal.Test.Forms.subclass('Methanal.Test.MultiCheckboxInput');


Methanal.Test.SelectInput = Methanal.Test.Forms.subclass('Methanal.Test.SelectInput');


Methanal.Test.MethanalSubmit = Methanal.Test.Forms.subclass('Methanal.Test.MethanalSubmit');
Methanal.Test.MethanalSubmit.methods(
    function __init__(self, node, expectSuccess) {
        Methanal.Test.MethanalSubmit.upcall(self, '__init__', node);
        self.expectSuccess = expectSuccess;
    });


Methanal.Test.MethanalSubmitSuccess = Methanal.Test.MethanalSubmit.subclass('Methanal.Test.MethanalSubmitSuccess');


Methanal.Test.MethanalSubmitFailure = Methanal.Test.MethanalSubmit.subclass('Methanal.Test.MethanalSubmitFailure');


Methanal.Test.MethanalSubmitForm = Methanal.View.LiveForm.subclass('Methanal.Test.MethanalSubmitForm');
Methanal.Test.MethanalSubmitForm.methods(
    function submitSuccess(self, value) {
        if (!self.widgetParent.expectSuccess) {
            self.unexpectedSuccess = true;
            throw new Error('Unexpected submission success');
        }
        self.widgetParent.assertEquals(value, 'success');
    },

    function submitFailure(self, err) {
        if (self.unexpectedSuccess) {
            throw new Error('Unexpected submission success');
        }

        if (self.widgetParent.expectSuccess) {
            throw new Error('Unexpected submission failure: ' + err);
        }
        return true;
    });


Methanal.Test.ChangingValues = Methanal.Test.Forms.subclass('Methanal.Test.ChangingValues');
Methanal.Test.ChangingValues.methods(
    function __init__(self, node, secondValue) {
        Methanal.Test.ChangingValues.upcall(self, '__init__', node);
        self.secondValue = secondValue;
    },

    function test_formSubmission2(self) {
        var form = self.childWidgets[0];
        form.childWidgets[0].childWidgets[0].inputNode.value = self.secondValue;
        form.submit();
    });


Methanal.Test.FormWithGroups = Methanal.Test.Forms.subclass('Methanal.Test.FormWithGroups');
Methanal.Test.FormWithGroups.methods(
    function test_formSubmission(self) {
        var form = self.childWidgets[0];
        form.controls['param1'].inputNode.value = 'foo';
        form.controls['param2'].inputNode.value = 'baz';

        var d = form.submit();
        d.addCallback(function (values) {
            self.assertEquals(values[0], 'foo');
            self.assertEquals(values[1], 'baz');
        });
        return d
    });


Methanal.Test.ValidatorsForm = Methanal.View.LiveForm.subclass('Methanal.Test.ValidatorsForm');
Methanal.Test.ValidatorsForm.methods(
    function __init__(self, node, viewOnly, controlNames) {
        Methanal.Test.ValidatorsForm.upcall(self, '__init__', node, viewOnly, controlNames);

        var validator = function validator(param) {
            if (param != 'valid') {
                return 'Invalid value';
            }
        }

        self.addValidators([
            [['param'], [validator]]]);
    },

    function setValid(self) {
        Methanal.Test.ValidatorsForm.upcall(self, 'setValid');
        self.valid = true;
    },

    function setInvalid(self) {
        Methanal.Test.ValidatorsForm.upcall(self, 'setInvalid');
        self.valid = false;
    });


Methanal.Test.Validators = Methanal.Test.Forms.subclass('Methanal.Test.Validators');
Methanal.Test.Validators.methods(
    function test_validity(self) {
        var form = self.childWidgets[0];
        var param = form.controls['param'];

        form.validate(param);
        self.assertEqual(form.valid, true);

        param.inputNode.value = 'invalid';
        form.validate(param);
        self.assertEqual(form.valid, false);
    });


Methanal.Test.FormWithSubForms = Nevow.Athena.Test.TestCase.subclass('Methanal.Test.FormWithSubForms');
Methanal.Test.FormWithSubForms.methods(
    function test_formSubmission(self) {
        var form = self.childWidgets[0];
        form.subforms['r'].controls['i'].inputNode.value = '1234';

        var d = form.submit();
        d.addCallback(function (value) {
            return self.callRemote('getValue');
        });
        d.addCallback(function (value) {
            self.assertEquals(value, 1234);
        });
        return d
    });
