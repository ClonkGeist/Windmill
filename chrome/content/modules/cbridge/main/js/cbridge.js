let maindeck = {}, deck;

window.addEventListener("load", function(){
	deck = addDeck($("#modules-wrapper")[0], 0);
	createNavigation();
});

//removes navigation entry of this module
function detachModule(moduleelm, module) {
	$('.modules-nav-entry[data-name="'+module.name+'"]').remove();
	deck.detachItem(deck.getModuleId(module.name));
}

//reload module navigation
function attachModule(module) {
	createNavigation();
}

function createNavigation() {
	//Iterate through modules
	let cbridgemodules = [];
	for(let mname in _mainwindow.MODULE_DEF_LIST) {
		let module = _mainwindow.MODULE_DEF_LIST[mname];

		if(module.cbridgemodule)
			cbridgemodules.push(module);
	}
	
	cbridgemodules.sort(function(a,b) {
		//Sort addons to the end
		if(a.isAddon && !b.isAddon)
			return 1;
		else if(!a.isAddon && b.isAddon)
			return -1;

		//if no navigationindex is specified, sort these modules to the end of the list
		if(isNaN(a.navigationindex) && !isNaN(b.navigationindex))
			return 1;
		else if(!isNaN(a.navigationindex) && isNaN(b.navigationindex))
			return -1;
		else if(isNaN(a.navigationindex) && isNaN(b.navigationindex))
			return 0;

		//otherwise, sort by index
		return a.navigationindex - b.navigationindex;
	});

	//Clear navigation
	$(".modules-nav-entry:not(.draft)").remove();

	//Create navigation items
	for(let i = 0, first = true; i < cbridgemodules.length; i++) {
		let module = cbridgemodules[i];
		if(getConfigData("Modules", module.name+"_State"))
			continue;

		let clone = $(".modules-nav-entry.draft").clone();
		clone.removeClass("draft");

		//Load navigation icon (search for navigationicon.svg in rootdir of module by default)
		let navicon = module.navigationicon || "navigationicon.svg";
		if(navicon.split(".").length > 1) {
			let fext = navicon.split(".").pop().toLowerCase();
			let supported_formats = ["png", "jpg", "jpeg", "svg"];

			//Check if the file format is supported
			if(supported_formats.indexOf(fext) != -1) {
				//Check if it exists
				OS.File.exists(module.dir+"/"+navicon).then(function(exists) {
					if(exists) {
						let elm, path = "chrome://windmill/content/"+module.relpath+"/"+navicon;
						elm = $("<image />");
						elm.attr("src", path);
						clone.find(".modules-nav-icon").html("").append(elm);
					}
					else if(navicon != "navigationicon.svg")
						log(`CBridge Module Error (${module.name}): The specified navigation icon was not found.`, "error");
				});
			}
			else
				log(`CBridge Module Error (${module.name}): Navigation icon format is not supported. (Supported formats: ${supported_formats})`, "error");
		}
		//Set name of module
		clone.attr("data-name", module.name)
		clone.find(".modules-nav-label").attr("value", Locale(module.navigationlabel || module.modulename, module.languageprefix));

		//Show module page if selected
		clone.click(function() {
			$(".modules-nav-entry.selected").removeClass("selected");
			$(this).addClass("selected");
			let index = deck.getModuleId(module.name);
			//If the module does not exist, create it
			if(index == -1)
				index = deck.add(getModule(createModule(module.name, deck.element), true), 0, false, false, true);
			togglePage(deck.id, index);
		});

		//If the module is not an addon, create it immediately
		if(!module.isAddon && deck.getModuleId(module.name) == -1)
			deck.add(getModule(createModule(module.name, deck.element), true), 0, false, false, true);

		//Add the entry to the navigation
		clone.appendTo($("#modules-nav"));
		if(first && !module.isAddon) {
			clone.click();
			first = false;
		}
	}
}

hook("addedToDeck", function(deckid, tabid, deck) {
	maindeck = { deckid, tabid };
});

function frameWindowTitle() {}