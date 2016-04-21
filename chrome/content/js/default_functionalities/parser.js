/*-- Parser --*/

//INISection
class INISection {
	constructor(name, top) {
		this.name = name;
		this.top = top;
		this.items = [];
		this.plainstr = "";
		this.length = 0;
	}
	
	newSection() {
		var r = this[this.length++] = { top: this.top };
		return r;
	}
}

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

function parseHierarchicalINI(text) {
	var lines = text.split('\n'), fEmpty = false, lastIndent = 0;
	var obj = [], current = obj;

	for(var i = 0; i < lines.length; i++) {
		var line = lines[i];
		var pline = line;

		//Leerzeile
		if(!line.length || line.search(/[^\s\t]/) == -1) {
			fEmpty = true;
			continue;
		}

		//Einrückung "zählen"
		var indent = line.match(/^[\s\t]+/g);
		if(indent) {
			let tabcount = indent[0].match(/\t/g) || 0;
			if(tabcount)
				tabcount = tabcount.length;
			indent = indent[0].length+tabcount;
			line = line.replace(/^[\s\t]+/g, "");
		}
		else
			indent = 0;

		//Bei Einrückungsunterschied zurückspringen
		if(/*fEmpty || */(lastIndent != indent)) {
			var diff = lastIndent - indent;

			//Sonderregelung für Wertzuweisungen
			if(line.search(/.+?=.+/) != -1)
				diff -= 1;

			while(diff >= 0) {
				if(current.top)
					current = current.top;
				diff -= 2;
			}

			fEmpty = false;
		}

		//Prüfen ob es sich nicht um eine Wertzuweisung handelt
		if(line.search(/.+?=.+/) == -1) {
			//Eine neue [Sektion]
			if(line.search(/\[.+\]/) != -1) {
				if(lastIndent == indent && current && current.top)
					current = current.top;

				var name = line.match(/\[(.+)\]/)[1];
				if(current[name])
					current = current[name].newSection();
				else {
					current[name] = new INISection(name, current);
					current = current[name].newSection();
				}
			}
		}
		else {
			var [, name, value] = line.match(/(.+?)=(.+)/);

			if(value[0] == '"' && value[value.length-1] == '"')
				value = value.substr(1, value.length-2).octToAscii().parseTags();

			current[name] = value;
		}
		
		var temp = current;
		if(lastIndent != indent)
			pline = "\r\n"+pline;
		while(temp.top) {
			if(!pline)
				break;

			if(!temp.plainstr)
				temp.plainstr = "";
			temp.plainstr += pline+"\r\n";
			temp = temp.top;
		}

		lastIndent = indent;
	}

	return obj;
}