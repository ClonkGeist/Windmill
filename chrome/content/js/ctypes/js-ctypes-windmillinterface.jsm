/*-- Windmill Interface --*/

var EXPORTED_SYMBOLS = ["WindmillInterface", "OSError", "sfl"];

function sfl(wmflags, obj, bitrange = 32) { //Wandelt Windmill-Flags in die Betriebssystem-Flags um ueber OSCONST
	var retflags = 0;
	if(!obj.OSCONST)
		return;
	for(var i = 0; i < bitrange; i++) {
		if(wmflags & Math.pow(2, i))
			retflags |= obj.OSCONST(Math.pow(2, i));
	}

	return retflags;
}

class WindmillInterface {
	constructor() {
		this._HOOKS = [];
	}
	
	hook(eventName, fn) {
		if(!this._HOOKS)
			this._HOOKS = [];
		
		if(!this._HOOKS[eventName])
			this._HOOKS[eventName] = [];
		
		this._HOOKS[eventName].push(fn);
	}
	
	execHook(eventName, ...args) {
		if(!this._HOOKS)
			return;

		var list = this._HOOKS[eventName];
	
		if(!list)
			return;
		
		for(var item in list) {
			if(typeof list[item] === "function")
				list[item].call(this, ...args);
			else
				err("Problem with executing hook: " + list[item]);
		}
	}
}

class OSError {
	constructor(message, code) {
		this.message = message;
		this.code = code;
	}
	toMsg() {
		return {
			exn: "OSError",
			message: this.message
		};
	}
}
