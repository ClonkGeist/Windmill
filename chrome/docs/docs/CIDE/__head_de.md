<<<CIDE
# CIDE

Bei CIDE handelt es sich um den Entwicklermodus von Windmill (**C**lonk **I**ntegrated **D**evelopment **E**nvironment), dessen Name von einem früheren Projekt einer seperaten Entwicklungsumgebung abstammt. (Ähnlich zu **cBridge**, dem Spiel-/Communitymodus von Windmill)

## Erstellung eines Moduls für den Entwicklermodus

Module im Entwicklermodus von Windmill sollten zusätzlich zur ```default_module.js``` auch noch die ```default_cidemodule.js``` laden, welches die meisten Funktionalitäten übernimmt. Die untergeordneten Funktionen lassen sich nur aufrufen, wenn die ```default_cidemodule.js``` geladen wird.

Damit die Verknüpfung mit den Standardfunktionalitäten gut funktioniert, müssen im Script einige wenige Punkte noch beachtet werden:

Die einzelnen Tabs müssen in einem Array gemanaged werden, welches einzelne Objekte mit Informationen zu den Tabs enthalten. Wie diese Objekte an und für sich aufgebaut sind, ist hierbei nicht ganz wichtig, allerdings muss mindestens die Information zu einem Dateipfad hinterlegt werden.

Das Array, das die Tabs managed, muss über eine Funktion ```TabManager()``` zurückgegeben werden. Beispiel:

```javascript
let sessions = [];

function TabManager() { return sessions; }

/* ... Code in dem das Array sessions mit Objekten der einzelnen Tabs befüllt wird ... */
```

Grundsätzlich wird davon ausgegangen, dass der Pfad zur Datei des jeweiligen Tabs über die Eigenschaft ```path``` erhalten werden kann. Es ist allerdings auch möglich, einen anderen Namen für die Eigenschaft zu verwenden, der Name sollte jedoch in einer globalen Variable ```CM_PATHALIAS``` gespeichert werden.

Zur Speicherung, welcher Tab aktuell angezeigt wird, sollte die globale Variable ```CM_ACTIVEID``` verwendet werden. Alternativ kann auch eine Funktion ```alternativeActiveId()``` festgelegt werden, die die ID des aktuell angezeigten Tabs zurückgibt.

Um eine Datei mit einem bestimmten Modul zu öffnen, muss ein entsprechender Eintrag in der Funktion [openFileInDeck()](#) in der ```cide.js```-Datei (```chrome://windmill/content/modules/cide/main/js/cide.js```) hinterlegt werden, welcher die passende Funktion aufruft.

## Callbacks

Neben den notwendigen Deck-Callbacks [removeDeckItem()](#) und [showDeckItem()](#) (für weitere Informationen, siehe "class Deck"), gibt es auch noch einige speziellere Callbacks:

```fnpreview
saveTabContent: function(int index, ...);
```
Wird aufgerufen, wenn versucht wird das Tab zu speichern. Hier sollten die Speichervorgänge ablaufen.

* **index:**
  ID des Tabs der gespeichert werden soll.
* **...:**
  Weitere Parameter die an [saveTab()](#) weitergegeben wurden.

```fnpreview
checkIfTabIsUnsaved: bool function();
```
Gibt an, ob das Tab noch ungespeicherte Änderungen enthält. Falls mit [onFileChanged()](#), [onFileUnchanged()](#) und [saveTab()](#) gearbeitet wird, ist dies normalerweise nicht nötig.

```fnpreview
HideExternalProgramToolbarButton: bool function();
```
Gibt an, ob der Toolbar-Button zum Öffnen der Datei des Tabs in einem externen Programm versteckt werden soll.

```fnpreview
createCideToolbar: function();
```
Wird aufgerufen bevor das jeweilige Tab angezeigt wird und dient zur Erstellung der Toolbar des Moduls in der Hauptfensterleiste von Windmill. Die Funktion [clearCideToolbar()](#) sollte hierbei nicht aufgerufen werden, da dies bereits übernommen wird.

```fnpreview
GetExternalProgramId: string function(int id);
```
Gibt den Namenszusatz (```ExtProg_{Zusatz}```) des Konfigurationseintrages des Moduls für das jeweilige externe Programm das alternativ zum Modul verwendet werden sollte zurück.

* **id:**
  ID des betroffenen Tabs.

```fnpreview
rejectFrameRemoval: bool function();
```
Wird aufgerufen, wenn das Modul keine offenen Tabs mehr hat und daher nach Zeitverzögerung (falls es nicht weiter benutzt wird) entfernt wird. Um das zeitverzögerte Entfernen zu verhindern, sollte der Callback ```true``` zurückgeben.

```fnpreview
getTabData: object function(int tabid);
```
Wird aufgerufen, um Tabinformationen zur Wiederherstellung zu laden, zum Beispiel wenn der Tab von dem Hauptdeck in das Nebendeck verschoben wird. (Da hier ein neuer Frame erstellt wird) Das zurückgegebene Objekt sollte sämtliche Informationen zum Tab (inklusive Laufzeitinformationen) enthalten, die an den Callback [dropTabData()](#) zur Verarbeitung weitergegeben werden.

```fnpreview
dropTabData: function(object data, int index);
```
Wird in dem neuen Frame aufgerufen, wenn ein Tab wiederhergestellt werden soll.

* **data:**
  Wiederherstellungsinformationen zum Tab. Hierbei handelt es sich um ein Objekt, dass vorher von [getTabData()](#) zurückgegeben wurde.
* **index:**
  ID des neuen Tabs.