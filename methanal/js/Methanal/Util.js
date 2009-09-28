// import Nevow.Athena



/**
 * Add a class to an element's "className" attribute.
 *
 * This operation is intended to preserve any other values that were already
 * present.
 *
 * @type node: DOM node
 *
 * @type  cls: C{String}
 * @param cls: CSS class name to add
 */
Methanal.Util.addElementClass = function addElementClass(node, cls) {
    var current = node.className;

    // Trivial case, no "className" yet.
    if (current == undefined || current.length === 0) {
        node.className = cls;
        return;
    }

    // Other trivial case, already set as the only class.
    if (current == cls) {
        return;
    }

    // Non-trivial case.
    var classes = current.split(' ');
    for (var i = 0; i < classes.length; ++i) {
        if (classes[i] === cls) {
            return;
        }
    }
    node.className += ' ' + cls;
};



/**
 * Remove all occurences of class from an element's "className" attribute.
 *
 * This operation is intended to preserve any other values that were already
 * present.
 *
 * @type node: DOM node
 *
 * @type  cls: C{String}
 * @param cls: CSS class name to remove
 */
Methanal.Util.removeElementClass = function removeElementClass(node, cls) {
    var current = node.className;

    // Trivial case, no "className" yet.
    if (!current) {
        return;
    }

    // Other trivial case, set only to "className".
    if (current == cls) {
        node.className = '';
        return;
    }

    // Non-trivial case.
    var classes = current.split(' ');
    for (var i = 0; i < classes.length; ++i) {
        if (classes[i] === cls) {
            classes.splice(i, 1);
            node.className = classes.join(' ');
            i--;
        }
    }
};



/**
 * Remove all the children of a node.
 *
 * @type node: DOM node
 */
Methanal.Util.removeNodeContent = function removeNodeContent(node) {
    while (node.lastChild)
        node.removeChild(node.lastChild);
};



/**
 * Replace all of a node's children with new ones.
 *
 * @type node: DOM node
 *
 * @type children: C{Array}
 */
Methanal.Util.replaceNodeContent = function replaceNodeContent(node, children) {
    Methanal.Util.removeNodeContent(node);
    for (var i = 0; i < children.length; ++i)
        node.appendChild(children[i]);
};



/**
 * Replace a node's text node with new text.
 *
 * @type node: DOM node
 *
 * @type text: C{String}
 */
Methanal.Util.replaceNodeText = function replaceNodeText(node, text) {
    Methanal.Util.replaceNodeContent(node,
        [node.ownerDocument.createTextNode(text)]);
};



// XXX: what does this do that's special again?
// XXX: i think maybe it exposes more information when called by IE
Methanal.Util.formatFailure = function formatFailure(failure) {
    var text = failure.error.description;
    if (!text)
        text = failure.toString();
    return text;
};



/**
 * Convert a string to a base-10 integer.
 *
 * Not quite as simple to do properly as one might think.
 *
 * @type s: C{String}
 *
 * @rtype: C{Integer}
 */
Methanal.Util.strToInt = function strToInt(s) {
    if (typeof s !== 'string')
        return undefined;

    if (s.indexOf('x') !== -1)
        return undefined;

    if (isNaN(s))
        return undefined;

    return parseInt(s, 10);
};



/**
 * Pretty print a decimal number with thousands separators.
 *
 * Useful for formatting large currency amounts in a human-readable way.
 *
 * @type  value: C{number}
 *
 * @rtype: C{String}
 */
Methanal.Util.formatDecimal = function formatDecimal(value) {
    var value = value.toString();
    var l = value.split('')
    var pointIndex = value.indexOf('.');
    pointIndex = pointIndex > -1 ? pointIndex : value.length;

    for (var i = pointIndex - 3; i >= 1; i -= 3) {
        l.splice(i, 0, ',');
    }

    return l.join('');
};



/**
 * Create a callable that cycles through the initial inputs.
 *
 * Like Python's C{itertools.cycle} function.
 *
 * @rtype: C{function}
 * @return: A function that returns the next object in the sequence
 */
Methanal.Util.cycle = function cycle(/*...*/) {
    var i = -1;
    var args = arguments;
    var n = args.length;
    return function () {
        i = ++i % n;
        return args[i];
    };
};



/**
 * Find the index of a value in an array.
 *
 * @type  a: C{Array}
 *
 * @param v: Value to determine the index of in L{a}
 *
 * @rtype:  C{number}
 * @return: Index of the value in the array, or C{-1} if not found
 */
Methanal.Util.arrayIndexOf = function arrayIndexOf(a, v) {
    for (var i = 0; i < a.length; ++i)
        if (a[i] === v)
            return i;
    return -1;
};



// XXX: DEPRECATED.
Methanal.Util.detachWidget = function detachWidget(widget) {
    Divmod.msg('Deprecated: Use Nevow.Athena.Widget instead');
    widget.detach();
};



/**
 * Call a widget's (and all child widgets') C{nodeInserted} method.
 */
Methanal.Util.nodeInserted = function nodeInserted(widget) {
    if (widget.nodeInserted !== undefined)
        widget.nodeInserted();

    for (var i = 0; i < widget.childWidgets.length; ++i)
        Methanal.Util.nodeInserted(widget.childWidgets[i]);
};



/**
 * Left fold on a list.
 *
 * Applies a function of two arguments cumulatively to the elements of a list
 * from left to right, so as to reduce the list to a single value.
 *
 * @type f: C{function} taking two arguments
 * @param f: The reducing function
 *
 * @type xs: C{Array}
 * @param xs: The list to reduce
 *
 * @param z: The initial value, if not C{undefined}
 *
 * @raise Error: If L{xs} is empty and L{z} is not defined
 *
 * @return: The reduced value
 **/
Methanal.Util.reduce = function reduce(f, xs, z) {
    if (xs.length === 0) {
        if (z === undefined) {
            throw new Error('Empty list and no initial value');
        } else {
            return z;
        }
    }

    if (xs.length === 1 && z === undefined) {
        return xs[0];
    }

    var acc;
    if (z === undefined) {
        acc = xs[0];
    } else {
        acc = f(z, xs[0]);
    }

    for (var i = 1; i < xs.length; ++i) {
        acc = f(acc, xs[i]);
    }

    return acc;
};



/**
 * Quote quote characters in a string.
 */
Methanal.Util._reprString = function _reprString(o) {
    return ('"' + o.replace(/([\"\\])/g, '\\$1') + '"'
        ).replace(/[\f]/g, "\\f"
        ).replace(/[\b]/g, "\\b"
        ).replace(/[\n]/g, "\\n"
        ).replace(/[\t]/g, "\\t"
        ).replace(/[\r]/g, "\\r");
};



/**
 * Represent an object in a human-readable form.
 *
 * @rtype: C{String}
 */
Methanal.Util.repr = function repr(o) {
    if (o === null)
        return 'null';
    if (typeof(o) == 'string') {
        return Methanal.Util._reprString(o);
    } else if (typeof(o) == 'undefined') {
        return 'undefined';
    } else if (typeof(o) == 'function') {
        if (o.name)
            return '<function ' + o.name + '>';
    } else if (o instanceof Array) {
        return o.toSource();
    }
    return o.toString();
};



/**
 * Right justify a string to a given length with padding.
 *
 * @type  s: C{String}
 * 
 * @type  width: C{Integer}
 * @param width: Justification width
 *
 * @type  padding: C{String}
 * @param padding: Padding character, defaults to a space
 *
 * @rtype: C{String}
 */
Methanal.Util.rjust = function rjust(s, width, padding/*= " "*/) {
    padding = padding || ' ';
    for (var i = s.length; i < width; ++i) {
        s = padding[0] + s;
    }
    return s;
};



/**
 * Apply C{f} over each value in C{seq} and gather the results.
 */
Methanal.Util.map = function map(f, seq) {
    if (typeof f !== 'function') {
        throw new Error('"f" must be a function');
    }
    var results = [];
    for (var i = 0; i < seq.length; ++i) {
        results.push(f(seq[i]));
    }
    return results;
};



/**
 * Find the quotient and remainder of two numbers.
 */
Methanal.Util.divmod = function divmod(x, y) {
    return [(x - x % y) / y, x % y];
};



/**
 * Throbber helper.
 *
 * Finds a node with the ID "throbber" and provides convenience functions
 * to operate it.
 *
 * @type toggleDisplay: C{String}
 * @ivar toggleDisplay: When defined, specifies the C{style.display} attribute
 *     value used when making the throbber visible
 *
 * @type _node: DOM node
 * @ivar _node: DOM node of the throbber graphic
 */
Divmod.Class.subclass(Methanal.Util, 'Throbber').methods(
    /**
     * Create the throbber helper.
     *
     * @type  widget: L{Nevow.Athena.Widget}
     * @param widget: The widget containing the throbber node
     */
    function __init__(self, widget, toggleDisplay) {
        self._node = widget.nodeById('throbber');
        self.toggleDisplay = toggleDisplay;
    },


    /**
     * Display the throbber.
     */
    function start(self) {
        self._node.style.visibility = 'visible';
        if (self.toggleDisplay !== undefined)
            self._node.style.display = self.toggleDisplay;
    },


    /**
     * Hide the throbber.
     */
    function stop(self) {
        self._node.style.visibility = 'hidden';
        if (self.toggleDisplay !== undefined)
            self._node.style.display = 'none';
    });



/**
 * An unordered collection of unique C{String} elements.
 */
Divmod.Class.subclass(Methanal.Util, 'StringSet').methods(
    /**
     * Initialise the set.
     *
     * @type  seq: C{Array} of C{String}
     * @param seq: Strings to initialise the set with
     */
    function __init__(self, seq) {
        var s = {};
        if (seq) {
            for (var i = 0; i < seq.length; ++i)
                s[seq[i]] = true;
        }
        self._set = s;
    },


    /**
     * Apply a function over each element of the set.
     */
    function each(self, fn) {
        for (var name in self._set)
            fn(name);
    },


    /**
     * Test whether C{value} is in the set.
     */
    function contains(self, value) {
        return self._set[value] === true;
    });



/**
 * A duration of time, expressed as milliseconds.
 *
 * This provides a convenient way to obtain a duration without resorting to
 * manual calculations::
 *
 *     Methanal.Util.TimeDelta({'days':    2,
 *                              'hours':   5,
 *                              'minutes': 37})
 *
 * @type  values: C{object} mapping C{String} to C{Number}
 * @param values: Mapping of time units to duration, valid units are: C{days},
 *     C{hours}, C{minutes}, C{seconds}, C{milliseconds}
 *
 * @rtype:  C{Number}
 * @return: The amount of time L{values} represents, in milliseconds
 */
Methanal.Util.TimeDelta = function TimeDelta(values) {
    var _offset = (values.days || 0) * 3600 * 24 * 1000;
    _offset += (values.hours || 0) * 3600 * 1000;
    _offset += (values.minutes || 0) * 60 * 1000;
    _offset += (values.seconds || 0) * 1000;
    _offset += (values.milliseconds || 0);
    return _offset;
};



/**
 * Parsing a time string failed.
 */
Divmod.Error.subclass(Methanal.Util, 'TimeParseError');



/**
 * A high-level object built on top of C{Date}.
 *
 * @type _date: C{Date}
 * @ivar _date: Underlying Date instance
 *
 * @type _oneDay: C{boolean}
 * @ivar _oneDay: Is this a truncated Time instance?
 */
Divmod.Class.subclass(Methanal.Util, 'Time').methods(
    function __init__(self) {
        self._date = new Date();
        self._oneDay = false;
    },


    /**
     * C{Date} representation.
     */
    function asDate(self) {
        return self._date;
    },


    /**
     * The number of milliseconds since the epoch.
     */
    function asTimestamp(self) {
        return self._date.getTime();
    },


    /**
     * A human-readable string representation.
     */
    function asHumanly(self, twentyFourHours) {
        var _date = self._date;
        var r = [];
        r.push(self.getDayName(true) + ',');
        r.push(_date.getDate().toString());
        r.push(self.getMonthName(true));
        r.push(_date.getFullYear().toString());

        if (!self._oneDay) {
            function _humanlyTime(dateWithTime, twentyFourHours) {
                var prefix = '';
                var hours = dateWithTime.getHours();
                if (!twentyFourHours) {
                    var dm = Methanal.Util.divmod(hours, 12);
                    prefix = dm[0] > 0 ? ' pm' : ' am';
                    hours = dm[1] == 0 ? 12 : dm[1];
                }

                function pad(v) {
                    return Methanal.Util.rjust(v.toString(), 2, '0');
                };

                var r = [];
                r.push(hours);
                r.push(dateWithTime.getMinutes());
                r.push(dateWithTime.getSeconds());
                r = Methanal.Util.map(pad, r);
                return r.join(':') + prefix;
            }

            r.push(_humanlyTime(_date, twentyFourHours));
        }

        return r.join(' ');
    },


    /**
     * Get the name of the day of the week.
     *
     * @type  shortened: C{boolean}
     * @param shortened: Use a 3-letter shortening of the name
     *
     * @rtype: C{String}
     */
    function getDayName(self, shortened) {
        var name = Methanal.Util.Time._dayNames[self._date.getDay()];
        return shortened ? name.substr(0, 3) : name;
    },


    /**
     * Get the name of the month.
     *
     * @type  shortened: C{boolean}
     * @param shortened: Use a 3-letter shortening of the name
     *
     * @rtype: C{String}
     */
    function getMonthName(self, shortened) {
        var name = Methanal.Util.Time._monthNames[self._date.getMonth()];
        return shortened ? name.substr(0, 3) : name;
    },


    /**
     * Truncate to a date.
     *
     * @rtype: L{Methanal.Util.Time}
     * @return: A new instance representing the truncated date
     */
    function oneDay(self) {
        var d = new Date(
            self._date.getFullYear(),
            self._date.getMonth(),
            self._date.getDate());
        var t = Methanal.Util.Time.fromDate(d);
        t._oneDay = true;
        return t;
    },
    

    /**
     * Offset the current instance by some amount of time.
     *
     * @type  delta: C{Number}
     * @param delta: An amount of time to offset the current instance by, in
     *      milliseconds
     *
     * @rtype: L{Methanal.Util.Time}
     * @return: A new instance representing the newly offset time
     */
    function offset(self, delta) {
        var d = new Date(self.asTimestamp() + delta);
        var t = Methanal.Util.Time.fromDate(d);
        t._oneDay = self._oneDay;
        return t;
    });



Methanal.Util.Time._dayNames = [
    'Sunday', 'Monday', 'Tuesday', 'Wednesday',
    'Thursday', 'Friday', 'Saturday'];
Methanal.Util.Time._monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];



/**
 * Create a L{Methanal.Util.Time} instance from a C{Date}.
 */
Methanal.Util.Time.fromDate = function fromDate(dateObj) {
    var t = Methanal.Util.Time();
    t._date = dateObj;
    return t;
};



/**
 * Create a L{Methanal.Util.Time} instance from a timestamp in milliseconds.
 */
Methanal.Util.Time.fromTimestamp = function fromTimestamp(timestamp) {
    return Methanal.Util.Time.fromDate(new Date(timestamp));
};



/**
 * Create a L{Methanal.Util.Time} instance from a relative date reference.
 *
 * @type  value: C{String}
 * @param value: Relative date reference, valid values are: C{today},
 *     C{yesterday}, C{tomorrow} and any day of the week's name (which should
 *     be at least 3 letters long)
 *
 * @raise Methanal.Util.TimeParseError: If no information can be gleaned from
 *     L{value} 
 *
 * @rtype: L{Methanal.Util.Time}
 */
Methanal.Util.Time.fromRelative = function fromRelative(value, _today) {
    var today = (_today ? _today : Methanal.Util.Time()).oneDay();

    value = value.toLowerCase();
    switch (value) {
        case 'today':
            return today;
        case 'yesterday':
            return today.offset(Methanal.Util.TimeDelta({'days': -1}));
        case 'tomorrow':
            return today.offset(Methanal.Util.TimeDelta({'days': 1}));
    }

    if (value.length >= 3) {
        var dayNames = Methanal.Util.Time._dayNames;
        for (var i = 0; i < dayNames.length; ++i) {
            if (dayNames[i].toLowerCase().indexOf(value) == 0) {
                var todayDay = today.asDate().getDay();
                if (i <= todayDay)
                    i += 7;
                return today.offset(
                    Methanal.Util.TimeDelta({'days': i - todayDay}));
            }
        }
    }

    throw new Methanal.Util.TimeParseError(
        'Unknown relative value: ' + Methanal.Util._reprString(value));
};



/**
 * Determine whether C{year} is a leap year.
 */
Methanal.Util.Time.isLeapYear = function isLeapYear(year) {
    if (year % 100 == 0)
        return (year % 400 == 0);
    return (year % 4 == 0);
};



Methanal.Util.Time._monthLengths = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

/**
 * Get the number of days for C{month} in C{year}.
 */
Methanal.Util.Time.getMonthLength = function getMonthLength(year, month) {
    if (month == 1 && Methanal.Util.Time.isLeapYear(year))
        return 29;
    return Methanal.Util.Time._monthLengths[month];
};



/**
 * Create a L{Methanal.Util.Time} instance from a semi-structured string.
 *
 * @type  value: C{String}
 * @param value: Either a numerical YYYYMMDD or DDMMYYY string (separated by
 *     C{/}, C{.} or C{-}) or a relative time reference, as supported by
 *     L{Methanal.Util.Time.fromRelative}
 *
 * @rtype: L{Methanal.Util.Time}
 */
Methanal.Util.Time.guess = function guess(value) {
    function _splitDate() {
        var delims = ['-', '/', '.'];
        for (var i = 0; i < delims.length; ++i) {
            var parts = value.split(delims[i]);
            if (parts.length == 3)
                return parts;
        }
        return null;
    };

    function _validDate(year, month, day) {
        if (year > 0 && month >= 0 && month < 12)
            return day > 0 && day <= Methanal.Util.Time.getMonthLength(year, month);
        return false;
    };

    try {
        return Methanal.Util.Time.fromRelative(value);
    } catch (e) {
        if (!(e instanceof Methanal.Util.TimeParseError))
            throw e;
    }

    var parts = _splitDate();
    if (parts !== null) {
        var y, m, d;

        m = Methanal.Util.strToInt(parts[1]) - 1;
        if (parts[0].length == 4) {
            y = Methanal.Util.strToInt(parts[0]);
            d = Methanal.Util.strToInt(parts[2]);
        } else if (parts[2].length == 4) {
            d = Methanal.Util.strToInt(parts[0]);
            y = Methanal.Util.strToInt(parts[2]);
        }

        if (_validDate(y, m, d))
            // TODO: In the future, "guess" should be able to guess times as
            // well as dates.
            return Methanal.Util.Time.fromDate(new Date(y, m, d)).oneDay();
    }

    throw new Methanal.Util.TimeParseError(
        'Unguessable value: ' + Methanal.Util._reprString(value));
};
