Echo.MouseListener = Core.extend({

    $abstract: true,

    DOWN: null,
    MOVE: null,
    UP: null,
    CLICK: null,
    _methodMoveRef: null,
    _methodUpRef: null,

    init2: function() {
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

    $virtual: {
        onDown: function() {
        },
        onMove: function() {
        },
        onUp: function() {
        }
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
                    curElement = curElement.offsetParent;
                } while (curElement);
                return event.targetTouches[0].pageX - totalOffsetX;
            }
        } else {
            if (absolute) {
                return event.screenX;
            } else {
                return event.offsetX;
            }
        }
    },

    getY: function(event, absolute) {
        if (event.touches) {
            if (absolute) {
                return event.targetTouches[0].pageY;
            } else {
                var totalOffsetY = 0;
                var curElement = this;
                do {
                    totalOffsetY += curElement.offsetTop;
                    curElement = curElement.offsetParent;
                } while (curElement);
                return event.targetTouches[0].pageY - totalOffsetY;
            }
        } else {
            return event.offsetY;
        }
    },

    addMoveListener: function(targetNode) {
        if (!this.CLICK) {
            this.init2();
        }

        // this._targetNode = targetNode;
        this._previousX = 0;
        this._previousY = 0;
        Core.Web.Event.add(targetNode, this.DOWN, Core.method(this, this._onDown), false);
    },

    _onDown: function(event) {
        var posAbs = {
            x: this.getX(event, true),
            y: this.getY(event, true)
        };
        var posRel = {
            x: this.getX(event, false),
            y: this.getY(event, false)
        };
        this._previousX = posAbs.x;
        this._previousY = posAbs.y;

        // Prevent selections.
        Core.Web.dragInProgress = true;
        Core.Web.DOM.preventEventDefault(event);
        Core.Web.Event.add(document.body, this.MOVE, this._methodMoveRef, true);
        Core.Web.Event.add(document.body, this.UP, this._methodUpRef, true);
        this.onDown(event);
    },

    _onMove: function(event) {
        var x = this.getX(event, true);
        var y = this.getY(event, true);
        var delta = {
            x: x - this._previousX,
            y: y - this._previousY
        };
        this.onMove(delta);
        this._previousX = x;
        this._previousY = y;
    },

    _onUp: function(event) {
        Core.Web.DOM.preventEventDefault(event);
        Core.Web.dragInProgress = false;
        Core.Web.Event.remove(document.body, this.MOVE, this._methodMoveRef, true);
        Core.Web.Event.remove(document.body, this.UP, this._methodUpRef, true);
        this.onUp();
    }
});
