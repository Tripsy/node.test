import fs from 'node:fs';
import { Configuration } from '@/config/settings.config';
import { ModuleError } from '@/exceptions/module.error';
import {
	buildSrcPath,
	getErrorMessage,
	getFileNameWithoutExtension,
	listDirectories,
	listFiles,
} from '@/helpers';
import { getSystemLogger } from '@/providers/logger.provider';

function getCoreListenerPaths() {
	const sharedFolder = Configuration.get('folder.shared') as string;
	const sharedListenersPath = buildSrcPath(sharedFolder, '/listeners');

	const files = listFiles(sharedListenersPath);
	const filesExtension = Configuration.resolveExtension();

	// Return listeners files path
	return files
		.filter((f) => f.endsWith(`.listener.${filesExtension}`))
		.map((f) => buildSrcPath(sharedFolder, '/listeners', f));
}

function getFeatureListenerPaths() {
	const featuresFolder = Configuration.get<string>(
		'folder.features',
	) as string;
	const featuresPath = buildSrcPath(featuresFolder);
	const features = listDirectories(featuresPath);

	const filesExtension = Configuration.resolveExtension();

	// Assuming each feature has a corresponding listener
	const possibleListeners = features.map((n) =>
		buildSrcPath(featuresFolder, n, `${n}.listener.${filesExtension}`),
	);

	// Return only the actual existing listeners files path
	return possibleListeners.filter((p) => fs.existsSync(p));
}

async function registerListener(filePath: string) {
	if (!fs.existsSync(filePath)) {
		throw new ModuleError();
	}

	const module = await import(filePath);

	if (module.default && typeof module.default === 'function') {
		module.default();
	} else {
		throw new Error(
			`There is no 'export default' listener found in ${filePath}`,
		);
	}
}

export async function setupListeners() {
	const featureListenerPaths = getFeatureListenerPaths();
	const coreListenerPaths = getCoreListenerPaths();

	const listenerPaths = [...featureListenerPaths, ...coreListenerPaths];

	const promises = listenerPaths.map(async (filePath) => {
		try {
			await registerListener(filePath);

			return {
				name: getFileNameWithoutExtension(filePath),
				status: 'fulfilled',
			} as const;
		} catch (error) {
			const skip = error instanceof ModuleError;
			const errorMsg = `${getErrorMessage(error) || `Listeners setup errors`}`;

			return {
				name: filePath,
				status: 'rejected',
				reason: errorMsg,
				skip: skip,
			} as const;
		}
	});

	const results = await Promise.all(promises);

	const successful = results
		.filter((r) => r.status === 'fulfilled')
		.map((r) => r.name);

	const failed = results
		.filter((r) => r.status === 'rejected' && !r.skip)
		.map((r) => r.reason ?? 'unknown');

	if (successful.length) {
		getSystemLogger().debug(
			`Listeners registered successfully for: ${successful.join(', ')}`,
		);
	}

	if (failed.length) {
		getSystemLogger().error(failed, `Failed listeners setup`);
	}
}
