// Dán vào Tiện ích mở rộng → Apps Script của Google Sheet, rồi Triển khai → Ứng dụng web (Bất kỳ ai).
const SHEET_NAME = 'DatLich';
const NOTIFY_EMAIL = 'phongkhamngoaihathanh@gmail.com'; // để '' nếu không muốn nhận email báo
const HEADERS = ['Thời gian', 'Họ tên', 'Số điện thoại', 'Vấn đề', 'Ngày muốn khám', 'Ghi chú', 'Trang'];

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.tryLock(10000);
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
    if (sheet.getLastRow() === 0) sheet.appendRow(HEADERS);

    const p = e.parameter;
    // Dấu ' giữ số 0 đầu của số điện thoại
    const row = [new Date(), p.ho_ten || '', "'" + (p.so_dien_thoai || ''), p.van_de || '', p.ngay_hen || '', p.ghi_chu || '', p.trang || ''];
    sheet.appendRow(row);

    if (NOTIFY_EMAIL) {
      MailApp.sendEmail(
        NOTIFY_EMAIL,
        'Đặt lịch mới: ' + (p.ho_ten || '') + ' – ' + (p.so_dien_thoai || ''),
        HEADERS.map(function(h, i) { return h + ': ' + row[i]; }).join('\n')
      );
    }
    return json({ result: 'success' });
  } catch (err) {
    return json({ result: 'error', error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
