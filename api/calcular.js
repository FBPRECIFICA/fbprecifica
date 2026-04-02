export const config = { api: { bodyParser: true } };

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }

  const body = req.body || {};
  const veiculo = body.veiculo || '';
  const servico = body.servico || '';
  const valorHora = body.valorHora || 100;

  if (!servico) { res.status(400).json({ error: 'Servico obrigatorio' }); return; }

  const prompt = [
    'Você é um especialista técnico em mecânica automotiva brasileira com 20 anos de experiência em oficinas.',
    '',
    'Veículo: ' + veiculo,
    'Serviço: ' + servico,
    'Valor hora M.O.: R$ ' + valorHora,
    '',
    'TEMPOS DE REFERÊNCIA:',
    '- Troca de óleo e filtro: 0.5h | Filtro de ar: 0.25h | Velas (4cil): 0.5h a 1h',
    '- Pastilhas freio dianteiro: 1h | Pastilhas + discos: 1.5h | Freio traseiro lona: 1.5h',
    '- Amortecedor por lado: 1h | Alinhamento e balanceamento: 0.75h | Correia alternador: 0.5h',
    '- Correia dentada compacto: 3h a 4h | Correia dentada SUV/picape: 4h a 6h',
    '- Embreagem compacto/furgão: 4h a 5h | Embreagem SUV/picape: 5h a 7h',
    '- Bomba dagua: 2h a 3h | Radiador: 2h | Revisão 30mil km: 2h',
    '- Injeção eletrônica limpeza: 1h | Suspensão dianteira completa: 3h a 4h',
    '- Câmbio automático revisão: 4h a 6h | Motor reforma completa: 12h a 20h',
    '',
    'Responda APENAS com JSON válido neste formato:',
    '{',
    '  "horas_estimadas": 0.5,',
    '  "valor_servico": 50.00,',
    '  "justificativa": "Análise técnica detalhada do serviço neste veículo específico, explicando o que está envolvido",',
    '  "alertas_risco": [',
    '    "Alerta 1: risco técnico real relacionado a este serviço neste veículo",',
    '    "Alerta 2: outro risco importante"',
    '  ],',
    '  "verificar_junto": [',
    '    "Serviço relacionado 1 com justificativa técnica de por que verificar agora e quanto pode faturar",',
    '    "Serviço relacionado 2 — aproveite que o veículo já está desmontado",',
    '    "Serviço relacionado 3 — desgaste comum neste modelo nesta quilometragem"',
    '  ],',
    '  "se_nao_trocar": "Argumento direto e técnico para o cliente: o que acontece se deixar para depois, qual o risco real para o veículo e para o bolso dele"',
    '}',
    '',
    'REGRAS:',
    '1. horas_estimadas: use a tabela de referência, NUNCA coloque 3h para tudo',
    '2. valor_servico = horas_estimadas x ' + valorHora,
    '3. alertas_risco: riscos REAIS e específicos para este serviço neste veículo',
    '4. verificar_junto: serviços que fazem sentido técnico verificar com o acesso aberto',
    '5. se_nao_trocar: argumento forte, real, que convence o cliente — consequências concretas',
    'Responda APENAS com o JSON, sem texto antes ou depois.'
  ].join('\n');

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + process.env.OPENAI_KEY },
      body: JSON.stringify({ model: 'gpt-4o-mini', max_tokens: 800, temperature: 0.3, messages: [{ role: 'user', content: prompt }] })
    });
    const data = await response.json();
    const text = data.choices[0].message.content.trim().replace(/```json|```/g, '').trim();
    const result = JSON.parse(text);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao calcular: ' + error.message });
  }
}
