// import Divmod.UnitTest
// import Methanal.Deps
// import Methanal.Util
// import Methanal.Tests.Util



Methanal.Tests.Util.TestCase.subclass(Methanal.Tests.TestDeps, 'TestDeps').methods(
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
