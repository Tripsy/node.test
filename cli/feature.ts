//  pnpx tsx cli/feature.ts test install
//  pnpx tsx cli/feature.ts test remove
//  pnpx tsx cli/feature.ts test upgrade

import { exec } from 'node:child_process';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as readline from 'node:readline';
import { promisify } from 'node:util';
import {display} from './helpers/console-display';
import {logToFile} from "./helpers/console-log";
import {ConsoleRollback} from "./helpers/console-rollback";

interface Manifest {
	name: string;
	version: string;
	relativePath: string;
	entities: string[];
	depends_on: string[];
	depends_off: string[];
}

type Mode = 'install' | 'remove' | 'upgrade';

type FeatureManagerArgs = {
    basePath: string,
    historyFilePath: string,
    feature: string,
    mode: Mode,
    debug: boolean,
    rollback: ConsoleRollback,
}

class FeatureManager {
    private readonly basePath: string;
	private readonly baseFeaturePath: string;
	private readonly baseSourcePath: string;
    private readonly historyFilePath: string;

	private rl: readline.Interface;

    private readonly feature: string;
    private readonly mode: Mode;
    private readonly debug: boolean;

    private rollback: ConsoleRollback;

	private execAsync = promisify(exec);

	constructor(args: FeatureManagerArgs) {
        this.basePath = args.basePath;
		this.baseFeaturePath = path.join(this.basePath, 'src/features');
		this.baseSourcePath = path.join(this.basePath, 'packages');
        this.historyFilePath = args.historyFilePath;

        this.feature = args.feature;
        this.mode = args.mode;
        this.debug = args.debug;

        this.rollback = args.rollback;

		this.rl = readline.createInterface({
			input: process.stdin,
			output: process.stdout,
		});

		// TODO > sanity checks
		// check if base path is correct ?
		// git status check
	}

	async run() {
		try {
			switch (this.mode) {
				case 'install':
                    void logToFile(`${this.feature} / ${this.mode}: Init`, this.historyFilePath);

					await this.installFeature();
					// TODO
					// maybe it has seeds
					break;
				case 'remove':
                    void logToFile(`${this.feature} / ${this.mode}: Init`, this.historyFilePath);

					await this.removeFeature();
					break;
				case 'upgrade':
                    void logToFile(`${this.feature} / ${this.mode}: Init`, this.historyFilePath);

				    // await this.upgradeFeature();
				    break;
				default:
					display.error(`Unknown mode: ${this.mode}`);
			}
		} catch (error) {
			if (error instanceof Error) {
                if (error.message) {
                    display.error(error.message);

                    await logToFile(`${this.feature} / ${this.mode}: ${error.message}`, this.historyFilePath);
                } else {
                    await logToFile(`${this.feature} / ${this.mode}: Abort`, this.historyFilePath);
                }
			} else {
				console.error(error);

                await logToFile(`${this.feature} / ${this.mode}: Abort`, this.historyFilePath);
			}

            await this.rollback.process();

			display.blank().text('Process aborted', 'lock');

			process.exit(1);
		} finally {
			this.rl.close();
		}
	}

	private async askConfirmation(question: string): Promise<boolean> {
		return new Promise((resolve) => {
			this.rl.question(`${question} (Yes / No): `, (answer) => {
				resolve(/^[Yy][Ee]?[Ss]?$/.test(answer));
			});
		});
	}

	private async handleConfirmation(
		question: string = 'Are you sure you want to continue?',
	) {
		display.blank();

		const confirmation = await this.askConfirmation(question);

		if (!confirmation) {
			throw new Error();
		}
	}

	private async pathExists(path: string): Promise<boolean> {
		try {
			await fs.access(path);

			return true;
		} catch {
			return false;
		}
	}

	private async parseManifest(filePath: string): Promise<Manifest> {
		// Check if `manifest.json` file exist
		if (!(await this.pathExists(filePath))) {
			display
				.error(`Could not locate '${filePath}`)
				.text('Feature has to be removed manually');

			throw new Error();
		}

		try {
			const content = await fs.readFile(filePath, 'utf-8');

			return JSON.parse(content);
		} catch (error) {
			throw new Error(`Invalid manifest.json: ${error}`);
		}
	}

	private async dropDatabaseTables(tables: string[]) {
		display
            .blank()
			.warning(
				'The following database tables are related and need to be removed manually from DB',
			)
			.indentMore(4);

		tables.forEach((table) => {
			display.bullet(table);
		});

		display.indentReset();
	}

	private async getExistingFeatures(features: string[]): Promise<string[]> {
		const existingFeatures: string[] = [];

		for (const f of features) {
			const depPath = path.join(this.baseFeaturePath, f);

			if (await this.pathExists(depPath)) {
				existingFeatures.push(f);
			}
		}

		return existingFeatures;
	}

	private async getMissingFeatures(features: string[]): Promise<string[]> {
		const missingFeatures: string[] = [];

		for (const f of features) {
			const depPath = path.join(this.baseFeaturePath, f);

			if (!(await this.pathExists(depPath))) {
				missingFeatures.push(f);
			}
		}

		return missingFeatures;
	}

	private async copyDirectory(
		src: string,
		dest: string,
		ignore: string[] = [],
	) {
		await fs.mkdir(dest, { recursive: true });

		const entries = await fs.readdir(src, { withFileTypes: true });

		for (const entry of entries) {
			if (ignore.includes(entry.name)) continue;

			const srcPath = path.join(src, entry.name);
			const destPath = path.join(dest, entry.name);

			if (entry.isDirectory()) {
				await this.copyDirectory(srcPath, destPath, ignore);
			} else {
				await fs.copyFile(srcPath, destPath);
			}
		}
	}

	async executeMigrationGenerate() {
		try {
			const command = `pnpx tsx ./node_modules/typeorm/cli.js migration:generate -d /var/www/html/src/config/data-source.config.ts /var/www/html/src/database/migrations/feature-${this.feature}`;

			const { stdout, stderr } = await this.execAsync(command, {
				cwd: this.basePath, // Set a working directory
				maxBuffer: 1024 * 1024 * 10, // 10MB buffer for a large output
			});

			// TypeORM often outputs to stderr even on success
			const hasRealErrors =
				stderr.toLowerCase().includes('error') &&
				!stderr.toLowerCase().includes('no changes');

			if (hasRealErrors) {
				display.warning(`Warnings: ${stderr}`);

				return false;
			}

			display.success('Migration generated successfully').text(stdout);

			return true;
		} catch (error) {
			if (error instanceof Error) {
				display.error(`Failed to generate migration: ${error.message || 'Unknown error'}`);
			} else {
				console.error(error);
			}
		}
	}

	async executeMigrationRun() {
		try {
			const command =
				'pnpx tsx ./node_modules/typeorm/cli.js migration:run -d /var/www/html/src/config/data-source.config.ts';

			const { stdout, stderr } = await this.execAsync(command, {
				cwd: this.basePath, // Set a working directory
				maxBuffer: 1024 * 1024 * 10, // 10MB buffer for a large output
			});

			// TypeORM often outputs to stderr even on success
			const hasRealErrors =
				stderr.toLowerCase().includes('error') &&
				!stderr.toLowerCase().includes('no changes');

			if (hasRealErrors) {
				display.warning(`Warnings: ${stderr}`);

				return false;
			}

			display.success('Migration run successfully').text(stdout);

			return true;
		} catch (error) {
			if (error instanceof Error) {
				display.error(`Failed to run migration: ${error.message || 'Unknown error'}`);
			} else {
				console.error(error);
			}

			throw error;
		}
	}

	private async removeFeature() {
		const featurePath = path.join(this.baseFeaturePath, this.feature);
		const manifestPath = path.join(featurePath, 'manifest.json');

		display
			.text(`Remove feature "${this.feature}"`, 'headline')
			.tip(
				'Make sure you have a rollback plan. Use git to record your development progress',
			)

		display
            .blank()
            .text('Starting removal...', 'arrow')

		// Check if the feature exists
		if (!(await this.pathExists(featurePath))) {
			display
                .blank()
				.error(`Feature '${this.feature}' is not installed.`)
                .blank()
				.tip('Try a fresh install');

			throw new Error();
		}

		const manifest = await this.parseManifest(manifestPath);

		// Check if other features depend on this
		const existingDependencies = await this.getExistingFeatures(
			manifest.depends_off,
		);

		if (existingDependencies.length > 0) {
			display
                .blank()
				.error(
					`The selected feature (e.g.: ${this.feature}) cannot be removed`,
				)
				.text(
					`The following features depend on it: ${existingDependencies.join(', ')}; Start by removing them.`,
				);

			throw new Error();
		}

		await this.handleConfirmation(
			`Are you sure you want to remove feature "${this.feature}"?`,
		);

		// Handle database tables
		if (manifest.entities && manifest.entities.length > 0) {
			await this.dropDatabaseTables(manifest.entities);

            display.blank();
		}

		try {
			await display.withDots(`Removing ${featurePath}`, async () => {
				if (this.debug === false) {
					await fs.rm(featurePath, { recursive: true, force: true });

					return `Folder ${featurePath} removed!`;
				} else {
					throw new Error(`Debug is ON`);
				}
			});
		} catch {
			throw new Error();
		}

		display
			.blank()
			.success(`Feature "${this.feature}" removed successfully!`);

        void logToFile(`${this.feature} / ${this.mode}: Completed`, this.historyFilePath);
	}

	private async installFeature() {
		const sourcePath = path.join(this.baseSourcePath, this.feature);
		const manifestPath = path.join(sourcePath, 'manifest.json');

		display
			.text(`Install feature "${this.feature}"`, 'headline')
			.tip(
				'Make sure you have a rollback plan. Use git to record your development progress',
			)
			.blank();

		display
            .text('Installing...', 'arrow');

		// Check if the source exists
		if (!(await this.pathExists(sourcePath))) {
			display
                .blank()
                .error(`Source package not found at: ${sourcePath}`);

			throw new Error();
		}

		const manifest = await this.parseManifest(manifestPath);

		const featurePath = path.join(
			this.baseFeaturePath,
			manifest.relativePath,
		);

		// Check if the feature exists
		if (await this.pathExists(featurePath)) {
			display
                .blank()
				.error(`Feature '${this.feature}' is already installed.`)
                .blank()
				.tip('Try upgrade instead');

			throw new Error();
		}

		// Check if all dependencies exist
		const missingDependencies = await this.getMissingFeatures(
			manifest.depends_on,
		);

		if (missingDependencies.length > 0) {
			display
                .blank()
				.warning(
					`The selected feature (e.g.: ${this.feature}) cannot be installed`,
				)
				.text(
					`The following features are needed by this feature: ${missingDependencies.join(', ')}`,
				)
				.tip('Start by installing them.');

			throw new Error();
		}

		// Confirm installation
		await this.handleConfirmation(`Ready to install "${this.feature}"?`);

        display.blank();

		try {
			await display.withDots(
				`Copying files to ${featurePath}`,
				async () => {
					if (this.debug === false) {
						// Create the feature directory
						await fs.mkdir(featurePath);

						// Copy files from source to feature directory
						await this.copyDirectory(sourcePath, featurePath, [
							'node_modules',
							'.git',
						]);

                        this.rollback.addUndoStep({
                            description: `Remove ${featurePath}`,
                            action: async () => {
                                await fs.rm(featurePath, { recursive: true, force: true });
                            }
                        })

						return `The files have been copied successfully`;
					} else {
						throw new Error(`Debug is ON`);
					}
				},
			);
		} catch {
			throw new Error();
		}

		if (manifest.entities.length === 0) {
			display
                .blank()
                .success(
				`Feature '${this.feature}' v${manifest.version} installed successfully!`,
			);

            void logToFile(`${this.feature} / ${this.mode}: v${manifest.version} installed`, this.historyFilePath);

            // We're done
			return;
		}

		// Continue with migrations
		display
            .blank()
			.note(`Database structure updates are required. Feature contains following entities: ${manifest.entities.join(', ')}`);
		try {
			await this.handleConfirmation(
				`Would you like to use the automated procedure for DB updates?`,
			);
		} catch {
			display
                .blank()
				.success(
					`Feature '${this.feature}' v${manifest.version} installed successfully!`,
				)
                .blank()
				.tip(
					"Don't forget to manually run migration:generate and migration:run to complete feature installation!",
				);

            void logToFile(`${this.feature} / ${this.mode}: Done (DB updates skipped)`, this.historyFilePath);

			// We're done
			return;
		}

		try {
			await display.withDots(
				`Generating migration for ${this.feature}`,
				async () => {
					if (this.debug === false) {
						const status = await this.executeMigrationGenerate();

						if (status === false) {
							throw new Error(
								`Migration generation failed. Please run it manually.`,
							);
						}

						return `Migration generated for ${this.feature}!`;
					} else {
						throw new Error(`Debug is ON`);
					}
				},
			);

			await display.withDots(`Running migration`, async () => {
				if (this.debug === false) {
					const status = await this.executeMigrationRun();

					if (status === false) {
						throw new Error(
							`Migration failed. Please run it manually.`,
						);
					}

					return `Migration run with success!`;
				} else {
					throw new Error(`Debug is ON`);
				}
			});

			display
                .blank()
                .success(
				`Feature '${this.feature}' v${manifest.version} installed successfully!`,
			);

            void logToFile(`${this.feature} / ${this.mode}: Done`, this.historyFilePath);
        } catch {
			throw new Error();
		}
	}
	//
	// private async upgradeFeature() {
	//     const sourcePath = path.join(this.baseSourcePath, this.feature);
	//     const featurePath = path.join(this.baseFeaturePath, this.feature);
	//     const sourceManifestPath = path.join(sourcePath, 'manifest.json');
	//     const currentManifestPath = path.join(featurePath, 'manifest.json');
	//
	//     console.log('🔄 Starting upgrade...\n');
	//
	//     // Check if source exists
	//     if (!(await this.pathExists(sourcePath))) {
	//         throw new Error(`Source package not found at: ${sourcePath}`);
	//     }
	//
	//     // Check if feature is installed
	//     if (!(await this.pathExists(featurePath))) {
	//         throw new Error(`Feature '${this.feature}' is not installed. Use 'install' mode instead.`);
	//     }
	//
	//     // Parse manifests
	//     let sourceManifest: Manifest;
	//     let currentManifest: Manifest;
	//
	//     try {
	//         sourceManifest = await this.parseManifest(sourceManifestPath);
	//         currentManifest = await this.parseManifest(currentManifestPath);
	//     } catch (error) {
	//         throw new Error(`Failed to parse manifests: ${error}`);
	//     }
	//
	//     console.log(`📦 Current version: ${currentManifest.version}`);
	//     console.log(`📦 New version: ${sourceManifest.version}\n`);
	//
	//     if (sourceManifest.version === currentManifest.version) {
	//         console.log('⚠️  Already at the same version');
	//         const reinstall = await this.askConfirmation('Do you want to reinstall anyway?');
	//         if (!reinstall) {
	//             console.log('Upgrade aborted by user');
	//             return;
	//         }
	//     }
	//
	//     // Check dependencies
	//     const missingDeps = await this.checkDependencies(sourceManifest);
	//     if (missingDeps.length > 0) {
	//         throw new Error(`Missing dependencies: ${missingDeps.join(', ')}. Install them first.`);
	//     }
	//
	//     // Confirm upgrade
	//     const confirm = await this.askConfirmation(
	//         `Upgrade '${this.feature}' from v${currentManifest.version} to v${sourceManifest.version}?`
	//     );
	//     if (!confirm) {
	//         console.log('Upgrade aborted by user');
	//         return;
	//     }
	//
	//     // Backup current feature
	//     console.log('\n💾 Creating backup...');
	//     const backupPath = `${featurePath}.backup.${Date.now()}`;
	//     await this.copyDirectory(featurePath, backupPath);
	//
	//     try {
	//         // Remove current installation
	//         await fs.rm(featurePath, { recursive: true, force: true });
	//
	//         // Install new version
	//         await fs.mkdir(featurePath, { recursive: true });
	//         await this.copyDirectory(sourcePath, featurePath, ['node_modules', '.git']);
	//
	//         // Run upgrade migrations if enabled
	//         if (sourceManifest.migrations) {
	//             console.log('\n🔄 Running upgrade migrations...');
	//             // This would typically run migration scripts between versions
	//             // Implementation depends on your migration system
	//         }
	//
	//         // Log upgrade
	//         await logToFile(
	//             `Feature ${this.feature} upgraded from v${currentManifest.version} to v${sourceManifest.version}`
	//         );
	//
	//         console.log(`\n✅ Feature '${this.feature}' upgraded successfully!`);
	//
	//         // Offer to clean up backup
	//         const cleanup = await this.askConfirmation('Remove backup directory?');
	//         if (cleanup) {
	//             await fs.rm(backupPath, { recursive: true, force: true });
	//             console.log('Backup removed');
	//         } else {
	//             console.log(`Backup kept at: ${backupPath}`);
	//         }
	//
	//     } catch (error) {
	//         // Restore from backup on error
	//         console.error('\n❌ Upgrade failed, restoring from backup...');
	//         if (await this.pathExists(backupPath)) {
	//             await fs.rm(featurePath, { recursive: true, force: true }).catch(() => {});
	//             await this.copyDirectory(backupPath, featurePath);
	//             await fs.rm(backupPath, { recursive: true, force: true });
	//             console.log('✅ Restored from backup');
	//         }
	//         throw error;
	//     }
	// }
}

// Main execution
async function main() {
    const basePath = '/var/www/html';
    const historyFilePath = path.join(basePath, 'history.txt');

	const manager = new FeatureManager({
        basePath: basePath,
        historyFilePath: historyFilePath,
        feature: process.argv[2],
        mode: process.argv[3] as Mode,
        debug: process.argv[4] === 'debug' || false,
        rollback: new ConsoleRollback(historyFilePath)
    });

	await manager
        .run();
}

main().catch(console.error);
