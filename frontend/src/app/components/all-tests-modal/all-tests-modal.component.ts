import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
	selector: 'app-all-tests-modal',
	standalone: true,
	imports: [CommonModule, MatIconModule, MatButtonModule],
	templateUrl: './all-tests-modal.component.html',
	styleUrls: ['./all-tests-modal.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class AllTestsModalComponent {
	@Input() opened = false;
	@Input() status: 'running' | 'success' | 'error' | '' = '';
	@Input() output = '';

	@Output() close = new EventEmitter<void>();
}


