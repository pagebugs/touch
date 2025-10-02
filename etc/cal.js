function doGet(e) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const configSheet = ss.getSheetByName("Config");
  const data = configSheet.getRange(2,1,5,2).getValues();
  // A2:B6 영역 (Key, Value)

  const result = {};
  data.forEach(row => {
    result[row[0]] = row[1];
  });

  return ContentService.createTextOutput(
    JSON.stringify(result)
  ).setMimeType(ContentService.MimeType.JSON);
}