import { TestBed } from '@angular/core/testing';
import { routes } from './app.routes';

describe('app.routes', () => {
  beforeEach(() => {
    // No TestBed configuration needed since this is a routes array, not a component or service
  });

  it('should be defined', () => {
    expect(routes).toBeDefined();
  });

  it('should be an array', () => {
    expect(Array.isArray(routes)).toBe(true);
  });

  it('should be empty initially', () => {
    expect(routes.length).toBe(0);
  });
});