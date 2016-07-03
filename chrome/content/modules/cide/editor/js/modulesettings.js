document.addEventListener("DOMContentLoaded", function() {
	let completers = getConfigData("Scripteditor", "Completers");
	$("#completerSelection").parent().on("command", function(e) {
		setConfigData("Scripteditor", "Completers", $(this)[0].selectedItem.value);
		if(parseInt($(this)[0].selectedItem.value) != completers)
			parent.changeNeedsRestart = true;
	});
	$("#completerSelection").parent()[0].selectedItem = $("#completerSelection").find('menuitem[value="'+completers+'"]')[0];

	let insertEditorTheme = (entry) => {
		// cut it out
		var name = entry.leafName.substr(6, entry.leafName.length - 9);

		$('#editor-theme-list').append('<listitem label="'+name+'" class="list-acethemes" />');
	}

	function loadEditorThemes(path) {
		//ace-Ordner
		var f = _sc.file(path);
		if(!f.exists() || !f.isDirectory())
			return;

		//Verzeichnisse einzelnd untersuchen
		var entries = f.directoryEntries;

		while(entries.hasMoreElements()) {
			var entry = entries.getNext().QueryInterface(Ci.nsIFile);
			if(entry.leafName.split("-")[0] == "theme") //überprüfen ob die Datei mit "theme-" beginnt
				insertEditorTheme(entry);
		}
	}

	$("#apply-ace-theme").click(function() {
		var themename = $(".list-acethemes:selected").prop("label");
		var modules = getModulesByName("scripteditor");

		for(var i = 0; i < modules.length; i++) {
			if(!modules[i] || !modules[i].contentWindow)
				continue;

			modules[i].contentWindow.applyTheme(themename);
		}

		setConfigData("CIDE", "EditorTheme", themename);
		saveConfig();

		return true;
	});
	
	loadEditorThemes(_sc.chpath + "/content/modules/cide/editor/js/ace");
});