/**
  Remote Table component.
 */
Echo.Sync.RemoteTable = Core.extend(Echo.Component, {

    $static: {
        
        /** 
         * Default selection background color.  Used only when no selection style properties have been set.
         * @type Color
         */
        DEFAULT_SELECTION_BACKGROUND: "#00006f",

        /** 
         * Default selection foreground color.  Used only when no selection style properties have been set.
         * @type Color
         */
        DEFAULT_SELECTION_FOREGROUND: "#ffffff"
        
    },
    
    $load: function() {
        Echo.ComponentFactory.registerType("RemoteTable", this);
        Echo.ComponentFactory.registerType("RT", this);
    },

    /** @see Echo.Component#compnoentType */
    componentType: "RemoteTable",

    $virtual: {
        
        /**
         * Programmatically performs a button action.
         */
        doAction: function() {
            this.fireEvent({type: "action", source: this, data: this.get("actionCommand")});
        }
    }
});

/**
 * Component rendering peer: RemoteTable.
 * This class should not be extended by developers, the implementation is subject to change.
 */
Echo.Sync.RemoteTableSync = Core.extend(Echo.Render.ComponentSync, {
    
    $static: {
    
        /**
         * Constant describing header row index.
         * @type Number
         */
        _HEADER_ROW: -1,

		/**
		 *
		 */ 
        _RESIZE_COLGROUP_PIXEL: 0,
        
        /**
		 *
		 */
        _RESIZE_COLGROUP_PERCENT: 1,
        
        /**
         * Table width is null, the table automatically takes the spaces it needs 
         * (as calculated by the browser)
         * When the user resizes a column the table width changes accordingly,
         * the other columns remain unchanged
         */	
        _RESIZE_TABLE_WIDTH: 2,
        
        /**
         * Array of properties which may be updated without full re-render.
         * @type Array
         */
        _supportedPartialProperties: ["selection"],
        
    },

	/**
	 * workaround for chrome for setting column 
	  * widths smaller than content
	 */	
    CSS_COL_STYLE: [],
       
    
    $load: function() {
        Echo.Render.registerPeer("RemoteTable", this);
    },
    
    /**
     * Flag indicating that no selection styling attributes have been set, thus default highlight should be used.
     * @type Boolean
     */
    _useDefaultSelectionStyle: false,
    
    /**
     * The colgroup element defining the column widths of the header table
     * (should always be same values as the colgroup of the body)
     */
	_colGroupHeader: null,
	
	/**
     * The colgroup element defining the column widths of the body table
     */
	_colGroupBody: null,
	
	_resizePolicy: 2, //_RESIZE_TABLE_WIDTH
    
    /** Constructor. */
    $construct: function() {
        this.selectionModel = null;
        this.lastSelectedIndex = null;
        //TODO only needed for Chrome
       	for (var i = 0; i < 4; i++) {
  			var style = document.createElement('style');
			style.type = 'text/css';
			document.getElementsByTagName('head')[0].appendChild(style);
			this.CSS_COL_STYLE[i] = style;
		}
    },
    
    /**
     * Adds event listeners.
     */
    _addEventListeners: function() {
        if (!this.component.isRenderEnabled()) return;
        if (!this._selectionEnabled && !this._rolloverEnabled) return;
        if (this._rowCount === 0) return;

        var mouseEnterLeaveSupport = Core.Web.Env.PROPRIETARY_EVENT_MOUSE_ENTER_LEAVE_SUPPORTED;
        var enterEvent = mouseEnterLeaveSupport ? "mouseenter" : "mouseover";
        var exitEvent = mouseEnterLeaveSupport ? "mouseleave" : "mouseout";
        var rolloverEnterRef = Core.method(this, this._processRolloverEnter);
	    var rolloverExitRef = Core.method(this, this._processRolloverExit);
        var clickRef = Core.method(this, this._processClick);
            
        for (var rowIndex = 0; rowIndex < this._rowCount; ++rowIndex) {
            var tr = this._table.rows[rowIndex];
            if (!tr) {
             	return;
            } 
            if (this._rolloverEnabled) {
                Core.Web.Event.add(tr, enterEvent, rolloverEnterRef, false);
                Core.Web.Event.add(tr, exitEvent, rolloverExitRef, false);
            }
            if (this._selectionEnabled) {
                Core.Web.Event.add(tr, "click", clickRef, false);
                Core.Web.Event.Selection.disable(tr);
            }
        }
    },
    
    /**
     * Deselects all selected rows.
     */
    _clearSelected: function() {
        for (var i = 0; i < this._rowCount; ++i) {
            if (this.selectionModel.isSelectedIndex(i)) {
                this._setSelected(i, false);
            }
        }
    },
    
    /**
     * Creates a prototype TR element for the rendered table, containing style information
     * and TD elements representing the table cells.  This prototype may be cloned to
     * quickly generate the table DOM.
     * 
     * @return the prototype TR row element hierarchy
     * @type Element
     */
    _createRowPrototype: function(isHeader) {
        var tr = document.createElement("tr");
    
        var tdPrototype = document.createElement(isHeader ? "th" : "td");
	    if (isHeader) {
	    	//this is needed for the absolute positioning
	    	//of the resizeHandle (display:inline does not work in IE8)
			tdPrototype.style.position = "relative";
			tdPrototype.style.textAlign = "left";
	    } else {
	        //if (this._verticalLine) {
		        tdPrototype.style.borderRight = this._verticalLine;
		    //}
	        //if (this._horizontalLine) {
		        tdPrototype.style.borderBottom = this._horizontalLine;
		    //}
	    }
        
        tdPrototype.style.padding = this._defaultCellPadding;
        tdPrototype.style.overflow = "hidden";
        tdPrototype.style.textOverflow = "ellipsis";
    
        for (var columnIndex = 0; columnIndex < this._columnCount; columnIndex++) {
            var td = tdPrototype.cloneNode(false);
            td.className  = "cssColClass_" + columnIndex;            
            if (columnIndex == 0 && this._verticalLine) {
            	//draw the left-most vertical line
            	td.style.borderLeft = this._verticalLine;
            }
            tr.appendChild(td);

            if (isHeader) {
				td = document.createElement("td");
            	//td.style.background = "#ee00aa";
            	td.style.cursor = "col-resize";
            	td.style.padding = "0px";
		        td.style.borderRight = this._verticalLine;
            	tr.appendChild(td);
	        }            
        }
        return tr;
    },

    /**
     * Returns the table row index of the given TR element
     * 
     * @param {Element} element the TR table row element
     * @return the index of the specified row, or -1 if it cannot be found
     * @type Number
     */
    _getRowIndex: function(element) {
        var testElement = this._tbody.firstChild;
        var index = 0;
        while (testElement) {
            if (testElement == element) {
                return index;
            }
            testElement = testElement.nextSibling;
            ++index;
        }
        return -1;
    },
    
    /**
     * Processes a mouse click event on the table.
     */
    _processClick: function(e) {
        if (!this.client || !this.client.verifyInput(this.component)) {
            return true;
        }
        var tr = e.registeredTarget;
        var rowIndex = this._getRowIndex(tr);
        if (rowIndex == -1) {
            return;
        }
        
        Core.Web.DOM.preventEventDefault(e);
    
        if (this.selectionModel.getSelectionMode() == Echo.Sync.RemoteTable.ListSelectionModel.SINGLE_SELECTION || 
                !(e.shiftKey || e.ctrlKey || e.metaKey || e.altKey)) {
            this._clearSelected();
        }
    
        if (!this.selectionModel.getSelectionMode() == Echo.Sync.RemoteTable.ListSelectionModel.SINGLE_SELECTION && 
                e.shiftKey && this.lastSelectedIndex != -1) {
            var startIndex;
            var endIndex;
            if (this.lastSelectedIndex < rowIndex) {
                startIndex = this.lastSelectedIndex;
                endIndex = rowIndex;
            } else {
                startIndex = rowIndex;
                endIndex = this.lastSelectedIndex;
            }
            for (var i = startIndex; i <= endIndex; ++i) {
                this._setSelected(i, true);
            }
        } else {
            this.lastSelectedIndex = rowIndex;
            this._setSelected(rowIndex, !this.selectionModel.isSelectedIndex(rowIndex));
        }
        this.component.set("selection", this.selectionModel.getSelectionString());
        this.component.doAction();
    },
    
    /**
     * Processes a mouse rollover enter event on a table row.
     */
    _processRolloverEnter: function(e) {
        if (!this.client || !this.client.verifyInput(this.component)) {
            return true;
        }
        var tr = e.registeredTarget;
        for (var i = 0; i < tr.cells.length; ++i) {
            var cell = tr.cells[i];
            Echo.Sync.Font.renderClear(this.component.render("rolloverFont"), cell);
            Echo.Sync.Color.render(this.component.render("rolloverForeground"), cell, "color");
            Echo.Sync.Color.render(this.component.render("rolloverBackground"), cell, "background");
            Echo.Sync.FillImage.render(this.component.render("rolloverBackgroundImage"), cell); 
        }
    },
    
    /**
     * Processes a mouse rollover exit event on a table row.
     */
    _processRolloverExit: function(e) {
        if (!this.client || !this.client.verifyInput(this.component)) {
            return true;
        }
        var tr = e.registeredTarget;
        var rowIndex = this._getRowIndex(tr);
        this._renderRowStyle(rowIndex);
    },
    
    /** @see Echo.Render.ComponentSync#renderAdd */
    renderAdd: function(update, parentElement) {
        this._columnCount = parseInt(this.component.render("columnCount"), 10);
        this._rowCount = parseInt(this.component.render("rowCount"), 10);
        this._height = this.component.render("height");
        this._width = this.component.render("width");
        this._selectionEnabled = this.component.render("selectionEnabled");
        this._rolloverEnabled = this.component.render("rolloverEnabled");
        this._headerVisible = this.component.render("headerVisible", true);
        this._zebraBackground = this.component.render("zebraBackground");
        this._verticalLine = this.component.render("verticalLine");
        this._horizontalLine = this.component.render("horizontalLine");
        this._columnWeights = this.component.render("columnWeights");
        this._defaultInsets = this.component.render("insets", 0);
        this._defaultPixelInsets = Echo.Sync.Insets.toPixels(this._defaultInsets);
        this._defaultCellPadding = Echo.Sync.Insets.toCssValue(this._defaultInsets);        
        this._useDefaultSelectionStyle = this._selectionEnabled && !this.component.render("selectionForeground") &&
                !this.component.render("selectionBackground") && !this.component.render("selectionBackgroundImage") &&
                !this.component.render("selectionFont");
        
        if (this._selectionEnabled) {
            this.selectionModel = new Echo.Sync.RemoteTable.ListSelectionModel(
                    parseInt(this.component.get("selectionMode"), 10));
        }
        
        this._div = document.createElement("div");
        this._div.id = this.component.renderId;
        this._div.style.position = "relative";
        this._div.style.overflow = "hidden";
        Echo.Sync.RoundedCorner.render(this.component.render("radius"), this._div);
        Echo.Sync.BoxShadow.render(this.component.render("boxShadow"), this._div);
        Echo.Sync.Border.render(this.component.render("border"), this._div);
        Echo.Sync.Color.render(this.component.render("background"), this._div, "backgroundColor");
        Echo.Sync.FillImage.render(this.component.render("backgroundImage"), this._div);
        
        if (this._height) {
   	        this._div.style.height = Echo.Sync.Extent.toCssValue(this._height, false, true);
	    }
        if (this._width) {
            this._div.style.width = Echo.Sync.Extent.toCssValue(this._width, true, true);
			if (Echo.Sync.Extent.isPercent(this._width)) {
				this._resizePolicy = Echo.Sync.RemoteTableSync._RESIZE_COLGROUP_PERCENT;
			} else {
				this._resizePolicy = Echo.Sync.RemoteTableSync._RESIZE_COLGROUP_PIXEL;
			}
   		}     
        this._div.style.textAlign = "left";
        
        var margins = this.component.render("margins");
        if (margins) {
        	//create an outer div for the margins
        	var outerDiv = document.createElement("div");
            Echo.Sync.Insets.render(margins, outerDiv, "padding");
            outerDiv.appendChild(this._div);
            parentElement.appendChild(outerDiv);
        } else {
        	parentElement.appendChild(this._div);
        }

        if (this._headerVisible) {
        	this._divHeader = document.createElement("div");
        	this._divHeader.style.marginRight = "17px";
        	this._divHeader.style.overflow = "hidden";
      	    Echo.Sync.Color.render(this.component.render("headerBackground"), this._divHeader, "backgroundColor");
      	    Echo.Sync.Color.render(this.component.render("headerForeground"), this._divHeader, "color");
      	    var separatorLine = this.component.render("separatorLine");
      	    if (separatorLine) {
			    this._divHeader.style.borderBottom = separatorLine;
		    }
	        this._div.appendChild(this._divHeader);

			//this div just sets the background of the upper right corner
        	this._divHeader2 = document.createElement("div");
        	this._divHeader2.style.position = "absolute";
        	this._divHeader2.style.right = "0px";
        	this._divHeader2.style.top = "0px";
        	this._divHeader2.style.width = "17px";
        	//this._divHeader2.style.height = "24px";
      	    Echo.Sync.Color.render(this.component.render("headerBackground"), this._divHeader2, "backgroundColor");
      	    Echo.Sync.Color.render(this.component.render("headerBackground"), this._divHeader2, "backgroundColor");
      	    if (separatorLine) {
			    this._divHeader2.style.borderBottom = separatorLine;
		    }
            this._div.appendChild(this._divHeader2);
            
        	this._tableHeader = document.createElement("table");
        	if (this._width) {
	        	this._tableHeader.style.width = "100%";
	        }
        	this._tableHeader.style.height = "100%";
			this._tableHeader.style.borderCollapse = "collapse";
	        this._tableHeader.style.whiteSpace = "nowrap";  //TODO make configurable
	        this._tableHeader.style.tableLayout = "fixed";
	        this._divHeader.appendChild(this._tableHeader);
	        
	        this._colGroupHeader = document.createElement("colgroup");
	        for (var i = 0; i < this._columnCount * 2; ++i) {
	            this._colGroupHeader.appendChild(document.createElement("col"));
	        }
	        this._tableHeader.appendChild(this._colGroupHeader);
        
        	this._tbodyHeader = document.createElement("tbody");
	        this._tableHeader.appendChild(this._tbodyHeader);
	        
	        //create body div element
		    this._divTable = document.createElement("div");
		    this._divTable.style.position = "absolute";
		    this._divTable.style.bottom = "0px";
		    this._divTable.style.left = "0px";
		    this._divTable.style.right = "0px";
		    this._divTable.style.overflow = "auto";
			this._div.appendChild(this._divTable);
			
			//sync header and body scrolls
			var that = this;
	   		this._divTable.onscroll = function(e) {
				that._divHeader.scrollLeft = that._divTable.scrollLeft;
	 		};			
        }
        
        this._table = document.createElement("table");
        this._table.style.borderSpacing = "0px";
        this._table.style.whiteSpace = "nowrap";  //TODO make configurable
        this._table.style.tableLayout = "fixed";  //needed so columns can get smaller than content
        
        Echo.Sync.renderComponentDefaults(this.component, this._table);
        
        if (this._headerVisible) {
	        this._divTable.appendChild(this._table);
        } else {
            this._div.appendChild(this._table);        
        }

        this._colGroupBody = this._buildColGroup();
        this._table.appendChild(this._colGroupBody);
        if (this._width) {
            this._table.style.width = "100%";
		}
        this._tbody = document.createElement("tbody");
        this._table.appendChild(this._tbody);
        
        if (this._headerVisible) {
	        var trHeaderPrototype = this._createRowPrototype(true);
            this._tbodyHeader.appendChild(this._renderRow(update, Echo.Sync.RemoteTableSync._HEADER_ROW, trHeaderPrototype));
        }
        
        var trPrototype = this._createRowPrototype(false);        
        for (var rowIndex = 0; rowIndex < this._rowCount; rowIndex++) {
        	var zebra = rowIndex % 2 == 1 ? null : this._zebraBackground;
            this._tbody.appendChild(this._renderRow(update, rowIndex, trPrototype, zebra));
        }
        
        if (this._selectionEnabled) {
            this._table.style.cursor = "pointer";
            this._setSelectedFromProperty(this.component.get("selection"), false);
        }
        
        if (this._headerVisible) {
	        this._resizeGhost = document.createElement("div");
	        this._resizeGhost.style.display = "none"; 
			this._resizeGhost.id = "resizeGhostId"; 
			this._resizeGhost.style.position = "absolute"; 
			this._resizeGhost.style.height = "280px"; //XXX
			this._resizeGhost.style.width = "4px";
			this._resizeGhost.style.left = "40px";
			this._resizeGhost.style.top = "15px";
			this._resizeGhost.style.cursor = "col-resize";
			this._resizeGhost.style.background = "#666666";
	        this._div.appendChild(this._resizeGhost);
		}
        
        this._addEventListeners();
        this.renderDisplay();
    },


    /** @see Echo.Render.ComponentSync#renderDisplay */
    renderDisplay: function() {
    	
    	var headerHeight = 0;
    	if (this._headerVisible) {
	    	headerHeight = this._tableHeader.clientHeight;
    	}
		if (!this._height) {
			//height is not set, so calculate it and adjust outer div accordingly
			var actualTableHeight = this._table.clientHeight;
    		this._div.style.height = (headerHeight + actualTableHeight) + "px";
		}		
		if (!this._headerVisible) {
			return;
		}
		
    	this._divHeader.style.height = headerHeight + "px";
    	
    	var separatorHeight = this._divHeader.style.borderBottomWidth;
    	if (separatorHeight) {
    		headerHeight += parseInt(separatorHeight); 
    	}
    	this._divTable.style.top = headerHeight  + "px";
		var scrollVisible = this._divTable.scrollHeight > this._divTable.clientHeight;
    	this._divHeader.style.marginRight = scrollVisible ? "17px" : "0px";
    	
    	if (this._table.rows.length === 0) return;
    	
    	//sync header column widths with main table widths
		var t0Row = this._tableHeader.rows[0];
    	var t1Row = this._table.rows[0];
    	if (this._width) {
	    	for (var i = 0; i < t1Row.cells.length; i++) {
	    		var redux = i == 0 ? 9 : 6; 
		    	this._colGroupHeader.children[i * 2].style.width = (t1Row.cells[i].offsetWidth - redux) + "px";
		    	this._colGroupHeader.children[i * 2 + 1].style.width = "6px";
			}
    	} else {
    		//no width set
	    	for (var i = 0; i < t1Row.cells.length; i++) {
	    		var width = Math.max(t0Row.cells[i].offsetWidth, t1Row.cells[i].offsetWidth);
			    this._colGroupHeader.children[i * 2].style.width = width + "px";
			    this._colGroupBody.children[i].style.width = width + "px";
			   // t0Row.cells[i * 2].style.minWidth = (width - 6)+ "px";
			   // t0Row.cells[i * 2 + 1].style.minWidth = "6px";
			   //t1Row.cells[i].style.minWidth = width + "px";
			}
		}
			
    },

    /** @see Echo.Render.ComponentSync#renderDispose */
    renderDispose: function(update) {
        if (this._rolloverEnabled || this._selectionEnabled) {
            var tr = this._tbody.firstChild;
            if (this._headerVisible) {
                tr = tr.nextSibling;
            }
            while (tr) {
                Core.Web.Event.removeAll(tr);
                tr = tr.nextSibling;
            }
        }
        this._div = null;
       	this._divHeader = null;
       	this._divHeader2 = null;
       	this._tableHeader = null;
        this._colGroupHeader = null;
       	this._tbodyHeader = null;
        this._divTable = null;
        this._table = null;
        this._colGroupBody = null;
        this._tbody = null;
        this._resizeGhost = null;
    },
    
    /**
     * Renders an appropriate style for a row (i.e. selected or deselected).
     *
     * @param {Number} rowIndex the index of the row
     */
    _renderRowStyle: function(rowIndex) {
        var selected = this._selectionEnabled && this.selectionModel.isSelectedIndex(rowIndex);
        var tr = this._tbody.childNodes[rowIndex];
        var td = tr.firstChild;
        
        var columnIndex = 0;
        
        while (td) {
            if (selected) {
                if (this._useDefaultSelectionStyle) {
                    Echo.Sync.Color.render(Echo.Sync.RemoteTable.DEFAULT_SELECTION_FOREGROUND, td, "color");
                    Echo.Sync.Color.render(Echo.Sync.RemoteTable.DEFAULT_SELECTION_BACKGROUND, td, "background");
                } else {
                    Echo.Sync.Font.renderClear(this.component.render("selectionFont"), td);
                    Echo.Sync.Color.render(this.component.render("selectionForeground"), td, "color");
                    Echo.Sync.Color.render(this.component.render("selectionBackground"), td, "background");
                    Echo.Sync.FillImage.render(this.component.render("selectionBackgroundImage"), td);
                }
            } else {
                td.style.color = "";
                td.style.backgroundColor = "";
                td.style.backgroundImage = "";
                Echo.Sync.Font.renderClear(null, td);
                
                var child = this.component.getComponent((rowIndex + (this._headerVisible ? 1 : 0)) * 
                        this._columnCount + columnIndex);
                var layoutData = child.render("layoutData");

                if (layoutData) {
                    Echo.Sync.Color.render(layoutData.background, td, "backgroundColor");
                    Echo.Sync.FillImage.render(layoutData.backgroundImage, td);
                }
            
            }
            td = td.nextSibling;
            ++columnIndex;
        }
    },
    
    /**
     * Renders a single row.
     *
     * @param {Echo.Update.ComponentUpdate} update the update
     * @param {Number} rowIndex the index of the row
     * @param {Element} trPrototype a TR element containing the appropriate number of TD elements with default
     *        styles applied (This is created by _renderRowStyle().  Providing this attribute is optional,
     *        and is specified for performance reasons. If omitted one is created automatically.)
     * @return the created row
     * @type Element
     */
    _renderRow: function(update, rowIndex, trPrototype, zebra) {
        var tr = trPrototype.cloneNode(true);
		if (zebra) {
			tr.style.background = zebra;
		}
        
        var td = tr.firstChild;
        for (var columnIndex = 0; columnIndex < this._columnCount; columnIndex++) {        
            var child = this.component.getComponent((rowIndex + (this._headerVisible ? 1 : 0)) * this._columnCount + columnIndex);
            if (!child) break;  //XXX
            var layoutData = child.render("layoutData");            
            if (layoutData) {
                Echo.Sync.Insets.render(layoutData.insets, td, "padding");
                Echo.Sync.Alignment.render(layoutData.alignment, td, true, this.component);
                Echo.Sync.FillImage.render(layoutData.backgroundImage, td);
                Echo.Sync.Color.render(layoutData.background, td, "backgroundColor");
            }
    
            Echo.Render.renderComponentAdd(update, child, td);
            td = td.nextSibling;
            if (rowIndex === -1) {
               	var resizeListener = new ColumnResizeListener(columnIndex, td, this);
				resizeListener.addMoveListener(td); 
            	td = td.nextSibling;
            }
        }
        return tr;
    },
    
    /** @see Echo.Render.ComponentSync#renderUpdate */
    renderUpdate: function(update) {
        if (!update.hasUpdatedLayoutDataChildren() && !update.getAddedChildren() && !update.getRemovedChildren()) {
            if (Core.Arrays.containsAll(Echo.Sync.RemoteTableSync._supportedPartialProperties, 
                    update.getUpdatedPropertyNames(), true)) {
                // partial update
                if (this._selectionEnabled) {
                    var selectionUpdate = update.getUpdatedProperty("selection");
                    if (selectionUpdate) {
                        this._setSelectedFromProperty(selectionUpdate.newValue, true);
                    }
                }
                return false;
            }
        }
        // full update
        var element = this._div;
        var containerElement = element.parentNode;
        Echo.Render.renderComponentDispose(update, update.parent);
        containerElement.removeChild(element);
        this.renderAdd(update, containerElement);
        return true;
    },
    
    /**
     * Sets the selection state based on the given selection property value.
     *
     * @param {String} value the value of the selection property
     * @param {Boolean} clearPrevious if the previous selection state should be overwritten
     */
    _setSelectedFromProperty: function(value, clearPrevious) {
        if (value == this.selectionModel.getSelectionString()) {
            return;
        }
        if (clearPrevious) {
            this._clearSelected();
        }
        var selectedIndices = value.split(",");
        for (var i = 0; i < selectedIndices.length; i++) {
            if (selectedIndices[i] === "") {
                continue;
            }
            this._setSelected(parseInt(selectedIndices[i], 10), true);
        }
    },
    
    /**
     * Sets the selection state of a table row.
     *
     * @param {Number} rowIndex the index of the row
     * @param {Boolean} newValue the new selection state
     */
    _setSelected: function(rowIndex, newValue) {
        this.selectionModel.setSelectedIndex(rowIndex, newValue);
        this._renderRowStyle(rowIndex);
    },
    
    _buildColGroup: function() {
    	var colGroupElement = document.createElement("colgroup");	
        for (var i = 0; i < this._columnCount; ++i) {
            var colElement = document.createElement("col");
            width = this.component.renderIndex("columnWidth", i); 
            if (width == null) {
            	//colElement.style.width = (100 / this._columnCount) + "%";
            } else if (Echo.Sync.Extent.isPercent(width)) {
                colElement.style.width = width.toString();
            } else {
                var columnPixels = Echo.Sync.Extent.toPixels(width, true);
                colElement.style.width = columnPixels + "px";
            }
            colGroupElement.appendChild(colElement);
        }
      	return colGroupElement;
	}
    
});

/**
 * @class Minimalistic representation of ListSelectionModel.
 */
Echo.Sync.RemoteTable.ListSelectionModel = Core.extend({

    $static: {
    
        /**
         * Value for selection mode setting indicating single selection.
         * 
         * @type Number
         * @final
         */
        SINGLE_SELECTION: 0,
        
        /**
         * Value for selection mode setting indicating multiple selection.
         * 
         * @type Number
         * @final
         */
        MULTIPLE_SELECTION: 2
    },
    
    /**
     * Property class name.
     * @type String
     * @final
     */
    className: "ListSelectionModel",

    /**
     * Creates a ListSelectionModel.
     * 
     * @param {Number} selectionMode the selectionMode
     * @constructor
     *
     */
    $construct: function(selectionMode) {
        this._selectionState = [];
        this._selectionMode = selectionMode;
    },
    
    /**
     * Returns the selection mode. 
     * 
     * @return the selection mode
     * @type Number
     */
    getSelectionMode: function() {
        return this._selectionMode;
    },
    
    /**
     * Gets a comma-delimited list containing the selected indices.
     * 
     * @return the list
     * @type String
     */
    getSelectionString: function() {
        var selection = "";
        for (var i = 0; i < this._selectionState.length; i++) {
            if (this._selectionState[i]) {
                if (selection.length > 0) {
                    selection += ",";
                }
                selection += i;
            }
        }
        return selection;
    },
    
    /**
     * Determines whether an index is selected.
     * 
     * @param {Number} index the index
     * @return true if the index is selected
     * @type Boolean
     */
    isSelectedIndex: function(index) {
        if (this._selectionState.length <= index) {
            return false;
        } else {
            return this._selectionState[index];
        }
    },
    
    /**
     * Sets the selection state of the given index.
     * 
     * @param {Number} index the index
     * @param {Boolean} selected the new selection state
     */
    setSelectedIndex: function(index, selected) {
        this._selectionState[index] = selected;
    }    
});



ColumnResizeListener = Core.extend(Echo.MouseListener, {

    $construct: function(col, resizeHandle, thisRef) {
        this._col = col;
     	this._mainDiv = thisRef._div;
     	this._thisRef = thisRef;
     	this._resizeHandle = resizeHandle;
    },

	_startX : 0, 
	_initTableWidth : 0, 
	_offset : 0,
	_targetColumn: null,
	              	
	getColRatioWidth: function() {
		var tw = 0;
		//for(var i = 0; i < options.colratio.length; i++){
			tw += 80; //parseInt(options.colratio[i]);
		//}
		return tw;
	},
	
	onDown: function (e) {
		this._resizeGhost = document.getElementById("resizeGhostId");
		this._startX = 0; 
		this._initTableWidth = this.getColRatioWidth();
		
		var t1Row = this._thisRef._tableHeader.rows[0];
		this._offset = 0;
		for(var i = 0; i <= this._col * 2; i++){
    		this._offset += t1Row.cells[i].offsetWidth;
    	}
		this._resizeGhost.style.display = "block";
		this._resizeGhost.style.left = this._offset + "px";
	},
	
	onMove: function (delta) {
		this._startX += delta.x;
		this._resizeGhost.style.left = (this._offset + this._startX) + "px";
	},
	
	onUp: function (event) {
		var thisColWidth = parseFloat(this._thisRef._colGroupHeader.children[this._col * 2].style.width) + 6;
		var newWidth = thisColWidth + this._startX;
    	var t0Row = this._thisRef._tableHeader.rows[0];
    	var t1Row = this._thisRef._table.rows[0];
    	var deltaWidth = this._startX;
    	
    	var isPercent = true;
    	switch (this._thisRef._resizePolicy) {
		case Echo.Sync.RemoteTableSync._RESIZE_COLGROUP_PIXEL:
			isPercent = false;
		case Echo.Sync.RemoteTableSync._RESIZE_COLGROUP_PERCENT:
			var nextColWidth = parseFloat(this._thisRef._colGroupHeader.children[this._col * 2 + 2].style.width) + 6;
			if (nextColWidth - deltaWidth < 13) {
				//next column must not be less than 13px
				deltaWidth = nextColWidth - 13;
			} else if (thisColWidth + deltaWidth < 13) {
				//this column must not be less than 13px				
				deltaWidth = 13 - thisColWidth;
			}
			var unitSign = isPercent ? "%" : "px";
			if (isPercent) {
				//calculate the difference in percentage
				deltaWidth = 100 / this._thisRef._table.offsetWidth * deltaWidth;  //TODO consider total width != 100%
			}
			
			this._thisRef._colGroupBody.children[this._col].style.width = (thisColWidth + deltaWidth) + unitSign;
			this._thisRef._colGroupBody.children[this._col + 1].style.width= (nextColWidth - deltaWidth) + unitSign;
			
			for (var i = 0; i < 4; i++) {
				if (!this._thisRef._colGroupBody.children[i].style.width) {
					this._thisRef._colGroupBody.children[i].style.width = t1Row.cells[i].offsetWidth + "px";
					console.log(i + ":  " + this._thisRef._colGroupBody.children[i].style.width);
				}			
			}
			this._thisRef.renderDisplay();
			break;
		default:
			var w = thisColWidth + deltaWidth;
			//respect minimum size
			if (w < 16) w = 16;
			//these special measures are needed to make the columns smaller than their actual content
			if (Core.Web.Env.BROWSER_INTERNET_EXPLORER) {
				this._thisRef._table.style.width = "100%";
				this._thisRef._tableHeader.style.width = "100%";
			} else {
				var t = ".cssColClass_" + this._col + " {min-width: " + (w - 16) + "px;max-width: " + (w - 16) + "px;}";
				this._thisRef.CSS_COL_STYLE[this._col].innerHTML = t;
			}

			this._thisRef._colGroupHeader.children[this._col * 2].style.width = w + "px";
			this._thisRef._colGroupBody.children[this._col].style.width = w + "px";
		}
		this._resizeGhost.style.display = "none";
	}
});
