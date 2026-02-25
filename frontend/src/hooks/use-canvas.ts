import { useCallback, useRef, useState } from "react";
import { api } from "@/lib/api";
import { getTemplate } from "@/lib/parser";

interface CanvasRecord {
  id: string;
  title: string;
  content: string;
  canvas_type: string;
  is_public: boolean;
  updated_at: string;
  cloudId?: string;
}

export function useCanvas() {
  const [markdown, setMarkdown] = useState<string>(() => getTemplate("bmc"));
  const [savedCanvases, setSavedCanvases] = useState<CanvasRecord[]>([]);
  const [activeCanvasId, setActiveCanvasId] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const loadUserCanvases = useCallback(async () => {
    try {
      const res = await api.get<{
        data: { canvas: CanvasRecord[] };
      }>("/api/canvas?limit=50");
      setSavedCanvases(res.data.canvas);
    } catch {
      // not authenticated or no canvases
    }
  }, []);

  const saveToCloud = useCallback(
    async (title?: string) => {
      const t = title || "Sem título";
      const type = markdown.trim().startsWith("lmc") ? "lmc" : "bmc";

      if (activeCanvasId) {
        await api.put(`/api/canvas/${activeCanvasId}`, {
          title: t,
          content: markdown,
        });
      } else {
        const res = await api.post<{
          data: { canvas: { id: string } };
        }>("/api/canvas", {
          title: t,
          content: markdown,
          canvasType: type,
          isPublic: false,
        });
        setActiveCanvasId(res.data.canvas.id);
      }
      await loadUserCanvases();
    },
    [markdown, activeCanvasId, loadUserCanvases],
  );

  const loadCanvas = useCallback(async (id: string) => {
    const res = await api.get<{
      data: { canvas: { id: string; content: string; title: string } };
    }>(`/api/canvas/${id}`);
    setMarkdown(res.data.canvas.content);
    setActiveCanvasId(id);
    return res.data.canvas;
  }, []);

  const deleteCanvas = useCallback(
    async (id: string) => {
      await api.delete(`/api/canvas/${id}`);
      if (activeCanvasId === id) {
        setActiveCanvasId(null);
        setMarkdown(getTemplate("bmc"));
      }
      await loadUserCanvases();
    },
    [activeCanvasId, loadUserCanvases],
  );

  const newCanvas = useCallback((type: "bmc" | "lmc" = "bmc") => {
    setActiveCanvasId(null);
    setMarkdown(getTemplate(type));
  }, []);

  const debouncedAutoSave = useCallback(
    (content: string) => {
      setMarkdown(content);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        if (activeCanvasId) {
          api
            .put(`/api/canvas/${activeCanvasId}`, { content })
            .catch(() => {});
        }
      }, 2000);
    },
    [activeCanvasId],
  );

  return {
    markdown,
    setMarkdown,
    savedCanvases,
    activeCanvasId,
    setActiveCanvasId,
    loadUserCanvases,
    saveToCloud,
    loadCanvas,
    deleteCanvas,
    newCanvas,
    debouncedAutoSave,
  };
}
