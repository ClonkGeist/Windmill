<<<Dialoge

# Dialoge

Dialoge können von jedem Modul einfach mittels ```WDialog``` erstellt werden. Das Anzeigen der Dialoge passiert dabei im Mainwindow weshalb die Inhalte, auch aus HTML5-basierten Modulen heraus, XUL-Elemente sein sollten bzw. den HTML-Namespace mitbringen sollten.

## Erstellen eines Dialogs

Dialoge lassen sich einfach über das ```WDialog```-Objekt erstellen. Dabei können auch Angaben zur Erscheinung des Dialogs wie bspw. die Breite und auch zu den Buttons und dem Verhalten nach Klick auf einen Button mitgeliefert werden. Hier ein Testdialog das nach Klick auf den "OK"-Button "Testlog" logt:

```javascript
let dlg = new WDialog("TestDialog", 0, { css: { "width": "450px" }, btnright: [{ preset: "accept",
	onclick: function(e, btn, dialog) {
		log("Testlog");
	}
}, "cancel"]});
```

Der Inhalt des Dialogs muss über die ```setContent``` Funktion aufgerufen werden und um das Dialog letztendlich auch anzuzeigen muss ```show``` aufgerufen werden. Das heißt also auch, dass das Dialog nur einmalig definiert werden müsste und wiederverwendet werden kann.

Für die Buttons der Dialoge kann in den meisten Fällen auf die Presets zurückgegriffen werden, die standardmäßiges Verhalten wie das Schließen des Dialogs und die Labels der Dialoge mitliefert. Die Labels können nachträglich noch angepasst werden. Um die Standardreaktion der Presets auf das Klickevent zu verhindern, kann ```e.stopImmediatePropagation()``` genutzt werden.

Um auf die Elemente des Dialog-Wrappers zugreifen zu können, kann auf die Eigenschaft ```element``` des Dialog-Objekts zugegriffen werden, welches das aktuelle Dialog-Element (falls angezeigt) zurückgibt. So lassen sich weitere Funktionalitäten hinzufügen.

### WDialog-Konstruktor

Hier ein näherer Einblick auf den WDialog-Konstruktor:

**constructor** WDialog(**string** title, [opt] **string** langpre, [opt] **object** options);

Während die ersten beiden Parameter relativ offensichtlich sein sollten (für ```langpre``` gilt wie immer: Falls 0 wird die Moduleigene Lokalisierung geladen, bei -1 die aus dem Mainwindow und ansonsten mit dem angegebenen Präfix), befindet sich in ```options``` das eigentlich Interessante.

```options``` kann folgende Werte haben:

* **modal:**
  Zeigt das Dialog mit Modal an. Standardwert: ```true```.
* **cancelOnModal:**
  Schließt das Dialog nach Klick auf dem Modal.
* **css:**
  Gibt weitere Einstellungen für die Anzeige des Dialogs an. Hier werden oft feste Angaben zur Breite des Dialogs festgelegt, es können allerdings auch andere Eigenschaften festgelegt werden. Die CSS-Einstellungen werden dabei an das ```.main-wdialog-wrapper```-Element des Dialogs angewandt. Standardwert: ```{ width: "450px"; }```
* **noEscape:**
  Falls ```true```, so kann das Dialog nicht per Druck auf die [Esc]-Taste geschlossen werden.
* **simple:**
  Blendet footer- und content-Wrapper des Dialogs aus und zeigt nur noch den Header an. Das Dialog besteht also nur aus einem Kasten dessen Text zentriert wird. Ein Beispiel für ein solches Dialog ist das Tasten-Zuweisungsdialog der KeyBindings in den Einstellungen.
* **content:**
  Inhalt des Dialogs. Lässt sich auch über ```setContent``` setzen.
* **footer:**
  Inhalt des Footers des Dialogs. Falls gesetzt, so werden keine Buttons erstellt.
* **onshow:**
  Funktion die ausgeführt wird, wenn das Dialog angezeigt wird. Hier sollte allerdings besser der ```show```-Hook verwendet werden.
* **btnleft / btnright:**
  Array für die einzelnen Buttons der jeweiligen Seite. Die einzelnen Felder können entweder eigene Button-Objekte enthalten oder einfach nur den Namen eines der Presets weitergeben.

Die Button-Objekte können folgende Werte annehmen:

* **label:**
  Gibt den Buttonlabel an.
* **langpre:**
  Gibt den Lokalisierungspräfix an. Falls nicht angegeben, wird der Lokalisierungspräfix des Dialogs verwendet.
* **onclick:**
  Gibt die Funktion an, die ausgeführt werden soll wenn auf den Button geklickt wird. Es wird das Eventobjekt, der Button selbst und das Dialogobjekt übergeben. Falls es sich bei der Funktion um einen Generator handelt, so wird ein Task erstellt an welches die Generatorfunktion mittels ```yield*``` weitergegeben wird. Während des ganzen Prozesses wird das Dialog gesperrt, sodass keine weitere Benutzerinteraktion möglich ist.
* **preset:**
  Lädt für die o.g. Eigenschaften Standardwerte des jeweiligen Presets. Aktuell unterstützte Presets sind ```accept``` und ```cancel```. Die Click-Handler der Presets werden dabei seperat geladen, d.h. werden durch das Setzen von ```onclick``` nicht überschrieben. Um die Ausführung dieser zu vermeiden, muss im Eventobjekt ```stopImmediatePropagation``` aufgerufen werden, da diese Clickhandler erst später ausgeführt werden. Im Falle einer Generatorfunktion muss ein Error geworfen werden um die weitere Ausführung des Tasks zu verhindern. Hier muss ggf. das Dialog wieder mittels ```dlg.unlock()``` freigeschalten werden.


## Dialog GUI-Elemente

Dialoge verfügen über einige weitere standardmäßige GUI-Elemente die genutzt werden können. Falls der Inhalt verändert wird, ist es jedoch ggf. von Nöten, die Darstellung und Funktionalität der GUI-Elemente mittels ```updatePseudoElements()``` im Dialogobjekt zu aktualisieren.

### Checklistboxen

Bei Checklistboxen handelt es sich um scrollbare Listen bei denen sich die einzelnen Elemente an- bzw. abwählen lassen, ergo die Funktionalität von Checkboxen und Listboxen vereinen.

Um eine solche Checklistbox zu verwenden, muss einfach ein vbox-Element mit der ```dlg-checklistbox```-Klasse erstellt werden. Um ein Listitem zu erstellen, muss ein hbox-Element mit der ```dlg-checklistitem```-Klasse erstellt werden.

Werden Checklistitems ausgewählt, so wird eine ```selected```-Klasse hinzugefügt. Die Checklistitems lassen sich über die Klasse ```disabled``` deaktivieren und über die Klasse ```hidden``` unsichtbar schalten.

```javascript
let dlg = new WDialog("Checklistboxen", 0, { css: { "width": "450px" }, btnright: ["accept", "cancel"]});
dlg.setContent(`<vbox class="dlg-checklistbox">
					<hbox class="dlg-checklistitem">Checklistitem</hbox>
					<hbox class="dlg-checklistitem disabled">Deaktiviertes Checklistitem</hbox>
					<hbox class="dlg-checklistitem hidden">Verstecktes Checklistitem</hbox>
				</vbox>`);
dlg.show();
```

### Listboxen

Listboxen zeigen einfach nur einzelne Listenelemente an. Der Vorteil gegenüber den Standard-XUL-Listboxen liegt darin, dass es sich um einfache Container handelt und daher keine Einschränkungen für den Inhalt und der Strukturierung des Inhalts vorliegt.

Ein Listbox-Container kann mittels eines vbox-Elements mit der Klasse ```dlg-listbox``` erstellt werden und mit hbox-Elementen mit der Klasse ```dlg-list-item``` gefüllt werden.

Das Container-Element kann, falls gewünscht, das Attribut ```data-noselect``` auf ```true``` setzen, um das Auswählen von Elementen zu deaktivieren. Alternativ kann über das Attribut ```data-multiselect``` die Auswahl mehrerer Elemente aktiviert werden.

Auch für Listboxen gilt: Elemente haben eine ```selected```-Klasse wenn ausgewählt und lassen sich über ```disabled``` deaktivieren bzw. über ```hidden``` unsichtbar schalten.

### Infobox

Es lassen sich auch gestylte Infoboxen über ein hbox-Element mit der Klasse ```dlg_infobox``` (soll aus Konsistenzgründen ```dlg-infobox``` werden) erstellen und mit zusätzlichen Klassen zur Art der Information ausstatten. Aktuell wird nur die Klasse ```error``` unterstützt, um Fehler anzuzeigen.

Die Infobox wird dabei automatisch sichtbar bzw. unsichtbar, wenn Text hinzugefügt oder entfernt wird.

## Funktionsreferenz

**constructor** WDialog(**string** title, [opt] **string** langpre, [opt] **object** options);
Erstellt ein Dialogobjekt. Fuer genauere Angaben zu den einzelnen Parametern siehe oben.

**void** setContent(**string** content);
Setzt den Inhalt der in ```.main-wdialog-content``` angezeigt werden soll.

**void** setFooter(**string** content);
Setzt den Inhalt der in ```.main-wdialog-footer``` angezeigt werden soll. Falls gesetzt, werden die Buttons nicht mehr erstellt.

**<jQueryObject>** getFooterElm();
Gibt ein jQueryObject zum ```.main-wdialog-footer```-Element zurück.

**void** setBtnLeft(**array** buttons);
Erstellt die im Array übergebenen Button-Definitionen links unten im Dialog.

**void** setBtnRight(**array** buttons);
Erstellt die im Array übergebenen Button-Definitionen rechts unten im Dialog.

**<XULElement>** addButtons(**string/object** btnobj, [opt] **bool** left);
Erstellt den angegebenen Button im Dialog und gibt diesen zurück.

* **btnobj:**
  Button-Definition des zu erstellenden Buttons. Kann alternativ auch ein String zu einem Preset sein.
* **left:**
  Erstellt den Button links unten im Dialog.

**void** lock();
Sperrt das Dialog.

**void** unlock();
Entsperrt das Dialog.

**void** show();
Erstellt das Dialog-Element im Mainwindow.

**void** updatePseudoElements();
Aktualisiert die Dialog-GUI-Elemente in der Funktionsweise. Dies kann nötig sein, falls neue Dialog-GUI-Elemente während das Dialog-Element aktiv ist, hinzugefügt werden. GUI-Elemente wie die Listen und die Infobox aktualisieren allerdings ihren eigenen Inhalt automatisch.

**void** updateTextNodes(**<jQueryObject>** objects);
Passt die Breite der angegebenen Elemente an das Dialog an. Dies kann insbesondere im Zusammenhang mit den ```description```-Elementen von Nöten sein, da sie teilweise aus dem Dialog herausragen und das Dialog dadurch falsch dargestellt wird.

**bool** hide();
Schließt das Dialog-Element und gibt, falls erfolgreich, ```true``` zurück.