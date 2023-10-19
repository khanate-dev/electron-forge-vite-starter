import { defineConfig } from 'vite';

// https://vitejs.dev/config
// eslint-disable-next-line import/no-default-export
export default defineConfig({
	build: {
		rollupOptions: {
			external: ['serialport'],
		},
	},
	resolve: {
		// Some libs that can run in both Web and Node.js, such as `axios`, we need to tell Vite to build them in Node.js.
		browserField: false,
		mainFields: ['module', 'jsnext:main', 'jsnext'],
	},
});
