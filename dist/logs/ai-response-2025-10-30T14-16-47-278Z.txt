import { routes } from './app.routes';

describe('app.routes', () => {
  it('should be defined', () => {
    expect(routes).toBeDefined();
  });

  it('should be an array', () => {
    expect(Array.isArray(routes)).toBeTrue();
  });

  it('should be an empty array initially', () => {
    expect(routes.length).toBe(0);
  });
});