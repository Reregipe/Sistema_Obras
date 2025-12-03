import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertCircle, Loader2, Plus, Save } from "lucide-react";

type AcionamentoRow = {
  id_acionamento: string;
  codigo_acionamento?: string | null;
  municipio?: string | null;
  data_abertura?: string | null;
};

type ListaCabecalho = {
  id_lista_aplicacao: string;
  id_acionamento: string | null;
  criado_em?: string | null;
};

type MaterialRow = {
  codigo_material: string;
  descricao?: string | null;
  unidade_medida?: string | null;
};

type ListaItem = {
  codigo_material: string;
  descricao_item: string;
  unidade_medida: string;
  quantidade: number;
};

const formatDate = (value?: string | null) => {
  if (!value) return "--";
  const d = new Date(value);
  return isNaN(d.getTime()) ? value : d.toLocaleDateString("pt-BR");
};

export default function AcionamentoMateriais() {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [acionamento, setAcionamento] = useState<AcionamentoRow | null>(null);
  const [lista, setLista] = useState<ListaCabecalho | null>(null);
  const [itens, setItens] = useState<ListaItem[]>([]);
  const [codigoBusca, setCodigoBusca] = useState("");
  const [materialEncontrado, setMaterialEncontrado] = useState<MaterialRow | null>(null);
  const [quantidade, setQuantidade] = useState<number>(1);
  const [sugestoes, setSugestoes] = useState<MaterialRow[]>([]);
  const [loadingSugestoes, setLoadingSugestoes] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      setLoading(true);
      setError(null);
      try {
        // tenta pelo id_acionamento (uuid) e, se não achar, pelo código
        let acRes = await supabase
          .from("acionamentos")
          .select("id_acionamento,codigo_acionamento,municipio,data_abertura")
          .eq("id_acionamento", id)
          .maybeSingle();
        if (!acRes.data) {
          acRes = await supabase
            .from("acionamentos")
            .select("id_acionamento,codigo_acionamento,municipio,data_abertura")
            .eq("codigo_acionamento", id)
            .maybeSingle();
        }
        if (!acRes.data) {
          setError("Acionamento não encontrado.");
          return;
        }
        setAcionamento(acRes.data as AcionamentoRow);

        // cabeçalho existente
        const { data: cab } = await supabase
          .from("lista_aplicacao_cabecalho")
          .select("*")
          .eq("id_acionamento", (acRes.data as any).id_acionamento)
          .maybeSingle();
        if (cab) setLista(cab as ListaCabecalho);

        // itens existentes
        if (cab?.id_lista_aplicacao) {
          const { data: itensExist } = await supabase
            .from("lista_aplicacao_itens")
            .select("codigo_material,descricao_item,unidade_medida,quantidade,ordem_item")
            .eq("id_lista_aplicacao", cab.id_lista_aplicacao)
            .order("ordem_item");
          const mapped =
            itensExist?.map((it) => ({
              codigo_material: it.codigo_material,
              descricao_item: it.descricao_item || "",
              unidade_medida: it.unidade_medida || "",
              quantidade: Number(it.quantidade || 0),
            })) || [];
          setItens(mapped);
        }
      } catch (err: any) {
        setError(err.message || "Erro ao carregar dados.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const handleBuscarMaterial = async () => {
    const term = codigoBusca.trim();
    if (!term) {
      setError("Informe o código ou parte da descrição.");
      return;
    }
    setError(null);
    setInfo(null);
    try {
      const { data, error: err } = await supabase
        .from("materiais")
        .select("*")
        .or(`codigo_material.eq.${term},descricao.ilike.%${term}%`)
        .limit(5);
      if (err) throw err;
      if (!data || data.length === 0) {
        setMaterialEncontrado(null);
        setError("Material não encontrado.");
        return;
      }
      const exact = data.find((m) => (m.codigo_material || "").toLowerCase() === term.toLowerCase());
      setMaterialEncontrado((exact || data[0]) as MaterialRow);
    } catch (err: any) {
      setError(err.message || "Erro ao buscar material.");
    }
  };

  useEffect(() => {
    const term = codigoBusca.trim();
    if (term.length < 2) {
      setSugestoes([]);
      return;
    }
    const handler = setTimeout(async () => {
      setLoadingSugestoes(true);
      try {
        const { data } = await supabase
          .from("materiais")
          .select("*")
          .or(`codigo_material.ilike.%${term}%,descricao.ilike.%${term}%`)
          .order("descricao")
          .limit(8);
        setSugestoes((data || []) as MaterialRow[]);
      } catch {
        setSugestoes([]);
      } finally {
        setLoadingSugestoes(false);
      }
    }, 300);
    return () => clearTimeout(handler);
  }, [codigoBusca]);

  const handleSelecionarSugestao = (mat: MaterialRow) => {
    setMaterialEncontrado(mat);
    setCodigoBusca(mat.codigo_material);
    setSugestoes([]);
    setError(null);
    setInfo(null);
  };

  const handleAddItem = () => {
    if (!materialEncontrado) {
      setError("Busque um material válido antes de adicionar.");
      return;
    }
    if (!quantidade || quantidade <= 0) {
      setError("Informe quantidade maior que zero.");
      return;
    }
    setError(null);
    setInfo(null);

    const exists = itens.find((it) => it.codigo_material === materialEncontrado.codigo_material);
    if (exists) {
      setItens((prev) =>
        prev.map((it) =>
          it.codigo_material === materialEncontrado.codigo_material
            ? { ...it, quantidade: it.quantidade + quantidade }
            : it
        )
      );
    } else {
      setItens((prev) => [
        ...prev,
        {
          codigo_material: materialEncontrado.codigo_material,
          descricao_item: materialEncontrado.descricao || "",
          unidade_medida: materialEncontrado.unidade_medida || "",
          quantidade,
        },
      ]);
    }
    setQuantidade(1);
    setMaterialEncontrado(null);
    setCodigoBusca("");
  };

  const handleRemove = (codigo: string) => {
    setItens((prev) => prev.filter((it) => it.codigo_material !== codigo));
  };

  const ensureLista = async (idAcionamento: string) => {
    if (lista) return lista;
    const { data, error } = await supabase
      .from("lista_aplicacao_cabecalho")
      .insert([{ id_acionamento: idAcionamento }])
      .select("*")
      .single();
    if (error) throw error;
    setLista(data as ListaCabecalho);
    return data as ListaCabecalho;
  };

  const handleSalvar = async () => {
    if (!acionamento) {
      setError("Acionamento não informado.");
      return;
    }
    if (itens.length === 0) {
      setError("Adicione ao menos um material.");
      return;
    }
    setSaving(true);
    setError(null);
    setInfo(null);
    try {
      const cab = await ensureLista(acionamento.id_acionamento);
      const listaId = cab.id_lista_aplicacao;
      const payload = itens.map((it, idx) => ({
        id_lista_aplicacao: listaId,
        codigo_material: it.codigo_material,
        descricao_item: it.descricao_item,
        unidade_medida: it.unidade_medida,
        quantidade: it.quantidade,
        ordem_item: idx + 1,
      }));

      await supabase.from("lista_aplicacao_itens").delete().eq("id_lista_aplicacao", listaId);
      const { error: errIns } = await supabase.from("lista_aplicacao_itens").insert(payload);
      if (errIns) throw errIns;
      setInfo("Lista salva em lista_aplicacao_itens.");
    } catch (err: any) {
      setError(err.message || "Erro ao gravar lista.");
    } finally {
      setSaving(false);
    }
  };

  const headerInfo = useMemo(() => {
    if (!acionamento) return "--";
    return `${acionamento.codigo_acionamento || acionamento.id_acionamento || "--"} - ${
      acionamento.municipio || "--"
    } - ${formatDate(acionamento.data_abertura)}`;
  }, [acionamento]);

  if (loading) {
    return (
      <div className="p-6 flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Carregando...
      </div>
    );
  }

  if (!acionamento) {
    return (
      <div className="p-6">
        <div className="text-sm text-destructive">Acionamento não encontrado.</div>
        <Button asChild variant="outline" className="mt-3">
          <Link to="/acionamentos">Voltar</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex-1 text-center space-y-2">
          <h1 className="text-2xl font-bold">Lista de Materiais</h1>
          <h2 className="text-xl font-semibold">{headerInfo}</h2>
          {lista?.criado_em && (
            <p className="text-xs text-muted-foreground">Lista criada em {formatDate(lista.criado_em)}</p>
          )}
        </div>
        <div className="ml-4">
          <Button asChild variant="outline">
            <Link to="/acionamentos">Voltar</Link>
          </Button>
        </div>
      </div>

      {(error || info) && (
        <div className="flex items-center gap-2 text-sm">
          <AlertCircle className={`h-4 w-4 ${error ? "text-destructive" : "text-emerald-600"}`} />
          <span className={error ? "text-destructive" : "text-emerald-600"}>{error || info}</span>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Adicionar material</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Linha 1: busca/autocomplete */}
          <div className="grid grid-cols-1 gap-3">
            <div className="relative">
              <Label>Código ou descrição</Label>
              <Input
                value={codigoBusca}
                onChange={(e) => setCodigoBusca(e.target.value)}
                onBlur={handleBuscarMaterial}
                placeholder="Ex.: MAT-001 ou parte da descrição"
              />
              {sugestoes.length > 0 && (
                <div className="absolute z-20 mt-1 w-full rounded-md border bg-white shadow-lg max-h-56 overflow-auto">
                  {sugestoes.map((mat) => (
                    <button
                      key={mat.codigo_material}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-muted"
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        handleSelecionarSugestao(mat);
                      }}
                    >
                      <div className="font-semibold">{mat.codigo_material}</div>
                      <div className="text-xs text-muted-foreground">{mat.descricao}</div>
                    </button>
                  ))}
                  {loadingSugestoes && (
                    <div className="px-3 py-2 text-xs text-muted-foreground flex items-center gap-2">
                      <Loader2 className="h-3 w-3 animate-spin" /> Buscando...
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Linha 2: dados do item + quantidade + adicionar */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
            <div className="md:col-span-2">
              <Label>Descrição</Label>
              <Input value={materialEncontrado?.descricao || ""} readOnly disabled />
            </div>
            <div>
              <Label>Unidade</Label>
              <Input value={materialEncontrado?.unidade_medida || ""} readOnly disabled />
            </div>
            <div>
              <Label>Quantidade</Label>
              <Input
                type="number"
                min={0}
                step={0.01}
                value={quantidade}
                disabled={!materialEncontrado}
                onChange={(e) => setQuantidade(Number(e.target.value))}
              />
            </div>
            <div className="flex items-end">
              <Button onClick={handleAddItem} disabled={!materialEncontrado}>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Itens adicionados</CardTitle>
        </CardHeader>
        <CardContent>
          {itens.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum item adicionado.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Unidade</TableHead>
                  <TableHead>Quantidade</TableHead>
                  <TableHead className="text-right"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {itens.map((it) => (
                  <TableRow key={it.codigo_material}>
                    <TableCell>{it.codigo_material}</TableCell>
                    <TableCell>{it.descricao_item}</TableCell>
                    <TableCell>{it.unidade_medida}</TableCell>
                    <TableCell>{it.quantidade}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => handleRemove(it.codigo_material)}>
                        Remover
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          <div className="flex justify-end mt-4">
            <Button onClick={handleSalvar} disabled={saving || itens.length === 0}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              Salvar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
