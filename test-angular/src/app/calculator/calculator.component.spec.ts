import { TestBed, ComponentFixture } from '@angular/core/testing';
import { CalculatorComponent } from './calculator.component';

describe('CalculatorComponent', () => {
  let fixture: ComponentFixture<CalculatorComponent>;
  let component: CalculatorComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CalculatorComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CalculatorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should have initial result as 0', () => {
    expect(component.result()).toBe(0);
  });

  it('should set result to 20 after calculate()', () => {
    component.calculate();
    expect(component.result()).toBe(20);
  });

  it('addTenPlusTen() should return 20', () => {
    expect(component.addTenPlusTen()).toBe(20);
  });
});