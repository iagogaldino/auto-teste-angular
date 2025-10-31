import { TestBed } from '@angular/core/testing';
import { MathSuiteComponent } from './math-suite.component';

describe('MathSuiteComponent', () => {
  let component: MathSuiteComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [MathSuiteComponent]
    });
    const fixture = TestBed.createComponent(MathSuiteComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('initial values', () => {
    it('should have a = 12, b = 8', () => {
      expect(component.a()).toBe(12);
      expect(component.b()).toBe(8);
    });
  });

  describe('arithmetic signals', () => {
    it('should compute sum, diff, prod, quot, pow', () => {
      expect(component.sum()).toBe(20);
      expect(component.diff()).toBe(4);
      expect(component.prod()).toBe(96);
      expect(component.quot()).toBe(1.5);
      expect(component.pow()).toBe(Math.pow(12, 8));
    });

    it('should compute quotient as NaN if b is 0', () => {
      component.setB(0);
      expect(component.quot()).toEqual(NaN);
    });

    it('should update values when a and b change', () => {
      component.setA(7);
      component.setB(3);
      expect(component.sum()).toBe(10);
      expect(component.diff()).toBe(4);
      expect(component.prod()).toBe(21);
      expect(component.quot()).toBeCloseTo(7 / 3);
      expect(component.pow()).toBe(Math.pow(7, 3));
    });
  });

  describe('gcd and lcm', () => {
    it('should compute gcd and lcm correctly for default values', () => {
      expect(component.gcd()).toBe(4);
      expect(component.lcm()).toBe(24);
    });

    it('should compute gcd and lcm when one value is zero', () => {
      component.setA(0);
      component.setB(10);
      expect(component.gcd()).toBe(10);
      expect(component.lcm()).toBe(0);

      component.setA(7);
      component.setB(0);
      expect(component.gcd()).toBe(7);
      expect(component.lcm()).toBe(0);
    });
  });

  describe('isPrime checks', () => {
    it('should detect primes for a and b', () => {
      component.setA(13);
      component.setB(17);
      expect(component.isAPrime()).toBeTrue();
      expect(component.isBPrime()).toBeTrue();
    });

    it('should detect non-primes for a and b', () => {
      component.setA(12);
      component.setB(8);
      expect(component.isAPrime()).toBeFalse();
      expect(component.isBPrime()).toBeFalse();
    });

    it('should return false for a or b <= 1', () => {
      component.setA(1);
      component.setB(-5);
      expect(component.isAPrime()).toBeFalse();
      expect(component.isBPrime()).toBeFalse();
    });
  });

  describe('factorialSafe', () => {
    it('should return correct factorial for valid n', () => {
      component.setA(5);
      expect(component.factorialA()).toBe(120);

      component.setB(0);
      expect(component.factorialB()).toBe(1);
    });

    it('should return "NaN" for negative n', () => {
      component.setA(-3);
      expect(component.factorialA()).toBe('NaN');
    });

    it('should return "Overflow" for n > 20', () => {
      component.setA(21);
      expect(component.factorialA()).toBe('Overflow');
    });

    it('should treat non-integer input as floored value', () => {
      component.setA(4.9);
      expect(component.factorialA()).toBe(24); // floor(4.9) = 4, 4! = 24
    });
  });

  describe('fibonacciSafe', () => {
    it('should return correct fibonacci for valid n', () => {
      component.setA(0);
      expect(component.fibA()).toBe(0);

      component.setA(1);
      expect(component.fibA()).toBe(1);

      component.setA(7);
      expect(component.fibA()).toBe(13);

      component.setB(10);
      expect(component.fibB()).toBe(55);
    });

    it('should return "NaN" for negative n', () => {
      component.setA(-1);
      expect(component.fibA()).toBe('NaN');
    });

    it('should return "Overflow" for n > 70', () => {
      component.setA(71);
      expect(component.fibA()).toBe('Overflow');
    });

    it('should treat non-integer input as floored value', () => {
      component.setA(6.9); // floor = 6, fib = 8
      expect(component.fibA()).toBe(8);
    });
  });

  describe('setA and setB', () => {
    it('should accept number input as string or number', () => {
      component.setA('15');
      component.setB('9');
      expect(component.a()).toBe(15);
      expect(component.b()).toBe(9);

      component.setA(22);
      component.setB(3.2);
      expect(component.a()).toBe(22);
      expect(component.b()).toBe(3.2);

      // Should ignore invalid string
      const prevA = component.a();
      component.setA('abc');
      expect(component.a()).toBe(prevA);

      const prevB = component.b();
      component.setB('');
      expect(component.b()).toBe(prevB);

    });

    it('should update all computed values when setA/setB are called', () => {
      component.setA(6); // b still default 8
      expect(component.sum()).toBe(14);
      expect(component.prod()).toBe(48);

      component.setB(2);
      expect(component.diff()).toBe(4);
    });
  });
});