import { TestBed } from '@angular/core/testing';
import { main } from './main';

describe('main (standalone entrypoint component)', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [main],
    });
  });

  it('should create the main component successfully', () => {
    const fixture = TestBed.createComponent(main);
    const instance = fixture.componentInstance;
    expect(instance).toBeTruthy();
  });

  it('should render the main component without errors', () => {
    const fixture = TestBed.createComponent(main);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled).toBeDefined();
  });
});