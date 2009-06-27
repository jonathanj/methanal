// import Nevow.Athena
// import Methanal.Util
// import Methanal.View
// import Methanal.Validators


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
        self.defaultActionNavigates = false;
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
        if (_self.defaultAction) {
            var rv = this._onclick(evt);
            if (!_self.defaultActionNavigates)
                return rv;
        }

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
                a._onclick = actionNode.onclick;
            }
            a.onclick = self._cellClickDispatch;
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
            var cell = self.makeCellElement(cid, rowData);
            if (i == 0) {
                // Thank you IE6 for failing at life.
                Methanal.Util.addElementClass(cell, 'first-child');
            }
            tr.appendChild(cell);
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

        var doc = self.node.ownerDocument;
        var thead = doc.createElement('thead');
        var tr = doc.createElement('tr');
        for (var i = 0; i < headerData.length; ++i) {
            var td = doc.createElement('td');
            td.id = headerData[i];
            Methanal.Util.replaceNodeText(td, self._getColumnAlias(td.id));
            tr.appendChild(td);
        }
        thead.appendChild(tr);
        self.table.appendChild(thead)
    });


Methanal.Widgets.FilterList = Nevow.Athena.Widget.subclass('Methanal.Widgets.FilterList');
Methanal.Widgets.FilterList.methods(
    function __init__(self, node) {
        Methanal.Widgets.FilterList.upcall(self, '__init__', node);

        self.currentResultWidget = null;
    },

    function setResultWidget(self, widgetInfo) {
        var resultsNode = self.nodeById('results');

        var d = self.widgetParent.addChildWidgetFromWidgetInfo(widgetInfo);
        d.addCallback(function (widget) {
            if (self.currentResultWidget !== null) {
                Methanal.Util.detachWidget(self.currentResultWidget);
                resultsNode.removeChild(self.currentResultWidget.node);
            } else {
                resultsNode.style.display = 'block';
            }

            resultsNode.appendChild(widget.node);
            Methanal.Util.nodeInserted(widget);
            self.currentResultWidget = widget;
        });
        return d;
    });


Methanal.Widgets.FilterListForm = Methanal.View.LiveForm.subclass('Methanal.Widgets.FilterListForm');
Methanal.Widgets.FilterListForm.methods(
    function submitSuccess(self, widgetInfo) {
        return self.widgetParent.setResultWidget(widgetInfo);
    });


Methanal.Widgets.Rollup = Nevow.Athena.Widget.subclass('Methanal.Widgets.Rollup');
Methanal.Widgets.Rollup.methods(
    function __init__(self, node, params) {
        Methanal.Widgets.Rollup.upcall(self, '__init__', node);
        self.expanded = false;
        self.params = params;
    },

    function nodeInserted(self) {
        self.detailsNode = self.nodeById('content');
        self.buttonNode = self.nodeById('roll-button');
        self.totalNode = self.nodeById('summary-total');
        self.summaryDescNode = self.nodeById('summary-description');
        self.throbberNode = self.nodeById('throbber');

        self.update(self.params);
    },

    function enableThrobber(self) {
        self.throbberNode.style.visibility = 'visible';
    },

    function disableThrobber(self) {
        self.throbberNode.style.visibility = 'hidden';
    },

    function toggleExpand(self) {
        self.expanded = !self.expanded;

        self.detailsNode.style.display = self.expanded ? 'block' : 'none';

        var buttonNode = self.buttonNode;
        if (self.expanded) {
            Methanal.Util.addElementClass(buttonNode, 'roll-up');
            Methanal.Util.removeElementClass(buttonNode, 'roll-down');
        } else {
            Methanal.Util.removeElementClass(buttonNode, 'roll-up');
            Methanal.Util.addElementClass(buttonNode, 'roll-down');
        }
        return false;
    },

    function update(self, params) {
        var summary = params['summary'];
        summary = summary === undefined ? '' : summary;
        Methanal.Util.replaceNodeText(self.summaryDescNode, summary);
    });


Methanal.Widgets.Lookup = Methanal.View.FormInput.subclass('Methanal.Widgets.Lookup');


Methanal.Widgets.SimpleLookupForm = Methanal.View.SimpleForm.subclass('Methanal.Widgets.SimpleLookupForm');
Methanal.Widgets.SimpleLookupForm.methods(
    function __init__(self, node, controlNames) {
        Methanal.Widgets.SimpleLookupForm.upcall(self, '__init__', node, controlNames);

        var V = Methanal.Validators;
        self.addValidators([
            [['__results'], [V.notNull]]]);
    },

    function setOptions(self, values) {
        var resultsWidget = self.getControl('__results');
        var resultsNode = resultWidgets.inputNode;
        while (resultsNode.options.length)
            resultsNode.remove(0);

        var doc = self.node.ownerDocument;
        for (var i = 0; i < values.length; ++i) {
            var optionNode = doc.createElement('option');
            optionNode.value = values[i][0];
            optionNode.appendChild(doc.createTextNode(values[i][1]));
            resultsNode.appendChild(optionNode);
        }

        var value = resultsNode.options.length > 0 ? resultsNode.options[0] : null;
        resultWidgets.setValue(value);
        resultWidgets.onChange();
    },

    function valueChanged(self, control) {
        Methanal.Widgets.SimpleLookupForm.upcall(self, 'valueChanged', control);

        if (control.name === '__results')
            return;

        var values = {};
        for (var controlName in self.controls) {
            var control = self.getControl(controlName);
            values[controlName] = control.getValue();
        }

        var d = self.widgetParent.callRemote('populate', values);
        d.addCallback(function (values) {
            self.setOptions(values);
        });
    });
