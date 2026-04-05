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

  const prompt = `Você é um especialista em mecânica automotiva brasileira com 20 anos de experiência.

Veículo: ${veiculo}
Serviço solicitado: ${servico}
Valor da hora de mão de obra: R$ ${valorHora}

Responda APENAS com JSON válido neste formato:
{
  "horas_estimadas": 2,
  "valor_servico": 200.00,
  "justificativa": "análise técnica detalhada",
  "alertas_risco": ["alerta 1", "alerta 2"],
  "verificar_junto": ["serviço 1", "serviço 2", "serviço 3"],
  "se_nao_trocar": "consequência para o cliente"
}

Calcule valor_servico = horas_estimadas x ${valorHora}
Responda APENAS com o JSON.`;

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
        temperature: 0.2,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    const data = await response.json();

    if (!data.choices || !data.choices[0]) {
      return res.status(500).json({ 
        error: 'OpenAI sem choices', 
        detail: JSON.stringify(data).substring(0, 200)
      });
    }

    const text = data.choices[0].message.content.trim().replace(/```json|```/g, '').trim();
    const result = JSON.parse(text);
    res.status(200).json(result);

  } catch (error) {
    res.status(500).json({ error: 'Erro: ' + error.message });
  }
}
