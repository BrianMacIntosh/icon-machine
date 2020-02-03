
/*
Icon Machine - Random Potion Icon Generator

Copyright 2018 Brian MacIntosh <brian@brianmacintosh.com>

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program. If not, see <http://www.gnu.org/licenses/>.
*/

window.RandomArt =
{
	displayScale: 2,
	dimension: 32,
	tileDimension: 1,
	iconClass: "potions",

	allClasses: [ "potions", "blades" ],

	Bounds: class
	{
		constructor(x, y, w, h)
		{
			if (y === undefined)
			{
				if (x === undefined)
				{
					this.x = 0; this.y = 0; this.w = 0; this.h = 0;
				}
				else
				{
					this.x = x.x; this.y = x.y; this.w = x.w; this.h = x.h;
				}
			}
			else
			{
				this.x = x; this.y = y; this.w = w; this.h = h;
			}
		}

		contains(v)
		{
			var x = v.x;
			var y = v.y;
			return x >= this.x && y >= this.y
				&& x < this.x + this.w && y < this.y + this.h;
		}
	},

	Vector: class
	{
		constructor(x, y)
		{
			if (y === undefined)
			{
				if (x === undefined)
				{
					this.x = 0; this.y = 0;
				}
				else
				{
					this.x = x.x; this.y = x.y;
				}
			}
			else
			{
				this.x = x; this.y = y;
			}
		}

		normalize()
		{
			var length = this.length();
			this.x /= length;
			this.y /= length;
			return this;
		}

		length()
		{
			return Math.sqrt(this.x * this.x + this.y * this.y);
		}

		lengthSq()
		{
			return this.x * this.x + this.y * this.y;
		}

		distanceTo(x, y)
		{
			return Math.sqrt(this.distanceToSq(x, y));
		}

		distanceToSq(x, y)
		{
			if (y === undefined)
			{
				var dx = this.x - x.x; var dy = this.y - x.y;
			}
			else
			{
				var dx = this.x - x; var dy = this.y - y;
			}
			return dx * dx + dy * dy;
		}

		addVector(v)
		{
			this.x += v.x;
			this.y += v.y;
			return this;
		}

		lerpTo(v, t)
		{
			this.x = (v.x - this.x) * t + this.x;
			this.y = (v.y - this.y) * t + this.y;
			return this;
		}

		multiplyScalar(v)
		{
			this.x *= v;
			this.y *= v;
			return this;
		}

		dotProduct(x, y)
		{
			if (y === undefined)
				return this.x * v.x + this.y * v.y;
			else
				return this.x * x + this.y * y;
		}

		set(x, y)
		{
			if (y === undefined)
			{
				this.x = x.x; this.y = x.y;
			}
			else
			{
				this.x = x; this.y = y;
			}
			return this;
		}
	},

	initialize: function()
	{
		if (this.initialized) return;
		this.initialized = true;

		this.canvas = document.getElementById("generator");
		this.context = this.canvas.getContext('2d');
		this.contextTranslation = new this.Vector(0, 0);

		this.canvasParent = document.getElementById("generatorCanvas");

		this.displayScaleSelect = document.getElementById("displayScale");
		this.dimensionSelect = document.getElementById("dimension");
		this.tileDimensionSelect = document.getElementById("tileDimension");
		this.iconClassSelect = document.getElementById("iconClass");

		// set default class from URL
		var params = {};
		var stringParams = location.search.substring(1).split('&');
		for (var i = 0; i < stringParams.length; i++)
		{
			var nv = stringParams[i].split('=');
			if (!nv[0]) continue;
			params[nv[0]] = nv[1] || true;
		}
		if (params.class)
		{
			this.iconClass = params.class;

			for (var i = 0; i < this.iconClassSelect.options.length; i++)
			{
				if (this.iconClassSelect.options[i].value == this.iconClass)
				{
					this.iconClassSelect.selectedIndex = i;
				}
			}
		}

		this.updateDisplayScale();
	},

	translateContext: function(x, y)
	{
		this.context.translate(x, y);
		this.contextTranslation.x += x;
		this.contextTranslation.y += y;
	},

	/**
	 * Returns a random integer in the range [min, max)
	 */
	randomRange: function(min, max)
	{
		return Math.floor(this.randomRangeFloat(min, max));
	},

	/**
	 * Returns a random float in the range [min, max)
	 */
	randomRangeFloat: function(min, max)
	{
		return this.randomFloat() * (max - min) + min;
	},
	
	/**
	 * Returns a random float in the range [min, max), skewed high.
	 */
	randomRangeFloatHigh: function(min, max)
	{
		return this.randomFloatHigh() * (max - min) + min;
	},

	/**
	 * Returns a random float between 0 and 1.
	 */
	randomFloat: function()
	{
		return Math.random();
	},

	/**
	 * Returns a random float between 0 and 1, weighted to the extremes.
	 */
	randomFloatExtreme: function()
	{
		var rand = Math.random()*2 - 1;
		return rand * rand;
	},

	/**
	 * Returns a random float between 0 and 1, weighted down.
	 */
	randomFloatLow: function()
	{
		var v = Math.random();
		return v * v;
	},
	
	/**
	 * Returns a random float between 0 and 1, weighted up.
	 */
	randomFloatHigh: function()
	{
		return 1-this.randomFloatLow();
	},

	/**
	 * Returns a random RGB color.
	 */
	randomColor: function()
	{
		return {
			r:this.randomRange(0, 256),
			g:this.randomRange(0, 256),
			b:this.randomRange(0, 256),
		};
	},

	floatLerp: function(a, b, t)
	{
		return (b - a) * t + a;
	},

	clamp: function(val, min, max)
	{
		return Math.min(max, Math.max(val, min));
	},

	hsvToRgb: function(color)
	{
		var c = color.v * color.s;
		var x = c * (1 - Math.abs((color.h / 60) % 2 - 1));
		var m = color.v - c;
		if (color.h < 60)		var outColor = { r: c, g: x, b: 0 };
		else if (color.h < 120)	var outColor = { r: x, g: c, b: 0 };
		else if (color.h < 180)	var outColor = { r: 0, g: c, b: x };
		else if (color.h < 240)	var outColor = { r: 0, g: x, b: c };
		else if (color.h < 300)	var outColor = { r: x, g: 0, b: c };
		else 					var outColor = { r: c, g: 0, b: x };
		outColor.r = Math.round((outColor.r + m) * 255);
		outColor.g = Math.round((outColor.g + m) * 255);
		outColor.b = Math.round((outColor.b + m) * 255);
		return outColor;
	},

	colorLerp: function(a, b, t)
	{
		t = Math.max(0, Math.min(1, t));
		var c = {
			r: (b.r - a.r) * t + a.r,
			g: (b.g - a.g) * t + a.g,
			b: (b.b - a.b) * t + a.b,
		};
		var aa = a.a ? a.a : 1;
		var ba = b.a ? b.a : 1;
		c.a = (ba - aa) * t + aa;
		return c;
	},

	colorDarken: function(color, t)
	{
		var c = {
			r: color.r * (1-t),
			g: color.g * (1-t),
			b: color.b * (1-t),
		}
		if (color.a !== undefined) c.a = color.a;
		return c;
	},

	colorLighten: function(color, t)
	{
		t = 1-t;
		var c = {
			r: (1 - (1 - color.r/255) * t) * 255,
			g: (1 - (1 - color.g/255) * t) * 255,
			b: (1 - (1 - color.b/255) * t) * 255,
		}
		if (color.a !== undefined) c.a = color.a;
		return c;
	},

	/**
	 * Returns a random color where each channel is within maxamt/2 of the specified color.
	 */
	colorRandomize: function(color, maxamt)
	{
		var maxamtHalf = Math.floor(maxamt/2);
		var c = {
			r: Math.max(0, Math.min(255, color.r + this.randomRange(-maxamtHalf, maxamtHalf))),
			g: Math.max(0, Math.min(255, color.g + this.randomRange(-maxamtHalf, maxamtHalf))),
			b: Math.max(0, Math.min(255, color.b + this.randomRange(-maxamtHalf, maxamtHalf))),
		}
		if (color.a !== undefined) c.a = color.a;
		return c;
	},

	/**
	 * Returns a random color where each channel at least range/2 away from the specified color.
	 */
	colorInvertRandomize: function(color, range)
	{
		var c = {
			r: (color.r + Math.floor(range/2) + this.randomRange(0, 255-range)) % 256,
			g: (color.g + Math.floor(range/2) + this.randomRange(0, 255-range)) % 256,
			b: (color.b + Math.floor(range/2) + this.randomRange(0, 255-range)) % 256,
		}
		if (color.a !== undefined) c.a = color.a;
		return c;
	},

	colorStr: function(color)
	{
		if (color.a !== undefined)
			return "rgba(" + Math.floor(color.r) + "," + Math.floor(color.g) + "," + Math.floor(color.b) + "," + color.a + ")";
		else
			return "rgb(" + Math.floor(color.r) + "," + Math.floor(color.g) + "," + Math.floor(color.b) + ")";
	},

	notifyDisplayScaleChanged: function()
	{
		this.initialize();
		this.setDisplayScale(parseFloat(this.displayScaleSelect.options[this.displayScaleSelect.selectedIndex].value));
	},

	notifySizeChanged: function()
	{
		this.initialize();
		this.setDimension(parseInt(this.dimensionSelect.options[this.dimensionSelect.selectedIndex].value));
	},

	notifyTileDimensionChanged: function()
	{
		this.initialize();
		this.setTileDimension(parseInt(this.tileDimensionSelect.options[this.tileDimensionSelect.selectedIndex].value));
	},

	notifyIconClassChanged: function()
	{
		this.initialize();
		this.setIconClass(this.iconClassSelect.options[this.iconClassSelect.selectedIndex].value);
	},

	setDisplayScale: function(scale)
	{
		this.initialize();
		this.displayScale = scale;
		this.updateDisplayScale();
	},

	setDimension: function(dimension)
	{
		this.initialize();
		this.dimension = dimension;
		this.resizeCanvas();
	},

	setTileDimension: function(tileDimension)
	{
		this.initialize();
		this.tileDimension = tileDimension;
		this.resizeCanvas();
	},

	setIconClass: function(iconClass)
	{
		this.initialize();
		this.iconClass = iconClass;
		this.generateNewImage();
		if (window.history) window.history.replaceState({}, "Icon Machine | " + this.iconClass, '/iconmachine?class=' + this.iconClass);
	},

	resizeCanvas: function()
	{
		this.canvasParent.style.width = this.canvas.width = this.dimension * this.tileDimension;
		this.canvasParent.style.height = this.canvas.height = this.dimension * this.tileDimension;
		this.updateDisplayScale();
		this.generateNewImage();
	},

	updateDisplayScale: function()
	{
		this.canvasParent.style.padding = (0.5 * this.canvas.width * (this.displayScale - 1)) + "px";
		this.canvas.style.transform = "scale(" + this.displayScale + ")";
	},
	
	clearCanvas: function()
	{
		this.context.fillStyle = "rgba(0,0,0,0)";
		this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
	},
	
	drawPixel: function(x, y)
	{
		this.context.fillRect(x, y, 1, 1);
	},
	
	/**
	 * Adds a 1-pixel black border around the current drawing.
	 */
	addBorder: function(style)
	{
		style = style || "black";

		var width = this.dimension;
		var height = this.dimension;
		
		var readData = this.context.getImageData(this.contextTranslation.x, this.contextTranslation.y, width, height);
		var mutableData = this.context.getImageData(this.contextTranslation.x, this.contextTranslation.y, width, height);
		for (var x = 0; x < width; x++)
		for (var y = 0; y < height; y++)
		{
			var pixelStart = (x + y * width) * 4;

			// if this pixel is empty or edge
			if (readData.data[pixelStart + 3] == 0
				|| x == 0 || y == 0 || x == width - 1 || y == height - 1)
			{
				// and any orthogonal pixel isn't
				var nxPixStart = ((x-1) + y * width) * 4;
				var nyPixStart = (x + (y-1) * width) * 4;
				var pxPixStart = ((x+1) + y * width) * 4;
				var pyPixStart = (x + (y+1) * width) * 4;
				if (x > 0 && readData.data[nxPixStart + 3] > 0
					|| x < width - 1 && readData.data[pxPixStart + 3] > 0
					|| y > 0 && readData.data[nyPixStart + 3] > 0
					|| y < height - 1 && readData.data[pyPixStart + 3] > 0)
				{
					// add black border pixel
					mutableData.data[pixelStart + 0] = 0;
					mutableData.data[pixelStart + 1] = 0;
					mutableData.data[pixelStart + 2] = 0;
					mutableData.data[pixelStart + 3] = 255;
				}
			}
		}
		this.context.putImageData(mutableData, this.contextTranslation.x, this.contextTranslation.y);
	},

	generateNewImage: function()
	{
		this.initialize();

		for (var x = 0; x < this.tileDimension; x++)
		{
			for (var y = 0; y < this.tileDimension; y++)
			{
				this.translateContext(x * this.dimension, y * this.dimension);
				switch (this.iconClass == "any"
					? this.allClasses[this.randomRange(0, this.allClasses.length)]
					: this.iconClass)
				{
					case "potions": this.drawRandomPotion(); break;
					case "blades": this.drawRandomBlade(); break;
				}
				this.translateContext(-x * this.dimension, -y * this.dimension);
			}
		}
	},

	drawRandomPotion: function()
	{
		this.initialize();

		var width = this.dimension;
		var height = this.dimension;
		var dscale = height / 32;
		var centerXL = width/2-1;

		this.clearCanvas();

		// height of bottle lip
		var lipHeight = Math.ceil(this.randomRange(2, 5) * dscale);
		// height of stopper sticking out of bottle
		var stopperTopHeight = Math.ceil(this.randomRange(2, 5) * dscale);
		// depth of stopper into the bottle
		var stopperDepth = this.randomRange(lipHeight + 1, lipHeight + Math.round(4 * dscale));
		// width of stopper inside bottle
		var stopperWidth = Math.ceil(this.randomRange(2, 6) * dscale) * 2;
		// width of bottle neck
		var neckWidth = stopperWidth + 2;
		// width of bottle lip
		var lipWidth = neckWidth + Math.ceil(this.randomRange(2, 4) * dscale) * 2;
		// width of outer stopper
		var stopperTopWidth = Math.min(stopperWidth + 2, lipWidth - 2);
		// top of stopper
		var stopperTop = 2;
		// top of lip
		var lipTop = stopperTop + stopperTopHeight;
		// top of neck
		var neckTop = lipTop + lipHeight;
		// bottom of bottle
		var bottleBottom = height - 2;
		// fluid start
		var fluidTop = neckTop + this.randomRange(height/8, (bottleBottom-neckTop)*0.6);
		// min dist between contour changes
		var contourInterval = Math.round(4 * dscale);

		// generate shape of neck/body
		var contour = [];
		contour[neckTop] = neckWidth/2;
		var velocity = 0;
		var acceleration = 0;
		var direction = 1;
		var bodyTop = neckTop + 1;
		for (var b = bodyTop; b <= bottleBottom; b++)
		{
			var d = Math.floor(velocity);
			velocity += acceleration;
			contour[b] = Math.max(neckWidth/2, Math.min(width/2-2, contour[b-1]+d));

			if (b % contourInterval == 0 && Math.random()<=0.5)
			{
				//velocity = direction*this.randomRange(0,11)/2;
				acceleration = direction*this.randomRange(0,5)/2;
				direction = -direction;
			}
		}

		var stopperLight = { r:222, g:152, b:100 };
		var stopperDark = { r:118, g:49, b:0 };

		var innerBorderLight = { r:213, g:226, b:239 };
		var innerBorderDark = { r:181, g:196, b:197 };

		var glassLight = { r:227, g:244, b:248, a: 165/255 };
		var glassDark = { r:163, g:187, b:199, a: 165/255 };

		var fluidColor = this.randomColor();
		var fluidColor2 = this.colorRandomize(fluidColor, 300);

		// draw outer stopper
		var stopperLeft = centerXL - stopperTopWidth/2 + 1;
		for (var x = 0; x < stopperTopWidth; x++)
		{
			var n = (x / (stopperTopWidth - 1))-0.5;
			this.context.fillStyle = this.colorStr(this.colorLerp(stopperLight, stopperDark, n));
			this.context.fillRect(x + stopperLeft, stopperTop, 1, stopperTopHeight);
		}

		// draw body
		var previousContour = lipWidth;
		for (var y = neckTop; y < contour.length; y++)
		{
			var contourWidth = contour[y]*2;

			// draw fluid
			if (y >= fluidTop)
			{
				var vn = (y - fluidTop) / (bottleBottom - fluidTop);
				var left = centerXL - contourWidth/2;
				for (var x = 1; x < contourWidth; x++)
				{
					var n = x/(contourWidth-1)-(0.5+Math.random()*0.1);
					this.context.fillStyle = this.colorStr(
						this.colorLerp(
							this.colorLerp(fluidColor, fluidColor2, vn),
							this.colorLerp(this.colorDarken(fluidColor, 1), this.colorDarken(fluidColor2, 1), vn),
							n));
					this.drawPixel(left + x, y);
				}
			}

			// draw glass
			if (y >= neckTop && y <= fluidTop)
			{
				var left = centerXL - contourWidth/2;
				for (var x = 1; x < contourWidth; x++)
				{
					var n = x/(contourWidth-1);
					this.context.fillStyle = this.colorStr(this.colorLerp(glassLight, glassDark, n));
					this.drawPixel(left + x, y);
				}
			}

			if (contourWidth == previousContour)
			{
				// contour is the same
				this.context.fillStyle = this.colorStr(innerBorderLight);
				this.drawPixel(centerXL - contourWidth/2 + 1, y);
				this.context.fillStyle = this.colorStr(innerBorderDark);
				this.drawPixel(centerXL + contourWidth/2, y);
			}
			else
			{
				var yOff = previousContour < contourWidth ? y-1 : y;
				var yInner = previousContour < contourWidth ? y : y-1;
				var minContour = Math.min(contourWidth, previousContour);
				var lineWidth = Math.abs(previousContour - contourWidth)/2;
				var lineOffset = lineWidth-1;
				this.context.fillStyle = this.colorStr(innerBorderLight);
				this.context.fillRect(centerXL - minContour/2 - lineWidth + 1, yInner, lineWidth, 1);
				this.drawPixel(centerXL - contourWidth/2 + 1, y);
				this.context.fillStyle = this.colorStr(innerBorderDark);
				this.context.fillRect(centerXL + minContour/2 + 1, yInner, lineWidth, 1);
				this.drawPixel(centerXL + contourWidth/2, y);
			}
			
			previousContour = contourWidth;
		}

		// draw overlay stuff
		var previousContour = lipWidth;
		for (var y = neckTop; y < contour.length; y++)
		{
			var contourWidth = contour[y]*2;

			// draw top-left reflection
			if (previousContour < contourWidth)
			{
				var reflectWidth = Math.max(1, contourWidth - previousContour);

				// crunch toward middle
				var crunch = 1 - 0.3 * contourWidth / width;
				var reflectOffset = Math.round((2 - contourWidth/2) * crunch);

				this.context.globalCompositeOperation = "soft-light";
				this.context.fillStyle = "white";
				this.context.fillRect(centerXL + reflectOffset, y + 2, reflectWidth * crunch, 1);
				this.context.globalCompositeOperation = "source-over";
			}

			previousContour = contourWidth;
		}

		// draw inner stopper
		var stopperInnerLeft = centerXL - stopperWidth/2 + 1;
		for (var x = 0; x < stopperWidth; x++)
		{
			var n = (x / (stopperWidth - 1))-0.5;
			this.context.fillStyle = this.colorStr(this.colorLerp(stopperLight, stopperDark, n));
			this.context.fillRect(x + stopperInnerLeft, lipTop, 1, stopperDepth);
		}

		// draw lip (over stopper)
		var lipLeft = centerXL - lipWidth/2 + 1;
		this.context.fillStyle = this.colorStr(innerBorderLight);
		this.context.fillRect(lipLeft, lipTop, 1, lipHeight);
		this.context.fillStyle = this.colorStr(innerBorderDark);
		this.context.fillRect(lipLeft + lipWidth - 1, lipTop, 1, lipHeight);
		for (var x = 1; x < lipWidth-1; x++)
		{
			var n = ((x-1) / (lipWidth-3))-0.5;
			this.context.fillStyle = this.colorStr(this.colorLerp(glassLight, glassDark, n));
			this.context.fillRect(x + lipLeft, lipTop, 1, lipHeight);
		}

		// draw bottom border
		var borderLeft = centerXL - contour[bottleBottom] + 1;
		var borderWidth = contour[bottleBottom]*2;
		for (var x = 0; x < borderWidth; x++)
		{
			var n = (x/(borderWidth-1))-0.5;
			this.context.fillStyle = this.colorStr(this.colorLerp(innerBorderLight, innerBorderDark, n));
			this.drawPixel(borderLeft + x, bottleBottom);
		}

		this.addBorder();
	},
	
	drawRandomBlade: function()
	{
		//TODO: seeding
		//TODO: make sure everything is dimensionally scaled
		
		this.initialize();

		var bounds = new this.Bounds(0, 0, this.dimension, this.dimension);
		var bounds1 = new this.Bounds(1, 1, bounds.w - 2, bounds.h - 2);
		var dscale = bounds.h / 32;

		this.clearCanvas();
		
		// length of the pommel
		var pommelLength = Math.ceil(this.randomFloatLow() * 2 * dscale);
		// length of the hilt
		var hiltLength = Math.ceil(this.randomRange(6, 11) * dscale);
		// width of the xguard
		var xguardWidth = Math.ceil(this.randomRange(1, 4) * dscale);
		
		// draw the blade
		var bladeParams = {
			startDiag: pommelLength + hiltLength + xguardWidth
		};
		var bladeResults = this.drawBladeHelper(bladeParams);
		
		// draw the hilt
		var hiltStartDiag = Math.floor(pommelLength * Math.sqrt(2));
		var hiltParams = {
			startDiag: hiltStartDiag,
			lengthDiag: Math.floor(bladeResults.startOrtho - hiltStartDiag),
			maxRadius: bladeResults.startRadius
		};
		this.drawGripHelper(hiltParams);

		// draw the crossguard
		var crossguardParams = {
			positionDiag: bladeResults.startOrtho,
			halfLength: bladeResults.startRadius * (1 + 2*this.randomFloatLow()) + 1
		};
		var crossguardResults = this.drawCrossguardHelper(crossguardParams);

		// draw the pommel
		var pommelRadius = pommelLength * Math.sqrt(2) / 2;
		var pommelParams = {
			center: new this.Vector(Math.floor(pommelRadius + 1), Math.ceil(bounds.h - pommelRadius - 2)),
			radius: pommelRadius,
			colorLight: crossguardResults.colorLight,
			colorDark: crossguardResults.colorDark
		};
		this.drawRoundOrnamentHelper(pommelParams);
		
		this.addBorder();
	},
	
	// Helper function that draws a blade with parameters
	// The blade is oriented from the bottom-left corner of the tile to the top-right
	// Parameters:
	// - (required) startDiag: The distance from the bottom-left corner to the base of the blade
	//TODO: expose more properties
	// Returns an object containing:
	// - startDiag: The distance from the bottom-left corner to the base of the blade
	// - startOrtho: The distance from the left and bottom edges to the base of the blade
	// - startRadius: The radius of the blade at its base
	//TODO: return more info
	drawBladeHelper: function(params)
	{
		var bounds = new this.Bounds(0, 0, this.dimension, this.dimension);
		var bounds1 = new this.Bounds(1, 1, bounds.w - 2, bounds.h - 2);
		var dscale = bounds.h / 32;
		
		// determines the angle of the taper of the blade tip (as a ratio of the blade length)
		var taperFactor = this.randomFloatLow();
		// minimum blade width
		var minimumBladeWidth = 1;
		// size of each step in sampling the blade curve
		var bladeSampleStepSize = Math.sqrt(2);
		// width of the lighter edge pixels
		var bladeEdgeWidth = 1;
		// minimum width of the blade core before edge can be drawn
		var bladeCoreEdgeExcludeWidth = 1;
		// chance of the blade aquiring a random jog (per pixel)
		var bladeJogChance = 0.04;
		// chance to jog is reduced during the first this many pixels
		var bladeJogChanceLeadIn = Math.ceil(12 * dscale);
		// max magnitude of a blade jog
		var bladeJogAmount = Math.PI / 4;
		// chance of the blade acquiring a curve (per pixel)
		var bladeOmegaChance = 0.02;
		// max magnitude of blade omega add
		var bladeOmegaAmount = Math.PI / 32;
		// maximum absolute omega
		var bladeMaxOmega = Math.PI / 32;
		// radius of the blade at its base
		var bladeStartRadius = Math.ceil(this.randomRange(2, 4) * dscale);

		// amplitude of the cosine wave applied to blade width
		var bladeWidthCosineAmp = Math.ceil(Math.max(0, this.randomFloatLow()*1.2-0.2) * 2 * dscale);
		// wavelength of the cosine wave applied to blade width
		var bladeWidthCosineWavelength = Math.ceil(this.randomRange(3 * Math.max(1, bladeWidthCosineAmp), 12) * dscale);
		// offset of the cosine wave applied to blade width
		var bladeWidthCosineOffset = this.randomRangeFloat(0, Math.PI * 2);
		
		// amplitude of the blade core wiggle curve
		var bladeWiggleAmp = Math.max(0, this.randomFloat()*8-7) * Math.PI/4 * dscale;
		// wavelength of the blade core wiggle curve
		var bladeWiggleWavelength = Math.ceil(this.randomRangeFloat(6, 18) * dscale);

		// produce blade shape
		var bladeCorePoints = [];
		var bladeStartOrtho = Math.floor(params.startDiag / Math.sqrt(2));
		var currentPoint = new this.Vector(bladeStartOrtho, bounds.h - 1 - bladeStartOrtho);
		var currentDist = 0;
		var currentWidthL = bladeStartRadius;
		var currentWidthR = bladeStartRadius + this.randomRange(-1, 2);
		var velocity = new this.Vector();
		var velocityScaled = new this.Vector();
		var angle = -Math.PI / 4;
		var omega = 0; // velocity rotation in radians per pixel
		do
		{
			var bladeWidthCosine = bladeWidthCosineAmp * Math.cos(bladeWidthCosineOffset + currentDist / bladeWidthCosineWavelength);
			var useAngle = angle + bladeWiggleAmp * Math.sin(Math.PI * 2 * currentDist/bladeWiggleWavelength);
			velocity.set(Math.cos(useAngle), Math.sin(useAngle));

			var newPoint = new this.Vector(currentPoint);
			newPoint.widthL = Math.max(1, currentWidthL + bladeWidthCosine);
			newPoint.widthR = Math.max(1, currentWidthR + bladeWidthCosine);
			newPoint.normal = new this.Vector(-velocity.y, velocity.x).normalize();
			newPoint.forward = new this.Vector(velocity).normalize();
			newPoint.dist = currentDist;
			bladeCorePoints.push(newPoint);
			
			if (this.randomFloat() <= bladeJogChance * Math.min(1, currentDist/bladeJogChanceLeadIn))
			{
				angle += this.randomRangeFloat(-bladeJogAmount, bladeJogAmount);
			}
			if (this.randomFloat() <= bladeOmegaChance)
			{
				omega += this.randomRangeFloat(-bladeOmegaAmount, bladeOmegaAmount);
				omega = Math.sign(omega) * Math.min(bladeMaxOmega, Math.abs(omega));
			}

			velocityScaled.set(velocity).multiplyScalar(bladeSampleStepSize);
			currentPoint.addVector(velocityScaled);
			currentDist += bladeSampleStepSize;
			angle += omega * bladeSampleStepSize;
		} while(bounds1.contains(currentPoint));
		// blade core postprocessing
		for (var i = 0; i < bladeCorePoints.length; i++)
		{
			// calculate normalized distance
			bladeCorePoints[i].normalizedDist = bladeCorePoints[i].dist / currentDist;

			// apply taper
			var invTaperFactor = 1 - taperFactor;
			var taper = bladeCorePoints[i].normalizedDist <= invTaperFactor
				? 1
				: (1-bladeCorePoints[i].normalizedDist) / taperFactor;
			bladeCorePoints[i].widthL *= taper;
			bladeCorePoints[i].widthR *= taper;
		}

		// forward-axis color of the blade at the tip
		var colorBladeLinearTipHsv = {
			h: this.randomRangeFloat(0, 360),
			s: this.randomFloat() < 0.3 ? this.randomFloatExtreme() * 0.6 : 0,
			v: this.randomRangeFloat(0.75, 1)
		};
		var colorBladeLinearTip = this.hsvToRgb(colorBladeLinearTipHsv);
		// forward-axis color of the blade at the hilt
		var colorBladeLinearHilt = this.colorRandomize(this.colorDarken(colorBladeLinearTip, 0.7), 16);
		// amount to lighten blade edge
		var bladeEdgeLighten = 0.5;
		// amount to darken blade far half
		var bladeRightDarken = 0.5;

		// draw blade
		for (var x = 0; x < bounds.w; x++)
		for (var y = 0; y < bounds.h; y++)
		{
			// never draw behind first core point
			var dotProduct = bladeCorePoints[0].forward.dotProduct(x - bladeCorePoints[0].x, y - bladeCorePoints[0].y);
			if (dotProduct < 0) continue;

			// find the minimum distance to the blade core
			//OPT: obviously inefficient
			var coreDistanceNorm = Infinity;
			var bestPoint = null;
			for (var i = 0; i < bladeCorePoints.length; i++)
			{
				// normalizes distance based on width
				var corePoint = bladeCorePoints[i];
				var dotProduct = corePoint.normal.dotProduct(x - corePoint.x, y - corePoint.y);
				var useWidth = dotProduct < 0 ? corePoint.widthL : corePoint.widthR;
				var distanceNorm = corePoint.distanceTo(x, y) / useWidth;
				if (distanceNorm < coreDistanceNorm)
				{
					coreDistanceNorm = distanceNorm;
					bestPoint = bladeCorePoints[i];
				}
			}
			if (bestPoint == null) continue;
			
			var dotProduct = bestPoint.normal.dotProduct(x - bestPoint.x, y - bestPoint.y);
			var useWidth = dotProduct < 0 ? bestPoint.widthL : bestPoint.widthR;
			var coreDistance = bestPoint.distanceTo(x, y);
			if (coreDistance <= useWidth
				|| coreDistance <= minimumBladeWidth)
			{
				var color = this.colorLerp(colorBladeLinearHilt, colorBladeLinearTip, bestPoint.normalizedDist);

				// do not change core
				if (bestPoint.x == x && bestPoint.y == y)
				{ }
				else
				{
					var edgeColor = this.colorLighten(color, bladeEdgeLighten);
					var darkColor = this.colorDarken(color, bladeRightDarken);
					var nonEdgeColor = dotProduct > 0 ? darkColor : color;
					// lighten edge
					if (useWidth > bladeCoreEdgeExcludeWidth)
					{
						var edgeWidthMin = useWidth - bladeEdgeWidth;
						var edgeAmount = (coreDistance - edgeWidthMin) / bladeEdgeWidth;
						edgeAmount = 1 - (1-edgeAmount)*(1-edgeAmount);
						color = this.colorLerp(nonEdgeColor, edgeColor, edgeAmount);
					}
				}

				this.context.fillStyle = this.colorStr(color);
				this.drawPixel(x, y);
			}
		}
		
		return {
			startDiag: params.startDiag,
			startOrtho: bladeStartOrtho,
			startRadius: bladeStartRadius
		};
	},
	
	// Helper function that draws a crossguard with parameters
	// The crossguard is oriented perpendicular to the diagonal from the bottom-left corner of the tile to the top-right
	// Parameters:
	// - (required) positionDiag: The distance from the bottom-left corner to the origin of the crossguard
	// - (required) halfLength: Half the length of the crossguard
	//TODO: expose more properties
	// Returns an object containing:
	// - colorLight: The light color of the crossguard
	// - colorDark: The dark color of the crossguard
	drawCrossguardHelper: function(params)
	{
		var bounds = new this.Bounds(0, 0, this.dimension, this.dimension);
		var dscale = bounds.h / 32;
		
		// the color of the xguard
		var xguardColorLight = this.hsvToRgb({ h: this.randomRange(0, 360), s: this.randomFloatLow()*0.5, v: this.randomRangeFloat(0.7, 1) });
		// the shadow color of the xguard
		var xguardColorDark = this.colorDarken(xguardColorLight, 0.6);
		// the amount of symmetry for the xguard
		var xguardSymmetry = this.randomFloat() < 0.3 ? 0 : 1;
		// the thickness of the xguard
		var xguardThickness = this.randomRangeFloatHigh(1, 2.5);
		// the bottom taper of the xguard
		var xguardBottomTaper = this.randomFloat();
		// the top taper of the xguard
		var xguardTopTaper = this.floatLerp(this.randomFloat(), xguardBottomTaper, this.randomFloatExtreme());
		// chance for the xguard to acquire a curve (per pixel)
		var xguardOmegaChance = 0.3;
		// max magnitude of xguard omega add
		var xguardOmegaAmount = Math.PI/8;
		// maximum absolute xguard omega
		var xguardMaxOmega = (xguardThickness-1)^2 * Math.PI/7;
		// size of each step in sampling the xguard curve
		var xguardSampleStepSize = Math.sqrt(2);

		// produce xguard shape
		var currentPoint = new this.Vector(params.positionDiag, bounds.h - 1 - params.positionDiag);
		currentPoint = [currentPoint, new this.Vector(currentPoint)];
		var xguardControlPoints = [[],[]];
		var xguardAngle = [-Math.PI * 3/4, Math.PI/4];
		var xguardOmega = [0,0];
		for (var xguardProgress = 0; xguardProgress <= params.halfLength; xguardProgress += xguardSampleStepSize)
		{
			for (var side = 0; side <= 1; side++)
			{
				var velocity = new this.Vector(Math.cos(xguardAngle[side]), Math.sin(xguardAngle[side]));

				var newPoint = new this.Vector(currentPoint[side]);
				if (side == 1)
				{
					var symmetricPoint = new this.Vector(bounds.h - 1 - currentPoint[0].y, bounds.w - 1 - currentPoint[0].x);
					newPoint.lerpTo(symmetricPoint, xguardSymmetry);
				}
				newPoint.widthT = xguardThickness/2;
				newPoint.widthB = xguardThickness/2;
				newPoint.normal = new this.Vector(velocity.y, -velocity.x).multiplyScalar(side*2-1);
				newPoint.dist = xguardProgress;
				xguardControlPoints[side].push(newPoint);
			}
			for (var side = 0; side <= 1; side++)
			{
				var velocity = new this.Vector(Math.cos(xguardAngle[side]), Math.sin(xguardAngle[side]));

				if (this.randomFloat() < xguardOmegaChance)
				{
					xguardOmega[side] += this.randomRangeFloat(-xguardOmegaAmount, xguardOmegaAmount);
					xguardOmega[side] = Math.sign(xguardOmega[side]) * Math.min(xguardMaxOmega, Math.abs(xguardOmega[side]));
				}

				var xguardStep = new this.Vector(velocity).multiplyScalar(xguardSampleStepSize);
				currentPoint[side].addVector(xguardStep);
				xguardAngle[side] += xguardOmega[side];
			}
		}
		// xguard core postprocessing
		for (var side = 0; side <= 1; side++)
		{
			var controlPoints = xguardControlPoints[side];
			for (var i = 0; i < controlPoints.length; i++)
			{
				// calculate normalized distance
				controlPoints[i].normalizedDist = controlPoints[i].dist / params.halfLength;

				// apply taper
				controlPoints[i].widthT *= Math.min(1, (1 - controlPoints[i].normalizedDist) / xguardTopTaper);
				controlPoints[i].widthB *= Math.min(1, (1 - controlPoints[i].normalizedDist) / xguardBottomTaper);
			}
		}

		// draw xguard
		for (var x = 0; x < bounds.w; x++)
		for (var y = 0; y < bounds.h; y++)
		{
			// find the minimum distance to the xguard core
			//OPT: obviously inefficient
			var coreDistanceSq = Infinity;
			var bestPoint = null;
			for (var side = 0; side <= 1; side++)
			{
				var controlPoints = xguardControlPoints[side];
				for (var i = 0; i < controlPoints.length; i++)
				{
					var distanceSq = controlPoints[i].distanceToSq(x, y);
					if (distanceSq < coreDistanceSq)
					{
						coreDistanceSq = distanceSq;
						bestPoint = controlPoints[i];
					}
				}
			}

			var dotProduct = bestPoint.normal.dotProduct(x - bestPoint.x, y - bestPoint.y);
			var useWidth = dotProduct < 0 ? bestPoint.widthB : bestPoint.widthT;
			var coreDistance = Math.sqrt(coreDistanceSq);
			if (coreDistance <= useWidth)
			{
				var distFromTop = dotProduct < 0 ? bestPoint.widthT + coreDistance : bestPoint.widthT - coreDistance;
				var darkAmt = distFromTop / (bestPoint.widthB + bestPoint.widthT);
				this.context.fillStyle = this.colorStr(this.colorLerp(xguardColorLight, xguardColorDark, darkAmt));
				this.drawPixel(x, y);
			}
		}
		
		return {
			colorLight: xguardColorLight,
			colorDark: xguardColorDark
		};
	},
	
	// Helper function that draws a grip with parameters
	// The grip is oriented from the bottom-left corner of the canvas to the top-right
	// Parameters:
	// - startDiag (required): The distance from the bottom-left corner to the start of the grip
	// - lengthDiag (required): The length of the grip
	// - maxRadius (optional): The maximum radius of the grip
	//TODO: expose more parameters
	drawGripHelper: function(params)
	{
		var bounds = new this.Bounds(0, 0, this.dimension, this.dimension);
		var dscale = bounds.h / 32;
		
		// the radius of the hilt in pixel diagonals
		var hiltRadius = 0.5 * Math.ceil(this.randomRange(0, 2) * dscale);
		if (params.maxRadius !== undefined) hiltRadius = Math.min(params.maxRadius, hiltRadius);
		// wavelength of the hilt texture (in diagonal pixels)
		var hiltWavelength = Math.max(2, Math.ceil(this.randomRange(3,6) * dscale));
		// amplitude of the hilt wave
		var hiltWaveAmplitude = Math.ceil(this.randomRange(1,3) * dscale);
		// the color of the hilt
		var hiltColorLight = this.hsvToRgb({ h: this.randomRange(0, 360), s: this.randomFloat(), v: this.randomRangeFloat(0.7, 1) });
		// the color of the hilt inner shadows
		var hiltColorDark = this.colorDarken(hiltColorLight, 1);

		// start location of the hilt (diagonal axis, diagonal pixels)
		var hiltRadiusOdd = (hiltRadius % 2) != 0;
		for (var l = 0; l < params.lengthDiag; l += 0.5)
		{
			var al = params.startDiag + l;
			var gripWave = Math.abs(Math.cos(Math.PI * 2 * l / hiltWavelength));
			var color = this.colorLerp(hiltColorDark, hiltColorLight, gripWave);

			// determine draw parameters
			var core = new this.Vector(al, bounds.h - 1 - al);
			var isOdd = (al % 1) != 0;
			core.x = Math.ceil(core.x);
			core.y = Math.ceil(core.y);
			if (isOdd)
			{
				var left = -Math.ceil(hiltRadius);
				var right = Math.floor(hiltRadius);
				if (!hiltRadiusOdd) right--;
			}
			else
			{
				var left = -Math.floor(hiltRadius);
				var right = Math.floor(hiltRadius);
			}

			// draw grip line
			this.context.fillStyle = this.colorStr(color);
			for (var h = left; h <= right; h++)
			{
				var darkenAmt = Math.max(0, h + hiltRadius) / (hiltRadius*4);
				this.context.fillStyle = this.colorStr(this.colorDarken(color, darkenAmt));
				this.drawPixel(core.x + h, core.y + h);
			}
		}
	},
	
	// Helper function that draws a round ornament with parameters
	// Parameters:
	// - center (required): [vector] the center of the ornament
	// - colorLight (defaults): The light color of the ornament
	// - colorDark (defaults): The dark color of the ornament
	//TODO: expose more parameters
	drawRoundOrnamentHelper: function(params)
	{
		var pommelColorLight = params.colorLight
			|| this.hsvToRgb({ h: this.randomRange(0, 360), s: this.randomFloatLow()*0.5, v: this.randomRangeFloat(0.7, 1) });
		var pommelColorDark = params.colorDark
			|| this.colorDarken(pommelColorLight, 0.6);
		var pommelRadius = params.radius;
		var shadowCenter = new this.Vector(0.5, 1).normalize().multiplyScalar(pommelRadius).addVector(params.center);
		var highlightCenter = new this.Vector(-1, -1).normalize().multiplyScalar(pommelRadius * 0.7).addVector(params.center);
		for (var x = 0; x <= params.center.x + pommelRadius; x++)
		for (var y = params.center.y - pommelRadius; y <= params.center.y + pommelRadius; y++)
		{
			var radius = params.center.distanceTo(x, y);
			if (radius <= pommelRadius)
			{
				var shadowDist = shadowCenter.distanceTo(x, y);
				var highlightDist = highlightCenter.distanceTo(x, y);
				var darkAmt = 1-Math.min(1, 0.8 * shadowDist / pommelRadius);
				var lightAmt = 1-Math.min(1, highlightDist / pommelRadius);
				this.context.fillStyle = this.colorStr(this.colorLighten(this.colorLerp(pommelColorLight, pommelColorDark, darkAmt), lightAmt));
				this.drawPixel(x, y);
			}
		}
	}
}
