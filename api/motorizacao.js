export const config = { api: { bodyParser: true } };

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }

  const { modelo, ano } = req.body || {};
  if (!modelo) { res.status(400).json({ error: 'Modelo obrigatorio' }); return; }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + process.env.OPENAI_KEY
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        max_tokens: 200,
        temperature: 0,
        messages: [{
          role: 'user',
          content: `Liste as motorizações disponíveis para o ${modelo} ${ano||''} no mercado brasileiro. Responda APENAS com JSON: {"motorizacoes": ["1.0 Fire Flex", "1.3 GSE Firefly Flex"]}. Máximo 6 opções, da mais comum para a mais rara. Sem texto antes ou depois.`
        }]
      })
    });

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content?.trim().replace(/```json|```/g,'').trim();
    const result = JSON.parse(text);
    res.status(200).json(result);
  } catch(e) {
    // Fallback: retorna vazio para o app mostrar só o campo manual
    res.status(200).json({ motorizacoes: [] });
  }
}
