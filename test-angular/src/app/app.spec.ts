import { TestBed } from '@angular/core/testing';
import { ComponentFixture } from '@angular/core/testing';
import App from './app';

describe('App', () => {
  let fixture: ComponentFixture<App>;
  let component: App;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
    }).compileComponents();

    fixture = TestBed.createComponent(App);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the app component', () => {
    expect(component).toBeTruthy();
  });

  it('should have title signal with value "test-angular"', () => {
    expect(component.title()).toBe('test-angular');
  });
});