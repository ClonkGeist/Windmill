<<<class ConfigEntry
# class ConfigEntry

**extends** [WindmillObject]()

**constructor** ConfigEntry(**string** section, **string** key, **any** value, [opt] **string** type, [opt] **object** options);
 * **section**:
   Section des Config-Eintrags
 * **key**:
   Key des Config-Eintrags
 * **value**:
   Wert der in den Config-Eintrag gespeichert wird und als Standardwert genommen wird.
 * **[opt] type**:
   Datentyp des Config-Eintrags. Übernimmt standardmäßig den Datentyp von **value**, kann für Pseudo-Datentypen jedoch notwendig werden. (s. Path)
 * **[opt] options:**
   Kann folgende Optionen enthalten:
     * **readOnly:** Setzt den Config-Eintrag **readOnly**.
	 * **alwaysSave:** Der Config-Eintrag speichert Änderungen am Wert nicht nur temporär sondern als tatsächlichen Wert. (Damit ist kein Schreiben auf der Festplatte verbunden)
	 * **runTimeOnly:** Falls `true`, wird der Config-Eintrag nie in der Config-Datei gespeichert sondern existiert nur zur Laufzeit.

**function** apply(**void**);
Setzt den temporär gespeicherten Wert als festen Wert. (Ohne auf die Festplatte zu schreiben)

**function** reset(**bool** apply);
Setzt den Wert auf den Standardwert zurück.
 * **apply:**
   Falls `true` wird `apply()` anschließend aufgerufen.

###Attribute

Attribute	| Typ | Beschreibung
------------|-----|---------------------
**type:**	| string | Gibt den Datentyp des Config-Eintrags (in LowerCase) wieder.
**value:**	| any | Gibt den gespeicherten Wert zurück und wandelt diesen - falls es sich um ein Objekt handelt - in einen JSON-konformen-String um.


