// test-submit.js
// Vercel 배포 도메인에서 API 호출 테스트
// 실행 방법: node test-submit.js

//import fetch from "node-fetch";  // Node 18 이상이면 내장 fetch 사용 가능

// 배포된 Vercel 도메인 (Andy님 프로젝트 기준)
const BASE_URL = "https://touch-two.vercel.app/api/submit";

async function testInsert() {
  console.log("=== 신규 입력 테스트 ===");

  const response = await fetch(BASE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
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
    }),
  });

  const data = await response.json();
  console.log("응답:", data);
  return data;
}

async function testUpdate(uuid) {
  console.log("=== request 업데이트 테스트 ===");

  const response = await fetch(BASE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      uuid,       // 앞에서 받은 uuid 입력
      request: "Y",
    }),
  });

  const data = await response.json();
  console.log("응답:", data);
}

(async () => {
  try {
    // 1. 신규 입력 → uid/uuid 반환
    const inserted = await testInsert();

    // 2. 같은 uuid로 request 업데이트
    if (inserted.uuid) {
      await testUpdate(inserted.uuid);
    } else {
      console.warn("UUID가 반환되지 않았습니다.");
    }
  } catch (err) {
    console.error("테스트 중 오류 발생:", err);
  }
})();
