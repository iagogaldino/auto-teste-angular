import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-splash',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './splash.component.html',
  styleUrls: ['./splash.component.scss']
})
export class SplashComponent {
  @Output() complete = new EventEmitter<void>();

  // Notifies parent after animation ends (3s)
  onAnimationEnd(): void {
    this.complete.emit();
  }
}


