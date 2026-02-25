import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { api } from "@/lib/api";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import {
  ArrowLeft,
  LogOut,
  Users,
  LayoutDashboard as LayoutIcon,
  Shield,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface StatsData {
  users: { total: number; verified: number; active: number; recentSignups: number };
  canvas: { total: number; public: number };
}

interface UserRow {
  id: string;
  name: string;
  email: string;
  roles: string[];
  is_verified: boolean;
  is_active: boolean;
  created_at: string;
}

interface CanvasRow {
  id: string;
  title: string;
  canvas_type: string;
  author_name: string;
  author_email: string;
  is_public: boolean;
  updated_at: string;
}

interface RoleRow {
  name: string;
  description: string;
  permissions: { resource: string; action: string }[];
}

interface Pagination {
  page: number;
  pages: number;
  total: number;
}

function fmtDate(iso: string) {
  if (!iso) return "-";
  return new Date(iso).toLocaleDateString("pt-BR");
}

export default function AdminPage() {
  const { user, isAdmin, loading, logout } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState<StatsData | null>(null);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [usersPag, setUsersPag] = useState<Pagination>({ page: 1, pages: 1, total: 0 });
  const [userSearch, setUserSearch] = useState("");
  const [canvases, setCanvases] = useState<CanvasRow[]>([]);
  const [canvasPag, setCanvasPag] = useState<Pagination>({ page: 1, pages: 1, total: 0 });
  const [canvasSearch, setCanvasSearch] = useState("");
  const [roles, setRoles] = useState<RoleRow[]>([]);

  // edit user dialog
  const [editOpen, setEditOpen] = useState(false);
  const [editUser, setEditUser] = useState<{ id: string; name: string; email: string } | null>(null);

  // roles dialog
  const [rolesOpen, setRolesOpen] = useState(false);
  const [rolesUserId, setRolesUserId] = useState("");
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);

  const loadStats = useCallback(async () => {
    try {
      const res = await api.get<{ data: StatsData }>("/api/admin/stats");
      setStats(res.data);
    } catch { /* */ }
  }, []);

  const loadUsers = useCallback(async (page = 1) => {
    try {
      const params = new URLSearchParams({ page: String(page), limit: "15" });
      if (userSearch) params.set("search", userSearch);
      const res = await api.get<{
        data: { users: UserRow[]; pagination: Pagination };
      }>(`/api/admin/users?${params}`);
      setUsers(res.data.users);
      setUsersPag(res.data.pagination);
    } catch (e) {
      toast.error((e as { error?: string })?.error ?? "Erro");
    }
  }, [userSearch]);

  const loadCanvases = useCallback(async (page = 1) => {
    try {
      const params = new URLSearchParams({ page: String(page), limit: "15" });
      if (canvasSearch) params.set("search", canvasSearch);
      const res = await api.get<{
        data: { canvas: CanvasRow[]; pagination: Pagination };
      }>(`/api/admin/canvas?${params}`);
      setCanvases(res.data.canvas);
      setCanvasPag(res.data.pagination);
    } catch (e) {
      toast.error((e as { error?: string })?.error ?? "Erro");
    }
  }, [canvasSearch]);

  const loadRoles = useCallback(async () => {
    try {
      const res = await api.get<{ data: { roles: RoleRow[] } }>("/api/admin/roles");
      setRoles(res.data.roles);
    } catch { /* */ }
  }, []);

  useEffect(() => {
    if (loading) return;
    if (!isAdmin) {
      toast.error("Sem permissão de admin");
      navigate("/");
      return;
    }
    loadStats();
    loadUsers();
    loadCanvases();
    loadRoles();
  }, [loading, isAdmin, navigate, loadStats, loadUsers, loadCanvases, loadRoles]);

  useEffect(() => {
    const t = setTimeout(() => loadUsers(1), 350);
    return () => clearTimeout(t);
  }, [userSearch, loadUsers]);

  useEffect(() => {
    const t = setTimeout(() => loadCanvases(1), 350);
    return () => clearTimeout(t);
  }, [canvasSearch, loadCanvases]);

  async function handleSaveUser() {
    if (!editUser) return;
    try {
      await api.put(`/api/admin/users/${editUser.id}`, {
        name: editUser.name,
        email: editUser.email,
      });
      toast.success("Usuário atualizado");
      setEditOpen(false);
      loadUsers(usersPag.page);
      loadStats();
    } catch (e) {
      toast.error((e as { error?: string })?.error ?? "Erro");
    }
  }

  async function handleToggleStatus(u: UserRow) {
    const action = u.is_active ? "desativar" : "ativar";
    if (!confirm(`Deseja ${action} este usuário?`)) return;
    try {
      await api.put(`/api/admin/users/${u.id}/status`, { is_active: !u.is_active });
      toast.success(`Usuário ${u.is_active ? "desativado" : "ativado"}`);
      loadUsers(usersPag.page);
      loadStats();
    } catch (e) {
      toast.error((e as { error?: string })?.error ?? "Erro");
    }
  }

  async function handleDeleteUser(u: UserRow) {
    if (!confirm(`Excluir "${u.name}"? Irreversível.`)) return;
    try {
      await api.delete(`/api/admin/users/${u.id}`);
      toast.success("Usuário excluído");
      loadUsers(usersPag.page);
      loadStats();
    } catch (e) {
      toast.error((e as { error?: string })?.error ?? "Erro");
    }
  }

  function openRolesDialog(u: UserRow) {
    setRolesUserId(u.id);
    setSelectedRoles([...(u.roles || [])]);
    setRolesOpen(true);
  }

  async function handleSaveRoles() {
    if (!selectedRoles.length) {
      toast.error("Selecione pelo menos um role");
      return;
    }
    try {
      await api.put(`/api/admin/users/${rolesUserId}/roles`, { roles: selectedRoles });
      toast.success("Roles atualizados");
      setRolesOpen(false);
      loadUsers(usersPag.page);
    } catch (e) {
      toast.error((e as { error?: string })?.error ?? "Erro");
    }
  }

  async function handleDeleteCanvas(id: string, title: string) {
    if (!confirm(`Excluir canvas "${title}"?`)) return;
    try {
      await api.delete(`/api/admin/canvas/${id}`);
      toast.success("Canvas excluído");
      loadCanvases(canvasPag.page);
      loadStats();
    } catch (e) {
      toast.error((e as { error?: string })?.error ?? "Erro");
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* top bar */}
      <header className="flex items-center justify-between border-b bg-card px-4 py-2">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-lg font-semibold">Admin</h1>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">{user?.name}</span>
          <Button variant="ghost" size="sm" onClick={logout}>
            <LogOut className="mr-1 h-4 w-4" /> Sair
          </Button>
        </div>
      </header>

      <div className="mx-auto max-w-6xl p-4 lg:p-6">
        {/* stats */}
        {stats && (
          <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {[
              { label: "Usuários", value: stats.users.total, icon: Users },
              { label: "Verificados", value: stats.users.verified, icon: Shield },
              { label: "Ativos", value: stats.users.active, icon: Users },
              { label: "Novos (30d)", value: stats.users.recentSignups, icon: Users },
              { label: "Canvas", value: stats.canvas.total, icon: LayoutIcon },
              { label: "Públicos", value: stats.canvas.public, icon: LayoutIcon },
            ].map((s) => (
              <Card key={s.label}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-medium text-muted-foreground">
                    {s.label}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{s.value}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Tabs defaultValue="users">
          <TabsList>
            <TabsTrigger value="users">Usuários</TabsTrigger>
            <TabsTrigger value="canvas">Canvas</TabsTrigger>
            <TabsTrigger value="roles">Roles</TabsTrigger>
          </TabsList>

          {/* Users */}
          <TabsContent value="users">
            <Card>
              <CardHeader className="flex-row items-center justify-between space-y-0 pb-4">
                <CardTitle className="text-base">Usuários cadastrados</CardTitle>
                <Input
                  placeholder="Buscar nome ou email..."
                  className="max-w-xs"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                />
              </CardHeader>
              <CardContent className="overflow-x-auto p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Roles</TableHead>
                      <TableHead>Verificado</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Criado</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-muted-foreground">
                          Nenhum usuário encontrado
                        </TableCell>
                      </TableRow>
                    )}
                    {users.map((u) => (
                      <TableRow key={u.id}>
                        <TableCell className="font-medium">{u.name}</TableCell>
                        <TableCell>{u.email}</TableCell>
                        <TableCell>
                          {(u.roles || []).map((r) => (
                            <Badge key={r} variant="secondary" className="mr-1">
                              {r}
                            </Badge>
                          ))}
                        </TableCell>
                        <TableCell>
                          <Badge variant={u.is_verified ? "default" : "destructive"}>
                            {u.is_verified ? "Sim" : "Não"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={u.is_active ? "default" : "destructive"}>
                            {u.is_active ? "Ativo" : "Inativo"}
                          </Badge>
                        </TableCell>
                        <TableCell>{fmtDate(u.created_at)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setEditUser({ id: u.id, name: u.name, email: u.email });
                                setEditOpen(true);
                              }}
                            >
                              Editar
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleToggleStatus(u)}
                            >
                              {u.is_active ? "Desativar" : "Ativar"}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openRolesDialog(u)}
                            >
                              Roles
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDeleteUser(u)}
                            >
                              Excluir
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <PaginationBar
                  pagination={usersPag}
                  onPage={(p) => loadUsers(p)}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Canvas */}
          <TabsContent value="canvas">
            <Card>
              <CardHeader className="flex-row items-center justify-between space-y-0 pb-4">
                <CardTitle className="text-base">Todos os canvas</CardTitle>
                <Input
                  placeholder="Buscar título ou autor..."
                  className="max-w-xs"
                  value={canvasSearch}
                  onChange={(e) => setCanvasSearch(e.target.value)}
                />
              </CardHeader>
              <CardContent className="overflow-x-auto p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Título</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Autor</TableHead>
                      <TableHead>Público</TableHead>
                      <TableHead>Atualizado</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {canvases.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground">
                          Nenhum canvas encontrado
                        </TableCell>
                      </TableRow>
                    )}
                    {canvases.map((c) => (
                      <TableRow key={c.id}>
                        <TableCell className="font-medium">{c.title}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{c.canvas_type.toUpperCase()}</Badge>
                        </TableCell>
                        <TableCell>
                          {c.author_name}{" "}
                          <span className="text-muted-foreground">{c.author_email}</span>
                        </TableCell>
                        <TableCell>
                          <Badge variant={c.is_public ? "default" : "outline"}>
                            {c.is_public ? "Sim" : "Não"}
                          </Badge>
                        </TableCell>
                        <TableCell>{fmtDate(c.updated_at)}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeleteCanvas(c.id, c.title)}
                          >
                            Excluir
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <PaginationBar
                  pagination={canvasPag}
                  onPage={(p) => loadCanvases(p)}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Roles */}
          <TabsContent value="roles">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {roles.map((r) => (
                <Card key={r.name}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">{r.name}</CardTitle>
                    <p className="text-xs text-muted-foreground">{r.description}</p>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-1">
                      {(r.permissions || []).length === 0 && (
                        <span className="text-xs text-muted-foreground">Sem permissões</span>
                      )}
                      {(r.permissions || []).map((p) => (
                        <Badge key={`${p.resource}:${p.action}`} variant="secondary" className="text-[10px]">
                          {p.resource}:{p.action}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Edit user dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar usuário</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Nome</Label>
              <Input
                value={editUser?.name ?? ""}
                onChange={(e) =>
                  setEditUser((prev) => prev && { ...prev, name: e.target.value })
                }
              />
            </div>
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={editUser?.email ?? ""}
                onChange={(e) =>
                  setEditUser((prev) => prev && { ...prev, email: e.target.value })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveUser}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Roles dialog */}
      <Dialog open={rolesOpen} onOpenChange={setRolesOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Gerenciar roles</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            {roles.map((r) => (
              <label key={r.name} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={selectedRoles.includes(r.name)}
                  onChange={(e) => {
                    setSelectedRoles((prev) =>
                      e.target.checked
                        ? [...prev, r.name]
                        : prev.filter((x) => x !== r.name),
                    );
                  }}
                  className="accent-primary"
                />
                <span className="text-sm">{r.name}</span>
                {r.description && (
                  <span className="text-xs text-muted-foreground">— {r.description}</span>
                )}
              </label>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRolesOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveRoles}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PaginationBar({
  pagination: p,
  onPage,
}: {
  pagination: Pagination;
  onPage: (n: number) => void;
}) {
  if (p.pages <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-2 border-t p-3">
      <Button
        variant="outline"
        size="sm"
        disabled={p.page <= 1}
        onClick={() => onPage(p.page - 1)}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <span className="text-sm text-muted-foreground">
        {p.page} / {p.pages}
      </span>
      <Button
        variant="outline"
        size="sm"
        disabled={p.page >= p.pages}
        onClick={() => onPage(p.page + 1)}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
