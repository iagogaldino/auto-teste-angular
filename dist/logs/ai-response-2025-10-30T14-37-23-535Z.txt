import { TestBed } from '@angular/core/testing';
import { CalculatorComponent } from './calculator.component';

describe('CalculatorComponent', () => {
  let component: CalculatorComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [CalculatorComponent],
    });
    // Criação manual já que é standalone e não precisa de fixture para testar métodos e signals
    component = TestBed.createComponent(CalculatorComponent).componentInstance;
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should have initial result as 0', () => {
    expect(component.result()).toBe(0);
  });

  it('should calculate and set result to 20 when calculate() is called', () => {
    component.calculate();
    expect(component.result()).toBe(20);
  });

  it('addTenPlusTen should return 20', () => {
    expect(component.addTenPlusTen()).toBe(20);
  });
});