
/**
 * Icon Machine - Random Potion Icon Generator
 * by Brian MacIntosh (brianamacintosh@gmail.com)
 * 
 * This source code is licensed under the CC-BY-3.0 license.
 * https://creativecommons.org/licenses/by/3.0/
 * 
 * Visit http://www.brianmacintosh.com/
 */

window.RandomArt =
{
	initialize: function()
	{
		if (this.initialized) return;
		this.initialized = true;

		this.canvas = document.getElementById("generator");
		this.context = this.canvas.getContext('2d');

		this.dimensionSelect = document.getElementById("dimension");

		//HACK:
		//this.context.scale(3, 3);
	},

	/**
	 * Returns a random integer in the range [min, max)
	 */
	randomRange: function(min, max)
	{
		return Math.floor(Math.random() * (max - min) + min);
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
			b: color.b * (1-t),
			g: color.g * (1-t),
		}
		if (color.a !== undefined) c.a = color.a;
		return c;
	},

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

	colorStr: function(color)
	{
		if (color.a !== undefined)
			return "rgba(" + Math.floor(color.r) + "," + Math.floor(color.g) + "," + Math.floor(color.b) + "," + color.a + ")";
		else
			return "rgb(" + Math.floor(color.r) + "," + Math.floor(color.g) + "," + Math.floor(color.b) + ")";
	},

	notifySizeChanged: function()
	{
		this.initialize();
		
		this.setDimension(parseInt(this.dimensionSelect.options[this.dimensionSelect.selectedIndex].value));
	},

	setDimension: function(dimension)
	{
		this.initialize();

		this.canvas.width = dimension;
		this.canvas.height = dimension;
		this.generateNewImage();
	},

	generateNewImage: function()
	{
		this.initialize();

		this.drawRandomPotion();
	},

	drawRandomPotion: function()
	{
		this.initialize();

		var width = this.canvas.width;
		var height = this.canvas.height;
		var dscale = height / 32;
		var centerXL = width/2-1;

		// clear the canvas
		this.context.fillStyle = "rgba(0,0,0,0)";
		this.context.clearRect(0, 0, width, height);

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
		// width of bottle body
		var bodyWidth = this.randomRange(neckWidth / 2, Math.round(14 * dscale)) * 2;
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

		var fluidColor = {
			r:this.randomRange(0, 256),
			g:this.randomRange(0, 256),
			b:this.randomRange(0, 256),
		};
		var fluidColor2 = this.colorRandomize(fluidColor, 255);
		
		// draw outer stopper
		var stopperLeft = centerXL - stopperTopWidth/2 + 1;
		var stopperRight = stopperLeft + stopperTopWidth;
		this.context.fillStyle = "black";
		// top border
		this.context.fillRect(stopperLeft, stopperTop-1, stopperTopWidth, 1);
		// left border
		this.context.fillRect(stopperLeft - 1, stopperTop, 1, stopperTopHeight)
		// right border
		this.context.fillRect(stopperRight, stopperTop, 1, stopperTopHeight)
		// lip to border (draws behind stopper)
		this.context.fillRect(centerXL - lipWidth/2 + 1, lipTop - 1, lipWidth, 1);
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
				for (var x = 0; x < contourWidth; x++)
				{
					var n = x/(contourWidth-1)-(0.5+Math.random()*0.1);
					this.context.fillStyle = this.colorStr(
						this.colorLerp(
							this.colorLerp(fluidColor, fluidColor2, vn),
							this.colorLerp(this.colorDarken(fluidColor, 1), this.colorDarken(fluidColor2, 1), vn),
							n));
					this.context.fillRect(left + x, y, 1, 1);
				}
			}

			// draw glass
			if (y >= neckTop && y <= fluidTop)
			{
				var left = centerXL - contourWidth/2;
				for (var x = 0; x < contourWidth; x++)
				{
					var n = x/(contourWidth-1);
					this.context.fillStyle = this.colorStr(this.colorLerp(glassLight, glassDark, n));
					this.context.fillRect(left + x, y, 1, 1);
				}
			}

			if (contourWidth == previousContour)
			{
				// contour is the same
				this.context.fillStyle = "black";
				this.context.fillRect(centerXL - contourWidth/2, y, 1, 1);
				this.context.fillRect(centerXL + contourWidth/2 + 1, y, 1, 1);
				this.context.fillStyle = this.colorStr(innerBorderLight);
				this.context.fillRect(centerXL - contourWidth/2 + 1, y, 1, 1);
				this.context.fillStyle = this.colorStr(innerBorderDark);
				this.context.fillRect(centerXL + contourWidth/2, y, 1, 1);
			}
			else
			{
				var yOff = previousContour < contourWidth ? y-1 : y;
				var yInner = previousContour < contourWidth ? y : y-1;
				var minContour = Math.min(contourWidth, previousContour);
				var lineWidth = Math.abs(previousContour - contourWidth)/2;
				var lineOffset = lineWidth-1;
				this.context.fillStyle = "black";
				this.context.fillRect(centerXL - minContour/2 - lineOffset, yOff, lineOffset, 1);
				this.context.fillRect(centerXL + minContour/2 + 2, yOff, lineOffset, 1);
				this.context.fillRect(centerXL - contourWidth/2, y, 1, 1);
				this.context.fillRect(centerXL + contourWidth/2 + 1, y, 1, 1);
				this.context.fillStyle = this.colorStr(innerBorderLight);
				this.context.fillRect(centerXL - minContour/2 - lineWidth + 1, yInner, lineWidth, 1);
				this.context.fillRect(centerXL - contourWidth/2 + 1, y, 1, 1);
				this.context.fillStyle = this.colorStr(innerBorderDark);
				this.context.fillRect(centerXL + minContour/2 + 1, yInner, lineWidth, 1);
				this.context.fillRect(centerXL + contourWidth/2, y, 1, 1);
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
		this.context.fillStyle = "black";
		this.context.fillRect(lipLeft - 1, lipTop, 1, lipHeight);
		this.context.fillRect(lipLeft + lipWidth, lipTop, 1, lipHeight);
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
		this.context.fillStyle = "black";
		var left = centerXL - contour[bottleBottom] + 1;
		var width = contour[bottleBottom]*2;
		this.context.fillRect(left, height-1, width, 1);
		for (var x = 0; x < width; x++)
		{
			var n = (x/(width-1))-0.5;
			this.context.fillStyle = this.colorStr(this.colorLerp(innerBorderLight, innerBorderDark, n));
			this.context.fillRect(left + x, bottleBottom, 1, 1);
		}
	}
}
