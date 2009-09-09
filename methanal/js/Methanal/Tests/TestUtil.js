// import Divmod.UnitTest
// import Methanal.Util



Divmod.UnitTest.TestCase.subclass(Methanal.Tests.TestUtil, 'TestUtil').methods(
    /**
     * L{Methanal.Util.strToInt} converts a base-10 integer value, represented as a
     * C{String}, to an C{Integer}.
     */
    function test_strToInt(self) {
        var CASES = [
            ['1234', 1234],
            ['01234', 1234],
            ['001234', 1234],
            ['019', 19],
            ['123abc', undefined],
            ['abc123', undefined],
            ['0x123', undefined]];

        for (var i = 0; i < CASES.length; ++i) {
            var input = CASES[i][0];
            var expected = CASES[i][1];
            var actual = Methanal.Util.strToInt(input);
            self.assert(expected === actual, 'input = ' + input + ' :: expected = ' + expected + ' :: actual = ' + actual);
        }
    },


    /**
     * Applies a function of two arguments cumulatively to the elements of a
     * list from left to right, so as to reduce the list to a single value.
     */
    function test_reduce(self) {
        var reduce = Methanal.Util.reduce;

        function add(x, y) {
            return x + y;
        }

        function multiply(x, y) {
            return x * y;
        }

        self.assertIdentical(reduce(add, [1, 2, 3]), 6);
        self.assertIdentical(reduce(multiply, [1, 2, 3], 10), 60);
        self.assertThrows(Error, function () { return reduce(add, []); });
        self.assertIdentical(reduce(add, [], 10), 10);
        self.assertIdentical(reduce(add, [10]), 10);
    },


    /**
     * Test L{Methanal.Util._reprString} correctly escapes various whitespace
     * characters.
     */
    function test_reprString(self) {
        var s = '\r\n\f\b\t';
        var repr = Methanal.Util._reprString(s);
        var expected = "\"\\r\\n\\f\\b\\t\"";
        self.assertIdentical(repr, expected);
    });



Divmod.UnitTest.TestCase.subclass(Methanal.Tests.TestUtil, 'TestStringSet').methods(
    /**
     * Supply no parameters creates an empty set.
     */
    function test_empty(self) {
        var s = Methanal.Util.StringSet();
        s.each(function () {
            self.assert(false, 'Set is not empty');
        });
    },
    

    /**
     * L{Methanal.Util.StringSet.each} applies a function over all elements
     * of the set.
     */
    function test_each(self) {
        var called = 0;
        var values = ['a', 'b'];
        var s = Methanal.Util.StringSet(values);
        s.each(function (name) {
            var index = Methanal.Util.arrayIndexOf(values, name);
            self.assert(index !== -1, '"' + name + '" should be in the set!');
            values.splice(index, 1);
            called += 1;
        });
        self.assertIdentical(called, 2);
        self.assertIdentical(values.length, 0);
    },
    

    /**
     * L{Methanal.Util.StringSet.contains} correctly reports the presence of
     * a value in the set.
     */
    function test_contains(self) {
        var s = Methanal.Util.StringSet(['a', 'b']);
        self.assertIdentical(s.contains('a'), true);
        self.assertIdentical(s.contains('b'), true);
        self.assertIdentical(s.contains('c'), false);
    });
