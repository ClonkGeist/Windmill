<<<Windmill Object
# Windmill Object

Die grundlegende Klasse auf die weitere Klassen in Windmill aufbauen sollten sowie die damit in Verbindung stehende Funktionen.

Klassen die über Events mittels ```hook```/```execHook``` verfügen sollen, sollten über das ```extends```-Schlüsselwort auf dieser Klasse aufbauen. Außerdem sollte im Konstruktor der neuen Klasse ```super()``` aufgerufen werden, sodass der Konstruktor der ```WindmillObject```-Klasse nicht komplett überladen wird.

**Beispiel:**

```javascript
class newWindmillClass extends WindmillObject {
	constructor() {
		super();

		/* Code */
	}
}
```