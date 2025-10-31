import { TestBed } from '@angular/core/testing';
import { bootstrapApplication } from '@angular/platform-browser';
import App from './main';
import appConfig from './app/app.config';
import main from './main';

jest.mock('@angular/platform-browser', () => ({
  bootstrapApplication: jest.fn(() => Promise.resolve())
}));

jest.spyOn(console, 'error').mockImplementation(() => {});

describe('main', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should bootstrap the App component with appConfig', async () => {
    const mockBootstrap = bootstrapApplication as jest.Mock;
    mockBootstrap.mockResolvedValueOnce(undefined);

    // Re-require main to trigger the bootstrap logic
    await import('./main');

    expect(bootstrapApplication).toHaveBeenCalledWith(App, appConfig);
  });

  it('should log error if bootstrapApplication rejects', async () => {
    const error = new Error('bootstrap failed');
    (bootstrapApplication as jest.Mock).mockRejectedValueOnce(error);

    await import('./main');

    expect(console.error).toHaveBeenCalledWith(error);
  });
});