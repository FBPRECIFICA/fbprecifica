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

  const prompt = `Você é um sistema especializado EXCLUSIVAMENTE em precificação de serviços automotivos para oficinas mecânicas brasileiras.

VEÍCULO: ${veiculo}
SERVIÇO SOLICITADO: ${servico}
VALOR HORA M.O.: R$ ${valorHora}

REGRA 0 — VALIDAÇÃO DO SERVIÇO:
Analise se o campo SERVIÇO é realmente um serviço a ser PRECIFICADO (ex: troca de embreagem, revisão, freios, correia, suspensão, etc).
Se o usuário digitou uma PERGUNTA (ex: "como se troca", "o que é", "qual a função de", "me explica"), uma FRASE FORA DE CONTEXTO ou qualquer coisa que não seja um serviço automotivo para precificar, retorne APENAS este JSON:
{"erro_servico": "Por favor, digite o nome do serviço a ser precificado. Ex: troca de embreagem, revisão completa, pastilhas de freio."}

REGRA 1 — VERSÃO DO MOTOR:
Verifique se o modelo do veículo informado possui MAIS DE UMA versão de motor disponível no mercado brasileiro (ex: Fiat Argo pode ser 1.0 FireFly ou 1.3 GSE; Chevrolet Onix pode ser 1.0 aspirado ou 1.0 Turbo).
Se houver mais de uma versão de motor relevante para o serviço solicitado, retorne APENAS este JSON:
{"versoes": ["1.0 FireFly (corrente)", "1.3 GSE (correia)", "1.4 EVO (correia)"], "pergunta": "Qual é a versão do motor do veículo?"}
Se houver apenas uma versão ou se a versão não afeta o serviço, prossiga normalmente.

REGRA 2 — TEMPO REAL DE BANCADA:
- Bieleta / barra estabilizadora: 20 a 40 minutos
- Troca de óleo: 20 a 30 minutos
- Pastilhas dianteiras: 30 a 45 minutos
- Velas motor simples: 20 a 30 minutos
- Amortecedor por lado: 45 a 60 minutos
- Embreagem compacto: 3 a 5 horas
- Embreagem caminhão leve: 6 a 8 horas
- Embreagem caminhão pesado: 8 a 14 horas
- Correia dentada simples: 2 a 3 horas
- Correia dentada complexo: 4 a 6 horas
NUNCA infle o tempo sem justificativa técnica real.

REGRA 3 — CORREIA vs CORRENTE:
Motores com CORRENTE (não têm correia para trocar): FireFly 1.0/1.3, VW TSI, Ford EcoBoost, Fiat 1.3/1.6 16v, Toyota 1NZ, Honda 1.5 VTEC, Renault TCe, Hyundai/Kia T-GDI, GM Ecotec turbo.
Se o veículo usa CORRENTE e o serviço for correia dentada, informe isso na justificativa.

Se o serviço for válido e a versão do motor não for ambígua, retorne:
{
  "horas_estimadas": 0.5,
  "valor_servico": 50.00,
  "justificativa": "análise técnica específica para este veículo e serviço",
  "alertas_risco": ["alerta 1", "alerta 2"],
  "verificar_junto": ["serviço 1", "serviço 2", "serviço 3"],
  "se_nao_trocar": "consequência real para o cliente"
}

valor_servico = horas_estimadas x ${valorHora}
Responda APENAS com JSON, sem texto antes ou depois.`;

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
