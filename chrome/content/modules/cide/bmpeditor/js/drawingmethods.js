/*-- Zeichenmethoden --*/

// Sind notwendig, da Canvas mit Antialiasing zeichnet (Sind allerdings auch rechenintensiv, daher nicht in der Zeichenvorschau verwendet)

function _idataSetPixel(idata, x, y, clr) {
	x = Math.round(x); y = Math.round(y);
	if(x < 0 || y < 0 || x >= idata.width || y >= idata.height)
		return idata;
	
	var offset = (y*(idata.width*4)) + (x*4);

	if(!clr)
		clr = [0, 0, 0, 0];
	else
		clr = parseInt(clr.substr(1), 16).num2byte(4).reverse();
	
	idata.data[offset] = clr[1];
	idata.data[offset+1] = clr[2];
	idata.data[offset+2] = clr[3];
	idata.data[offset+3] = 255;
	
	return idata;
}

//Gibt die ImageData zwischen zwei Punkten zurueck
function getImageData2(ctx, sx, sy, ex, ey) {
	return ctx.getImageData(Math.min(sx, ex), Math.min(sy, ey), Math.max(Math.abs(ex-sx), 1), Math.max(Math.abs(ey-sy), 1));
}

//Angepasster Scriptauszug aus http://members.chello.at/easyfilter/bresenham.js (plotLine)
function _cnvStrokeLine(cnv, x0, y0, x1, y1) {
	cnv = $(cnv).get(0);
	var ctx = cnv.getContext("2d");
	
	if(ctx.lineWidth > 1) {
		var tFillClr = ctx.fillStyle, lw = Math.floor(ctx.lineWidth/2);
		ctx.fillStyle = ctx.strokeStyle;
		var angle = Math.atan2(y1-y0, x1-x0);
		_cnvFillPoly(cnv, [[x0+lw*Math.cos(angle+Math.PI/2), y0+lw*Math.sin(angle+Math.PI/2)],
						   [x0+lw*Math.cos(angle-Math.PI/2), y0+lw*Math.sin(angle-Math.PI/2)],
						   [x1+lw*Math.cos(angle-Math.PI/2), y1+lw*Math.sin(angle-Math.PI/2)],
						   [x1+lw*Math.cos(angle+Math.PI/2), y1+lw*Math.sin(angle+Math.PI/2)]]);
		ctx.fillStyle = tFillClr;
		return true;
	}

	var _sx = Math.min(x0, x1), _sy = Math.min(y0, y1);
	var dx =  Math.abs(x1-x0), sx = x0<x1 ? 1 : -1;
	var dy = -Math.abs(y1-y0), sy = y0<y1 ? 1 : -1;
	var err = dx+dy, e2;  	/* error value e_xy */

	var idata = ctx.getImageData(_sx, _sy, Math.max(Math.abs(x1-x0), 1), Math.max(Math.abs(y1-y0), 1));

	while(true) {                                                          /* loop */
		idata = _idataSetPixel(idata, x0-_sx, y0-_sy, ctx.strokeStyle);
		if(x0 == x1 && y0 == y1) break;
		e2 = 2*err;
		if(e2 >= dy) { err += dy; x0 += sx; }                        /* x step */
		if(e2 <= dx) { err += dx; y0 += sy; }                        /* y step */
	}
   
	ctx.putImageData(idata, _sx, _sy);
}

function _cnvFillEllipse(cnv, sx, sy, mx, my, mdata) {
	var ctx = $(cnv).get(0).getContext("2d"), mctx;
	var idata = getImageData2(ctx, sx, sy, mx, my);
	var _sx = Math.min(sx, mx), _sy = Math.min(sy, my);
	var wdt = Math.max(Math.abs(mx-sx), 1)/2, hgt = Math.max(Math.abs(my-sy), 1)/2;

	for(var y = -hgt; y <= hgt; y++) {
		for(var x = -wdt; x <= wdt; x++) {
			var dx = x / wdt;
			var dy = y / hgt;
			if(dx*dx+dy*dy <= 1) {
				if(mdata) {
					var offset = ((y+hgt)*(idata.width*4)) + ((x+wdt)*4);
					idata.data[offset] = mdata[offset];
					idata.data[offset+1] = mdata[offset+1];
					idata.data[offset+2] = mdata[offset+2];
					idata.data[offset+3] = 255;
				}
				else
					idata = _idataSetPixel(idata, wdt+x, hgt+y, ctx.fillStyle);
			}
		}
	}

	ctx.putImageData(idata, _sx, _sy);
}

function _cnvFillPoly(cnv, poly) {
	var start = poly[0];
	
	//Polygon erst ab 3 Eckpunkten möglich
	if(poly.length < 3)
		return;

	var minX, minY, maxX, maxY;
	minX = minY = maxX = maxY = -1;

	for(var i = 0; i < poly.length; i++) {
		var x = poly[i][0], y = poly[i][1];
		
		if(minX == -1 || x < minX)
			minX = x;
		if(minY == -1 || y < minY)
			minY = y;
		if(maxX == -1 || x > maxX)
			maxX = x;
		if(maxY == -1 || y > maxY)
			maxY = y;
	}

	var ctx = $(cnv).get(0).getContext("2d");
	var imgData = ctx.getImageData(minX, minY, Math.max(maxX-minX, 1), Math.max(maxY-minY, 1));
	for(var _x = 0; _x < imgData.width; _x++)
		for(var _y = 0; _y < imgData.height; _y++)
			if(pointInPolygon(minX+_x, minY+_y, poly))
				imgData = _idataSetPixel(imgData, _x, _y, ctx.fillStyle);

	ctx.putImageData(imgData, minX, minY);
}