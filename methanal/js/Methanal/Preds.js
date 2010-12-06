// import Methanal.Util



/**
 * Gather the results of functions and combine them.
 *
 * For example::
 *
 *     combine(c, [f, g])(x, y) -> c([f(x, y), g(x, y)])
 *
 * @type  c: C{Function} taking one C{Array} parameter
 * @param c: Combining function.
 *
 * @type  fs: C{Array} of C{Function}s
 * @param fs: Functions to gather the results of. Each function is called with
 *     the same arguments.
 *
 * @rtype: C{Function} taking varargs.
 * @return: Function that can be called, with varargs, to perform the combining.
 */
Methanal.Preds.combine = function combine(c, fs) {
    return function _combine(/*...*/) {
        var vs = [];
        for (var i = 0; i < fs.length; ++i) {
            vs.push(fs[i].apply(null, arguments));
        }
        return c(vs);
    };
};



/**
 * Logically AND values together.
 *
 * @type  values: C{Array} of C{Boolean}.
 */
Methanal.Preds.AND = function AND(values) {
    return Methanal.Util.reduce(
        function _and(a, b) { return !!(a && b); }, values);
};



/**
 * Logical intersection of combined predicate results.
 *
 * @type  fs: C{Array} of C{Function}s
 * @param fs: Predicates whose results will be combined.
 *
 * @rtype: C{Function} taking varargs.
 * @return: Function that can be called, with varargs, to perform the
 *     combining.
 */
Methanal.Preds.intersection = Methanal.Util.partial(
    Methanal.Preds.combine, Methanal.Preds.AND);



/**
 * Logically OR values together.
 *
 * @type  values: C{Array} of C{Boolean}.
 */
Methanal.Preds.OR = function OR(values) {
    return Methanal.Util.reduce(
        function _or(a, b) { return !!(a || b); }, values);
};



/**
 * Logical union of combined predicate results.
 *
 * @type  fs: C{Array} of C{Function}s
 * @param fs: Predicates whose results will be combined.
 *
 * @rtype: C{Function} taking varargs.
 * @return: Function that can be called, with varargs, to perform the
 *     combining.
 */
Methanal.Preds.union = Methanal.Util.partial(
    Methanal.Preds.combine, Methanal.Preds.OR);



/**
 * Logically XOR values together.
 *
 * @type  values: C{Array} of C{Boolean}.
 */
Methanal.Preds.XOR = function XOR(values) {
    return Methanal.Util.reduce(
        function _xor(a, b) { return !!(a ^ b); }, values);
};



/**
 * Logical symmetric difference of combined predicate results.
 *
 * @type  fs: C{Array} of C{Function}s
 * @param fs: Predicates whose results will be combined.
 *
 * @rtype: C{Function} taking varargs.
 * @return: Function that can be called, with varargs, to perform the
 *     combining.
 */
Methanal.Preds.symmetricDifference = Methanal.Util.partial(
    Methanal.Preds.combine, Methanal.Preds.XOR);



/**
 * Predicate is inverted.
 */
Methanal.Preds.invert = function (p) {
    return function (/*...*/) {
        return !p.apply(null, arguments);
    };
};



/**
 * Value is C{true} when evaluated as a boolean.
 */
Methanal.Preds.isTrue = function isTrue(value) {
    return !!value;
};



/**
 * Value is C{false} when evaluated as a boolean.
 */
Methanal.Preds.isFalse = function isFalse(value) {
    return !value;
};



var partial = Methanal.Util.partial;



/**
 * Value is identical to C{is}.
 */
function valueIs(is, value) {
    return value === is;
}
Methanal.Preds.valueIs = partial(partial, valueIs);



/**
 * Value is defined and has non-zero, positive length.
 */
Methanal.Preds.hasLength = function hasLength(value) {
    return Methanal.Preds.isTrue(value) && value.length > 0;
};



/**
 * Value is not defined or has zero length.
 */
Methanal.Preds.empty = function empty(value) {
    return Methanal.Preds.isFalse(value) || value.length === 0;
};



/**
 * Value has a length of exactly C{n}.
 */
function lengthOf(n, value) {
    return value != null && value.length === n;
}
Methanal.Preds.lengthOf = partial(partial, lengthOf);



/**
 * Value has a length of at least C{n}.
 */
function lengthAtLeast(n, value) {
    return value != null && value.length >= n;
}
Methanal.Preds.lengthAtLeast = partial(partial, lengthAtLeast);



/**
 * Value has a length of at most C{n}.
 */
function lengthAtMost(n, value) {
    return value != null && value.length <= n;
}
Methanal.Preds.lengthAtMost = partial(partial, lengthAtMost);



/**
 * Value is not null.
 */
Methanal.Preds.notNull = function notNull(value) {
    return value !== null;
};



/**
 * Value is within a given range.
 *
 * @type  a: C{number}
 * @param a: The lower-bound inclusive value of the range
 *
 * @type  b: C{number}
 * @param b: The upper-bound inclusive value of the range
 */
function between(a, b, value) {
    return value >= a && value <= b;
}
Methanal.Preds.between = partial(partial, between);



/**
 * Value is less than C{n}.
 */
function lessThan(n, value) {
    return value < n;
}
Methanal.Preds.lessThan = partial(partial, lessThan);



/**
 * Value is not greater than (or, less than or equal to) C{n}.
 */
function notGreaterThan(n, value) {
    return value <= n;
}
Methanal.Preds.notGreaterThan = partial(partial, notGreaterThan);



/**
 * Value is greater than C{n}.
 */
function greaterThan(n, value) {
    return value > n;
}
Methanal.Preds.greaterThan = partial(partial, greaterThan);



/**
 * Value is not less than (or, greater than or equal to) C{n}.
 */
function notLessThan(n, value) {
    return value >= n;
}
Methanal.Preds.notLessThan = partial(partial, notLessThan);



/**
 * Value is a multiple of C{n}.
 */
function multipleOf(n, value) {
    return value !== 0 && value % n === 0;
}
Methanal.Preds.multipleOf = partial(partial, multipleOf);



/**
 * Value is one of a given set.
 *
 * @type  values: C{Array}
 * @param values: Acceptable values
 */
function oneOf(values, value) {
    return Methanal.Util.arrayIndexOf(values, value) !== -1;
}
Methanal.Preds.oneOf = partial(partial, oneOf);



/**
 * Value contains a subset (in no particular order) of an C{Array}.
 *
 * @type subset: C{Array}
 */
function arraySubset(subset, value) {
    for (var i = 0; i < subset.length; ++i) {
        if (Methanal.Util.arrayIndexOf(value, subset[i]) === -1) {
            return false;
        }
    }
    return true;
}
Methanal.Preds.arraySubset = partial(partial, arraySubset);



/**
 * Value contains only characters matching a regular expression character
 * class.
 *
 * @type expn: C{String}
 */
function isChars(expn, value) {
    var filterExpn = new RegExp('^(' + expn + ')+$');
    return filterExpn.test(value);
}
Methanal.Preds.isChars = partial(partial, isChars);



/**
 * Value matches a regular expression.
 *
 * @type expn: C{RegExp}
 */
function regex(expn, value) {
    return expn.test(value);
}
Methanal.Preds.regex = partial(partial, regex);



/**
 * Value is within a timedelta and a start date.
 *
 * @type timedelta: L{Methanal.Util.TimeDelta}
 *
 * @type start: L{Methanal.Util.Time}
 *
 * @type value: C{Date} or C{Number}
 */
function dateSince(timedelta, start, value) {
    var t = start.offset(timedelta).asDate();
    // Make some lives easier.
    if (value && !(value instanceof Date)) {
        value = new Date(value);
    }
    return timedelta.offset > 0 ? value < t : value > t;
}
Methanal.Preds.dateSince = partial(partial, dateSince);



/**
 * Value is within a timedelta and the current time.
 *
 * @type timedelta: L{Methanal.Util.TimeDelta}
 *
 * @type value: C{Date}
 */
Methanal.Preds.dateWithin = function dateWithin(timedelta) {
    return Methanal.Preds.dateSince(timedelta, Methanal.Util.Time());
};



/**
 * Value is a future date.
 *
 * @type value: C{Date}
 */
Methanal.Preds.futureDate = function futureDate(value) {
    return (new Date()) <= value;
};



/**
 * Value is a past date.
 *
 * @type value: C{Date}
 */
Methanal.Preds.pastDate = Methanal.Preds.invert(Methanal.Preds.futureDate);
