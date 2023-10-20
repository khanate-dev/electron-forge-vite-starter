export const electronConfig = {
	id: 'electron-starter',
	name: 'Electron Starter',
	description: 'Electron Vite React Application',
	icnsIcon: './src/app/assets/favicon/icons/mac/icns.ico',
	icoIcon: './src/app/assets/favicon/icons/win/icon.ico',
	pngIcon: './src/app/assets/favicon/favicon.png',
	repository: {
		owner: 'khanate-dev',
		name: 'electron-starter',
	},
	env: MAIN_WINDOW_VITE_DEV_SERVER_URL ? 'development' : 'production',
} as const;
