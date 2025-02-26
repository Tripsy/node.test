import {settings} from './settings.config';
import i18next from 'i18next';
import Backend from 'i18next-fs-backend';
import {LanguageDetector} from 'i18next-http-middleware';
import {buildSrcPath} from '../helpers/system';

console.log(buildSrcPath('locales/{{lng}}/{{ns}}.json'));
i18next
    .use(Backend) // Use the file system backend
    .use(LanguageDetector) // Use the language detector middleware
    .init({
        lng: 'en', // Default language
        fallbackLng: 'en', // Fallback language
        supportedLngs: settings.app.supportedLanguages, // List of supported languages
        ns: ['user', 'template', 'error', 'permission', 'debug', 'account'], // Namespaces
        // defaultNS: 'user', // Default namespace
        backend: {
            loadPath: buildSrcPath('locales/{{lng}}/{{ns}}.json'), // Path to translation files
        },
        interpolation: {
            escapeValue: false, // Disable escaping for HTML (if needed)
        },
        saveMissing: false,
        detection: {
            order: ['header', 'cookie', 'querystring'], // Detect language from headers, cookies, or query parameters
        },
    });

export const lang = (key: string, replacements: Record<string, string> = {}): string => {
    const [ns, ...rest] = key.split('.'); // Extract namespace
    const newKey = rest.join('.'); // Reconstruct key without namespace

    return i18next.t(newKey, { ns, ...replacements });
};

export default i18next;

