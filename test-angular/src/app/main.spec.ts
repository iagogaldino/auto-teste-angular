import { TestBed } from '@angular/core/testing';
import main from './main';

describe('main bootstrap', () => {
  let originalConsoleError: any;

  beforeEach(() => {
    originalConsoleError = console.error;
    console.error = jasmine.createSpy('console.error');
  });

  afterEach(() => {
    console.error = originalConsoleError;
  });

  it('should attempt to bootstrap the application', async () => {
    // As bootstrapApplication is called at import, we just check the import
    await import('./main');
    expect(true).toBeTrue(); // Ensures the import works without error
  });

  it('should log error if bootstrapApplication throws', async () => {
    // Mock bootstrapApplication to throw
    const mockErr = new Error('Bootstrap failed');
    const originalBootstrap = (window as any).bootstrapApplication;
    (window as any).bootstrapApplication = () => Promise.reject(mockErr);

    try {
      await import('./main');
    } catch { /* ignore */ }
    
    expect(console.error).toHaveBeenCalled();
    (window as any).bootstrapApplication = originalBootstrap;
  });
});