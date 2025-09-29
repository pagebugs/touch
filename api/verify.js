import { verify } from "../../lib/token";

export default async function handler(req, res) {
  const { token } = req.query;
  if (!token) {
    return res.status(401).json({ ok: false, error: "Missing token" });
  }

  const payload = verify(token);
  if (!payload) {
    return res.status(401).json({ ok: false, error: "Invalid or expired token" });
  }

  return res.status(200).json({ ok: true, payload });
}
