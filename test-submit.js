// test-submit-updated.js
// 실행 방법: node test-submit-updated.js
// Node.js 18 이상 권장 (내장 fetch 사용)

const BASE_URL =
  "https://script.google.com/macros/s/AKfycbwInM2NZG2qO0EcAf4HSEKwMvpAnjrtdx2tjIA1p-GQu-J93cG-_qXaEIw5PKMO5Q_0LQ/exec";

// 외부 IP 조회
async function getMyIp() {
  try {
    const res = await fetch("https://api.ipify.org?format=json");
    const data = await res.json();
    return data.ip || "";
  } catch (err) {
    console.warn("IP 조회 실패:", err);
    return "";
  }
}

// CASE C: 신규 입력 (tt.html 시뮬레이션)
async function testInsert(ip) {
  console.log("=== 신규 입력 테스트 (tt.html) ===");
  const body = {
    name: "홍길동",
    phone: "010-1234-5678",
    email: "doctor@sample.com",
    "hospital-name": "브라운성형외과",
    specialty: "성형외과",
    "address-base": "서울시 강남구",
    "address-detail": "테헤란로 123",
    gender: "M",
    age: "30대",
    "privacy-consent": true,
    ip, // 실제 클라이언트 IP
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

// CASE B: request 업데이트 (CTA 버튼 클릭 시뮬레이션)
async function testUpdate(uuid) {
  console.log("=== request 업데이트 테스트 (CTA 버튼 클릭) ===");
  const body = {
    uuid,
    request: "Y",
  };

  const res = await fetch(BASE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  console.log("request 업데이트 응답:", data);
  return data;
}

// CASE A: CTA 제출 (r.html 모달 제출 시뮬레이션)
async function testCTA(ip) {
  console.log("=== CTA 제출 테스트 (r.html) ===");
  const body = {
    ctaForm: true,
    name: "김철수",
    phone: "010-9999-0000",
    "hospital-name": "서울내과",
    email: "cta@test.com",
    ip,
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

// 메인 실행
(async () => {
  try {
    const ip = await getMyIp();
    console.log("테스트 클라이언트 IP:", ip);

    // 1) 신규 입력 → 시트1에 저장
    const inserted = await testInsert(ip);

    // 2) 같은 uuid로 request 업데이트 → 시트1에서 request 컬럼 'Y'
    if (inserted.uuid) {
      await testUpdate(inserted.uuid);
    } else {
      console.warn("UUID가 반환되지 않아 request 업데이트를 건너뜀.");
    }

    // 3) CTA 제출 → CTA_Responses에 저장
    await testCTA(ip);

    console.log("\n===== 테스트 완료 =====");
    console.log("시트1 → 신규 입력 & request 업데이트 확인");
    console.log("CTA_Responses → CTA 제출 확인");

  } catch (err) {
    console.error("테스트 중 오류 발생:", err);
  }
})();
