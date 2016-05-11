<<<class _module

# class _module

```fnpreview
constructor _module();
```
Erstellt eine _module-Instanz.

## Attribute

Die Attribute entsprechen zum größten Teil den Inhalten der ```module.ini```-Datei.

| Attrbute | Typ | Beschreibung |
|----------|-----|--------------|
| name | string | Eindeutiger Name des Moduls welches zur Identifikation des Modultyps dient. |
| modulename | string | Anzeigename des Moduls. (Veraltet, tritt außerhalb des Modulemanagers nicht in Einsatz) |
| description | string | Beschreibung des Moduls. (Veraltet) |
| path | string | Pfad zum Hauptverzeichnis des Moduls. (In dem sich die ```module.ini```-Datei befindet) |
| relpath | string | Pfad zum Hauptverzeichnis des Moduls ausgehend von ```chrome://windmill/content/```. |
| mainfile | string | Dateiname/relativer Pfad zur .html/.xul-Datei die bei Erstellung des Moduls geladen werden soll. |
| keyb_conflictedmodules | string | Eine durch Semikolon seperierte Liste von Modulnamen bei denen möglicherweise Konflikte zwischen den Key Bindings auftreten können, bspw. da diese Module ineinander verschachtelt sind. Module die hier aufgelistet sind, können nicht die gleichen Key Bindings haben. (Sodass bspw. ein Key Binding im Scripteditor keine Funktionen in den Scenario Settings ausführen kann) |
| custom | object | Enthält zusätzliche Eigenschaften der [Custom]-Sektion der ```module.ini```-Datei. |
