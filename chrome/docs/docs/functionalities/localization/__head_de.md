<<<Lokalisierung

# Lokalisierung

Windmill bietet zur Unterstützung mehrerer Sprachen die Möglichkeit, Module zu lokalisieren. Dies passiert in den meisten Fällen automatisch, d.h. dass sämtliche Windmilleigene GUI-Inhalte wie Notifications, Dialoge und so weiter Lokalisierungen von selbst aus anwenden. Auch beim Laden des Moduls werden alle Textnodes sowie Attribute von Elementen nach Strings die lokalisiert werden sollen durchsucht die anschließend übersetzt werden.

Um erkennbar zu machen, dass ein bestimmter String aus den Sprachdateien geladen werden soll, muss der zugehörige Identifizierungsname von Dollarzeichen ($) umschlossen werden und es muss ein gültiger Eintrag in der Sprachdatei hinterlegt sein. Der Identifizierungsname muss dabei, wenn er von den Dollarzeichen umschlossen ist, ohne dem Modulpräfix angegeben werden. (Z.B. ```STG_General=General``` in der Sprachdatei, allerdings ```$General$``` im Quellcode)

## language.ini

Die Sprachdateien werden bei Start von Windmill aus dem ```locale```-Unterordner (```chrome://windmill/content/locale/```) geladen und eingelesen. 

Sie besitzen eine ```Head```-Sektion in der grundlegende Informationen zur Sprachdatei enthalten sind und eine ```Language```-Sektion, in der die einzelnen Übersetungen vorhanden sind.

### Head-Sektion

Folgende Werte können in der Head-Sektion stehen bzw. werden erwartet:

| Name | Beschreibung |
|------|--------------|
| Name | Name der Sprache in der jeweiligen Sprache. |
| Lang | Kürzel der Sprache. (Wird in der Sprachauswahl daneben angezeigt. Wird ggf. in Zukunft entfernt, da die Ordnerbezeichnung dies auch übernehmen kann.) |
| Version | Version der Sprachdatei. (Aktuell ohne Effekt.) |
| FallbackLang | Language Code der Sprache die genutzt werden soll, falls bestimmte Strings nicht vorhanden sind. |

### Language-Sektion

In der Language-Sektion befinden sich die einzelnen Strings zur Lokalisierung aufgelistet. Diese haben dabei das Format ```LPX_Identifier=Translation```, wobei **LPX** für den Lokalisierungspräfix des jeweiligen Moduls steht. Da das Hauptfenster über keinen Lokalisierungspräfix verfügt, sind Lokalisierungen für das Hauptfenster nur durch einem voranstehenden Unterstrich gekennzeichnet. (Z.B. ```_AddPlayer=Add player```)

Erwähnenswert ist hier auch der Eintrag ```_ClonkLangPrefix```, der das zweistellige Kürzel für von Clonk unterstützte Sprachdateien angibt, die jeweils geladen werden sollen. (D.h. ``US`` für englischsprachige Clonkinhalte, ```DE``` für deutschsprachige Clonkinhalte etc.) Falls die jeweilige Sprachdatei nicht gefunden wird, werden automatisch nochmal nach den englischsprachigen Inhalten durchsucht.