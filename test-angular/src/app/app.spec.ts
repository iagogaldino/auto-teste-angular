import { TestBed } from '@angular/core/testing';
import { app } from './app';

describe('app', () => {
  let fixture: any;
  let component: app;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [app],
    }).compileComponents();

    fixture = TestBed.createComponent(app);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the app component', () => {
    expect(component).toBeTruthy();
  });

  it('should have title signal initialized with "test-angular"', () => {
    expect(component.title()).toBe('test-angular');
  });
});