/*!
 * Fokus 0.1
 * http://lab.hakim.se/fokus
 * MIT licensed
 *
 * Copyright (C) 2011-2012 Hakim El Hattab, http://hakim.se
 */

(function(){

	// Padding around the selection
	var PADDING = 5;

	// The opaque overlay canvas
	var overlay,
		overlayContext,
		overlayAlpha = 0,

		// Reference to the redraw animation so it can be cancelled 
		redrawAnimation,

		highlight = { left: 0, top: 0, right: 0, bottom: 0 };

	// choo choo!
	function initialize() {
		overlay = document.createElement( 'canvas' );
		overlayContext = overlay.getContext( '2d' );

		// Place the canvas on top of 
		overlay.style.position = 'fixed';
		overlay.style.left = 0;
		overlay.style.top = 0;
		overlay.style.zIndex = 2147483647; // beat that with your measly 32 bits
		overlay.style.pointerEvents = 'none';

		bindEvent( document, 'mousedown', onMouseDown );
		bindEvent( window, 'resize', onWindowResize );

		// Trigger an initial resize
		onWindowResize();
	}

	/**
	 * Redraws the overlay and clears the current highlights.
	 */
	function redraw() {
		// Reset to a solid (less opacity) overlay fill
		overlayContext.clearRect( 0, 0, overlay.width, overlay.height );
		overlayContext.fillStyle = 'rgba( 0, 0, 0, '+ overlayAlpha +' )';
		overlayContext.fillRect( 0, 0, overlay.width, overlay.height );

		// Fade in if there's a highlight...
		if( hasHighlight() ) {
			overlayContext.clearRect( 
				highlight.left - window.scrollX - PADDING, 
				highlight.top - window.scrollY - PADDING, 
				( highlight.right - highlight.left ) + ( PADDING * 2 ), 
				( highlight.bottom - highlight.top ) + ( PADDING * 2 ) 
			);

			overlayAlpha += ( 0.8 - overlayAlpha ) * 0.05;
		}
		// ... otherwise fade out
		else {
			overlayAlpha = Math.max( ( overlayAlpha * 0.85 ) - 0.01, 0 );
		}

		// Continue so long as there are highlights remaining or we are 
		// fading out
		if( hasHighlight() || overlayAlpha > 0 ) {
			// Append the overlay if it isn't already in the DOM
			if( !overlay.parentNode ) document.body.appendChild( overlay );

			// Stage a new animation frame
			cancelAnimationFrame( redrawAnimation );
			redrawAnimation = requestAnimationFrame( redraw );
		}
		else {
			document.body.removeChild( overlay );
		}
	}

	/**
	 * Steps through all selected nodes and creates a 
	 * highlight region.
	 */
	function updateSelection() {
		// Default to no highlight
		highlight = { left: Number.MAX_VALUE, top: Number.MAX_VALUE, right: 0, bottom: 0 };

		var nodes = getSelectedNodes();

		for( var i = 0, len = nodes.length; i < len; i++ ) {
			var node = nodes[i];

			// if( len === 1 && node.nodeName === '#text' ) {
			// 	node = node.parentNode;
			// }

			var x = node.offsetLeft, 
				y = node.offsetTop, 
				w = node.offsetWidth, 
				h = node.offsetHeight;

			if( node && typeof x === 'number' && typeof w === 'number' ) {
				highlight.left = Math.min( highlight.left, x );
				highlight.top = Math.min( highlight.top, y );
				highlight.right = Math.max( highlight.right, x + w );
				highlight.bottom = Math.max( highlight.bottom, y + h );
			}
		}

		if( hasHighlight() ) {
			redraw();
		}
	}

	/**
	 * Checks if a region is currently highlighted/selected.
	 */
	function hasHighlight() {
		return highlight.left < highlight.right && highlight.top < highlight.bottom;
	}

	function onMouseDown( event ) {
		bindEvent( document, 'mousemove', onMouseMove );
		bindEvent( document, 'mouseup', onMouseUp );

		updateSelection();
	}

	function onMouseMove( event ) {
		updateSelection();
	}

	function onMouseUp( event ) {
		// console.log(getSelectionHtml());
		unbindEvent( document, 'mousemove', onMouseMove );
		unbindEvent( document, 'mouseup', onMouseUp );

		setTimeout( updateSelection, 1 );
	}

	function onWindowResize( event ) {
		overlay.width = window.innerWidth;
		overlay.height = window.innerHeight;
	}

	/**
	 * Adds an event listener in a browser safe way.
	 */
	function bindEvent( element, ev, fn ) {
		if( element.addEventListener ) {
			element.addEventListener( ev, fn, false );
		}
		else {
			element.attachEvent( 'on' + ev, fn );
		}
	}

	/**
	 * Removes an event listener in a browser safe way.
	 */
	function unbindEvent( element, ev, fn ) {
		if( element.removeEventListener ) {
			element.removeEventListener( ev, fn, false );
		}
		else {
			element.detachEvent( 'on' + ev, fn );
		}
	}

	/**
	 * Helper methods for getting selected nodes, source:
	 * http://stackoverflow.com/questions/7781963/js-get-array-of-all-selected-nodes-in-contenteditable-div
	 */
	function getSelectedNodes() {
		if (window.getSelection) {
			var sel = window.getSelection();
			if (!sel.isCollapsed) {
				return getRangeSelectedNodes(sel.getRangeAt(0));
			}
		}
		return [];
	}
	function getRangeSelectedNodes( range ) {
		var node = range.startContainer;
		var endNode = range.endContainer;

		// Special case for a range that is contained within a single node
		if (node == endNode) {
			if( node.nodeName === '#text' ) {
				return [node.parentNode];
			}
			return [node];
		}

		// Iterate nodes until we hit the end container
		var rangeNodes = [];
		while (node && node != endNode) {
			rangeNodes.push( node = nextNode(node) );
		}

		// Add partially selected nodes at the start of the range
		node = range.startContainer;
		while (node && node != range.commonAncestorContainer) {
			rangeNodes.unshift(node);
			node = node.parentNode;
		}	    

		return rangeNodes;
	}
	function nextNode(node) {
		if (node.hasChildNodes()) {
			return node.firstChild;
		} else {
			while (node && !node.nextSibling) {
				node = node.parentNode;
			}
			if (!node) {
				return null;
			}
			return node.nextSibling;
		}
	}

	/**
	 * rAF polyfill.
	 */
	(function() {
		var lastTime = 0;
		var vendors = ['ms', 'moz', 'webkit', 'o'];
		for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
			window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
			window.cancelAnimationFrame = 
			  window[vendors[x]+'CancelAnimationFrame'] || window[vendors[x]+'CancelRequestAnimationFrame'];
		}
	 
		if (!window.requestAnimationFrame)
			window.requestAnimationFrame = function(callback, element) {
				var currTime = new Date().getTime();
				var timeToCall = Math.max(0, 16 - (currTime - lastTime));
				var id = window.setTimeout(function() { callback(currTime + timeToCall); }, 
				  timeToCall);
				lastTime = currTime + timeToCall;
				return id;
			};
	 
		if (!window.cancelAnimationFrame)
			window.cancelAnimationFrame = function(id) {
				clearTimeout(id);
			};
	}());

	initialize();

})();
