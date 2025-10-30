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

  describe('initial values', () => {
    it('should have initial a=12 and b=8', () => {
      expect(component.a()).toBe(12);
      expect(component.b()).toBe(8);
    });
    it('should compute sum, diff, prod, quot, pow', () => {
      expect(component.sum()).toBe(20);
      expect(component.diff()).toBe(4);
      expect(component.prod()).toBe(96);
      expect(component.quot()).toBe(1.5);
      expect(component.pow()).toBe(Math.pow(12, 8));
    });
    it('should compute gcd and lcm', () => {
      expect(component.gcd()).toBe(4);
      expect(component.lcm()).toBe(24);
    });
    it('should evaluate isAPrime and isBPrime', () => {
      expect(component.isAPrime()).toBe(false); // 12 is not prime
      expect(component.isBPrime()).toBe(false); // 8 is not prime
    });
    it('should compute factorialA and factorialB', () => {
      expect(component.factorialA()).toBe(479001600); // 12!
      expect(component.factorialB()).toBe(40320);     // 8!
    });
    it('should compute fibA and fibB', () => {
      expect(component.fibA()).toBe(144); // fib(12)
      expect(component.fibB()).toBe(21);  // fib(8)
    });
  });

  describe('setA and setB', () => {
    it('should set a and update signals', () => {
      component.setA(5);
      expect(component.a()).toBe(5);
      expect(component.sum()).toBe(13);
      expect(component.diff()).toBe(-3);
      expect(component.prod()).toBe(40);
      expect(component.quot()).toBeCloseTo(0.625);
      expect(component.pow()).toBe(Math.pow(5, 8));
    });

    it('should set b and update signals', () => {
      component.setB(3);
      expect(component.b()).toBe(3);
      expect(component.sum()).toBe(15);
      expect(component.diff()).toBe(9);
      expect(component.prod()).toBe(36);
      expect(component.quot()).toBe(4);
      expect(component.pow()).toBe(Math.pow(12, 3));
    });

    it('should ignore NaN values in setA/setB', () => {
      component.setA('abc');
      component.setB({});
      expect(component.a()).toBe(12);
      expect(component.b()).toBe(8);
    });

    it('should accept string numbers in setA/setB', () => {
      component.setA('7');
      component.setB('2');
      expect(component.a()).toBe(7);
      expect(component.b()).toBe(2);
    });
  });

  describe('edge cases for gcd and lcm', () => {
    it('gcd and lcm with zeros', () => {
      component.setA(0);
      component.setB(0);
      expect(component.gcd()).toBe(0);
      expect(component.lcm()).toBe(0);

      component.setA(0);
      component.setB(10);
      expect(component.gcd()).toBe(10);
      expect(component.lcm()).toBe(0);

      component.setA(6);
      component.setB(0);
      expect(component.gcd()).toBe(6);
      expect(component.lcm()).toBe(0);
    });

    it('gcd and lcm with negatives', () => {
      component.setA(-12);
      component.setB(-8);
      expect(component.gcd()).toBe(4);
      expect(component.lcm()).toBe(24);

      component.setA(-15);
      component.setB(5);
      expect(component.gcd()).toBe(5);
      expect(component.lcm()).toBe(15);
    });
  });

  describe('isPrime logic', () => {
    it('should detect primes correctly', () => {
      component.setA(2);
      component.setB(3);
      expect(component.isAPrime()).toBe(true);
      expect(component.isBPrime()).toBe(true);

      component.setA(17);
      component.setB(18);
      expect(component.isAPrime()).toBe(true); // 17 is prime
      expect(component.isBPrime()).toBe(false); // 18 is not
    });

    it('should return false for n <=1', () => {
      component.setA(1);
      component.setB(-5);
      expect(component.isAPrime()).toBe(false);
      expect(component.isBPrime()).toBe(false);

      component.setA(0.9); // should floor to 0
      expect(component.isAPrime()).toBe(false);

    });

    it('should floor decimal input before prime check', () => {
      component.setA(7.99); // floor to 7 (prime)
      expect(component.isAPrime()).toBe(true);

      component.setB(9.2); // floor to 9 (not prime)
      expect(component.isBPrime()).toBe(false);

    });
  });

  describe('factorialSafe', () => {
    it('should return correct factorials for n >=0 && n <=20', () => {
      component.setA(5);
      component.setB(10);
      expect(component.factorialA()).toBe(120); // 5!
      expect(component.factorialB()).toBe(3628800); // 10!
    });

    it('should return "NaN" for negative input', () => {
      component.setA(-1);
      component.setB(-20.3);
      expect(component.factorialA()).toBe('NaN');
      expect(component.factorialB()).toBe('NaN');
    });

    it('should return "Overflow" for n > 20', () => {
      component.setA(21);
      component.setB(1000);
      expect(component.factorialA()).toBe('Overflow');
      expect(component.factorialB()).toBe('Overflow');
    });

    it('should floor decimal input before factorial', () => {
      component.setA(4.9); // floor to 4
      expect(component.factorialA()).toBe(24);

      component.setB(7.7); // floor to 7
      expect(component.factorialB()).toBe(5040);

    });
  });

  describe('fibonacciSafe', () => {
    it('should return correct fibonacci for n >=0 && n <=70', () => {
      component.setA(10);
      component.setB(15);
      expect(component.fibA()).toBe(55);   // fib(10)
      expect(component.fibB()).toBe(610);  // fib(15)
    });

    it('should return "NaN" for negative input', () => {
      component.setA(-1.3);
      component.setB(-5.1);
      expect(component.fibA()).toBe('NaN');
      expect(component.fibB()).toBe('NaN');
    });

    it('should return "Overflow" for n > 70', () => {
      component.setA(71.1);
      component.setB(Number.MAX_SAFE_INTEGER);
      expect(component.fibA()).toBe('Overflow');
      expect(component.fibB()).toBe('Overflow');
    });

    it('should return correct values for n=0 and n=1', () => {
      component.setA(0);
      component.setB(1.99); // floor to 1
      expect(component.fibA()).toBe(0);
      expect(component.fibB()).toBe(1);

    });

    it('should floor decimal input before fibonacci', () => {
      component.setA(8.7); // floor to 8
      expect(component.fibA()).toBe(21);

    });
  });

  describe('division by zero', () => {
    it('quot should be NaN when b=0', () => {
      component.setB(0);
      expect(Number.isNaN(component.quot())).toBeTrue();
    });
  });
});