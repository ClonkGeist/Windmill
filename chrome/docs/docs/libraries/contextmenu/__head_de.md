<<< Kontextmenüs

# Kontextmenüs

Da die Mozilla-eigenen ```menu```-Elemente zum Erstellen von Kontextmenüs sich nur auf XUL beschränken und um Konsistenz zwischen den Modulen zu wahren, verfügt Windmill über ein eigenes System zum Erstellen von Kontextmenüs.

Kontextmenüs können hierbei im Skript definiert und an Objekte gebunden werden und lassen sich dann per Rechtsklick öffnen.

```javascript
var ctx_references = new ContextMenu(0, 0, MODULE_LPRE);
ctx_references.addEntry("$Notifications$", 0, 0, (new ContextMenu(0, [
	["$AddHostNotification$", 0, function(target) {
		var ref = getReferenceById(parseInt($(target).attr("id").substr(4)));
		if(!ref.Client)
			return;

		AddNotificationCondition(NTYPE_HOSTNAME, ref.Client[0].Name, 0, ref.GameId);
	}],
	["$AddScenarioNotification$", 0, function(target) {
		var ref = getReferenceById(parseInt($(target).attr("id").substr(4)));
		if(!ref.Resource)
			return;

		AddNotificationCondition(NTYPE_RESOURCE, ref.Resource[0].Filename, 0, ref.GameId);
	}],
	"seperator",
	["$IgnoreHostNotification$", 0, function(target) {
		var ref = getReferenceById(parseInt($(target).attr("id").substr(4)));
		if(!ref.Client)
			return;

		AddNotificationCondition(NTYPE_HOSTNAME, ref.Client[0].Name, true, ref.GameId);
	}],
	["$IgnoreScenarioNotification$", 0, function(target) {
		var ref = getReferenceById(parseInt($(target).attr("id").substr(4)));
		if(!ref.Resource)
			return;

		AddNotificationCondition(NTYPE_RESOURCE, ref.Resource[0].Filename, true, ref.GameId);
	}]
], MODULE_LPRE)));
```
Eine gekürzte Fassung des Kontextmenüs der Masterserveranzeige um Benachrichtigungen für bestimmte Spiele anzuzeigen. Hierbei wird ein Kontextmenüeintrag "Notifications" mit einem untergeordneten Kontextmenü erstellt.

## Sichtbarkeitssteuerung

Um die Sichtbarkeit bestimmter Kontextmenüeinträge zu steuern, kann dem Kontextmenü unter der weiteren Optionen ein "fnCheckVisiblity"-Callback hinzugefügt werden. Hierbei können den einzelne Kontextmenüeinträgen über den weiteren Optionen ein identifier hinzugefügt werden, der an diesen Sichtbarkeitscallback weitergegeben wird, womit sich die einzelnen Kontextmenüeinträge unterscheiden lassen.

Der Rückgabewert des Sichtbarkeitscallbacks ist hierbei ausschlaggebend dafür, wie der Kontextmenüeintrag angezeigt wird:

* 0: Der Kontextmenüeintrag wird normal angezeigt.
* 1: Der Kontextmenüeintrag wird *deaktiviert*. Dabei wird der Text leicht ausgegraut und der Eintrag reagiert nicht auf Klicks.
* 2: Der Kontextmenüeintrag ist unsichtbar und wird nicht im Kontextmenü angezeigt.

Ein gutes Beispiel hierfür ist das Kontextmenü des Explorers im Entwicklermodus. Da das Kontextmenü sehr komplex ist, wurden im folgenden Bespiel die Funktionalitäten (und das Exportieruntermenü) ausgeschnitten.

```javascript
var treeContextMenu = new ContextMenu(0, 0, MODULE_LPRE, { fnCheckVisibility: treeHideContextItems });
var submenu_new = new ContextMenu(0, [ /* ... */ ], MODULE_LPRE, { allowIcons: true });

treeContextMenu.addEntry("$ctxnew$", 0, 0, submenu_new, {identifier: "ctxNew"});
//Duplizieren
treeContextMenu.addEntry("$ctxduplicate$", 0, function*() { /* ... */ }, 0, { identifier: 'ctxDuplicate' });
//Kopieren
treeContextMenu.addEntry("$ctxcopy$", 0, function() { copyTreeEntry(getCurrentTreeSelection()); }, 0, { identifier: 'ctxCopy' });
//Einfügen
treeContextMenu.addEntry("$ctxpaste$", 0, function() { pasteFile(getCurrentTreeSelection()); }, 0, { identifier: 'ctxPaste' });
//Ausschneiden
treeContextMenu.addEntry("$ctxcut$", 0, function() {}, 0, { identifier: 'ctxCut' });
//Umbenennen
treeContextMenu.addEntry("$ctxrename$", 0, function() { renameTreeObj($(getCurrentTreeSelection())); }, 0, { identifier: 'ctxRename' });
//Löschen
treeContextMenu.addEntry("$ctxdelete$", 0, function() { removeTreeEntry($(getCurrentTreeSelection())); }, 0, { identifier: 'ctxDelete' });
//Aktualisieren
treeContextMenu.addEntry("$ctxreload$", 0, function() {/* ... */}, 0, { identifier: 'ctxReload' });

treeContextMenu.addSeperator();

//Packen
treeContextMenu.addEntry("$ctxpack$", 0, function() { /* ... */ }, 0, { identifier: 'ctxPack' });
//Zerlegen
treeContextMenu.addEntry("$ctxexplode$", 0, function() { /* ... */ }, 0, { identifier: 'ctxExplode' });

treeContextMenu.addSeperator();

//Git
treeContextMenu.addEntry("$ctxgit$", 0, 0, gitContextMenu(), { identifier: "ctxGit"});

//Öffnen
treeContextMenu.addEntry("$ctxopen$", 0, function() { handleTreeEntry($(getCurrentTreeSelection())); }, 0, { identifier: 'ctxOpen' });
//Im Vollbild öffnen
treeContextMenu.addEntry("$ctxopenfull$", 0, function() { /* ... */ }, 0, { identifier: 'ctxOpenFull' });
//Mit Kommandozeilenparameter öffnen
treeContextMenu.addEntry("$ctxopenpars$", 0, function() { /* ... */ }, 0, { identifier: 'ctxOpenPars' });
```

Hierzu der zugehörige Sichtbarkeitscallback:

```javascript
function treeHideContextItems(by_obj, identifier) {
	var pElm = $(by_obj), tagName = $(by_obj).prop("tagName");

	var fext, directory;
	if(tagName == "li") {
		var filename = $(pElm).attr("filename");
		var t = filename.split("."), fext = t[t.length-1];

		if(t.length == 1)
			directory = true;
	}

	//Copy, Cut, Rename, Delete, Pack, Explode und Open werden deaktiviert, wenn ein Containerobjekt ausgewählt wird.
	if((tagName == "vbox" || tagName == "html:ul") && ["ctxCopy","ctxCut","ctxRename","ctxDelete","ctxPack","ctxExplode","ctxOpen"].indexOf(identifier) >= 0)
		return 1;

	let workenv = getWorkEnvironmentByPath(_sc.workpath(by_obj));
	switch(identifier) {
		//Einfügen nur sichtbar bei gültigem Clipboard-Inhalt
		case "ctxPaste":
			if((["ocd", "ocg", "ocf"].indexOf(fext) || directory)
				&& Services.clipboard.hasDataMatchingFlavors(["application/x-moz-file"], 1, Services.clipboard.kGlobalClipboard))
				return 0;
			return 2;

		//Im Vollbild öffnen bzw. mit Parametern öffnen nur bei Szenarien anzeigen (ansonsten unsichtbar)
		case "ctxOpenPars":
		case "ctxOpenFull":
			if(fext == "ocs")
				return 0;
			else
				return 2;

		//"Öffnen" wird für .ocd, .ocg und .ocf-Dateien deaktiviert
		case "ctxOpen":
			if(["ocd","ocg","ocf"].indexOf(fext) >= 0)
				return 1;
			break;

		case "ctxPack":
		case "ctxReload":
		case "ctxExplode":
			//Nur für Groupdateien. (Und Reload noch für Ordner)
			if(OCGRP_FILEEXTENSIONS.indexOf(fext) < 0 && !directory)
				return 1;

			//Packen/Zerlegen nicht für Ordner
			if(identifier != "ctxReload" && directory)
				return 1;

			break;

		//Git-Kontextmenü
		case "ctxGit":
			//Nur anzeigen, wenn es sich bei der jeweiligen Arbeitsumgebung um ein Git-Repository handelt
			if(!workenv.repository)
				return 2;

			//Falls git nicht verfügbar ist, deaktivieren
			if(!getAppByID("git").isAvailable())
				return 1;
	}

	//Ansonsten alles normal anzeigen
	return 0;
}
```