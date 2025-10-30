import {
  TestBed
} from '@angular/core/testing';
import {
  CalculatorComponent
} from './calculator.component';
describe('CalculatorComponent',
() => {
  let component: CalculatorComponent;
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [CalculatorComponent]
    });
    const fixture = TestBed.createComponent(CalculatorComponent);
    component = fixture.componentInstance;
  });
  it('should create the calculator component',
  () => {
    expect(component).toBeTruthy();
  });
  it('should have initial result value of 0',
  () => {
    expect(component.result()).toBe(0);
  });
  it('should update result value to 20 when calculate method is called',
  () => {
    component.calculate();
    expect(component.result()).toBe(20);
  });
  it('should return 20 when addTenPlusTen method is called',
  () => {
    const result = component.addTenPlusTen();
    expect(result).toBe(20);
  });
});