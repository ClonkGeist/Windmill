<<< Explorer

# Explorer

Die Explorer-Library bietet für XUL-Module die Möglichkeit, eine Explorervorschau zu generieren. Sie wird für den Explorer im Entwicklermodus als auch im Spielmodus verwendet und ist gegenseitig von der Tree-Library (tree.js) abhängig.

Um eine Explorervorschau zu erhalten, ist ein HTMLULElement (```<html:ul>``` bzw. ```<ul xmlns="http://www.w3.org/1999/xhtml">```) mit der ID ```maintree``` nötig, welches alle Listenelemente enthält. Dieses HTMLULElement sollte sich in einem XUL-Element mit der ID "filecontainer" befinden. Damit die Suche aktiviert wird, muss ein ```textbox```-Element mit der ID ```searchinput``` verfügbar sein.

## Callbacks

```fnpreview
initializeDirectory: function();
```
**Erwarteter Callback.** Wird immer aufgerufen, wenn das Hauptverzeichnis des Explorers neu geladen werden soll. (Nach dem Laden des Moduls, nach dem Drücken von Ctrl+F5 etc.)

```fnpreview
explorerLoadWorkEnvironments: function();
```
**Erwarteter Callback.** Wird beim Laden des Moduls aufgerufen und dient zur Vorbereitung.

```fnpreview
initializeContextMenu: function();
```
Wird beim Laden des Moduls aufgerufen und soll dem Erstellen des Kontextmenüs dienen.

```fnpreview
onExplorerRefresh: function();
```
Wird aufgerufen, wenn der Benutzer F5 drückt. (Ohne dabei die Steuerungstaste zu drücken.)

```fnpreview
getTreeEntryData: object function(nsIFile entry, string fext);
```
**Erwarteter Callback.** Wird beim Hinzufügen eines Eintrags aufgerufen, um zusätzliche Informationen für den Eintrag hinzuzufügen. Als Rückgabewert kann ein Objekt mit folgenden Eigenschaften zurückgegeben werden:

* **title:**
  Der anzuzeigende Titel des Eintrages.
* **icon:**
  Das Icon das neben dem Eintrag angezeigt werden soll.
* **special:**
  Zusätzlicher Wert der an den ```special```-Parameter von [createTreeElement()](#) weitergegeben wird.
* **index:**
  Zusätzlicher Sortierungsindex des Eintrages.
* **additional_data**
  Weitere Attribute für das zu erstellende Listenelement.

Parameter:
* **entry:**
  ```nsIFile```-Instanz der Datei dessen Eintrag erstellt werden soll.
* **fext:**
  Dateiendung der Datei dessen Eintrag erstellt werden soll.

```fnpreview
noContainer: bool function(string fext);
```
**Erwarteter Callback.** Falls der Callback ```true``` zurückgibt, so werden Dateien mit der angegebenen Dateiendung nicht als Container-Elemente angezeigt.

```fnpreview
hideFileExtension: bool function(string fext);
```
**Erwarteter Callback.** Falls der Callback ```true``` zurückgibt, so werden Dateien mit der angegebenen Dateiendung nicht angezeigt.

## Anzeigeinformationen für Dateien

Um Informationen zur Anzeige bestimmter Dateiendungen festzulegen, wird ein Objekt unter der globalen Variable ```specialData``` erwartet, welches Objekte mit Anzeigeinformationen enthält, die über die Priorität erreichbar sind.

Diese Unterobjekte können folgende Eigenschaften erhalten:

* **ext:**
  Name der Dateiendung. Dieser Wert muss gesetzt werden.
* **img:**
  Pfad zur Bilddatei, die als Icon des Eintrags genutzt wird.

Beispiel:

```javascript
var specialData = {
	0: {ext: "ocp", img: "chrome://windmill/content/img/explorer/icon-fileext-ocp.png"},
	1: {ext: "ocf", img: "chrome://windmill/content/img/explorer/icon-fileext-ocf.png"},
	2: {ext: "ocs", img: "chrome://windmill/content/img/explorer/icon-fileext-ocs.png"},
	3: {ext: "ocg", img: "chrome://windmill/content/img/explorer/icon-fileext-ocg.png"},
	4: {ext: "ocm", img: "chrome://windmill/content/img/explorer/icon-fileext-ocm.png"},

	10: {ext: "txt", img: "chrome://windmill/content/img/explorer/icon-fileext-txt.png"},
	20: {ext: "png", img: "chrome://windmill/content/img/explorer/icon-fileext-png.png"},
	21: {ext: "bmp", img: "chrome://windmill/content/img/explorer/icon-fileext-bmp.png"},
	22: {ext: "jpg", img: "chrome://windmill/content/img/explorer/icon-fileext-jpg.png"},

	30: {ext: "mesh", img: "chrome://windmill/content/img/explorer/icon-fileext-mesh.png"},
	31: {ext: "skeleton", img: "chrome://windmill/content/img/explorer/icon-fileext-skeleton.png"},
	32: {ext: "material", img: "chrome://windmill/content/img/explorer/icon-fileext-material.png"},

	40: {ext: "c", img: "chrome://windmill/content/img/explorer/icon-fileext-c.png"},
	41: {ext: "ocd", img: "chrome://windmill/content/img/explorer/icon-fileext-ocd.png"},
	42: {ext: "wav", img: "chrome://windmill/content/img/explorer/icon-fileext-wav.png"},
	43: {ext: "ogg", img: "chrome://windmill/content/img/explorer/icon-fileext-ogg.png"},
	44: {ext: "mid", img: "chrome://windmill/content/img/explorer/icon-fileext-mid.png"},

	50: {ext: "ocu", img: "chrome://windmill/content/img/explorer/icon-fileext-ocu.png"},
	51: {ext: "oci", img: "chrome://windmill/content/img/explorer/icon-fileext-oci.png"}
}
```
Die Anzeigeinformationen für den Explorer im Entwicklermodus.

