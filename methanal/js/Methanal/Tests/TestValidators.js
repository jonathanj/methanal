// import Divmod.UnitTest
// import Methanal.Validators
// import Methanal.Util



Divmod.UnitTest.TestCase.subclass(Methanal.Tests.TestValidators, 'TestValidators').methods(
    /**
     * Assert that C{a} and C{b} are not identical.
     */
    function assertNotIdentical(self, a, b, /* optional */ message) {
        self.compare(function (x, y) { return x !== y; },
                     '!==', a, b, message);
    },


    /**
     * Assert that C{value} is a valid input for C{validator}.
     */
    function assertValid(self, validator, value) {
        self.assertIdentical(validator(value), undefined,
            Methanal.Util.repr(value) + ' is NOT valid input for ' +
            Methanal.Util.repr(validator));
    },


    /**
     * Assert that C{value} is NOT a valid input for C{validator}.
     */
    function assertInvalid(self, validator, value) {
        self.assertNotIdentical(validator(value), undefined,
            Methanal.Util.repr(value) + ' is valid input for ' +
            Methanal.Util.repr(validator));
    },


    function test_hasLength(self) {
        var hasLength = Methanal.Validators.hasLength;
        self.assertValid(hasLength, 'foo');
        self.assertInvalid(hasLength, '');
        self.assertInvalid(hasLength, null);
    },
    
    
    function test_digitsOnly(self) {
        var digitsOnly = Methanal.Validators.digitsOnly;
        self.assertValid(digitsOnly, '');
        self.assertValid(digitsOnly, '1234');
        self.assertInvalid(digitsOnly, 'abc');
        self.assertInvalid(digitsOnly, '1b');
        self.assertInvalid(digitsOnly, null);
    },


    function test_validEmail(self) {
        var validEmail = Methanal.Validators.validEmail;
        self.assertValid(validEmail, '');
        self.assertValid(validEmail, 'foo@bar.com');
        self.assertValid(validEmail, 'f0o.baz-qu_ux@b4r.com');
        self.assertValid(validEmail, 'f0o.baz-qu_ux@b4r.co.za');
        self.assertInvalid(validEmail, 'hello');
        self.assertInvalid(validEmail, 'hello@');
        self.assertInvalid(validEmail, 'hello@world');
        self.assertInvalid(validEmail, 'foo+baz@bar.com');
        self.assertInvalid(validEmail, '@bar.com');
        self.assertInvalid(validEmail, '@bar.comhaha');
    },


    function test_notNull(self) {
        var notNull = Methanal.Validators.notNull;
        self.assertValid(notNull, '');
        self.assertValid(notNull, 1);
        self.assertValid(notNull, {});
        self.assertValid(notNull, []);
        self.assertValid(notNull, undefined);
        self.assertInvalid(notNull, null);
    },


    function test_between(self) {
        var between = Methanal.Validators.between;
        self.assertValid(between(1, 100), 1);
        self.assertValid(between(1, 1), 1);
        self.assertInvalid(between(1, 100), 0);
        self.assertInvalid(between(100, 1), 1);
    });
