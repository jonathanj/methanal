// import Nevow.Test.WidgetUtil
// import Methanal.Tests.Util
// import Methanal.Widgets
// import Methanal.Util



//Methanal.Widgets.Table.subclass(
//    Methanal.Tests.TestWidgets, 'MockTable').methods(
//    function __init__(self, args) {
//        var node = Nevow.Test.WidgetUtil.makeWidgetNode();
//        Methanal.Tests.TestWidgets.MockTable.upcall(
//            self, '__init__', node, args);
//        var tableNode = document.createElement('table');
//        tableNode.appendChild(document.createElement('thead'));
//        tableNode.appendChild(document.createElement('tbody'));
//        node.appendChild(tableNode);
//        document.body.appendChild(node);
//    });



Methanal.Widgets.Action.subclass(
    Methanal.Tests.TestWidgets, 'DisabledAction').methods(
        function enableForRow(self, row) {
            return false;
        });



Methanal.Tests.Util.TestCase.subclass(
    Methanal.Tests.TestWidgets, 'TableTest').methods(
    function createTable(self, columnValues, actions, defaultAction) {
        var cells = {};
        var columns = [];
        for (var columnID in columnValues) {
            var values = columnValues[columnID];
            columns.push(values.type(columnID, 'title'));
            cells[columnID] = Methanal.Widgets.Cell(values.value, values.link);
        }
        var node = Nevow.Test.WidgetUtil.makeWidgetNode();
        var rows = [Methanal.Widgets.Row(0, cells)];
        var args = {'columns': columns, 'rows': rows};
        var table = Methanal.Widgets.Table(node, args);
        table.actions = actions || null;
        table.defaultAction = defaultAction || null;
        document.body.appendChild(node);
        Methanal.Util.nodeInserted(table);
        return table;
    },


    function test_createTableWithEnabledAction(self) {
        var columnValues = {
            'col1': {type: Methanal.Widgets.BooleanColumn,
                     value: false,
                     link: null}};
        var actions = [Methanal.Widgets.Action('foo', 'Foo')];
        var table = self.createTable(columnValues, actions);
    },


    function test_createTableWithDisabledAction(self) {
        var columnValues = {
            'col1': {type: Methanal.Widgets.BooleanColumn,
                     value: false,
                     link: null}};
        var actions = [Methanal.Tests.TestWidgets.DisabledAction('foo',
                                                                 'Foo')];
        var table = self.createTable(columnValues, actions);
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
