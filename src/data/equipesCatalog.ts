export type TeamCard = {
  code: string;
  encarregado: string;
  members: string[];
  phone: string;
  linha?: "viva" | "morta";
  ativa?: boolean;
};

export type EquipeLinha = "LM" | "LV";

export const equipesCatalog: TeamCard[] = [
  { code: "E14", encarregado: "VICENTE BRAZ DE OLIVEIRA", members: ["JOCINEI BISPO DE OLIVEIRA", "JOELSON SANTANA DE OLIVEIRA", "JOELIELSON FERNANDO", "ARQUIMEDES TRINDADE SIQUEIRA"], phone: "(65) 9 9268-6468", linha: "morta", ativa: true },
  { code: "E24", encarregado: "GUSTAVO SAMPAIO SILVA", members: ["RAFAEL LUCAS SAMPAIO MORAIS", "ANDRE LUIZ VIEIRA MARQUES SILVA", "PAULO RICARDO ALVES CASSANDRE", "LUCAS RENNER DA SILVA MESQUITA", "CARLOS ALBERTO RODRIGUES CARVALHO"], phone: "(65) 9 9636-7665", linha: "morta" },
  { code: "E25", encarregado: "FAUSTINO DE MORAES", members: ["LUCAS CARNEIRO ARAUJO"], phone: "(65) 9 9982-8233", linha: "morta" },
  { code: "E29", encarregado: "EURIPEDES DE MORAES", members: ["KLEBERSON ALMEIDA DE MORAES", "PEDRO ANDERSON DA SILVA SANTOS", "WALTER DA SILVA CAMPOS", "MAGNO JUNIOR DA SILVA CHAGAS"], phone: "(65) 9 9927-1772", linha: "morta" },
  { code: "E34", encarregado: "VALDINEI BENEDITO DE OLIVEIRA", members: ["MILQUIA DE ALMEIDA DE OLIVEIRA", "RAULCINEAR DE ARAUJO MARQUES", "CARLITO GONCALO DA ROSA", "MARCOS ANTONIO MACHADO DE OLIVEIRA"], phone: "(65) 9 9616-9161", linha: "morta" },
  { code: "E35", encarregado: "VANDERLEI CARLOS JULIANOT", members: ["BRUNO GABRIEL ROLIM DE JESUS", "JULIANO COSME AMORIM DO NASCIMENTO", "NILMAR LEONILTON DA SILVA", "LUCAS ZANATO DE MATOS"], phone: "(65) 9 9613-9139", linha: "morta" },
  { code: "E67", encarregado: "JOSE VINICIUS DA SILVA", members: ["LUCAS FUENTES VACA MONJES", "GABRIEL OLIVEIRA DA SILVA", "JUNIOR GONCALVES DE OLIVEIRA"], phone: "(65) 9 9981-9768", linha: "morta" },
  { code: "E91", encarregado: "MAURO CESAR FRANCA E SILVA", members: [], phone: "(65) 9 9947-9683", linha: "morta" },
  { code: "E92", encarregado: "JOAO CARLOS DOS SANTOS OLIVEIRA", members: ["CLOVIS JOSE DE ALMEIDA", "JOSUE DA SILVA SANTOS", "FRANCINALDO ABREU DA SILVA"], phone: "(65) 9 9293-0304", linha: "morta" },
  { code: "E97", encarregado: "WELINTON BOM DESPACHO", members: ["VALDEMIRO KESTRING"], phone: "(65) 9 9290-8218", linha: "morta" },
  { code: "E10", encarregado: "VALDINEI DA SILVA CORREA ASSUNCAO", members: ["ALZEMIR OLIVEIRA DE MEDEIROS", "ELVIS COLETRO SILVA"], phone: "(65) 9 9810-7231", linha: "viva" },
  { code: "E36", encarregado: "ADRIANO MENEZES DO ROSARIO", members: ["RENATO MENDES DA SILVA", "EVERTON LUIS DA SILVA"], phone: "(65) 9 9684-9721", linha: "viva" },
  { code: "E68", encarregado: "ELIZEU PINHEIRO DE SOUZA", members: ["ANDERSON CLAITON VIEIRA DA SILVA", "JOSE RAIMUNDO BARROS BOTELHO"], phone: "(65) 9 9910-8023", linha: "viva", ativa: true },
];

const codigoLinhaMap = new Map<string, EquipeLinha>(
  equipesCatalog.map((team) => [team.code.toUpperCase(), team.linha === "viva" ? "LV" : "LM"])
);

const encarregadoLinhaMap = new Map<string, EquipeLinha>(
  equipesCatalog.map((team) => [team.encarregado.toUpperCase(), team.linha === "viva" ? "LV" : "LM"])
);

const encarregadoCodigoMap = new Map<string, { codigo: string; linha?: EquipeLinha }>(
  equipesCatalog.map((team) => [team.encarregado.toUpperCase(), { codigo: team.code, linha: team.linha === "viva" ? "LV" : "LM" }])
);

export const inferLinhaPorCodigo = (codigo?: string | null): EquipeLinha | undefined => {
  if (!codigo) return undefined;
  return codigoLinhaMap.get(codigo.trim().toUpperCase());
};

export const inferLinhaPorEncarregado = (nome?: string | null): EquipeLinha | undefined => {
  if (!nome) return undefined;
  return encarregadoLinhaMap.get(nome.trim().toUpperCase());
};

export const getEquipeInfoByCodigo = (
  codigo?: string | null
): { nome: string; linha?: EquipeLinha; label?: string; encarregado?: string } | undefined => {
  if (!codigo) return undefined;
  const match = equipesCatalog.find((team) => team.code.toUpperCase() === codigo.trim().toUpperCase());
  if (!match) return undefined;
  return {
    nome: match.code,
    linha: match.linha === "viva" ? "LV" : "LM",
    encarregado: match.encarregado,
    label: match.encarregado ? `${match.code} - ${match.encarregado}` : match.code,
  };
};

export const inferEquipePorEncarregado = (
  nome?: string | null
): { codigo: string; linha?: EquipeLinha } | undefined => {
  if (!nome) return undefined;
  return encarregadoCodigoMap.get(nome.trim().toUpperCase());
};
