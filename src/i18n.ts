import * as path from "path";
import * as fs from "fs/promises";
import { LocalTranslations } from "./interfaces/localTranslations";

// Neues Interface für locale.json Dateien:
// Spezifischer Typ:
export type TranslationMap = LocalTranslations;

export class I18n {
  private activeLocale: string;
  private fallbackLocale: string;
  private cache: Record<string, TranslationMap> = {};

  constructor(defaultLocale: string) {
    this.activeLocale = defaultLocale;
    this.fallbackLocale = defaultLocale;
  }

  private async loadTranslations(locale: string): Promise<TranslationMap> {
    const translationFile = path.join(__dirname, "..", "i18n", `${locale}.json`);
    try {
      const data = await fs.readFile(translationFile, "utf8");
      return JSON.parse(data) as LocalTranslations;
    } catch (err) {
      console.error(`Fehler beim Laden der Übersetzungen für ${locale}: ${err}`);
      if (locale !== this.fallbackLocale) {
        return this.loadTranslations(this.fallbackLocale);
      }
      return {} as LocalTranslations;
    }
  }

  // Initialisiert das aktive Locale und lädt die Übersetzungen in den Cache.
  public async setLocale(locale: string): Promise<void> {
    this.activeLocale = locale;
    this.cache[locale] = await this.loadTranslations(locale);
  }

  // Gibt die Übersetzung für einen Schlüssel zurück. Fallback: fallbackLocale.
  public t(key: keyof LocalTranslations): string {
    const active = this.cache[this.activeLocale];
    if (active && active[key]) {
      return active[key];
    }
    const fallback = this.cache[this.fallbackLocale];
    if (this.activeLocale !== this.fallbackLocale && fallback && fallback[key]) {
      return fallback[key];
    }
    return key;
  }
}

// Singleton-Instanz, angelehnt an gängige Implementierungen (z. B. Vue‑i18n)
export const i18n = new I18n("en");

// Beim Modul-Laden Default-Locale vorladen:
(async () => {
  await i18n.setLocale(i18n["fallbackLocale"]);
})();

// Kurzschreibweisen für den einfachen Import in anderen Modulen:
export const t = i18n.t.bind(i18n);
export const setLocale = i18n.setLocale.bind(i18n);
