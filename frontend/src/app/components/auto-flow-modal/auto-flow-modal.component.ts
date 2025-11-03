import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy, ViewChild, ElementRef, OnChanges, SimpleChanges, AfterViewInit, OnDestroy } from '@angular/core';
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
export class AutoFlowModalComponent implements OnChanges, AfterViewInit, OnDestroy {
	@Input() opened = false;
	@Input() paused = false;
	@Input() logHtml = '';
	@Input() canStartNewTests = false;

	@Output() togglePause = new EventEmitter<void>();
	@Output() close = new EventEmitter<void>();
	@Output() startNewTests = new EventEmitter<void>();

	@ViewChild('autoFlowOutputContainer') autoFlowOutputContainer?: ElementRef<HTMLDivElement>;
	
	private shouldScroll = true;
	private mutationObserver?: MutationObserver;
	private scrollTimeout?: number;

	ngAfterViewInit(): void {
		// Faz scroll inicial quando o modal é aberto
		this.scrollToBottom();
		
		// Observa mudanças no DOM para garantir scroll automático mesmo com OnPush
		const container = this.autoFlowOutputContainer?.nativeElement;
		if (container) {
			this.mutationObserver = new MutationObserver(() => {
				if (this.shouldScroll) {
					// Usa debounce para evitar chamadas excessivas
					if (this.scrollTimeout) {
						clearTimeout(this.scrollTimeout);
					}
					this.scrollTimeout = window.setTimeout(() => {
						this.scrollToBottom();
					}, 50);
				}
			});
			
			this.mutationObserver.observe(container, {
				childList: true,
				subtree: true,
				characterData: true
			});
		}
	}

	ngOnDestroy(): void {
		if (this.mutationObserver) {
			this.mutationObserver.disconnect();
		}
		if (this.scrollTimeout) {
			clearTimeout(this.scrollTimeout);
		}
	}

	ngOnChanges(changes: SimpleChanges): void {
		// Detecta mudanças no logHtml e faz scroll automático
		if (changes['logHtml'] && !changes['logHtml'].firstChange && this.shouldScroll) {
			// Usa setTimeout para garantir que o DOM foi atualizado
			setTimeout(() => {
				this.scrollToBottom();
			}, 0);
		}

		// Quando o modal abre, faz scroll para o final
		if (changes['opened'] && this.opened) {
			this.shouldScroll = true;
			setTimeout(() => {
				this.scrollToBottom();
			}, 100);
		}
	}

	private scrollToBottom(): void {
		const container = this.autoFlowOutputContainer?.nativeElement;
		if (!container) return;

		// Usa múltiplas tentativas para garantir que o scroll funcione
		requestAnimationFrame(() => {
			container.scrollTop = container.scrollHeight;
			setTimeout(() => {
				container.scrollTop = container.scrollHeight;
			}, 10);
			setTimeout(() => {
				container.scrollTop = container.scrollHeight;
			}, 50);
		});
	}

	// Permite ao usuário parar o scroll automático se ele fizer scroll manual para cima
	onScroll(): void {
		const container = this.autoFlowOutputContainer?.nativeElement;
		if (!container) return;

		const threshold = 100; // px de tolerância
		const isNearBottom = container.scrollTop + container.clientHeight >= container.scrollHeight - threshold;
		this.shouldScroll = isNearBottom;
		
		// Se o usuário voltou para o final, reativa o scroll automático
		if (isNearBottom) {
			setTimeout(() => {
				this.scrollToBottom();
			}, 0);
		}
	}
}


