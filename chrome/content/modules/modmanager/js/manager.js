
var modules = [];

window.addEventListener("load", function(){
	var mlist = _mainwindow.MODULE_LIST;
	for(var entry in mlist) {
		if(!mlist[entry] || $(mlist[entry]).attr("name") == "modmanager")
			continue;

		onModuleAdded(getModuleDef($(mlist[entry]).attr("name")), mlist[entry]);
	}

	var CONFIG = getConfig();
	for(var sect in CONFIG) {
		onConfigChange(sect, "", "");
		for(var key in CONFIG[sect]) {
			onConfigChange(sect, key, CONFIG[sect][key]);
		}
	}

	onConfigSave();

	setInterval(function() {
		$(".removedModule").remove();

		for(var entry in modules) {
			if(!modules[entry][1].contentWindow) {
				$(modules[entry][1]).remove();
				$("row#"+modules[entry][2]).addClass("removedModule");
			}
		}
	}, 2000);

	$("#lblbtn-save").click(function() {
		saveConfig();
	});
});

function onConfigChange(sect, key, val) {
	if(val.constructor.name == "ConfigEntry")
		val = val.tempvalue;
	if(!$("#config-"+sect+"-"+key)[0]) {
		$("#config-overview").append(`<row id="config-${sect}-${key}">
				<label class="cfg-sect" value="${sect}" />
				<label class="cfg-key" value="${key}" />
				<hbox>
					<label class="cfg-val" value='${val}' />
				</hbox>
			</row>`);

		var obj = $("#config-"+sect+"-"+key);
		if(!key && !val)
			$(obj).addClass("configSection");
		if(val === false || val === true) {
			$(obj).addClass("boolean-val");
			$(obj).find(".cfg-val").click(function() {
				setConfigData(sect, key, !getConfigData(sect, key));
			});
		}
		else {
			$(obj).find(".cfg-val").click(function() {
				$(this).after('<textbox class="cfg-val-textbox"/>');
				$(this).css("display", "none");
				$(this).parent().find(".cfg-val-textbox").val(getConfigData(sect, key)).focus();
				$(".cfg-val-textbox").blur(function() {
					setConfigData(sect, key, $(this).val());
					$(this).parent().find(".cfg-val").css("display", "block");
					$(this).remove();
				});
			});
		}

		$(obj).addClass("configChanged");
	}
	else {
		var obj = $("#config-"+sect+"-"+key);
		$(obj).find(".cfg-val").val(val);

		$(obj).addClass("configChanged");
	}

	return true;
}

function onConfigSave() {
	$(".configChanged").each(function() {
		var sect = $(this).attr("id").match(/config-(.+)?-.*/i)[1];
		var key = $(this).attr("id").match(/config-.+?-(.*)/i)[1];

		if(key) {
			if(_mainwindow.CONFIG[sect][key].value)
				if($(this).find(".cfg-val").val() == (_mainwindow.CONFIG[sect][key].value.toString()))
					$(this).removeClass("configChanged");
		}
		else
			$(this).removeClass("configChanged");
	});

	return true;
}

function onModuleAdded(def, modframe) {
	modules.push([def, modframe, modframe.id]);

	$("#module-overview").append('<row id="'+modframe.id+'" class="newModule"><label value="'+def.modulename+'"/></row>');
	$("#"+modframe.id).append('<label value="'+modframe.id+'"/>');
	$("#"+modframe.id).append('<hbox id="opt-'+modframe.id+'"></hbox>');

	$('<box class="btn-reload icon-16 icon-spinner11"/>')
		.appendTo($("#opt-"+modframe.id)).click(function() {
			var pars = "?";
			if(typeof modframe.contentWindow.getReloadPars == "function")
				pars += modframe.contentWindow.getReloadPars();

			modframe.contentWindow.location.replace(modframe.contentWindow.location.pathname+pars);
		});
	$('<box class="btn-inspect icon-16 icon-search" />')
		.appendTo($("#opt-"+modframe.id)).click(function() {
			modframe.contentWindow.ACTIVATE_INSPECTOR = !modframe.contentWindow.ACTIVATE_INSPECTOR;
			showDOMTree(modframe);
		});

	setTimeout(function() {
		$("row#"+modframe.id).removeClass("newModule");
	}, 2500);
	
	execHook("onModuleAdd", def, modframe, modframe.id);
}

function showDOMTree(modframe) {	
	var doc = modframe.contentDocument.documentElement, domcont = $("#dom-container");
	
	$(doc).html().replace(/<\/?[^>]+(>|$)/g, function(match) {
		var el = $('<description class="inspect-line"></description>');
		el.text(match);
		el.appendTo(domcont);
	});
}

function frameWindowTitle() {}