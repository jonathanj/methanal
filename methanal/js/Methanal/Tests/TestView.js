// import Divmod.UnitTest
// import Nevow.Test.WidgetUtil
// import Methanal.View
// import Methanal.Util
// import Methanal.Tests.Util
// import Methanal.Tests.DOMUtil



/**
 * Create a new child DOM element for a widget.
 *
 * @type  widget: L{Nevow.Athena.Widget}
 * @param widget: Parent widget
 *
 * @type  tagName: C{String}
 * @param tagName: Element tag name
 *
 * @type  id: C{String}
 * @param id: Node ID
 *
 * @rtype: DOM element
 */
Methanal.Tests.TestView.makeWidgetChildNode = function makeWidgetChildNode(widget, tagName, id) {
    var node = document.createElement(tagName);
    if (id) {
        node.id = widget.translateNodeId(id);
    }
    widget.node.appendChild(node);
    return node;
};



/**
 * L{Methanal.View.LiveForm} mock implementation.
 */
Methanal.View.LiveForm.subclass(Methanal.Tests.TestView, 'MockLiveForm').methods(
    function __init__(self, controlNames) {
        var node = Nevow.Test.WidgetUtil.makeWidgetNode();
        Methanal.Tests.TestView.MockLiveForm.upcall(
            self, '__init__', node, false, controlNames);

        var makeWidgetChildNode = Methanal.Tests.TestView.makeWidgetChildNode;
        makeWidgetChildNode(self, 'span', 'form-error');
        makeWidgetChildNode(self, 'button', 'submit');
        makeWidgetChildNode(self, 'img', 'throbber');

        document.body.appendChild(node);

        self.nodeInserted();
    });



/**
 * Base class for L{Methanal.View.FormInput} mock implementations.
 */
Methanal.Tests.Util.TestCase.subclass(Methanal.Tests.TestView, 'FormInputTestCase').methods(
    /**
     * Create the mock Methanal control.
     *
     * @param args: Mapping of argument names to values, C{name} and C{label}
     *     are required
     *
     * @rtype: L{Methanal.View.FormInput}
     */
    function createControl(self, args) {
        throw new Error('Subclasses must implement "createControl".')
    },


    /**
     * Create a new control and perform some tests on it.
     *
     * Once the tests have completed (successfully or not) the control is
     * removed from the document and forgotten about.
     *
     * @param args: Control argument mapping, if C{name}, C{label} or C{value}
     *     are not provided, suitable defaults will be chosen
     *
     * @type  testingFunc: C{function} taking L{Methana.View.FormInput}
     * @param testingFunc: Function called with the control once it has been
     *     initialised and its node inserted
     */
    function testControl(self, args, testingFunc) {
        if (args === undefined || args === null)
            args = {};
        if (args.name === undefined || args.name === null)
            args.name = 'methanalControl';
        if (args.label === undefined || args.label === null)
            args.label = 'a_label';
        if (args.value === undefined || args.value === null)
            args.value = null;

        var control = self.createControl(args);
        var form = Methanal.Tests.TestView.MockLiveForm([args.name]);
        var row = Methanal.View.FormRow(
            Nevow.Test.WidgetUtil.makeWidgetNode());
        Methanal.Tests.TestView.makeWidgetChildNode(row, 'span', 'error-text')
        row.setWidgetParent(form);
        document.body.appendChild(row.node);
        row.nodeInserted();

        control.setWidgetParent(row);
        row.node.appendChild(control.node);
        control.nodeInserted();

        try {
            testingFunc(control);
        } catch (e) {
            throw e;
        } finally {
            document.body.removeChild(row.node);
        }
    });



/**
 * Tests for L{Methanal.View.SelectInput}.
 */
Methanal.Tests.TestView.FormInputTestCase.subclass(Methanal.Tests.TestView, 'TestSelectInput').methods(
    function createControl(self, args) {
        var node = Nevow.Test.WidgetUtil.makeWidgetNode();
        var control = Methanal.View.SelectInput(node, args);
        node.appendChild(document.createElement('select'));
        Methanal.Tests.TestView.makeWidgetChildNode(control, 'span', 'error')
        return control;
    },


    /**
     * Assert than an "option" DOM node has specific values.
     */
    function assertOption(self, optionNode, value, description) {
        self.assertIdentical(optionNode.tagName, 'OPTION');
        self.assertIdentical(optionNode.value, value);
        self.assertIdentical(optionNode.childNodes[0].nodeValue, description);
    },


    /**
     * L{Methanal.View.SelectInput._createOption} creates an "option" node.
     */
    function test_createOption(self) {
        self.testControl({},
            function (control) {
                self.assertOption(
                    control._createOption('value', 'desc'),
                    'value', 'desc');
            });
    },


    /**
     * L{Methanal.View.SelectInput.setValue} creates a placeholder when given
     * a C{null} value, create no placeholder when given an empty value, and
     * sets the input node's C{value} attribute to the given value when one
     * is given.
     */
    function test_setValue(self) {
        self.testControl({value: null, label: 'placeholder'},
            function (control) {
                self.assertIdentical(control.inputNode.options.length, 1);
                self.assertOption(
                    control.inputNode.options[0], '', 'placeholder');
            });

        self.testControl({value: ''},
            function (control) {
                self.assertIdentical(control.inputNode.options.length, 0);
            });

        self.testControl({value: ''},
            function (control) {
                control.append('v1', 'd1');
                self.assertIdentical(control.inputNode.options.length, 1);
                self.assertIdentical(control.inputNode.value, '');
                control.setValue('v1');
                self.assertIdentical(control.inputNode.value, 'v1');
            });
    },


    /**
     * L{Methanal.View.SelectInput.getValue} returns the input node's C{value}
     * attribute or C{null} when the attribute is C{null} or empty.
     */
    function test_getValue(self) {
        self.testControl({value: ''},
            function (control) {
                self.assertIdentical(control.getValue(), null);
            });

        self.testControl({value: null},
            function (control) {
                self.assertIdentical(control.getValue(), null);
            });

        self.testControl({value: ''},
            function (control) {
                control.append('v1', 'd1');
                control.inputNode.value = 'v1';
                self.assertIdentical(control.getValue(), 'v1');
            });
    },
    

    /**
     * L{Methanal.View.SelectInput.append} and
     * L{Methanal.View.SelectInput.insert} modify the input node's options
     * collection.
     */
    function test_appendInsert(self) {
        self.testControl({value: ''},
            function (control) {
                control.append('v1', 'd1');
                self.assertIdentical(control.inputNode.options.length, 1);
                self.assertOption(control.inputNode.options[0], 'v1', 'd1');
                control.insert('v2', 'd2', control.inputNode.options[0])
                self.assertIdentical(control.inputNode.options.length, 2);
                self.assertOption(control.inputNode.options[0], 'v2', 'd2');
            });
    });



/**
 * Common control creation for L{Methanal.View.TextInput} inputs.
 */
Methanal.Tests.TestView.FormInputTestCase.subclass(Methanal.Tests.TestView, 'BaseTestTextInput').methods(
    function createControl(self, args) {
        var node = Nevow.Test.WidgetUtil.makeWidgetNode();
        var control = self.controlType(node, args);
        node.appendChild(document.createElement('input'));
        Methanal.Tests.TestView.makeWidgetChildNode(control, 'span', 'displayValue')
        Methanal.Tests.TestView.makeWidgetChildNode(control, 'span', 'error')
        return control;
    });


/**
 * Tests for L{Methanal.View.TextInput}.
 */
Methanal.Tests.TestView.BaseTestTextInput.subclass(Methanal.Tests.TestView, 'TestTextInput').methods(
    function setUp(self) {
        self.controlType = Methanal.View.TextInput;
    },


    /**
     * L{Methanal.View.TextInput.setValue} sets the node value to a string.
     */
    function test_setValue(self) {
        self.testControl({value: null},
            function (control) {
                control.setValue(null);
                self.assertIdentical(control.getValue(), '');

                control.setValue('');
                self.assertIdentical(control.getValue(), '');

                control.setValue('hello');
                self.assertIdentical(control.getValue(), 'hello');
            });
    },
    
    
    /**
     * When C{embeddedLabel} is C{true}, L{Methanal.View.TextInput.setValue}
     * sets the node value to a string when it is not empty, otherwise it sets
     * the node value to a label; L{Methanal.View.TextInput.getValue} ignores
     * the label.
     */
    function test_setValueWithLabel(self) {
        self.testControl({value: null, label: 'A label', embeddedLabel: true},
            function (control) {
                control.setValue(null);
                self.assertIdentical(control.inputNode.value, 'A label');
                self.assertIdentical(control.getValue(), '');

                control.setValue('');
                self.assertIdentical(control.inputNode.value, 'A label');
                self.assertIdentical(control.getValue(), '');

                control.setValue('hello');
                self.assertIdentical(control.inputNode.value, 'hello');
                self.assertIdentical(control.getValue(), 'hello');
            });
    },
    
    
    /**
     * Focussing a L{Methanal.View.TextInput} removes any label it might have
     * and removing the focus applies a label, should it need one.
     */
    function test_focusBehaviourWithLabel(self) {
        self.testControl({value: null, label: 'A label', embeddedLabel: true},
            function (control) {
                control.setValue('');
                self.assertIdentical(control.inputNode.value, 'A label');

                control.onFocus(control.inputNode);
                self.assertIdentical(control.inputNode.value, '');

                control.onBlur(control.inputNode);
                self.assertIdentical(control.inputNode.value, 'A label');
            });
    },
    

    /**
     * Display value-enabled L{Methanal.View.TextInput}s call
     * L{Methanal.View.TextInput.makeDisplayValue} and set the "display
     * value" node when input changes.
     */
    function test_displayValue(self) {
        self.testControl({value: null},
            function (control) {
                control.enableDisplayValue();

                self.assertThrows(Error,
                    function () { control.setValue('hello'); });

                var called = 0;
                control.makeDisplayValue = function () {
                    called++;
                    return '';
                };
                control.setValue('anotherhello');
                self.assertIdentical(called, 1);
                control.onKeyUp(control.inputNode);
                self.assertIdentical(called, 2);
            });
    });



Methanal.Tests.TestView.BaseTestTextInput.subclass(Methanal.Tests.TestView, 'TestDateInput').methods(
    function setUp(self) {
        self.controlType = Methanal.View.DateInput;
    },


    /**
     * L{Methanal.View.DateInput.makeDisplayValue} creates a human-readable
     * value for valid date values.
     */
    function test_displayValue(self) {
        self.testControl({value: null},
            function (control) {
                var called = 0;
                var displayValue = '';
                control._originalMakeDisplayValue = control.makeDisplayValue;
                control.makeDisplayValue = function (value) {
                    called++;
                    displayValue = control._originalMakeDisplayValue(value);
                    return '';
                };
                control.setValue('NOTAVALIDDATE');
                self.assertIdentical(called, 0);
                control.setValue('2009-01-01');
                self.assertIdentical(called, 1);
                self.assertIdentical(displayValue,
                    Methanal.Util.Time.guess('2009-01-01').asHumanly());
                control.onKeyUp(control.inputNode);
                self.assertIdentical(called, 2);
            });
    },
    
    
    /**
     * L{Methanal.View.DateInput.getValue} returns a timestamp in milliseconds
     * if the input node's value is a valid date, C{null} if it is blank and
     * C{undefined} if the value is not a parsable date format.
     */
    function test_getValue(self) {
        self.testControl({value: null},
            function (control) {
                control.setValue(null);
                self.assertIdentical(control.getValue(), null);
                control.setValue('');
                self.assertIdentical(control.getValue(), null);
                control.setValue('NOTAVALIDDATE');
                self.assertIdentical(control.getValue(), undefined);
                control.setValue('2009-01-01');
                self.assertIdentical(control.getValue(), 1230760800000);
            });
    },
    
    
    /**
     * L{Methanal.View.DateInput}'s base validator considers C{undefined} to
     * be an illegal value.
     */
    function test_baseValidator(self) {
        self.testControl({value: null},
            function (control) {
                self.assertIdentical(control.baseValidator(null), undefined);
                self.assertIdentical(control.baseValidator(1), undefined);
                self.assertIdentical(control.baseValidator('a'), undefined);
                self.assertNotIdentical(
                    control.baseValidator(undefined), undefined);
            });
    });



Methanal.Tests.TestView.BaseTestTextInput.subclass(Methanal.Tests.TestView, 'TestDecimalInput').methods(
    function setUp(self) {
        self.controlType = Methanal.View.DecimalInput;
    },


    /**
     * L{Methanal.View.DecimalInput.makeDisplayValue} creates a human-readable
     * value for valid decimal numbers.
     */
    function test_displayValue(self) {
        self.testControl({value: null, decimalPlaces: 2},
            function (control) {
                var called = 0;
                var displayValue = '';
                control._originalMakeDisplayValue = control.makeDisplayValue;
                control.makeDisplayValue = function (value) {
                    called++;
                    displayValue = control._originalMakeDisplayValue(value);
                    return '';
                };
                control.setValue('NOTAVALIDDECIMAL');
                self.assertIdentical(called, 0);
                control.setValue(1234.56);
                self.assertIdentical(called, 1);
                self.assertIdentical(displayValue, '1,234.56');
                control.onKeyUp(control.inputNode);
                self.assertIdentical(called, 2);
            });
    },


    /**
     * L{Methanal.View.DecimalInput.getValue} returns a C{Float} if the input
     * node's value is a valid decimal number, C{null} if it is blank and
     * C{undefined} if the value is not a valid decimal number.
     */
    function test_getValue(self) {
        self.testControl({value: null, decimalPlaces: 2},
            function (control) {
                control.setValue(null);
                self.assertIdentical(control.getValue(), null);
                control.setValue('');
                self.assertIdentical(control.getValue(), null);
                control.inputNode.value = 'NOTAVALIDDECIMAL';
                self.assertIdentical(control.getValue(), undefined);
                control.setValue(1234.564);
                self.assertIdentical(control.getValue(), 1234.56);
            });
    },


    /**
     * L{Methanal.View.DecimalInput}'s base validator upcalls and modifies the
     * validation message.
     */
    function test_baseValidator(self) {
        self.testControl({value: null, decimalPlaces: 2},
            function (control) {
                self.assertIdentical(control.baseValidator(null), undefined);
                self.assertIdentical(control.baseValidator(undefined),
                    'Numerical value, to a maximum of 2 decimal places only');
                self.assertIdentical(control.baseValidator(1), undefined);
            });
    });
