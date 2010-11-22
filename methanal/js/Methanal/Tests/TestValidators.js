// import Divmod.UnitTest
// import Methanal.Preds
// import Methanal.Validators
// import Methanal.Util
// import Methanal.Tests.Util



Methanal.Tests.Util.TestCase.subclass(
    Methanal.Tests.TestValidators, 'ValidatorsTestCase').methods(
    /**
     * Assert that C{value} is a valid input for C{validator}.
     */
    function assertValid(self, validator /*...*/) {
        var args = Array.prototype.slice.call(arguments, 2);
        var msg = validator.apply(null, args);
        self.assertIdentical(msg, undefined,
            'Expected valid input for ' + Methanal.Util.repr(validator) +
            ' (' + Methanal.Util.repr(args) + '), got: ' +
            Methanal.Util.repr(msg));
    },


    /**
     * Assert that C{value} is NOT a valid input for C{validator}.
     */
    function assertInvalid(self, validator /*...*/) {
        var args = Array.prototype.slice.call(arguments, 2);
        self.assertNotIdentical(validator.apply(null, args), undefined,
            'Expected invalid input for ' + Methanal.Util.repr(validator) +
            ', got: ' + Methanal.Util.repr(args));
    });



Methanal.Tests.TestValidators.ValidatorsTestCase.subclass(
    Methanal.Tests.TestValidators, 'TestValidators').methods(
    /**
     * Validator with an inverted predicate.
     */
    function test_invert(self) {
        var x = Methanal.Validators.pred(
            Methanal.Preds.invert(Methanal.Preds.lengthOf(3)),
            'Length cannot be 3');
        self.assertValid(x, 'a');
        self.assertValid(x, 'ab');
        self.assertInvalid(x, 'abc');
        self.assertValid(x, 'abcd');
    },


    /**
     * Logical intersection of combined validator results.
     */
    function test_intersection(self) {
        var even = Methanal.Validators.pred(function (n) {
            return n % 2 === 0;
        }, 'Must be even');
        var x = Methanal.Validators.intersection([
            Methanal.Validators.notNull, Methanal.Validators.numeric, even]);
        self.assertValid(x, '2');
        self.assertValid(x, '42');
        self.assertInvalid(x, '3');
        self.assertInvalid(x, 'a');
        self.assertInvalid(x, null);
    },


    /**
     * Create a validator that is only executed if C{pred} is C{true}.
     */
    function test_ifThen(self) {
        var x = Methanal.Validators.ifThen(
            Methanal.Preds.notNull,
            Methanal.Validators.alpha);
        self.assertValid(x, null);
        self.assertValid(x, 'a');
        self.assertValid(x, 'abc');
        self.assertInvalid(x, 'abc1');
        self.assertInvalid(x, 'abc_');
    },


    /**
     * Value is defined and has non-zero, positive length.
     */
    function test_hasLength(self) {
        var hasLength = Methanal.Validators.hasLength;
        self.assertValid(hasLength, 'foo');
        self.assertInvalid(hasLength, '');
        self.assertInvalid(hasLength, null);
    },


    /**
     * Value has a length of exactly C{n}.
     */
    function test_lengthOf(self) {
        var lengthOf = Methanal.Validators.lengthOf;
        self.assertValid(lengthOf(0), '');
        self.assertValid(lengthOf(3), 'foo');
        self.assertInvalid(lengthOf(3), '');
        self.assertInvalid(lengthOf(3), null);
        self.assertInvalid(lengthOf(3), undefined);
    },


    /**
     * Value has a length of at least C{n}.
     */
    function test_lengthAtLeast(self) {
        var lengthAtLeast = Methanal.Validators.lengthAtLeast;
        self.assertValid(lengthAtLeast(2), 'quux');
        self.assertValid(lengthAtLeast(2), 'foo');
        self.assertValid(lengthAtLeast(2), 'hi');
        self.assertInvalid(lengthAtLeast(2), 'a');
        self.assertInvalid(lengthAtLeast(2), '');
        self.assertInvalid(lengthAtLeast(2), null);
        self.assertInvalid(lengthAtLeast(2), undefined);
    },


    /**
     * Value has a length of at most C{n}.
     */
    function test_lengthAtMost(self) {
        var lengthAtMost = Methanal.Validators.lengthAtMost;
        self.assertInvalid(lengthAtMost(2), 'quux');
        self.assertInvalid(lengthAtMost(2), 'foo');
        self.assertValid(lengthAtMost(2), 'hi');
        self.assertValid(lengthAtMost(2), 'a');
        self.assertValid(lengthAtMost(2), '');
        self.assertInvalid(lengthAtMost(2), null);
        self.assertInvalid(lengthAtMost(2), undefined);
    },


    /**
     * Value is not null.
     */
    function test_notNull(self) {
        var notNull = Methanal.Validators.notNull;
        self.assertValid(notNull, 2);
        self.assertValid(notNull, '');
        self.assertValid(notNull, []);
        self.assertInvalid(notNull, null);
    },


    /**
     * Value is within a given range.
     */
    function test_between(self) {
        var between = Methanal.Validators.between;
        self.assertValid(between(0, 3), 1);
        self.assertValid(between(0, 3), 3);
        self.assertValid(between(-3, 3), 0);
        self.assertInvalid(between(-3, 3), 4);
        self.assertInvalid(between(-3, 3), -4);
    },


    /**
     * Value is less than C{n}.
     */
    function test_lessThan(self) {
        var lessThan = Methanal.Validators.lessThan;
        self.assertValid(lessThan(3), 2);
        self.assertValid(lessThan(0), -1);
        self.assertValid(lessThan(-1), -2);
        self.assertInvalid(lessThan(3), 3);
        self.assertInvalid(lessThan(0), 3);
    },


    /**
     * Value is not greater than (or, less than or equal to) C{n}.
     */
    function test_notGreaterThan(self) {
        var notGreaterThan = Methanal.Validators.notGreaterThan;
        self.assertValid(notGreaterThan(3), 2);
        self.assertValid(notGreaterThan(0), -1);
        self.assertValid(notGreaterThan(-1), -2);
        self.assertValid(notGreaterThan(3), 3);
        self.assertInvalid(notGreaterThan(0), 3);
    },


    /**
     * Value is greater than C{n}.
     */
    function test_greaterThan(self) {
        var greaterThan = Methanal.Validators.greaterThan;
        self.assertValid(greaterThan(2), 3);
        self.assertValid(greaterThan(-1), 0);
        self.assertValid(greaterThan(-2), -1);
        self.assertInvalid(greaterThan(3), 3);
        self.assertInvalid(greaterThan(0), -1);
        self.assertInvalid(greaterThan(3), 1);
    },


    /**
     * Value is not less than (or, greater than or equal to) C{n}.
     */
    function test_notLessThan(self) {
        var notLessThan = Methanal.Validators.notLessThan;
        self.assertValid(notLessThan(2), 3);
        self.assertValid(notLessThan(-1), 0);
        self.assertValid(notLessThan(-2), -1);
        self.assertValid(notLessThan(3), 3);
        self.assertInvalid(notLessThan(0), -1);
        self.assertInvalid(notLessThan(3), 1);
    },


    /**
     * Value is one of a given set.
     */
    function test_oneOf(self) {
        var oneOf = Methanal.Validators.oneOf;
        self.assertValid(oneOf(['foo', 'bar']), 'foo');
        self.assertInvalid(oneOf(['foo', 'bar']), 'baz');
        self.assertInvalid(oneOf(['foo', 'bar']), '');
        self.assertInvalid(oneOf([]), 'foo');
        self.assertInvalid(oneOf([]), '');
    },


    /**
     * Value contains only characters matching a regular expression character
     * class.
     */
    function test_isChars(self) {
        var isChars = Methanal.Validators.isChars;
        self.assertValid(isChars('[0-9]'), '0123456789')
        self.assertValid(isChars('[A-Z]'), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ')
        self.assertValid(isChars('[a-z]'), 'abcdefghijklmnopqrstuvwxyz')
        self.assertValid(isChars("[a-z_']"), "hello_world's")
        self.assertInvalid(isChars('[0-9]'), 'hello')
    },


    /**
     * Value consists of only digits.
     */
    function test_numeric(self) {
        var numeric = Methanal.Validators.numeric;
        self.assertValid(numeric, '0123456789');
        self.assertInvalid(numeric, '0a');
        self.assertInvalid(numeric, '0._');
    },


    /**
     * Value consists of only letters.
     */
    function test_alpha(self) {
        var alpha = Methanal.Validators.alpha;
        self.assertValid(alpha, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ')
        self.assertValid(alpha, 'abcdefghijklmnopqrstuvwxyz')
        self.assertInvalid(alpha, '0a');
        self.assertInvalid(alpha, '0._');
    },


    /**
     * Value consists of only letters and digits.
     */
    function test_alphaNumeric(self) {
        var alphaNumeric = Methanal.Validators.alphaNumeric;
        self.assertValid(alphaNumeric, '0123456789');
        self.assertValid(alphaNumeric, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ')
        self.assertValid(alphaNumeric, 'abcdefghijklmnopqrstuvwxyz')
        self.assertValid(alphaNumeric, '0a');
        self.assertInvalid(alphaNumeric, '0._');
    },


    /**
     * Value is a valid, or blank, e-mail address.
     */
    function test_email(self) {
        var email = Methanal.Validators.email;
        self.assertValid(email, null);
        self.assertValid(email, '');
        self.assertValid(email, 'foo@bar.com');
        self.assertValid(email, 'f0o.baz-qu_ux@b4r.com');
        self.assertValid(email, 'f0o.baz-qu_ux@b4r.co.za');
        self.assertValid(email, 'foo+baz@bar.com');
        self.assertInvalid(email, 'hello');
        self.assertInvalid(email, 'hello@');
        self.assertInvalid(email, 'hello@world');
        self.assertInvalid(email, '@bar.com');
        self.assertInvalid(email, '@bar.comhaha');
    },


    /**
     * Value is within a timedelta and a start date.
     */
    function test_dateSince(self) {
        var now = Methanal.Util.Time().oneDay();
        var tomorrow = now.offset(
            Methanal.Util.TimeDelta({'days': 1}));
        var nextDay = now.offset(
            Methanal.Util.TimeDelta({'days': 2}));

        var dateSince = Methanal.Validators.dateSince;
        self.assertValid(
            dateSince(Methanal.Util.TimeDelta({'days': 2}), tomorrow),
            nextDay.asDate());
        self.assertValid(
            dateSince(Methanal.Util.TimeDelta({'days': 2}), tomorrow),
            nextDay.asTimestamp());
        self.assertInvalid(
            dateSince(Methanal.Util.TimeDelta({'hours': 1}), tomorrow),
            nextDay.asDate());
        self.assertInvalid(
            dateSince(Methanal.Util.TimeDelta({'days': 1}), tomorrow),
            nextDay.asTimestamp());
    },


    /**
     * Value is within a timedelta and the current time.
     */
    function test_dateWithin(self) {
        var now = Methanal.Util.Time();
        var tomorrow = now.offset(
            Methanal.Util.TimeDelta({'days': 1, 'minutes': 10}));

        var dateWithin = Methanal.Validators.dateWithin;
        self.assertValid(
            dateWithin(Methanal.Util.TimeDelta({'hours': 1})),
            now.offset(Methanal.Util.TimeDelta({'minutes': 30})).asDate());
        self.assertValid(
            dateWithin(Methanal.Util.TimeDelta({'days': 1,
                                                'minutes': 30})),
            tomorrow.asTimestamp());
        self.assertInvalid(
            dateWithin(Methanal.Util.TimeDelta({'days': 1})),
            tomorrow.asDate());

        var yesterday = now.offset(
            Methanal.Util.TimeDelta({'days': -1, 'minutes': -10}));
        self.assertValid(
            dateWithin(Methanal.Util.TimeDelta({'hours': -1})),
            now.offset(Methanal.Util.TimeDelta({'minutes': -30})).asDate());
        self.assertValid(
            dateWithin(Methanal.Util.TimeDelta({'days': -1,
                                                'minutes': -30})),
            yesterday.asDate());
        // XXX: Fudge it slightly since dateWithin uses the current time and
        // sometimes things take some time.
        self.assertInvalid(
            dateWithin(Methanal.Util.TimeDelta({'days': -1})),
            yesterday.asDate());
        self.assertInvalid(
            dateWithin(Methanal.Util.TimeDelta({'days': -1})),
            yesterday.asTimestamp());
    },


    /**
     * Value is a future date.
     */
    function test_futureDate(self) {
        var now = Methanal.Util.Time();
        var yesterday = now.offset(
            Methanal.Util.TimeDelta({'days': -1})).asDate();
        var tomorrow = now.offset(
            Methanal.Util.TimeDelta({'days': 1})).asDate();
        var futureDate = Methanal.Validators.futureDate;
        self.assertValid(futureDate, tomorrow);
        self.assertInvalid(futureDate, yesterday);
    },


    /**
     * Value is a past date.
     */
    function test_pastDate(self) {
        var now = Methanal.Util.Time();
        var yesterday = now.offset(
            Methanal.Util.TimeDelta({'days': -1})).asDate();
        var tomorrow = now.offset(
            Methanal.Util.TimeDelta({'days': 1})).asDate();
        var pastDate = Methanal.Validators.pastDate;
        self.assertInvalid(pastDate, tomorrow);
        self.assertValid(pastDate, yesterday);
    });
