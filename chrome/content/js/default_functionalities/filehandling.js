/*-- Funktionen zum Filehandling/OS.File --*/

/*-- Rekursives kopieren/verschieben (fuer Ordner, kann aber auch auf Dateien angewandt werden ohne speziellen Effekt) --*/

function OSFileRecursive(sourcepath, destpath, callback, operation = "copy", noOverwrite = true, options = { checkIfFileExist: true }, __rec) {
	//TODO: Overwrite vorschlagen
	let task = Task.spawn(function*() {
		let f = new _sc.file(sourcepath), extra = "", file;
		let counter = 0;
		//Dateinamen aufspalten um passenden Alternativen Namen generieren zu koennen (Dabei Dateierweiterungen beruecksichtigen)
		let tpath = destpath.split("/");
		let tname = tpath.pop().split(".");
		tpath = tpath.join("/")+"/";
		let fext = "";
		if(tname.length > 1)
			fext = "."+tname.pop();

		tname = tname.join(".");
		let toperation = operation;
		if(f.isDirectory())
			toperation = "makeDir";

		while(true) {
			try {
				if(toperation == "makeDir" && options.checkIfFileExist && noOverwrite)
					if(yield OS.File.exists(tpath+tname+extra+fext))
						throw { becauseExists: true, becauseFileExists: true };

				if(toperation == "makeDir")
					yield OS.File.makeDir(tpath+tname+extra+fext, {ignoreExisting: !noOverwrite});
				else
					yield OS.File[toperation](sourcepath, tpath+tname+extra+fext, {noOverwrite});
			}
			catch(e) {
				if(!e.becauseExists)
					throw e;
				if(e.becauseFileExists && !noOverwrite)
					return {path: tpath+tname+extra+fext, file: f};
				if(noOverwrite == 2)
					throw e;
				if(counter > 99)
					throw "Could not create an alternative name";
				extra = " - " + (++counter);
				continue;
			}
			destpath = tpath+tname+extra+fext;
			break;
		}

		if(toperation == "makeDir") {
			let entries = f.directoryEntries;
			while(entries.hasMoreElements()) {
				let entry = entries.getNext().QueryInterface(Ci.nsIFile);

				if(callback)
					callback(entry.leafName, entry.path);

				yield OSFileRecursive(entry.path, destpath+"/"+entry.leafName, callback, operation, noOverwrite, options, true);
			}

			//Ggf. nochmal aufraeumen
			if(!__rec && operation == "move")
				yield OS.File.removeDir(sourcepath, {ignoreAbsent: true})
		}

		return {path: destpath, file: f};
	});
	task.then(null, function(reason) {
		log(reason);
	});
	
	return task;
}

/*-- Einzigartiger Dateinamen generieren --*/

function* UniqueFilename(path, throwError, maxAttempts = 100) {
	let splitpath = path.split("/"), filename = splitpath.pop(), splitted = filename.split(".");
	path = splitpath.join("/");
	let	fext = splitted.pop(), fname = splitted.join("."), counter = 0, checkname = fname;
	while(counter < maxAttempts && (yield OS.File.exists(path+"/"+checkname+"."+fext))) {
		counter++;
		checkname = fname+"-"+counter;
	}
	if(counter >= maxAttempts) {
		if(throwError)
			throw "Too many attempts.";
		return;
	}
	return path+"/"+checkname+"."+fext;
}

/*-- Im Filemanager oeffnen --*/

function openInFilemanager(path) {
	let filemanager
	if(OS_TARGET == "WINNT") {
		filemanager = _ws.pr(_sc.env.get("windir")+"\\explorer.exe");
		filemanager.create([path.replace(/\//g, "\\")]); 
	}

	return filemanager;
}

/*-- Shortcuts zu openclonk(.exe)/c4group(.exe) --*/

function getClonkExecutablePath(filename_only) {
	//Alternative Executabledatei
	var name = getConfigData("Global", "AlternativeApp");
	if(!name) {
		if(OS_TARGET == "WINNT")
			name = "openclonk.exe";
		else
			name = "openclonk";
	}

	if(filename_only)
		return name;
	return _sc.clonkpath() + "/" + name;
}

function getC4GroupPath() {
	if(OS_TARGET == "WINNT")
		name = "c4group.exe";
	else
		name = "c4group";

	let path = getConfigData("Global", "C4GroupPath"), file;
	if(!path || (!(file = _sc.file(path)).exists() || !file.isExecutable())) {
		path = "";
		for(var i = 0; i < _sc.clonkpathlength(); i++) {
			let file = _sc.file(_sc.clonkpath(i)+"/"+name);
			if(file.exists() && file.isExecutable()) {
				path = _sc.clonkpath(i)+"/"+name;
				setConfigData("Global", "C4GroupPath", path, true);
				break;
			}
		}
	}
	return path;
}

/*-- nsIFile Funktionen (nicht asynchron) --*/

/*-- Datei lesen --*/

function readFile(input, nohtml) {
	if(!input)
		return false;
	
	if(input.isFile)
		var f = input;
	else
		var f = _sc.file(input);
	
	if(!f.exists())
		return false;

	var	charset = "utf-8",
		fs = _sc.ifstream(f, 1, 0, false),
		cs = _sc.cistream(),
		result = {};
		cs.init(fs, charset, fs.available(), cs.DEFAULT_REPLACEMENT_CHARACTER);
	
	cs.readString(fs.available(), result);

	cs.close();
	fs.close();
	
	//HTML-Codes entschaerfen
	if(nohtml)
		result.value = result.value.replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
	
	return result.value;
}

/*-- Datei schreiben --*/

function writeFile(path, text, fCreateIfNonexistent) {
	if(path instanceof Ci.nsIFile)
		var f = path;
	else
		var f = new _sc.file(path);

	if(!f.exists() && fCreateIfNonexistent)
		f.create(f.NORMAL_FILE_TYPE, 0o777);
	
	var fstr = _sc.ofstream(f, _scc.PR_WRONLY|_scc.PR_TRUNCATE, 0x200);
	var cstr = _sc.costream();

	cstr.init(fstr, "utf-8", text.length, Ci.nsIConverterInputStream.DEFAULT_REPLACEMENT_CHARACTER);
	cstr.writeString(text);

	cstr.close();
	fstr.close();
}