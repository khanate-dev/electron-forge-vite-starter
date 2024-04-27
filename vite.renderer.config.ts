import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import eslint from 'vite-plugin-eslint';

import { pluginExposeRenderer } from './vite.base.config';

import type { ConfigEnv, UserConfig } from 'vite';

// https://vitejs.dev/config
// eslint-disable-next-line import/no-default-export
export default defineConfig((env) => {
	const forgeEnv = env as ConfigEnv<'renderer'>;
	const { root, mode, forgeConfigSelf } = forgeEnv;
	const name = forgeConfigSelf.name ?? '';

	return {
		root,
		mode,
		base: './',
		build: {
			outDir: `.vite/renderer/${name}`,
		},
		plugins: [pluginExposeRenderer(name), react(), eslint()],
		resolve: {
			preserveSymlinks: true,
		},
		clearScreen: false,
	} as UserConfig;
});
