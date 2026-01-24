import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Plus, Phone, Pencil } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { TeamCard, equipesCatalog } from "@/data/equipesCatalog";
import { useEquipes } from '../hooks/useEquipes';

const STORAGE_KEY = "equipes-cards";

const TeamBoard = ({ team, onEdit }: { team: TeamCard; onEdit?: () => void }) => {
  const prefix = team.code.replace(/\d+/g, "");
  const number = team.code.replace(/\D+/g, "");

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white shadow-sm overflow-hidden">
      {onEdit && (
        <div className="flex justify-end px-4 pt-3">
          <Button size="sm" variant="outline" className="h-8 px-2" onClick={onEdit}>
            <Pencil className="h-4 w-4" />
            <span className="ml-1 text-xs">Editar</span>
          </Button>
        </div>
      )}
      <div className="grid grid-cols-[160px_1fr] border-b">
        <div className="border-r">
          <div className="bg-amber-200 font-semibold text-center text-[11px] tracking-[0.12em] py-2 border-b uppercase text-neutral-800">
            Equipe
          </div>
          <div className="flex items-center justify-center py-4 bg-neutral-50">
            <div className="h-24 w-24 rounded-full border-[6px] border-[#c53030] flex flex-col items-center justify-center text-2xl font-black text-[#c53030] tracking-wide shadow-sm bg-white">
              <span className="text-2xl leading-none">{prefix || "E"}</span>
              <span className="text-2xl leading-6">{number}</span>
            </div>
          </div>
        </div>
        <div>
          <div className="bg-amber-200 font-semibold text-center text-[11px] tracking-[0.12em] py-2 border-b uppercase text-neutral-800">
            Encarregado
          </div>
          <div className="flex flex-col items-start justify-center px-4 py-6 gap-3 text-sm font-semibold text-neutral-900 uppercase leading-tight">
            <span className="inline-block bg-amber-50 px-4 py-2 rounded-md border border-amber-100 shadow-inner text-[13px] whitespace-nowrap truncate max-w-full">
              {team.encarregado}
            </span>
            <span className="flex items-center gap-2 text-xs font-normal text-neutral-700 normal-case">
              <Phone className="h-3 w-3" />
              <span className="tracking-wide">{team.phone}</span>
            </span>
            {team.linha && (
              <Badge
                className={cn(
                  "uppercase text-[11px] font-semibold",
                  team.linha === "viva" ? "bg-purple-600 text-white" : "bg-emerald-600 text-white"
                )}
              >
                Linha {team.linha}
              </Badge>
            )}
            <Badge
              className={cn(
                "uppercase text-[11px] font-semibold",
                team.ativa === false ? "bg-neutral-400 text-white" : "bg-blue-600 text-white"
              )}
            >
              {team.ativa === false ? "Inativa" : "Ativa"}
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );
};

const Equipes = () => {
  const [teams, setTeams] = useState<TeamCard[]>(equipesCatalog);
  const [open, setOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [form, setForm] = useState({
    code: "",
    encarregado: "",
    phone: "",
    linha: "morta" as "viva" | "morta",
    membersText: "",
    ativa: true,
  });
  const { toast } = useToast();

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as TeamCard[];
        setTeams(parsed);
      } catch {
        // ignore parse errors
      }
    }
  }, []);

  const persist = (data: TeamCard[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  };

  const resetForm = () =>
    setForm({
      code: "",
      encarregado: "",
      phone: "",
      linha: "morta",
      membersText: "",
      ativa: true,
    });

  const handleOpenNew = () => {
    resetForm();
    setEditingIndex(null);
    setOpen(true);
  };

  const handleEdit = (index: number) => {
    const t = teams[index];
    setForm({
      code: t.code,
      encarregado: t.encarregado,
      phone: t.phone,
      linha: t.linha || "morta",
      membersText: t.members.join("\n"),
      ativa: t.ativa !== false,
    });
    setEditingIndex(index);
    setOpen(true);
  };

  const handleSave = () => {
    try {
      if (!form.code.trim() || !form.encarregado.trim()) {
          throw new Error("Código e encarregado são obrigatórios");
      }
      const code = form.code.trim().toUpperCase();
      const encarregado = form.encarregado.trim().toUpperCase();
      const members = form.membersText
        .split(/\n+/)
        .map((m) => m.trim())
        .filter(Boolean);
      // checar duplicidade de código
      const isCodeDuplicate = teams.some(
        (t, i) => i !== editingIndex && t.code.toUpperCase() === code
      );
      if (isCodeDuplicate) {
        throw new Error("Já existe uma equipe com esse código.");
      }
      // checar duplicidade de encarregado
      const isEncarregadoDuplicate = teams.some(
        (t, i) => i !== editingIndex && t.encarregado.toUpperCase() === encarregado
      );
      if (isEncarregadoDuplicate) {
        throw new Error("Esse encarregado já está vinculado a outra equipe.");
      }
      // checar duplicidade de componentes (global)
      const existingMembers = new Set<string>();
      teams.forEach((t, i) => {
        if (i === editingIndex) return;
        t.members.forEach((m) => existingMembers.add(m.toUpperCase()));
      });
      const repeated = members.find((m) => existingMembers.has(m.toUpperCase()));
      if (repeated) {
        throw new Error(`O componente "${repeated}" já está em outra equipe.`);
      }
      const newTeam: TeamCard = {
        code,
        encarregado,
      members,
      phone: form.phone.trim(),
      linha: form.linha,
      ativa: form.ativa,
    };
      let updated: TeamCard[];
      if (editingIndex !== null) {
        updated = teams.map((t, i) => (i === editingIndex ? newTeam : t));
      } else {
        updated = [...teams, newTeam];
      }
      setTeams(updated);
      persist(updated);
      toast({
        title: "Equipe salva",
        description: editingIndex !== null ? "Dados atualizados com sucesso." : "Equipe adicionada com sucesso.",
        className: "bg-emerald-50 border-emerald-200 text-emerald-900",
      });
      resetForm();
      setEditingIndex(null);
      setOpen(false);
    } catch (err: any) {
      toast({
        title: "Erro ao salvar equipe",
        description: err?.message || "Não foi possível salvar a equipe.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold text-foreground">Equipes</h1>
          <Badge variant="outline" className="text-xs">
            {teams.length} registradas
          </Badge>
        </div>
        <Button className="gap-2" onClick={handleOpenNew}>
          <Plus className="h-4 w-4" />
          Nova Equipe
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {teams.map((team, index) => (
          <TeamBoard key={team.code} team={team} onEdit={() => handleEdit(index)} />
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingIndex !== null ? "Editar equipe" : "Nova equipe"}</DialogTitle>
            <DialogDescription>Preencha os dados para gerar o cartão.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-2">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">Código</Label>
            <Input
              value={form.code}
              onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
              placeholder="E99"
            />
          </div>
          <div>
            <Label className="text-xs">Linha</Label>
                <select
                  className="w-full rounded-md border px-3 py-2 text-sm"
                  value={form.linha}
                  onChange={(e) => setForm((f) => ({ ...f, linha: e.target.value as "viva" | "morta" }))}
                >
                  <option value="morta">Morta</option>
                  <option value="viva">Viva</option>
                </select>
              </div>
            </div>
            <div>
              <Label className="text-xs">Encarregado</Label>
              <Input
                value={form.encarregado}
                onChange={(e) => setForm((f) => ({ ...f, encarregado: e.target.value }))}
                placeholder="Nome do encarregado"
              />
            </div>
            <div>
              <Label className="text-xs">Telefone</Label>
              <Input
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                placeholder="(65) 9 0000-0000"
              />
            </div>
            <div className="flex items-center gap-2">
              <Label className="text-xs">Equipe ativa?</Label>
              <input
                type="checkbox"
                checked={form.ativa}
                onChange={(e) => setForm((f) => ({ ...f, ativa: e.target.checked }))}
              />
            </div>
            <div>
              <Label className="text-xs">Componentes (1 por linha)</Label>
              <Textarea
                value={form.membersText}
                onChange={(e) => setForm((f) => ({ ...f, membersText: e.target.value }))}
                rows={4}
                placeholder={"Fulano\nBeltrano\nCiclano"}
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>{editingIndex !== null ? "Salvar" : "Adicionar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Equipes;
