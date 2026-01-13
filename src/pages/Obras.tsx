import { useMemo, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { equipesCatalog } from "@/data/equipesCatalog";
// Adicione a dependência xlsx no seu projeto: npm install xlsx
import * as XLSX from "xlsx";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Download, ArrowRight } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const Obras = () => {
  const navigate = useNavigate();
  const [modalOpen, setModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [planejamentoModalOpen, setPlanejamentoModalOpen] = useState(false);
  const [obraSelecionada, setObraSelecionada] = useState(null);
  const [detalheObraModalOpen, setDetalheObraModalOpen] = useState(false);

  const [obras, setObras] = useState([
    {
      obra: "OBRA-LP-001",
      os: "OS-LP-2301",
      status: "execucao",
      tci: "pendente",
      gestor: "aguardando",
      cidade: "Cuiaba",
      inicio: "10/11/2025",
    },
    {
      obra: "OBRA-LP-002",
      os: "OS-LP-2305",
      status: "medicao",
      tci: "emitido",
      gestor: "aguardando",
      cidade: "Varzea Grande",
      inicio: "05/11/2025",
    },
    {
      obra: "OBRA-LP-003",
      os: "OS-LP-2310",
      status: "tci",
      tci: "pendente",
      gestor: "pendente",
      cidade: "Cuiaba",
      inicio: "28/10/2025",
    },
    {
      obra: "OBRA-LP-004",
      os: "OS-LP-2315",
      status: "faturar",
      tci: "validado",
      gestor: "aprovado",
      cidade: "Primavera",
      inicio: "20/10/2025",
    },
  ]);

  // Filtra obras sem marco inicial (data de início vazia, null, undefined ou só espaços)
  const obrasSemMarcoInicial = useMemo(
    () => obras.filter((obra) => !obra.inicio || String(obra.inicio).trim() === ""),
    [obras]
  );
    // Função para lidar com importação de Excel
    const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (evt) => {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(worksheet, { defval: "" });
        // Aqui você pode tratar os dados importados (json)
        console.log("Obras importadas:", json);
        // Exemplo: setObras(json as any[]);
      };
      reader.readAsArrayBuffer(file);
    };
  const [novaObra, setNovaObra] = useState({
    prioridade: "",
    projetoSiagoOdi: "",
    mesCarteira: "",
    os: "",
    municipio: "",
    bairro: "",
    endereco: "",
    descricaoObra: "",
    solicitante: "",
    contato: "",
  });

  const handleChange = (e) => {
    setNovaObra({ ...novaObra, [e.target.name]: e.target.value });
  };

  const handleSalvarObra = () => {
    // Adiciona nova obra sem data de início (etapa planejamento)
    setObras([
      ...obras,
      {
        ...novaObra,
        inicio: "", // Garante que nova obra entra no planejamento
        status: "planejamento",
        tci: "pendente",
        gestor: "",
        cidade: novaObra.municipio || "",
        obra: novaObra.projetoSiagoOdi || "",
      },
    ]);
    setModalOpen(false);
    setNovaObra({
      prioridade: "",
      projetoSiagoOdi: "",
      mesCarteira: "",
      os: "",
      municipio: "",
      bairro: "",
      endereco: "",
      descricaoObra: "",
      solicitante: "",
      contato: "",
    });
  };

  const kpis = useMemo(
    () => [
      { label: "Planejamento", value: "4" },
      { label: "Execução", value: "7" },
      { label: "TCI pendente", value: "2" },
      { label: "Prontas p/ NF", value: "3" },
    ],
    [],
  );

  const etapas = useMemo(
    () => [
      { title: "Planejamento", desc: "Escopo, cronograma e orçamento", status: "em andamento" },
      { title: "Execução", desc: "Equipe em campo, medições parciais", status: "7 obras" },
      { title: "Medições parciais", desc: "Consolidar MO/material", status: "3 pendentes" },
      { title: "TCI / Tratativas", desc: "Ajustes e pendências", status: "2 TCI pendentes" },
      { title: "Aprovação", desc: "Gestor/Fiscal", status: "4 aguardando" },
      { title: "Faturamento", desc: "Lote / NF", status: "3 prontas" },
    ],
    [],
  );

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-foreground">Obras (longo prazo)</h1>
          <p className="text-muted-foreground">
            Acompanhe obras planejadas da concepção ao faturamento. Sempre por número da obra (Energisa) e OS interna.
          </p>
        </div>
        <div className="flex gap-2">
          {/* Modal Planejamento permanece acessível apenas pela régua de etapas */}
          <Dialog open={planejamentoModalOpen} onOpenChange={setPlanejamentoModalOpen}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Planejamento</DialogTitle>
                <p className="text-sm text-muted-foreground mt-1">Obras sem marco inicial</p>
              </DialogHeader>
                    {obrasSemMarcoInicial.length === 0 ? (
                      <div className="py-4 text-muted-foreground">Todas as obras sem marco inicial.</div>
                    ) : (
                      <>
                        <div className="grid gap-3 md:grid-cols-2">
                          {obrasSemMarcoInicial.map((item) => (
                            <Card
                              key={item.obra}
                              className="border shadow-sm cursor-pointer"
                              onClick={() => {
                                setObraSelecionada(item);
                                setDetalheObraModalOpen(true);
                              }}
                            >
                              <CardHeader className="py-4 flex items-center justify-center">
                                <CardTitle className="text-lg font-bold text-center">{item.obra || "Sem número"}</CardTitle>
                              </CardHeader>
                            </Card>
                          ))}
                        </div>

                        {/* Modal de detalhes da obra selecionada */}
                        <Dialog open={detalheObraModalOpen} onOpenChange={setDetalheObraModalOpen}>
                          <DialogContent className="max-w-lg">
                            <DialogHeader>
                              <DialogTitle>Detalhes da obra: {obraSelecionada?.obra}</DialogTitle>
                            </DialogHeader>
                            {obraSelecionada && (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div className="flex flex-col gap-1">
                                  <label className="text-sm font-medium">Início Físico da Obra</label>
                                  <input
                                    type="date"
                                    className="border rounded px-2 py-1 focus:outline-none focus:ring w-full"
                                    value={obraSelecionada.inicioFisicoObra || ''}
                                    onChange={e => setObraSelecionada({ ...obraSelecionada, inicioFisicoObra: e.target.value })}
                                  />
                                </div>
                                <div className="flex flex-col gap-1">
                                  <label className="text-sm font-medium">Tipo de Equipe</label>
                                  <select
                                    value={obraSelecionada.tipoEquipe || ''}
                                    onChange={e => setObraSelecionada({ ...obraSelecionada, tipoEquipe: e.target.value })}
                                    className="border rounded px-2 py-1 focus:outline-none focus:ring w-full"
                                  >
                                    <option value="">Selecione</option>
                                    <option value="LM">LM</option>
                                    <option value="LV">LV</option>
                                    <option value="LM+LV">LM+LV</option>
                                  </select>
                                </div>
                                <div className="flex flex-col gap-1">
                                  <label className="text-sm font-medium">Equipes</label>
                                  <Select
                                    value={obraSelecionada?.equipes?.[0] || ""}
                                    onValueChange={value => {
                                      // Alterna seleção: se já está, remove; se não, adiciona
                                      let novasEquipes = Array.isArray(obraSelecionada?.equipes) ? [...obraSelecionada.equipes] : [];
                                      if (novasEquipes.includes(value)) {
                                        novasEquipes = novasEquipes.filter(eq => eq !== value);
                                      } else {
                                        novasEquipes.push(value);
                                      }
                                      setObraSelecionada({ ...obraSelecionada, equipes: novasEquipes });
                                    }}
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="Selecione uma ou mais equipes" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {equipesCatalog
                                        .filter(eq => {
                                          if (!obraSelecionada?.tipoEquipe) return true;
                                          if (obraSelecionada.tipoEquipe === 'LM+LV') return true;
                                          if (obraSelecionada.tipoEquipe === 'LM') return eq.linha !== 'viva';
                                          if (obraSelecionada.tipoEquipe === 'LV') return eq.linha === 'viva';
                                          return true;
                                        })
                                        .map(eq => (
                                          <SelectItem key={eq.code} value={eq.code}>
                                            {eq.code} - {eq.encarregado}
                                            {obraSelecionada?.equipes?.includes(eq.code) ? " (selecionada)" : ""}
                                          </SelectItem>
                                        ))}
                                    </SelectContent>
                                  </Select>
                                  <span className="text-xs text-muted-foreground mt-1">Clique novamente para remover uma equipe já selecionada.</span>
                                  <div className="flex flex-wrap gap-1 mt-2">
                                    {obraSelecionada?.equipes?.map(code => {
                                      const eq = equipesCatalog.find(e => e.code === code);
                                      return eq ? (
                                        <span key={code} className="px-2 py-1 bg-accent rounded text-xs">
                                          {eq.code} - {eq.encarregado}
                                        </span>
                                      ) : null;
                                    })}
                                  </div>
                                </div>
                                <div className="flex flex-col gap-1">
                                  <label className="text-sm font-medium">Previsão de Término</label>
                                  <input
                                    type="date"
                                    className="border rounded px-2 py-1 focus:outline-none focus:ring w-full"
                                    value={obraSelecionada.dataPrevisaoTermino || ''}
                                    onChange={e => setObraSelecionada({ ...obraSelecionada, dataPrevisaoTermino: e.target.value })}
                                  />
                                </div>
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                      </>
                    )}
                            {/* Mini-formulário para obra selecionada */}

            </DialogContent>
          </Dialog>
          <Button variant="outline" className="gap-2" onClick={() => fileInputRef.current?.click()}>
            <Download className="h-4 w-4" />
            Importar Excel
          </Button>
          <input
            type="file"
            accept=".xlsx,.xls"
            ref={fileInputRef}
            onChange={handleImportExcel}
            style={{ display: "none" }}
          />
          <Button className="gap-2" onClick={() => setModalOpen(true)}>
            <Plus className="h-4 w-4" />
            Nova Obra
          </Button>
              <Dialog open={modalOpen} onOpenChange={setModalOpen}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Nova Obra</DialogTitle>
                  </DialogHeader>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 py-2">
                    <div className="flex flex-col gap-1">
                      <label className="text-sm font-medium">Prioridade</label>
                      <select
                        name="prioridade"
                        value={novaObra.prioridade}
                        onChange={handleChange}
                        className="border rounded px-2 py-1 focus:outline-none focus:ring w-full"
                      >
                        <option value="">Selecione</option>
                        <option value="urgente">Urgente</option>
                        <option value="alta">Alta</option>
                        <option value="media">Média</option>
                        <option value="baixa">Baixa</option>
                      </select>
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-sm font-medium">Número da Obra</label>
                      <Input name="projetoSiagoOdi" value={novaObra.projetoSiagoOdi} onChange={handleChange} />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-sm font-medium">Mês da Carteira</label>
                      <Input name="mesCarteira" value={novaObra.mesCarteira} onChange={handleChange} />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-sm font-medium">OS</label>
                      <Input name="os" value={novaObra.os} onChange={handleChange} />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-sm font-medium">Município</label>
                      <Input name="municipio" value={novaObra.municipio} onChange={handleChange} />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-sm font-medium">Bairro</label>
                      <Input name="bairro" value={novaObra.bairro} onChange={handleChange} />
                    </div>
                    <div className="flex flex-col gap-1 md:col-span-2">
                      <label className="text-sm font-medium">Endereço</label>
                      <Input name="endereco" value={novaObra.endereco} onChange={handleChange} />
                    </div>
                    <div className="flex flex-col gap-1 md:col-span-2">
                      <label className="text-sm font-medium">Descrição da Obra</label>
                      <Input name="descricaoObra" value={novaObra.descricaoObra} onChange={handleChange} />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-sm font-medium">Solicitante</label>
                      <Input name="solicitante" value={novaObra.solicitante} onChange={handleChange} />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-sm font-medium">Contato</label>
                      <Input name="contato" value={novaObra.contato} onChange={handleChange} />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
                    <Button onClick={handleSalvarObra}>Salvar</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        {kpis.map((item) => (
          <Card key={item.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">{item.label}</CardTitle>
            </CardHeader>
            <CardContent className="text-3xl font-bold">{item.value}</CardContent>
          </Card>
        ))}
      </div>

      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle>Régua de etapas (Obras longo prazo)</CardTitle>
          <CardDescription>Visual rápido do progresso. Clique para detalhar.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          {etapas.map((etapa) => (
            <div
              key={etapa.title}
              className="rounded-lg border p-4 hover:border-primary transition-colors cursor-pointer"
              onClick={etapa.title === "Planejamento" ? () => setPlanejamentoModalOpen(true) : undefined}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-semibold text-foreground">{etapa.title}</div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">{etapa.desc}</p>
              <div className="mt-2">
                <Badge variant="secondary">{etapa.status}</Badge>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Lista de obras</CardTitle>
              <CardDescription>Obras de longo prazo com OS interna e status de TCI/Aprovação.</CardDescription>
            </div>
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowRight className="h-4 w-4" />
              Filtros avançados (breve)
            </Button>
          </div>
        </CardHeader>
        <Separator />
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Obra (Energisa)</TableHead>
                <TableHead>OS (interna)</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>TCI</TableHead>
                <TableHead>Gestor</TableHead>
                <TableHead>Cidade</TableHead>
                <TableHead>Início</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {obras.map((item) => (
                <TableRow
                  key={item.obra}
                  className="cursor-pointer hover:bg-muted"
                  onClick={() => navigate(`/obras/${item.obra}`)}
                >
                  <TableCell className="font-semibold">{item.obra}</TableCell>
                  <TableCell>{item.os}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{item.status}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={item.tci === "validado" ? "default" : "outline"}>{item.tci}</Badge>
                  </TableCell>
                  <TableCell>{item.gestor}</TableCell>
                  <TableCell>{item.cidade}</TableCell>
                  <TableCell>{item.inicio}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default Obras;
