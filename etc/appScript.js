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
  const data = JSON.parse(e.postData.contents);

  Logger.log("=== [doPost 호출] ===");
  Logger.log("받은 데이터: " + JSON.stringify(data));

  /**
   * CASE 1: CTA 버튼 클릭 → 시트1의 request 컬럼 업데이트
   * - uuid + request 값이 모두 포함된 경우
   */
  if (data.uuid && String(data.request) === "Y") {
    Logger.log("[CASE 1] CTA 버튼 클릭 처리");
    const sheet = ss.getSheetByName("시트1");
    const lastRow = sheet.getLastRow();
    const uuidColumn = 2;     // uuid는 B열
    const requestColumn = 13; // request는 M열

    const values = sheet.getRange(2, uuidColumn, lastRow - 1, 1).getValues();
    Logger.log("찾는 uuid: " + data.uuid);
    Logger.log("시트 uuid 리스트: " + JSON.stringify(values.map(r => r[0])));

    for (let i = 0; i < values.length; i++) {
      const sheetUuid = values[i][0] ? values[i][0].toString().trim() : "";
      if (sheetUuid === data.uuid.trim()) {
        Logger.log("uuid 매칭 성공 → row=" + (i + 2));
        sheet.getRange(i + 2, requestColumn).setValue("Y");
        return ContentService.createTextOutput(
          JSON.stringify({ result: "updated", uuid: data.uuid })
        ).setMimeType(ContentService.MimeType.JSON);
      }
    }

    Logger.log("uuid 매칭 실패 → not_found");
    return ContentService.createTextOutput(
      JSON.stringify({ result: "not_found", uuid: data.uuid })
    ).setMimeType(ContentService.MimeType.JSON);
  }

  /**
   * CASE 2: CTA 입력폼 제출 → CTA_Responses 시트에 신규 행 추가
   * - 명시적으로 ctaForm=true 가 전달된 경우만
   */
  if (String(data.ctaForm) === "true") {
    Logger.log("[CASE 2] CTA 입력폼 제출");
    const sheet = ss.getSheetByName("CTA_Responses");
    const uid = "CTA-" + (sheet.getLastRow() + 1);
    const uuid = data.uuid || Utilities.getUuid();

    sheet.appendRow([
      uid, uuid, new Date(),
      decodeUTF8(data.name || ""),
      decodeUTF8(data.phone || ""),
      decodeUTF8(data["hospital-name"] || ""),
      decodeUTF8(data.email || "")
    ]);

    return ContentService.createTextOutput(
      JSON.stringify({ result: "inserted", uid, uuid })
    ).setMimeType(ContentService.MimeType.JSON);
  }

  /**
   * CASE 3: tt.html 최초 제출 → 시트1에 신규 행 추가
   * - uuid/request/ctaForm 조건에 해당하지 않을 경우
   */
  Logger.log("[CASE 3] tt.html 신규 제출");
  const sheet = ss.getSheetByName("시트1");
  const lastRow = sheet.getLastRow();
  const uid = "UID-" + (lastRow + 1);
  const uuid = Utilities.getUuid();

  sheet.appendRow([
    uid, uuid, new Date(),
    decodeUTF8(data.name),
    decodeUTF8(data.phone),
    decodeUTF8(data.email || ""),
    decodeUTF8(data["hospital-name"] || ""),
    decodeUTF8(data.specialty || ""),
    decodeUTF8(data["address-base"] || ""),
    decodeUTF8(data["address-detail"] || ""),
    decodeUTF8(data.gender || ""),
    decodeUTF8(data.age || ""),
    "", // request (초기 공란)
    decodeUTF8(data.ip || "")
  ]);

  return ContentService.createTextOutput(
    JSON.stringify({ result: "inserted", uid, uuid })
  ).setMimeType(ContentService.MimeType.JSON);
}
