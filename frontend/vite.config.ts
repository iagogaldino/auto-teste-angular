import { defineConfig } from 'vite';

// Workaround for Vite trying to resolve an ESM5 entry that RxJS 7 no longer ships.
// We force resolution to the ESM2015 build which is what Angular expects.
export default defineConfig({
  resolve: {
    alias: {
      rxjs: 'rxjs/dist/esm2015/index.js',
    },
  },
  optimizeDeps: {
    include: ['rxjs'],
  },
});


