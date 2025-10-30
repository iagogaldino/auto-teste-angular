import { TestBed } from '@angular/core/testing';
import { bootstrapApplication } from '@angular/platform-browser';
import App from './app/app';
import appConfig from './app/app.config';

jest.mock('@angular/platform-browser', () => ({
  bootstrapApplication: jest.fn(() => Promise.resolve())
}));

describe('main', () => {
  it('should call bootstrapApplication with App and appConfig', async () => {
    const { bootstrapApplication } = require('@angular/platform-browser');
    require('./main');
    expect(bootstrapApplication).toHaveBeenCalledWith(App, appConfig);
  });

  it('should log error if bootstrapApplication rejects', async () => {
    const error = new Error('Bootstrap failed');
    const { bootstrapApplication } = require('@angular/platform-browser');
    (bootstrapApplication as jest.Mock).mockReturnValueOnce(Promise.reject(error));
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    // Reload the module to re-trigger the bootstrap
    jest.resetModules();
    require('./main');
    // Wait for microtasks to flush
    await new Promise(process.nextTick);
    expect(consoleErrorSpy).toHaveBeenCalledWith(error);
    consoleErrorSpy.mockRestore();
  });
});