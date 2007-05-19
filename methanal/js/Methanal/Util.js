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


Methanal.Util.removeNodeContent = function removeNodeContent(node) {
    while (node.childNodes.length)
        node.removeChild(node.firstChild);
};


Methanal.Util.replaceNodeContent = function replaceNodeContent(node, children) {
    Methanal.Util.removeNodeContent(node);
    for (var i = 0; i < children.length; ++i)
        node.appendChild(children[i]);
};


Methanal.Util.replaceNodeText = function replaceNodeText(node, text) {
    Methanal.Util.replaceNodeContent(node, [node.ownerDocument.createTextNode(text)]);
};


Methanal.Util.formatFailure = function formatFailure(failure) {
    var text = failure.error.description;
    if (!text)
        text = failure.toString();
    return text;
};


Methanal.Util.strToInt = function strToInt(s) {
    if (typeof s !== 'string')
        return undefined;

    if (s.indexOf('x') !== -1)
        return undefined;

    if (isNaN(s))
        return undefined;

    return parseInt(s, 10);
};


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
