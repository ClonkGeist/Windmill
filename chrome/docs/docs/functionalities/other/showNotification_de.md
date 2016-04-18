<<<showNotification

# showNotification

Bei den Benachrichtigungen handelt es sich um Desktop-Notifications (in Form von XUL-Panels) die sich einfach über ```showNotification``` erstellen lassen. Hierbei ist zu Beachten, dass damit nicht die WebNotification API gemeint ist und daher auch keine Erlaubnis vom Benutzer benötigt wird.

Benachrichtigungen stapeln sich, falls mehrere vorhanden sind und werden nach einer Zeit automatisch gelöscht.

```javascript
<jQueryObject> showNotification(string color, string title, string description, [opt] string code);
```

* **color:**
  Ein CSS-kompatibler String der die Färbung der Markierung angibt. Folgende Konstanten sind zusätzlich zur Auswahl:
  * **NOTIFICATION_COLOR_INFO:** ```#0D6F07``` Für Benachrichtigungen die den Benutzer allgemein informieren sollen. (Standardwert)
  * **NOTIFICATION_COLOR_ERROR:** ```#9E0505``` Für Benachrichtigungen die den Benutzer über Fehler informieren sollen.
* **title:**
  Gibt den Titel der Benachrichtigung an.
* **description:**
  Gibt die Beschreibung der Benachrichtigung an.
* **[opt] code:**
  Falls angegeben, wird statt Titel und Beschreibung der angegebene XUL-Code in den Content-Wrapper eingefügt. Auf diese Weise kann die Benachrichtigung um weitere Funktionen erweitert werden, als Beispiel die QuickJoin-Funktion der Spiele-Benachrichtigungen.

