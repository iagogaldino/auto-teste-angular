import appConfig from './app.config';

describe('appConfig', () => {
  it('should be defined', () => {
    expect(appConfig).toBeDefined();
  });

  it('should have a providers array', () => {
    expect(appConfig.providers).toBeDefined();
    expect(Array.isArray(appConfig.providers)).toBeTrue();
  });

  it('should include provideBrowserGlobalErrorListeners provider', () => {
    const hasProvider = appConfig.providers.some(
      (provider: any) =>
        typeof provider === 'object' &&
        provider.provide &&
        provider.useFactory &&
        provider.provide.toString().includes('ErrorHandler')
    );
    expect(hasProvider).toBeTrue();
  });

  it('should include provideZoneChangeDetection with eventCoalescing true', () => {
    const hasZoneProvider = appConfig.providers.some(
      (provider: any) =>
        typeof provider === 'object' &&
        provider.provide &&
        provider.useFactory &&
        provider.useFactory.toString().includes('eventCoalescing:!0')
    );
    expect(hasZoneProvider).toBeTrue();
  });

  it('should include provideRouter with routes', () => {
    const hasRouter = appConfig.providers.some(
      (provider: any) =>
        typeof provider === 'object' &&
        provider.provide &&
        provider.provide.toString().includes('ROUTES')
    );
    expect(hasRouter).toBeTrue();
  });
});