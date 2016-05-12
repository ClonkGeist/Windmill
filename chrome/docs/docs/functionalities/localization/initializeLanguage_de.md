<<<initializeLanguage

# initializeLanguage

```fnpreview
Task<void> initializeLanguage();
```
Lädt die language.ini aus ```chrome://windmill/content/locale/[Global::Language]/``` (wobei ```[Global::Language]``` für den Wert des entsprechenden Eintrags in der Konfiguration steht) und liest diese ein inkl. der eventuellen, zugehörigen Fallback-Sprachen.