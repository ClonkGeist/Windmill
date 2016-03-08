var __l = {};
initializeLanguage();

function initializeLanguage() {
	var langname = getConfigData("Global", "Language"), langs = [];
	
	while(langs.indexOf(langname) == -1) {
		var langarray = readLanguageInfo(_sc.chpath + "/content/locale/"+langname+"/language.ini"), key = "";
		for(key in langarray) {
			if(!__l[key])
				__l[key] = langarray[key];
		}

		langs.push(langname);
		if(langname != "en-US")
			if(langarray.FallbackLang)
				langname = langarray.FallbackLang;
	}
}

function readLanguageInfo(path) {
	var lang = {};
	var f = _sc.file(path);
	if(!f.exists()) {
		alert("The Language file does not exist");
		return {};
	}
	
	var parser = _sc.inifact().createINIParser(f);
	
	//Module-Keys
	var keys = parser.getKeys("Language");
	while(keys && keys.hasMore()) {
		var key = keys.getNext();
		lang[key] = parser.getString("Language", key);
	}

	var keys = parser.getKeys("Head");
	while(keys && keys.hasMore()) {
		var key = keys.getNext();
		lang[key] = parser.getString("Head", key);
	}

	return lang;
}

//Sprache aktualisieren
hook("load", function() {
	var lgreplace = $(document.documentElement).html().match(/\$[a-zA-Z0-9_]+?\$/g);
	if(!lgreplace)
		return;
	
	var doccode = $(document.documentElement).html();
	for(var d in lgreplace) {
		var id = lgreplace[d];
		var str = __l[MODULE_LPRE+"_"+id.match(/\$([a-zA-Z0-9_]+?)\$/)[1]];
		if(!str)
			str = id;
		
		doccode = doccode.replace(RegExp(id.replace(/\$/g, "\\$")), str);		
	}
	
	$(document.documentElement).html(doccode);
});