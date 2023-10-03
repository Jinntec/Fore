import { defineConfig } from "cypress";

export default defineConfig({
	e2e: {
		baseUrl: 'http://localhost:8090/demo/',
		experimentalStudio: true,

		setupNodeEvents(on, config) {
			// implement node event listeners here
		},
	},
	// The Cypress user agent breaks es-dev-server
	userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36'
});
