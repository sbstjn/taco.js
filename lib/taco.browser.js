'use strict';

/*jslint browser: true*/
/*global $, tacolors*/

/** taco.js v0.0.1 JavaScript **/

var drawPiePiece = function (ctx, center, radius, start, end, color) {
	ctx.beginPath();
	ctx.moveTo(center, center);
	ctx.arc(center, center, radius, Math.PI * (- 0.5 + 2 * start), Math.PI * (- 0.5 + 2 * end), false);
	ctx.lineTo(center, center);
	ctx.closePath();
	ctx.fillStyle = color;
	ctx.fill();
};

if (!tacolors) {
	var tacolors = {};
}

var checkColors = function () {
	if (!tacolors.canvas) {
		tacolors.canvas = "rgba(57,181,138,1)";
	}

	if (!tacolors.background) {
		tacolors.background = "rgba(0,126,100,1)";
	}

	if (!tacolors.empty) {
		tacolors.empty = "rgba(0,126,100,1)";
	}

	if (!tacolors.filled) {
		tacolors.filled = "rgba(57,181,138,1)";
	}
};

var drawBackground = function (ctx) {
	ctx.fillStyle = tacolors.canvas; // set canvas background color
	ctx.fillRect(0, 0, 36, 36);  // now fill the canvas
	ctx.fill();

	drawPiePiece(ctx, 18, 18, 0, 1, tacolors.background);
};

/**
 * Update value in taco.js container
 *
 * @param object element
 * @param integer value
 */
var updateValue = function (element, value) {
	element.find('span').html(parseInt(value, 10));
	$('#tacoLabel').html('Thank you!');
};

var Taco = function (element) {
	checkColors();

	// Load data from HTML attribute or by current URL
	this.id = window.btoa(element.attr('data-url') || window.location.pathname + window.location.search);
	// Build URL for stats
	this.urlStats = window.location.origin + '/taco.js/' + encodeURIComponent(this.id);
	// Request timeout storage
	this.timeout = null;
	// For callbacks
	var tac = this;

	// Add span for taco counter
	element.append($('<span>'));

	// Init canvas
	element.append($('<canvas id="tacco-canvas" width="36" height="36"></canvas>'));
	var canvas = $('#tacco-canvas')[0];
	var ctx = canvas.getContext('2d');

	// Animation handler
	var tacoCounter = 1;
	var tacoInterval = null;

	// Draw full darker circle
	drawBackground(ctx);

	// Bind events
	element.bind('mouseleave', function () { animationMouseLeave(); });
	element.bind('mouseenter', function () { animationMouseEnter(); });

	// Load initial status if needed
	if (element.attr('data-value') && parseInt(element.attr('data-value'), 10) >= 0) {
		updateValue(element, parseInt(element.attr('data-value'), 10));
	} else {
		element.trigger('taco:fetch', [tac.id]);

		$.getJSON(this.urlStats, function (data) {
			if (!data.total) {
				updateValue(element, 0);
			} else {
				updateValue(element, parseInt(data.total, 10));
			}
		});
	}

	/**
	 * Called when handling mouse enter
	 */
	var animationMouseEnter = function (item, callback) {
		if (tacoInterval) {
			return;
		}

		element.trigger('taco:start', [tac.id]);

		tacoInterval = setInterval(function () {
			if (tacoCounter === 40) {
				// Reset data handler
				clearInterval(tacoInterval);
				tacoInterval = null;
				element.unbind('mouseenter').unbind('mouseleave');

				// Send POST request
				$.post(tac.urlStats, {}, function (data) {
					// CleanUp display
					animationDone();

					// Check if valid response
					if (data === 'Thanks!') {
						// Increased tacos
						var newValue = parseInt(element.find('span').html(), 10) + 1;

						updateValue(element, newValue);
						element.trigger('taco:accept', [tac.id, newValue]);
					} else {
						try {
							// Fed first taco!
							var json = JSON.parse(data);

							updateValue(element, 1);
							element.trigger('taco:accept', [tac.id, 1]);
						} catch (e) {
							// Oh snap, Error!
							updateValue(element, 'E');
							element.trigger('taco:failed', [tac.id]);
						}
					}
				});
			}

			// Draw next step
			tacoCounter++;
			drawPiePiece(ctx, 18, 19, 0.025 * (tacoCounter - 2), 0.025 * tacoCounter, tacolors.filled);
		}, 50);
	};

	/**
	 * Called when handling mouse leave
	 */
	var animationMouseLeave = function (item, callback) {
		if (tacoCounter !== 1) {
			clearInterval(tacoInterval);

			element.trigger('taco:cancel', [tac.id]);

			tacoCounter += 2;
			tacoInterval = setInterval(function () {
				// Reset data handler
				if (tacoCounter === 1) {
					clearInterval(tacoInterval);
					tacoInterval = null;
					tacoCounter = 1;
					return;
				}

				// Draw next/previous step
				tacoCounter--;
				drawPiePiece(ctx, 18, 18, 0.025 * (tacoCounter - 2), 0.025 * tacoCounter, tacolors.empty);
			}, 50);
		}
	};

	/**
	 * Called when handling animation stop
	 */
	var animationDone = function (element, callback) {
		drawBackground(ctx);
	};
};

// jQuery handler for taco.js object
$.fn.setTaco = function () {
	new Taco(this);
};

// Bind taco.js
$(document).ready(function () {
	$('#taco').each(function (index, item) {
		$(item).setTaco();

		$(item).on('taco:fetch', function (e) {
			// console.log('tacco fetch', arguments);
		});

		$(item).on('taco:start', function (e) {
			// console.log('tacco start', arguments);
		});

		$(item).on('taco:cancel', function (e) {
			// console.log('tacco cancel', arguments);
		});

		$(item).on('taco:accept', function (e) {
			// console.log('tacco accept', arguments);
		});

		$(item).on('taco:failed', function (e) {
			// console.log('tacco failed', arguments);
		});
	});
});