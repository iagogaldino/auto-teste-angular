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

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize signals with correct default values', () => {
    expect(component.a()).toBe(12);
    expect(component.b()).toBe(8);
  });

  it('should compute sum, diff, prod, quot and pow correctly', () => {
    component.a.set(10);
    component.b.set(2);
    expect(component.sum()).toBe(12);
    expect(component.diff()).toBe(8);
    expect(component.prod()).toBe(20);
    expect(component.quot()).toBe(5);
    expect(component.pow()).toBe(100);
  });

  it('should handle division by zero in quot', () => {
    component.a.set(10);
    component.b.set(0);
    expect(component.quot()).toBeNaN();
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

    component.a.set(13);
    component.b.set(17);
    expect(component.gcd()).toBe(1);
    expect(component.lcm()).toBe(221);
  });

  it('should detect primes correctly for a and b', () => {
    component.a.set(7);
    component.b.set(4);
    expect(component.isAPrime()).toBe(true);
    expect(component.isBPrime()).toBe(false);

    component.a.set(1);
    expect(component.isAPrime()).toBe(false);

    component.a.set(-7);
    expect(component.isAPrime()).toBe(false);

    component.b.set(2);
    expect(component.isBPrime()).toBe(true);
  });

  it('should compute factorialSafe for valid, negative and overflow values', () => {
    component.a.set(5);
    expect(component.factorialA()).toBe(120);

    component.a.set(-3);
    expect(component.factorialA()).toBe('NaN');

    component.a.set(21);
    expect(component.factorialA()).toBe('Overflow');

    component.b.set(0);
    expect(component.factorialB()).toBe(1);

    component.b.set(20);
    expect(component.factorialB()).toBe(2432902008176640000);

    component.b.set(25);
    expect(component.factorialB()).toBe('Overflow');
  });

  it('should compute fibonacciSafe for valid, negative and overflow values', () => {
    component.a.set(0);
    expect(component.fibA()).toBe(0);

    component.a.set(-2);
    expect(component.fibA()).toBe('NaN');

    component.a.set(1);
    expect(component.fibA()).toBe(1);

    component.a.set(10);
    expect(component.fibA()).toBe(55);

    component.a.set(71);
    expect(component.fibA()).toBe('Overflow');

    component.b.set(15);
    expect(component.fibB()).toBe(610);

    component.b.set(-1);
    expect(component.fibB()).toBe('NaN');
  });

  describe('setA', () => {
    it('should set a with number input', () => {
      component.setA(42);
      expect(component.a()).toBe(42);
      component.setA(-10);
      expect(component.a()).toBe(-10);
      component.setA(0);
      expect(component.a()).toBe(0);
      component.setA(3.5);
      expect(component.a()).toBe(3.5);
    });

    it('should set a with numeric string input', () => {
      component.setA('13');
      expect(component.a()).toBe(13);
      component.setA('-2');
      expect(component.a()).toBe(-2);
      component.setA('0');
      expect(component.a()).toBe(0);
      component.setA('3.14');
      expect(component.a()).toBe(3.14);
      component.setA('');
      expect(component.a()).toBe(0); // '' coerces to 0
      component.setA(null as any);
      expect(component.a()).toBe(0); // null coerces to 0
      const prev = component.a();
      component.setA(undefined as any); // undefined => NaN
      expect(component.a()).toBe(prev); // should not change
      component.setA('abc');
      expect(component.a()).toBe(prev); // should not change
      component.setA({} as any);
      expect(component.a()).toBe(prev); // should not change
      component.setA([] as any); // [] => 0
      expect(component.a()).toBe(0); // should change to 0
      component.setA([2] as any); // [2] => 2
      expect(component.a()).toBe(2); // should change to 2
      const prev2 = component.a();
      component.setA([1,2] as any); // [1,2] => NaN
      expect(component.a()).toBe(prev2); // should not change
    });
  });

  describe('setB', () => {
    it('should set b with number input', () => {
      component.setB(99);
      expect(component.b()).toBe(99);
      component.setB(-7.5);
      expect(component.b()).toBe(-7.5);
      component.setB(0);
      expect(component.b()).toBe(0);
    });

    it('should set b with numeric string input', () => {
      component.setB('-12');
      expect(component.b()).toBe(-12);

      component.setB('5');
      expect(component.b()).toBe(5);

      component.setB('');
      expect(component.b()).toBe(0); // '' coerces to 0

      component.setB(null as any);
      expect(component.b()).toBe(0);

      const prev = component.b();
      component.setB(undefined as any); // undefined => NaN
      expect(component.b()).toBe(prev);

      component.setB('notanumber');
      expect(component.b()).toBe(prev);

      component.setB({} as any);
      expect(component.b()).toBe(prev);

      component.setB([] as any); // [] => 0
      expect(component.b()).toBe(0);

      component.setB([7] as any); // [7] => 7
      expect(component.b()).toBe(7);

      const prevArr = component.b();
      component.setB([1,2] as any); // [1,2] => NaN
      expect(component.b()).toBe(prevArr); // should not change
    });
  });
});