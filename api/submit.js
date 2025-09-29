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
    console.log(">>> [Submit API] 요청 데이터:", req.body);

    // 1. Google Apps Script 엔드포인트 호출
    const response = await fetch(process.env.GAS_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req.body),
    });

    const raw = await response.text();   // 먼저 text로 받아보기
    console.log(">>> [Submit API] GAS Raw Response:", raw);

    let data;
    try {
      data = JSON.parse(raw);
    } catch (err) {
      console.error(">>> [Submit API] JSON 파싱 실패:", err);
      return res.status(500).json({
        ok: false,
        error: "GAS 응답 파싱 실패",
        raw,
      });
    }

    console.log(">>> [Submit API] GAS Parsed Response:", data);

    // 2. 토큰 생성
    const payload = { name, exp: Date.now() + 1000 * 60 * 5 };
    const token = sign(payload);

    // 3. 기존 GAS 응답 구조 + token 추가
    return res.status(200).json({
      ...data,
      token,
    });
  } catch (error) {
    console.error(">>> [Submit API] 처리 중 에러:", error);
    return res.status(500).json({
      ok: false,
      error: "Failed to submit data",
      detail: error.message,
    });
  }
}
