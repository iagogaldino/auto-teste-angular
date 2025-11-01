import { routes } from './app.routes';

describe('app.routes', () => {
  beforeEach(() => {
    // No TestBed configuration needed as we are just testing the exported "routes"
  });

  it('should be defined', () => {
    expect(routes).toBeDefined();
  });

  it('should be an array', () => {
    expect(Array.isArray(routes)).toBe(true);
  });

  it('should have length 0', () => {
    expect(routes.length).toBe(0);
  });
});