var __l = {};

function initializeLanguage() {
	var langname = getConfigData("Global", "Language"), langs = [];
	
	return Task.spawn(function*() {
		//recursive loading of language files
		function* loadLanguageFiles(path) {
			let iterator = new OS.File.DirectoryIterator(path);
			let entries = yield iterator.nextBatch();
			for(let entry of entries) {
				if(entry.isDir)
					yield* loadLanguageFiles(entry.path);
				else if(entry.name != "langcfg.ini" && /\.ini$/.test(entry.name)) {
					let content = parseINIArray(yield OS.File.read(entry.path, {encoding: "utf-8"}));
					if(!content.Head) {
						log(`Localization Loading Error: No language header for ${entry.path.replace(_sc.chpath, "chrome://windmill")}.`, "error");
						continue;
					}
					let prefix = content.Head.Prefix || "";
					let subnamespace = "";
					if(content.Head.SubNamespace)
						subnamespace = content.Head.SubNamespace;
					if(content.Language) {
						for(let key in content.Language)
							if(!__l[prefix+"_"+subnamespace+key])
								__l[prefix+"_"+subnamespace+key] = content.Language[key];
					}
				}
			}
		}

		while(langs.indexOf(langname) == -1) {
			let cfg = parseINIArray(yield OS.File.read(_sc.chpath+"/content/locale/"+langname+"/langcfg.ini", {encoding: "utf-8"}));
			if(!cfg.Head)
				throw new Error(`An error occured while trying to read the language configuration for ${langname}.`);

			yield* loadLanguageFiles(_sc.chpath+"/content/locale/"+langname);
			langs.push(langname);
			if(langname != "en-US" && cfg.Head.FallbackLang && langs.indexOf(cfg.Head.FallbackLang) == -1)
				langname = cfg.Head.FallbackLang;
		}
	});
}