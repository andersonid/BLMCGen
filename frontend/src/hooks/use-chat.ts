import { useCallback, useRef, useState } from "react";
import { api } from "@/lib/api";
import { extractCanvasFromText } from "@/lib/parser";

const STREAM_THROTTLE_MS = 50;

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface UseChatOptions {
  onCanvasUpdate?: (data: { markdown: string; valid: boolean }) => void;
}

export function useChat({ onCanvasUpdate }: UseChatOptions = {}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const historyRef = useRef<{ role: string; content: string }[]>([]);
  const abortRef = useRef<AbortController | null>(null);
  const canvasIdRef = useRef<string | null>(null);

  const addMessage = useCallback(
    (role: "user" | "assistant", content: string) => {
      const msg: ChatMessage = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        role,
        content,
      };
      setMessages((prev) => [...prev, msg]);
      return msg.id;
    },
    [],
  );

  const updateMessage = useCallback((id: string, content: string) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === id ? { ...m, content } : m)),
    );
  }, []);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isStreaming) return;

      addMessage("user", text);
      historyRef.current.push({ role: "user", content: text });

      setIsStreaming(true);
      const assistantId = addMessage("assistant", "");
      let fullResponse = "";
      let gotCanvasUpdate = false;

      const controller = new AbortController();
      abortRef.current = controller;
      let lastUpdateTs = 0;
      let pendingUpdate: ReturnType<typeof setTimeout> | null = null;

      try {
        await api.stream(
          "/api/chat",
          {
            message: text,
            history: historyRef.current.slice(0, -1),
            ...(canvasIdRef.current ? { canvasId: canvasIdRef.current } : {}),
          },
          {
            onDelta: (_chunk, full) => {
              fullResponse = full;
              const now = Date.now();
              if (now - lastUpdateTs >= STREAM_THROTTLE_MS) {
                lastUpdateTs = now;
                if (pendingUpdate) clearTimeout(pendingUpdate);
                pendingUpdate = null;
                updateMessage(assistantId, full);
              } else if (!pendingUpdate) {
                pendingUpdate = setTimeout(() => {
                  pendingUpdate = null;
                  lastUpdateTs = Date.now();
                  updateMessage(assistantId, fullResponse);
                }, STREAM_THROTTLE_MS);
              }
            },
            onCanvasUpdate: (data) => {
              gotCanvasUpdate = true;
              onCanvasUpdate?.(data);
            },
            onDone: () => {
              if (pendingUpdate) {
                clearTimeout(pendingUpdate);
                pendingUpdate = null;
              }
              updateMessage(assistantId, fullResponse);
              historyRef.current.push({
                role: "assistant",
                content: fullResponse,
              });

              if (!gotCanvasUpdate) {
                const md = extractCanvasFromText(fullResponse);
                if (md) {
                  onCanvasUpdate?.({ markdown: md, valid: true });
                }
              }
            },
            onError: (err) => {
              updateMessage(assistantId, `Erro: ${err.message}`);
            },
          },
          controller.signal,
        );
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          updateMessage(
            assistantId,
            `Erro: ${(err as Error).message}`,
          );
        }
      } finally {
        setIsStreaming(false);
        abortRef.current = null;
      }
    },
    [isStreaming, addMessage, updateMessage, onCanvasUpdate],
  );

  const abort = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const clearChat = useCallback(() => {
    setMessages([]);
    historyRef.current = [];
  }, []);

  const setCanvasId = useCallback((id: string | null) => {
    canvasIdRef.current = id;
  }, []);

  return {
    messages,
    isStreaming,
    sendMessage,
    abort,
    clearChat,
    setCanvasId,
  };
}
