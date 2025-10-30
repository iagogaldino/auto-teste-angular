import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CalculatorComponent } from './calculator.component';

describe('CalculatorComponent', () => {
  let component: CalculatorComponent;
  let fixture: ComponentFixture<CalculatorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CalculatorComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(CalculatorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with result 0', () => {
    expect(component.result()).toBe(0);
  });

  it('should calculate 10 + 10 correctly', () => {
    component.calculate();
    expect(component.result()).toBe(20);
  });

  it('should return 20 from addTenPlusTen function', () => {
    const result = component.addTenPlusTen();
    expect(result).toBe(20);
  });

  it('should display initial result in template', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const resultElement = compiled.querySelector('.result');
    expect(resultElement?.textContent).toBe('0');
  });

  it('should display operation text in template', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const operationElement = compiled.querySelector('.operation');
    expect(operationElement?.textContent).toBe('10 + 10 = ?');
  });

  it('should update display when calculate is called', () => {
    component.calculate();
    fixture.detectChanges();
    
    const compiled = fixture.nativeElement as HTMLElement;
    const resultElement = compiled.querySelector('.result');
    expect(resultElement?.textContent).toBe('20');
  });

  it('should call calculate when button is clicked', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const calculateButton = compiled.querySelector('.btn-calculate') as HTMLButtonElement;
    
    calculateButton.click();
    expect(component.result()).toBe(20);
  });

  it('should have correct button text', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const calculateButton = compiled.querySelector('.btn-calculate') as HTMLButtonElement;
    expect(calculateButton.textContent).toBe('Calcular 10 + 10');
  });

  it('should have correct title', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const titleElement = compiled.querySelector('h2');
    expect(titleElement?.textContent).toBe('Calculadora Simples');
  });
});