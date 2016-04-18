/*-- KeyBindings --*/

const KB_Call_Down = 0, KB_Call_Up = 1, KB_Call_Pressed = 2;

function _keybinderGetKeysByIdentifier(identifier) {
	if(!_mainwindow.customKeyBindings)
		return;
	
	return _mainwindow.customKeyBindings[identifier];
}

function _keybinderCheckKeyBind(keybind, event, keys) {
	if(!keys) {
		keys = _keybinderGetKeysByIdentifier(keybind.getIdentifier());
		if(!keys && !(keys = keybind.defaultKeys))
			return false;

		if(typeof keys == "object") {
			for(var i = 0; i < keys.length; i++)
				if(_keybinderCheckKeyBind(keybind, event, keys[i]))
					return true;
			
			return false;
		}
	}

	//Modifier überprüfen
	if(keys.search(/(^|-)Ctrl($|-)/) != -1 && !event.ctrlKey)
		return false;
	if(keys.search(/(^|-)Shift($|-)/) != -1 && !event.shiftKey)
		return false;
	if(keys.search(/(^|-)Alt($|-)/) != -1 && !event.altKey)
		return false;

	//Letzte Taste Rausfinden und checken
	var key = keys.replace(/-?(Ctrl|Shift|Alt)-?/g, "");
	if(getKeyCodeIdentifier(event.keyCode) == key)
		return true;
	
	return false;
}

function bindKeyToObj(kb, obj = $(document)) {
	obj = $(obj);
	for(var i = 0; i < obj.length; i++) {
		var elm = obj[i];
		if(elm._windmill_keybinding)
			elm._windmill_keybinding.push(kb);
		else {
			elm._windmill_keybinding = [kb];
			$(obj).keypress(function(e) {
				if(!$(this).prop("_windmill_keybinding"))
					return;

				for(var i = 0; i < $(this).prop("_windmill_keybinding").length; i++) {
					var keybind = $(this).prop("_windmill_keybinding")[i];

					if(keybind.calltype != KB_Call_Pressed)
						continue;

					if(_keybinderCheckKeyBind(keybind, e))
						keybind.exec(e, this);
					else
						continue;

					e.stopImmediatePropagation();
					return true;
				}
			});
			$(obj).keydown(function(e) {
				if(!$(this).prop("_windmill_keybinding"))
					return;

				for(var i = 0; i < $(this).prop("_windmill_keybinding").length; i++) {
					var keybind = $(this).prop("_windmill_keybinding")[i];

					if(keybind.calltype != KB_Call_Down)
						continue;

					if(_keybinderCheckKeyBind(keybind, e))
						keybind.exec(e, this);
					else
						continue;

					e.stopImmediatePropagation();
					return true;
				}
			});
			$(obj).keyup(function(e) {
				if(!$(this).prop("_windmill_keybinding"))
					return;

				for(var i = 0; i < $(this).prop("_windmill_keybinding").length; i++) {
					var keybind = $(this).prop("_windmill_keybinding")[i];

					if(keybind.calltype != KB_Call_Up)
						continue;

					if(_keybinderCheckKeyBind(keybind, e))
						keybind.exec(e, this);
					else
						continue;

					e.stopImmediatePropagation();
					return true;
				}
			});
		}
	}
}

function getKeyBindingObjById(id) {
	if(!_mainwindow)
		_mainwindow = window;

	for(var i = 0; i < _mainwindow.keyBindingList.length; i++)
		if(_mainwindow.keyBindingList[i] && _mainwindow.keyBindingList[i].getIdentifier() == id)
			return _mainwindow.keyBindingList[i];

	return false;
}

class _KeyBinding {
	constructor(id, dks, ex, ct = KB_Call_Down, pfx = MODULE_LPRE, opt = {}) {
		if(typeof id == "object") {
			var options = id;
			this.identifier = options.identifier;
			this.prefix = options.prefix || pfx;
			this.calltype = options.calltype || ct; // 
			this.defaultKeys = options.defaultKeySetup;
			this.exec = options.exec;
			this.options = options;
		}
		else { //Falls id = identifier
			this.identifier = id;
			this.prefix = pfx;
			this.calltype = ct;
			this.defaultKeys = dks;
			this.exec = ex;
			this.options = opt;
		}
		//In Liste hinzufügen
		if(!_mainwindow.keyBindingList)
			_mainwindow.keyBindingList = [this];
		else
			_mainwindow.keyBindingList.push(this);

		if(!_mainwindow.customKeyBindings)
			_mainwindow.customKeyBindings = [];

		if(!_mainwindow.customKeyBindings[this.getIdentifier()])
			_mainwindow.customKeyBindings[this.getIdentifier()] = this.defaultKeys;
	}

	getIdentifier() { return this.prefix + "_" + this.identifier; }
}

//Fallback
function KeyBinding(...pars) { return new _KeyBinding(...pars); }