import { Component, EventEmitter, Input, Output, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';

@Component({
	selector: 'app-header',
	standalone: true,
	imports: [CommonModule, MatToolbarModule, MatIconModule, MatButtonModule, MatChipsModule],
	templateUrl: './app-header.component.html',
	styleUrls: ['./app-header.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppHeaderComponent {
	@Input() connected = false;
	@Input() isExecutingAll = false;
	@Input() autoFlowRunning = false;
	@Input() hasSelection = false;
	@Input() isGeneratingTests = false;

	@Output() openProject = new EventEmitter<void>();
	@Output() runAllTests = new EventEmitter<void>();
	@Output() openOrRunAutoFlow = new EventEmitter<void>();
	@Output() toggleAiChat = new EventEmitter<void>();
	@Output() openConfig = new EventEmitter<void>();
}


