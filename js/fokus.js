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

	// Opacity of the overlay
	var OPACITY = 0.75;

	// The opaque overlay canvas
	var overlay,
		overlayContext,
		overlayAlpha = 0,

		// Reference to the redraw animation so it can be cancelled 
		redrawAnimation,

		// Currently selected region
		currentRegion = { left: 0, top: 0, right: 0, bottom: 0 },

		// Currently cleared region
		clearedRegion = { left: 0, top: 0, right: 0, bottom: 0 };

	// choo choo!
	function initialize() {

		// Only initialize if the client is capable
		if( capable() && !window.__fokused ) {

			// Ensures that Fokus isn't initialized twice on the same page
			window.__fokused = true;

			overlay = document.createElement( 'canvas' );
			overlayContext = overlay.getContext( '2d' );

			// Place the canvas on top of 
			overlay.style.position = 'fixed';
			overlay.style.left = 0;
			overlay.style.top = 0;
			overlay.style.zIndex = 2147483647; // beat that with your measly 32 bits
			overlay.style.pointerEvents = 'none';

			document.addEventListener( 'mousedown', onMouseDown, false );
			window.addEventListener( 'resize', onWindowResize, false );

			// Trigger an initial resize
			onWindowResize();

		}

	}

	/**
	 * Is this browser capable of running Fokus?
	 */
	function capable() {

		return !!( 
			'addEventListener' in document &&
			'pointerEvents' in document.body.style 
		);

	}

	/**
	 * Redraws an animates the overlay.
	 */
	function redraw() {

		// Reset to a solid (less opacity) overlay fill
		overlayContext.clearRect( 0, 0, overlay.width, overlay.height );
		overlayContext.fillStyle = 'rgba( 0, 0, 0, '+ overlayAlpha +' )';
		overlayContext.fillRect( 0, 0, overlay.width, overlay.height );

		// Cut out the cleared region
		overlayContext.clearRect( 
			clearedRegion.left - window.scrollX - PADDING, 
			clearedRegion.top - window.scrollY - PADDING, 
			( clearedRegion.right - clearedRegion.left ) + ( PADDING * 2 ), 
			( clearedRegion.bottom - clearedRegion.top ) + ( PADDING * 2 ) 
		);

		// Fade in if there's a valid selection...
		if( hasSelection() ) {
			overlayAlpha += ( OPACITY - overlayAlpha ) * 0.08;
		}
		// ... otherwise fade out
		else {
			overlayAlpha = Math.max( ( overlayAlpha * 0.85 ) - 0.02, 0 );
		}

		// Continue so long as there is content selected or we are fading out
		if( hasSelection() || overlayAlpha > 0 ) {
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
	 * Steps through all selected nodes and updates current region
	 * (bounds of selection).
	 */
	function updateSelection() {

		// Default to negative space
		currentRegion = { left: Number.MAX_VALUE, top: Number.MAX_VALUE, right: 0, bottom: 0 };

		var nodes = getSelectedNodes();
		
		for( var i = 0, len = nodes.length; i < len; i++ ) {
			var node = nodes[i];

			// Select parents of text nodes that have contents
			if( node.nodeName === '#text' && node.nodeValue.trim() ) {
				node = node.parentNode;
			}

			// Fetch the screen coordinates for this element
			var position = getScreenPosition( node );

			var x = position.x, 
				y = position.y, 
				w = node.offsetWidth, 
				h = node.offsetHeight;

			if( node && typeof x === 'number' && typeof w === 'number' ) {
				currentRegion.left = Math.min( currentRegion.left, x );
				currentRegion.top = Math.min( currentRegion.top, y );
				currentRegion.right = Math.max( currentRegion.right, x + w );
				currentRegion.bottom = Math.max( currentRegion.bottom, y + h );
			}
		}

		if( hasSelection() ) {
			clearedRegion = currentRegion;
			redraw();
		}

	}

	/**
	 * Checks if a region is currently selected.
	 */
	function hasSelection() {

		return currentRegion.left < currentRegion.right && currentRegion.top < currentRegion.bottom;

	}

	function onMouseDown( event ) {

		document.addEventListener( 'mousemove', onMouseMove, false );
		document.addEventListener( 'mouseup', onMouseUp, false );

		updateSelection();

	}

	function onMouseMove( event ) {

		updateSelection();

	}

	function onMouseUp( event ) {

		document.removeEventListener( 'mousemove', onMouseMove, false );
		document.removeEventListener( 'mouseup', onMouseUp, false );

		setTimeout( updateSelection, 1 );

	}

	function onWindowResize( event ) {

		overlay.width = window.innerWidth;
		overlay.height = window.innerHeight;

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
	 * Gets the x/y screen position of the target node, source:
	 * http://www.quirksmode.org/js/findpos.html
	 */
	function getScreenPosition( node ) {
		var x = 0,
			y = 0;

		if ( node.offsetParent ) {
			do {
				x += node.offsetLeft;
				y += node.offsetTop;
			} while ( node = node.offsetParent );
		}

		return { x: x, y: y };
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
