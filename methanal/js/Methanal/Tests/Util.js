// import Divmod.UnitTest



Divmod.UnitTest.TestCase.subclass(Methanal.Tests.Util, 'TestCase').methods(
    /**
     * Assert that C{a} and C{b} are not identical.
     */
    function assertNotIdentical(self, a, b, /* optional */ message) {
        self.compare(function (x, y) { return x !== y; },
                     '!==', a, b, message);
    });
