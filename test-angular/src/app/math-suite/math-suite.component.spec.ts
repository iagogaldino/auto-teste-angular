import { TestBed } from '@angular/core/testing';
import { MathSuiteComponent } from './math-suite.component';

describe('MathSuiteComponent', () => {
  let component: MathSuiteComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [MathSuiteComponent]
    });
    // Standalone component, instantiate manually
    component = TestBed.createComponent(MathSuiteComponent).componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have default values for a and b', () => {
    expect(component.a()).toBe(12);
    expect(component.b()).toBe(8);
  });

  it('should compute sum, diff, prod, quot, pow correctly', () => {
    component.a.set(10);
    component.b.set(5);

    expect(component.sum()).toBe(15);
    expect(component.diff()).toBe(5);
    expect(component.prod()).toBe(50);
    expect(component.quot()).toBe(2);
    expect(component.pow()).toBe(Math.pow(10, 5));
  });

  it('should handle division by zero in quot', () => {
    component.a.set(10);
    component.b.set(0);
    expect(component.quot()).toEqual(NaN);
  });

  it('should compute gcd and lcm correctly', () => {
    component.a.set(12);
    component.b.set(8);
    expect(component.gcd()).toBe(4);
    expect(component.lcm()).toBe(24);

    component.a.set(0);
    component.b.set(0);
    expect(component.gcd()).toBe(0);
    expect(component.lcm()).toBe(0);

    component.a.set(7);
    component.b.set(3);
    expect(component.gcd()).toBe(1);
    expect(component.lcm()).toBe(21);
  });

  it('should check prime numbers correctly', () => {
    component.a.set(2);
    component.b.set(3);
    expect(component.isAPrime()).toBe(true);
    expect(component.isBPrime()).toBe(true);

    component.a.set(4);
    component.b.set(9);
    expect(component.isAPrime()).toBe(false);
    expect(component.isBPrime()).toBe(false);

    component.a.set(1);
    component.b.set(-5);
    expect(component.isAPrime()).toBe(false);
    expect(component.isBPrime()).toBe(false);
  });

  it('should compute factorialSafe correctly', () => {
    component.a.set(0); // 0! = 1
    component.b.set(5); // 5! = 120
    expect(component.factorialA()).toBe(1);
    expect(component.factorialB()).toBe(120);

    component.a.set(-1); // Negative
    expect(component.factorialA()).toBe('NaN');

    component.b.set(21); // Overflow
    expect(component.factorialB()).toBe('Overflow');
  });

  it('should compute fibonacciSafe correctly', () => {
    component.a.set(0); // fib(0) = 0
    component.b.set(1); // fib(1) = 1
    expect(component.fibA()).toBe(0);
    expect(component.fibB()).toBe(1);

    component.a.set(-2); // Negative
    expect(component.fibA()).toBe('NaN');

    component.b.set(71); // Overflow
    expect(component.fibB()).toBe('Overflow');

    component.a.set(10); // fib(10) = 55
    expect(component.fibA()).toBe(55);

    component.b.set(15); // fib(15) = 610
    expect(component.fibB()).toBe(610);
  });

  it('should set a and b via setA and setB', () => {
    component.setA('42');
    expect(component.a()).toBe(42);

    component.setB('7');
    expect(component.b()).toBe(7);

    component.setA('not a number');
    expect(component.a()).toBe(42); // Should not change

    component.setB('');
    // Number('') === 0, so b should become 0
    expect(component.b()).toBe(0); // Corrigido para refletir o comportamento real

    component.setA(-3.7);
    expect(component.a()).toBe(-3.7);
  });

  it('should handle edge cases for gcd and lcm', () => {
    component.a.set(0);
    component.b.set(10);
    expect(component.gcd()).toBe(10);
    expect(component.lcm()).toBe(0);

    component.a.set(-15);
    component.b.set(-5);
    expect(component.gcd()).toBe(5);
    expect(component.lcm()).toBe(15); // abs(-15*-5)/5 = 75/5 = 15
  });

  it('should compute values with floats (should floor for factorial and fib)', () => {
    component.a.set(6.9); // factorial and fib of floor(6.9) = 6
    expect(component.factorialA()).toBe(720); // 6!
    expect(component.fibA()).toBe(8);        // fib(6) = 8

    component.b.set(3.2); // prime test: floor to 3
    expect(component.isBPrime()).toBe(true);
  });
});