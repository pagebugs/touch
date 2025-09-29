// lib/token.js
import crypto from "crypto";

const SECRET = process.env.SECRET_KEY || "mySuperSecretKey_2025!"; // 환경변수로 관리
const TOKEN_TTL = 60 * 5; // 5분

export function sign(payload) {
  const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const hmac = crypto.createHmac("sha256", SECRET).update(data).digest("base64url");
  return `${data}.${hmac}`;
}

export function verify(token) {
  try {
    const [dataB64, sig] = token.split(".");
    if (!dataB64 || !sig) return null;
    const expected = crypto.createHmac("sha256", SECRET).update(dataB64).digest("base64url");
    if (!crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(sig))) return null;

    const payload = JSON.parse(Buffer.from(dataB64, "base64url").toString("utf8"));
    if (payload.exp && Date.now() > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}
