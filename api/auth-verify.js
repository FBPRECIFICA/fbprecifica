import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";

const firebaseConfig = {
  apiKey: "AIzaSyAFLxVIoPzCKiXcgZV_s7dyOr7N-HlUHEk",
  authDomain: "fb-precifica.firebaseapp.com",
  projectId: "fb-precifica",
  appId: "1:636655637162:web:8189ede5cc9f1a5c8036d3"
};

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ erro: "Método não permitido" });

  const { idToken } = req.body || {};
  if (!idToken) return res.status(400).json({ erro: "Token ausente" });

  try {
    // Verifica o token via Firebase Admin (REST API — sem SDK no Vercel hobby)
    const verifyUrl = `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${firebaseConfig.apiKey}`;
    const verifyRes = await fetch(verifyUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken })
    });
    const verifyData = await verifyRes.json();

    if (!verifyData.users || verifyData.users.length === 0) {
      return res.status(401).json({ erro: "Token inválido" });
    }

    const user = verifyData.users[0];
    const uid = user.localId;

    // Busca dados do usuário no Firestore via REST
    const fsUrl = `https://firestore.googleapis.com/v1/projects/fb-precifica/databases/(default)/documents/usuarios/${uid}`;
    const fsRes = await fetch(fsUrl, {
      headers: { "Authorization": `Bearer ${idToken}` }
    });

    if (!fsRes.ok) {
      return res.status(403).json({ erro: "Usuário não encontrado" });
    }

    const fsData = await fsRes.json();
    const fields = fsData.fields || {};

    const plano = fields.plano?.stringValue || "trial";
    const nome = fields.nome?.stringValue || user.displayName || "";
    const setores = fields.setores?.arrayValue?.values?.map(v => v.stringValue) || [];

    // Verifica expiração do trial
    let bloqueado = false;
    let motivoBloqueio = "";

    if (plano === "trial") {
      const expiraEm = fields.trialExpiraEm?.timestampValue;
      if (expiraEm && new Date(expiraEm) < new Date()) {
        bloqueado = true;
        motivoBloqueio = "Trial expirado";
      }
    } else if (plano === "bloqueado") {
      bloqueado = true;
      motivoBloqueio = "Acesso bloqueado";
    }

    return res.status(200).json({
      ok: true,
      uid,
      nome,
      email: user.email,
      plano,
      setores,
      bloqueado,
      motivoBloqueio
    });

  } catch (e) {
    return res.status(500).json({ erro: "Erro interno: " + e.message });
  }
}
