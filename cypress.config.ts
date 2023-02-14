import { defineConfig } from "cypress";


// @see #204 baseUrl: 'http://localhost:8090'
export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:8090/demo/',
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
  },
});
