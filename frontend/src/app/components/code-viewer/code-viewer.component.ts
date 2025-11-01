import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
	selector: 'app-code-viewer',
	standalone: true,
	imports: [CommonModule, MatIconModule, MatButtonModule],
	templateUrl: './code-viewer.component.html',
	styleUrls: ['./code-viewer.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class CodeViewerComponent {
	@Input() path: string | null = null;
	@Input() isSpec = false;
	@Input() content = '';
	@Input() busy = false;
	@Input() codeRenderKey = 0;

	@Output() executeSpec = new EventEmitter<void>();
	@Output() generateTest = new EventEmitter<void>();
}


