// import Divmod.UnitTest
// import Methanal.View



Divmod.UnitTest.TestCase.subclass(Methanal.Tests.TestMethanal, 'TestMethanal').methods(
    function test_basic(self) {
        var getData = function getData(name) {
            return 10;
        };

        var update = function update(name, values) {
            self.assertArraysEqual(values, [true, false]);
            self._called = true;
        };

        var cache = Methanal.View._HandlerCache(getData, update);
        cache.addHandler(function (x) { return x == 10; }, ['foo'], ['foo']);
        cache.addHandler(function (x) { return x != 10; }, ['foo'], ['foo']);
        cache.refresh();
        self._called = false;
        cache.changed('foo');
        self.assert(self._called);
    });
