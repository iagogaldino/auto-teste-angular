import { TestBed } from '@angular/core/testing';
import { CalculatorComponent } from './calculator.component';

describe('CalculatorComponent', () => {
  let component: CalculatorComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [CalculatorComponent]
    });
    // Create the component instance
    const fixture = TestBed.createComponent(CalculatorComponent);
    component = fixture.componentInstance;
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize result signal with 0', () => {
    expect(component.result()).toBe(0);
  });

  it('addTenPlusTen should return 20', () => {
    expect(component.addTenPlusTen()).toBe(20);
  });

  it('calculate() should set result signal to 20', () => {
    // result starts as 0
    expect(component.result()).toBe(0);
    component.calculate();
    expect(component.result()).toBe(20);
  });
});