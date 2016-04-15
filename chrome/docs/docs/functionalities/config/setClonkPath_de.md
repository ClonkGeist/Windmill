<<<setClonkPath
# setClonkPath

**void** setClonkPath(value);
Setzt den aktiven Clonkpfad auf den angegebenen Wert.

- **value:**
  Zwei Datentypen werden unterstützt:
  - **string:** Setzt den aktiven Clonkpfad auf den angegebenen Pfad, falls dieser im Clonkpfad-Array (```Global::ClonkDirectories```) vorhanden ist.
  - **int:** Setzt den Clonkpfad auf den angegebenen Index. **Achtung:** Anders als bei ```_sc.clonkpath``` ist dieser Index **nicht** ausgehend von dem aktiven Clonkpfad, sondern entspricht dem Index des Clonkpfad-Arrays.