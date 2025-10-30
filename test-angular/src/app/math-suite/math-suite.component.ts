import { Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-math-suite',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './math-suite.component.html',
  styleUrl: './math-suite.component.scss'
})
export class MathSuiteComponent {
  a = signal<number>(12);
  b = signal<number>(8);

  sum = computed(() => this.a() + this.b());
  diff = computed(() => this.a() - this.b());
  prod = computed(() => this.a() * this.b());
  quot = computed(() => (this.b() === 0 ? NaN : this.a() / this.b()));
  pow = computed(() => Math.pow(this.a(), this.b()));

  gcd = computed(() => this.computeGcd(this.a(), this.b()));
  lcm = computed(() => {
    const g = this.gcd();
    return g === 0 ? 0 : Math.abs(this.a() * this.b()) / g;
  });

  isAPrime = computed(() => this.isPrime(this.a()));
  isBPrime = computed(() => this.isPrime(this.b()));

  factorialA = computed(() => this.factorialSafe(this.a()));
  factorialB = computed(() => this.factorialSafe(this.b()));

  fibA = computed(() => this.fibonacciSafe(this.a()));
  fibB = computed(() => this.fibonacciSafe(this.b()));

  setA(value: number | string): void {
    const num = Number(value);
    if (!Number.isNaN(num)) this.a.set(num);
  }

  setB(value: number | string): void {
    const num = Number(value);
    if (!Number.isNaN(num)) this.b.set(num);
  }

  private computeGcd(x: number, y: number): number {
    x = Math.abs(x);
    y = Math.abs(y);
    while (y !== 0) {
      const t = y;
      y = x % y;
      x = t;
    }
    return x;
  }

  private isPrime(n: number): boolean {
    n = Math.floor(n);
    if (n <= 1) return false;
    if (n <= 3) return true;
    if (n % 2 === 0 || n % 3 === 0) return false;
    for (let i = 5; i * i <= n; i += 6) {
      if (n % i === 0 || n % (i + 2) === 0) return false;
    }
    return true;
  }

  private factorialSafe(n: number): number | string {
    n = Math.floor(n);
    if (n < 0) return 'NaN';
    if (n > 20) return 'Overflow';
    let res = 1;
    for (let i = 2; i <= n; i++) res *= i;
    return res;
  }

  private fibonacciSafe(n: number): number | string {
    n = Math.floor(n);
    if (n < 0) return 'NaN';
    if (n > 70) return 'Overflow';
    if (n === 0) return 0;
    if (n === 1) return 1;
    let a = 0;
    let b = 1;
    for (let i = 2; i <= n; i++) {
      const next = a + b;
      a = b;
      b = next;
    }
    return b;
  }
}


