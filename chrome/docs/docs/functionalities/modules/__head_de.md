<<<Module

# Module

In Windmill besteht alles was sich außerhalb des Hauptfensters befindet (sprich alles außer der Navigation) aus Modulen die voneinander isoliert arbeiten können und auch seperat gemanaged werden können. (So werden bspw. Entwicklungs-Module die zu lange nicht mehr gebraucht werden entfernt um Ressourcen zu sparen)

Module werden beim Start von Windmill automatisch gesucht und die zugehörigen Modulinformationen eingelesen. Damit Module von Windmill erkannt und geladen werden können, müssen sie sich im ```modules```-Unterordner (```chrome://windmill/content/modules```) befinden und eine ```module.ini``` in diesem Pfad hinterlegen in dem wesentliche Informationen über das Modul gespeichert werden.

Hier eine Auflistung gültiger Werte:

## [Module]-Sektion

| Key | Beschreibung |
|-----|--------------|
| Name | Eindeutiger Name des Moduls welches zur Identifikation des Modultyps dient. |
| Modulename | Anzeigename des Moduls. (Veraltet, tritt außerhalb des Modulemanagers nicht in Einsatz) |
| Description | Beschreibung des Moduls. (Veraltet) |
| MainFile | Dateiname/relativer Pfad zur .html/.xul-Datei die bei Erstellung des Moduls geladen werden soll. |
| LanguagePrefix | Eindeutiger Präfix-Kürzel für die Lokalisierungseinträge. |
| KeyB_ConflictedModules | Eine durch Semikolon seperierte Liste von Modulnamen bei denen möglicherweise Konflikte zwischen den Key Bindings auftreten können, bspw. da diese Module ineinander verschachtelt sind. Module die hier aufgelistet sind, können nicht die gleichen Key Bindings haben. (Sodass bspw. ein Key Binding im Scripteditor keine Funktionen in den Scenario Settings ausführen kann) |

Es gibt zusätzlich die Möglichkeit, eine [Custom]-Sektion hinzuzufügen die evtl. sehr spezielle Informationen enthalten könnte. Diese werden dann in der Moduldefinition unter der "custom"-Eigenschaft eingelesen.