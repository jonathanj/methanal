/**
 * Data validations.
 *
 * Validators are attached to form inputs, and help users input accurate data
 * in realtime. A validator returns an error message, as a C{String}, if the
 * data did not pass validation, otherwise C{undefined} is returned to indicate
 * successful validation.
 */



/**
 * Value is defined and has non-zero, positive length.
 */
Methanal.Validators.hasLength = function hasLength(value) {
    if (value === null || value.length == 0)
        return 'Value is mandatory';
};



/**
 * Value consists of only digits.
 */
Methanal.Validators.digitsOnly = function digitsOnly(value) {
    if (!/^\d*$/.test(value))
        return 'Value must be digits only';
};



/**
 * Value is a valid, or blank, e-mail address.
 */
Methanal.Validators.validEmail = function validEmail(email) {
    if (email.length == 0)
        return undefined;

    var regex = /^([a-zA-Z0-9_\.\-])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/;
    if (!regex.test(email))
        return 'Must be blank, or a valid e-mail address'
};



/**
 * Value is not null.
 */
Methanal.Validators.notNull = function notNull(value) {
    if (value === null)
        return 'Value is mandatory';
};



/**
 * Derive a validator function that ensures a value is in a given range.
 *
 * @type  a: C{number}
 * @param a: The lower-bound inclusive value of the range
 *
 * @type  b: C{number}
 * @param b: The upper-bound inclusive value of the range
 */
Methanal.Validators.between = function between(a, b) {
    return function (v) {
        if (v < a || v > b)
            return 'Value must be between ' + a.toString() + ' and ' + b.toString();
    };
};
