import { useParams } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// Simulação: normalmente você buscaria os dados da obra por id
const obrasMock = [
  {
    obra: "OBRA-LP-001",
    os: "OS-LP-2301",
    status: "execucao",
    tci: "pendente",
    gestor: "aguardando",
    cidade: "Cuiaba",
    inicio: "10/11/2025",
    prioridade: "alta",
    equipe: "Equipe Alfa",
    tipoEquipe: "LM",
    inicioFisicoObra: "12/11/2025",
    dataPrevisaoTermino: "20/12/2025",
    descricaoObra: "Obra de expansão",
    solicitante: "João",
    contato: "(65) 99999-9999",
  },
  // ...outras obras
];

export default function ObraDetalhe() {
  const { obraId } = useParams();
  // Busca a obra pelo id (nome ou código)
  const obra = obrasMock.find((o) => o.obra === obraId);

  if (!obra) return <div className="p-8">Obra não encontrada.</div>;

  return (
    <div className="container mx-auto px-6 py-8">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Obra: {obra.obra}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><b>OS:</b> {obra.os}</div>
            <div><b>Status:</b> <Badge>{obra.status}</Badge></div>
            <div><b>TCI:</b> {obra.tci}</div>
            <div><b>Gestor:</b> {obra.gestor}</div>
            <div><b>Cidade:</b> {obra.cidade}</div>
            <div><b>Início:</b> {obra.inicio}</div>
            <div><b>Prioridade:</b> {obra.prioridade}</div>
            <div><b>Equipe:</b> {obra.equipe}</div>
            <div><b>Tipo de Equipe:</b> {obra.tipoEquipe}</div>
            <div><b>Início Físico:</b> {obra.inicioFisicoObra}</div>
            <div><b>Previsão de Término:</b> {obra.dataPrevisaoTermino}</div>
            <div><b>Descrição:</b> {obra.descricaoObra}</div>
            <div><b>Solicitante:</b> {obra.solicitante}</div>
            <div><b>Contato:</b> {obra.contato}</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
