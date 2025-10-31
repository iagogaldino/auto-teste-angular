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

  it('should have initial result as 0', () => {
    expect(component.result()).toBe(0);
  });

  it('addTenPlusTen should return 20', () => {
    expect(component.addTenPlusTen()).toBe(20);
  });

  it('calculate should set result to 20', () => {
    component.calculate();
    expect(component.result()).toBe(20);
  });
});