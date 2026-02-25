import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Square, Sparkles } from "lucide-react";
import type { ChatMessage } from "@/hooks/use-chat";
import { cn } from "@/lib/utils";

interface Props {
  messages: ChatMessage[];
  isStreaming: boolean;
  onSend: (text: string) => void;
  onAbort: () => void;
}

function renderMarkdown(text: string): string {
  let html = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang: string, code: string) => {
    const trimmed = code.trim();
    const isCanvas =
      lang === "canvas" ||
      lang === "bmc" ||
      lang === "lmc" ||
      /^(bmc|lmc)\b/.test(trimmed);
    const cls = isCanvas ? "canvas-block" : "code-block";
    return `<pre class="${cls}"><code>${trimmed}</code></pre>`;
  });

  html = html.replace(/`([^`]+)`/g, "<code>$1</code>");
  html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\*(.+?)\*/g, "<em>$1</em>");
  html = html.replace(/^- (.+)$/gm, "<li>$1</li>");
  html = html.replace(/(<li>[\s\S]*?<\/li>)/g, "<ul>$1</ul>");
  html = html.replace(/\n/g, "<br>");
  return html;
}

const QUICK_ACTIONS = [
  { label: "BMC", prompt: "Quero criar um Business Model Canvas. Me ajude!" },
  {
    label: "LMC",
    prompt: "Quero criar um Lean Model Canvas para minha startup. Me ajude!",
  },
  {
    label: "Melhorar",
    prompt: "Analise meu canvas atual e sugira melhorias.",
  },
];

export default function ChatPanel({
  messages,
  isStreaming,
  onSend,
  onAbort,
}: Props) {
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages]);

  function handleSend() {
    const text = input.trim();
    if (!text || isStreaming) return;
    onSend(text);
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function handleInput() {
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = "auto";
      ta.style.height = Math.min(ta.scrollHeight, 120) + "px";
    }
  }

  const showWelcome = messages.length === 0;

  return (
    <div className="flex h-full flex-col">
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        {showWelcome && (
          <div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
              <Sparkles className="h-7 w-7 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">
                Assistente BLMCGen
              </h3>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                Descreva seu negócio e eu crio um Business Model Canvas ou Lean
                Model Canvas completo para você.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              {QUICK_ACTIONS.map((a) => (
                <Button
                  key={a.label}
                  variant="outline"
                  size="sm"
                  onClick={() => onSend(a.prompt)}
                  disabled={isStreaming}
                >
                  {a.label}
                </Button>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                "flex",
                msg.role === "user" ? "justify-end" : "justify-start",
              )}
            >
              <div
                className={cn(
                  "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm",
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted",
                )}
              >
                {msg.role === "assistant" ? (
                  <div
                    className="prose prose-sm dark:prose-invert max-w-none [&_.canvas-block]:rounded [&_.canvas-block]:bg-background/50 [&_.canvas-block]:p-2 [&_.canvas-block]:text-xs [&_.code-block]:rounded [&_.code-block]:bg-background/50 [&_.code-block]:p-2 [&_.code-block]:text-xs [&_code]:rounded [&_code]:bg-background/50 [&_code]:px-1 [&_code]:text-xs [&_li]:ml-4 [&_ul]:list-disc"
                    dangerouslySetInnerHTML={{
                      __html: renderMarkdown(msg.content || "Pensando..."),
                    }}
                  />
                ) : (
                  <span className="whitespace-pre-wrap">{msg.content}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* input */}
      <div className="border-t p-3">
        <div className="flex items-end gap-2">
          <textarea
            ref={textareaRef}
            className="flex-1 resize-none rounded-lg border bg-background px-3 py-2 text-sm outline-none ring-ring focus-visible:ring-2"
            placeholder="Descreva seu negócio ou peça ajuda..."
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onInput={handleInput}
          />
          {isStreaming ? (
            <Button size="icon" variant="destructive" onClick={onAbort}>
              <Square className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              size="icon"
              onClick={handleSend}
              disabled={!input.trim()}
            >
              <Send className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
