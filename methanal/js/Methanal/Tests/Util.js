// import Divmod.Runtime
// import Divmod.UnitTest



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
 * A mock of a DOM node.
 */
Divmod.Class.subclass(Methanal.Tests.Util, 'MockNode').methods(
    function __init__(self, name) {
        self.name = name;
        self.style = {};
    });



/**
 * A mock of L{Nevow.Athena.Widget}.
 */
Divmod.Class.subclass(Methanal.Tests.Util, 'MockWidget').methods(
    function __init__(self, idNodes) {
        self.node = Methanal.Tests.Util.MockNode('widget');
        if (!idNodes) {
            idNodes = {};
        }
        self._idNodes = idNodes;
    },


    function nodeById(self, id) {
        var node = self._idNodes[id];
        if (!node) {
            throw Divmod.Runtime.NodeNotFound('Node with id ' + id + ' not found');
        }
        return node;
    });
