import { getTestBed } from '@angular/core/testing';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';
import setupJest from './setup-jest';

describe('setup-jest', () => {
  beforeEach(() => {
    // Sempre reseta o ambiente de teste antes de cada teste
    try {
      getTestBed().resetTestEnvironment();
    } catch (e) {
      // Em alguns ambientes, pode lançar erro se não foi inicializado; ignorar
    }
  });

  it('should initialize the Angular test environment without errors', () => {
    expect(() => {
      getTestBed().initTestEnvironment(
        BrowserDynamicTestingModule,
        platformBrowserDynamicTesting()
      );
    }).not.toThrow();
  });

  it('should throw if test environment is initialized twice without reset', () => {
    getTestBed().initTestEnvironment(
      BrowserDynamicTestingModule,
      platformBrowserDynamicTesting()
    );
    expect(() => {
      getTestBed().initTestEnvironment(
        BrowserDynamicTestingModule,
        platformBrowserDynamicTesting()
      );
    }).toThrow(new Error('Cannot set base providers because it has already been called'));
  });

  it('should allow re-initialization after resetTestEnvironment', () => {
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