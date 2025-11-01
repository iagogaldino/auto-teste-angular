import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
	selector: 'app-custom-prompt-modal',
	standalone: true,
	imports: [CommonModule, FormsModule, MatIconModule, MatButtonModule, MatProgressSpinnerModule],
	template: `
<div class="custom-prompt-modal" (click)="cancel.emit()">
	<div class="modal-content" (click)="$event.stopPropagation()">
		<div class="modal-header">
			<h3>🔧 Melhorar Teste com IA</h3>
			<button mat-icon-button (click)="cancel.emit()" class="close-modal">
				<mat-icon>close</mat-icon>
			</button>
		</div>
		<div class="modal-body">
			<div class="prompt-section">
				<h5>💬 Instruções para a IA:</h5>
				<p class="prompt-description">
					Descreva o que você gostaria que a IA faça com este teste. Seja específico sobre as melhorias desejadas.
				</p>
				<textarea 
					[ngModel]="value"
					(ngModelChange)="valueChange.emit($event)"
					class="prompt-textarea"
					placeholder="Ex: Adicione mais casos de teste para edge cases, melhore a cobertura de código, corrija os mocks, etc..."
					rows="6"
					(keydown.enter)="$event.preventDefault(); $event.stopPropagation(); submit.emit()"
				></textarea>
			</div>

			<div class="modal-actions">
				<button mat-raised-button color="warn" (click)="cancel.emit()">
					<mat-icon>cancel</mat-icon>
					Cancelar
				</button>
				<button mat-raised-button color="primary" (click)="submit.emit()" [disabled]="!(value || '').trim() || busy">
					<ng-container *ngIf="busy; else rocketIcon">
						<mat-progress-spinner class="btn-spinner" mode="indeterminate" [diameter]="18" [strokeWidth]="3"></mat-progress-spinner>
						Processando...
					</ng-container>
					<ng-template #rocketIcon>
						<mat-icon>rocket_launch</mat-icon>
						Processar com IA
					</ng-template>
				</button>
			</div>
		</div>
	</div>
</div>
`,
	styleUrls: ['./custom-prompt-modal.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class CustomPromptModalComponent {
	@Input() value = '';
	@Input() busy = false;

	@Output() valueChange = new EventEmitter<string>();
	@Output() cancel = new EventEmitter<void>();
	@Output() submit = new EventEmitter<void>();
}


