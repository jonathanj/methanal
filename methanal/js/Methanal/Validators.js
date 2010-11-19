// import Methanal.Preds



/**
 * Data validations.
 *
 * Validators are attached to form inputs, and help users input accurate data
 * in realtime. A validator returns an error message, as a C{String}, if the
 * data did not pass validation, otherwise C{undefined} is returned to indicate
 * successful validation.
 */



/**
 * Create a validator from a predicate.
 */
Methanal.Validators.pred = function (p, message) {
    return function (/*...*/) {
        if (!p.apply(null, arguments)) {
            return message;
        }
    };
};



/**
 * Logical AND combiner, with short-circuiting, for validator results.
 */
Methanal.Validators.AND = function AND(values) {
    for (var i = 0; i < values.length; ++i) {
        if (values[i] !== undefined) {
            return values[i];
        }
    }
};



/**
 * Logical intersection of combined validator results.
 *
 * @type  fs: C{Array} of C{Function}s
 * @param fs: Validators whose results should be intersected.
 *
 * @rtype: C{Function} taking varargs.
 * @return: Function that can be called, with varargs, to perform the
 *     intersection.
 */
Methanal.Validators.intersection = Methanal.Util.partial(
    Methanal.Preds.combine, Methanal.Validators.AND);



/**
 * Create a validator that is only executed if C{pred} is C{true}.
 */
Methanal.Validators.ifThen = function ifThen(pred, validator) {
    return function (/*...*/) {
        if (pred.apply(null, arguments)) {
            return validator.apply(null, arguments);
        }
    };
};



/**
 * Value is defined and has non-zero, positive length.
 */
Methanal.Validators.hasLength = Methanal.Validators.pred(
    Methanal.Preds.hasLength, 'Value is mandatory');



/**
 * Value has a length of exactly C{n}.
 */
Methanal.Validators.lengthOf = function lengthOf(n) {
    return Methanal.Validators.pred(
        Methanal.Util.partial(Methanal.Preds.lengthOf, n),
        'Value must be exactly ' + n.toString() + ' characters long');
};



/**
 * Value has a length of at least C{n}.
 */
Methanal.Validators.lengthAtLeast = function lengthAtLeast(n) {
    return Methanal.Validators.pred(
        Methanal.Util.partial(Methanal.Preds.lengthAtLeast, n),
        'Value must be at least ' + n.toString() + ' characters long');
};



/**
 * Value has a length of at most C{n}.
 */
Methanal.Validators.lengthAtMost = function lengthAtMost(n) {
    return Methanal.Validators.pred(
        Methanal.Util.partial(Methanal.Preds.lengthAtMost, n),
        'Value must be at most ' + n.toString() + ' characters long');
};



/**
 * Value is not null.
 */
Methanal.Validators.notNull = Methanal.Validators.pred(
    Methanal.Preds.notNull, 'Value is mandatory');



/**
 * Value is within a given range.
 *
 * @type  a: C{number}
 * @param a: The lower-bound inclusive value of the range
 *
 * @type  b: C{number}
 * @param b: The upper-bound inclusive value of the range
 */
Methanal.Validators.between = function between(a, b) {
    return Methanal.Validators.pred(
        Methanal.Util.partial(Methanal.Preds.between, a, b),
        'Value must be between ' + a.toString() + ' and ' + b.toString());
};



/**
 * Value is less than C{n}.
 */
Methanal.Validators.lessThan = function lessThan(n) {
    return Methanal.Validators.pred(
        Methanal.Util.partial(Methanal.Preds.lessThan, n),
        'Value must be less than ' + n.toString());
};



/**
 * Value is not greater than (or, less than or equal to) C{n}.
 */
Methanal.Validators.notGreaterThan = function notGreaterThan(n) {
    return Methanal.Validators.pred(
        Methanal.Util.partial(Methanal.Preds.notGreaterThan, n),
        'Value must be less than or equal to ' + n.toString());
};



/**
 * Value is greater than C{n}.
 */
Methanal.Validators.greaterThan = function greaterThan(n) {
    return Methanal.Validators.pred(
        Methanal.Util.partial(Methanal.Preds.greaterThan, n),
        'Value must be greater than ' + n.toString());
};



/**
 * Value is not less than (or, greater than or equal to) C{n}.
 */
Methanal.Validators.notLessThan = function notLessThan(n) {
    return Methanal.Validators.pred(
        Methanal.Util.partial(Methanal.Preds.notLessThan, n),
        'Value must be greater than or equal to ' + n.toString());
};



/**
 * Value is one of a given set.
 *
 * @type  values: C{Array}
 * @param values: Acceptable values
 */
Methanal.Validators.oneOf = function oneOf(values) {
    return Methanal.Validators.pred(
        Methanal.Util.partial(Methanal.Preds.oneOf, values),
        'Value must be one of: ' + Methanal.Util.repr(values));
};



/**
 * Value contains only characters matching a regular expression character
 * class.
 */
Methanal.Validators.isChars = function isChars(expn) {
    var extractExpn = new RegExp(expn, 'g');
    return function (value) {
        if (!Methanal.Preds.isChars(expn, value)) {
            return 'Invalid characters: ' + value.replace(extractExpn, ' ');
        }
    }
};



/**
 * Value consists of only digits.
 */
Methanal.Validators.numeric = Methanal.Validators.pred(
    Methanal.Util.partial(Methanal.Preds.regex, /^\d*$/),
    'Value must be digits only');

Methanal.Validators.digitsOnly = function digitsOnly(/*...*/) {
    Divmod.warn(
        'digitsOnly is deprecated, use Methanal.Validators.numeric',
        Divmod.DeprecationWarning);
    return Methanal.Validators.numeric.apply(null, arguments);
};



/**
 * Value consists of only letters.
 */
Methanal.Validators.alpha = Methanal.Validators.pred(
    Methanal.Util.partial(Methanal.Preds.regex, /^[A-Za-z]*$/),
    'Value must be letters only');



/**
 * Value consists of only letters and digits.
 */
Methanal.Validators.alphaNumeric = Methanal.Validators.pred(
    Methanal.Util.partial(Methanal.Preds.regex, /^[0-9A-Za-z]*$/),
    'Value must be letters or digits only');



/**
 * Value is a valid, or blank, e-mail address.
 */
Methanal.Validators.email = Methanal.Validators.ifThen(
    Methanal.Preds.hasLength,
    Methanal.Validators.pred(
        Methanal.Util.partial(Methanal.Preds.regex,
            /^([a-zA-Z0-9_\.\-+])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/),
        'Must be blank or a valid e-mail address'));

Methanal.Validators.validEmail = function validEmail(/*...*/) {
    Divmod.warn(
        'validEmail is deprecated, use Methanal.Validators.email',
        Divmod.DeprecationWarning);
    return Methanal.Validators.email.apply(null, arguments);
};



/**
 * Value is within a timedelta and a start date.
 */
Methanal.Validators.dateSince = function dateSince(timedelta, start) {
    var future = timedelta.offset > 0;
    return Methanal.Validators.pred(
        Methanal.Util.partial(Methanal.Preds.dateSince, timedelta, start),
        'Date must be no more than ' + timedelta.asHumanly() +
        ' in the ' + (future ? 'future' : 'past') + ' since ' +
        start.asHumanly());
};



/**
 * Value is within a timedelta and the current time.
 */
Methanal.Validators.dateWithin = function dateWithin(timedelta) {
    var future = timedelta.offset > 0;
    return Methanal.Validators.pred(
        Methanal.Util.partial(Methanal.Preds.dateWithin, timedelta),
        'Date must be no more than ' + timedelta.asHumanly() +
        ' in the ' + (future ? 'future' : 'past'));
};



/**
 * Value is a future date.
 */
Methanal.Validators.futureDate = Methanal.Validators.pred(
    Methanal.Preds.futureDate, 'Date may not be in the past');



/**
 * Value is a past date.
 */
Methanal.Validators.pastDate = Methanal.Validators.pred(
    Methanal.Preds.pastDate, 'Date may not be in the future');
