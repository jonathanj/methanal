// import Divmod.Runtime
// import Divmod.UnitTest
// import Nevow.Test.WidgetUtil



Divmod.UnitTest.TestCase.subclass(Methanal.Tests.Util, 'TestCase').methods(
    /**
     * Assert that C{a} and C{b} are not identical.
     */
    function assertNotIdentical(self, a, b, /* optional */ message) {
        self.compare(function (x, y) { return x !== y; },
                     '!==', a, b, message);
    },


    function assertIsInstanceOf(self, instance, type) {
        var repr = Methanal.Util.repr;
        self.assertIdentical(true, instance instanceof type,
            repr(instance) + ' is not an instance of ' + repr(type));
    });



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
Methanal.Tests.Util.makeWidgetChildNode =
function makeWidgetChildNode(widget, tagName, id) {
    var node = document.createElement(tagName);
    if (id) {
        node.id = widget.translateNodeId(id);
    }
    widget.node.appendChild(node);
    return node;
};



/**
 * Quickly add form actions and other essential nodes to a C{LiveForm}.
 */
Methanal.Tests.Util.setUpForm = function setUpForm(form) {
    var makeWidgetChildNode = Methanal.Tests.Util.makeWidgetChildNode;
    makeWidgetChildNode(form, 'span', 'form-error');

    var actions = Methanal.View.ActionContainer(
        Nevow.Test.WidgetUtil.makeWidgetNode(), {'actionIDs': {}});
    makeWidgetChildNode(actions, 'img', 'throbber');

    form.addChildWidget(actions);
    form.node.appendChild(actions.node);
    form.setActions(actions);
    document.body.appendChild(form.node);
};
