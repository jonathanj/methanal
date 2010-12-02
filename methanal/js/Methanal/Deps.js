// import Methanal.Util



/**
 * Input dependencies.
 *
 * Inputs may be hidden or displayed depending on the values of other inputs,
 * these are called "dependencies."
 */



/**
 * Derive a dependency function that ensures a value is one of a given set.
 *
 * @type  values: C{Array}
 * @param values: Acceptable values
 */
Methanal.Deps.oneOf = function oneOf(values) {
    return function (v) {
        return Methanal.Util.arrayIndexOf(values, v) !== -1;
    };
};
