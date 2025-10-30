import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CalculatorComponent } from './calculator/calculator.component';
import { MathSuiteComponent } from './math-suite/math-suite.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, CalculatorComponent, MathSuiteComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('test-angular');
}
