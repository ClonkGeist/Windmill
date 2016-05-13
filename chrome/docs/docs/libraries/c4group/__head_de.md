<<<C4Group

# C4Group

Die hier hinterlegten Funktionen bieten Möglichkeiten um mit C4Group-Dateien zu arbeiten. (Aktuell ist nur das Lesen von C4Group-Dateien unterstützt.)

**Achtung:** Von der Benutzung dieser Funktionen ist vorerst noch abzuraten, da der Prozess der Dekomprimierung des Datenbereiches sehr ressourcenaufwendig ist, weshalb diese Funktionen bisher nur im Bezug auf das Auslesen von Spielerdateien (\*.ocp, \*.oci) in Einsatz kommt. Hier sollte erst auf eine Implementation von JS-Ctypes und Worker gewartet werden.

Die Group-Inhalte lassen sich einfach über die [readC4GroupFile()](#)-Funktion auslesen. Zu den Inhalten lässt sich einfach über [C4GroupFile::getEntryByName()](#) navigieren.
Um den Inhalt der jeweiligen Datei zu erhalten, kann man auf die ```data```-Eigenschaft des ```C4GroupEntryCore```-Objekts zugegriffen werden, hierbei ist jedoch darauf aufzupassen, dass es sich bei dem Dateiinhalt um einen Array aus Bytes (Array<PRUint8>) handelt. Um den Inhalt bspw. einer Textdatei in ein lesbares Format umzuwandeln, kann die Hilfsfunktion [Array.prototype.byte2str()](#) verwendet werden. Bilder können hiermit auch angezeigt werden, wenn man den erhaltenen String mittels [WindowBase64.btoa()](https://developer.mozilla.org/de/docs/Web/API/WindowBase64/btoa) in Base64 kodiert.

**Beispiel:**

```javascript
function loadPlayerFile(entry) {
	let text, img, imgstr = "chrome://windmill/content/img/playerselection/DefaultPlayer.png";
	let group = readC4GroupFile(_sc.file(entry.path));
	text = group.getEntryByName("Player.txt").data.byte2str();
	img = group.getEntryByName("BigIcon.png");
	if(img)
		imgstr = "data:image/png;base64,"+btoa(img.data.byte2str(true));
	return { text, imgstr };
}
```

Lädt den Inhalt der angegebenen Spielerdatei ```entry``` und gibt den Inhalt der Player.txt und der BigIcon.png (Base64 kodiert) zurück.