<<<createTreeElement

# createTreeElement

```fnpreview
int createTreeElement(HTMLULElement/jQueryObject tree, [opt] string label, [opt] bool container, [opt] bool open, [opt] string img, [opt] string filename, [opt] string special, [opt] object options);
```
Fügt einen neuen Eintrag hinzu und gibt dessen Nummer zurück. Einträge lassen sich über diese Nummer direkt selektieren, da die IDs der Einträge folgendes Format haben: ```treeelm-{Nummer}``` (HTMLLIElement), ```treecnt-{Nummer}``` (HTMLULElement).

* **tree:**
  Container dem der Eintrag hinzugefügt werden soll.
* **label:**
  Schriftzug des Eintrages.
* **container:**
  Falls ```true```, so wird der Eintrag mit einem zugehörigen HTMLULElement-Container-Element erstellt.
* **open:**
  Falls ```true```, so wird der Eintrag (falls es sich um ein Container-Element handelt) nach Erstellung direkt geöffnet.
* **img:**
  Pfad zum Icon des Eintrages.
* **filename:**
  Dateiname der mit dem Eintrag verbundenen Datei. Dieser wird nicht angezeigt, wird jedoch für interne Prüfungen (bspw. zur Umbenennung eines Eintrages) verwendet.
* **special:**
  Zusätzlicher Klassenname für Listeneintrag und zugehörigen Container. Falls angegeben, so lässt sich Drag & Drop mit dem Eintrag nicht verwenden und es lassen sich Einträge auch nicht auswählen, außer dies wird manuell über die weiteren Optionen wieder aktiviert. Unterstützte Klassennamen:
  * **treeelm-container-empty:**
    Zeigt an, dass das Container-Element leer ist.
  * **treeitem-loading:**
    Zeigt an, dass der Inhalt des Container-Elements geladen wird.
  * **workenvironment:**
    Zeigt an, dass es sich bei dem Eintrag um ein Arbeitsverzeichnis handelt. Hierbei kommt ein anderes Drag & Drop-Verhalten zum Einsatz als es bei normalen Einträgen der Fall wäre. (Arbeitsverzeichnisse lassen sich untereinander sortieren.)
* **options:**
  Weitere Optionen.
  * **isDraggable:**
    Falls special gesetzt ist: Wenn ```true```, so wird Drag & Drop für den Eintrag aktiviert.
  * **classes:**
    Weitere Klassen, die nur auf den Listeneintrag (HTMLLIElement) und ohne zusätzliche Änderungen angewendet werden.
  * **additional_data:**
    Ein Objekt mit weiteren Attributen für den Listeneintrag.
  * **index:**
    Index des neuen Listeneintrag der von der Sortierung berücksichtigt wird. Falls -1, so wird nur die normale Sortierung angewandt. (Einträge mit Index -1 erscheinen immer unter Einträgen mit gesetztem Index.)
  * **noSelection:**
    Falls ```true```, so lässt sich der Eintrag nicht auswählen.