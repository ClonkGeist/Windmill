/*-- Sonstiges --*/

Object.defineProperty(Array.prototype, "byte2str", { enumerable: false, writable: false,
	value: function(nullchars) {
	for(var i = 0, str = ""; i < this.length; i++)
		if(this[i] > 0 || nullchars)
			str += String.fromCharCode(this[i]);
	
	return str;
}});

Object.defineProperty(Array.prototype, "byte2num", { enumerable: false, writable: false,
	value: function() {
	for(var i = this.length-1, str = ""; i >= 0; i--) {
		if(this[i] < 16)
			str += "0";
		str += this[i].toString(16);
	}
	var ret = parseInt(str, 16);
	if(isNaN(ret))
		return 0;
	else
		return ret;
}});

Object.defineProperty(Number.prototype, "num2byte", { enumerable: false, writable: false,
	value: function(size) {
		var ar = [], num = this;
		for(var i = 0; i < size; i++) {
			ar.push(num & 0xFF);
			num >>= 8;
		}
		
		return ar;
}});

function createSocketConnection(addr, port, options) {
	return ctypesWorker("createSocket", addr, port, options);
}

var TIMES = {};

function iTr(key) { TIMES[key] = (new Date).getTime(); }
function gTr(key) { err(key + ": " + ((new Date).getTime() - (TIMES[key])) + "ms"); }