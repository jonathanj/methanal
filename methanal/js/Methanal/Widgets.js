// import Nevow.Athena
// import Methanal.Util
// import Methanal.View
// import Methanal.Validators



/**
 * A widget that displays data tabulated according to a set of columns.
 *
 * @type _columnIDs: C{Array}
 * @ivar _columnIDs: Identifiers to match row data to the relevant columns
 *
 * @type _rows: C{Array} of C{object} mapping C{String} to C{String}
 * @ivar _rows: Sequence of row data objects that map column identifiers
 *     to values; of specific interest is the C{__link__} key, which is
 *     the URL to use for anchor hrefs for rows
 *
 * @type _cycler: C{function}
 * @ivar _cycler: Generate alternating class names for the row style
 *
 * @type columnAliases: C{object} mapping C{String} to C{String}
 * @ivar columnAliases: Mapping of column identifiers to human readable column
 *     names
 *
 * @type actions: C{Array} of L{Mantissa.ScrollTable.Action}
 * @ivar actions: Performable actions on table rows, listed in a new column
 *     with the identifier "actions"
 *
 * @type defaultAction: L{Mantissa.ScrollTable.Action}
 * @ivar defaultAction: The action to perform when clicking on a table row
 *
 * @type defaultActionNavigates: C{boolean}
 * @ivar defaultActionNavigates: Flag indicating whether navigation should
 *     continue or not when L{defaultAction} is invoked, the default is
 *     C{false}
 */
Nevow.Athena.Widget.subclass(Methanal.Widgets, 'QueryList').methods(
    /**
     * Create a QueryList.
     *
     * @param args.columnIDs: See L{_columnIDs}
     *
     * @param args.columnAliases: See L{columnAliases}
     *
     * @param args.rows: See L{_rows}
     */
    function __init__(self, node, args) {
        Methanal.Widgets.QueryList.upcall(self, '__init__', node);

        self._hasActions = self.actions !== undefined && self.actions.length > 0;

        self._columnIDs = args.columnIDs;
        if (self.columnAliases === undefined)
            self.columnAliases = args.columnAliases;

        if (args.rows.length > 0)
            self._rows = args.rows;
        else
            self._rows = null;

        self._cycler = Methanal.Util.cycle('odd', 'even');
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


    /**
     * Get the DOM node for the body of the QueryList.
     */
    function getBody(self) {
        return self.table.tBodies[0];
    },


    /**
     * Get the DOM collection that represents the QueryList's rows.
     */
    function getRows(self) {
        return self.getBody().rows;
    },


    /**
     * Get the DOM node of a particular row.
     *
     * @type  rowIndex: C{Integer}
     */
    function getRowNode(self, rowIndex) {
        return self.getRows()[rowIndex];
    },


    /**
     * Get the DOM node of a particular cell in a row.
     *
     * @type  rowIndex: C{Integer}
     *
     * @type  columnID: C{String}
     * @param columnID: Column identifier
     */
    function getCellNode(self, rowIndex, columnID) {
        for (var i = 0; i < self._columnIDs.length; ++i) {
            if (self._columnIDs[i] == columnID) {
                return self.getRowNode(rowIndex).cells[i];
            }
        }
        throw new Error('No such column ID: ' + columnID);
    },


    /**
     * Event callback called after a row is inserted into the QueryList.
     *
     * The base implementation performs row color alternating.
     *
     * @type  index: C{Integer}
     * @param index: Index of the row in the table
     *
     * @type  node: DOM node
     * @param node: Row element node
     *
     * @type  rowData: C{object} mapping C{String} to C{String}
     * @param rowData: Mapping of column identifiers to values
     */
    function rowInserted(self, index, node, rowData) {
        if (node !== null)
            Methanal.Util.addElementClass(node, self._cycler());
    },


    /**
     * Event callback called after a row is removed from the QueryList.
     *
     * @type  index: C{Integer}
     * @param index: Index of the row in the table
     */
    function rowRemoved(self, index) {
    },


    /**
     * Create the actions column cell.
     */
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


    /**
     * Event callback called when a cell is clicked.
     *
     * If L{defaultAction} is defined then this is only called if
     * L{defaultActionNavigates} is C{false}.
     *
     * @rtype:  C{boolean}
     * @return: Determine whether or not navigation should proceed
     */
    function onCellClick(self, url) {
        return true;
    },


    /**
     * Event handler for cell "onclick" event.
     */
    function _cellClickDispatch(url, evt) {
        var _self = Nevow.Athena.Widget.get(this);
        if (_self.defaultAction) {
            var rv = this._onclick(evt);
            if (!_self.defaultActionNavigates)
                return rv;
        }

        return _self.onCellClick(url);
    },


    /**
     * Create a QueryList cell node for the given column.
     *
     * @type  columnID: C{String}
     * @param columnID: Column identifier
     *
     * @type  rowData: C{object} mapping C{String} to C{String}
     * @param rowData: Mapping of column identifiers to values; if the
     *     C{__link__} key is defined a clickable node is created
     *
     * @rtype: DOM node
     */
    function createCellElement(self, columnID, rowData) {
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
        Methanal.Util.replaceNodeText(a, rowData[columnID]);
        td.appendChild(a);
        return td;
    },


    function makeCellElement(self, columnID, rowData) {
        Divmod.msg('WARNING: QueryList.makeCellElement is deprecated. ' +
                   'Use QueryListcreateCellElement instead.');
        return self.createCellElement(columnID, rowData);
    },


    /**
     * Create a row, and all contained cells, for the given row data.
     *
     * @type  rowData: C{object} mapping C{String} to C{String}
     * @param rowData: Mapping of column identifiers to values; if the
     *     C{__link__} key is defined a clickable node is created
     *
     * @rtype: DOM node
     */
    function createRowNode(self, rowData) {
        var tr = self.node.ownerDocument.createElement('tr');

        for (var i = 0; i < self._columnIDs.length; ++i) {
            var cid = self._columnIDs[i];
            var cell = self.createCellElement(cid, rowData);
            if (i == 0) {
                // Thank you IE6 for failing at life.
                Methanal.Util.addElementClass(cell, 'first-child');
            }
            tr.appendChild(cell);
        }

        if (self._hasActions)
            tr.appendChild(self._makeActionsCell(rowData));

        return tr;
    },


    /**
     * Insert a row.
     *
     * @type  index: C{Integer}
     * @param index: Index to insert the row before, C{-1} will append the row
     *
     * @type  rowData: C{object} mapping C{String} to C{String}
     * @param rowData: Mapping of column identifiers to values
     */
    function insertRow(self, index, rowData) {
        var doc = self.node.ownerDocument;
        var tr = self.createRowNode(rowData);
        var before = index >= 0 ? self.getBody().rows[index] : null;
        self.getBody().insertBefore(tr, before);
        self.rowInserted(index, tr, rowData);
    },


    /**
     * Append a row.
     *
     * @type  rowData: C{object} mapping C{String} to C{String}
     * @param rowData: Mapping of column identifiers to values
     */
    function appendRow(self, rowData) {
        self.insertRow(-1, rowData);
    },


    /**
     * Remove a row.
     *
     * @type  rowIndex: C{Integer}
     * @param rowIndex: Index of the row to remove
     */
    function removeRow(self, rowIndex) {
        self.getBody().deleteRow(rowIndex);
        self.rowRemoved(rowIndex);
    },


    /**
     * Empty the table and show a placeholder.
     */
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


    /**
     * Populate the QueryList.
     *
     * @type  rows: C{Array} of C{object} mapping C{String} to C{String}
     * @param rows: Sequence of row data objects that map column identifiers
     *     to values
     */
    function populate(self, rows) {
        for (var i = 0; i < rows.length; ++i)
            self.appendRow(rows[i]);
    },


    /**
     * Determine a column alias from a column identifier.
     */
    function _getColumnAlias(self, id) {
        var alias = self.columnAliases[id];
        return alias ? alias : id;
    },


    /**
     * Determine the column identifiers for the QueryList header.
     *
     * @rtype:  C{Array} of C{String}
     */
    function _createHeaderData(self) {
        var headerData = [];
        for (var i = 0; i < self._columnIDs.length; ++i)
            headerData.push(self._columnIDs[i]);

        if (self._hasActions)
            headerData.push('actions');

        return headerData;
    },


    /**
     * Create the QueryList header element.
     */
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



/**
 * A filtering search widget.
 *
 * Essentially just a form that results in a server-side call, on submission,
 * and a result widget.
 *
 * @type _currentResultWidget: L{Nevow.Athena.Widget}
 * @ivar _currentResultWidget: Current result widget; everytime a new result
 *     is generated, the old widget is detached
 */
Nevow.Athena.Widget.subclass(Methanal.Widgets, 'FilterList').methods(
    function __init__(self, node) {
        Methanal.Widgets.FilterList.upcall(self, '__init__', node);
        self._currentResultWidget = null;
    },


    /**
     * Set the result widget.
     *
     * If a result widget was previously set, it is detached and removed
     * from the DOM.
     *
     * @param widgetInfo: Athena widget information to create a new child widget
     *     from
     *
     * @rtype:  C{Deferred}
     * @return: Deferred that fires when the result widget has been set
     */
    function setResultWidget(self, widgetInfo) {
        var resultsNode = self.nodeById('results');

        var d = self.widgetParent.addChildWidgetFromWidgetInfo(widgetInfo);
        d.addCallback(function (widget) {
            if (self._currentResultWidget !== null) {
                self._currentResultWidget.detach();
                resultsNode.removeChild(self._currentResultWidget.node);
            } else {
                resultsNode.style.display = 'block';
            }

            resultsNode.appendChild(widget.node);
            Methanal.Util.nodeInserted(widget);
            self._currentResultWidget = widget;
        });
        return d;
    });



/**
 * L{Methanal.View.LiveForm} subclass for L{Methanal.Widgets.FilterList}.
 *
 * Set the result widget on successful form submission.
 *
 * Widgets derived from L{Methanal.Widgets.FilterList} should use a form
 * that inherits from this.
 */
Methanal.View.LiveForm.subclass(Methanal.Widgets, 'FilterListForm').methods(
    function submitSuccess(self, widgetInfo) {
        return self.widgetParent.setResultWidget(widgetInfo);
    });



/**
 * A collapsable container widget.
 *
 * @type _params: C{object} mapping C{String} to values
 * @ivar _params: Mapping of names to values, used specifically for
 *     L{Methanal.Widgets.Rollup.update}
 *
 * @type expanded: C{boolean}
 * @ivar expanded: Flag indicating whether the container is expanded or not
 *
 * @type throbber: L{Methanal.Util.Throbber}
 * @ivar throbber: Throbber controller
 */
Nevow.Athena.Widget.subclass(Methanal.Widgets, 'Rollup').methods(
    /**
     * Create the rollup widget.
     *
     * @type params: C{object} mapping C{String} to values
     * @ivar params: Mapping of names to values, used specifically for
     *     L{Methanal.Widgets.Rollup.update}
     */
    function __init__(self, node, params) {
        Methanal.Widgets.Rollup.upcall(self, '__init__', node);
        self.expanded = false;
        self._params = params;
    },


    function nodeInserted(self) {
        self._contentNode = self.nodeById('content');
        self._buttonNode = self.nodeById('roll-button');
        self._totalNode = self.nodeById('summary-total');
        self._summaryDescNode = self.nodeById('summary-description');
        self.throbber = Methanal.Util.Throbber(self)

        self.update(self._params);
    },


    /**
     * Toggle the rollup's expanded state.
     */
    function toggleExpand(self) {
        self.expanded = !self.expanded;

        self._contentNode.style.display = self.expanded ? 'block' : 'none';

        var buttonNode = self._buttonNode;
        if (self.expanded) {
            Methanal.Util.addElementClass(buttonNode, 'roll-up');
            Methanal.Util.removeElementClass(buttonNode, 'roll-down');
        } else {
            Methanal.Util.removeElementClass(buttonNode, 'roll-up');
            Methanal.Util.addElementClass(buttonNode, 'roll-down');
        }
        return false;
    },


    /**
     * Update the rollup view.
     *
     * The base implementation updates the node, with ID "summary-description",
     * with the value from the key "summary".
     *
     * @type params: C{object} mapping C{String} to values
     * @ivar params: Mapping of names to values, used specifically for
     *     L{Methanal.Widgets.Rollup.update}
     */
    function update(self, params) {
        var summary = params['summary'];
        summary = summary === undefined ? '' : summary;
        Methanal.Util.replaceNodeText(self._summaryDescNode, summary);
    });



Methanal.View.FormInput.subclass(Methanal.Widgets, 'Lookup');



/**
 * Form for L{Methanal.Widgets.SimpleLookup}.
 *
 * When a value of any input (excluding the result selector) is changed,
 * a remote call is made (passing the values of all the inputs) and the result
 * selector populated from the result of that call.
 */
Methanal.View.SimpleForm.subclass(Methanal.Widgets, 'SimpleLookupForm').methods(
    function __init__(self, node, controlNames) {
        Methanal.Widgets.SimpleLookupForm.upcall(
            self, '__init__', node, controlNames);

        var V = Methanal.Validators;
        self.addValidators([
            [['__results'], [V.notNull]]]);
    },


    /**
     * Set the result values.
     *
     * @type  values: C{Array} of C{[String, object]} 
     * @param values: Sequence of C{[value, description]} results
     */
    function setOptions(self, values) {
        var resultsWidget = self.getControl('__results');
        var resultsNode = resultsWidget.inputNode;
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
        resultsWidget.setValue(value);
        resultsWidget.onChange();
    },


    function valueChanged(self, control) {
        Methanal.Widgets.SimpleLookupForm.upcall(self, 'valueChanged', control);

        // Don't trigger when the result input is changed.
        if (control.name === '__results')
            return;

        // Gather form values from all the filter attributes.
        var values = {};
        for (var controlName in self.controls) {
            var control = self.getControl(controlName);
            values[controlName] = control.getValue();
        }

        // Pass the gathered values to the remote side, and populate the result
        // input from the return value of that call.
        var d = self.widgetParent.callRemote('populate', values);
        d.addCallback(function (values) {
            self.setOptions(values);
        });
    });
