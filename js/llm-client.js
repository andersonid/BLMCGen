class LLMClient {
    constructor(apiBaseUrl = '/api') {
        this.apiBaseUrl = apiBaseUrl.replace(/\/+$/, '');
        this.history = [];
        this.maxHistory = 20;
        this.abortController = null;
    }

    getAuthHeaders() {
        const token = localStorage.getItem('bmcgen_auth_token');
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;
        return headers;
    }

    addToHistory(role, content) {
        this.history.push({ role, content });
        if (this.history.length > this.maxHistory * 2) {
            this.history = this.history.slice(-this.maxHistory * 2);
        }
    }

    clearHistory() {
        this.history = [];
    }

    abort() {
        if (this.abortController) {
            this.abortController.abort();
            this.abortController = null;
        }
    }

    async sendMessage(message, { canvasId, onDelta, onCanvasUpdate, onDone, onError }) {
        this.abort();
        this.abortController = new AbortController();

        this.addToHistory('user', message);

        try {
            const res = await fetch(`${this.apiBaseUrl}/chat`, {
                method: 'POST',
                headers: this.getAuthHeaders(),
                body: JSON.stringify({
                    message,
                    history: this.history.slice(0, -1),
                    canvasId
                }),
                signal: this.abortController.signal
            });

            if (!res.ok) {
                const err = await res.json().catch(() => ({ error: res.statusText }));
                throw new Error(err.error || `HTTP ${res.status}`);
            }

            const reader = res.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';
            let fullResponse = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop();

                for (const line of lines) {
                    if (line.startsWith('event: ')) {
                        var currentEvent = line.substring(7).trim();
                    } else if (line.startsWith('data: ') && currentEvent) {
                        try {
                            const data = JSON.parse(line.substring(6));
                            switch (currentEvent) {
                                case 'delta':
                                    fullResponse += data.content;
                                    if (onDelta) onDelta(data.content, fullResponse);
                                    break;
                                case 'canvas_update':
                                    if (onCanvasUpdate) onCanvasUpdate(data);
                                    break;
                                case 'done':
                                    this.addToHistory('assistant', fullResponse);
                                    if (onDone) onDone(fullResponse);
                                    break;
                                case 'error':
                                    if (onError) onError(new Error(data.message));
                                    break;
                            }
                        } catch (e) {
                            console.warn('SSE parse error:', e);
                        }
                        currentEvent = null;
                    }
                }
            }
        } catch (err) {
            if (err.name === 'AbortError') return;
            if (onError) onError(err);
            else console.error('LLM client error:', err);
        } finally {
            this.abortController = null;
        }
    }

    async checkStatus() {
        try {
            const res = await fetch(`${this.apiBaseUrl}/chat/status`, {
                headers: this.getAuthHeaders()
            });
            if (!res.ok) return { configured: false };
            const data = await res.json();
            return data.data;
        } catch {
            return { configured: false };
        }
    }
}
