<<<class Deck

# class Deck

**extends** WindmillObject

```fnpreview
constructor Deck(HTMLElement/XULElement/jQueryObject container, [opt] HTMLElement/XULElement/jQueryObject navEl, [opt] string lang, int id);
```
Erzeugt eine ```Deck```-Instanz mit den angegebenen Werten.

* **container:**
  Container-Element, dass das Deck enthalten soll.
* **navEl:**
  Container-Element, dass die Navigation enthalten soll.
* **lang:**
  Sprache in der das Modul geschrieben worden ist. **Gültige Werte:** "html" und "xul". ("xul" ist der Standardwert.) **Hinweis:** Obwohl hier der Wert "html" erlaubt ist, werden die Decks aktuell nur unter XUL unterstützt.
* **id:**
  Eindeutige ID des Decks.

```fnpreview
void updateScroller();
```
Aktualisert die Scrollbalken-Anzeige der Navigation.

```fnpreview
void updateNavigation();
```
Aktualisiert die Navigation auf die aktuelle Scrollposition.

```fnpreview
bool checkIfLabelIsUsed(string label, [opt] int ignoreID);
```
Schaut, ob das angegebene Label bereits schon von einem Tab verwendet wird. (Bspw. zur Vermeidung doppelter gleicher Labels.)

* **label:**
  Label nach dem gesucht werden soll.
* **ignoreID:**
  Falls angegeben, ID des Tabs welches von der Suche ignoriert werden soll.

```fnpreview
int getModuleId(string name, [opt] int index);
```
Gibt zurück, an welcher Stelle im Deck sich das angegebene Modul befindet. Falls das angegebene Modul im Deck nicht gefunden worden ist, wird stattdessen -1 zurückgegeben.

* **name:**
  Name des Moduls nach dem gesucht werden soll.
* **index:**
  Index des gesuchten Moduls unter den Treffern. (Falls das gleiche Modul häufiger als einmal im Deck vorkommt)

```fnpreview
bool canTogglePage([opt] int newPageId);
```
Prüft, ob das Tab des Decks (auf die neue Seite) gewechselt werden kann. Hierbei wird, falls es sich bei der aktuellen Seite um ein Tab mit einem Iframe handelt, der Callback ```rejectDeckPageLeave``` aufgerufen. Für weitere Informationen, siehe [Callbacks](#Callbacks).

* **newPageId:**
  ID des Tabs, auf dessen Seite versucht wird zu wechseln.

```fnpreview
void desc(string text, [opt] string/int prefix);
```
Setzt die Beschreibung des Decks falls kein Tab ausgewählt wurde.

* **text:**
  Neuer Inhalt der Beschreibung.
* **prefix:**
  Lokalisierungspräfix für die Beschreibung. Lokalisierungspräfix des aktuellen Moduls, falls nicht angegeben. Falls ein leerer String angegeben wird ("") oder -1 angegeben wird, werden Übersetzungen des Hauptfensters geladen.

```fnpreview
int add(HTMLElement/XULElement el, [opt] string label, [opt] bool fDeligate, [opt] bool fCloseable, [opt] bool fPreventShow, [opt] object options);
```
Fügt dem Deck ein Element hinzu.

* **el:**
  Neues Element dass dem Deck hinzugefügt werden soll.
* **label:**
  Schriftzug für den zugehörigen Tab in der Navigation.
* **fDeligate:**
  Falls ```true```, so werden Calls bei Anzeigen und bei Entfernen des jeweiligen Tabs an das entsprechende Element weitergeleitet. Dies ist nur gültig, wenn es sich bei dem Element um ein ```iframe```-Element handelt, ansonsten wird ein Fehler geworfen. Siehe [Callbacks](#Callbacks) für weitere Informationen.
* **fCloseable:**
  Falls ```true```, so wird dem Tab in der Navigation ein Knopf zum Schließen hinzugefügt. 
* **fPreventShow:**
  Falls ```true```, so wird der Tab nicht sofort angezeigt nachdem dieser dem Deck hinzugefügt worden ist.
* **options:**
  Weitere Optionen.
  * **icon:**
    Pfad zu einem Icon für den zugehörigen Tab in der Navigation.
  * **filepath:**
    Pfad zu der Datei das von dem jeweiligen Tab bearbeitet wird. Wird hauptsächlich für den Entwicklermodus gebraucht um korrekte Ergebnisse für den ```_sc.workpath```-Shortcut zu liefern.
  * **file:**
    Alternativ zu *filepath*: ```nsIFile```-Instanz der Datei das von dem jeweiligen Tab bearbeitet wird. Wird hauptsächlich für den Entwicklermodus gebraucht um korrekte Ergebnisse für den ```_sc.workpath```-Shortcut zu liefern.
  * **label:**
    Schriftzug für den zugehörigen Tab in der Navigation. Ist gleichwertig mit dem label-Parameter und sollte nicht gesetzt zu werden.

```fnpreview
void addButton(string label, int id, [opt] bool fCloseable);
```
Erstellt einen Tab in der Navigation.

* **label:**
  Schriftzug des Tabs.
* **id:**
  ID des Tabs welches bei Klick angezeigt werden soll.
* **fCloseable:**
  Falls ```true```, so wird dem Tab in der Navigation ein Knopf zum Schließen hinzugefügt. 

```fnpreview
void detachItem(int itemId);
```
Entkoppelt den angegebenen Tab von dem Deck. Hierbei ist zu beachten, dass das Element **nicht** gelöscht wird, sondern nur nicht mehr vom Deck erfasst wird.

```fnpreview
bool isEmpty();
```
Gibt an, ob das Deck keine offenen Tabs hat.

```fnpreview
void show(int itemId, bool noFocus);
```
Zeigt den angegebenen Tab an.

* **itemId:**
  ID des Tabs der angezeigt werden soll.
* **noFocus:**
  Falls ```true```, so wird der Fokus nicht verändert beim Wechseln der Tabs.

```fnpreview
jQueryObject getButton(int index);
```
Gibt den Navigations-Tab mit dem angegebenen Index zurück.

```fnpreview
void changeTabStatus(int status, int index);
```
Ändert den Status des Tabs mit dem angegebenen Index auf den angegebenen Status. Folgende Werte werden für ```status``` akzeptiert:

* **0:** Normalzustand.
* **1:** Der Tab wird so markiert, dass dieser über ungespeicherte Änderungen verfügt.

```fnpreview
void showDesc();
```
Zeigt die Beschreibung des Decks an.

```fnpreview
void addSpacer(bool fSpacer);
```
Fügt einen Spacer in die Navigationsleiste ein. (Nur für XUL-Module.)

## Attribute

| Attribute	| Typ | Beschreibung |
|-----------|-----|--------------|
| **container** | HTMLElement/XULElement/jQueryObject | Container-Element, welches das Deck enthält. |
| **buttonContainer** | HTMLElement/XULElement/jQueryObject | Container-Element, welches die Navigation enthält. |
| **buttons** | Array<HTMLElement/XULElement> | Array, dass die einzelnen Tabs in der Navigationsleiste enthält. |
| **lang** | string | Sprache in der das Modul geschrieben ist. **Gültige Werte:** "html" und "xul". ("xul" ist der Standardwert.) **Hinweis:** Obwohl hier der Wert "html" erlaubt ist, werden die Decks aktuell nur unter XUL unterstützt. |
| **id** | int | ID des Decks. |
| **previd** | int | ID des letzten Tabs das angezeigt worden ist. |
| **selectedIndex** | int | Index des aktuell ausgewählten Elements. (Verschiedene Tabs können auf das gleiche Element verweisen.) |
| **selectedId** | int | ID des aktuell ausgewählten Tabs. |
| **nextId** | int | ID des nächsten, neu erstellten Tabs. |
| **items** | Array<HTMLElement/XULElement> | Array der Elemente, die angezeigt werden sollen. Index im Array entspricht der zugehörigen Tab-ID. |
| **deligated** | Array<bool> | Array welches angibt, ob Calls an das jeweilige Iframe weitergeleitet werden sollen (falls vorhanden). Index im Array entspricht der zugehörigen Tab-ID. |
| **options** | Array<options> | Array was die zugehörigen Optionen der einzelnen Tabs enthält. Für weitere Informationen, siehe [add()](#). Index im Array entspricht der zugehörigen Tab-ID. |
| **element** | HTMLElement/XULElement | Deck-Element. |

## Callbacks

```fnpreview
showDeckItem: function(int itemId);
```
Wird in einem Iframe aufgerufen, falls ein Tab das dem jeweiligen Iframe zugewiesen wurde angezeigt wird.

* **itemId:**
  ID des Tabs das angezeigt wird.

```fnpreview
removeDeckItem: function(int itemId);
```
Wird in einem Iframe aufgerufen, falls ein Tab das dem jeweiligen Iframe zugewiesen wurde entfernt wird.

* **itemId:**
  ID des Tabs das entfernt wird.

```fnpreview
frameWindowTitle: function();
```
Wird beim Anzeigen eines Tabs im jeweiligen Iframe aufgerufen. Als Rückgabewert wird ein String erwartet, der in der Titelleiste von Windmill vor " - Windmill" angezeigt wird. Wird nichts oder ```-1``` zurückgegeben, so wird nur "Windmill" in der Titelleiste angezeigt.

```fnpreview
rejectDeckPageLeave: function(Deck deck, int newPageId);
```
Wird in einem Iframe aufgerufen, bevor ein Wechsel des Tabs stattfindet. Falls der Callback ```true``` zurückgibt, so wird ein Wechsel des Tabs verhindert.

* **deck:**
  Das Deckobjekt in dem sich die Tabs befinden.
* **newPageId:**
  ID des neuen Tabs, auf den versucht wird zu wechseln.

## Events

```fnpreview
addItem: function(Deck deck, int id);
```
Wird aufgerufen, falls ein neues Element dem Deck hinzugefügt worden ist.

* **deck:**
  Das jeweilige Deckobjekt.
* **id:**
  ID des Tabs das neu hinzugefügt worden ist.

```fnpreview
btnCreated: function(Deck deck, HTMLElement/XULElement button, int id);
```
Wird aufgerufen, falls ein neuer Tab in die Navigationsleiste des Decks hinzugefügt wurde.

* **deck:**
  Das jeweilige Deckobjekt.
* **button:**
  Das HTML/XUL-Element des Navigations-Tab-Elements.
* **id:**
  ID des zugehörigen Tabs.

```fnpreview
itemDetached: function(Deck deck, int id, HTMLElement/XULElement elm);
```
Wird aufgerufen, falls ein Element aus dem Deck entfernt wurde.

* **deck:**
  Das jeweilige Deckobjekt.
* **id:**
  ID des Tabs das entkoppelt worden ist.
* **elm:**
  Element das entkoppelt worden ist. (Das Element ist zum Zeitpunkt des Calls nicht mehr im Deckobjekt hinterlegt)

```fnpreview
preShowItem: function(Deck deck, int id);
```
Wird kurz bevor das jeweilige Tab angezeigt wird aufgerufen.

* **deck:**
  Das jeweilige Deckobjekt.
* **id:**
  ID des Tabs das angezeigt werden soll.

```fnpreview
showItem: function(Deck deck, int id);
```
Wird aufgerufen wenn das jeweilige Tab angezeigt wird.

* **deck:**
  Das jeweilige Deckobjekt.
* **id:**
  ID des Tabs das angezeigt wird.