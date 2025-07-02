import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    browser: {
      enabled: true,
      provider: 'playwright',
      // https://vitest.dev/guide/browser/playwright
      instances: [
        {
          name: 'chromium',
          browser: 'chromium'
        }
      ],
    },
  },
})
