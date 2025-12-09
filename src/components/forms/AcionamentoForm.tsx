import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

type EquipeOption = {
  id_equipe: string;
  nome_equipe: string;
  encarregado_nome?: string | null;
  linha?: string | null;
  ativo?: string | null;
};

const schema = z.object({
  codigo_acionamento: z.string().min(1, "Código é obrigatório"),
  prioridade: z.enum(["emergencia", "programado"]),
  prioridade_nivel: z.enum(["normal", "media", "alta"]).optional(),
  modalidade: z.enum(["LM", "LV", "LM+LV"]),
  id_equipe: z.string().min(1, "Equipe é obrigatória"),
  encarregado: z.string().min(1, "Encarregado é obrigatório"),
  municipio: z.string().optional(),
  endereco: z.string().optional(),
  status: z.enum(["aberto", "despachado", "em_execucao", "concluido"]),
  data_abertura: z.string().min(1, "Data de abertura é obrigatória"),
  observacao: z.string().optional(),
  origem: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface Props {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const AcionamentoForm = ({ onSuccess, onCancel }: Props) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [equipes, setEquipes] = useState<EquipeOption[]>([]);
  const [loadingEq, setLoadingEq] = useState(false);
  const [encarregadoAuto, setEncarregadoAuto] = useState("");

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      codigo_acionamento: "",
      prioridade: "emergencia",
      prioridade_nivel: "normal",
      modalidade: "LM",
      id_equipe: "",
      encarregado: "",
      municipio: "",
      endereco: "",
      status: "aberto",
      data_abertura: "",
      observacao: "",
      origem: "web",
    },
  });

  const modalidade = form.watch("modalidade");

  const filteredEquipes = useMemo(() => {
    if (!modalidade || modalidade === "LM+LV") return equipes;
    return equipes.filter((e) => !e.linha || e.linha === modalidade);
  }, [equipes, modalidade]);

  useEffect(() => {
    const load = async () => {
      setLoadingEq(true);
      try {
        const { data, error } = await supabase
          .from("equipes")
          .select("id_equipe,nome_equipe,encarregado_nome,linha,ativo");
        if (error) throw error;
        const ativos = (data || []).filter((e) => e.ativo !== "N");
        setEquipes(ativos as EquipeOption[]);
      } catch (err) {
        toast({ description: "Não foi possível carregar as equipes.", variant: "destructive" });
      } finally {
        setLoadingEq(false);
      }
    };
    load();
  }, [toast]);

  const handleEquipe = (id: string) => {
    form.setValue("id_equipe", id);
    const eq = equipes.find((e) => e.id_equipe === id);
    if (eq?.encarregado_nome) {
      form.setValue("encarregado", eq.encarregado_nome);
      setEncarregadoAuto(eq.encarregado_nome);
    }
  };

  const onSubmit = async (data: FormData) => {
    if (!user) return;
    try {
      const { error } = await supabase.from("acionamentos").insert([
        {
          codigo_acionamento: data.codigo_acionamento,
          prioridade: data.prioridade,
          prioridade_nivel: data.prioridade_nivel,
          modalidade: data.modalidade,
          id_equipe: data.id_equipe,
          encarregado: data.encarregado,
          municipio: data.municipio || null,
          endereco: data.endereco || null,
          status: data.status,
          data_abertura: data.data_abertura,
          observacao: data.observacao || null,
          origem: data.origem || "web",
          etapa_atual: 1, // novos acionamentos comeam na etapa 1
        },
      ]);
      if (error) throw error;
      toast({ description: "Acionamento criado com sucesso." });
      onSuccess?.();
      form.reset();
    } catch (err: any) {
      toast({ description: err.message || "Erro ao criar acionamento.", variant: "destructive" });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="codigo_acionamento"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Código</FormLabel>
                <FormControl>
                  <Input placeholder="Ex.: 105" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="modalidade"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Modalidade</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {["LM", "LV", "LM+LV"].map((m) => (
                      <SelectItem key={m} value={m}>
                        {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="id_equipe"
            render={() => (
              <FormItem>
                <FormLabel>Equipe</FormLabel>
                <Select value={form.watch("id_equipe")} onValueChange={handleEquipe} disabled={loadingEq}>
                  <SelectTrigger>
                    <SelectValue placeholder={loadingEq ? "Carregando..." : "Selecione"} />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredEquipes.map((eq) => (
                      <SelectItem key={eq.id_equipe} value={eq.id_equipe}>
                        {eq.nome_equipe}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="encarregado"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Encarregado</FormLabel>
                <FormControl>
                  <Input {...field} placeholder={encarregadoAuto ? `Sugestão: ${encarregadoAuto}` : ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="prioridade"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Prioridade</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="emergencia">Emergência</SelectItem>
                    <SelectItem value="programado">Programado</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="prioridade_nivel"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nível</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="media">Média</SelectItem>
                    <SelectItem value="alta">Alta</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="aberto">Aberto</SelectItem>
                    <SelectItem value="despachado">Despachado</SelectItem>
                    <SelectItem value="em_execucao">Em execução</SelectItem>
                    <SelectItem value="concluido">Concluído</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="municipio"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Município</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="endereco"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Endereço</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="data_abertura"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Data de abertura</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="observacao"
          render={({ field }) => (
            <FormItem>
                <FormLabel>Observação</FormLabel>
              <FormControl>
                <Textarea {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-2 justify-end">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
          )}
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Salvar
          </Button>
        </div>
      </form>
    </Form>
  );
};
