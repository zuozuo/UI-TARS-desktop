import { defineConfig } from 'tsup';

export default defineConfig((options) => {
  return {
    entry: ['src/**/*.ts'],
    format: ['esm', 'cjs'],
    dts: true,
    clean: true,
    bundle: false,
    outDir: 'dist',
  };
});
