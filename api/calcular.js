export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }

  const { veiculo, servico, valorHora, setores } = req.body;

  const prompt = [
    'Você é especialista em tabela tempária automotiva brasileira. Responda com precisão técnica real.',
    '',
    'Veículo: ' + veiculo + '',
    'Serviço: ' + servico,
    'Valor hora M.O.: R$ ' + valorHora,
    '',
    'TEMPOS DE REFERÊNCIA OBRIGATÓRIOS:',
    '- Troca de óleo e filtro: 0.5h',
    '- Filtro de ar: 0.25h',
    '- Velas (motor 4cil): 0.5h a 1h',
    '- Pastilhas freio dianteiro: 1h',
    '- Pastilhas + discos dianteiros: 1.5h',
    '- Freio traseiro (lona): 1.5h',
    '- Amortecedor (por lado): 1h',
    '- Alinhamento e balanceamento: 0.75h',
    '- Correia alternador: 0.5h',
    '- Correia dentada (compacto): 3h a 4h',
    '- Correia dentada (SUV/picape): 4h a 6h',
    '- Embreagem (compacto/furgão): 4h a 5h',
    '- Embreagem (SUV/picape): 5h a 7h',
    '- Bomba dagua: 2h a 3h',
    '- Radiador: 2h',
    '- Revisão completa 30mil km: 2h',
    '- Injeção eletrônica limpeza: 1h',
    '- Suspensão dianteira completa: 3h a 4h',
    '- Câmbio automático revisão: 4h a 6h',
    '- Motor reforma completa: 12h a 20h',
    '',
    'REGRAS:',
    '1. Use os tempos da tabela acima — NUNCA use 3h para tudo',
    '2. Ajuste pelo veículo: furgões e vans têm acesso mais difícil (+20% tempo)',
    '3. valor_servico = horas_estimadas x ' + valorHora + ' (calcule exatamente)',
    '',
    'Responda APENAS com JSON:',
    '{"horas_estimadas":0.5,"valor_servico":60.00,"justificativa":"texto","servicos_relacionados":["s1","s2","s3"]}'
  ].join('\n');

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + process.env.OPENAI_KEY
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        max_tokens: 500,
        temperature: 0.2,
        messages: [{ role: 'user', content: prompt }]
      })
    });
    const data = await response.json();
    const text = data.choices[0].message.content.trim().replace(/```json|```/g, '').trim();
    const result = JSON.parse(text);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao calcular servico' });
  }
}
