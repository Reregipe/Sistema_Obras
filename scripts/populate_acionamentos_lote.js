const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

const etapas = [
  { id: 1, status: 'alert', etapa_atual: 1 },
  { id: 2, status: 'active', etapa_atual: 2 },
  { id: 3, status: 'alert', etapa_atual: 3 },
  { id: 4, status: 'active', etapa_atual: 4 },
  { id: 5, status: 'pending', etapa_atual: 5 },
  { id: 6, status: 'alert', etapa_atual: 6 },
  { id: 7, status: 'active', etapa_atual: 7 },
  { id: 8, status: 'alert', etapa_atual: 8 },
  { id: 9, status: 'pending', etapa_atual: 9 },
  { id: 10, status: 'completed', etapa_atual: 10 }
];

const municipios = ['Cidade A', 'Cidade B', 'Cidade C'];
const prioridades = ['urgente', 'normal'];
const modalidades = ['LM', 'LV'];

function gerarAcionamento(etapa, idx) {
  const now = new Date();
  return {
    id_acionamento: uuidv4(),
    origem: 'Teste',
    codigo_acionamento: `AC${etapa.id}_${idx + 1}`,
    numero_os: etapa.id >= 4 ? `OS${etapa.id}${idx + 1}` : '',
    modalidade: modalidades[idx % modalidades.length],
    prioridade: prioridades[idx % prioridades.length],
    municipio: municipios[(etapa.id + idx) % municipios.length],
    endereco: `Rua ${etapa.id}${idx + 1}`,
    data_abertura: now.toISOString(),
    status: etapa.status,
    etapa_atual: etapa.etapa_atual,
    criado_por: 'admin',
    criado_em: now.toISOString()
  };
}

const acionamentos = [];
etapas.forEach(etapa => {
  for (let i = 0; i < 2; i++) {
    acionamentos.push(gerarAcionamento(etapa, i));
  }
});

axios.post('http://localhost:4000/acionamentos/lote', { acionamentos })
  .then(res => {
    console.log('Acionamentos criados:', res.data);
  })
  .catch(err => {
    console.error('Erro ao criar acionamentos:', err.response?.data || err.message);
  });
