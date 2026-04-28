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

  const prompt = `Você é um mecânico especialista com 20 anos de experiência em oficinas brasileiras. Conhece profundamente todos os veículos do mercado nacional — especificações técnicas reais, sistemas de motor, tempo de serviço real de bancada.

VEÍCULO: ${veiculo}
SERVIÇO SOLICITADO: ${servico}
VALOR HORA M.O.: R$ ${valorHora}

INSTRUÇÕES OBRIGATÓRIAS:

1. TEMPO REAL DE BANCADA:
Estime o tempo com base na realidade da bancada para ESTE veículo específico.
Considere obrigatoriamente:
- Categoria do veículo: carro de passeio, furgão, utilitário, caminhão leve, SUV, pickup
- Combustível: flex/gasolina têm motores mais simples; diesel têm mais componentes, maior torque, sistemas adicionais (turbo, intercooler, common rail, bomba injetora)
- Acesso ao componente neste motor específico: espaço restrito aumenta o tempo significativamente
- Complexidade do motor: número de cilindros, tipo de distribuição, sistemas auxiliares
- Desmontagens necessárias para acessar o componente

2. DISTRIBUIÇÃO DO MOTOR:
Se souber com certeza o tipo de distribuição deste motor, mencione. Se não souber com certeza, não mencione — omitir é melhor que errar.

3. ESPECIFICIDADE TOTAL:
Sua resposta deve refletir o tempo REAL que um mecânico experiente levaria neste veículo específico. Furgões diesel como Jumpy, Expert, Ducato, Sprinter, Master têm tempos significativamente maiores que carros de passeio para o mesmo tipo de serviço.

4. JUSTIFICATIVA TÉCNICA:
Explique na justificativa por que o tempo é esse — quais desmontagens são necessárias, qual a dificuldade de acesso, o que aumenta ou reduz o tempo.

Responda APENAS com JSON válido:
{
  "horas_estimadas": 0.5,
  "valor_servico": 50.00,
  "justificativa": "explicação técnica específica e precisa para este veículo e serviço — inclua dificuldades de acesso, desmontagens necessárias e fatores que influenciam o tempo",
  "alertas_risco": ["alerta técnico real e específico 1", "alerta 2"],
  "verificar_junto": ["serviço relacionado com justificativa técnica", "serviço 2", "serviço 3"],
  "se_nao_trocar": "consequência real e concreta para este veículo específico"
}

valor_servico = horas_estimadas x ${valorHora}
Responda APENAS com o JSON, sem texto antes ou depois.`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + process.env.OPENAI_KEY
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        max_tokens: 900,
        temperature: 0.1,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    const data = await response.json();

    if (!data.choices || !data.choices[0]) {
      return res.status(500).json({ error: 'Erro OpenAI', detail: JSON.stringify(data).substring(0, 200) });
    }

    const text = data.choices[0].message.content.trim().replace(/```json|```/g, '').trim();
    const result = JSON.parse(text);
    res.status(200).json(result);

  } catch (error) {
    res.status(500).json({ error: 'Erro: ' + error.message });
  }
}
