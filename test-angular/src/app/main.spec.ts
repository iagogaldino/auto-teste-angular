import { TestBed } from '@angular/core/testing';
import { bootstrapApplication } from '@angular/platform-browser';
import App from './main';
import appConfig from './app/app.config';

jest.mock('@angular/platform-browser', () => ({
  bootstrapApplication: jest.fn(),
}));

describe('main', () => {
  it('should call bootstrapApplication with App and appConfig', () => {
    require('./main');
    expect(bootstrapApplication).toHaveBeenCalledWith(App, appConfig);
  });

  it('should log error if bootstrapApplication rejects', async () => {
    const error = new Error('bootstrap error');
    (bootstrapApplication as jest.Mock).mockImplementationOnce(() => Promise.reject(error));
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    try {
      require('./main');
      // Wait a tick for the .catch to execute
      await Promise.resolve();
      expect(consoleErrorSpy).toHaveBeenCalledWith(error);
    } finally {
      consoleErrorSpy.mockRestore();
    }
  });
});