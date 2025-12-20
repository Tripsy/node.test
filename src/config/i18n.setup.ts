import 'dotenv/config';
import * as fs from 'node:fs';
import path from 'node:path';
import i18next from 'i18next';
import Backend from 'i18next-fs-backend';
import { LanguageDetector } from 'i18next-http-middleware';
import { cfg } from '@/config/settings.config';
import { buildSrcPath } from '@/lib/helpers';
import { getCacheProvider } from '@/lib/providers/cache.provider';
import { getSystemLogger } from '@/lib/providers/logger.provider';

async function getNamespaces(): Promise<string[]> {
	const featureNamespaces = await getFeatureNamespaces();

	return ['shared', ...featureNamespaces];
}

async function getFeatureNamespaces(): Promise<string[]> {
	const featuresDir = buildSrcPath('features');

	try {
		const entries = fs.readdirSync(featuresDir, { withFileTypes: true });
		const directories = entries.filter((e) => e.isDirectory());

		const directoriesWithLocales = await Promise.all(
			directories.map(async (e) => {
				try {
					await fs.promises.access(
						path.join(
							featuresDir,
							e.name,
							'locales',
							`${cfg('app.language')}.json`,
						),
					);
					return e.name;
				} catch {
					return null;
				}
			}),
		);

		return directoriesWithLocales.filter(
			(name): name is string => name !== null,
		);
	} catch {
		return [];
	}
}

/**
 * Return the list of namespaces based on the translation files from `locales/en` directory.
 * The result is cached to improve performance.
 */
async function resolveNamespaces(): Promise<string[]> {
	// While running tests will start failing because Redis connection is not closed
	// So we don't use cache
	// May be a bug, may be an issue, I didn't find a resolution
	if (cfg('app.env') === 'test') {
		return getNamespaces();
	}

	const cacheProvider = getCacheProvider();

	const cacheKey = cacheProvider.buildKey('i18next', 'ns');

	return (await cacheProvider.get(
		cacheKey,
		async () => await getNamespaces(),
	)) as string[];
}

export async function initializeI18next() {
	const namespaces = await resolveNamespaces();

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
			// ns: cfg('app.languageNamespaces') as string[],
			ns: namespaces,
			backend: {
				loadPath: (_lng: string, ns: string) => {
					if (ns === 'shared') {
						return buildSrcPath('shared/locales/{{lng}}.json');
					}

					return buildSrcPath(`features/${ns}/locales/{{lng}}.json`);
				},
			},
			detection: {
				order: ['header', 'cookie', 'querystring'], // Detect language from headers, cookies, or query parameters
			},
		});

	getSystemLogger().debug(
		`i18next initialized with namespaces: ${namespaces.join(', ')}`,
	);
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
	const newKey = rest.join('.'); // Reconstruct key without the namespace

	if (!i18next.options.ns?.includes(ns)) {
		if (fallback) {
			return fallback;
		}

		getSystemLogger().warn(`Unknown namespace: ${ns}`);

		return key;
	}

	return i18next.t(newKey, { ns, ...replacements });
};
