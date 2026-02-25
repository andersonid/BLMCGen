import { useEffect } from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  LayoutDashboard,
  Plus,
  FileText,
  Trash2,
  LogOut,
  Settings,
  Globe,
  User,
  Sun,
  Moon,
  Monitor,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "@/hooks/use-theme";
import { setLanguage, getLanguage, getAvailableLanguages } from "@/lib/i18n";
import { useNavigate } from "react-router-dom";

interface CanvasItem {
  id: string;
  title: string;
  canvas_type: string;
  updated_at: string;
}

interface Props {
  canvases: CanvasItem[];
  activeCanvasId: string | null;
  onNewCanvas: (type: "bmc" | "lmc") => void;
  onLoadCanvas: (id: string) => void;
  onDeleteCanvas: (id: string) => void;
  onLoadCanvases: () => void;
}

const LANG_LABELS: Record<string, string> = {
  en: "English",
  pt: "Português",
  es: "Español",
};

export default function AppSidebar({
  canvases,
  activeCanvasId,
  onNewCanvas,
  onLoadCanvas,
  onDeleteCanvas,
  onLoadCanvases,
}: Props) {
  const { user, logout, isAdmin } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();

  useEffect(() => {
    onLoadCanvases();
  }, [onLoadCanvases]);

  return (
    <Sidebar>
      <SidebarHeader className="border-b p-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <LayoutDashboard className="h-4 w-4" />
          </div>
          <span className="text-lg font-bold">BLMCGen</span>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Novo Canvas</SidebarGroupLabel>
          <SidebarGroupContent>
            <div className="flex gap-2 px-2">
              <Button
                size="sm"
                variant="outline"
                className="flex-1"
                onClick={() => onNewCanvas("bmc")}
              >
                <Plus className="mr-1 h-3 w-3" /> BMC
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="flex-1"
                onClick={() => onNewCanvas("lmc")}
              >
                <Plus className="mr-1 h-3 w-3" /> LMC
              </Button>
            </div>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Meus Canvas</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {canvases.length === 0 && (
                <p className="px-4 py-2 text-xs text-muted-foreground">
                  Nenhum canvas salvo
                </p>
              )}
              {canvases.map((c) => (
                <SidebarMenuItem key={c.id}>
                  <SidebarMenuButton
                    isActive={c.id === activeCanvasId}
                    onClick={() => onLoadCanvas(c.id)}
                    className="group"
                  >
                    <FileText className="h-4 w-4 shrink-0" />
                    <span className="flex-1 truncate text-sm">
                      {c.title || "Sem título"}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5 opacity-0 transition-opacity group-hover:opacity-100"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteCanvas(c.id);
                      }}
                    >
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Configurações</SidebarGroupLabel>
          <SidebarGroupContent>
            <div className="space-y-2 px-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <Globe className="mr-2 h-3.5 w-3.5" />
                    {LANG_LABELS[getLanguage()] ?? getLanguage()}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {getAvailableLanguages().map((l) => (
                    <DropdownMenuItem
                      key={l}
                      onClick={() => {
                        setLanguage(l);
                        window.location.reload();
                      }}
                    >
                      {LANG_LABELS[l] ?? l}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    {theme === "dark" ? (
                      <Moon className="mr-2 h-3.5 w-3.5" />
                    ) : theme === "light" ? (
                      <Sun className="mr-2 h-3.5 w-3.5" />
                    ) : (
                      <Monitor className="mr-2 h-3.5 w-3.5" />
                    )}
                    {theme === "dark" ? "Escuro" : theme === "light" ? "Claro" : "Sistema"}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => setTheme("light")}>
                    <Sun className="mr-2 h-4 w-4" /> Claro
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTheme("dark")}>
                    <Moon className="mr-2 h-4 w-4" /> Escuro
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTheme("system")}>
                    <Monitor className="mr-2 h-4 w-4" /> Sistema
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t p-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="w-full justify-start gap-2">
              <User className="h-4 w-4" />
              <span className="truncate text-sm">{user?.name ?? "Usuário"}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            {isAdmin && (
              <DropdownMenuItem onClick={() => navigate("/admin")}>
                <Settings className="mr-2 h-4 w-4" /> Admin
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={logout}>
              <LogOut className="mr-2 h-4 w-4" /> Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
