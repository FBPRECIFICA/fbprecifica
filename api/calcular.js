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

REGRAS CRÍTICAS — SIGA OBRIGATORIAMENTE:

REGRA 1 — TEMPO REAL DE BANCADA:
Estime o tempo com base na realidade da bancada, não em teoria.
Exemplos de tempos REAIS:
- Troca de bieleta / barra estabilizadora: 20 a 40 minutos (serviço rápido, acesso fácil)
- Troca de óleo: 20 a 30 minutos
- Pastilhas de freio dianteiras: 30 a 45 minutos
- Velas de ignição motor simples: 20 a 30 minutos
- Amortecedor dianteiro: 45 a 60 minutos por lado
- Embreagem carro compacto: 3 a 5 horas
- Embreagem caminhão leve: 6 a 8 horas
- Embreagem caminhão pesado: 8 a 14 horas
- Correia dentada motor simples: 2 a 3 horas
- Correia dentada motor complexo: 4 a 6 horas
- Motor corrente de comando: NÃO tem correia dentada para trocar
NUNCA arredonde para cima sem justificativa técnica real.

REGRA 2 — CORREIA vs CORRENTE DE DISTRIBUIÇÃO:
Antes de mencionar correia dentada, verifique se o motor usa CORREIA ou CORRENTE.
Motores com CORRENTE de distribuição (exemplos): GM Ecotec, VW TSI, Ford EcoBoost, Fiat FireFly 1.0, Fiat 1.3/1.6 16v, Toyota 1NZ, Honda 1.5 VTEC, Renault 1.0/1.3 TCe, Hyundai/Kia 1.0 T-GDI.
Se o veículo usa CORRENTE: NUNCA mencione troca de correia dentada. Correntes são projetadas para durar a vida útil do motor.
Se o veículo usa CORREIA: informe o intervalo de troca recomendado pelo fabricante.

REGRA 3 — ESPECIFICIDADE:
Sua resposta deve ser específica para ESTE veículo e ESTE serviço. Não dê respostas genéricas.

Responda APENAS com JSON válido:
{
  "horas_estimadas": 0.5,
  "valor_servico": 50.00,
  "justificativa": "explicação técnica específica e precisa para este veículo e serviço",
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
