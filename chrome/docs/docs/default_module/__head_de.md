<<<Standardfunktionalitäten

# Standardfunktionalitäten

Die hier hinterlegten Funktionen sind Standardfunktionalitäten auf die die Module grundsätzlich zugreifen können, wenn sie die ```default_module.js``` geladen haben. (Welche unbedingt geladen werden sollte)

Neben den in den Unterkategorien sowie weiter unten auf dieser Seite aufgelisteten Funktionen (und Konstanten), werden unter anderem auch die JavaScript Module zu OS.File.jsm und Task.jsm geladen, diese müssen also nicht nochmal seperat geladen werden.

## Konstanten und Attribute

| Name | Typ | Beschreibung |
|------|-----|--------------|
| OCGRP_FILEEXTENSIONS | Array<string> | Ein Array, das alle (gängigen) Dateierweiterungen der C4Group-Dateien für OpenClonk enthält. |
| _mainwindow | Window | ```Window```-Instanz des Hauptfensters. |
| OS_TARGET | string | String der den Namen des Betriebssystems enthält. (Ausgabe des ```uname -s```-Befehls) Für weitere Informationen, siehe https://developer.mozilla.org/en-US/docs/Mozilla/Developer_guide/Build_Instructions/OS_TARGET. |
| MODULE_ID | int | Eindeutige Nummer/ID der Modulinstanz. |
| MODULE_NAME | string | Name des Moduls. |
| MODULE_PATH | string | Chrome-Pfad zum Modul. |
| MODULE_DEF | object | ```_module```-Instanz dass Informationen zum Modul enthält. |
| MODULE_LANG | string | Gibt an, in welcher Sprache das Modul geschrieben ist. (Entspricht der Dateiendung der Datei die angezeigt wird.) |
| MODULE_LPRE | string | Lokalisierungspräfix des Moduls. |
| Ci | object | Shorthand für ```Components.interfaces``` |
| Cc | object | Shorthand für ```Components.classes``` |
| Cm | object | Shorthand für ```Components.manager``` |
| Cu | object | Shorthand für ```Components.utils``` |
| Services | object | Services-Objekt. Für weitere Informationen, siehe https://developer.mozilla.org/en-US/docs/Mozilla/JavaScript_code_modules/Services.jsm. |

## Funktionen

```fnpreview
void log(string str, [opt] bool hidden, [opt] string type);
```
Gibt den angegebenen String in der Log aus.

* **str:**
  String der gelogt werden soll.
* **hidden:**
  Falls ```true```, so wird das gelogte in der integrierten Konsole standardmäßig ausgeblendet. Diese Funktion könnte bspw. in try-catch-Blöcken nützlich sein, da hier nicht immer ein richtiger Fehler vorliegen muss.
* **type:**
  Kann zusätzliche Anzeigeinformationen für den Logeintrag enthalten, die als CSS-Klasse für den Logeintrag gesetzt werden. Momentan unterstüzte Klassen:
  * **error:**
    Sollte benutzt werden, um einen Fehler (bei dem es sich nicht um einen versteckten Fehler handelt) anzuzeigen.
  * **sass:**
    Sollte benutzt werden, wenn Informationen vom SASS-Observer gelogt werden.

```fnpreview
void logToGitConsole(string str);
```
Gibt den angegebenen String in der integrierten Git-Konsole aus.

```fnpreview
void registerInheritableObject(string key);
```
Objekte die im globalen Scope des Moduls unter dem angegebenen Key zu finden sind, können hierüber an untergeordnete Module weitergegeben werden.

```fnpreview
bool warn(string str, [opt] string prefix);
```
Gibt die angegebene Meldung als lokalisierte Dialog-Fehlermeldung aus.

* **str:**
  String dessen Inhalte ggf. übersetzt werden sollen.
* **prefix:**
  Lokalisierungspräfix dessen Lokalisierungen untersucht werden sollen. Falls nicht angegeben, wird der jeweilige Lokalisierungspräfix des aktuellen Moduls verwendet, der auch in der Variable ```MODULE_LPRE``` enthalten ist.
  Integer werden hierbei nicht wirklich akzeptiert (bzw. werden als String geparst), jedoch gibt es den speziellen Wert **-1**, bei dem Lokalisierungen aus dem Hauptfenster (das über kein wirkliches Lokalisierungspräfix verfügt) geladen werden. (Alternativ kann ein leerer String "" angegeben werden.)

```fnpreview
function*<jQueryObject> void nextElementInDOM([opt] HTMLElement/XULElement/jQueryObject start, [opt] container, [opt] indent);
```
Der Generator gibt mit jedem Schritt ausgehend vom angegebenen Startpunkt das jeweils nächste Element im DOM (bzw. in dem Abschnitt des DOM des angegebenen Containers) weiter. Hierbei werden alle Ebenen berücksichtigt und Elemente wie iframes oder unsichtbare Elemente (sowie Elemente mit ```tabindex="-1"```) und deren untergeordneten Elemente werden rausgefiltert. Der Generator endet, wenn das Ende des angegebenen Containers erreicht wurde.

* **start:**
  Startpunkt im angegebenen Container. Falls kein Startpunkt angegeben wird, wird vom Anfang des Containers ausgegangen.
* **container:**
  Container, der durchsucht werden soll. Falls keiner angegeben wird, so wird bei XUL-Modulen ```document.documentElement``` verwendet und bei HTML-Modulen das ```body```-Element.
* **indent:**
  Interner Parameter für Debugging, das aktuell jedoch keine Funktionen enthält.

```fnpreview
function*<jQueryObject> void prevElementInDOM([opt] HTMLElement/XULElement/jQueryObject start, [opt] container, [opt] indent);
```
Der Generator gibt mit jedem Schritt ausgehend vom angegebenen Startpunkt das jeweils vorherige Element im DOM (bzw. in dem Abschnitt des DOM des angegebenen Containers) weiter. Hierbei werden alle Ebenen berücksichtigt und Elemente wie iframes oder unsichtbare Elemente (sowie Elemente mit ```tabindex="-1"```) und deren untergeordneten Elemente werden rausgefiltert. Der Generator endet, wenn der Anfang des angegebenen Containers erreicht wurde.

* **start:**
  Startpunkt im angegebenen Container. Falls kein Startpunkt angegeben wird, wird vom Ende des Containers ausgegangen.
* **container:**
  Container, der durchsucht werden soll. Falls keiner angegeben wird, so wird bei XUL-Modulen ```document.documentElement``` verwendet und bei HTML-Modulen das ```body```-Element.
* **indent:**
  Interner Parameter für Debugging, das aktuell jedoch keine Funktionen enthält.

```fnpreview
void frameUpdateWindmillTitle();
```
Aktualisiert den Titel des Windmill-Hauptfensters.

```fnpreview
void removeSubFrames();
```
Löscht rekursiv alle iframes die dem Modul untergeordnet sind.