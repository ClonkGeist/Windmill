<<<class _ContextMenu

# class _ContextMenu

```fnpreview
constructor _ContextMenu([opt] function onShowing, [opt] Array<Array<any>/string> entryarray, [opt] langpre, [opt] object options);
constructor ContextMenu([opt] function onShowing, [opt] Array<Array<any>/string> entryarray, [opt] langpre, [opt] object options);
```
Erzeugt eine ```_ContextMenu```-Instanz mit den angegebenen Werten.

* **onShowing:**
  Callback der aufgerufen wird, wenn das Menü geöffnet wird. Siehe [Callbacks](#Callbacks) für weitere Informationen.
* **entryarray:**
  Shorthand um Kontextmenüeinträge zu hinzuzufügen. Hierbei kann einfach ein Array übergeben werden, welches Arrays mit den Parametern der  [addEntry](#)-Funktion enthält, die 1:1 an diese Funktion weitergegeben werden um Kontextmenüeinträge zu erzeugen. Alternativ kann auch der String "seperator" übergeben werden, um eine Trennlinie an der angegebenen Stelle einzufügen. Die Sortierung des Arrays entspricht der Sortierung des Kontextmenüs, d.h. dass der erste Kontextmenüeintrag im Array auch tatsächlich der erste Eintrag des Kontextmenüs ist.
  Für ein genaues Beispiel, siehe [Kontextmenü](#).
* **langpre:**
  Allgemeiner Lokalisierungspräfix für die Kontextmenüeinträge. (Kontextmenüeinträge können jedoch für sich selbst einen eigenen Lokalisierungspräfix einstellen) Falls nichts angegeben wird, gilt der Lokalisierungspräfix des aktuellen Moduls. Falls ein leerer String ("") oder ```-1``` übergeben wird, werden die Übersetzungen vom Hauptfenster geladen.
* **options:**
  Weitere Optionen.
  * **allowIcons:**
    Falls ```true```, so werden Icons im Kontextmenü angezeigt.
  * **fnCheckVisibility:**
    Callback zur Sichtbarkeitsbestimmung der Kontextmenüeinträge. Für weitere Informationen, siehe [Callbacks](#Callbacks).
  * **post_opening_callback:**
    Callback der aufgerufen wird, nachdem das Kontextmenü geöffnet worden ist. Für weitere Informationen, siehe [Callbacks](#Callbacks).

```fnpreview
any getOption(string identifier);
```
Gibt einen Wert der weiteren Optionen zurück.

```fnpreview
void addEntry(string label, int id, function/Generator clickHandler, _ContextMenu subMenu, object options);
```
Fügt einen Kontextmenüeintrag mit den angegebenen Werten hinzu.

* **label:**
  Anzeigetext des Kontextmenüeintrages.
* **id:**
  ID des Kontextmenüeintrages. (Dieser Wert wird aktuell nicht genutzt, stattdessen kommt ein globaler Zähler zum Einsatz.)
* **clickHandler:**
  Gibt den Click-Handler an, der aufgerufen wird wenn der Kontextmenüeintrag geklickt wird. Siehe Callbacks im Eintrag [class _ContextMenuEntry](#) für weitere Informationen.
* **subMenu:**
  Kontextmenü das geöffnet wird, wenn über diesen Kontextmenüeintrag gehovert wird.
* **options:**
  Weitere Optionen. Für genauere Angaben, siehe [class _ContextMenuEntry](#).

```fnpreview
void clearEntries();
```
Entfernt alle Einträge der ```Kontextmenü```-Instanz. (Nicht das angezeigte Kontextmenü)

```fnpreview
bool addSeperator();
```
Fügt eine Trennlinie ganz unten in das Kontextmenü ein.

```fnpreview
_ContextMenuEntry getEntryById(int id);
```
Gibt den Kontextmenüeintrag des Kontextmenüs mit der angegebenen ID zurück.

```fnpreview
_ContextMenuEntry getEntryByIndex(int index);
```
Gibt den Kontextmenüeintrag des Kontextmenüs an der angegebenen Position zurück. Es ist dabei darauf aufzupassen, dass auch Trennlinien eine gesamte Position im Kontextmenü ausmachen, diese also miteinberechnet werden müssten.

```fnpreview
void bindToObj(HTMLElement/XULElement/jQueryObject obj, bool forced);
```
Bindet einen Eventhandler an das angegebene Objekt, welches das Kontextmenü bei Rechtsklick öffnet.

* **obj:**
  Objekt an das der Eventhandler gebunden werden soll.
* **forced:**
  Falls ```true```, so gibt der Eventhandler ```false``` zurück was das Standardverhalten für das Eventhandling deaktiviert.

```fnpreview
void showMenu(int x, int y, HTMLElement/XULElement/jQueryObject obj_by, int screenX, int screenY, [opt] HTMLElement/XULElement/jQueryObject menuitem, [opt] _ContextMenuEntry menuitemobj);
```
Zeigt das Kontextmenü an.

* **x:**
  X-Position relativ zur oberen linken Ecke des Moduls, an der das Kontextmenü angezeigt wird. Dieser Wert wird nur für HTML-Module unterstützt.
* **y:**
  Y-Position relativ zur oberen linken Ecke des Moduls, an der das Kontextmenü angezeigt wird. Dieser Wert wird nur für HTML-Module unterstützt.
* **obj_by:**
  Ursprüngliches Zielobjekt des Kontextmenüs. (Das Element, auf das das Kontextmenü geöffnet worden ist.)
* **screenX:**
  X-Bildschirmkoordinate, an der das Kontextmenü angezeigt wird. Dieser Wert wird nur für XUL-Module unterstützt.
* **screenY:**
  Y-Bildschirmkoordinate, an der das Kontextmenü angezeigt wird. Dieser Wert wird nur für XUL-Module unterstützt.
* **menuitem:**
  Nur nötig, falls es sich um ein Untermenü handelt. Das Element des Kontextmenüeintrages, dem dieses Untermenü gehört.
* **menuitemobj:**
  Nur nötig, falls es sich um ein Untermenü handelt. Die ```_ContextMenuEntry```-Instanz, dem dieses Untermenü gehört.

```fnpreview
void hideMenu();
```
Schließt das Kontextmenü einschließlich aller untergeordneten Kontextmenüs.

```fnpreview
void lock();
```
Sperrt das gesamte Kontextmenü.

```fnpreview
void unlock();
```
Entsperrt das gesamte Kontextmenü.

## Attribute

| Attribute	| Typ | Beschreibung |
|-----------|-----|--------------|
| **entries** | Array<_ContextMenuEntry> | Array, das alle Kontextmenüeinträge in Anzeigereihenfolge enthält. |
| **showing** | function | Callback (onShowing) der aufgerufen wird, wenn das Menü geöffnet wird. Siehe [Callbacks](#Callbacks) für weitere Informationen. |
| **langpre** | string/int | Allgemeiner Lokalisierungspräfix für die Kontextmenüeinträge. (Kontextmenüeinträge können jedoch für sich selbst einen eigenen Lokalisierungspräfix einstellen) Falls nichts angegeben wird, gilt der Lokalisierungspräfix des aktuellen Moduls. Falls ein leerer String ("") oder ```-1``` übergeben wird, werden die Übersetzungen vom Hauptfenster geladen. |
| **topMenu** | _ContextMenu | Übergeordnetes Kontextmenü. |
| **opened_by** | HTMLElement/XULElement/jQueryObject | Ursprüngliches Zielobjekt des Kontextmenüs. (Das Element, auf das das Kontextmenü geöffnet worden ist.) |
| **element** | HTMLElement/XULElement | Hauptelement des Kontextmenüs. |
| **body** | XULElement | Wrapperelement des Kontextmenüs. Nur für XUL-Module. (Die ```element```-Eigenschaft entspricht hierbei dem darüberliegenden ```panel```-Element, welches die Kontextmenüeinträge nicht auf erster Ebene darunter enthält.) |
| **locked** | bool | Gibt an ob das Menü gesperrt ist. |
| **direction** | int | Richtung in die das Kontextmenü geöffnet wurde. Dieser Wert wird zur Berechnung der Positionen neuer Untermenüs verwendet und wird automatisch gesetzt. |
| **options** | object | Weitere Optionen. Siehe Konstruktor für weitere Informationen. |

## Callbacks

```fnpreview
this.options.fnCheckVisibility: function(HTMLElement/XULElement/jQueryObject target, any identifier);
```
Wird bei Hinzufügen von Kontextmenüeinträgen aufgerufen und dient zur Steuerung der Sichtbarkeit dieser. Zur Identifizierung wird ein Identifier mitgeliefert, der sich für die Kontextmenüeinträge festlegen lässt. Als Rückgabewert der Funktion wird ein Integer erwartet, der angibt, ob das Element normal angezeigt werden soll (0), deaktiviert/nicht klickbar geschaltet werden soll (1, der Eintrag wird auch ausgegraut angezeigt) oder ob das Element komplett unsichtbar geschalten werden soll. (2)

* **target:**
  Ursprüngliches Zielobjekt des Kontextmenüs. (Das Element, auf das das Kontextmenü geöffnet worden ist.)
* **identifier:**
  Identifier des Kontextmenüeintrages.

```fnpreview
onShowing: function(HTMLElement/XULElement/jQueryObject obj_by);
```
Wird kurz vor der Erstellung des Menüs aufgerufen.

* **obj_by:**
  Ursprüngliches Zielobjekt des Kontextmenüs. (Das Element, auf das das Kontextmenü geöffnet worden ist.)

```fnpreview
this.options.post_opening_callback: function(HTMLElement/XULElement/jQueryObject obj_by);
```
Wird kurz nachdem das Menü erstellt worden ist, aufgerufen.

* **obj_by:**
  Ursprüngliches Zielobjekt des Kontextmenüs. (Das Element, auf das das Kontextmenü geöffnet worden ist.)