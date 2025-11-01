import { getTestBed } from '@angular/core/testing';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';
import setupJest from './setup-jest';

describe('setup-jest', () => {
  beforeEach(() => {
    getTestBed().resetTestEnvironment();
  });

  it('should initialize the test environment without error', () => {
    expect(() => {
      getTestBed().initTestEnvironment(
        BrowserDynamicTestingModule,
        platformBrowserDynamicTesting()
      );
    }).not.toThrow();
  });

  it('should allow re-initialization after reset', () => {
    getTestBed().initTestEnvironment(
      BrowserDynamicTestingModule,
      platformBrowserDynamicTesting()
    );
    getTestBed().resetTestEnvironment();
    expect(() => {
      getTestBed().initTestEnvironment(
        BrowserDynamicTestingModule,
        platformBrowserDynamicTesting()
      );
    }).not.toThrow();
  });
});