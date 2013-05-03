Echo.Sync.MoveMixins = {

	DOWN: null,
	MOVE: null,
    UP: null,
    CLICK: null,
    _methodMoveRef: null,
    _methodUpRef: null,		        
    _currentTarget: null,
     
	init: function() {
        var isIPad = navigator.userAgent.match(/iPad/i) != null;
        var isAndroid = navigator.userAgent.match(/Android/i) != null;
        var isTouch = isIPad || isAndroid;
		this.DOWN = isTouch ? 'touchstart' : 'mousedown';
		this.MOVE = isTouch ? 'touchmove' : 'mousemove';
        this.UP = isTouch ? 'touchend' : 'mouseup';
        this.CLICK = isTouch ? 'touchstart' : 'click';
        this._methodMoveRef = Core.method(this, this._onMove);
        this._methodUpRef = Core.method(this, this._onUp);        
    },
    
    
	getX: function(event, absolute) {
		if (event.touches) {
			if (absolute) {
				return event.targetTouches[0].pageX;
			} else {
				var totalOffsetX = 0;
				var curElement = this._targetNode;			
				do {
					totalOffsetX += curElement.offsetLeft;
				} while (curElement = curElement.offsetParent);
				return event.targetTouches[0].pageX - totalOffsetX;
			}						
		} else {
			return event.offsetX;
		}
	},
	
	getY: function(event, absolute) {
		if (event.touches) {
			if (absolute) {
				return event.targetTouches[0].pageY;
			} else {
				var totalOffsetY = 0;
				var curElement = this._targetNode;
				do {
					totalOffsetY += curElement.offsetTop;
				} while (curElement = curElement.offsetParent);
				return event.targetTouches[0].pageY - totalOffsetY;
			}						
		} else {
			return event.offsetY;
		}
	},
	
	addMoveListener: function(target, targetNode) {
		this._currentTarget = target;
		this._targetNode = targetNode;
		target._previousX = 0;
	    target._previousY = 0;
	    if (target.onDown) target._callbackMethodDown = Core.method(target, target.onDown);
	    if (target.onMove) target._callbackMethodMove = Core.method(target, target.onMove);
	    if (target.onUp) target._callbackMethodUp = Core.method(target, target.onUp);
		Core.Web.Event.add(targetNode, this.DOWN, Core.method(this, this._onDown), false);
	},

	_onDown: function(event) {	
		Echo.Sync.MoveMixins._currentTarget = this._currentTarget;
		var posAbs = {	x: this.getX(event, true), y: this.getY(event, true) };
		var posRel = {	x: this.getX(event, false), y: this.getY(event, false) };
		this._currentTarget._previousX = posAbs.x;
		this._currentTarget._previousY = posAbs.y;		
		
	    // Prevent selections.
        Core.Web.dragInProgress = true;
        Core.Web.DOM.preventEventDefault(event);
        Core.Web.Event.add(document.body, this.MOVE, this._methodMoveRef, true);
        Core.Web.Event.add(document.body, this.UP, this._methodUpRef, true);
        
        if (this._currentTarget._callbackMethodDown) {
        	this._currentTarget._callbackMethodDown(posRel);
        }
	},

	_onMove: function(event) {
		var target = Echo.Sync.MoveMixins._currentTarget;
		var x = this.getX(event, true);
		var y = this.getY(event, true);
		var delta = {x: x - target._previousX, y: y - target._previousY};
		target._callbackMethodMove(delta);
		target._previousX = x;
		target._previousY = y;		
	},
	
	_onUp: function(event) {
		Core.Web.DOM.preventEventDefault(event);
		Core.Web.dragInProgress = false;
        Core.Web.Event.remove(document.body, this.MOVE, this._methodMoveRef, true);
        Core.Web.Event.remove(document.body, this.UP, this._methodUpRef, true);
        if (this._currentTarget._callbackMethodUp) {
        	this._currentTarget._callbackMethodUp();
        }
        
	},
};

Echo.Sync.MoveMixins.init();