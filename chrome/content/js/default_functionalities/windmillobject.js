/* hook api */

var _HOOKS = {};
function hook(eventName, fn) {
	if(!_HOOKS[eventName])
		_HOOKS[eventName] = [];
	
	// save function or function name
	_HOOKS[eventName].push(fn);	
}

function execHook(eventName, ...args) {
	var list = _HOOKS[eventName];
	
	if(!list)
		return;
	
	for(var item in list) {
		if(typeof list[item] === "function")
			list[item].call(list[item], ...args);
		else if(list[item] && window[list[item]])
			window[list[item]].call(null, ...args);
		else
			err("Problem with executing hook: " + list[item]);
	}
}

class WindmillObject {
	//Aufrufen ueber super() fuehrt atm zu Abstuerze, kann spaeter nachgeliefert werden.
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