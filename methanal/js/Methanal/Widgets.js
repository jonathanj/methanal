// import Nevow.Athena
// import Methanal.Util


Methanal.Widgets.QueryList = Nevow.Athena.Widget.subclass('Methanal.Widgets.QueryList');
Methanal.Widgets.QueryList.methods(
    function __init__(self, node, args) {
        Methanal.Widgets.QueryList.upcall(self, '__init__', node);

        self.hasActions = self.actions !== undefined && self.actions.length > 0;

        self.columnIDs = args.columnIDs;
        if (self.columnAliases === undefined)
            self.columnAliases = args.columnAliases;

        if (args.rows.length > 0)
            self._rows = args.rows;
        else
            self._rows = null;

        self.cycler = Methanal.Util.cycle('odd', 'even');
    },

    function nodeInserted(self) {
        self.table = self.node.getElementsByTagName('table')[0];
        self.rebuildHeaders();

        if (self._rows !== null)
            self.populate(self._rows);
        else
            self.empty();
    },

    function getBody(self) {
        return self.table.tBodies[0];
    },

    function getRows(self) {
        return self.getBody().rows;
    },

    function empty(self) {
        var table = self.table;
        var tr = table.insertRow(-1);
        Methanal.Util.addElementClass(tr, 'methanal-query-list-empty-row');

        var td = tr.insertCell(-1);
        td.colSpan = table.tHead.rows[0].cells.length;
        Methanal.Util.replaceNodeText(td, 'No items to display');

        Methanal.Util.replaceNodeContent(self.getBody(), [tr]);
        self.rowInserted(null, null, null);
    },

    function rowInserted(self, index, node, rowData) {
        if (node !== null)
            Methanal.Util.addElementClass(node, self.cycler());
    },

    function _makeActionsCell(self, rowData) {
        var doc = self.node.ownerDocument;
        var td = doc.createElement('td');
        for (var i = 0; i < self.actions.length; ++i) {
            var action = self.actions[i];
            var node = action.toNode(self, rowData);
            td.appendChild(node);
        }
        return td;
    },

    function onCellClick(self, url) {
        return true;
    },

    function _cellClickDispatch(url, evt) {
        var _self = Nevow.Athena.Widget.get(this);
        return _self.onCellClick(url);
    },

    function makeCellElement(self, colName, rowData) {
        var doc = self.node.ownerDocument;
        var td = doc.createElement('td');
        var link = rowData['__link__'];
        var a;

        if (link) {
            a = doc.createElement('a');
            if (self.defaultAction) {
                var actionNode = self.defaultAction.toNode(self, rowData);
                a.onclick = actionNode.onclick;
            } else {
                a.onclick = self._cellClickDispatch;
            }
            a.href = link;
        } else {
            a = doc.createElement('span');
        }
        Methanal.Util.replaceNodeText(a, rowData[colName]);
        td.appendChild(a);
        return td;
    },

    function insertRow(self, index, rowData) {
        var doc = self.node.ownerDocument;
        var tr = self.getBody().insertRow(index);
        for (var i = 0; i < self.columnIDs.length; ++i) {
            var cid = self.columnIDs[i];
            tr.appendChild(self.makeCellElement(cid, rowData));
        }

        if (self.hasActions)
            tr.appendChild(self._makeActionsCell(rowData));

        self.rowInserted(index, tr, rowData);
    },

    function appendRow(self, rowData) {
        self.insertRow(-1, rowData);
    },

    function populate(self, rows) {
        for (var i = 0; i < rows.length; ++i)
            self.appendRow(rows[i]);
    },

    function _getColumnAlias(self, id) {
        var alias = self.columnAliases[id];
        return alias ? alias : id;
    },

    function _createHeaderData(self) {
        var headerData = [];
        for (var i = 0; i < self.columnIDs.length; ++i)
            headerData.push(self.columnIDs[i]);

        if (self.hasActions)
            headerData.push('actions');

        return headerData;
    },

    function rebuildHeaders(self) {
        self.table.deleteTHead();

        var headerData = self._createHeaderData();
        var thead = self.table.createTHead();
        var tr = thead.insertRow(-1);
        for (var i = 0; i < headerData.length; ++i) {
            var td = tr.insertCell(-1);
            td.id = headerData[i];
            Methanal.Util.replaceNodeText(td, self._getColumnAlias(td.id));
        }
    });
