import i18n from "i18next";
import ICU from "i18next-icu";
import resourcesToBackend from "i18next-resources-to-backend";
import { initReactI18next } from "react-i18next";

import { isLocale, isRtl, routing } from "./routing";

const syncDocument = (lng: string) => {
  const locale = isLocale(lng) ? lng : routing.defaultLocale;
  document.documentElement.lang = locale;
  document.documentElement.dir = isRtl(locale) ? "rtl" : "ltr";
};

i18n.on("languageChanged", syncDocument);

i18n
  .use(ICU)
  .use(
    // The web frontend is intentionally fixed to Indonesian.
    resourcesToBackend(() => import("../messages/id.json")),
  )
  .use(initReactI18next)
  .init({
    supportedLngs: [...routing.locales],
    lng: routing.defaultLocale,
    fallbackLng: routing.defaultLocale,
    load: "languageOnly", // "en-US" -> "en"
    ns: ["translation"],
    defaultNS: "translation",
    keySeparator: ".",
    nsSeparator: false, // keys/values may contain ":"
    returnNull: false,
    returnObjects: false,
    interpolation: { escapeValue: false }, // React already escapes
    react: { useSuspense: true },
  });

export default i18n;
