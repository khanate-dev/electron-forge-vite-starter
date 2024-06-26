import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

import { MakerDeb } from '@electron-forge/maker-deb';
import { MakerSquirrel } from '@electron-forge/maker-squirrel';
import { AutoUnpackNativesPlugin } from '@electron-forge/plugin-auto-unpack-natives';
import { FusesPlugin } from '@electron-forge/plugin-fuses';
import { VitePlugin } from '@electron-forge/plugin-vite';
import { PublisherGithub } from '@electron-forge/publisher-github';
import { FuseV1Options, FuseVersion } from '@electron/fuses';

import { electronConfig } from './src/electron/electron.config';

import type { ForgeConfig } from '@electron-forge/shared-types';

const config: ForgeConfig = {
	packagerConfig: {
		icon: electronConfig.icoIcon,
		name: electronConfig.id,
		executableName: electronConfig.id,
		asar: true,
	},
	rebuildConfig: {},
	makers: [
		new MakerSquirrel({
			name: electronConfig.id,
			description: electronConfig.description,
			exe: electronConfig.name,
			setupExe: electronConfig.id,
			setupIcon: electronConfig.icoIcon,
		}),
		new MakerDeb({
			options: {
				name: electronConfig.id,
				icon: electronConfig.pngIcon,
				categories: ['Office', 'Utility'],
				genericName: electronConfig.name,
				description: electronConfig.description,
				productName: electronConfig.name,
				productDescription: electronConfig.description,
				section: 'javascript',
			},
		}),
	],
	publishers: [
		new PublisherGithub({
			repository: electronConfig.repository,
		}),
	],
	plugins: [
		new VitePlugin({
			// `build` can specify multiple entry builds, which can be Main process, Preload scripts, Worker process, etc.
			// If you are familiar with Vite configuration, it will look really familiar.
			build: [
				{
					// `entry` is just an alias for `build.lib.entry` in the corresponding file of `config`.
					entry: 'src/electron/main.ts',
					config: 'vite.main.config.ts',
				},
				{
					entry: 'src/electron/preload.ts',
					config: 'vite.preload.config.ts',
				},
			],
			renderer: [
				{
					name: 'main_window',
					config: 'vite.renderer.config.ts',
				},
			],
		}),
		new AutoUnpackNativesPlugin({}),
		// Fuses are used to enable/disable various Electron functionality
		// at package time, before code signing the application
		new FusesPlugin({
			version: FuseVersion.V1,
			[FuseV1Options.RunAsNode]: false,
			[FuseV1Options.EnableCookieEncryption]: true,
			[FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
			[FuseV1Options.EnableNodeCliInspectArguments]: false,
			[FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
			[FuseV1Options.OnlyLoadAppFromAsar]: true,
		}),
	],
	// ? https://github.com/serialport/node-serialport/issues/2464#issuecomment-1516887882
	hooks: {
		packageAfterPrune: async (_, buildPath, __, platform) => {
			return new Promise((resolve, reject) => {
				const oldPackageJson = path.join(buildPath, 'package.json');
				const newPackageJson = path.join(buildPath, '_package.json');

				fs.renameSync(oldPackageJson, newPackageJson);

				const args = [
					'install',
					'--no-package-lock',
					'--no-save',
					'serialport',
				];
				const npmInstall = spawn('npm', args, {
					cwd: buildPath,
					stdio: 'inherit',
					shell: true,
				});

				npmInstall.on('close', (code) => {
					if (code === 0) {
						fs.renameSync(newPackageJson, oldPackageJson);

						/**
						 * On windows code signing fails for ARM binaries etc.,
						 * we remove them here
						 */
						if (platform === 'win32') {
							const problematicPaths = [
								'android-arm',
								'android-arm64',
								'darwin-x64+arm64',
								'linux-arm',
								'linux-arm64',
								'linux-x64',
							];

							problematicPaths.forEach((binaryFolder) => {
								fs.rmSync(
									path.join(
										buildPath,
										'node_modules',
										'@serialport',
										'bindings-cpp',
										'prebuilds',
										binaryFolder,
									),
									{ recursive: true, force: true },
								);
							});
						} else if (platform === 'darwin' || platform === 'linux') {
							fs.unlinkSync(
								path.join(
									buildPath,
									'node_modules',
									'@serialport',
									'bindings-cpp',
									'build',
									'node_gyp_bins',
									'python3',
								),
							);
						}

						resolve();
					} else {
						reject(
							new Error(`process finished with error code ${code ?? 'null'}`),
						);
					}
				});

				npmInstall.on('error', (error) => {
					reject(error);
				});
			});
		},
	},
};

// eslint-disable-next-line import/no-default-export
export default config;
