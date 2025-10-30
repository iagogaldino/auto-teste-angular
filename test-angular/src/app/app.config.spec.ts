import { TestBed } from '@angular/core/testing';
import appConfig from './app.config';
import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';

describe('appConfig', () => {
  it('should be defined', () => {
    expect(appConfig).toBeDefined();
  });

  it('should be assignable to ApplicationConfig', () => {
    // Type check: just assignment
    const config: ApplicationConfig = appConfig;
    expect(config).toBeTruthy();
  });

  it('should provide global error listeners', () => {
    const providers = appConfig.providers;
    const hasErrorListeners = providers.some(
      prov => JSON.stringify(prov).includes('BrowserGlobalErrorListeners')
    );
    expect(hasErrorListeners).toBeTrue();
  });

  it('should provide zone change detection with eventCoalescing true', () => {
    const providers = appConfig.providers;
    const hasZoneChangeDetection = providers.some(
      prov => JSON.stringify(prov).includes('"eventCoalescing":true')
    );
    expect(hasZoneChangeDetection).toBeTrue();
  });

  it('should provide router with correct routes', () => {
    const providers = appConfig.providers;
    // Check if provideRouter is called with the correct routes
    const hasRouterProvider = providers.some(
      prov =>
        (prov && prov.provide && prov.provide.toString().includes('ROUTES')) ||
        (typeof prov === 'object' && prov && JSON.stringify(prov).includes(JSON.stringify(routes)))
    );
    expect(hasRouterProvider).toBeTrue();
  });
});