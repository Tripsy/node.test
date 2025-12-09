import 'dotenv/config';
import i18next from 'i18next';
import Backend from 'i18next-fs-backend';
import { LanguageDetector } from 'i18next-http-middleware';
import { cfg } from '@/config/settings.config';
import { buildSrcPath } from '@/helpers';
import logger from "@/providers/logger.provider";

// async function getNamespaces() {
// 	try {
// 		const langDir = buildSrcPath('locales', 'en');
//
// 		// Read the directory and filter JSON files
// 		const files = await fs.readdir(langDir);
// 		const langFiles = files.filter((file) => file.endsWith('.json'));
//
//         console.log('files', files);
//         console.log('langFiles', langFiles);
//
// 		// Extract namespace names from file names
// 		return langFiles.map((file) => file.split('.')[0]);
// 	} catch {
// 		return [];
// 	}
// }
// /**
//  * Return the list of namespaces based on the translation files from `locales/en` directory.
//  * The result is cached to improve performance.
//  */
// async function returnNamespaces(): Promise<string[]> {
// 	// While running tests will start failing because Redis connection is not closed
// 	// So we don't use cache
// 	// May be a bug, may be an issue, I didn't find a resolution
// 	if (cfg('app.env') === 'test') {
// 		return getNamespaces();
// 	}
//
// 	const cacheProvider = getCacheProvider();
//
// 	const cacheKey = cacheProvider.buildKey('i18next', 'ns');
//
// 	return (await cacheProvider.get(
// 		cacheKey,
// 		async () => await getNamespaces(),
// 	)) as string[];
// }

export async function initializeI18next() {
	// const namespaces = await returnNamespaces();

	await i18next
		.use(Backend)
		.use(LanguageDetector)
		.init({
			fallbackLng: 'en',
			supportedLngs: cfg('app.languageSupported') as string[], // List of supported languages
			interpolation: {
				escapeValue: false, // Disable escaping for HTML (if needed)
			},
			saveMissing: false, // Disable saving missing translations
			ns: cfg('app.languageNamespaces') as string[],
			backend: {
				loadPath: buildSrcPath('locales/{{lng}}/{{ns}}.json'),
			},
			detection: {
				order: ['header', 'cookie', 'querystring'], // Detect language from headers, cookies, or query parameters
			},
		});

    logger.debug('i18next initialized');
}

/**
 * Translate a key with optional replacements.
 * The key should be in the format `namespace.key`.
 */
export const lang = (
	key: string,
	replacements: Record<string, string> = {},
	fallback?: string,
): string => {
	if (cfg('app.env') === 'test') {
		return key;
	}

	if (!key.includes('.')) {
		throw Error(
			`Invalid translation key format: "${key}". Expected format: "namespace.key".`,
		);
	}

	const [ns, ...rest] = key.split('.'); // Extract namespace
	const newKey = rest.join('.'); // Reconstruct key without namespace

	const availableNamespaces = cfg('app.languageNamespaces') as string[];

	// Ensure the namespace exists
	if (!availableNamespaces.includes(ns)) {
		if (fallback) {
			return fallback;
		}

		throw Error(
			`Namespace "${ns}" not found. Available namespaces declared in 'settings.config.ts': ${availableNamespaces.join(', ')}.`,
		);
	}

	return i18next.t(newKey, { ns, ...replacements });
};
