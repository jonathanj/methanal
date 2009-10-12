// import Divmod.UnitTest
// import Methanal.Deps
// import Methanal.Util
// import Methanal.Tests.Util



Methanal.Tests.Util.TestCase.subclass(
    Methanal.Tests.TestDeps, 'TestDeps').methods(
    /**
     * Assert that C{value} triggers C{dep}.
     */
    function assertDepends(self, dep, value) {
        var repr = Methanal.Util.repr;
        self.assertIdentical(dep(value), true,
            repr(value) + ' does not trigger the dependency for ' + repr(dep));
    },


    /**
     * Assert that C{value} does NOT trigger C{dep}.
     */
    function assertNotDepends(self, dep, value) {
        var repr = Methanal.Util.repr;
        self.assertIdentical(dep(value), false,
            repr(value) + ' triggers the dependency for ' + repr(dep));
    },


    /**
     * L{Methanal.Deps.oneOf} determines whether a given value appears in a
     * specified C{Array}.
     */
    function test_oneOf(self) {
        var oneOf = Methanal.Deps.oneOf;
        self.assertDepends(oneOf(['foo', 'bar']), 'foo');
        self.assertNotDepends(oneOf(['foo', 'bar']), 'baz');
        self.assertNotDepends(oneOf(['foo', 'bar']), '');
        self.assertNotDepends(oneOf([]), 'foo');
        self.assertNotDepends(oneOf([]), '');
    });
