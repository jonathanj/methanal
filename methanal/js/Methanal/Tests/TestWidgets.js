// import Nevow.Test.WidgetUtil
// import Methanal.Widgets
// import Methanal.Util
// import Methanal.Tests.Util
// import Methanal.Tests.MockBrowser



/**
 * A L{Methanal.Widgets.Action} that returns C{false} for C{enableForRow}.
 */
Methanal.Widgets.Action.subclass(
    Methanal.Tests.TestWidgets, 'DisabledAction').methods(
        function enableForRow(self, row) {
            return false;
        });



/**
 * Tests for L{Methanal.Widgets.Table}.
 */
Methanal.Tests.Util.TestCase.subclass(
    Methanal.Tests.TestWidgets, 'TableTest').methods(
    /**
     * Create a L{Methanal.Wigets.Table} widget.
     *
     * @param columnValues: Mapping of column names to mappings of C{'type'},
     *     C{'value'} and C{'link'}, used for creating cells.
     *
     * @type  actions: C{Array} of L{Methanal.Widgets.Action}
     * @param actions: Optional table actions.
     *
     * @type  defaultAction: L{Methanal.Widgets.Action}
     * @param defaultAction: Optional default table action.
     *
     * @rtype: C{Methanal.Widgets.Table}
     */
    function createTable(self, columnValues, actions/*=undefined*/,
        defaultAction/*=undefined*/) {
        var cells = {};
        var columns = [];
        for (var columnID in columnValues) {
            var values = columnValues[columnID];
            columns.push(values.type(columnID, 'title'));
            cells[columnID] = Methanal.Widgets.Cell(values.value, values.link);
        }
        var node = Nevow.Test.WidgetUtil.makeWidgetNode();
        var rows = [Methanal.Widgets.Row(0, cells)];
        var args = {
            'columns': columns,
            'rows': rows};
        var table = Methanal.Widgets.Table(node, args);
        table.actions = actions || null;
        table.defaultAction = defaultAction || null;
        var tableNode = Methanal.Tests.Util.makeWidgetChildNode(
            table, 'table');
        document.body.appendChild(node);
        Methanal.Util.nodeInserted(table);
        return table;
    },


    /**
     * Get an C{Array} of DOM nodes for a table's actions.
     */
    function _getActionNodes(self, table) {
        var rows = table.getBody().rows;
        self.assertIdentical(rows.length > 0, true,
            'Table has no rows.');
        var cells = rows[0].cells;
        if (cells.length < table._columns.length + 1) {
            throw new Error('No actions column.');
        }
        var actionsCell = cells[table._columns.length/* + 1 - 1*/];
        return actionsCell.getElementsByTagName('a');
    },


    /**
     * Assert that C{table} has action DOM nodes that match an C{Array} of
     * L{Methanal.Widgets.Action}.
     */
    function assertHasActions(self, table, actions) {
        var actionDisplayNames = [];
        for (var i = 0; i < actions.length; ++i) {
            actionDisplayNames.push(actions[i].displayName);
        }
        actionDisplayNames.sort();

        var anchors = self._getActionNodes(table);
        self.assertIdentical(anchors.length, actions.length,
            'Number of action nodes does not match number of actions.');

        var textValues = []
        for (var i = 0; i < anchors.length; ++i) {
            var children = anchors[i].childNodes;
            for (var j = 0; j < children.length; ++j) {
                if (children[j].nodeType == children[j].TEXT_NODE) {
                    textValues.push(children[j].nodeValue);
                    break;
                }
            }
        }
        textValues.sort();

        self.assertArraysEqual(actionDisplayNames, textValues);
    },


    /**
     * Assert that C{table} has no action DOM nodes.
     */
    function assertHasNoActions(self, table) {
        var anchors = self._getActionNodes(table);
        self.assertIdentical(anchors.length, 0,
            'Table has ' + anchors.length + ' actions, expected 0.');
    },


    /**
     * Create a table with actions.
     */
    function test_createTableWithEnabledAction(self) {
        var columnValues = {
            'col1': {type: Methanal.Widgets.BooleanColumn,
                     value: false,
                     link: null}};
        var actions = [Methanal.Widgets.Action('foo', 'Foo')];
        var table = self.createTable(columnValues, actions);

        self.assertHasActions(table, actions);
    },


    /**
     * Create a table with actions that are disabled. An "actions" column
     * should still appear, in this case.
     */
    function test_createTableWithDisabledAction(self) {
        var columnValues = {
            'col1': {type: Methanal.Widgets.BooleanColumn,
                     value: false,
                     link: null}};
        var actions = [
            Methanal.Tests.TestWidgets.DisabledAction('foo', 'Foo')];
        var table = self.createTable(columnValues, actions);

        self.assertHasNoActions(table);
    });


/**
 * Create and test trivial Column types.
 *
 * @ivar columnType: Column type to create.
 *
 * @ivar columnValues: A mapping of column identifiers to mappings of values
 *     for keys named C{id}, C{link}, C{nodeValue}.
 *
 * @ivar columns: A sequence of L{Methanal.Widgets.Column} instances.
 *
 * @ivar rowData: L{Methanal.Widgets.Row} constructed from L{columnValues}.
 */
Methanal.Tests.Util.TestCase.subclass(
    Methanal.Tests.TestWidgets, 'SimpleColumnTest').methods(
    function setUp(self) {
        var _cells = {};
        self.columns = [];
        for (var columnID in self.columnValues) {
            var values = self.columnValues[columnID];
            self.columns.push(self.columnType(columnID, 'title'));
            _cells[columnID] = Methanal.Widgets.Cell(values.value, values.link);
        }
        self.rowData = Methanal.Widgets.Row(0, _cells);
    },


    /**
     * Apply a function over each column.
     */
    function eachColumn(self, fn) {
        for (var i = 0; i < self.columns.length; ++i) {
            fn(self.columns[i]);
        }
    },


    /**
     * Extracting a value for a column from row data matches the original data
     * used to construct the cell. Attempting to extract a value for an
     * identifier that does not exist throws C{TypeError}.
     */
    function test_extractValue(self) {
        self.eachColumn(function (column) {
            self.assertIdentical(
                column.extractValue(self.rowData),
                self.columnValues[column.id].value);
            self.assertThrows(TypeError,
                function () {
                    column.extractValue({})
                });
        });
    },


    /**
     * Extracting a link for a column from row data matches the original data
     * used to construct the cell. Attempting to extract a value for an
     * identifier that does not exist throws C{TypeError}.
     */
    function test_extractLink(self) {
        self.eachColumn(function (column) {
            self.assertIdentical(
                column.extractLink(self.rowData),
                self.columnValues[column.id].link);
            self.assertThrows(TypeError,
                function () {
                    column.extractLink({})
                });
        });
    },


    /**
     * Convert a column value (generally the result of C{extractValue}) to a
     * DOM node.
     */
    function test_valueToDOM(self) {
        self.eachColumn(function (column) {
            var node = column.valueToDOM(column.extractValue(self.rowData));
            self.assertIdentical(node.nodeType, node.TEXT_NODE);
            var nodeValue = self.columnValues[column.id].nodeValue;
            self.assertIdentical(node.nodeValue, nodeValue);
        });
    });



/**
 * Tests for L{Methanal.Widgets.TextColumn}.
 */
Methanal.Tests.TestWidgets.SimpleColumnTest.subclass(
    Methanal.Tests.TestWidgets, 'TestTextColumn').methods(
    function setUp(self) {
        self.columnType = Methanal.Widgets.TextColumn;
        self.columnValues = {
            'a': {value: 'foo',
                  link: null,
                  nodeValue: 'foo'},
            'b': {value: 'bar',
                  link: 'quux',
                  nodeValue: 'bar'}};
        Methanal.Tests.TestWidgets.TestTextColumn.upcall(self, 'setUp');
    });



/**
 * Tests for L{Methanal.Widgets.IntegerColumn}.
 */
Methanal.Tests.TestWidgets.SimpleColumnTest.subclass(
    Methanal.Tests.TestWidgets, 'TestIntegerColumn').methods(
    function setUp(self) {
        self.columnType = Methanal.Widgets.IntegerColumn;
        self.columnValues = {
            'a': {value: 42,
                  link: null,
                  nodeValue: '42'},
            'b': {value: 5144,
                  link: 'quux',
                  nodeValue: '5144'}};
        Methanal.Tests.TestWidgets.TestIntegerColumn.upcall(self, 'setUp');
    });



/**
 * Tests for L{Methanal.Widgets.BooleanColumn}.
 */
Methanal.Tests.TestWidgets.SimpleColumnTest.subclass(
    Methanal.Tests.TestWidgets, 'TestBooleanColumn').methods(
    function setUp(self) {
        self.columnType = Methanal.Widgets.BooleanColumn;
        self.columnValues = {
            'a': {value: false,
                  link: null,
                  nodeValue: 'false'},
            'b': {value: true,
                  link: 'quux',
                  nodeValue: 'true'}};
        Methanal.Tests.TestWidgets.TestBooleanColumn.upcall(self, 'setUp');
    });



/**
 * Tests for L{Methanal.Widgets.TimestampColumn}.
 */
Methanal.Tests.TestWidgets.SimpleColumnTest.subclass(
    Methanal.Tests.TestWidgets, 'TestTimestampColumn').methods(
    function setUp(self) {
        self.columnType = Methanal.Widgets.TimestampColumn;

        var t1 = Methanal.Util.Time.fromTimestamp(1259973381772);
        var t2 = Methanal.Util.Time.fromTimestamp(1149573966000);

        self.columnValues = {
            'a': {value: t1,
                  link: null,
                  nodeValue: t1.asHumanly()},
            'b': {value: t2,
                  link: 'quux',
                  nodeValue: t2.asHumanly()}};
        Methanal.Tests.TestWidgets.TestTimestampColumn.upcall(self, 'setUp');
    });
