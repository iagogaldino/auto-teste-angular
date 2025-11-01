import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
	selector: 'app-auto-flow-modal',
	standalone: true,
	imports: [CommonModule, MatIconModule, MatButtonModule],
	templateUrl: './auto-flow-modal.component.html',
	styleUrls: ['./auto-flow-modal.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class AutoFlowModalComponent {
	@Input() opened = false;
	@Input() paused = false;
	@Input() logHtml = '';

	@Output() togglePause = new EventEmitter<void>();
	@Output() close = new EventEmitter<void>();
}


