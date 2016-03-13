/*-- Externe Applikationen --*/

/*
 * Hiermit ist es moeglich, externe Applikationen anzugeben die geladen werden sollen.
 */

var application_data = [];

function loadExternalApplicationDefs(path) {
	return Task.spawn(function*() {
		let iterator = new OS.File.DirectoryIterator(path);
		while(true) {
			let entry = yield iterator.next();
			if(entry.isDir) //Unterverzeichnisse untersuchen
				yield loadExternalApplicationDefs(entry.path);
			else if(entry.name.search(/^appdef_.+\.json$/i) != -1) {//Applikationdefinition einlesen
				let extapp = yield OS.File.read(entry.path, {encoding: "utf-8"});
				registerNewApplication(extapp);
			}
		}
	}).then(null, function(reason) {
		iterator.close();
		if(!reason != StopIteration)
			throw reason;
	});
}

function registerNewApplication(application_obj) {
	application_obj = JSON.parse(application_obj);
	if(!application_obj.identifier)
		throw "No application identifier defined";

	application_data[application_obj.identifier] = new ExtApplication(application_obj);
	return true;
}

function getAppByID(identifier) { return application_data[identifier]; }

class ExtApplication {
	constructor(data) {
		this.identifier = data.identifier;
		this.cfgidentifier = "ExtApplication_"+data.cfgidentifier;
		this.icon = data.icon;
		this.name = data.name;
		this.data = data;
		log("Registered new external application: " + this.name);
	}

	isAvailable() {
		if(!this.path)
			return false;
		var f = new _sc.file(this.path);
		if(!f.exists() || !f.isExecutable())
			return false;

		return true;
	}

	showError() {
		var dlg = new WDialog("$DlgExtApplicationError$", -1, { modal: true, css: { "width": "400px" }, btnright: [{ preset: "accept" }] });
		dlg.setContent(`<description>$DlgExtApplicationErrorDesc$</description>
						<hbox style="margin: 50px; border: 1px solid #777; border-radius: 5px; padding: 5px;">$(this.name}</hbox>
						<description>${this.data.howto_info}</description>`);
		dlg.show();
		dlg = 0;
	}

	create(...pars) {
		var f = _sc.file(this.path);
		if(!f.exists())
			return warn("The application " + this.name + " does not exist.");
		if(!f.isExecutable())
			return warn("The application " + this.name + " is not executable.");

		var process = new _ws.pr(f);
		process.create(...pars);
	}

	get path() { return getConfigData("ExtApplication", this.cfgidentifier); }
	set path(npath) { setConfigData("ExtApplication", this.cfgidentifier, npath); log("saved"); }
	get needed_file() {
		if(OS_TARGET == "WINNT")
			return this.data.needed_file_win;
		else
			return this.data_needed_file_linux;
	}
}

registerInheritableObject("getAppByID");


