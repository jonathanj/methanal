// import Divmod.MockBrowser



Divmod.MockBrowser.Element.subclass(
    Methanal.Tests.MockBrowser, 'Element').methods(
    function __init__(self, tagName) {
        Methanal.Tests.MockBrowser.Element.upcall(self, '__init__', tagName);
        self.lastChild = null;
    },


    function _updateChildProperties(self) {
        self.firstChild = self.childNodes[0] || null;
        self.lastChild = self.childNodes[self.childNodes.length - 1] || null;
    },


    function appendChild(self, child) {
        Methanal.Tests.MockBrowser.Element.upcall(self, 'appendChild', child);
        self._updateChildProperties();
    },


    function removeChild(self, child) {
        Methanal.Tests.MockBrowser.Element.upcall(self, 'removeChild', child);
        self._updateChildProperties();
    });



/**
 * HTMLSelectElement mock implementation.
 */
Methanal.Tests.MockBrowser.Element.subclass(
    Methanal.Tests.MockBrowser, 'MockHTMLSelectElement').methods(
    function __init__(self) {
        Methanal.Tests.MockBrowser.MockHTMLSelectElement.upcall(
            self, '__init__', 'select');
        self.options = [];
    },


    /**
     * Add a new element to the collection of OPTION elements for this SELECT.
     */
    function add(self, element, before) {
        var index = Methanal.Util.arrayIndexOf(self.options, before);
        if (index == -1) {
            index = self.options.length;
            self.options.push(element);
        } else {
            self.options.splice(index, 0, element);
        }
        element.index = index;
    });



/**
 * HTMLDocument mock implementation.
 */
Divmod.MockBrowser.Document.subclass(
    Methanal.Tests.MockBrowser, 'Document').methods(
    function __init__(self) {
        self._elementTags = {};
        Methanal.Tests.MockBrowser.Document.upcall(self, '__init__');
    },


    /**
     * Register a new type for a tag name.
     */
    function registerElementTag(self, tagName, type) {
        var old = self._elementTags[tagName];
        self._elementTags[tagName] = type;
        return old;
    },


    function createElement(self, tagName) {
        var el;
        if (self._elementTags[tagName]) {
            el = self._elementTags[tagName]();
        } else {
            el = Methanal.Tests.MockBrowser.Element(tagName);
        }
        el._setOwnerDocument(self);
        self._allElements.push(el);
        return el;
    });



// Only override Divmod's mock document.
if (document instanceof Divmod.MockBrowser.Document) {
    if (!(document instanceof Methanal.Tests.MockBrowser.Document)) {
        document = Methanal.Tests.MockBrowser.Document();
        document.registerElementTag(
            'select', Methanal.Tests.MockBrowser.MockHTMLSelectElement);
    }
}
