
function createColorPicker(container, fAlpha) {
	return (new ColorPicker()).build(container, fAlpha);
}

class ColorPicker {
	constructor() {
		// fn called on change
		this.onchange;
		
		this.hasAlpha = false;
		
		this.white = 0;
		this.black = 0;
		
		this.alpha = 0;
		this.hue = 0;
	}

	fireOnChange() {
		if(this.onchange)
			this.onchange(this.getColor());
	}
	
	clamp(v) {
		if(v < 0)
			return 0;
		else if(v > 255)
			return 255;
		
		return v;
	}
	
	getColor() {
		var b = Math.abs(this.hue - 240);
		if(b > 120)
			b = 0;
		else
			b = 255 - 255/120*b;
		
		var g = Math.abs(this.hue - 120);
		if(g > 120)
			g = 0;
		else
			g = 255 - 255/120*g;
				
		var r = Math.abs(this.hue - 180);
		if(r > 120)
			r = 255;
		else
			r = 255/120*r;
		
		var w = this.white;

		return [
			Math.round(this.clamp((r*(1 - w) + 255*w) * this.black)),
			Math.round(this.clamp((g*(1 - w) + 255*w) * this.black)),
			Math.round(this.clamp((b*(1 - w) + 255*w) * this.black))
		];
	}
	
	setColorRGB(r,g,b) {
		var hsl = RGBtoHSL(r,g,b);
		return this.setColorHSL(...hsl);
	}
	
	setColorHSL(h,s,l) {
		this.hue = Math.round(h*360) % 360;
		this.white = 1-s;
		this.black = l;

		var {width, height} = this._pickArea.getBoundingClientRect();
		$(this._pickAreaCaret).css({
			"margin-left": width - width*this.white,
			"margin-top": height - height*this.black
		});
		
		this.updatePickArea();
		this.fireOnChange();
	}
	
	build(cont, fA) {
		if(!cont)
			return false;
		
		if(fA)
			this.hasAlpha = true;
		
		if(this.lang == "html")
			err("color picker not yet supported for html, blame apfelclonk...");
		else {
			this.wrapper = $('<vbox class="clrpckr-wrapper" flex="1"></vbox>')[0];
			this._pickArea = $('<vbox class="pick-area" flex="1"></vbox>')[0];
			this._pickAreaSub = $('<stack class="pick-area-sub" flex="1"></stack>')[0];
			this._pickAreaCaret = $('<box class="pick-area-caret" height="1" width="1" right="0" top="0"></box>')[0];
			
			$(this._pickArea).append(this._pickAreaSub);
			$(this._pickAreaSub).append(this._pickAreaCaret);
			
			this._colorChannel = $('<hbox align="stretch" class="color-channel"></hbox>')[0];
			this._colorChannelCaret = $('<box class="color-channel-caret"></box>')[0];
			
			this.updatePickArea();
			this.updateAlpha();
			
			$(this.wrapper).append(this._pickArea);
			$(this.wrapper).append(this._colorChannel);
			$(this._colorChannel).append(this._colorChannelCaret);

			var fn2 = (e) => {
				var {left, top, width, height} = this._pickArea.getBoundingClientRect();
				var [x, y] = [e.clientX - left, e.clientY - top];

				if(x < 0)
					x = 0;
				else if(x >= width)
					x = width - 1;
				
				if(y < 0)
					y = 0;
				else if(y >= height)
					y = height - 1;
				
				this.white = 1 - x/width;
				this.black = 1 - y/height;
				
				$(this._pickAreaCaret).css({
					"margin-left": width - width*this.white,
					"margin-top": height - height*this.black
				});
				
				this.fireOnChange();
			};
			
			$(this._pickArea).mousedown((e) => {
				this.mousepressed_pA = true;
				fn2(e);
			});

			$(document).mousemove((e) => {
				if(this.mousepressed_pA)
					fn2(e);
			});
			$(document).mouseup((e) => {
				if(this.mousepressed_pA)
					fn2(e);
				this.mousepressed_pA = false;
			});
			
			var fn = (e) => {
				var {width, left} = this._colorChannel.getBoundingClientRect(),
					d = e.clientX - left;
				
				if(d < 0)
					d = 0;
				else if(d >= width)
					d = width - 1;
				
				var p = d*100/width;
				
				$(this._colorChannelCaret).css("margin-left", d + "px");
				
				this.hue = 359 - Math.round(359/100*p);
				
				this.updatePickArea();
				this.fireOnChange();
			}
			
			$(this._colorChannel).mousedown((e) => {
				this.mousepressed = true;
				fn(e);
			});

			$(document).mousemove((e) => {
				if(this.mousepressed)
					fn(e);
			});
			$(document).mouseup((e) => {
				if(this.mousepressed)
					fn(e);
				this.mousepressed = false;
			});
			
			if(fA) {
				this._alphaChannel = $('<box class="alpha-channel"></box>')[0];

				$(this.wrapper).append(this._alphaChannel);
			}
			
			$(this._pickArea).append(this._pickAreaSub);
			
			$(cont).append(this.wrapper);
		}
		
		return this;
	}
	
	updatePickArea() {
		$(this._pickArea).css("background", "linear-gradient(to right, white 0%, hsl("+this.hue+", 100%, 50%) 100%)");
	}
	
	updateAlpha() {
	}
	
	disable() {
	}
	
	enable() {
	}
}