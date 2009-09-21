// import Divmod.UnitTest
// import Nevow.Test.WidgetUtil
// import Methanal.View
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
Divmod.UnitTest.TestCase.subclass(Methanal.Tests.TestView, 'FormInputTestCase').methods(
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
        control.setWidgetParent(form);
        document.body.appendChild(control.node);
        control.nodeInserted();

        try {
            testingFunc(control);
        } catch (e) {
            throw e;
        } finally {
            document.body.removeChild(control.node);
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
