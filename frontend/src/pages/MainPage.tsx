import { useCallback } from "react";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import AppSidebar from "@/components/layout/AppSidebar";
import ChatPanel from "@/components/chat/ChatPanel";
import CanvasPanel from "@/components/canvas/CanvasPanel";
import { useChat } from "@/hooks/use-chat";
import { useCanvas } from "@/hooks/use-canvas";
import { toast } from "sonner";

export default function MainPage() {
  const {
    markdown,
    setMarkdown,
    savedCanvases,
    activeCanvasId,
    loadUserCanvases,
    loadCanvas,
    deleteCanvas,
    newCanvas,
    debouncedAutoSave,
  } = useCanvas();

  const handleCanvasUpdate = useCallback(
    (data: { markdown: string; valid: boolean }) => {
      if (data.markdown && data.valid) {
        setMarkdown(data.markdown);
        debouncedAutoSave(data.markdown);
      }
    },
    [setMarkdown, debouncedAutoSave],
  );

  const { messages, isStreaming, sendMessage, abort } = useChat({
    onCanvasUpdate: handleCanvasUpdate,
  });

  const handleMarkdownChange = useCallback(
    (value: string) => {
      setMarkdown(value);
      debouncedAutoSave(value);
    },
    [setMarkdown, debouncedAutoSave],
  );

  const handleLoadCanvas = useCallback(
    async (id: string) => {
      try {
        await loadCanvas(id);
      } catch {
        toast.error("Erro ao carregar canvas");
      }
    },
    [loadCanvas],
  );

  const handleDeleteCanvas = useCallback(
    async (id: string) => {
      if (!confirm("Excluir este canvas?")) return;
      try {
        await deleteCanvas(id);
        toast.success("Canvas excluído");
      } catch {
        toast.error("Erro ao excluir");
      }
    },
    [deleteCanvas],
  );

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full">
        <AppSidebar
          canvases={savedCanvases}
          activeCanvasId={activeCanvasId}
          onNewCanvas={newCanvas}
          onLoadCanvas={handleLoadCanvas}
          onDeleteCanvas={handleDeleteCanvas}
          onLoadCanvases={loadUserCanvases}
        />

        <main className="flex flex-1 flex-col overflow-hidden">
          <header className="flex h-11 items-center border-b px-2">
            <SidebarTrigger />
          </header>

          <ResizablePanelGroup direction="horizontal" className="flex-1">
            <ResizablePanel defaultSize={40} minSize={25}>
              <ChatPanel
                messages={messages}
                isStreaming={isStreaming}
                onSend={sendMessage}
                onAbort={abort}
              />
            </ResizablePanel>

            <ResizableHandle withHandle />

            <ResizablePanel defaultSize={60} minSize={30}>
              <CanvasPanel
                markdown={markdown}
                onMarkdownChange={handleMarkdownChange}
              />
            </ResizablePanel>
          </ResizablePanelGroup>
        </main>
      </div>
    </SidebarProvider>
  );
}
