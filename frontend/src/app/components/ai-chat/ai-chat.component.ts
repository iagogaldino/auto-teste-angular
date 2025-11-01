import { Component, ElementRef, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, ViewChild, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { SocketService } from '../../services/socket.service';

type ChatMessage = { role: 'user' | 'assistant'; content: string; timestamp: Date };

@Component({
  selector: 'app-ai-chat',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatButtonModule, MatFormFieldModule, MatInputModule],
  templateUrl: './ai-chat.component.html',
  styleUrl: './ai-chat.component.scss'
})
export class AiChatComponent implements OnInit, OnChanges {
  @Output() close = new EventEmitter<void>();
  @Input() directoryPath?: string;

  @ViewChild('aiChatMessages') aiChatMessagesRef?: ElementRef<HTMLDivElement>;

  chatMessages = signal<ChatMessage[]>([
    { role: 'assistant', content: 'Olá! Posso ajudar com geração e correção de testes.', timestamp: new Date() }
  ]);
  chatInput = signal<string>('');
  chatTyping = signal<boolean>(false);
  private conversationId = '';

  constructor(private socketService: SocketService) {}

  ngOnInit(): void {
    // Conversation id persistente
    try {
      const key = 'ai_chat_conversation_id';
      const existing = typeof window !== 'undefined' ? window.localStorage.getItem(key) : null;
      this.conversationId = existing || Math.random().toString(36).slice(2);
      if (!existing && typeof window !== 'undefined') window.localStorage.setItem(key, this.conversationId);
    } catch {}

    this.socketService.onChatMessage().subscribe(msg => {
      if (msg.role === 'assistant') {
        this.chatMessages.update(list => [...list, { role: 'assistant', content: msg.content, timestamp: new Date() }]);
        this.scrollSoon();
      }
    });

    this.socketService.onChatError().subscribe(err => {
      this.chatMessages.update(list => [...list, { role: 'assistant', content: `Erro: ${err.error}`, timestamp: new Date() }]);
      this.scrollSoon();
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    // noop for now
  }

  sendChat(): void {
    const message = (this.chatInput() || '').trim();
    if (!message) return;
    // eco local do usuário
    this.chatMessages.update(list => [...list, { role: 'user', content: message, timestamp: new Date() }]);
    this.chatInput.set('');
    this.scrollSoon();
    // envia ao backend
    this.socketService.sendChatMessage({
      conversationId: this.conversationId,
      message,
      context: { directoryPath: this.directoryPath || '' }
    });
  }

  onClose(): void { this.close.emit(); }

  private scrollChatToBottom(): void {
    const el = this.aiChatMessagesRef?.nativeElement;
    if (!el) return;
    requestAnimationFrame(() => { el.scrollTop = el.scrollHeight; });
  }

  private scrollSoon(): void { setTimeout(() => this.scrollChatToBottom(), 0); }
}


