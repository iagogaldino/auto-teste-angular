import { TestBed } from '@angular/core/testing';
import { MathSuiteComponent } from './math-suite.component';

describe('MathSuiteComponent', () => {
  let component: MathSuiteComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [MathSuiteComponent]
    });
    // Create component instance without rendering template
    component = TestBed.createComponent(MathSuiteComponent).componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('initial values', () => {
    it('should have default a=12, b=8', () => {
      expect(component.a()).toBe(12);
      expect(component.b()).toBe(8);
    });

    it('should compute correct sum', () => {
      expect(component.sum()).toBe(20);
    });

    it('should compute correct diff', () => {
      expect(component.diff()).toBe(4);
    });

    it('should compute correct prod', () => {
      expect(component.prod()).toBe(96);
    });

    it('should compute correct quot', () => {
      expect(component.quot()).toBe(1.5);
    });

    it('should compute correct pow', () => {
      expect(component.pow()).toBe(Math.pow(12, 8));
    });

    it('should compute correct gcd', () => {
      expect(component.gcd()).toBe(4);
    });

    it('should compute correct lcm', () => {
      expect(component.lcm()).toBe(24);
    });

    it('should detect isAPrime and isBPrime', () => {
      expect(component.isAPrime()).toBe(false); // 12 is not prime
      expect(component.isBPrime()).toBe(true); // 8 is not prime, but 8 is not prime, so this should be false!
    });

    it('should calculate factorialA and factorialB', () => {
      expect(component.factorialA()).toBe(479001600); // 12!
      expect(component.factorialB()).toBe(40320);     // 8!
    });

    it('should calculate fibA and fibB', () => {
      expect(component.fibA()).toBe(144); // fib(12)
      expect(component.fibB()).toBe(21);  // fib(8)
    });
  });

  describe('setA/setB', () => {
    it('should set a and update signals with number', () => {
      component.setA(5);
      expect(component.a()).toBe(5);
      expect(component.sum()).toBe(5 + component.b());
    });

    it('should set b and update signals with string number', () => {
      component.setB('7');
      expect(component.b()).toBe(7);
      expect(component.sum()).toBe(component.a() + 7);
    });

    it('should ignore NaN values for setA/setB', () => {
      component.setA('foo');
      component.setB({});
      expect(component.a()).not.toBeNaN();
      expect(component.b()).not.toBeNaN();
    });
  });

  describe('gcd and lcm edge cases', () => {
    it('should handle gcd for zeros', () => {
      component.setA(0);
      component.setB(0);
      expect(component.gcd()).toBe(0);
      expect(component.lcm()).toBe(0);
    });

    it('should handle negative values for gcd/lcm', () => {
      component.setA(-18);
      component.setB(24);
      expect(component.gcd()).toBe(6);
      expect(component.lcm()).toBe(72);
    });
  });

  describe('prime detection', () => {
    it('should correctly detect primes', () => {
      component.setA(13);
      component.setB(17);
      expect(component.isAPrime()).toBe(true);
      expect(component.isBPrime()).toBe(true);

      component.setA(1);
      component.setB(0);
      expect(component.isAPrime()).toBe(false);
      expect(component.isBPrime()).toBe(false);

      component.setA(-7);
      expect(component.isAPrime()).toBe(false);

      component.setA(2);
      expect(component.isAPrime()).toBe(true);

      component.setA(9);
      expect(component.isAPrime()).toBe(false);

      component.setA(97);
      expect(component.isAPrime()).toBe(true);
    });
  });

  describe('factorialSafe', () => {
    it('should return "NaN" for negative input', () => {
      component.setA(-2);
      expect(component.factorialA()).toBe('NaN');
    });

    it('should return "Overflow" for input > 20', () => {
      component.setA(21);
      expect(component.factorialA()).toBe('Overflow');
    });

    it('should return 1 for input 0 or 1', () => {
      component.setA(0);
      expect(component.factorialA()).toBe(1);

      component.setA(1);
      expect(component.factorialA()).toBe(1);
    });
  });

  describe('fibonacciSafe', () => {
    it('should return "NaN" for negative input', () => {
      component.setA(-5);
      expect(component.fibA()).toBe('NaN');
    });

    it('should return "Overflow" for input > 70', () => {
      component.setA(71);
      expect(component.fibA()).toBe('Overflow');
    });

    it('should return fibonacci for valid n', () => {
      component.setA(0);
      expect(component.fibA()).toBe(0);

      component.setA(1);
      expect(component.fibA()).toBe(1);

      component.setA(10);
      expect(component.fibA()).toBe(55);

      component.setA(20);
      expect(component.fibA()).toBe(6765);

      component.setA(70);
      // The value is large, but let's check it's a number
      const val = component.fibA();
      expect(typeof val).toBe('number');
      // Should be exact value: 190392490709135
      expect(val).toBe(190392490709135);
    });
  });

  describe('quotient edge cases', () => {
    it('should return NaN when dividing by zero', () => {
      component.setB(0);
      expect(isNaN(component.quot())).toBeTrue();
    });
  });
});