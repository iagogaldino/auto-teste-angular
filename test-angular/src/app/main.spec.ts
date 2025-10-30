import { TestBed } from '@angular/core/testing';
import * as platformBrowser from '@angular/platform-browser';
import main from './main';

describe('main bootstrap', () => {
  let bootstrapApplicationSpy: jasmine.Spy;

  beforeEach(() => {
    bootstrapApplicationSpy = spyOn(platformBrowser, 'bootstrapApplication').and.returnValue(Promise.resolve());
  });

  it('should call bootstrapApplication with App and appConfig', () => {
    // Re-import the main module to trigger the code
    // Delete from require cache if running in Node
    Object.keys(require.cache).forEach((key) => {
      if (key.endsWith('main.ts')) {
        delete require.cache[key];
      }
    });

    // Import main.ts to execute the bootstrap logic
    require('./main');

    expect(bootstrapApplicationSpy).toHaveBeenCalled();
    const [App, appConfig] = bootstrapApplicationSpy.calls.mostRecent().args;
    expect(App).toBeDefined();
    expect(appConfig).toBeDefined();
  });

  it('should log error if bootstrapApplication promise rejects', (done) => {
    const error = new Error('bootstrap error');
    bootstrapApplicationSpy.and.returnValue(Promise.reject(error));
    const consoleErrorSpy = spyOn(console, 'error');

    // Delete from require cache if running in Node
    Object.keys(require.cache).forEach((key) => {
      if (key.endsWith('main.ts')) {
        delete require.cache[key];
      }
    });

    require('./main');

    setTimeout(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith(error);
      done();
    }, 0);
  });
});