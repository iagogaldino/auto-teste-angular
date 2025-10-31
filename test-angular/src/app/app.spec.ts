import { TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import App from './app';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
    }).compileComponents();
  });

  it('should create the App component', () => {
    const fixture = TestBed.createComponent(App);
    const appInstance = fixture.componentInstance;
    expect(appInstance).toBeTruthy();
  });

  it('should have "title" signal initialized with "test-angular"', () => {
    const fixture = TestBed.createComponent(App);
    const appInstance = fixture.componentInstance;
    expect(appInstance.title()).toBe('test-angular');
  });
});