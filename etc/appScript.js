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

  // CASE 1: r.html의 CTA 입력폼 제출 시 ('CTA_Responses' 시트에만 저장)
  if (data.ctaForm) {
    const sheet = ss.getSheetByName("CTA_Responses");
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
  // CASE 2: r.html의 CTA 버튼 클릭 시 ('시트1'의 request 필드 업데이트)
  else if (data.uuid && data.request) {
    const sheet = ss.getSheetByName("시트1");
    const lastRow = sheet.getLastRow();
    if (lastRow < 2) { // 데이터가 헤더만 있는 경우 예외 처리
        return ContentService.createTextOutput(JSON.stringify({ result: "not_found", uuid: data.uuid })).setMimeType(ContentService.MimeType.JSON);
    }
    const uuidColumn = 2;
    const requestColumn = 13;
    const values = sheet.getRange(2, uuidColumn, lastRow - 1, 1).getValues();

    for (let i = 0; i < values.length; i++) {
      if (values[i][0] == data.uuid) {
        sheet.getRange(i + 2, requestColumn).setValue("Y");
        return ContentService.createTextOutput(JSON.stringify({ result: "updated", uuid: data.uuid })).setMimeType(ContentService.MimeType.JSON);
      }
    }

    return ContentService.createTextOutput(JSON.stringify({ result: "not_found", uuid: data.uuid })).setMimeType(ContentService.MimeType.JSON);
  }
  // CASE 3: tt.html의 최초 폼 제출 시 ('시트1'에 신규 행 추가)
  else {
    const sheet = ss.getSheetByName("시트1");
    const lastRow = sheet.getLastRow();
    const uid = "UID-" + (lastRow + 1);
    const uuid = Utilities.getUuid();

    sheet.appendRow([
      uid, uuid, new Date(),
      decodeUTF8(data.name),
      decodeUTF8(data.phone),
      decodeUTF8(data.email),
      decodeUTF8(data["hospital-name"]),
      decodeUTF8(data.specialty),
      decodeUTF8(data["address-base"]),
      decodeUTF8(data["address-detail"]),
      decodeUTF8(data.gender),
      decodeUTF8(data.age),
      "", // request (초기 공란)
      decodeUTF8(data.ip || "")
    ]);

    return ContentService.createTextOutput(
      JSON.stringify({ result: "inserted", uid, uuid })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}