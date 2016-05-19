<<< Tree

# Tree

Die Tree-Library bietet für XUL-Module die Möglichkeit, Einträge in Baumstruktur anzuzeigen und zu managen. Sie wird für den Explorer im Entwicklermodus als auch im Spielmodus verwendet und ist gegenseitig von der Explorer-Library (explorer.js) abhängig.



## Callbacks

```fnpreview
noDragDropItem: bool function(string label);
```
Wird aufgerufen, wenn versucht wird ein neues Element mit dem angegebenen Label zu erstellen. Falls der Callback ```true``` zurückgibt, so lässt sich das neu erstellte Element nicht mit Drag & Drop verschieben.

```fnpreview
onTreeFileDragDrop: function(HTMLLIElement container, nsIFile file);
```
Wird aufgerufen, wenn eine Datei von außerhalb von Windmill über Drag & Drop in den Windmillexplorer verschoben wurde. Das Verschieben der Datei wird übernommen, jedoch wird hierbei kein neuer Eintrag erstellt. (Dies soll der Callback ggf. übernehmen)

```fnpreview
onTreeDeselect: function(HTMLElement/XULElement/jQueryObject obj);
```
Wird aufgerufen, wenn ein Element die Auswahl verliert.

```fnpreview
onTreeSelect: function(HTMLElement/XULElement/jQueryObject obj);
```
Wird aufgerufen, wenn ein Element ausgewählt wird.

```fnpreview
onTreeExpand: function(jQueryObject container, jQueryObject listitem);
```
Wird aufgerufen, kurz bevor ein Container-Eintrag geöffnet wird. (Das Laden neuer Inhalte wird hierbei nicht übernommen.)

* **container:**
  Container (HTLMULElement) des zu öffnenden Eintrages.
* **listitem:**
  Listeneintrag (HTMLLIElement) des zu öffnenden Eintrages.

```fnpreview
onTreeCollapse: function(jQueryObject container, jQueryObject listitem);
```
Wird aufgerufen, kurz bevor ein Container-Eintrag geschlossen wird.

* **container:**
  Container (HTLMULElement) des zu schließenden Eintrages.
* **listitem:**
  Listeneintrag (HTMLLIElement) des zu schließenden Eintrages.

```fnpreview
getOCStartArguments: Array<string>/int function(string filepath);
```
**Erwarteter Callback.** Wird aufgerufen, wenn versucht wird ein Szenario (\*.ocs-Datei) zu starten. Erwartet wird ein Array mit Strings der Kommandozeilenparametern oder alternativ "-1" um einen Start von OpenClonk zu verhindern.

```fnpreview
parent.openFileInDeck: function(nsIFile file, bool open_sidedeck);
```
Wird im übergeordneten Iframe aufgerufen, wenn versucht wird, eine Datei (die keine \*.ocs-Datei ist) zu öffnen.

* **file:**
  Datei die versucht wird, zu öffnen.
* **open_sidedeck:**
  Gibt an, ob die Datei im Nebendeck geöffnet werden soll. (Shortcut über Strg+Enter, Entwicklermodus)

## Events

```fnpreview
treeObjAdded: function(HTLMLIElement/jQueryObject obj);
```
Wird aufgerufen, wenn ein neues Element dem Baum hinzugefügt worden ist.