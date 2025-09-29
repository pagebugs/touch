/**
 * 문자열을 UTF-8로 디코딩
 * - 일부 환경에서 한글이 깨지는 문제를 방지하기 위해 사용
 */
function decodeUTF8(str) {
  if (!str) return "";
  return Utilities.newBlob(str).getDataAsString("utf-8");
}

function doPost(e) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const data = JSON.parse(e.postData.contents); // 전달받은 JSON 데이터를 객체로 변환

  /**
   * CASE (신규): CTA 입력폼 별도 저장
   * - 요청 JSON에 ctaForm:true 가 포함된 경우 실행
   */
  if (data.ctaForm) {
    const sheet = ss.getSheetByName("CTA_Responses");   // 📌 새 탭 이름
    const uid = "CTA-" + (sheet.getLastRow() + 1);
    const uuid = data.uuid || Utilities.getUuid();

    sheet.appendRow([
      uid, uuid, new Date(),
      decodeUTF8(data.name),
      decodeUTF8(data.phone),
      decodeUTF8(data.hospital || data["hospital-name"]),
      decodeUTF8(data.email || "")
    ]);

    return ContentService.createTextOutput(
      JSON.stringify({ result: "inserted", uid, uuid })
    ).setMimeType(ContentService.MimeType.JSON);
  }

  /**
   * CASE 1: 기존 row의 request 값 업데이트 (CTA 버튼 클릭 시)
   * - 요청 JSON에 uuid와 request 값이 모두 포함된 경우 실행
   */
  if (data.uuid && data.request) {
    const sheet = ss.getActiveSheet();
    const lastRow = sheet.getLastRow();
    const uuidColumn = 2;      // uuid 컬럼 (2번째 열)
    const requestColumn = 13;  // request 컬럼 (13번째 열)

    // uuid 값들 추출 (2행부터 마지막 행까지)
    const values = sheet.getRange(2, uuidColumn, lastRow - 1, 1).getValues();

    for (let i = 0; i < values.length; i++) {
      if (values[i][0] == data.uuid) {
        // uuid가 일치하는 행을 찾으면 request 값을 "Y"로 업데이트
        sheet.getRange(i + 2, requestColumn).setValue("Y");

        return ContentService.createTextOutput(
          JSON.stringify({ result: "updated", uuid: data.uuid })
        ).setMimeType(ContentService.MimeType.JSON);
      }
    }

    // uuid가 시트에서 발견되지 않은 경우
    return ContentService.createTextOutput(
      JSON.stringify({ result: "not_found", uuid: data.uuid })
    ).setMimeType(ContentService.MimeType.JSON);
  }

 /**
 * CASE 2: 신규 row 추가 (폼 입력 단계)
 * - request 값이 없을 경우, 새로운 데이터 행을 추가
 */
const sheet = ss.getActiveSheet();
const lastRow = sheet.getLastRow();
const uid = "UID-" + (lastRow + 1);
const uuid = Utilities.getUuid();

// 새로운 행 추가 (UTF-8 디코딩 적용)
sheet.appendRow([
  uid,                                // UID
  uuid,                               // UUID
  new Date(),                         // timestamp
  decodeUTF8(data.name),              // 성함
  decodeUTF8(data.phone),             // 연락처
  decodeUTF8(data.email),             // 이메일
  decodeUTF8(data["hospital-name"]),  // 병원 이름
  decodeUTF8(data.specialty),         // 전문 진료 분야
  decodeUTF8(data["address-base"]),   // 기본 주소
  decodeUTF8(data["address-detail"]), // 상세 주소
  decodeUTF8(data.gender),            // 성별
  decodeUTF8(data.age),               // 연령대
  "",                                 // request (초기 공란)
  decodeUTF8(data.ip || "")           // 📌 신규 추가: 사용자 IP
]);

  // ✅ 반드시 응답 반환
  return ContentService.createTextOutput(
    JSON.stringify({ result: "inserted", uid, uuid })
  ).setMimeType(ContentService.MimeType.JSON);
}