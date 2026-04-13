export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.status(200).end();

  const idToken = (req.headers.authorization || "").replace("Bearer ", "").trim();
  if (!idToken) return res.status(401).json({ erro: "Não autorizado" });

  // Verifica token e pega uid
  const verifyRes = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=AIzaSyAFLxVIoPzCKiXcgZV_s7dyOr7N-HlUHEk`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken })
    }
  );
  const verifyData = await verifyRes.json();
  if (!verifyData.users?.length) return res.status(401).json({ erro: "Token inválido" });

  const uid = verifyData.users[0].localId;
  const fsBase = `https://firestore.googleapis.com/v1/projects/fb-precifica/databases/(default)/documents`;
  const authHeader = { "Authorization": `Bearer ${idToken}`, "Content-Type": "application/json" };

  // ── GET — busca cache de uma placa ──
  if (req.method === "GET") {
    const placa = (req.query.placa || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (!placa) return res.status(400).json({ erro: "Placa ausente" });

    try {
      const r = await fetch(`${fsBase}/placas/${placa}`, { headers: authHeader });
      if (!r.ok) return res.status(200).json({ cache: null });
      const data = await r.json();
      const f = data.fields || {};
      return res.status(200).json({
        cache: {
          placa: f.placa?.stringValue,
          modelo: f.modelo?.stringValue,
          ano: f.ano?.stringValue,
          motor: f.motor?.stringValue,
          combustivel: f.combustivel?.stringValue,
          versoes: JSON.parse(f.versoes?.stringValue || "[]"),
          consultadoEm: f.consultadoEm?.timestampValue
        }
      });
    } catch (e) {
      return res.status(200).json({ cache: null });
    }
  }

  // ── POST — salva cache de placa + histórico de consulta ──
  if (req.method === "POST") {
    const { placa, veiculo, servico, resultado } = req.body || {};
    if (!placa || !veiculo) return res.status(400).json({ erro: "Dados ausentes" });

    const placaLimpa = placa.toUpperCase().replace(/[^A-Z0-9]/g, "");
    const agora = new Date().toISOString();

    try {
      // Salva/atualiza cache da placa (global — qualquer usuário aproveita)
      await fetch(`${fsBase}/placas/${placaLimpa}`, {
        method: "PATCH",
        headers: authHeader,
        body: JSON.stringify({
          fields: {
            placa:       { stringValue: placaLimpa },
            modelo:      { stringValue: veiculo.modelo || "" },
            ano:         { stringValue: veiculo.ano || "" },
            motor:       { stringValue: veiculo.motor || "" },
            combustivel: { stringValue: veiculo.combustivel || "" },
            versoes:     { stringValue: JSON.stringify(veiculo.versoes || []) },
            consultadoEm:{ timestampValue: agora }
          }
        })
      });

      // Salva histórico de consulta do usuário
      if (servico && resultado) {
        const histId = `${uid}_${Date.now()}`;
        await fetch(`${fsBase}/historico/${histId}`, {
          method: "PATCH",
          headers: authHeader,
          body: JSON.stringify({
            fields: {
              uid:       { stringValue: uid },
              placa:     { stringValue: placaLimpa },
              modelo:    { stringValue: veiculo.modelo || "" },
              ano:       { stringValue: veiculo.ano || "" },
              motor:     { stringValue: veiculo.motor || "" },
              servico:   { stringValue: servico },
              resultado: { stringValue: JSON.stringify(resultado) },
              criadoEm:  { timestampValue: agora }
            }
          })
        });
      }

      return res.status(200).json({ ok: true });
    } catch (e) {
      return res.status(500).json({ erro: "Erro ao salvar: " + e.message });
    }
  }

  return res.status(405).json({ erro: "Método não permitido" });
}
