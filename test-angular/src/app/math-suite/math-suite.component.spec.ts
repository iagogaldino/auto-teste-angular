import { TestBed } from '@angular/core/testing';
import { MathSuiteComponent } from './math-suite.component';

describe('MathSuiteComponent', () => {
  let component: MathSuiteComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [MathSuiteComponent],
    });
    const fixture = TestBed.createComponent(MathSuiteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize a and b with default values', () => {
    expect(component.a()).toBe(12);
    expect(component.b()).toBe(8);
  });

  it('should calculate sum, diff, prod, quot, pow correctly', () => {
    expect(component.sum()).toBe(20);
    expect(component.diff()).toBe(4);
    expect(component.prod()).toBe(96);
    expect(component.quot()).toBe(1.5);
    expect(component.pow()).toBe(Math.pow(12, 8));
  });

  it('should recalculate when a and b are set', () => {
    component.setA(10);
    component.setB(5);
    expect(component.a()).toBe(10);
    expect(component.b()).toBe(5);
    expect(component.sum()).toBe(15);
    expect(component.diff()).toBe(5);
    expect(component.prod()).toBe(50);
    expect(component.quot()).toBe(2);
    expect(component.pow()).toBe(Math.pow(10, 5));
  });

  it('should handle setA and setB with string and number inputs', () => {
    component.setA('7');
    expect(component.a()).toBe(7);

    component.setB(3);
    expect(component.b()).toBe(3);

    component.setA('');
    expect(component.a()).toBe(0);

    component.setB(null);
    expect(component.b()).toBe(0);

    const prevA = component.a();
    component.setA(undefined as any);
    expect(component.a()).toBe(prevA);

    const prevB = component.b();
    component.setB('abc');
    expect(component.b()).toBe(prevB);

    component.setA([1,2] as any);
    expect(component.a()).toBe(prevA);

    component.setB({} as any);
    expect(component.b()).toBe(prevB);
  });

  it('should compute GCD and LCM correctly', () => {
    component.setA(12);
    component.setB(8);
    expect(component.gcd()).toBe(4);
    expect(component.lcm()).toBe(24);

    component.setA(0);
    component.setB(0);
    expect(component.gcd()).toBe(0);
    expect(component.lcm()).toBe(0);

    component.setA(15);
    component.setB(25);
    expect(component.gcd()).toBe(5);
    expect(component.lcm()).toBe(75);

    component.setA(-21);
    component.setB(14);
    expect(component.gcd()).toBe(7);
  });

  it('should check isPrime for a and b', () => {
    component.setA(13);
    component.setB(17);
    expect(component.isAPrime()).toBe(true);
    expect(component.isBPrime()).toBe(true);

    component.setA(4);
    component.setB(9);
    expect(component.isAPrime()).toBe(false);
    expect(component.isBPrime()).toBe(false);

    component.setA(-3);
    expect(component.isAPrime()).toBe(false);

    component.setA(2.9); // should floor to 2
    expect(component.isAPrime()).toBe(true);

    component.setA(1);
    expect(component.isAPrime()).toBe(false);

    component.setA(3);
    expect(component.isAPrime()).toBe(true);
  });

  it('should compute factorialSafe for a and b', () => {
    component.setA(5);
    component.setB(0);
    expect(component.factorialA()).toBe(120);
    expect(component.factorialB()).toBe(1);

    component.setA(-1);
    expect(component.factorialA()).toBe('NaN');

    component.setA(21); // >20
    expect(component.factorialA()).toBe('Overflow');

    component.setA(20); // limit
    expect(component.factorialA()).toBe(2432902008176640000);

    component.setB(7.6); // should floor to 7
    expect(component.factorialB()).toBe(5040);
  });

  it('should compute fibonacciSafe for a and b', () => {
    component.setA(0);
    component.setB(1);
    expect(component.fibA()).toBe(0);
    expect(component.fibB()).toBe(1);

    component.setA(-2);
    expect(component.fibA()).toBe('NaN');

    component.setA(71); // >70
    expect(component.fibA()).toBe('Overflow');

    component.setB(10.9); // should floor to 10
    expect(component.fibB()).toBe(55);

    component.setA(7);
    expect(component.fibA()).toBe(13);
  });

  it('should handle division by zero in quot', () => {
    component.setB(0);
    expect(Number.isNaN(component.quot())).toBe(true);

    component.setA(0);
    component.setB(4);
    expect(component.quot()).toBe(0);

    component.setA(5);
    component.setB(-0); // -0 is still zero
    expect(Number.isNaN(component.quot())).toBe(true);
  });

});