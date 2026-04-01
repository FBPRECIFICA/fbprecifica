export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }

  const { placa } = req.query;
  if (!placa) { res.status(400).json({ error: 'Placa obrigatoria' }); return; }

  try {
    const token = '41368a96a1a92ae80223685716740c68';
    const url = `https://wdapi2.com.br/consulta/${placa}/${token}`;
    const response = await fetch(url);
    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao consultar placa' });
  }
}
