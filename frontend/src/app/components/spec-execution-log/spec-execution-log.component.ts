import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
	selector: 'app-spec-execution-log',
	standalone: true,
	imports: [CommonModule, MatButtonModule, MatIconModule],
	templateUrl: './spec-execution-log.component.html',
	styleUrls: ['./spec-execution-log.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class SpecExecutionLogComponent {
	@Input() status: 'running' | 'success' | 'error' = 'running';
	@Input() output = '';
	@Input() isFixing = false;
	@Input() filePath = '';

	@Output() fixFromLog = new EventEmitter<void>();
}


