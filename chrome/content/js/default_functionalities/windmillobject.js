/* hook api */

var _HOOKS = {};
function hook(eventName, fn) {
	if(typeof eventName == "object") {
		if(!eventName.name)
			throw "Event name is invalid.";
		_HOOKS[eventName.name] = [];
		if(!eventName.fn && fn)
			eventName.fn = fn;
		if(!eventName.fn)
			throw "No function to be hooked to the " + eventName.name + " event.";
		_HOOKS[eventName.name].push(eventName);
		return;
	}
	if(!eventName)
		throw "Event name is invalid.";
	if(!fn)
		throw "No function to be hooked to the " + eventName + " event.";
	if(!_HOOKS[eventName])
		_HOOKS[eventName] = [];
	
	// save function or function name
	_HOOKS[eventName].push(fn);	
}

function execHook(eventName, ...args) {
	let name = eventName, caller;
	if(typeof eventName == "object") {
		name = eventName.name;
		caller = eventName.caller;
	}
	var list = _HOOKS[name];
	
	if(!list)
		return;
	
	for(let item of list) {
		if(!item)
			continue;

		if(typeof item === "function")
			item.call(caller || item, ...args);
		else if(typeof item == "object") {
			let fn = item.fn, fncaller = caller;
			if(!fncaller)
				fncaller = item.caller || fn;
			fn.call(fncaller, ...args);
			//if declared as throwaway, remove the function
			if(item.throwaway) {
				//it may be declared as a counter
				item.throwaway--;
				if(!item.throwaway)
					list.splice(list.indexOf(item), 1);
			}
		}
		else if(item && window[item])
			window[item].call(null, ...args);
		else
			err("Problem with executing hook: " + item);
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