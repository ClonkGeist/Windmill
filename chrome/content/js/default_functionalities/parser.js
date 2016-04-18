/*-- Parser --*/

function parseHTML(el) {
	var str = "<"+el.nodeName+" >";
	
	for(var i in el.childNodes) {	
		err(i + "  ::  " + el.childNodes[i])
		str += parseHTML(el.childNodes[i]);
	}
	return str + "</"+el.nodeName+">";
}

function parseCssStyle(el) {
	var str = "", style = window.getComputedStyle(el);

	for(var i = 0; i < style.length; i++)
		str += style.item(i) + ": " + style.getPropertyValue(style.item(i)) + "\n";

	return str;
}

function* parseINI2(value) {
	if(typeof value == "string")
		value = parseINIArray(value);
	
	for(var sect in value) {
		if(value[sect])
			yield sect;
		else
			continue;

		for(var key in value[sect])
			yield { sect, key, val: value[sect][key] };
	}
}	

function parseINIArray(text) {
	var lines = text.split("\n");
	var data = [], current_section = 0;
	for(var i = 0; i < lines.length; i++) {
		var line = lines[i];
		if(line.search(/[^=\[]+#/) == 0)
			continue;
		
		if(line.search(/[^=.]*\[[^=.]+\][^=.]*/) == 0) {
			//Section
			current_section = line.match(/[^=.]*\[([^=.]+)\][^=.]*/)[1];
			data[current_section] = [];
		}
		else if(line.search(/.=./) != -1) {
			var key = line.match(/(.+?)=/)[1];
			var value = line.match(/.+?=(.+)/)[1];

			if(!data[current_section])
				data[current_section] = [];
			data[current_section][key] = value;
		}
	}

	return data;
}

function parseINIValue(value, type, default_val) {
	if(value == undefined)
		return default_val;

	if(type == "int") {
		value = parseInt(value);
		if(isNaN(value))
			return default_val;
		else
			return value;
	}
	else if(type == "bool" || type == "boolean") {
		if(isNaN(parseInt(value))) {
			if(value.toUpperCase() == "TRUE")
				return true;
			else if(value.toUpperCase() == "FALSE")
				return false;
			else
				return default_val;
		}
		else
			return !!parseInt(value);
	}
	
	//Currently not supported
	return value;
}