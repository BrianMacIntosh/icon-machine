
/*
Icon Machine - Random Potion Icon Generator

Copyright 2018-2021 Brian MacIntosh <brian@brianmacintosh.com>

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
	versionNumber: 2,
	
	displayScale: 2,
	dimension: 32,
	tileDimension: 1,
	iconClass: "anyweapon",

	allClasses: [ "potions", "blades", "spears" ],
	
	// Stores the state of the parameters from before the last zoom-in
	configPreZoom: null,

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
		
		this.randomFloat = this.randomFloatDefault;

		this.canvas = document.getElementById("generator");
		this.canvas.addEventListener("click", function(e){RandomArt.handleCanvasClick(e);});
		this.context = this.canvas.getContext('2d');
		this.contextTranslation = new this.Vector(0, 0);

		this.canvasParent = document.getElementById("generatorCanvas");
		
		this.restoreConfigPreZoomButton = document.getElementById("restoreConfigPreZoomButton");
		this.shareLinkAnchor = document.getElementById("shareLink");
		this.displayScaleSelect = document.getElementById("displayScale");
		this.dimensionSelect = document.getElementById("dimension");
		this.tileDimensionSelect = document.getElementById("tileDimension");
		this.iconClassSelect = document.getElementById("iconClass");
		this.seedInput = document.getElementById("seed");

		// set default config from URL
		var params = {};
		var stringParams = location.search.substring(1).split('&');
		for (var i = 0; i < stringParams.length; i++)
		{
			var nv = stringParams[i].split('=');
			if (!nv[0]) continue;
			params[nv[0]] = nv[1] || true;
		}
		if (params.dim)
		{
			this.dimension = parseInt(params.dim);
			this.dimensionSelect.value = this.dimension;
		}
		if (params.tiledim)
		{
			this.tileDimension = parseInt(params.tiledim);
			this.tileDimensionSelect.value = this.tileDimension;
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
		if (params.seed)
		{
			this.seedInput.value = params.seed;
			this.resizeCanvas(); // accounts for dimensions changed by parameters
		}
		else
		{
			this.randomizeSeed();
		}

		this.updateDisplayScale();
		this.clearConfigPreZoom();
		this.updateShareLink();
	},

	translateContext: function(x, y)
	{
		this.context.translate(x, y);
		this.contextTranslation.x += x;
		this.contextTranslation.y += y;
	},
	
	// Resets the RNG using the specified seed
	seedRng: function(seed)
	{
		this.seedGenerator = this.xmur3(seed);
		this.checkpointRng();
	},
	
	// Generates a random seed with the specified random float function
	createRandomSeed: function(randomFunc)
	{
		randomFunc = randomFunc || Math.random;
		var randomString = "";
		for (var i = 0; i < 16; i++)
		{
			var randomChar = Math.floor(randomFunc()*62);
			if (randomChar < 10) randomChar = 48+randomChar;
			else if (randomChar < 36) randomChar = 65-10+randomChar;
			else randomChar = 97-36+randomChar;
			randomString += String.fromCharCode(randomChar);
		}
		return randomString;
	},
	
	// Generates and sets a random seed with the specified random float function
	randomizeSeed: function(randomFunc)
	{
		var randomString = this.createRandomSeed(randomFunc);
		this.seedInput.value = randomString;
		this.seedRng(randomString);
		this.updateShareLink();
		this.clearConfigPreZoom();
		this.generateNewImage();
	},
	
	// Creates an RNG "checkpoint" that proofs the results against code changes (somewhat)
	checkpointRng: function()
	{
		if (this.seedGenerator)
		{
			this.randomFloat = this.sfc32(this.seedGenerator(), this.seedGenerator(), this.seedGenerator(), this.seedGenerator());
		}
	},
	
	// Hash function for seeding the RNG
	// https://stackoverflow.com/a/47593316
	xmur3: function(str)
	{
		for(var i = 0, h = 1779033703 ^ str.length; i < str.length; i++)
			h = Math.imul(h ^ str.charCodeAt(i), 3432918353),
			h = h << 13 | h >>> 19;
		return function() {
			h = Math.imul(h ^ h >>> 16, 2246822507);
			h = Math.imul(h ^ h >>> 13, 3266489909);
			return (h ^= h >>> 16) >>> 0;
		}
	},
	
	// RNG
	/// https://stackoverflow.com/a/47593316
	sfc32: function(a, b, c, d)
	{
		return function() {
		  a >>>= 0; b >>>= 0; c >>>= 0; d >>>= 0; 
		  var t = (a + b) | 0;
		  a = b ^ b >>> 9;
		  b = c + (c << 3) | 0;
		  c = (c << 21 | c >>> 11);
		  d = d + 1 | 0;
		  t = t + d | 0;
		  c = c + t | 0;
		  return (t >>> 0) / 4294967296;
		}
	},

	/**
	 * Returns a random integer in the range [min, max)
	 */
	randomRange: function(min, max)
	{
		return Math.floor(this.randomRangeFloat(min, max));
	},
	
	/**
	 * Returns a random integer in the range [min, max), skewed low
	 */
	randomRangeLow: function(min, max)
	{
		return Math.floor(this.randomRangeFloatLow(min, max));
	},
	
	/**
	 * Returns a random integer in the range [min, max), skewed high
	 */
	randomRangeHigh: function(min, max)
	{
		return Math.floor(this.randomRangeFloatHigh(min, max));
	},
	
	/**
	 * Returns 1 or -1.
	 */
	randomSign: function()
	{
		return this.randomFloat() > 0.5 ? 1 : -1;
	},

	/**
	 * Returns a random float in the range [min, max)
	 */
	randomRangeFloat: function(min, max)
	{
		return this.randomFloat() * (max - min) + min;
	},
	
	/**
	 * Returns a random float in the range [min, max), skewed to the ends
	 */
	randomRangeFloatExtreme: function(min, max)
	{
		return this.randomSign() * this.randomFloatHigh((max - min) / 2) + (max + min) / 2;
	},
	
	/**
	 * Returns a random float in the range [min, max), skewed low.
	 */
	randomRangeFloatLow: function(min, max)
	{
		return this.randomFloatLow() * (max - min) + min;
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
	randomFloatDefault: function()
	{
		return Math.random();
	},
	
	/**
	 * Returns a random float between 0 and 1. Overwritten by seeding.
	 */
	randomFloat: undefined,

	/**
	 * Returns a random float between 0 and 1, weighted to the extremes.
	 */
	randomFloatExtreme: function()
	{
		var rand = this.randomFloat()*2 - 1;
		return rand * rand;
	},

	/**
	 * Returns a random float between 0 and 1, weighted down.
	 */
	randomFloatLow: function()
	{
		var v = this.randomFloat();
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
	
	diagToPosition: function(diag, bounds)
	{
		var ortho = Math.floor(diag / Math.sqrt(2));
		return new this.Vector(ortho, bounds.h - 1 - ortho);
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
	
	handleCanvasClick: function(e)
	{
		if (this.tileDimension > 1)
		{
			this.configPreZoom = {
				seed: this.seedInput.value,
				tileDimension: this.tileDimensionSelect.value
			};
			this.restoreConfigPreZoomButton.style.display = "initial";
			var rect = this.canvas.getBoundingClientRect();
			var localX = (e.clientX - rect.left) / this.displayScale;
			var localY = (e.clientY - rect.top) / this.displayScale;
			var tileX = Math.floor(localX / this.dimension);
			var tileY = Math.floor(localY / this.dimension);
			this.tileDimensionSelect.value = "1";
			this.seedInput.value = this.tileSeeds[tileX + tileY * this.tileDimension];
			this.setTileDimension(1);
		}
	},

	notifyDisplayScaleChanged: function()
	{
		this.initialize();
		this.clearConfigPreZoom();
		this.setDisplayScale(parseFloat(this.displayScaleSelect.options[this.displayScaleSelect.selectedIndex].value));
	},

	notifySizeChanged: function()
	{
		this.initialize();
		this.clearConfigPreZoom();
		this.setDimension(parseInt(this.dimensionSelect.options[this.dimensionSelect.selectedIndex].value));
	},

	notifyTileDimensionChanged: function()
	{
		this.initialize();
		this.clearConfigPreZoom();
		this.setTileDimension(parseInt(this.tileDimensionSelect.options[this.tileDimensionSelect.selectedIndex].value));
	},

	notifyIconClassChanged: function()
	{
		this.initialize();
		this.clearConfigPreZoom();
		this.setIconClass(this.iconClassSelect.options[this.iconClassSelect.selectedIndex].value);
	},
	
	notifySeedChanged: function()
	{
		this.initialize();
		this.clearConfigPreZoom();
		this.generateNewImage();
		this.updateShareLink();
	},
	
	restoreConfigPreZoom: function()
	{
		if (this.configPreZoom)
		{
			this.restoreConfig(this.configPreZoom);
			this.clearConfigPreZoom();
		}
	},
	
	clearConfigPreZoom: function()
	{
		this.configPreZoom = null;
		this.restoreConfigPreZoomButton.style.display = "none";
	},
	
	restoreConfig: function(config)
	{
		//TODO: minimize rebuild calls
		if (config.dimension)
		{
			this.dimensionSelect.value = config.dimension;
			this.setDimension(parseInt(config.dimension));
		}
		if (config.tileDimension)
		{
			this.tileDimensionSelect.value = config.tileDimension;
			this.setTileDimension(parseInt(config.tileDimension));
		}
		if (config.iconClass)
		{
			this.iconClassSelect.value = config.iconClass;
			this.setIconClass(config.iconClass);
		}
		if (config.seed)
		{
			this.seedInput.value = config.seed;
		}
		this.generateNewImage();
	},
	
	updateShareLink: function()
	{
		if (this.shareLinkAnchor)
		{
			this.shareLinkAnchor.href = "/iconmachine?"
				+ "dim=" + this.dimension
				+ "&tiledim=" + this.tileDimension
				+ "&class=" + this.iconClass
				+ "&seed=" + this.seedInput.value;
		}
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
		this.updateShareLink();
	},

	setTileDimension: function(tileDimension)
	{
		this.initialize();
		this.tileDimension = tileDimension;
		this.canvas.style.cursor = this.tileDimension > 1 ? "pointer" : "inherit";
		this.resizeCanvas();
		this.updateShareLink();
	},

	setIconClass: function(iconClass)
	{
		this.initialize();
		this.iconClass = iconClass;
		this.generateNewImage();
		this.updateShareLink();
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
		this.context.fillStyle = "rgba(0,0,0,1)";
		this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
	},
	
	drawPixel: function(x, y)
	{
		this.context.fillRect(Math.floor(x), Math.floor(y), 1, 1);
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
		
		var seed = this.seedInput.value;
		
		// meta-rng
		var metaSeedGenerator = this.xmur3(seed);
		var metaRandom = this.sfc32(metaSeedGenerator(), metaSeedGenerator(), metaSeedGenerator(), metaSeedGenerator());
		
		this.tileSeeds = [];
		
		for (var y = 0; y < this.tileDimension; y++)
		{
			for (var x = 0; x < this.tileDimension; x++)
			{
				var drawClass = this.iconClass;
				if (drawClass == "any")
				{
					var randomIndex = Math.floor(this.allClasses.length * metaRandom());
					drawClass = this.allClasses[randomIndex];
				}
				else if (drawClass == "anyweapon")
				{
					//HACK: magic numbers, hardcoded indices
					var randomIndex = 1 + Math.floor((this.allClasses.length - 1) * metaRandom());
					drawClass = this.allClasses[randomIndex];
				}
				
				this.seedRng(seed);
				this.tileSeeds.push(seed);
				
				this.translateContext(x * this.dimension, y * this.dimension);
				switch (drawClass)
				{
					case "potions": this.drawRandomPotion(); break;
					case "blades": this.drawRandomBlade(); break;
					case "spears": this.drawRandomSpear(); break;
				}
				this.translateContext(-x * this.dimension, -y * this.dimension);
				
				// next seed
				seed = this.createRandomSeed(metaRandom);
			}
		}
	},

	drawRandomPotion: function()
	{
		this.initialize();
		this.checkpointRng();

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
		
		var stopperLight = { r:222, g:152, b:100 };
		var stopperDark = { r:118, g:49, b:0 };

		var innerBorderLight = { r:213, g:226, b:239 };
		var innerBorderDark = { r:181, g:196, b:197 };

		var glassLight = { r:227, g:244, b:248, a: 165/255 };
		var glassDark = { r:163, g:187, b:199, a: 165/255 };

		var fluidColor = this.randomColor();
		var fluidColor2 = this.colorRandomize(fluidColor, 300);

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

			if (b % contourInterval == 0 && this.randomFloat()<=0.5)
			{
				//velocity = direction*this.randomRange(0,11)/2;
				acceleration = direction*this.randomRange(0,5)/2;
				direction = -direction;
			}
		}

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
					var n = x/(contourWidth-1)-(0.5+this.randomFloat()*0.1);
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
				
				this.context.save();
				this.context.globalCompositeOperation = "soft-light";
				this.context.fillStyle = "white";
				this.context.fillRect(centerXL + reflectOffset, y + 2, reflectWidth * crunch, 1);
				this.context.restore();
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
		//TODO:
		//- serration
		
		//TODO: make sure everything is dimensionally scaled
		
		this.initialize();
		this.checkpointRng();

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
			startDiag: pommelLength + hiltLength + xguardWidth,
			taperFactor: this.randomFloatLow(),
			startRadius: Math.ceil(this.randomRange(2, 4) * dscale)
		};
		var bladeResults = this.drawBladeHelper(bladeParams);
		
		// draw the hilt
		var hiltStartDiag = Math.floor(pommelLength * Math.sqrt(2));
		var hiltParams = {
			startDiag: hiltStartDiag,
			lengthDiag: Math.floor(bladeResults.startOrtho - hiltStartDiag),
			maxRadius: bladeResults.startRadius,
			fractionalRadiusAllowed: false
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
	
	drawRandomSpear: function()
	{
		//TODO:
		//- ribbons
		//- better taper on points
		//- fix discontiguous crossguards
		//- possible center element in large pommel
		//- more, wilder crossguards
		
		//TODO: make sure everything is dimensionally scaled
		
		this.initialize();
		this.checkpointRng();

		var bounds = new this.Bounds(0, 0, this.dimension, this.dimension);
		var bounds1 = new this.Bounds(1, 1, bounds.w - 2, bounds.h - 2);
		var canvasDiag = Math.sqrt(bounds.w * bounds.w + bounds.h * bounds.h);
		var dscale = bounds.h / 32;

		this.clearCanvas();
		
		var gripLengthMin = 8;
		// length of the tip
		var tipLength = Math.ceil(this.randomRange(10, 20) * dscale);
		// diagonal start of the tip
		var tipStartDiag = canvasDiag - tipLength;
		// diagonal start of the grip
		var gripStartDiag = Math.ceil(this.randomRange(0, tipStartDiag - gripLengthMin));
		// length of the grip
		var gripLength = Math.ceil(this.randomRange(gripLengthMin, tipStartDiag - gripStartDiag) * dscale);
		
		// draw the tip
		var tipParams = {
			startDiag: tipStartDiag,
			taperFactor: this.randomFloat() * 0.5 + 0.5,
			startRadius: Math.ceil(this.randomRange(1, 2) * dscale)
		};
		var tipResults = this.drawBladeHelper(tipParams);
		
		// draw the haft
		var haftParams = {
			startDiag: 0,
			lengthDiag: tipStartDiag,
			maxRadius: tipResults.startRadius * 2,
			fractionalRadiusAllowed: true
		};
		if (this.randomFloat() > 0.95)
		{
			haftParams.color = tipResults.hiltColor;
		}
		var haftResults = this.drawHaftHelper(haftParams);
		
		// draw the grip
		if (this.randomFloat() > 0.65)
		{
			var gripParams = {
				startDiag: gripStartDiag,
				lengthDiag: gripLength / Math.sqrt(2), //HACK:
				minRadius: haftResults.radius,
				maxRadius: haftResults.radius,
				fractionalRadiusAllowed: true
			};
			this.drawGripHelper(gripParams);
		}

		// draw the crossguard
		if (this.randomFloat() > 0.4)
		{
			var crossguardParams = {
				positionDiag: tipResults.startOrtho,
				halfLength: tipResults.startRadius * (1 + 8 * this.randomFloatExtreme()) + 4,
				omegaChance: 0.4,
				omegaAmount: Math.PI/10,
				thickness: this.randomRangeFloat(1, 2)
			};
			var crossguardResults = this.drawCrossguardHelper(crossguardParams);
		}
		
		// draw ribbon(s)
		var ribbonCount = this.randomRangeLow(0, 4);
		for (var ribbonIndex = 0; ribbonIndex < ribbonCount; ++ribbonIndex)
		{
			//TODO:
		}
		
		// draw pommel
		if (this.randomFloat() > 0.4)
		{
			var pommelRadius = Math.ceil((0.5 + this.randomFloatLow() * 0.5) * dscale);
			var pommelParams = {
				center: new this.Vector(Math.floor(pommelRadius), Math.ceil(bounds.h - pommelRadius - 1)),
				radius: pommelRadius
			};
			
			if (crossguardResults && this.randomFloat() > 0.5)
			{
				// match crossguard colors
				pommelParams.colorLight = crossguardResults.colorLight;
				pommelParams.colorDark = crossguardResults.colorDark;
			}
			else
			{
				// generate new colors
				pommelParams.colorLight = this.hsvToRgb({ h: this.randomRange(0, 360), s: this.randomFloat(), v: this.randomRangeFloat(0, 1) });
			}
			
			//HACK: erase haft that might go below pommel
			//HACK: off by one?
			this.context.clearRect(-1, bounds.h, pommelRadius + 1, -(pommelRadius + 1));
			
			this.drawRoundOrnamentHelper(pommelParams);
		}
		
		// draw crossguard device
		if (this.randomFloat() > 0.55)
		{
			var deviceRadius = Math.ceil((0.5 + this.randomFloatLow() * 1.5) * dscale);
			var deviceParams = {
				center: this.diagToPosition(haftParams.startDiag + haftParams.lengthDiag - Math.floor(deviceRadius / 2), bounds),
				radius: deviceRadius
			};
			
			if (crossguardResults && this.randomFloat() > 0.4)
			{
				// match crossguard colors
				deviceParams.colorLight = crossguardResults.colorLight;
				deviceParams.colorDark = crossguardResults.colorDark;
			}
			else
			{
				// generate new colors
				deviceParams.colorLight = this.hsvToRgb({ h: this.randomRange(0, 360), s: this.randomFloat(), v: this.randomRangeFloat(0, 1) });
			}
			
			this.drawRoundOrnamentHelper(deviceParams);
		}
		
		this.addBorder();
	},
	
	// Helper function that draws a blade with parameters
	// The blade is oriented from the bottom-left corner of the tile to the top-right
	// Parameters:
	// - (required) startDiag: The distance from the bottom-left corner to the base of the blade
	// - (required) taperFactor: Determines the angle of the taper of the blade tip (as a ratio of the blade length)
	// - (required) startRadius: The radius of the base of the blade
	//TODO: expose more properties
	// Returns an object containing:
	// - startDiag: The distance from the bottom-left corner to the base of the blade
	// - startOrtho: The distance from the left and bottom edges to the base of the blade
	// - startRadius: The radius of the blade at its base
	// - hiltColor: The basic tint color of the blade at the hilt
	// - tipColor: The basic tint color of the blade at the tip
	//TODO: return more info
	drawBladeHelper: function(params)
	{
		this.checkpointRng();
		
		var bounds = new this.Bounds(0, 0, this.dimension, this.dimension);
		var bounds1 = new this.Bounds(1, 1, bounds.w - 2, bounds.h - 2);
		var dscale = bounds.h / 32;
		
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
		var currentWidthL = params.startRadius;
		var currentWidthR = params.startRadius + this.randomRange(-1, 2);
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
			var invTaperFactor = 1 - params.taperFactor;
			var taper = bladeCorePoints[i].normalizedDist <= invTaperFactor
				? 1
				: (1-bladeCorePoints[i].normalizedDist) / params.taperFactor;
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
			
			var dotProduct = bestPoint.normal.dotProduct(x - bestPoint.x + 0.5, y - bestPoint.y + 0.5);
			var useWidth = dotProduct < 0 ? bestPoint.widthL : bestPoint.widthR;
			var coreDistance = bestPoint.distanceTo(x, y);
			if (coreDistance <= useWidth
				|| coreDistance <= minimumBladeWidth)
			{
				var color = this.colorLerp(colorBladeLinearHilt, colorBladeLinearTip, bestPoint.normalizedDist);

				// do not change core
				//if (bestPoint.x == x && bestPoint.y == y)
				//{ }
				//else
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
			startRadius: params.startRadius,
			hiltColor: colorBladeLinearHilt,
			tipColor: colorBladeLinearTip
		};
	},
	
	// Helper function that draws a crossguard with parameters
	// The crossguard is oriented perpendicular to the diagonal from the bottom-left corner of the tile to the top-right
	// Parameters:
	// - (required) positionDiag: The distance from the bottom-left corner to the origin of the crossguard
	// - (required) halfLength: Half the length of the crossguard
	// - (optional) omegaChance: Chance for the xguard to acquire a curve (per pixel)
	// - (optional) omegaAmount: Max magnitude of xguard omega add
	// - (optional) thickness: The thickness of the xguard
	//TODO: expose more properties
	// Returns an object containing:
	// - colorLight: The light color of the crossguard
	// - colorDark: The dark color of the crossguard
	drawCrossguardHelper: function(params)
	{
		this.checkpointRng();
		
		var bounds = new this.Bounds(0, 0, this.dimension, this.dimension);
		var dscale = bounds.h / 32;
		
		// the color of the xguard
		var xguardColorLight = this.hsvToRgb({ h: this.randomRange(0, 360), s: this.randomFloatLow()*0.5, v: this.randomRangeFloat(0.7, 1) });
		// the shadow color of the xguard
		var xguardColorDark = this.colorDarken(xguardColorLight, 0.6);
		// the amount of symmetry for the xguard
		var xguardSymmetry = this.randomFloat() < 0.3 ? 0 : 1;
		// the thickness of the xguard
		var xguardThickness = params.thickness || this.randomRangeFloatHigh(1, 2.5);
		// the bottom taper of the xguard
		var xguardBottomTaper = this.randomFloat();
		// the top taper of the xguard
		var xguardTopTaper = this.floatLerp(this.randomFloat(), xguardBottomTaper, this.randomFloatExtreme());
		// chance for the xguard to acquire a curve (per pixel)
		var xguardOmegaChance = params.omegaChance || 0.3;
		// max magnitude of xguard omega add
		var xguardOmegaAmount = params.omegaAmount || (Math.PI/8);
		// maximum absolute xguard omega
		var xguardMaxOmega = (0 + (xguardThickness-1)^2) * Math.PI/7;
		// number of steps after an omega change before another can be added
		var xguardOmegaCooldown = 3;
		// size of each step in sampling the xguard curve
		var xguardSampleStepSize = Math.sqrt(2);

		// produce xguard shape
		var currentPoint = new this.Vector(params.positionDiag, bounds.h - 1 - params.positionDiag);
		currentPoint = [currentPoint, new this.Vector(currentPoint)];
		var xguardControlPoints = [[],[]];
		var xguardAngle = [-Math.PI * 3/4, Math.PI/4];
		var xguardOmega = [0,0];
		var xguardOmegaCoolTimer = [0,0];
		var deltaStep = xguardSampleStepSize / Math.sqrt(2); //HACK: divide for back compat
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

				xguardOmegaCoolTimer[side] -= xguardSampleStepSize;
				if (xguardOmegaCoolTimer[side] <= 0 && this.randomFloat() < xguardOmegaChance)
				{
					xguardOmegaCoolTimer[side] = xguardOmegaCooldown;
					xguardOmega[side] += this.randomRangeFloatExtreme(-xguardOmegaAmount, xguardOmegaAmount);
					xguardOmega[side] = Math.sign(xguardOmega[side]) * Math.min(xguardMaxOmega, Math.abs(xguardOmega[side]));
				}

				var xguardStep = new this.Vector(velocity).multiplyScalar(xguardSampleStepSize);
				currentPoint[side].addVector(xguardStep);
				xguardAngle[side] += xguardOmega[side] * deltaStep;
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
	// - minRadius (optional): The minimum radius of the grip
	// - maxRadius (required): The maximum radius of the grip
	// - fractionalRadiusAllowed (optional): Allow fractional radius? (won't be centered)
	//TODO: expose more parameters
	drawGripHelper: function(params)
	{
		this.checkpointRng();
		
		var bounds = new this.Bounds(0, 0, this.dimension, this.dimension);
		var dscale = bounds.h / 32;
		
		// the radius of the grip in pixel diagonals
		var minRadius = params.minRadius ? params.minRadius : 1;
		var maxRadius = params.maxRadius;
		if (params.fractionalRadiusAllowed)
			var hiltRadius = 0.5 * Math.ceil(this.randomRange(minRadius * 2, maxRadius * 2) * dscale);
		else
			var hiltRadius = Math.ceil(this.randomRange(minRadius, maxRadius) * dscale);
		
		// wavelength of the grip texture (in diagonal pixels)
		var hiltWavelength = Math.max(2, Math.ceil(this.randomRange(3,6) * dscale));
		// amplitude of the grip wave
		var hiltWaveAmplitude = Math.ceil(this.randomRange(1,3) * dscale);
		// the color of the grip
		var hiltColorLight = this.hsvToRgb({ h: this.randomRange(0, 360), s: this.randomFloat(), v: this.randomRangeFloat(0.7, 1) });
		// the color of the grip inner shadows
		var hiltColorDark = this.colorDarken(hiltColorLight, 1);
		
		var outerThis = this;

		var rodParams = {
			radius: hiltRadius,
			startDiag: params.startDiag,
			lengthDiag: params.lengthDiag * Math.sqrt(2), //HACK: backwards compat, can be refactored out from the blade function
			colorFunc: function(l)
			{
				var gripWave = Math.abs(Math.cos(Math.PI * 2 * l / hiltWavelength));
				return outerThis.colorLerp(hiltColorDark, hiltColorLight, gripWave);
			}
		};
		this.drawRodHelper(rodParams);
	},
	
	// Helper function that draws a haft with parameters
	// Oriented from the bottom-left corner of the canvas to the top-right
	// Parameters:
	// - startDiag (required): The distance from the bottom-left corner to the start of the haft
	// - lengthDiag (required): The length of the haft
	// - minRadius (optional): The minimum radius of the haft
	// - maxRadius (optional): The maximum radius of the haft
	// - fractionalRadiusAllowed (optional): Allow fractional radius? (won't be centered)
	// - color (optional): The color of the haft
	// Returns an object containing:
	// - radius: the radius of the haft
	drawHaftHelper: function(params)
	{
		this.checkpointRng();
		
		var bounds = new this.Bounds(0, 0, this.dimension, this.dimension);
		var dscale = bounds.h / 32;
		
		// the radius of the haft in pixel diagonals
		var minRadius = params.minRadius ? params.minRadius : 1;
		var maxRadius = params.maxRadius;
		if (params.fractionalRadiusAllowed)
			var haftRadius = 0.5 * Math.ceil(this.randomRange(minRadius * 2, maxRadius * 2) * dscale);
		else
			var haftRadius = Math.ceil(this.randomRange(minRadius, maxRadius) * dscale);
		
		// the color of the haft
		var haftColor = params.color
			? params.color
			: this.hsvToRgb({ h: this.randomRange(35, 45), s: this.randomFloat(), v: this.randomRangeFloat(0.5, 0.95) });

		var rodParams = {
			radius: haftRadius,
			startDiag: params.startDiag,
			lengthDiag: params.lengthDiag,
			colorFunc: function() { return haftColor; }
		};
		this.drawRodHelper(rodParams);
		
		return {
			radius: haftRadius
		};
	},
	
	// Helper-helper function for drawing diagonal rods of uniform thickness
	// Oriented from the bottom-left corner of the canvas to the top-right
	// - startDiag (required): The distance from the bottom-left corner to the start of the rod
	// - lengthDiag (required): The length of the rod
	// - radius (required): The radius of the rod
	// - colorFunc (required): Function that gets the color of the rod by the pixel index along it
	drawRodHelper: function(params)
	{
		var bounds = new this.Bounds(0, 0, this.dimension, this.dimension);
		var radSteps = params.radius / 0.5;
		
		var fractionalRadius = (params.radius % 1) != 0;
		var startAxis = Math.ceil(params.startDiag / Math.sqrt(2));
		var lengthAxis = params.lengthDiag / Math.sqrt(2);
		for (var l = 0; l < lengthAxis; l += 0.5)
		{
			var al = startAxis + l;

			// determine draw parameters
			var core = new this.Vector(al, bounds.h - 1 - al);
			var fractionalStep = (al % 1) != 0;
			if (!fractionalStep)
			{
				core.x = core.x;
				core.y = core.y;
				
				var left = -Math.floor((radSteps - 2) / 4);
				var right = Math.floor((radSteps - 1) / 4);
			}
			else
			{
				core.x = Math.floor(core.x);
				core.y = Math.floor(core.y);
			
				var left = -Math.floor((radSteps - 3) / 4);
				var right = Math.floor((radSteps - 0) / 4);
			}

			// draw grip line
			var sliceColor = params.colorFunc(l);
			this.context.fillStyle = this.colorStr(sliceColor);
			for (var h = left; h <= right; h++)
			{
				if (left == right)
				{
					var darkenAmt = fractionalStep ? 0 : 1;
				}
				else
				{
					var darkenAmt = (h - left) / (right - left);
				}
				darkenAmt *= 0.3;
				
				this.context.fillStyle = this.colorStr(this.colorDarken(sliceColor, darkenAmt));
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
		this.checkpointRng();
		
		var pommelColorLight = params.colorLight
			|| this.hsvToRgb({ h: this.randomRange(0, 360), s: this.randomFloatLow()*0.5, v: this.randomRangeFloat(0.7, 1) });
		var pommelColorDark = params.colorDark
			|| this.colorDarken(pommelColorLight, 0.6);
		var pommelRadius = params.radius;
		var shadowCenter = new this.Vector(0.5, 1).normalize().multiplyScalar(pommelRadius).addVector(params.center);
		var highlightCenter = new this.Vector(-1, -1).normalize().multiplyScalar(pommelRadius * 0.7).addVector(params.center);
		for (var x = Math.floor(params.center.x - pommelRadius); x <= Math.ceil(params.center.x + pommelRadius); x++)
		for (var y = Math.floor(params.center.y - pommelRadius); y <= Math.ceil(params.center.y + pommelRadius); y++)
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
