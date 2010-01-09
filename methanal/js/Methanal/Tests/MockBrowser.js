// import Divmod.MockBrowser



Divmod.MockBrowser.Element.subclass(
    Methanal.Tests.MockBrowser, 'Element').methods(
    function __init__(self, tagName) {
        Methanal.Tests.MockBrowser.Element.upcall(self, '__init__', tagName);
        self._updateChildProperties();
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
 * HTMLTableRowElement mock implementation.
 */
Methanal.Tests.MockBrowser.Element.subclass(
    Methanal.Tests.MockBrowser, 'MockHTMLTableRowElement').methods(
    function __init__(self) {
        Methanal.Tests.MockBrowser.MockHTMLTableRowElement.upcall(
            self, '__init__', 'tr');
        self.cells = [];
    },


    /**
     * Insert an empty TD cell into this row. If index is -1 or equal to the
     * number of cells, the new cell is appended.
     */
    function insertCell(self, index) {
        var cell = document.createElement('td');
        if (index == -1) {
            self.cells.push(cell);
        } else {
            self.cells.splice(index, 0, cell);
        }
        return cell;
    });



/**
 * HTMLTableSectionElement mock implementation.
 */
Methanal.Tests.MockBrowser.Element.subclass(
    Methanal.Tests.MockBrowser, 'MockHTMLTableSectionElement').methods(
    function __init__(self, tagName) {
        Methanal.Tests.MockBrowser.MockHTMLTableSectionElement.upcall(
            self, '__init__', tagName);
        self.rows = [];
    },
    
    
    /**
     * Insert a new empty row in the table. The new row is inserted immediately
     * before and in the same section as the current indexth row in the table.
     * If index is -1 or equal to the number of rows, the new row is appended.
     * In addition, when the table is empty the row is inserted into a TBODY
     * which is created and inserted into the table.
     */
    function insertRow(self, index) {
        var row = document.createElement('tr');
        if (index == -1) {
            self.rows.push(row);
        } else {
            self.rows.splice(index, 0, row);
        }
        return row;
    });



/**
 * HTMLTableElement mock implementation.
 */
Methanal.Tests.MockBrowser.Element.subclass(
    Methanal.Tests.MockBrowser, 'MockHTMLTableElement').methods(
    function __init__(self) {
        Methanal.Tests.MockBrowser.MockHTMLTableElement.upcall(
            self, '__init__', 'table');
        self.deleteTHead();
        self.tBodies = [document.createElement('tbody')];
    },


    /**
     * Delete the header from the table, if one exists.
     */
    function deleteTHead(self) {
        self.tHead = null;
    },
    

    /**
     * Create a table header row or return an existing one.
     */
    function createTHead(self) {
        if (self.tHead !== null) {
            return self.tHead;
        }
        self.tHead = document.createElement('thead');
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
            el = self._elementTags[tagName](tagName);
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
        document.registerElementTag(
            'table', Methanal.Tests.MockBrowser.MockHTMLTableElement);
        document.registerElementTag(
            'thead', Methanal.Tests.MockBrowser.MockHTMLTableSectionElement);
        document.registerElementTag(
            'tbody', Methanal.Tests.MockBrowser.MockHTMLTableSectionElement);
        document.registerElementTag(
            'tr', Methanal.Tests.MockBrowser.MockHTMLTableRowElement);
    }
}
