/**
 * Component rendering peer: Column
 */
EchoRender.ComponentSync.Column = function() {
};
  
EchoRender.ComponentSync.Column.prototype = new EchoRender.ComponentSync;

EchoRender.ComponentSync.Column.prototype.getContainerElement = function(component) {
    return document.getElementById(this.component.renderId + "_" + component.renderId);
};

EchoRender.ComponentSync.Column.prototype.processKeyDown = function(e) { 
    switch (e.keyCode) {
    case 38:
        var focusChanged = EchoRender.Focus.visitNextFocusComponent(this.component, true);
        if (focusChanged) {
            // Prevent default action (vertical scrolling).
            EchoWebCore.DOM.preventEventDefault(e);
        }
        return !focusChanged;
    case 40:
        var focusChanged = EchoRender.Focus.visitNextFocusComponent(this.component, false);
        if (focusChanged) {
            // Prevent default action (vertical scrolling).
            EchoWebCore.DOM.preventEventDefault(e);
        }
        return !focusChanged;
    }
};

EchoRender.ComponentSync.Column.prototype.renderAdd = function(update, parentElement) {
    this.cellSpacing = EchoRender.Property.Extent.toPixels(this.component.getRenderProperty("cellSpacing"), false);
    var insets = this.component.getRenderProperty("insets");

    this._divElement = document.createElement("div");
    this._divElement.id = this.component.renderId;
    this._divElement.style.outlineStyle = "none";
    this._divElement.tabIndex = "-1";
    EchoRender.Property.Border.render(this.component.getRenderProperty("border"), this._divElement);
    EchoRender.Property.Color.renderFB(this.component, this._divElement);
    EchoRender.Property.Insets.renderComponentProperty(this.component, "insets", null, this._divElement, "padding");

    this._spacingPrototype = document.createElement("div");
    this._spacingPrototype.style.height = this.cellSpacing + "px";
    this._spacingPrototype.style.fontSize = "1px";
    this._spacingPrototype.style.lineHeight = "0px";
    
    var componentCount = this.component.getComponentCount();
    for (var i = 0; i < componentCount; ++i) {
        var child = this.component.getComponent(i);
        this._renderAddChild(update, child, this._divElement);
    }
    
    EchoWebCore.EventProcessor.add(this._divElement, "keydown", new EchoCore.MethodRef(this, this.processKeyDown), false);
    
    parentElement.appendChild(this._divElement);
};

EchoRender.ComponentSync.Column.prototype._renderAddChild = function(update, child, parentElement, index) {
    if (index != null && index == update.parent.getComponentCount() - 1) {
        index = null;
    }
    
    var divElement = document.createElement("div");
    divElement.id = this.component.renderId + "_"+ child.renderId;
    EchoRender.renderComponentAdd(update, child, divElement);

    var layoutData = child.getRenderProperty("layoutData");
    if (layoutData) {
        EchoRender.Property.Color.renderComponentProperty(layoutData, "background", null, divElement, "backgroundColor");
        EchoRender.Property.FillImage.renderComponentProperty(layoutData, "backgroundImage", null, divElement);
        EchoRender.Property.Insets.renderComponentProperty(layoutData, "insets", null, divElement, "padding");
		EchoRender.Property.Alignment.renderComponentProperty(layoutData, "alignment", null, divElement, false, this.component);
	    var height = layoutData.getProperty("height");
	    if (height) {
	    	divElement.style.height = EchoRender.Property.Extent.toPixels(height, false) + "px";
	    }
    }
    
    if (index == null) {
        // Full render or append-at-end scenario
        
        // Render spacing div first if index != 0 and cell spacing enabled.
        if (this.cellSpacing && parentElement.firstChild) {
            parentElement.appendChild(this._spacingPrototype.cloneNode(false));
        }

        // Render child div second.
        parentElement.appendChild(divElement);
    } else {
        // Partial render insert at arbitrary location scenario (but not at end)
        var insertionIndex = this.cellSpacing ? index * 2 : index;
        var beforeElement = parentElement.childNodes[insertionIndex]
        
        // Render child div first.
        parentElement.insertBefore(divElement, beforeElement);
        
        // Then render spacing div if required.
        if (this.cellSpacing) {
            parentElement.insertBefore(this._spacingPrototype.cloneNode(false), beforeElement);
        }
    }
};

EchoRender.ComponentSync.Column.prototype._renderRemoveChild = function(update, child) {
    var childElement = document.getElementById(this.component.renderId + "_" + child.renderId);
    var parentElement = childElement.parentNode;
    if (this.cellSpacing) {
        // If cell spacing is enabled, remove a spacing element, either before or after the removed child.
        // In the case of a single child existing in the column, no spacing element will be removed.
        if (childElement.previousSibling) {
            parentElement.removeChild(childElement.previousSibling);
        } else if (childElement.nextSibling) {
            parentElement.removeChild(childElement.nextSibling);
        }
    }
    parentElement.removeChild(childElement);
};

EchoRender.ComponentSync.Column.prototype.renderDispose = function(update) { 
    EchoWebCore.EventProcessor.remove(this._divElement, "keydown", new EchoCore.MethodRef(this, this.processKeyDown), false);
    this._divElement = null;
    this._spacingPrototype = null;
};

EchoRender.ComponentSync.Column.prototype.renderUpdate = function(update) {
    var fullRender = false;
    if (update.hasUpdatedProperties() || update.hasUpdatedLayoutDataChildren()) {
        // Full render
        fullRender = true;
    } else {
        var removedChildren = update.getRemovedChildren();
        if (removedChildren) {
            // Remove children.
            for (var i = 0; i < removedChildren.length; ++i) {
                this._renderRemoveChild(update, removedChildren[i]);
            }
        }
        var addedChildren = update.getAddedChildren();
        if (addedChildren) {
            // Add children.
            var parentElement = document.getElementById(this.component.renderId);
            for (var i = 0; i < addedChildren.length; ++i) {
                this._renderAddChild(update, addedChildren[i], parentElement, this.component.indexOf(addedChildren[i])); 
            }
        }
    }
    if (fullRender) {
        EchoRender.Util.renderRemove(update, update.parent);
        var containerElement = EchoRender.Util.getContainerElement(update.parent);
        this.renderAdd(update, containerElement);
    }
    
    return fullRender;
};

EchoRender.registerPeer("Column", EchoRender.ComponentSync.Column);
