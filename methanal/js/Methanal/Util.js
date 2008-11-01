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
    while (node.childNodes.length)
        node.removeChild(node.firstChild);
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
