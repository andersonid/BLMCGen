import { useCallback, useEffect, useRef } from "react";
import { parse } from "@/lib/parser";
import { render } from "@/lib/renderer";

interface Props {
  markdown: string;
}

export default function CanvasPreview({ markdown }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const draw = useCallback(() => {
    const cvs = canvasRef.current;
    const container = containerRef.current;
    if (!cvs || !container) return;

    const rect = container.getBoundingClientRect();
    const w = Math.max(Math.floor(rect.width), 400);
    const h = Math.max(Math.floor(rect.height), 300);

    cvs.width = w;
    cvs.height = h;
    cvs.style.width = w + "px";
    cvs.style.height = h + "px";

    try {
      const data = parse(markdown);
      render(cvs, data);
    } catch {
      const ctx = cvs.getContext("2d")!;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = "#888";
      ctx.font = "14px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("Edite o código para visualizar o canvas", w / 2, h / 2);
    }
  }, [markdown]);

  useEffect(() => {
    const timer = setTimeout(draw, 100);
    return () => clearTimeout(timer);
  }, [draw]);

  useEffect(() => {
    const observer = new ResizeObserver(() => draw());
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [draw]);

  return (
    <div ref={containerRef} className="h-full w-full overflow-auto bg-white">
      <canvas ref={canvasRef} />
    </div>
  );
}
