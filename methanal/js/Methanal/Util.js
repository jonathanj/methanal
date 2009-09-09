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
        Fusion.Util.Throbber.upcall(self, '__init__');
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
