import assert from "assert";
import { i18n, t, setLocale } from "../i18n";
import { config, logger } from "../config";

// Ersetze den bisherigen Test-Code durch umfassendere Unit Tests.
async function runTests() {
  console.log("Starte Unit Tests für HypnoScript VSCode-Erweiterung...");

  // Test: i18n in Englisch
  await setLocale("en");
  let focusEn = t("Focus");
  assert(
    focusEn.includes("**Focus**"),
    "i18n EN: Übersetzung für 'Focus' ist inkorrekt"
  );

  // Test: i18n in Deutsch
  await setLocale("de");
  let focusDe = t("Focus");
  assert(
    focusDe.includes("Startet ein HypnoScript-Programm"),
    "i18n DE: Übersetzung für 'Focus' ist inkorrekt"
  );

  // Test: Fallback-Mechanismus (nicht vorhandener Schlüssel)
  const unknown = t("unknown_key" as any);
  assert(unknown === "unknown_key", "Fallback: Unbekannter Schlüssel sollte als Schlüssel zurückgegeben werden");

  // Test: Logger-Konfiguration
  // (Beispielhaft, da Logger-Ausgabe in der Konsole erfolgt)
  if (config.environment === "development") {
    logger.debug("Test Debug Message");
  }
  logger.info("Test Info Message");

  console.log("Alle Unit Tests wurden erfolgreich abgeschlossen.");
}

runTests().catch((err) => {
  console.error("Unit Test Fehler:", err);
  process.exit(1);
});
