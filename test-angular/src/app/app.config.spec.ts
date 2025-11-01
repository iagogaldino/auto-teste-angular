import { TestBed } from '@angular/core/testing';
import { ROUTES } from '@angular/router';
import { appConfig } from './app.config';
import { routes } from './app.routes';

describe('appConfig', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: appConfig.providers
    });
  });

  it('should be an object with a providers array', () => {
    expect(typeof appConfig).toBe('object');
    expect(Array.isArray(appConfig.providers)).toBe(true);
    expect(appConfig.providers.length).toBeGreaterThan(0);
  });

  it('should register ROUTES provider with configured routes', () => {
    const r = TestBed.inject(ROUTES);
    const flatRoutes = Array.isArray(r) ? (r.flat ? r.flat(Infinity) : ([] as any[]).concat(...r)) : [];
    expect(Array.isArray(flatRoutes)).toBe(true);
    if (routes && Array.isArray(routes) && routes.length) {
      expect(flatRoutes).toEqual(expect.arrayContaining(routes));
    }
  });

  it('should initialize TestBed without errors', () => {
    expect(() => TestBed.inject(ROUTES)).not.toThrow();
  });
});