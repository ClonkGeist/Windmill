/*-- Configuration Wizard --*/

$(window).ready(function() {
	$("#resetcfgvar").click(function() {
		setConfigData("Global", "FirstStartDevTest", false);
		saveConfig();
		EventInfo("FirstStartDevTest resetted");
	});
	
	$(".filepath-button").click(function() {
		var fp = _sc.filepicker();
		var mode = Ci.nsIFilePicker.modeGetFolder;
		if($(this).parent().attr("data-filetype") == "executable") {
			mode = Ci.nsIFilePicker.modeOpen;
			fp.appendFilters(Ci.nsIFilePicker.filterApps);
		}
		fp.init(window, "", mode);

		var current_path = $(this).siblings(".filepath-show").text();
		if(current_path) {
			var dir = new _sc.file(current_path);
			if(dir.exists())
				fp.displayDirectory = dir;
		}

		var rv = fp.show();

		//Datei gefunden
		if(rv == Ci.nsIFilePicker.returnOK) {
			/** ALPHA HARDCODE **/
			switch($(this).parent().attr("id")) {
				case "OCPath":
					var clonkfile = "openclonk";
					if(OS_TARGET == "WINNT")
						clonkfile = "openclonk.exe";
					var f = _sc.file(fp.file.path+"/"+clonkfile);
					if(!f.exists()) {
						alert("openclonk.exe nicht gefunden.");
						$(this).trigger("click");
						return;
					}
					setConfigData("Global", "ClonkDirectories", [{ path: formatPath(fp.file.path), active: true }]);
					break;

				case "WSPath":
					setConfigData("CIDE", "WorkspaceParentDirectory", fp.file.path);
					break;
				
				case "GitPath":
					if((OS_TARGET == "WINNT" && fp.file.leafName != "git.exe") || (OS_TARGET != "WINNT" && fp.file.leafName != "git")) {
						alert((OS_TARGET=="WINNT"?"git.exe":"git")+" wurde nicht gefunden.");
						$(this).trigger("click");
						return;
					}
					setConfigData("ExtApplication", "ExtApplication_Git", fp.file.path);
					break;
			}
			/** ALPHA HARDCODE ENDE **/
			$(this).siblings(".filepath-show").text(fp.file.path);
		}
	});
	
	$("#finishconfig").click(function() {
		var clonkdir = JSON.parse(getConfigData("Global", "ClonkDirectories"));
		log(">> " + clonkdir + " ("+(typeof clonkdir)+")");
		if(!clonkdir || !clonkdir[0]) {
			alert("Kein Clonkverzeichnis angegeben.");
			return;
		}
		clonkdir = clonkdir[0].path;
		var ocfile = _sc.file(clonkdir+"/"+(OS_TARGET=="WINNT"?"openclonk.exe":"openclonk"));
		if(!ocfile.exists() || !ocfile.isExecutable()) {
			alert("openclonk.exe konnte nicht gefunden werden.");
			return;
		}
		var wspath = getConfigData("CIDE", "WorkspaceParentDirectory");
		if(!wspath) {
			alert("Kein Workspace Rootverzeichnis angegeben.");
			return;
		}
		if(!_sc.file(wspath).exists() || !_sc.file(wspath).isDirectory()) {
			alert("Ungueltiges Workspace Rootverzeichnis angegeben.");
			return;
		}
		setConfigData("Global", "FirstStartDevTest", false);
		saveConfig();
		_mainwindow.outerWidth = 800;
		_mainwindow.outerHeight = 600;
		_mainwindow.location.reload();
	});
});

function showPage(id) {
	$(".wizardpage").removeClass("active")
	$(".wizardpage#"+id).addClass("active");
}