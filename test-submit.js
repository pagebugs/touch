// test-submit-full.js
// 사용법: node test-submit-full.js
// Node 18+ 권장 (내장 fetch 사용)

const BASE_URL = "https://script.google.com/macros/s/AKfycbwInM2NZG2qO0EcAf4HSEKwMvpAnjrtdx2tjIA1p-GQu-J93cG-_qXaEIw5PKMO5Q_0LQ/exec";

async function getMyIp() {
  try {
    const res = await fetch("https://api64.ipify.org?format=json");
    const j = await res.json();
    return j.ip || "";
  } catch (err) {
    console.warn("IP 조회 실패:", err);
    return "";
  }
}

async function testInsert(ip) {
  console.log("=== 1) 신규 입력 테스트 (tt.html 시뮬레이션) ===");
  const body = {
    name: "테스트 이용자",
    phone: "010-1111-2222",
    email: "test.user@example.com",
    "hospital-name": "테스트의원",
    specialty: "내과",
    "address-base": "테스트시 테스트구",
    "address-detail": "테스트로 1",
    gender: "M",
    age: "40대",
    "privacy-consent": true,
    ip, // 실제 IP 포함
  };

  const res = await fetch(BASE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  console.log("신규 입력 응답:", data);
  return data;
}

async function testUpdateRequest(uuid) {
  console.log("=== 2) request 업데이트 테스트 (CTA 버튼 클릭 시뮬레이션) ===");
  const res = await fetch(BASE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      uuid,
      request: "Y",
    }),
  });
  const data = await res.json();
  console.log("request 업데이트 응답:", data);
  return data;
}

async function testCTA(ip) {
  console.log("=== 3) CTA 제출 테스트 (ctaForm:true) ===");
  const body = {
    ctaForm: true,
    name: "CTA 테스트",
    phone: "010-9999-0000",
    "hospital-name": "CTA 병원",
    email: "cta@test.example",
    ip, // CTA도 IP 포함 여부 확인
  };
  const res = await fetch(BASE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  console.log("CTA 제출 응답:", data);
  return data;
}

(async () => {
  try {
    const ip = await getMyIp();
    console.log("테스트에서 사용할 IP:", ip || "(빈값)");

    // 1) 신규 입력
    const inserted = await testInsert(ip);

    // 2) request 업데이트 (uuid 필요)
    if (inserted && inserted.uuid) {
      await testUpdateRequest(inserted.uuid);
    } else {
      console.warn("UUID가 반환되지 않았습니다. request 업데이트를 건너뜁니다.");
    }

    // 3) CTA 제출 (별도 CTA 탭에 저장되는지 확인)
    const ctaResult = await testCTA(ip);

    console.log("\n===== 테스트 완료 =====");
    console.log("신규 행 응답:", inserted);
    console.log("CTA 응답:", ctaResult);
    console.log("구글 시트에서 시트1과 CTA_Responses 탭을 확인하세요.");
  } catch (err) {
    console.error("테스트 실패:", err);
  }
})();
