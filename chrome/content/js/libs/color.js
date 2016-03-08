
/*-- OpenClonk eigene Funktion zur Faerbung in JavaScript umgeschrieben: --*/
// ../src/graphics/C4Surface.cpp:257

const CBO_RANGE = 255, CBO_HLSMAX = 255, CBO_RGBMAX = 255;

function ClrByOwner(r,g,b) {
	var [cmax, cmin] = [Math.max(r,g,b), Math.min(r,g,b)]
	var H, S, L = (((cmax+cmin)*CBO_HLSMAX) + CBO_RGBMAX)/(2*CBO_RGBMAX);

	if(cmax == cmin) {
		S = 0;
		H = (CBO_HLSMAX*2/3);
	}
	else {
		if(L <= (CBO_HLSMAX/2))
			S = (((cmax-cmin)*CBO_HLSMAX) + ((cmax+cmin)/2)) / (cmax+cmin);
		else
			S = (((cmax-cmin)*CBO_HLSMAX) + ((2*CBO_RGBMAX-cmax-cmin)/2)) / (2*CBO_RGBMAX-cmax-cmin);

		var [rd, gd, bd] = [(((cmax-r)*(CBO_HLSMAX/6)) + ((cmax-cmin)/2)) / (cmax-cmin),
							(((cmax-g)*(CBO_HLSMAX/6)) + ((cmax-cmin)/2)) / (cmax-cmin),
							(((cmax-b)*(CBO_HLSMAX/6)) + ((cmax-cmin)/2)) / (cmax-cmin)]
		
		if(r == cmax)
			H = bd-gd;
		else if(g == cmax)
			H = (CBO_HLSMAX/3) + rd-bd;
		else
			H = ((2*CBO_HLSMAX)/3) + gd-rd;
		
		if(H < 0)
			H += CBO_HLSMAX;
		if(H > CBO_HLSMAX)
			H -= CBO_HLSMAX;
	}
	
	if(!(H > 145 && H < 175) && (S > 100))
		return false;

	return true;
}

function ModulateClr(clr1, clr2) {
	var clr = [(clr1[0] * clr2[0]) / 0xff, //r
			   (clr1[1] * clr2[1]) / 0xff, //g
			   (clr1[2] * clr2[2]) / 0xff, //b
			   (clr1[3] * clr2[3]) / 0xff] //a
	
	return clr;
}

function hslChangeColor(px, hsl, offset, tl) {
	var pxhsl = RGBtoHSL(px[0], px[1], px[2]);
	
	pxhsl[0] = (pxhsl[0]+hsl[0]+offset) % 1;
	pxhsl[1] = hsl[1];

	var npx = HSLtoRGB(pxhsl[0], pxhsl[1], pxhsl[2]);
	npx[3] = px[3];
	return npx;
}

function multiplyColorFilter(data, clr) {
	
	for(var i = 0; i < data.length; i+=4) {
		
		// r
		data[i  ] *= clr[0]/255;
		//g
		data[i+1] *= clr[1]/255;
		//b
		data[i+2] *= clr[2]/255;
	}
	
	return data;
}

function selectiveColorFilter(data, targetColor, tolerance, filter) {
	if(!filter)
		return true;

	for(var i = 0; i < data.length; i+=4) {
		var [r,g,b,a] = [data[i], data[i+1], data[i+2], data[i+3]];
		
		//log(">> " + deltaE76(RGBtoLab(r,g,b), targetColor));
		if(deltaE76(RGBtoLab(r,g,b), targetColor) < tolerance) {
			var ndata = filter(r, g, b, a);
			//log(">> " + ndata);
			data[i] = ndata[0]; data[i+1] = ndata[1];
			data[i+2] = ndata[2]; data[i+3] = ndata[3];
		}
	}
	
	return data;
}

function deltaE76(color1, color2) {
	var L1 = color1[0], L2 = color2[0];
	var a1 = color1[1], a2 = color2[1];
	var b1 = color1[2], b2 = color2[2];

	return Math.sqrt(Math.pow(L2-L1, 2)+Math.pow(a2-a1, 2)+Math.pow(b2-b1,2));
}

function RGBtoLab(r,g,b) {
	r /= 255; g /= 255; b /= 255;
	
	if(r > 0.04045)
		r = Math.pow(((r+0.055)/1.055), 2.4);
	else
		r /= 12.92;
	
	if(g > 0.04045)
		g = Math.pow(((g+0.055)/1.055), 2.4);
	else
		g /= 12.92;
	
	if(b > 0.04045)
		b = Math.pow(((b+0.055)/1.055), 2.4);
	else
		b /= 12.92;
	
	r *= 100; g *= 100; b *= 100;
	
	var x = r * 0.4124 + g * 0.3576 + b * 0.1805;
	var y = r * 0.2126 + g * 0.7152 + b * 0.0722;
	var z = r * 0.0193 + g * 0.1192 + b * 0.9505;

	x /= 95.047; y /= 100; z /= 108.883;
	
	if(x > 0.008856)
		x = Math.pow(x, 1/3);
	else
		x = (7.787*x)+(16/116);
	
	if(y > 0.008856)
		y = Math.pow(y, 1/3);
	else
		y = (7.787 * y)+(16/116);
	
	if(z > 0.008856)
		z = Math.pow(z, 1/3);
	else
		z = (7.787 * z)+(16/116);
	
	var cL = (116*y)-16;
	var ca = 500*(x-y);
	var cb = 200*(y-z);
	
	return [cL, ca, cb];
}

function RGBtoHSB(r,g,b) {
	var hue = 0,sat = 0,bri = 0;
	
	var [cmax, cmin] = [Math.max(r,g,b), Math.min(r,g,b)];

	bri = cmax/255;
	if(cmax)
		sat = (cmax-cmin)/cmax;
	
	if(sat) {
		var [nr, ng, nb] = [(cmax-r)/(cmax-cmin), (cmax-g)/(cmax-cmin), (cmax-b)/(cmax-cmin)];
		
		if(r == cmax)
			hue = nb-ng;
		else if(g == cmax)
			hue = 2 + nr-nb;
		else
			hue = 4 + ng-nr;
		
		hue /= 6;
		if(hue < 0)
			hue += 1;
	}
	
	return [hue*360,sat,bri];
}

function RGBtoHSL(r,g,b) {
	r /= 255; g /= 255; b /= 255;
	var h,s,l;
	var [cmin, cmax] = [Math.min(r,g,b), Math.max(r,g,b)];
	var cdmax = cmax-cmin;
	
	var l = (cmax+cmin)/2;
	
	if(!cdmax)
		h = s = 0;
	else {
		if(l < 0.5)
			s = cdmax/(cmax+cmin);
		else
			s = cdmax/(2-cmax-cmin);
		
		var dr = (((cmax-r)/6)+(cdmax/2))/cdmax;
		var dg = (((cmax-g)/6)+(cdmax/2))/cdmax;
		var db = (((cmax-b)/6)+(cdmax/2))/cdmax;
		
		if(r == cmax) h = db-dg;
		else if(g == cmax) h = (1/3)+dr-db;
		else if(b == cmax) h = (2/3)+dg-dr;
		
		if(h < 0) h++;
		if(h > 1) h--;
	}
	
	return [h,s,l];
}

function HSLtoRGB(h,s,l) {
	var r,g,b;
	if(!s) 
		[r, g, b] = [l*255, l*255, l*255];
	else {
		var v1,v2;
		if(l<0.5)
			v2 = l*(1+s);
		else
			v2 = (l+s)-(s*l);
		
		v1 = 2*l-v2;
		
		r = 255*Hue2RGB(v1,v2,h+(1/3));
		g = 255*Hue2RGB(v1,v2,h);
		b = 255*Hue2RGB(v1,v2,h-(1/3));
	}
	
	return [r,g,b];
}

function Hue2RGB(v1,v2,vh) {
	if(vh < 0) vh++;
	if(vh > 1) vh--;
	
	if((6*vh)<1) return v1+(v2-v1)*6*vh;
	if((2*vh)<1) return v2;
	if((3*vh)<2) return v1+(v2-v1)*((2/3)-vh)*6;

	return v1;
}