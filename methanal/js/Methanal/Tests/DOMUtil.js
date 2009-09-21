// import Divmod.MockBrowser



/**
 * HTMLSelectElement mock implementation.
 */
Divmod.MockBrowser.Element.subclass(Methanal.Tests.DOMUtil, 'MockHTMLSelectElement').methods(
    function __init__(self) {
        Methanal.Tests.DOMUtil.MockHTMLSelectElement.upcall(self, '__init__', 'select');
        self.options = [];
    },
    

    /**
     * Add a new element to the collection of OPTION elements for this SELECT.
     */
    function add(self, element, before) {
        var index = Methanal.Util.arrayIndexOf(self.options, before);
        if (index == -1) {
            self.options.push(element);
        } else {
            self.options.splice(index, 0, element);
        }
    });



/**
 * HTMLDocument mock implementation.
 */
Divmod.MockBrowser.Document.subclass(Methanal.Tests.DOMUtil, 'Document').methods(
    function __init__(self) {
        self._elementTags = {};
        Methanal.Tests.DOMUtil.Document.upcall(self, '__init__');
    },


    /**
     * Register a new type for a tag name.
     */
    function registerElementTag(self, tagName, type) {
        self._elementTags[tagName] = type;
    },


    function createElement(self, tagName) {
        var el;
        if (self._elementTags[tagName]) {
            el = self._elementTags[tagName]();
        } else {
            el = Divmod.MockBrowser.Element(tagName);
        }
        el._setOwnerDocument(self);
        self._allElements.push(el);
        return el;
    });



// Only override Divmod's mock document.
if (document instanceof Divmod.MockBrowser.Document) {
    if (!(document instanceof Methanal.Tests.DOMUtil.Document)) {
        document = Methanal.Tests.DOMUtil.Document();
        document.registerElementTag('select', Methanal.Tests.DOMUtil.MockHTMLSelectElement);
    }
}
