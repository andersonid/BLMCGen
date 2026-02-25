class ChatPanel {
    constructor({ container, llmClient, onCanvasUpdate }) {
        this.container = container;
        this.llmClient = llmClient;
        this.onCanvasUpdate = onCanvasUpdate;
        this.isStreaming = false;
        this.canvasId = null;
        this.build();
    }

    build() {
        this.container.innerHTML = '';
        this.container.className = 'chat-panel';

        this.messagesEl = document.createElement('div');
        this.messagesEl.className = 'chat-messages';

        this.quickActionsEl = document.createElement('div');
        this.quickActionsEl.className = 'chat-quick-actions';
        this.quickActionsEl.innerHTML = `
            <button class="chat-quick-btn" data-action="bmc">BMC</button>
            <button class="chat-quick-btn" data-action="lmc">LMC</button>
            <button class="chat-quick-btn" data-action="improve">Melhorar canvas</button>
        `;

        const inputRow = document.createElement('div');
        inputRow.className = 'chat-input-row';

        this.inputEl = document.createElement('textarea');
        this.inputEl.className = 'chat-input';
        this.inputEl.placeholder = 'Descreva seu negócio ou peça ajuda...';
        this.inputEl.rows = 1;

        this.sendBtn = document.createElement('button');
        this.sendBtn.className = 'chat-send-btn';
        this.sendBtn.innerHTML = '&#9654;';
        this.sendBtn.title = 'Enviar';

        inputRow.appendChild(this.inputEl);
        inputRow.appendChild(this.sendBtn);

        this.container.appendChild(this.messagesEl);
        this.container.appendChild(this.quickActionsEl);
        this.container.appendChild(inputRow);

        this.bindEvents();
        this.addWelcome();
    }

    bindEvents() {
        this.sendBtn.addEventListener('click', () => this.send());

        this.inputEl.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.send();
            }
        });

        this.inputEl.addEventListener('input', () => {
            this.inputEl.style.height = 'auto';
            this.inputEl.style.height = Math.min(this.inputEl.scrollHeight, 120) + 'px';
        });

        this.quickActionsEl.addEventListener('click', (e) => {
            const btn = e.target.closest('.chat-quick-btn');
            if (!btn) return;
            const action = btn.dataset.action;
            const prompts = {
                bmc: 'Quero criar um Business Model Canvas. Me ajude!',
                lmc: 'Quero criar um Lean Model Canvas para minha startup. Me ajude!',
                improve: 'Analise meu canvas atual e sugira melhorias.'
            };
            if (prompts[action]) {
                this.inputEl.value = prompts[action];
                this.send();
            }
        });
    }

    addWelcome() {
        this.addMessage('assistant',
            'Olá! Sou o assistente do **BLMCGen**. Posso ajudá-lo a criar um Business Model Canvas (BMC) ou Lean Model Canvas (LMC).\n\n' +
            'Descreva seu negócio ou clique em um dos botões acima para começar!'
        );
    }

    addMessage(role, content) {
        const msg = document.createElement('div');
        msg.className = `chat-message chat-message-${role}`;

        const bubble = document.createElement('div');
        bubble.className = 'chat-bubble';
        bubble.innerHTML = this.renderMarkdown(content);

        msg.appendChild(bubble);
        this.messagesEl.appendChild(msg);
        this.scrollToBottom();
        return bubble;
    }

    scrollToBottom() {
        requestAnimationFrame(() => {
            this.messagesEl.scrollTop = this.messagesEl.scrollHeight;
        });
    }

    extractCanvasFromText(text) {
        const re = /```(?:canvas|bmc|lmc)?\s*\n([\s\S]*?)```/g;
        let last = null;
        let match;
        while ((match = re.exec(text)) !== null) {
            const md = match[1].trim();
            if (/^(bmc|lmc)\b/.test(md)) last = md;
        }
        return last;
    }

    renderMarkdown(text) {
        let html = text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');

        html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) => {
            const trimmed = code.trim();
            const isCanvas = lang === 'canvas' || lang === 'bmc' || lang === 'lmc'
                || /^(bmc|lmc)\b/.test(trimmed);
            const cls = isCanvas ? 'chat-canvas-block' : 'chat-code-block';
            return `<pre class="${cls}"><code>${trimmed}</code></pre>`;
        });

        html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
        html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
        html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
        html = html.replace(/^- (.+)$/gm, '<li>$1</li>');
        html = html.replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>');
        html = html.replace(/\n/g, '<br>');
        return html;
    }

    async send() {
        const text = this.inputEl.value.trim();
        if (!text || this.isStreaming) return;

        this.addMessage('user', text);
        this.inputEl.value = '';
        this.inputEl.style.height = 'auto';

        this.isStreaming = true;
        this.sendBtn.disabled = true;
        this.sendBtn.innerHTML = '&#9632;';

        const bubble = this.addMessage('assistant', '');
        bubble.innerHTML = '<span class="chat-typing">Pensando...</span>';
        let streamedContent = '';
        let gotCanvasUpdate = false;

        await this.llmClient.sendMessage(text, {
            canvasId: this.canvasId,
            onDelta: (chunk, full) => {
                streamedContent = full;
                bubble.innerHTML = this.renderMarkdown(full);
                this.scrollToBottom();
            },
            onCanvasUpdate: (data) => {
                gotCanvasUpdate = true;
                if (this.onCanvasUpdate) this.onCanvasUpdate(data);
            },
            onDone: () => {
                bubble.innerHTML = this.renderMarkdown(streamedContent);
                this.scrollToBottom();

                // Fallback: if backend didn't send canvas_update, try extracting from text
                if (!gotCanvasUpdate && this.onCanvasUpdate) {
                    const md = this.extractCanvasFromText(streamedContent);
                    if (md) {
                        this.onCanvasUpdate({ markdown: md, valid: true });
                    }
                }
            },
            onError: (err) => {
                bubble.innerHTML = `<span class="chat-error">Erro: ${err.message}</span>`;
                this.scrollToBottom();
            }
        });

        this.isStreaming = false;
        this.sendBtn.disabled = false;
        this.sendBtn.innerHTML = '&#9654;';
    }

    setCanvasId(id) {
        this.canvasId = id;
    }

    clearChat() {
        this.llmClient.clearHistory();
        this.messagesEl.innerHTML = '';
        this.addWelcome();
    }
}
