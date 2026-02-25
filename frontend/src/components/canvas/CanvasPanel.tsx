import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import CanvasPreview from "./CanvasPreview";
import CodeEditor from "./CodeEditor";
import { Download, FileImage, FileText } from "lucide-react";
import { exportPDF, exportPNG } from "@/lib/renderer";
import { parse } from "@/lib/parser";
import { render as renderCanvas } from "@/lib/renderer";
import { toast } from "sonner";

interface Props {
  markdown: string;
  onMarkdownChange: (value: string) => void;
}

export default function CanvasPanel({ markdown, onMarkdownChange }: Props) {
  function handleExportPNG() {
    try {
      const cvs = document.createElement("canvas");
      cvs.width = 1200;
      cvs.height = 800;
      const data = parse(markdown);
      renderCanvas(cvs, data);
      const url = exportPNG(cvs);
      const link = document.createElement("a");
      link.download = "canvas.png";
      link.href = url;
      link.click();
      toast.success("PNG exportado!");
    } catch {
      toast.error("Erro ao exportar PNG");
    }
  }

  async function handleExportPDF() {
    try {
      const cvs = document.createElement("canvas");
      cvs.width = 1200;
      cvs.height = 800;
      const data = parse(markdown);
      renderCanvas(cvs, data);
      await exportPDF(cvs, "canvas.pdf");
      toast.success("PDF exportado!");
    } catch {
      toast.error("Erro ao exportar PDF");
    }
  }

  function handleSaveFile() {
    const blob = new Blob([markdown], { type: "text/markdown" });
    const link = document.createElement("a");
    link.download = "canvas.md";
    link.href = URL.createObjectURL(blob);
    link.click();
    URL.revokeObjectURL(link.href);
  }

  return (
    <Tabs defaultValue="canvas" className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b px-2">
        <TabsList className="h-9">
          <TabsTrigger value="canvas" className="text-xs">
            Canvas
          </TabsTrigger>
          <TabsTrigger value="code" className="text-xs">
            Código
          </TabsTrigger>
        </TabsList>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={handleExportPNG}
            title="Exportar PNG"
          >
            <FileImage className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={handleExportPDF}
            title="Exportar PDF"
          >
            <Download className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={handleSaveFile}
            title="Salvar .md"
          >
            <FileText className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <TabsContent value="canvas" className="mt-0 flex-1">
        <CanvasPreview markdown={markdown} />
      </TabsContent>

      <TabsContent value="code" className="mt-0 flex-1">
        <CodeEditor value={markdown} onChange={onMarkdownChange} />
      </TabsContent>
    </Tabs>
  );
}
