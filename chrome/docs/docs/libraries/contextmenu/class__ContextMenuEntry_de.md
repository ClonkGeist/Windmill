<<<class _ContextMenuEntry

# class _ContextMenuEntry

```fnpreview
constructor _ContextMenuEntry(_ContextMenu topMenu, string label, int id, function/Generator clickHandler, [opt] _ContextMenu subMenu, [opt] string/int langpre, [opt] object options);
constructor ContextMenuEntry(_ContextMenu topMenu, string label, int id, function/Generator clickHandler, [opt] _ContextMenu subMenu, [opt] string/int langpre, [opt] object options);
```
Erzeugt eine ```_ContextMenuEntry```-Instanz mit den angegebenen Werten.

* **topMenu**:
  Eltern-Kontextmenü.
* **label:**
  Label des Kontextmenüeintrages.
* **id:**
  ID des Kontextmenüs. (Wird jedoch nicht genutzt, stattdessen wird ein globaler Zähler ```CTX_MENUITEM_ID_COUNTER``` verwendet.)
* **clickHandler:**
  Funktion die ausgeführt wird, wenn der Kontextmenüeintrag geklickt wird.
* **subMenu:**
  Eine ```_ContextMenu```-Instanz, die angezeigt wird falls über den Kontextmenüeintrag gehovert wird.
* **langpre:**
  Lokalisierungspräfix für das Label des Kontextmenüeintrages. Lokalisierungspräfix des aktuellen Moduls, falls nicht angegeben. Falls ein leerer String angegeben wird ("") oder ```-1``` angegeben wird, werden Übersetzungen des Hauptfensters geladen.
* **options:**
  Weitere Optionen:
  * **identifier:**
    Ein beliebiger Identifier über den sich der Kontextmenüeintrag identifizieren lässt. Dieser wird zur Bestimmung der Sichtbarkeit des Kontextmenüeintrages verwendet.
  * **iconsrc:**
    Pfad zu einer Bilddatei die als Icon des Kontextmenüeintrages dient.

```fnpreview
void addEntryToObject(HTMLElement/XULElement/jQueryObject obj, HTMLElement/XULElement/jQueryObject target);
```
Fügt einen Menüeintrag in das angegebene Kontextmenü hinzu.

* **obj:**
  Kontextmenü-Element, em der Menüeintrag hinzugefügt wird.
* **target:**
  Ursprüngliches Zielobjekt des Kontextmenüs. (Das Element, auf das das Kontextmenü geöffnet worden ist.)

```fnpreview
void hideMenu();
```
Versteckt (löscht) alle Untermenüs.

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
| **label** | string | Im Kontextmenüeintrag angezeigter lokalisierter Text. |
| **id**	| int | Eindeutige Nummer des Kontextmenüeintrages. |
| **clickHandler** | function/Generator | Gibt den Click-Handler an, der aufgerufen wird wenn der Kontextmenüeintrag geklickt wird. Siehe Callbacks für weitere Informationen. |
| **subMenu** | _ContextMenu | Gibt, falls vorhanden, das darunterliegende Kontextmenü an, das sich öffnet wenn über dem Kontextmenüeintrag gehovert wird. |
| **topMenu** | _ContextMenu | Gibt das darüberliegende Kontextmenü (in dem sich der Kontextmenüeintrag befindet) an. |
| **disabled** | bool | Gibt an ob der Kontextmenüeintrag anklickbar ist. (Wird dennoch angezeigt) |
| **visible** | bool | Gibt an ob der Kontextmenüeintrag sichtbar ist. |
| **element** | HTMLElement/XULElement | Element des Kontextmenüeintrages. |
| **options** | object | Weitere Optionen. (Siehe Konstruktor für weitere Informationen) |

## Callbacks

```
this.clickHandler: function(HTMLElement/XULElement/jQueryObject target, HTMLElement/XULElement event_target, _ContextMenuEntry menuentry);
this.clickHandler: function*(HTMLElement/XULElement/jQueryObject target, HTMLElement/XULElement event_target, _ContextMenuEntry menuentry);
```
Wird aufgerufen, wenn der Kontextmenüeintrag geklickt wird. Statt einer normalen Funktion kann auch ein Generator angegeben werden. Ist dies der Fall, so passiert der Aufruf innerhalb eines Tasks, der das Kontextmenü solange sperrt (allerdings weiterhin anzeigt) bis der Task abgeschlossen worden ist.

* **target:**
  Ursprüngliches Zielobjekt des Kontextmenüs. (Das Element, auf das das Kontextmenü geöffnet worden ist.)
* **event_target:**
  Zielobjekt des Klick-Events.
* **menuentry:**
  ```_ContextMenuEntry```-Instanz des Kontextmenüeintrages auf das geklickt worden ist.