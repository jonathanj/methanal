// import Divmod.UnitTest
// import Methanal.Deps
// import Methanal.Util



Divmod.UnitTest.TestCase.subclass(Methanal.Tests.TestDeps, 'TestDeps').methods(
    /**
     * Assert that C{a} and C{b} are not identical.
     */
    function assertNotIdentical(self, a, b, /* optional */ message) {
        self.compare(function (x, y) { return x !== y; },
                     '!==', a, b, message);
    },


    /**
     * Assert that C{value} triggers C{dep}.
     */
    function assertDepends(self, dep, value) {
        self.assertIdentical(dep(value), true,
            Methanal.Util.repr(value) + ' does not trigger the dependency for ' +
            Methanal.Util.repr(dep));
    },


    /**
     * Assert that C{value} does NOT trigger C{dep}.
     */
    function assertNotDepends(self, dep, value) {
        self.assertIdentical(dep(value), false,
            Methanal.Util.repr(value) + ' triggers the dependency for ' +
            Methanal.Util.repr(dep));
    },


    function test_oneOf(self) {
        var oneOf = Methanal.Deps.oneOf;
        self.assertDepends(oneOf(['foo', 'bar']), 'foo');
        self.assertNotDepends(oneOf(['foo', 'bar']), 'baz');
        self.assertNotDepends(oneOf(['foo', 'bar']), '');
        self.assertNotDepends(oneOf([]), 'foo');
        self.assertNotDepends(oneOf([]), '');
    });
