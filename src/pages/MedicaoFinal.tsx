import { useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Download,
  Filter,
  RefreshCw,
  FileText,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type CicloItem = {
  obra: string;
  os: string;
  acionamento?: string;
  origem: "acionamento" | "obra";
  tci: "pendente" | "emitido" | "validado";
  gestor: "aguardando" | "aprovado" | "pendente";
  nf: "nao_emitida" | "emitida";
  cidade: string;
  vigencia: string;
  status: string;
};

const MedicaoFinal = () => {
  const [vigencia, setVigencia] = useState("12/2025");
  const [origem, setOrigem] = useState("todas");
  const [status, setStatus] = useState("todos");

  const itens: CicloItem[] = useMemo(
    () => [
      {
        obra: "OS-DEMO-110",
        os: "OS-AC-0028",
        acionamento: "AC-DEMO-028",
        origem: "acionamento",
        tci: "validado",
        gestor: "aprovado",
        nf: "emitida",
        cidade: "Cuiaba",
        vigencia: "12/2025",
        status: "pronto_nf",
      },
      {
        obra: "OS-DEMO-109",
        os: "OS-AC-0025",
        acionamento: "AC-DEMO-025",
        origem: "acionamento",
        tci: "validado",
        gestor: "aprovado",
        nf: "nao_emitida",
        cidade: "Varzea Grande",
        vigencia: "12/2025",
        status: "lote",
      },
      {
        obra: "OBRA-LP-004",
        os: "OS-LP-2315",
        origem: "obra",
        tci: "emitido",
        gestor: "aguardando",
        nf: "nao_emitida",
        cidade: "Primavera",
        vigencia: "11/2025",
        status: "aguardando_gestor",
      },
      {
        obra: "OBRA-LP-003",
        os: "OS-LP-2310",
        origem: "obra",
        tci: "pendente",
        gestor: "pendente",
        nf: "nao_emitida",
        cidade: "Cuiaba",
        vigencia: "11/2025",
        status: "tci_pendente",
      },
    ],
    [],
  );

  const filtrados = useMemo(() => {
    return itens.filter((item) => {
      if (vigencia !== "todas" && item.vigencia !== vigencia) return false;
      if (origem !== "todas" && item.origem !== origem) return false;
      if (status !== "todos") {
        if (status === "tci_pendente" && item.tci !== "pendente") return false;
        if (status === "aguardando_gestor" && item.gestor !== "aguardando") return false;
        if (status === "nf_emitida" && item.nf !== "emitida") return false;
      }
      return true;
    });
  }, [itens, origem, status, vigencia]);

  const kpis = useMemo(
    () => [
      { label: "Obras no ciclo", value: filtrados.length.toString() || "--" },
      {
        label: "Pendências gestor",
        value: filtrados.filter((i) => i.gestor === "aguardando").length.toString(),
        color: "text-warning",
      },
      {
        label: "TCI pendentes",
        value: filtrados.filter((i) => i.tci === "pendente").length.toString(),
        color: "text-destructive",
      },
      {
        label: "NF emitidas",
        value: filtrados.filter((i) => i.nf === "emitida").length.toString(),
        color: "text-success",
      },
    ],
    [filtrados],
  );

  return (
    <div className="container mx-auto px-6 py-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Medição Final / Ciclo de Faturamento</h1>
          <p className="text-muted-foreground mt-2">
            Consolida acionamentos (que viraram obra) e obras de longo prazo. Acompanhe vigência, aprovação, TCI e NF.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          <Button>
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Filtros do ciclo</CardTitle>
          <CardDescription>Use vigência, origem e status para acompanhar o que está atrasado ou pronto.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div>
            <div className="text-xs text-muted-foreground mb-1">Vigência / Ciclo</div>
            <Select value={vigencia} onValueChange={setVigencia}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a vigência" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas</SelectItem>
                <SelectItem value="12/2025">12/2025</SelectItem>
                <SelectItem value="11/2025">11/2025</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <div className="text-xs text-muted-foreground mb-1">Origem</div>
            <Select value={origem} onValueChange={setOrigem}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a origem" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas</SelectItem>
                <SelectItem value="acionamento">Acionamento</SelectItem>
                <SelectItem value="obra">Obra longo prazo</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <div className="text-xs text-muted-foreground mb-1">Status</div>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="tci_pendente">TCI pendente</SelectItem>
                <SelectItem value="aguardando_gestor">Aguardando gestor</SelectItem>
                <SelectItem value="nf_emitida">NF emitida</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {kpis.map((item) => (
          <Card key={item.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">{item.label}</CardTitle>
            </CardHeader>
            <CardContent className={`text-3xl font-bold ${item.color || ""}`}>{item.value}</CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Ciclo em andamento</CardTitle>
              <CardDescription>
                Consolida por número da obra (Energisa), mostrando OS (interna) e código do acionamento quando existir.
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" className="gap-2">
              <Filter className="h-4 w-4" />
              Filtros salvos (breve)
            </Button>
          </div>
        </CardHeader>
        <Separator />
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Obra (Energisa)</TableHead>
                <TableHead>OS</TableHead>
                <TableHead>Acionamento</TableHead>
                <TableHead>Origem</TableHead>
                <TableHead>TCI</TableHead>
                <TableHead>Gestor</TableHead>
                <TableHead>NF</TableHead>
                <TableHead>Vigência</TableHead>
                <TableHead>Cidade</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtrados.map((item) => (
                <TableRow key={`${item.obra}-${item.os}`}>
                  <TableCell className="font-semibold">{item.obra}</TableCell>
                  <TableCell>{item.os}</TableCell>
                  <TableCell>{item.acionamento || "--"}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{item.origem}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={item.tci === "validado" ? "default" : "outline"}>{item.tci}</Badge>
                  </TableCell>
                  <TableCell>{item.gestor}</TableCell>
                  <TableCell>
                    <Badge variant={item.nf === "emitida" ? "default" : "secondary"}>{item.nf}</Badge>
                  </TableCell>
                  <TableCell>{item.vigencia}</TableCell>
                  <TableCell>{item.cidade}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {!filtrados.length && (
            <div className="py-6 text-center text-sm text-muted-foreground">
              Nenhum registro com os filtros atuais.
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-destructive" />
              <CardTitle>Pendências / Por quê?</CardTitle>
            </div>
            <CardDescription>Razões de atraso (gestor, fiscal, materiais, documentação).</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Em breve: distribuição das causas de atraso/pendência no ciclo vigente.
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-warning" />
              <CardTitle>Prazos / SLA</CardTitle>
            </div>
            <CardDescription>Quantos dias até fechamento por obra.</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Em breve: idade das obras no ciclo (TCI, aprovação, NF).
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-success" />
              <CardTitle>Pronto para faturar</CardTitle>
            </div>
            <CardDescription>Obras liberadas para emissão de NF.</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Em breve: lista das obras com TCI validado e aprovação concluída, prontas para NF.
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Próximos passos</CardTitle>
          <CardDescription>Checklist para fechar o ciclo sem deixar nada para trás.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Validar números: Obra (Energisa), OS (interna) e código do acionamento.
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Verificar pendências de aprovação (gestor/fiscal) e TCI pendente.
          </div>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-destructive" />
            Identificar atrasos e registrar causa (por quê) para cada obra.
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-success" />
            Confirmar lotes e NF emitidas dentro do ciclo.
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MedicaoFinal;
