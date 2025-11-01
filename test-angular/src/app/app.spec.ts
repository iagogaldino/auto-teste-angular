import { TestBed, ComponentFixture } from '@angular/core/testing';
import { app } from './app';

describe('app', () => {
  let fixture: ComponentFixture<typeof app>;
  let component: InstanceType<typeof app>;

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

  it('should have a signal "title" with value "test-angular"', () => {
    expect(component['title']()).toBe('test-angular');
  });

  it('should render the app title in the template if present', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('test-angular');
  });
});