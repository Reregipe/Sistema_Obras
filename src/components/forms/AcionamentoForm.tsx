import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";

import { zodResolver } from "@hookform/resolvers/zod";

import * as z from "zod";

import { supabase } from "@/integrations/supabase/client";

import { useAuth } from "@/hooks/useAuth";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";

import { Input } from "@/components/ui/input";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { Textarea } from "@/components/ui/textarea";

import { useToast } from "@/hooks/use-toast";

import { Loader2, UploadCloud } from "lucide-react";

import { cn } from "@/lib/utils";


type EquipeOption = {

  id_equipe: string;

  nome_equipe: string;

  encarregado_nome?: string | null;

  linha?: string | null;

  ativo?: string | null;

};


type EquipeLinha = "LM" | "LV";

type SelectedEquipes = Record<EquipeLinha, string[]>;

const normalizeEquipeLinha = (value?: string | null): EquipeLinha | undefined => {
  if (!value) return undefined;
  const normalized = value.trim().toLowerCase();
  if (normalized === "lv" || normalized === "linha viva" || normalized === "viva" || normalized.includes("linha viva")) {
    return "LV";
  }
  if (normalized === "lm" || normalized === "linha morta" || normalized === "morta" || normalized.includes("linha morta")) {
    return "LM";
  }
  return undefined;
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
  email_msg: z.string().optional(),
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
  const [selectedEquipes, setSelectedEquipes] = useState<SelectedEquipes>({ LM: [], LV: [] });
  const [emailAttachmentName, setEmailAttachmentName] = useState<string | null>(null);
  const [emailAttachmentError, setEmailAttachmentError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const triggerEmailAttachmentInput = () => {
    fileInputRef.current?.click();
  };


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
      email_msg: "",
    },

  });



  const modalidade = form.watch("modalidade");

  const prevModalidade = useRef(modalidade);
  const equipeOptionsByLinha = useMemo<Record<EquipeLinha, EquipeOption[]>>(() => {
    const grouped: Record<EquipeLinha, EquipeOption[]> = { LM: [], LV: [] };
    equipes.forEach((eq) => {
      const linha = normalizeEquipeLinha(eq.linha);
      if (linha === "LV") {
        grouped.LV.push(eq);
      } else if (linha === "LM") {
        grouped.LM.push(eq);
      } else {
        grouped.LM.push(eq);
        grouped.LV.push(eq);
      }
    });
    return grouped;
  }, [equipes]);

  const appendEncarregadoSuggestion = (nome?: string | null) => {
    if (!nome) return;
    const atual = form.getValues("encarregado") || "";
    const itens = atual
      .split(";")
      .map((item) => item.trim())
      .filter(Boolean);
    if (itens.includes(nome)) return;
    const proximo = itens.length ? [...itens, nome].join("; ") : nome;
    form.setValue("encarregado", proximo);
  };

  const setEquipeSingle = (linha: EquipeLinha, id: string) => {
    setSelectedEquipes((prev) => ({
      ...prev,
      [linha]: id ? [id] : [],
    }));
    form.setValue("id_equipe", id);
    form.clearErrors("id_equipe");
    const eq = equipes.find((team) => team.id_equipe === id);
    if (eq?.encarregado_nome) {
      appendEncarregadoSuggestion(eq.encarregado_nome);
    }
  };

  const toggleEquipeSelection = (linha: EquipeLinha, id: string) => {
    setSelectedEquipes((prev) => {
      const current = prev[linha] || [];
      const alreadySelected = current.includes(id);
      const next = alreadySelected ? current.filter((item) => item !== id) : [...current, id];
      if (!alreadySelected) {
        const eq = equipes.find((team) => team.id_equipe === id);
        if (eq?.encarregado_nome) {
          appendEncarregadoSuggestion(eq.encarregado_nome);
        }
      }
      return {
        ...prev,
        [linha]: next,
      };
    });
  };

  const resetEquipeSelection = () => {
    setSelectedEquipes({ LM: [], LV: [] });
    form.setValue("id_equipe", "");
  };

  const suggestedEncarregados = useMemo(() => {
    const ids = Array.from(new Set([...selectedEquipes.LM, ...selectedEquipes.LV]));
    return ids
      .map((id) => equipes.find((eq) => eq.id_equipe === id)?.encarregado_nome)
      .filter((nome): nome is string => Boolean(nome));
  }, [selectedEquipes, equipes]);

  const getPrimarySelectedId = () => selectedEquipes.LM[0] || selectedEquipes.LV[0] || "";

  useEffect(() => {
    if (modalidade !== "LM+LV") return;
    form.setValue("id_equipe", getPrimarySelectedId());
  }, [modalidade, selectedEquipes, form]);

  useEffect(() => {
    if (prevModalidade.current === modalidade) return;
    if (modalidade !== "LM+LV") {
      resetEquipeSelection();
      form.setValue("encarregado", "");
    }
    prevModalidade.current = modalidade;
  }, [modalidade, form]);

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



  const clearEmailAttachment = () => {
    setEmailAttachmentName(null);
    setEmailAttachmentError(null);
    form.setValue("email_msg", "");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleEmailAttachmentChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      clearEmailAttachment();
      return;
    }

    if (!file.name.toLowerCase().endsWith(".msg")) {
      setEmailAttachmentError("Envie apenas arquivos no formato .msg.");
      form.setValue("email_msg", "");
      setEmailAttachmentName(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      return;
    }

    setEmailAttachmentError(null);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        form.setValue("email_msg", reader.result);
        setEmailAttachmentName(file.name);
      } else {
        setEmailAttachmentError("Não foi possível ler o arquivo .msg.");
        form.setValue("email_msg", "");
        setEmailAttachmentName(null);
      }
    };
    reader.onerror = () => {
      setEmailAttachmentError("Não foi possível ler o arquivo .msg.");
      form.setValue("email_msg", "");
      setEmailAttachmentName(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    };
    reader.readAsDataURL(file);
  };

  const onSubmit = async (data: FormData) => {
    if (!user) return;

    if (modalidade === "LM+LV" && (!selectedEquipes.LM.length || !selectedEquipes.LV.length)) {
      form.setError("id_equipe", {
        type: "manual",
        message: "Selecione ao menos uma equipe para cada linha.",
      });
      return;
    }

    const buildEquipeEntries = () => {
      if (modalidade === "LM+LV") {
        const lmEntries = selectedEquipes.LM.map((id) => ({ linha: "LM" as EquipeLinha, id }));
        const lvEntries = selectedEquipes.LV.map((id) => ({ linha: "LV" as EquipeLinha, id }));
        return [...lmEntries, ...lvEntries];
      }
      const linha = modalidade === "LV" ? "LV" : "LM";
      const id = selectedEquipes[linha][0];
      if (!id) return [];
      return [{ linha, id }];
    };

    try {

      const payload = {

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
        email_msg: data.email_msg || null,
        etapa_atual: 1, // novos acionamentos comeam na etapa 1

      };

      const { data: inserted, error } = await supabase
        .from("acionamentos")
        .insert([payload])
        .select("id_acionamento")
        .maybeSingle();

      if (error) throw error;

      const createdId = inserted?.id_acionamento;

      if (createdId) {
        const equipeInsertions = buildEquipeEntries().map(({ linha, id }) => ({
          id_acionamento: createdId,
          id_equipe: id,
          papel: linha,
          criado_por: user.id,
        }));
        if (equipeInsertions.length > 0) {
          const { error: equipeError } = await supabase.from("acionamento_equipes").insert(equipeInsertions);
          if (equipeError) throw equipeError;
        }
      }

      toast({ description: "Acionamento criado com sucesso." });

      onSuccess?.();

      form.reset();
      clearEmailAttachment();
      resetEquipeSelection();
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
            render={() => {
              const isMulti = modalidade === "LM+LV";
              const modo: EquipeLinha = modalidade === "LV" ? "LV" : "LM";
              const selectLines: EquipeLinha[] = isMulti ? ["LM", "LV"] : [modo];
              return (
                <FormItem>
                  <FormLabel>{isMulti ? "Equipes" : "Equipe"}</FormLabel>
                  <FormControl>
                    {isMulti ? (
                      <div className="grid gap-4 md:grid-cols-2">
                        {selectLines.map((linha) => {
                          const options = equipeOptionsByLinha[linha];
                          const selectedIds = selectedEquipes[linha] || [];
                          return (
                            <div key={linha} className="space-y-2 rounded-xl border border-border bg-card/50 p-3">
                              <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                <span>{linha === "LM" ? "Linha Morta" : "Linha Viva"}</span>
                                <span>{selectedIds.length ? `${selectedIds.length} selecionada(s)` : "Necessário selecionar"}</span>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {options.map((eq) => {
                                  const isSelected = selectedIds.includes(eq.id_equipe);
                                  return (
                                    <button
                                      key={`${linha}-${eq.id_equipe}`}
                                      type="button"
                                      aria-pressed={isSelected}
                                      className={cn(
                                        "rounded-full border px-3 py-1 text-xs font-semibold transition-colors",
                                        isSelected
                                          ? "border-primary bg-primary text-white"
                                          : "border-border bg-background text-muted-foreground hover:border-primary focus:border-primary"
                                      )}
                                      onClick={() => toggleEquipeSelection(linha, eq.id_equipe)}
                                    >
                                      {eq.nome_equipe}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <Select
                        value={selectedEquipes[modo][0] || ""}
                        onValueChange={(value) => setEquipeSingle(modo, value)}
                        disabled={loadingEq}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={loadingEq ? "Carregando..." : "Selecione"} />
                        </SelectTrigger>
                        <SelectContent>
                          {equipeOptionsByLinha[modo].map((eq) => (
                            <SelectItem key={eq.id_equipe} value={eq.id_equipe}>
                              {eq.nome_equipe}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </FormControl>
                  <FormMessage />
                </FormItem>
              );
            }}
          />



          <FormField
            control={form.control}
            name="encarregado"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Encarregados</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    placeholder="Separe nomes por ponto-e-vírgula (ex.: João Silva; Maria Lima)"
                    minRows={2}
                  />
                </FormControl>
                {suggestedEncarregados.length > 0 && (
                  <FormDescription>
                    Sugestões: {suggestedEncarregados.join("; ")}
                  </FormDescription>
                )}
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

        <FormField
          control={form.control}
          name="email_msg"
          render={() => (
            <FormItem>
              <FormLabel>Anexo de e-mail (.msg)</FormLabel>
              <FormControl>
                <div className="space-y-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept=".msg"
                    onChange={handleEmailAttachmentChange}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full justify-center gap-2"
                    onClick={triggerEmailAttachmentInput}
                  >
                    <UploadCloud className="h-4 w-4" />
                    Anexar e-mail (.msg)
                  </Button>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>
                      {emailAttachmentName
                        ? `Arquivo: ${emailAttachmentName}`
                        : "Clique em anexar para carregar o e-mail original"}
                    </span>
                    {emailAttachmentName && (
                      <button
                        type="button"
                        className="text-xs text-primary-foreground underline-offset-2 hover:underline"
                        onClick={clearEmailAttachment}
                      >
                        Remover
                      </button>
                    )}
                  </div>
                  {emailAttachmentError && (
                    <p className="text-xs text-destructive">{emailAttachmentError}</p>
                  )}
                </div>
              </FormControl>
            </FormItem>
          )}
        />


        <div className="flex gap-2 justify-end">

          {onCancel && (

            <Button
              type="button"
              variant="outline"
              onClick={() => {
                clearEmailAttachment();
                resetEquipeSelection();
                onCancel();
              }}
            >
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

