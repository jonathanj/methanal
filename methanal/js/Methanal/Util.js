// import Nevow.Athena

/**
 * Add a class to an element's "className" attribute.
 *
 * This operation is intended to preserve any other values that were already
 * present.
 */
Methanal.Util.addElementClass = function addElementClass(node, cls) {
    var current = node.className;

    // trivial case, no className yet
    if (current == undefined || current.length === 0) {
        node.className = cls;
        return;
    }

    // the other trivial case, already set as the only class
    if (current == cls) {
        return;
    }

    var classes = current.split(' ');
    for (var i = 0; i < classes.length; ++i) {
        if (classes[i] === cls) {
            return;
        }
    }
    node.className += ' ' + cls;
};


/**
 * Remove a class from an element's "className" attribute.
 *
 * This operation is intended to preserve any other values that were already
 * present.
 */
Methanal.Util.removeElementClass = function removeElementClass(node, cls) {
    var current = node.className;

    // trivial case, no className yet
    if (current == undefined || current.length === 0) {
        return;
    }

    // other trivial case, set only to className
    if (current == cls) {
        node.className = "";
        return;
    }

    // non-trivial case
    var classes = current.split(' ');
    for (var i = 0; i < classes.length; ++i) {
        if (classes[i] === cls) {
            classes.splice(i, 1);
            node.className = classes.join(' ');
            return;
        }
    }
};


/**
 * Remove all the children of a node.
 */
Methanal.Util.removeNodeContent = function removeNodeContent(node) {
    while (node.lastChild)
        node.removeChild(node.lastChild);
};


/**
 * Replace all of a node's children with new ones.
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
 */
Methanal.Util.replaceNodeText = function replaceNodeText(node, text) {
    Methanal.Util.replaceNodeContent(node, [node.ownerDocument.createTextNode(text)]);
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
 * Pretty print a decimal number.
 *
 * Useful for formatting large currency amounts in a human-readable way.
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
 * Create a callable that cycles through the initial inputs when called.
 */
Methanal.Util.cycle = function cycle(/*...*/) {
    var i = -1;
    var args = arguments;
    var n = args.length;
    return function () {
        i = ++i % n;
        return args[i];
    };
}

/**
 * Find the index of C{v} in the array C{a}.
 *
 * @return: Index of C{v} in C{a} or C{-1} if not found.
 */
Methanal.Util.arrayIndexOf = function arrayIndexOf(a, v) {
    for (var i = 0; i < a.length; ++i)
        if (a[i] === v)
            return i;
    return -1;
};


Methanal.Util.detachWidget = function detachWidget(widget) {
    var children = widget.widgetParent.childWidgets;
    var index = Methanal.Util.arrayIndexOf(children, widget);
    if (index !== -1)
        children.splice(index, 1);

    delete Nevow.Athena.Widget._athenaWidgets[widget._athenaID];
};


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
 * @param f: The reducing function.
 *
 * @param xs: The list to reduce.
 *
 * @param z: If not undefined, used as the initial value.
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
}

/**
 * Return a URL friendly version of the specified string.
 *
 * @param value: The value to slugify.
 **/
Methanal.Util.slugify = function (value) {
    value = value.toLowerCase();
    value = value.replace(/[^a-z0-9-\s]/g, '');
    value = value.replace(/[-\s]+/g, '-');
    return value;
}
