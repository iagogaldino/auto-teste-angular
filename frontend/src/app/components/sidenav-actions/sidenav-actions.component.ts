import { Component, EventEmitter, Input, Output, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';

@Component({
	selector: 'app-sidenav-actions',
	standalone: true,
	imports: [CommonModule, MatButtonModule, MatIconModule, MatCheckboxModule],
	templateUrl: './sidenav-actions.component.html',
	styleUrls: ['./sidenav-actions.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class SidenavActionsComponent {
	@Input() selectionMode = false;
	@Input() hasComponents = false;
	@Input() isGenerating = false;
	@Input() selectedCount = 0;

	@Output() toggleSelectionMode = new EventEmitter<void>();
	@Output() selectAll = new EventEmitter<void>();
	@Output() clearSelection = new EventEmitter<void>();
	@Output() generate = new EventEmitter<void>();
}


