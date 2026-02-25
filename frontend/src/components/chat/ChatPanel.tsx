import {
  useEffect,
  useRef,
  useState,
  useCallback,
  memo,
  type KeyboardEvent,
} from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Square, Sparkles, ChevronDown, ChevronUp } from "lucide-react";
import type { ChatMessage } from "@/hooks/use-chat";
import { cn } from "@/lib/utils";

const USER_MSG_COLLAPSED_LEN = 800;

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

const MessageBubble = memo(function MessageBubble({
  msg,
}: {
  msg: ChatMessage;
}) {
  const [expanded, setExpanded] = useState(false);
  const isLong =
    msg.role === "user" && msg.content.length > USER_MSG_COLLAPSED_LEN;

  const displayContent =
    isLong && !expanded
      ? msg.content.slice(0, USER_MSG_COLLAPSED_LEN) + "…"
      : msg.content;

  return (
    <div
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
          <>
            <span className="whitespace-pre-wrap break-words">
              {displayContent}
            </span>
            {isLong && (
              <button
                onClick={() => setExpanded((v) => !v)}
                className="mt-1 flex items-center gap-1 text-xs opacity-70 hover:opacity-100"
              >
                {expanded ? (
                  <>
                    <ChevronUp className="h-3 w-3" /> Recolher
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-3 w-3" /> Mostrar tudo (
                    {(msg.content.length / 1000).toFixed(1)}k caracteres)
                  </>
                )}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
});

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

function ChatInput({
  isStreaming,
  onSend,
  onAbort,
}: {
  isStreaming: boolean;
  onSend: (text: string) => void;
  onAbort: () => void;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [hasText, setHasText] = useState(false);
  const resizeRaf = useRef<number>(0);

  const resize = useCallback(() => {
    cancelAnimationFrame(resizeRaf.current);
    resizeRaf.current = requestAnimationFrame(() => {
      const ta = textareaRef.current;
      if (!ta) return;
      ta.style.height = "auto";
      ta.style.height = Math.min(ta.scrollHeight, 200) + "px";
    });
  }, []);

  const handleChange = useCallback(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    setHasText(ta.value.trim().length > 0);
    resize();
  }, [resize]);

  const handleSend = useCallback(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    const text = ta.value.trim();
    if (!text || isStreaming) return;
    onSend(text);
    ta.value = "";
    ta.style.height = "auto";
    setHasText(false);
  }, [isStreaming, onSend]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend],
  );

  return (
    <div className="border-t p-3">
      <div className="flex items-end gap-2">
        <textarea
          ref={textareaRef}
          className="flex-1 resize-none overflow-y-auto rounded-lg border bg-background px-3 py-2 text-sm outline-none ring-ring focus-visible:ring-2"
          placeholder="Descreva seu negócio ou peça ajuda..."
          rows={1}
          style={{ maxHeight: 200 }}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
        />
        {isStreaming ? (
          <Button size="icon" variant="destructive" onClick={onAbort}>
            <Square className="h-4 w-4" />
          </Button>
        ) : (
          <Button size="icon" onClick={handleSend} disabled={!hasText}>
            <Send className="h-4 w-4" />
          </Button>
        )}
      </div>
      <p className="mt-1 text-[10px] text-muted-foreground">
        Shift+Enter para nova linha. Aceita textos longos.
      </p>
    </div>
  );
}

interface Props {
  messages: ChatMessage[];
  isStreaming: boolean;
  onSend: (text: string) => void;
  onAbort: () => void;
}

export default function ChatPanel({
  messages,
  isStreaming,
  onSend,
  onAbort,
}: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

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
              <h3 className="text-lg font-semibold">Assistente BLMCGen</h3>
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
            <MessageBubble key={msg.id} msg={msg} />
          ))}
        </div>
      </ScrollArea>

      <ChatInput
        isStreaming={isStreaming}
        onSend={onSend}
        onAbort={onAbort}
      />
    </div>
  );
}
