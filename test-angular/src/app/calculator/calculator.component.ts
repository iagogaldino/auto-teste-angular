import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-calculator',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './calculator.component.html',
  styleUrl: './calculator.component.scss'
})
export class CalculatorComponent {
  result = signal<number>(0);

  calculate(): void {
    this.result.set(10 + 10);
  }

  // Função utilitária para testes
  addTenPlusTen(): number {
    return 10 + 10;
  }
}
