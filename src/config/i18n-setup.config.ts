import {settings} from './settings.config';
import i18next from 'i18next';
import Backend from 'i18next-fs-backend';
import {LanguageDetector} from 'i18next-http-middleware';
import {buildSrcPath} from '../helpers/system.helper';
import fs from 'fs/promises';
import {cacheProvider} from '../providers/cache.provider';
import logger from '../providers/logger.provider';

/**
 * Determine the list of namespaces by reading the translation files in the `locales/en` directory.
 * The result is cached to improve performance.
 */
async function determineNamespaces(): Promise<string[]> {
    const cacheKey = cacheProvider.buildKey('i18next', 'ns');

    return await cacheProvider.get(cacheKey, async () => {
        const langDir = buildSrcPath('locales', 'en');

        try {
            // Read the directory and filter JSON files
            const files = await fs.readdir(langDir);
            const langFiles = files.filter((file) => file.endsWith('.json'));

            // Extract namespace names from file names
            return langFiles.map((file) => file.split('.')[0]);
        } catch (error) {
            return [];
        }
    });
}

async function initializeI18next() {
    const namespaces = await determineNamespaces();

    await i18next
        .use(Backend) // Use the file system backend
        .use(LanguageDetector) // Use the language detector middleware
        .init({
            lng: 'en', // Default language
            fallbackLng: 'en', // Fallback language
            supportedLngs: settings.app.supportedLanguages, // List of supported languages
            ns: namespaces, // Dynamically determined namespaces
            backend: {
                loadPath: buildSrcPath('locales/{{lng}}/{{ns}}.json'), // Path to translation files
            },
            interpolation: {
                escapeValue: false, // Disable escaping for HTML (if needed)
            },
            saveMissing: false, // Disable saving missing translations
            detection: {
                order: ['header', 'cookie', 'querystring'], // Detect language from headers, cookies, or query parameters
            },
        });
}

initializeI18next().catch((error) => {
    logger.debug(error, 'Failed to initialize i18next');
});

/**
 * Translate a key with optional replacements.
 * The key should be in the format `namespace.key`.
 */
export const lang = (key: string, replacements: Record<string, string> = {}): string => {
    if (!key.includes('.')) {
        throw Error(`Invalid translation key format: "${key}". Expected format: "namespace.key".`);
    }

    const [ns, ...rest] = key.split('.'); // Extract namespace
    const newKey = rest.join('.'); // Reconstruct key without namespace

    const availableNamespaces = i18next.options.ns as string[];

    // Ensure the namespace exists
    if (!availableNamespaces.includes(ns)) {
        throw Error(`Namespace "${ns}" not found. Available namespaces: ${availableNamespaces.join(', ')}.`);
    }

    return i18next.t(newKey, {ns, ...replacements});
};

export default i18next;