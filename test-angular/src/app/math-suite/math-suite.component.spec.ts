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
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with correct default values', () => {
    expect(component.a()).toBe(12);
    expect(component.b()).toBe(8);
    expect(component.sum()).toBe(20);
    expect(component.diff()).toBe(4);
    expect(component.prod()).toBe(96);
    expect(component.quot()).toBe(1.5);
    expect(component.pow()).toBe(Math.pow(12, 8));
    expect(component.gcd()).toBe(4);
    expect(component.lcm()).toBe(24);
    expect(component.isAPrime()).toBe(false);
    expect(component.isBPrime()).toBe(true);
    expect(component.factorialA()).toBe(479001600);
    expect(component.factorialB()).toBe(40320);
    expect(component.fibA()).toBe(144);
    expect(component.fibB()).toBe(21);
  });

  it('should update signals when setA and setB are called with valid numbers', () => {
    component.setA(7);
    component.setB(5);
    expect(component.a()).toBe(7);
    expect(component.b()).toBe(5);
    expect(component.sum()).toBe(12);
    expect(component.prod()).toBe(35);
    expect(component.quot()).toBe(1.4);
    expect(component.gcd()).toBe(1);
    expect(component.lcm()).toBe(35);
    expect(component.isAPrime()).toBe(true);
    expect(component.isBPrime()).toBe(true);
  });

  it('should handle setA/setB with string numbers', () => {
    component.setA('10');
    component.setB('3');
    expect(component.a()).toBe(10);
    expect(component.b()).toBe(3);
    expect(component.sum()).toBe(13);
  });

  it('should handle setA/setB with null and empty string as valid zeros', () => {
    component.setA(null as any);
    component.setB('');
    expect(component.a()).toBe(0);
    expect(component.b()).toBe(0);
    expect(component.sum()).toBe(0);
    expect(component.quot()).toBeNaN();
  });

  it('should ignore setA/setB when value is NaN (non-numeric)', () => {
    const prevA = component.a();
    const prevB = component.b();
    component.setA('abc');
    component.setB(undefined as any);
    component.setA({});
    component.setB([]);
    expect(component.a()).toBe(prevA);
    expect(component.b()).toBe(prevB);
  });

  it('should compute factorial overflow and NaN cases', () => {
    component.setA(21); // >20
    component.setB(-3); // <0
    expect(component.factorialA()).toBe('Overflow');
    expect(component.factorialB()).toBe('NaN');
  });

  it('should compute fibonacci overflow and NaN cases', () => {
    component.setA(71); // >70
    component.setB(-2); // <0
    expect(component.fibA()).toBe('Overflow');
    expect(component.fibB()).toBe('NaN');
  });

  it('should correctly compute GCD and LCM for zeros', () => {
    component.setA(0);
    component.setB(0);
    expect(component.gcd()).toBe(0);
    expect(component.lcm()).toBe(0);

    component.setA(0);
    component.setB(5);
    expect(component.gcd()).toBe(5);
    expect(component.lcm()).toBe(0);

    component.setA(7);
    component.setB(0);
    expect(component.gcd()).toBe(7);
    expect(component.lcm()).toBe(0);
  });

  it('should compute isPrime correctly for various values', () => {
    component.setA(2); // prime
    component.setB(1); // not prime
    expect(component.isAPrime()).toBe(true);
    expect(component.isBPrime()).toBe(false);

    component.setA(17); // prime
    component.setB(18); // not prime
    expect(component.isAPrime()).toBe(true);
    expect(component.isBPrime()).toBe(false);

    component.setA(-7); // negative
    component.setB(0); // zero
    expect(component.isAPrime()).toBe(false);
    expect(component.isBPrime()).toBe(false);

    component.setA(13.9); // non-integer, floored to 13
    expect(component.isAPrime()).toBe(true);

    component.setA(15.6); // non-integer, floored to 15 (not prime)
    expect(component.isAPrime()).toBe(false);
  });

  it('should compute factorial and fibonacci for edge cases', () => {
    component.setA(1);
    component.setB(0);
    expect(component.factorialA()).toBe(1);
    expect(component.factorialB()).toBe(1);

    // Fibonacci for n=0,1
    component.setA(0);
    component.setB(1);
    expect(component.fibA()).toBe(0);
    expect(component.fibB()).toBe(1);

    // Fibonacci for n=10
    component.setA(10);
    expect(component.fibA()).toBe(55);

    // Factorial for n=5
    component.setB(5);
    expect(component.factorialB()).toBe(120);

    // Factorial for n=20 (max allowed)
    component.setA(20);
    expect(component.factorialA()).toBe(2432902008176640000);

    // Fibonacci for n=70 (max allowed)
    component.setA(70);
    expect(component.fibA()).toBe(190392490709135);

  });

});