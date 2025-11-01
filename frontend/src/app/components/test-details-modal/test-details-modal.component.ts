import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TestGenerationResult } from '../../types/socket-events';

@Component({
	selector: 'app-test-details-modal',
	standalone: true,
	imports: [CommonModule, MatIconModule, MatButtonModule, MatProgressSpinnerModule],
	templateUrl: './test-details-modal.component.html',
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class TestDetailsModalComponent {
	@Input() result: TestGenerationResult | null = null;
	@Input() isCreating = false;
	@Input() isExecuting = false;
	@Input() isFixing = false;
	@Input() fixingFile: string = '';

	@Output() close = new EventEmitter<void>();
	@Output() copy = new EventEmitter<string>();
	@Output() createFile = new EventEmitter<TestGenerationResult>();
	@Output() execute = new EventEmitter<TestGenerationResult>();
	@Output() regenerateFromError = new EventEmitter<TestGenerationResult>();

	trackByIndex(index: number, _item?: unknown): number { return index; }
}


