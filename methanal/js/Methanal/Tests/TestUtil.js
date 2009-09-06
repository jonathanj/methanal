// import Divmod.UnitTest
// import Methanal.Util



Divmod.UnitTest.TestCase.subclass(Methanal.Tests.TestUtil, 'TestUtil').methods(
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



/**
 * Tests for L{Methanal.Util.Time}.
 *
 * @type _knownTime: L{Methanal.Util.Time}
 * @ivar _knownTime: A known point in time
 */
Divmod.UnitTest.TestCase.subclass(Methanal.Tests.TestUtil, 'TestTime').methods(
    function setUp(self) {
        self._knownTime = Methanal.Util.Time.fromDate(
            new Date(2009, 8, 6, 1, 36, 23, 2));
    },


    /**
     * L{Methanal.Util.TimeDelta} correctly specifies a given duration in
     * milliseconds.
     */
    function test_timedelta(self) {
        var td = Methanal.Util.TimeDelta({'days': 1});
        self.assertIdentical(td, 1000 * 3600 * 24);

        var td = Methanal.Util.TimeDelta({'days': -1});
        self.assertIdentical(td, 1000 * 3600 * -24);

        var td = Methanal.Util.TimeDelta({'days': 1,
                                          'hours': 2});
        self.assertIdentical(td, 1000 * 3600 * 26);

        var td = Methanal.Util.TimeDelta({'days': 1,
                                          'hours': 2,
                                          'minutes': 3});
        self.assertIdentical(td, 1000 * (3600 * 26 + 60 * 3));

        var td = Methanal.Util.TimeDelta({'days': 1,
                                          'hours': 2,
                                          'minutes': 3,
                                          'seconds': 4});
        self.assertIdentical(td, 1000 * (3600 * 26 + 60 * 3 + 4));

        var td = Methanal.Util.TimeDelta({'days': 1,
                                          'hours': 2,
                                          'minutes': 3,
                                          'seconds': 4,
                                          'milliseconds': 5});
        self.assertIdentical(td, 1000 * (3600 * 26 + 60 * 3 + 4) + 5);
    },


    /**
     * L{Methanal.Util.Time.guess} creates a L{Methanal.Util.Time} instance
     * when given an input format it can parse, otherwise
     * L{Methanal.Util.TimeParseError} is thrown.
     */
    function test_guess(self) {
        self.assertIdentical(
            Methanal.Util.Time.guess('2009/9/1').asTimestamp(),
            1251756000000);
        self.assertIdentical(
            Methanal.Util.Time.guess('2009.09.01').asTimestamp(),
            1251756000000);
        self.assertIdentical(
            Methanal.Util.Time.guess('2009-09-01').asTimestamp(),
            1251756000000);
        self.assertIdentical(
            Methanal.Util.Time.guess('1/9/2009').asTimestamp(),
            1251756000000);
        self.assertIdentical(
            Methanal.Util.Time.guess('01.09.2009').asTimestamp(),
            1251756000000);
        self.assertIdentical(
            Methanal.Util.Time.guess('01-09-2009').asTimestamp(),
            1251756000000);

        self.assertThrows(
            Methanal.Util.TimeParseError,
            function() { return Methanal.Util.Time.guess(''); });
        self.assertThrows(
            Methanal.Util.TimeParseError,
            function() { return Methanal.Util.Time.guess('hello'); });
    },


    /**
     * Create a L{Methanal.Util.Time} instance from a C{Date}.
     */
    function test_fromDate(self) {
        var d = new Date();
        var t = Methanal.Util.Time.fromDate(d);
        self.assertIdentical(t.asTimestamp(), d.getTime());
    },


    /**
     * Create a L{Methanal.Util.Time} instance from a valid relative time
     * reference, while invalid references throw
     * L{Methanal.Util.TimeParseError}.
     */
    function test_fromRelative(self) {
        var today = self._knownTime;

        var t = Methanal.Util.Time.fromRelative('tomorrow', today);
        self.assertIdentical(t.asHumanly(), 'Mon, 7 Sep 2009');
        var t = Methanal.Util.Time.fromRelative('yesterday', today);
        self.assertIdentical(t.asHumanly(), 'Sat, 5 Sep 2009');
        var t = Methanal.Util.Time.fromRelative('today', today);
        self.assertIdentical(t.asHumanly(), 'Sun, 6 Sep 2009');

        var t = Methanal.Util.Time.fromRelative('sun', today);
        self.assertIdentical(t.asHumanly(), 'Sun, 13 Sep 2009');
        var t = Methanal.Util.Time.fromRelative('mon', today);
        self.assertIdentical(t.asHumanly(), 'Mon, 7 Sep 2009');
        var t = Methanal.Util.Time.fromRelative('satur', today);
        self.assertIdentical(t.asHumanly(), 'Sat, 12 Sep 2009');

        self.assertThrows(
            Methanal.Util.TimeParseError,
            function() {
                return Methanal.Util.Time.fromRelative('', today);
            });
        self.assertThrows(
            Methanal.Util.TimeParseError,
            function() {
                return Methanal.Util.Time.fromRelative('hello', today);
            });
    },


    /**
     * L{Methanal.Util.Time.asDate} converts a Time into a C{Date} representing
     * the same time.
     */
    function test_asDate(self) {
        var t = Methanal.Util.Time();
        var d = t.asDate();
        self.assertIdentical(t.asTimestamp(), d.getTime());
    },


    /**
     * L{Methanal.Util.Time.asTimestamp} converts a Time into the number of
     * milliseconds elapsed since the epoch.
     */
    function test_asTimestamp(self) {
        self.assertIdentical(self._knownTime.asTimestamp(), 1252193783002);
    },


    /**
     * L{Methanal.Util.Time.asHumanly} converts a Time into a human-readable
     * string. Times that have been truncated to a date have an appropriately
     * accurate human-readable version.
     */
    function test_asHumanly(self) {
        self.assertIdentical(
            self._knownTime.asHumanly(), 'Sun, 6 Sep 2009 01:36:23');
        self.assertIdentical(
            self._knownTime.oneDay().asHumanly(), 'Sun, 6 Sep 2009');
    },


    /**
     * L{Methanal.Util.Time.oneDay} truncates a Time to only a date.
     */
    function test_oneDay(self) {
        var t = Methanal.Util.Time();
        var od = t.oneDay().asDate();
        t = t.asDate();
        self.assertIdentical(od.getFullYear(), t.getFullYear());
        self.assertIdentical(od.getMonth(), t.getMonth());
        self.assertIdentical(od.getDate(), t.getDate());
        self.assertIdentical(od.getHours(), 0);
        self.assertIdentical(od.getMinutes(), 0);
        self.assertIdentical(od.getSeconds(), 0);
        self.assertIdentical(od.getMilliseconds(), 0);
    },

    
    /**
     * L{Methanal.Util.Time.offset} offsets a Time by the given number of
     * milliseconds.
     */
    function test_offset(self) {
        var t = self._knownTime.offset(Methanal.Util.TimeDelta({'days': -1}));
        self.assertIdentical(t.asTimestamp(), 1252107383002);
        self.assertIdentical(t.oneDay().asHumanly(), 'Sat, 5 Sep 2009');

        var t = self._knownTime.offset(Methanal.Util.TimeDelta({'days': 1}));
        self.assertIdentical(t.asTimestamp(), 1252280183002);
        self.assertIdentical(t.oneDay().asHumanly(), 'Mon, 7 Sep 2009');
    });
