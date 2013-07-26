init = function() {
    Core.Debug.consoleElement = document.getElementById("debugconsole");
    Core.Web.init();

    var app = new TestApp();
    var client = new Echo.FreeClient(app, document.getElementById("rootArea"));
    client.loadStyleSheet("Default.stylesheet.xml");
    client.init();
};

TestApp = Core.extend(Echo.Application, {

    $static: {
        Tests: { },

        randomColor: function() {
            var colorValue = parseInt(Math.random() * 0x1000000).toString(16);
            colorValue = "#" + "000000".substring(colorValue.length) + colorValue;
            return colorValue;
        }
    },

    $construct: function() {
        Echo.Application.call(this);
        var testScreen = new TestApp.TestScreen();
        testScreen.addTest("Column");
        testScreen.addTest("SplitPane");
        testScreen.addTest("TextComponent");
        testScreen.addTest("WindowPane");
        testScreen.addTest("ButtonAlignment");
        testScreen.addTest("List");
        testScreen.addTest("Table");

        this.rootComponent.add(testScreen);
        while (testScreen.testSelectSplitPane.children.length > 1) {
            testScreen.testSelectSplitPane.remove(1);
        }
        var test = TestApp.Tests["Table"];
        var instance = new test();
        testScreen.testSelectSplitPane.add(instance);        
    }
});

TestApp.TestScreen = Core.extend(Echo.ContentPane, {

    $construct: function() {
        Echo.ContentPane.call(this, {
            background: "#abcdef",
            children: [
                this.testSelectSplitPane = new Echo.SplitPane({
                    styleName: "DefaultResizable",
                    separatorPosition: 180,
                    children: [
                        this.testSelectColumn = new Echo.Column({
                            insets: "5px 10px"
                        }),
                        new Echo.Column({
                            insets: "5px 10px",
                            children: [
                                new Echo.Label({
                                    styleName: "Default",
                                    text: "Welcome to the Experimental Echo Client Test Application!"
                                })
                            ]
                        })
                    ]
                })
            ]
        });
    },
    
    addTest: function(testName) {
        this.testSelectColumn.add(new Echo.Button({
            styleName: "Default",
            text: testName,
            events: {
                action: Core.method(this, this._launchTest)
            }
        }));
    },

    _launchTest: function(e) {
        while (this.testSelectSplitPane.children.length > 1) {
            this.testSelectSplitPane.remove(1);
        }
        var testName = e.source.get("text");
        var test = TestApp.Tests[testName];
        if (!test) {
            alert("Test not found: " + testName);
            return;
        }
        var instance = new test();
        this.testSelectSplitPane.add(instance);
    }
});

TestApp.TestPane = Core.extend(Echo.ContentPane, {

    $construct: function() {
        Echo.ContentPane.call(this, {
            children: [
                new Echo.SplitPane({
                    styleName: "DefaultResizable",
                    orientation: Echo.SplitPane.ORIENTATION_HORIZONTAL_LEADING_TRAILING,
                    separatorPosition: 180,
                    children: [
                        this.controlsColumn = new Echo.Column({
                            insets: "5px 10px"
                        }),
                        this.content = new Echo.ContentPane()
                    ]
                })
            ]
        });
    },

    addTestButton: function(text, action) {
        this.controlsColumn.add(
            new Echo.Button({
                styleName: "Default",
                text: text,
                events: {
                    action: action 
                }
            })
        );
    }
});

TestApp.Tests.Column = Core.extend(TestApp.TestPane, {

    $construct: function() {
        TestApp.TestPane.call(this);

        this.childCount = 0;

        this.column = new Echo.Column({
            children: [
                new Echo.Label({
                    text: "Content One"
                }),
                new Echo.Label({
                    text: "Content Two"
                })
            ]
        });
        this.content.add(this.column);

        this.addTestButton("CellSpacing=0", Core.method(this, this._cellSpacing0));
        this.addTestButton("CellSpacing=1", Core.method(this, this._cellSpacing1));
        this.addTestButton("CellSpacing=5", Core.method(this, this._cellSpacing5));
        this.addTestButton("CellSpacing=25", Core.method(this, this._cellSpacing25));
        this.addTestButton("CellSpacing=null", Core.method(this, this._cellSpacingNull));
        this.addTestButton("Add child, i=0", Core.method(this, this._addChild0));
        this.addTestButton("Add child, i=1", Core.method(this, this._addChild1));
        this.addTestButton("Add child, i=2", Core.method(this, this._addChild2));
        this.addTestButton("Add child, i=END", Core.method(this, this._addChildEnd));
        this.addTestButton("Add two children", Core.method(this, this._addTwoChildren));
        this.addTestButton("Add children, remove/add column", Core.method(this, function() {
            var parent = this.column.parent;
            parent.remove(this.column);
            parent.add(this.column);
            this.column.add(new Echo.Label({ text: "[" + ++this.childCount + "] added at end" }));
            this.column.add(new Echo.Label({ text: "[" + ++this.childCount + "] added at end" }));
        }));
        this.addTestButton("Remove child, i=0", Core.method(this, this._removeChild0));
        this.addTestButton("Remove child, i=1", Core.method(this, this._removeChild1));
        this.addTestButton("Remove child, i=2", Core.method(this, this._removeChild2));
        this.addTestButton("Remove child, i=END", Core.method(this, this._removeChildEnd));
        this.addTestButton("Set child background", Core.method(this, this._setChildBackground));
        this.addTestButton("Set LayoutData Background, i = 0", Core.method(this, this._setLayoutDataBackground));
        this.addTestButton("Set LayoutData Insets, i = 0", Core.method(this, this._setLayoutDataInsets));
    },

    _cellSpacing0: function() {
        this.column.set("cellSpacing", 0);
    },

    _cellSpacing1: function() {
        this.column.set("cellSpacing", 1);
    },

    _cellSpacing5: function() {
       this.column.set("cellSpacing", 5);
    },

    _cellSpacing25: function() {
        this.column.set("cellSpacing", 25);
    },

    _cellSpacingNull: function() {
        this.column.set("cellSpacing", null);
    },

    _addChild0: function() {
        this.column.add(new Echo.Label({ text: "[" + ++this.childCount + "] added at 0" }), 0);
    },

    _addChild1: function() {
        if (this.column.children.length < 1) {
            return;
        }
        this.column.add(new Echo.Label({ text: "[" + ++this.childCount + "] added at 1" }), 1);
    },

    _addChild2: function() {
        if (this.column.children.length < 2) {
            return;
        }
        this.column.add(new Echo.Label({ text: "[" + ++this.childCount + "] added at 2" }), 2);
    },

    _addChildEnd: function() {
        this.column.add(new Echo.Label({ text: "[" + ++this.childCount + "] added at end" }));
    },

    _addTwoChildren: function() {
        this.column.add(new Echo.Label({ text: "[" + ++this.childCount + "] added at end" }));
        this.column.add(new Echo.Label({ text: "[" + ++this.childCount + "] added at end" }));
    },

    _removeChild0: function() {
        if (this.column.children.length > 0) {
            this.column.remove(0);
        }
    },

    _removeChild1: function() {
        if (this.column.children.length > 1) {
            this.column.remove(1);
        }
    },

    _removeChild2: function() {
        if (this.column.children.length > 2) {
            this.column.remove(2);
        }
    },

    _removeChildEnd: function() {
        if (this.column.children.length > 0) {
            this.column.remove(this.column.children.length - 1);
        }
    },

    _setChildBackground: function() {
        var length = this.column.children.length;
        for (var i = 0; i < length; ++i) {
            this.column.children[i].set("background", TestApp.randomColor());
        }
    },

    _setLayoutDataBackground: function() {
        if (this.column.children.length == 0) {
            return;
        }
        this.column.children[0].set("layoutData", { background: TestApp.randomColor() });
    },

    _setLayoutDataInsets: function() {
        if (this.column.children.length == 0) {
            return;
        }
        this.column.children[0].set("layoutData", { insets: parseInt(Math.random() * 20) });
    }
});

TestApp.Tests.SplitPane = Core.extend(TestApp.TestPane, {

    $construct: function() {
        TestApp.TestPane.call(this);

        this.content.add(this.splitPane = new Echo.SplitPane({
            resizable: true,
            children: [
                new Echo.Label({
                    text: "Content One"
                }),
                new Echo.Label({
                    text: "Content Two"
                })
            ]
        }));

        this.addTestButton("Orientation: L/R", Core.method(this, this._setOrientationLR));
        this.addTestButton("Orientation: R/L", Core.method(this, this._setOrientationRL));
        this.addTestButton("Orientation: T/B", Core.method(this, this._setOrientationTB));
        this.addTestButton("Orientation: B/T", Core.method(this, this._setOrientationBT));
        this.addTestButton("Component1: Set LD", Core.method(this, this._setLayoutData1));
        this.addTestButton("Component1: Clear LD", Core.method(this, this._clearLayoutData1));
        this.addTestButton("Component2: Set LD", Core.method(this, this._setLayoutData2));
        this.addTestButton("Component2: Clear LD", Core.method(this, this._clearLayoutData2));
        this.addTestButton("Add Component", Core.method(this, this._addComponent));
        this.addTestButton("Insert Component", Core.method(this, this._insertComponent));
        this.addTestButton("Remove First Component", Core.method(this, this._removeFirstComponent));
        this.addTestButton("Remove Last Component", Core.method(this, this._removeLastComponent));
    },
    
    _addComponent: function(e) {
        if (this.splitPane.children.length >= 2) {
            return;
        }
        this.splitPane.add(new Echo.Label({ text: "Content Added" }));
    },

    _insertComponent: function(e) {
        if (this.splitPane.children.length >= 2) {
            return;
        }
        this.splitPane.add(new Echo.Label({ text: "Content Inserted" }), 0);
    },

    _removeFirstComponent: function(e) {
        if (this.splitPane.children.length < 1) {
            return;
        }
        this.splitPane.remove(0);
    },

    _removeLastComponent: function(e) {
        if (this.splitPane.children.length < 1) {
            return;
        }
        this.splitPane.remove(this.splitPane.children.length - 1);
    },

    _clearLayoutData1: function(e) {
        if (this.splitPane.children.length < 1) {
            return;
        }
        this.splitPane.children[0].set("layoutData", null);
    },

    _clearLayoutData2: function(e) {
        if (this.splitPane.children.length < 2) {
            return;
        }
        this.splitPane.children[1].set("layoutData", null);
    },

    _setLayoutData1: function(e) {
        if (this.splitPane.children.length < 1) {
            return;
        }
        this.splitPane.children[0].set("layoutData", {
            background: "#3fffaf",
            insets: 5
        });
    },

    _setLayoutData2: function(e) {
        if (this.splitPane.children.length < 2) {
            return;
        }
        this.splitPane.children[1].set("layoutData", {
            background: "#afff3f",
            insets: 5
        });
    },

    _setOrientationLR: function(e) {
        this.splitPane.set("orientation", Echo.SplitPane.ORIENTATION_HORIZONTAL_LEFT_RIGHT);
    },

    _setOrientationRL: function(e) {
        this.splitPane.set("orientation", Echo.SplitPane.ORIENTATION_HORIZONTAL_RIGHT_LEFT);
    },

    _setOrientationTB: function(e) {
        this.splitPane.set("orientation", Echo.SplitPane.ORIENTATION_VERTICAL_TOP_BOTTOM);
    },

    _setOrientationBT: function(e) {
        this.splitPane.set("orientation", Echo.SplitPane.ORIENTATION_VERTICAL_BOTTOM_TOP);
    }
});


TestApp.Tests.TextComponent = Core.extend(TestApp.TestPane, {

    $construct: function() {
        TestApp.TestPane.call(this);

        this.content.add(new Echo.Column({
            children: [
                this.textField = new Echo.TextField()
            ]
        }));

        this.addTestButton("Set Text", Core.method(this, this._setText));
        this.addTestButton("Set Text Empty", Core.method(this, this._setTextEmpty));
        this.addTestButton("Set Text Null", Core.method(this, this._setTextNull));
    },

    _setText: function() {
        this.textField.set("text", "Hello, world");
    },

    _setTextEmpty: function() {
        this.textField.set("text", "");
    },

    _setTextNull: function() {
        this.textField.set("text", null);
    }
});

TestApp.Tests.WindowPane = Core.extend(TestApp.TestPane, {

    $construct: function() {
        TestApp.TestPane.call(this);

        this.add(this.windowPane = new Echo.WindowPane({
            styleName: "Default",
            title: "This is a Window"
        }));

        this.addTestButton("Set Title", Core.method(this, this._setTitle));
        this.addTestButton("Set Title Empty", Core.method(this, this._setTitleEmpty));
        this.addTestButton("Set Title Null", Core.method(this, this._setTitleNull));
    },

    _setTitle: function() {
        this.windowPane.set("title", "Hello, world");
    },

    _setTitleEmpty: function() {
        this.windowPane.set("title", "");
    },

    _setTitleNull: function() {
        this.windowPane.set("title", null);
    }
});

TestApp.Tests.ButtonAlignment = Core.extend(TestApp.TestPane, {

    $construct: function() {
        TestApp.TestPane.call(this);

        var middlealign = {horizontal: "center", vertical: "middle"};
        var rightalign = {horizontal: "right", vertical: "middle"};
        var bottomalign = {horizontal: "center", vertical: "bottom"};
        var textMiddle = {horizontal: "middle"};
        var textRight = {horizontal: "right"};
        var textPosLeft = {horizontal: "left"};
        var img = "img/test.png";
        var grid = new Echo.Grid({
            size: 7,
            insets: "3px",
            background: "green",
            children: [
                new Echo.Label({text: ""}),
                new Echo.Label({text: "Text only"}),
                new Echo.Label({text: "Icon only"}),
                new Echo.Label({text: "Text and Icon"}),
                new Echo.Label({text: "Text position left"}),
                new Echo.Label({text: "Text-align middle"}),
                new Echo.Label({text: "Text-align right"}),
                new Echo.Label({text: "Left", layoutData: { rowSpan: 3}}),

                new Echo.Button({width: "90", text: "text", height: "55px", background: "yellow"}),
                new Echo.Button({width: "90", icon: img, height: "55px", background: "orange"}),
                new Echo.Button({width: "125", text: "text", icon: img, height: "55px", background: "magenta"}),
                new Echo.Button({width: "125", text: "text", icon: img, height: "55px", background: "gray", textPosition: textPosLeft}),
                new Echo.Button({width: "125", text: "text", icon: img, height: "55px", background: "cyan", textAlignment: textMiddle}),
                new Echo.Button({width: "125", text: "text", icon: img, height: "55px", background: "lightgray", textAlignment: textRight}),

                new Echo.RadioButton({width: "90", text: "text", height: "55px", background: "yellow"}),
                new Echo.RadioButton({width: "90", icon: img, height: "55px", background: "orange"}),
                new Echo.RadioButton({width: "125", text: "text", icon: img, height: "55px", background: "magenta"}),
                new Echo.RadioButton({width: "125", text: "text", icon: img, height: "55px", background: "gray", textPosition: textPosLeft}),
                new Echo.RadioButton({width: "125", text: "text", icon: img, height: "55px", background: "cyan", textAlignment: textMiddle}),
                new Echo.RadioButton({width: "125", text: "text", icon: img, height: "55px", background: "lightgray", textAlignment: textRight}),

                new Echo.CheckBox({width: "90", text: "text", height: "55px", background: "yellow"}),
                new Echo.CheckBox({width: "90", icon: img, height: "55px", background: "orange"}),
                new Echo.CheckBox({width: "125", text: "text", icon: img, height: "55px", background: "magenta"}),
                new Echo.CheckBox({width: "125", text: "text", icon: img, height: "55px", background: "gray", textPosition: textPosLeft}),
                new Echo.CheckBox({width: "125", text: "text", icon: img, height: "55px", background: "cyan", textAlignment: textMiddle}),
                new Echo.CheckBox({width: "125", text: "text", icon: img, height: "55px", background: "lightgray", textAlignment: textRight}),

                new Echo.Label({text: ""}),
                new Echo.Label({text: "Text only"}),
                new Echo.Label({text: "Icon only"}),
                new Echo.Label({text: "Text and Icon"}),
                new Echo.Label({text: "Text position left"}),
                new Echo.Label({text: "Text-align middle"}),
                new Echo.Label({text: "Text-align right"}),
                new Echo.Label({text: "Middle", layoutData: { rowSpan: 3}}),

                new Echo.Button({text: "text", height: "55px", background: "yellow", alignment: middlealign}),
                new Echo.Button({ icon: img, height: "55px", background: "orange", alignment: middlealign}),
                new Echo.Button({ text: "text", icon: img, height: "55px", background: "magenta", alignment: middlealign}),
                new Echo.Button({ text: "text", icon: img, height: "55px", background: "gray", alignment: middlealign, textPosition: textPosLeft}),
                new Echo.Button({ text: "text", icon: img, height: "55px", background: "cyan", alignment: middlealign, textAlignment: textMiddle}),
                new Echo.Button({ text: "text", icon: img, height: "55px", background: "lightgray", alignment: middlealign, textAlignment: textRight}),

                new Echo.RadioButton({text: "text", height: "55px", background: "yellow", alignment: middlealign}),
                new Echo.RadioButton({ icon: img, height: "55px", background: "orange", alignment: middlealign}),
                new Echo.RadioButton({ text: "text", icon: img, height: "55px", background: "magenta", alignment: middlealign}),
                new Echo.RadioButton({ text: "text", icon: img, height: "55px", background: "gray", alignment: middlealign, textPosition: textPosLeft}),
                new Echo.RadioButton({ text: "text", icon: img, height: "55px", background: "cyan", alignment: middlealign, textAlignment: textMiddle}),
                new Echo.RadioButton({ text: "text", icon: img, height: "55px", background: "lightgray", alignment: middlealign, textAlignment: textRight}),

                new Echo.CheckBox({text: "text", height: "55px", background: "yellow", alignment: middlealign}),
                new Echo.CheckBox({ icon: img, height: "55px", background: "orange", alignment: middlealign}),
                new Echo.CheckBox({ text: "text", icon: img, height: "55px", background: "magenta", alignment: middlealign}),
                new Echo.CheckBox({ text: "text", icon: img, height: "55px", background: "gray", alignment: middlealign, textPosition: textPosLeft}),
                new Echo.CheckBox({ text: "text", icon: img, height: "55px", background: "cyan", alignment: middlealign, textAlignment: textMiddle}),
                new Echo.CheckBox({ text: "text", icon: img, height: "55px", background: "lightgray", alignment: middlealign, textAlignment: textRight}),

                new Echo.Label({text: ""}),
                new Echo.Label({text: "Text only"}),
                new Echo.Label({text: "Icon only"}),
                new Echo.Label({text: "Text and Icon"}),
                new Echo.Label({text: "Text position left"}),
                new Echo.Label({text: "Text-align middle"}),
                new Echo.Label({text: "Text-align right"}),
                new Echo.Label({text: "Right", layoutData: { rowSpan: 3}}),

                new Echo.Button({text: "text", height: "55px", background: "yellow", alignment: rightalign}),
                new Echo.Button({ icon: img, height: "55px", background: "orange", alignment: rightalign}),
                new Echo.Button({ text: "text", icon: img, height: "55px", background: "magenta", alignment: rightalign}),
                new Echo.Button({ text: "text", icon: img, height: "55px", background: "gray", alignment: rightalign, textPosition: textPosLeft}),
                new Echo.Button({ text: "text", icon: img, height: "55px", background: "cyan", alignment: rightalign, textAlignment: textMiddle}),
                new Echo.Button({ text: "text", icon: img, height: "55px", background: "lightgray", alignment: rightalign, textAlignment: textRight}),

                new Echo.RadioButton({text: "text", height: "55px", background: "yellow", alignment: rightalign}),
                new Echo.RadioButton({ icon: img, height: "55px", background: "orange", alignment: rightalign}),
                new Echo.RadioButton({ text: "text", icon: img, height: "55px", background: "magenta", alignment: rightalign}),
                new Echo.RadioButton({ text: "text", icon: img, height: "55px", background: "gray", alignment: rightalign, textPosition: textPosLeft}),
                new Echo.RadioButton({ text: "text", icon: img, height: "55px", background: "cyan", alignment: rightalign, textAlignment: textMiddle}),
                new Echo.RadioButton({ text: "text", icon: img, height: "55px", background: "lightgray", alignment: rightalign, textAlignment: textRight}),

                new Echo.CheckBox({text: "text", height: "55px", background: "yellow", alignment: rightalign}),
                new Echo.CheckBox({ icon: img, height: "55px", background: "orange", alignment: rightalign}),
                new Echo.CheckBox({ text: "text", icon: img, height: "55px", background: "magenta", alignment: rightalign}),
                new Echo.CheckBox({ text: "text", icon: img, height: "55px", background: "gray", alignment: rightalign, textPosition: textPosLeft}),
                new Echo.CheckBox({ text: "text", icon: img, height: "55px", background: "cyan", alignment: rightalign, textAlignment: textMiddle}),
                new Echo.CheckBox({ text: "text", icon: img, height: "55px", background: "lightgray", alignment: rightalign, textAlignment: textRight}),

                new Echo.Label({text: ""}),
                new Echo.Label({text: "Text only"}),
                new Echo.Label({text: "Icon only"}),
                new Echo.Label({text: "Text and Icon"}),
                new Echo.Label({text: "Text position left"}),
                new Echo.Label({text: "Text-align middle"}),
                new Echo.Label({text: "Text-align right"}),
                new Echo.Label({text: "Bottom", layoutData: { rowSpan: 3}}),

                new Echo.Button({text: "text", height: "55px", background: "yellow", alignment: bottomalign}),
                new Echo.Button({ icon: img, height: "55px", background: "orange", alignment: bottomalign}),
                new Echo.Button({ text: "text", icon: img, height: "55px", background: "magenta", alignment: bottomalign}),
                new Echo.Button({ text: "text", icon: img, height: "55px", background: "gray", alignment: bottomalign, textPosition: textPosLeft}),
                new Echo.Button({ text: "text", icon: img, height: "55px", background: "cyan", alignment: bottomalign, textAlignment: textMiddle}),
                new Echo.Button({ text: "text", icon: img, height: "55px", background: "lightgray", alignment: bottomalign, textAlignment: textRight}),

                new Echo.RadioButton({text: "text", height: "55px", background: "yellow", alignment: bottomalign}),
                new Echo.RadioButton({ icon: img, height: "55px", background: "orange", alignment: bottomalign}),
                new Echo.RadioButton({ text: "text", icon: img, height: "55px", background: "magenta", alignment: bottomalign}),
                new Echo.RadioButton({ text: "text", icon: img, height: "55px", background: "gray", alignment: bottomalign, textPosition: textPosLeft}),
                new Echo.RadioButton({ text: "text", icon: img, height: "55px", background: "cyan", alignment: bottomalign, textAlignment: textMiddle}),
                new Echo.RadioButton({ text: "text", icon: img, height: "55px", background: "lightgray", alignment: bottomalign, textAlignment: textRight}),

                new Echo.CheckBox({text: "text", height: "55px", background: "yellow", alignment: bottomalign}),
                new Echo.CheckBox({ icon: img, height: "55px", background: "orange", alignment: bottomalign}),
                new Echo.CheckBox({ text: "text", icon: img, height: "55px", background: "magenta", alignment: bottomalign}),
                new Echo.CheckBox({ text: "text", icon: img, height: "55px", background: "gray", alignment: bottomalign, textPosition: textPosLeft}),
                new Echo.CheckBox({ text: "text", icon: img, height: "55px", background: "cyan", alignment: bottomalign, textAlignment: textMiddle}),
                new Echo.CheckBox({ text: "text", icon: img, height: "55px", background: "lightgray", alignment: bottomalign, textAlignment: textRight})
            ]
        });
       this.add(grid);
    }
});

TestApp.Tests.List = Core.extend(Echo.Grid, {

    $construct: function() {
        Echo.Grid.call(this, {
            size: 4,
            insets: "10px 20px",
            background: "#ddeeff"
        });

        this._addSelectField("No border", {
        });

        this._addSelectField("Insets 10px", {
            insets: "10px 8px"
        });

        this._addSelectField("Radius 5p", {
            radius: "10px"
        });

        this._addSelectField("Insets and Radius", {
            insets: "10px 8px",
            radius: "10px"
        });
        
        this._addSelectField("Border", {
            border: "4px solid #ff00ff"
        });
        
        this._addSelectField("Border + Radius", {
            border: "4px solid #ff00ff",
            radius: "10px"
        });

        this._addSelectField("Border + Radius + Insets", {
            border: "4px solid #ff00ff",
            insets: "10px 8px",
            radius: "16px"
        });
    },

    _addSelectField: function(caption, attributes) {
        attributes.items = [{text: "One", id: 1}, {text: "Two", id: 2}, {text: "Three", id: 3}];

        this.add(new Echo.Label({text: caption}));
		var select = new Echo.SelectField(attributes);
        this.add(select);
        
        var doAction = function() {
        	var value = select.render("selectedId", 1);
        	value++;
        	if (value > 3) value = 1;
	        select.set("selectedId", value);
        };
        attributes.events = {action: doAction};
        attributes.boxShadow = "3px 3px 12px 2px black";
        this.add(new Echo.SelectField(attributes));
        
        attributes.background = "#aaffaa";
        this.add(new Echo.SelectField(attributes));        
    }
});

TestApp.Tests.Table = Core.extend(TestApp.TestPane, {

	_chkBigData: null, 
	_chkHeader: null,
	_cboStyle: null,
	_cboWidth: null,
	_cboHeight: null,
	_cboCols: null,
	_chkRadius: null,
	_chkShadow: null,
	_chkExtraCols: null,

    $construct: function() {
        TestApp.TestPane.call(this);

		var that = this;

        var doAction = function(e) {
        	that._showTable();
        };

		this._chkHeader = new Echo.CheckBox({selected: true, text: "Header", events: {action: doAction}});
	    this.controlsColumn.add(this._chkHeader);

		this._chkMargins = new Echo.CheckBox({selected: true, text: "Margins", events: {action: doAction}});
	    this.controlsColumn.add(this._chkMargins);

		this._chkRadius = new Echo.CheckBox({selected: false, text: "Radius", events: {action: doAction}});
	    this.controlsColumn.add(this._chkRadius);

		this._chkShadow = new Echo.CheckBox({selected: false, text: "Box Shadow", events: {action: doAction}});
	    this.controlsColumn.add(this._chkShadow);

		this._chkBigData = new Echo.CheckBox({selected: true, text: "Extra Rows", events: {action: doAction}});
	    this.controlsColumn.add(this._chkBigData);

		this._chkExtraCols = new Echo.CheckBox({selected: false, text: "Extra Columns", events: {action: doAction}});
	    this.controlsColumn.add(this._chkExtraCols);
	    
	    var cboStyleAttr = {};
	    cboStyleAttr.items = [
	    	{text: "Default", id: "default"}, 
	    	{text: "Horizontal Minimalist", id: "horizontal_minimalist"}, 
	    	{text: "Box", id: "box"}, 
	    	{text: "Zebra", id: "zebra"}, 
	    	{text: "Horizontal Emphasis", id: "horizontal_emphasis"}, 
	    	{text: "Verticals Bars", id: "verticals"}];
	 	cboStyleAttr.selectedId = "verticals";
        cboStyleAttr.events = {action: doAction};
        this.controlsColumn.add(this._cboStyle = new Echo.SelectField(cboStyleAttr));
        
	    var cboWidthAttr = {};
	    cboWidthAttr.items = [
	    	{text: "Width = 500px", id: "500px"}, 
	    	{text: "Width = 100%", id: "100pc"}, 
	    	{text: "Width = null", id: "null"}];
	    cboWidthAttr.selectedId = "500px";	
        cboWidthAttr.events = {action: doAction};
        this.controlsColumn.add(this._cboWidth = new Echo.SelectField(cboWidthAttr));

	    var cboHeightAttr = {};
	    cboHeightAttr.items = [
	    	{text: "Height = 320px", id: "320px"}, 
	    	{text: "Height = 80%", id: "80%"}, 
	    	{text: "Height = null", id: null}];
	    cboHeightAttr.selectedId = "320px";	
        cboHeightAttr.events = {action: doAction};
        this.controlsColumn.add(this._cboHeight = new Echo.SelectField(cboHeightAttr));

	    var cboColsAttr = {};
	    cboColsAttr.items = [
	    	{text: "Columns = null", id: null},
	    	{text: "Columns = 20/40/40/20%", id: "percent"},
	    	{text: "Columns = 80/80/140/50px", id: "pixel1"},
	    	{text: "Columns = 80/80/300/80px", id: "pixel2"}];
	    cboColsAttr.selectedId = "null";		
        cboColsAttr.events = {action: doAction};
        this.controlsColumn.add(this._cboCols = new Echo.SelectField(cboColsAttr));

    	this._showTable();
     },

	 _showTable: function() {

        while (this.content.children.length > 0) {
	        this.content.remove(0);
	    }

		var tableContainer = null;
		var tableWidth = null;
		switch (this._cboWidth.get("selectedId")) {
		case "100pc":
			tableWidth = "100%";
			var splitPane = new Echo.SplitPane({
				orientation: Echo.SplitPane.ORIENTATION_VERTICAL_TOP_BOTTOM,
				resizable: true
			});
			this.content.add(splitPane);
			var tableContainer = new Echo.SplitPane({
				orientation: Echo.SplitPane.ORIENTATION_HORIZONTAL_RIGHT_LEFT,
				resizable: true,
				separatorPosition: "50px"
			});
			splitPane.add(tableContainer);
			tableContainer.add(new Echo.Label());
			break;
		case "500px":
			tableWidth = "500px";
		default:
			var tableContainer = new Echo.Row({});
			this.content.add(tableContainer);
			break;
		}

		var columnWidths = null;
		switch (this._cboCols.get("selectedId")) {
		case "pixel1":
			columnWidths =  ["80px", "80px", "140px", "50px"];
			break;
		case "pixel2":
			columnWidths =  ["80px", "80px", "300px", "80px"];
			break;
		case "percent":
			columnWidths =  ["20%", "40%", "40%", "20%"];
			break;
		}

		var colCount = this._chkExtraCols.get("selected") ? 12 : 4;
		
		var childrenTexts = [
			"Employee", "Net Salary", "Bonus", "Supervisor",
			"Stephen C. Cox", "$300", "$50", "Bob",
			"Josephin Tan", "$150", "-", "Annie",
			"Joyce Ming", "$200", "$35", "Andy",
			"James Albert Pentel", "$175", "$25", "Annie"];
		var children = [];
		var z = 0;
		for (var i = 0; i < childrenTexts.length; i++) {
			if (i === 12) {
				children[z++] = new Echo.CheckBox({text: childrenTexts[i], border: "1px solid #665566", icon: "img/test.png"});
			} else  {
				children[z++] = new Echo.Label({text: childrenTexts[i]});
			}
			if ((i + 1)  % 4 === 0) {
				for (var j = 4; j < colCount; j++) {
					children[z++] = new Echo.Label({text: "Extra_" + j});
				}
			}
		}
		
		if (this._chkBigData.get("selected")) {
			for (var k = 0; k < 240; k++) {
				children[z++] = new Echo.Label({text: "Data_" + k});
			}
		}
		
	 	var attr = {
		    columnCount: colCount,
		    rowCount: z / colCount,
		    width: tableWidth,
		    height: this._cboHeight.get("selectedId"),
		    selection: "2",
		    margins: this._chkMargins.get("selected") ? "15px" : null,
			columnWidth: columnWidths,
			headerVisible: this._chkHeader.get("selected"),			
		 	radius: this._chkRadius.get("selected") ? "20px" : null,
		    boxShadow: this._chkShadow.get("selected") ? "3px 3px 12px 2px black" : null,
			children: children
		}
		this.content.set("background", "#ffffff");
		
		var style = this._cboStyle.get("selectedId");
	 	if (style === "default") {
	 		//nothing!
	 	} else if (style === "horizontal_minimalist") {
		    attr.insets = "10px 5px";
		    attr.horizontalLine = "1px solid #dddddd";
		    attr.separatorLine = "3px solid #778899";
		    attr.rolloverBackground = "#f0f0FD";
		    attr.rolloverEnabled = true;
		    attr.foreground = "gray";
		    attr.headerForeground = "gray";
	 	} else if (style === "box") {
		    attr.background = "#E8EDFF";
		    attr.headerBackground = "#B9C9FE";
		    attr.rolloverBackground = "#D0DAFD";
		    attr.rolloverEnabled = true;
		    attr.foreground = "#555555";
		    attr.insets = "10px 5px";
		    attr.horizontalLine = "2px solid #ffffff";
	 	} else if (style === "zebra") {
		    attr.insets = "10px 5px";
		    attr.zebraBackground = "#E8EDFF";
	 	} else if (style === "horizontal_emphasis") {
		    attr.insets = "10px 5px";
		    attr.foreground = "#555555";
		    attr.rolloverBackground = "#ffffff";
		    attr.rolloverForeground = "#770077";
		    attr.background = "#f3f3f3";
		    attr.rolloverEnabled = true;
		    attr.separatorLine = "6px solid #ffffff";
		    attr.horizontalLine = "4px solid #ffffff";
	 	} else if (style === "rounded_corner") {
		    attr.background = "#E8EDFF";
		    attr.headerBackground = "#B9C9FE";
		    attr.foreground = "#555555";
		    attr.rolloverBackground = "#D0DAFD";
		    attr.rolloverEnabled = true;
		    attr.insets = "12px 8px";
		    attr.horizontalLine = "2px solid #ffffff";
	 	} else if (style === "verticals") {
		    attr.insets = "10px 5px";
		    attr.verticalLine = "3px solid #dddddd";
		    attr.foreground = "gray";
		    attr.background = "#f4f4f4";
		    attr.headerForeground = "gray";
	 	} else if (style === "xxxx") {
	 	 	//"Lucida Sans Unicode", "Lucida Grande", Sans-Serif;
		    attr.boxShadow = "3px 3px 12px 2px black";
		    attr.background = "#ffffff";
		    attr.border = "3px solid #778899";
		    attr.headerBackground = "#778899";
		    attr.headerForeground = "#f6f6f6";  
		    attr.horizontalLine = "2px dotted #778899";
		    attr.insets = "3px";
		    attr.radius = "20px";
		    attr.rolloverBackground = "#333333";
		    attr.rolloverEnabled = true;
		    attr.selectionEnabled = true;
		    attr.verticalLine = "2px dotted #778899";
		    attr.zebraBackground = "#eeeeee";
		}
				
	 	var table = new Echo.Sync.RemoteTable(attr);
	    tableContainer.add(table);
	 }
});
