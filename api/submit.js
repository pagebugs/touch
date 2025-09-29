import { sign } from "../../lib/token";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { name, phone } = req.body;
  if (!name || !phone) {
    return res.status(400).json({ error: "Invalid input" });
  }

  try {
    // 1. Google Apps Script 엔드포인트로 데이터 저장
    const response = await fetch(process.env.GAS_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req.body),
    });

    const data = await response.json();

    // 2. 토큰 생성 (5분 유효)
    const payload = {
      name,
      exp: Date.now() + 1000 * 60 * 5,
    };
    const token = sign(payload);

    // 3. Google Sheet 저장 결과 + 토큰 함께 반환
    return res.status(200).json({
      ok: true,
      sheet: data, // GAS 응답
      token,
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: "Failed to submit data",
      detail: error.message,
    });
  }
}
