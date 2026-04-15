import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    environment: 'node',
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      // astro:content is a virtual module only available inside the Astro
      // runtime.  Map it to a filesystem-based mock for unit tests.
      'astro:content': resolve(__dirname, 'src/__tests__/__mocks__/astro-content.ts'),
    },
  },
});
