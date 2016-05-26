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
			switch($(this).parent().attr("id")) {
				case "set-openclonk-path":
					var clonkfile = "openclonk";
					if(OS_TARGET == "WINNT")
						clonkfile = "openclonk.exe";
					var f = _sc.file(fp.file.path+"/"+clonkfile);
					if(!f.exists()) {
						alert(Locale("$err_ocexecutable_not_found$", "SG"));
						$(this).trigger("click");
						return;
					}
					let groupname = "c4group";
					if(OS_TARGET == "WINNT")
						groupname = "c4group.exe";
					let c4group = _sc.file(fp.file.path+"/"+groupname);
					if(c4group.exists()) {
						$("#set-c4group-path").find(".filepath-show").text(c4group.path);
						setConfigData("Global", "C4GroupPath", c4group.path);
					}
					setConfigData("Global", "ClonkDirectories", [{ path: formatPath(fp.file.path), active: true }]);
					break;

				case "set-workspace-path":
					setConfigData("CIDE", "WorkspaceParentDirectory", fp.file.path);
					break;
				
				case "set-c4group-path":
					if((OS_TARGET == "WINNT" && fp.file.leafName != "c4group.exe") || (OS_TARGET != "WINNT" && fp.file.leafName != "c4group")) {
						alert(Locale("$err_group_not_found$", "CEX"));
						$(this).trigger("click");
						return;
					}
					setConfigData("Global", "C4GroupPath", fp.file.path);
					break;

				case "set-git-path":
					if((OS_TARGET == "WINNT" && fp.file.leafName != "git.exe") || (OS_TARGET != "WINNT" && fp.file.leafName != "git")) {
						alert(Locale("$err_git_not_found$"));
						$(this).trigger("click");
						return;
					}
					setConfigData("ExtApplication", "ExtApplication_Git", fp.file.path);
					break;

				case "set-ogrexmlconverter-path":
					if((OS_TARGET == "WINNT" && fp.file.leafName != "OgreXMLConverter.exe") || (OS_TARGET != "WINNT" && fp.file.leafName != "OgreXMLConverter")) {
						alert(Locale("$err_ogrexmlcnv_not_found$"));
						$(this).trigger("click");
						return;
					}
					setConfigData("ExtApplication", "ExtApplication_OgreXMLConverter", fp.file.path);
					break;
			}

			$(this).siblings(".filepath-show").text(fp.file.path);
		}
	});

	$("#finishconfig-beta").click(function() {
		if($("#scenario-loading-polyfill").is(":checked"))
			setConfigData("CIDE", "RejectScenarioBackup", false);
		setConfigData("Global", "FirstStartDevTest", false);
		saveConfig();
		_mainwindow.location.reload();
	});
	if(!getConfigData("Global", "DevMode"))
		$("#resetcfgvar").hide();
	detectWebGLSupport();
	$("#webgl-test").find(".button").click(detectWebGLSupport);
});

function detectWebGLSupport() {
	//WebGL Test
	let canvas = $("<canvas></canvas>")[0];
	let gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
    // Report the result.
    if(gl && gl instanceof WebGLRenderingContext)
		$("#webgl-test").addClass("successful").find(".message").text(Locale("$WebGLTestSuccessful$"));
    else
		$("#webgl-test").addClass("failed").find(".message").text(Locale("$WebGLTestFailed$"));

	$(canvas).remove();
	return true;
}

function showPage(id) {
	function err(msg, pfx) {
		$(".wizardpage.active .infobox.error").addClass("visible").html("<p>"+Locale(msg, pfx)+"</p>");
		return;
	}
	switch($(".wizardpage.active").attr("id")) {
		case "page-clonkdirectory":
			//Clonkverzeichnis ueberpruefen
			let clonkdir = getConfigData("Global", "ClonkDirectories");
			if(!clonkdir || !clonkdir[0])
				return err("$err_no_clonkpath_set$");

			//Auf openclonk.exe ueberpruefen
			clonkdir = clonkdir[0].path;
			let ocfile = _sc.file(clonkdir+"/"+(OS_TARGET=="WINNT"?"openclonk.exe":"openclonk"));
			if(!ocfile.exists() || !ocfile.isExecutable())
				return err(Locale("$err_ocexecutable_not_found$", "SG"));
			
			//c4group ueberpruefen
			let c4group = _sc.file(getConfigData("Global", "C4GroupPath"));
			if(!c4group.exists() || !c4group.isExecutable())
				return err(Locale("$err_group_not_found$", "CEX"));
			break;
		
		case "page-workenvironments-workspaces":
			let wspath = getConfigData("CIDE", "WorkspaceParentDirectory");
			if(!wspath)
				return err("$err_no_rot_dir_set$");
			if(!_sc.file(wspath).exists() || !_sc.file(wspath).isDirectory())
				return err("$err_invalid_root_dir$");
			break;
	}
	
	$(".wizardpage").removeClass("active")
	$(".wizardpage#"+id).addClass("active");
}