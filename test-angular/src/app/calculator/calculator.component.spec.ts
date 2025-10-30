import { TestBed } from '@angular/core/testing';
import { CalculatorComponent } from './calculator.component';

describe('CalculatorComponent', () => {
  let component: CalculatorComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [CalculatorComponent]
    });
    const fixture = TestBed.createComponent(CalculatorComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize result signal with 0', () => {
    expect(component.result()).toBe(0);
  });

  it('should set result to 20 when calculate is called', () => {
    component.calculate();
    expect(component.result()).toBe(20);
  });

  it('addTenPlusTen should return 20', () => {
    expect(component.addTenPlusTen()).toBe(20);
  });
});