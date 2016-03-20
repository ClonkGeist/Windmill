var __l = {};

function initializeLanguage() {
	var langname = getConfigData("Global", "Language"), langs = [];
	
	return Task.spawn(function*() {
		while(langs.indexOf(langname) == -1) {
			let langarray = yield readLanguageInfo(_sc.chpath + "/content/locale/"+langname+"/language.ini"), key = "";
			for(key in langarray) {
				if(!__l[key])
					__l[key] = langarray[key];
			}

			langs.push(langname);
			if(langname != "en-US")
				if(langarray.FallbackLang)
					langname = langarray.FallbackLang;
		}
	});
}

function readLanguageInfo(path) {
	return Task.spawn(function*() {
		let text = yield OS.File.read(path, {encoding: "utf-8"}).then(null,  function(reason) {
			if(reason == OS.File.Error)
				alert("The Language file does not exist");
		});
		let lang = {}, langcontent = parseINI2(text), elm;
		while(elm = langcontent.next().value)
			if(typeof elm != "string")
				lang[elm.key] = elm.val;

		return lang;
	});
}