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

  const prompt = `Você é um especialista em mecânica automotiva brasileira com 20 anos de experiência em oficinas de todos os portes — carros de passeio, furgões, pickups, caminhões leves e pesados, ônibus, retroescavadeiras e tratores.

Veículo: ${veiculo}
Serviço solicitado: ${servico}
Valor da hora de mão de obra: R$ ${valorHora}

Com base no seu conhecimento técnico real sobre este veículo específico (motor, transmissão, acessibilidade mecânica, complexidade do serviço), responda:

1. Qual o tempo real necessário para executar este serviço neste veículo? Use seu conhecimento real de tabela tempária — considere o modelo específico, o tipo de motor, a complexidade de acesso e desmontagem necessária.

2. Calcule o valor: horas_estimadas × ${valorHora} = valor_servico

3. Forneça uma análise técnica explicando por que esse tempo para esse veículo específico.

4. Liste alertas de risco técnicos reais e específicos para este serviço neste veículo.

5. Indique serviços que fazem sentido verificar enquanto o veículo está aberto — com justificativa técnica e potencial de faturamento adicional.

6. Dê um argumento convincente e real para o cliente sobre o que acontece se não fizer o serviço agora.

Responda APENAS com JSON válido neste formato exato:
{
  "horas_estimadas": 8,
  "valor_servico": 800.00,
  "justificativa": "análise técnica detalhada e específica",
  "alertas_risco": ["alerta 1", "alerta 2"],
  "verificar_junto": ["serviço 1 — justificativa técnica de por que verificar agora", "serviço 2", "serviço 3"],
  "se_nao_trocar": "consequência real e concreta para o cliente"
}

Responda APENAS com o JSON, sem texto antes ou depois.`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + process.env.OPENAI_KEY },
      body: JSON.stringify({
        model: 'gpt-4o',
        max_tokens: 900,
        temperature: 0.2,
        messages: [{ role: 'user', content: prompt }]
      })
    });
    const data = await response.json();
    const text = data.choices[0].message.content.trim().replace(/```json|```/g, '').trim();
    const result = JSON.parse(text);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao calcular: ' + error.message });
  }
}
