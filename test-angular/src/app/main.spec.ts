import main from './main';

describe('main bootstrap', () => {
  let originalConsoleError: any;

  beforeEach(() => {
    originalConsoleError = console.error;
    console.error = jest.fn();
    jest.resetModules();
  });

  afterEach(() => {
    console.error = originalConsoleError;
  });

  it('should call bootstrapApplication with correct arguments', async () => {
    const mockBootstrapApplication = jest.fn().mockReturnValue(Promise.resolve());
    jest.doMock('@angular/platform-browser', () => ({
      bootstrapApplication: mockBootstrapApplication
    }));
    const mockAppConfig = {};
    const mockApp = {};
    jest.doMock('./app/app.config', () => ({ default: mockAppConfig, __esModule: true }));
    jest.doMock('./app/app', () => ({ default: mockApp, __esModule: true }));

    await import('./main');
    expect(mockBootstrapApplication).toHaveBeenCalledWith(mockApp, mockAppConfig);
  });

  it('should catch error and call console.error', async () => {
    const error = new Error('bootstrap failed');
    const mockBootstrapApplication = jest.fn().mockReturnValue(Promise.reject(error));
    jest.doMock('@angular/platform-browser', () => ({
      bootstrapApplication: mockBootstrapApplication
    }));
    const mockAppConfig = {};
    const mockApp = {};
    jest.doMock('./app/app.config', () => ({ default: mockAppConfig, __esModule: true }));
    jest.doMock('./app/app', () => ({ default: mockApp, __esModule: true }));

    await import('./main');
    expect(console.error).toHaveBeenCalledWith(error);
  });
});