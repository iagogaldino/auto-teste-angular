import main from './main';

describe('main bootstrap', () => {
  let originalConsoleError: typeof console.error;

  beforeEach(() => {
    originalConsoleError = console.error;
    console.error = jest.fn();
    jest.resetModules();
  });

  afterEach(() => {
    console.error = originalConsoleError;
  });

  it('should bootstrap without throwing error', async () => {
    const mockBootstrap = jest.fn().mockResolvedValue(undefined);
    jest.doMock('@angular/platform-browser', () => ({
      bootstrapApplication: mockBootstrap,
    }));
    const { default: mainFile } = await import('./main');
    expect(mockBootstrap).toHaveBeenCalled();
  });

  it('should catch and log errors thrown during bootstrap', async () => {
    const error = new Error('Bootstrap failed');
    const mockBootstrap = jest.fn().mockRejectedValue(error);
    jest.doMock('@angular/platform-browser', () => ({
      bootstrapApplication: mockBootstrap,
    }));
    await import('./main');
    expect(console.error).toHaveBeenCalledWith(error);
  });
});