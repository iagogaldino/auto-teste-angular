import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection,
  Provider,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { appConfig } from './app.config';

jest.mock('@angular/core', () => ({
  provideBrowserGlobalErrorListeners: jest.fn(() => ({ provide: 'BrowserGlobalErrorListeners' })),
  provideZoneChangeDetection: jest.fn(() => ({ provide: 'ZoneChangeDetection' })),
  provideRouter: jest.fn(() => ({ provide: 'Router', useValue: {} })),
}));

jest.mock('./app.routes', () => ({
  routes: [{ path: '', component: class DummyComponent {} }],
}));

describe('appConfig', () => {
  it('should be a valid ApplicationConfig', () => {
    expect(appConfig).toBeTruthy();
    expect(appConfig.providers).toBeInstanceOf(Array);
  });

  it('should call Angular provider functions correctly', () => {
    expect(provideBrowserGlobalErrorListeners).toHaveBeenCalled();
    expect(provideZoneChangeDetection).toHaveBeenCalledWith({ eventCoalescing: true });
    expect(provideRouter).toHaveBeenCalledWith(routes);
  });

  it('should include expected providers', () => {
    // Faz cast para `any` porque o array pode conter EnvironmentProviders
    const providerTokens = (appConfig.providers as any[]).map((p: any) => p.provide);

    expect(providerTokens).toContain('BrowserGlobalErrorListeners');
    expect(providerTokens).toContain('ZoneChangeDetection');
    expect(providerTokens).toContain('Router');
  });
});
