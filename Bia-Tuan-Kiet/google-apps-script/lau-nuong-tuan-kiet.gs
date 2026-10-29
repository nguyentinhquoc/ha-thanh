/**
 * Google Sheet "Lẩu nướng Tuấn Kiệt" – nhận dữ liệu form của website Bia-Tuan-Kiet:
 *   - Form đặt bàn     → tab "Đặt bàn"
 *   - Form nhận ưu đãi → tab "Nhận ưu đãi"
 * Cài đặt: Tiện ích mở rộng → Apps Script → dán toàn bộ file này → chạy hàm setup
 *          → Triển khai → Ứng dụng web (Thực thi: Tôi, Quyền truy cập: Bất kỳ ai).
 * Author: WaveBear
 */
const NOTIFY_EMAIL = ''; // email của quán để nhận báo mỗi lượt đặt bàn / đăng ký; để '' nếu không cần

const FORMS = {
  'dat-ban': {
    sheet: 'Đặt bàn',
    subject: 'Đặt bàn mới',
    phoneField: 'so_dien_thoai',
    nameField: 'ho_ten',
    fields: [
      ['ho_ten', 'Họ tên'],
      ['so_dien_thoai', 'Số điện thoại'],
      ['ngay', 'Ngày'],
      ['gio', 'Giờ'],
      ['so_khach', 'Số khách'],
      ['khu_vuc', 'Khu vực'],
      ['ghi_chu', 'Ghi chú'],
      ['trang', 'Trang'],
    ],
  },
  'uu-dai': {
    sheet: 'Nhận ưu đãi',
    subject: 'Đăng ký nhận ưu đãi',
    phoneField: 'lien_he',
    nameField: 'lien_he',
    fields: [
      ['lien_he', 'SĐT / Email'],
      ['trang', 'Trang'],
    ],
  },
};

// Chạy 1 lần trong trình soạn thảo: tạo các tab + dòng tiêu đề và cấp quyền cho script.
function setup() {
  Object.keys(FORMS).forEach((key) => getSheet_(FORMS[key]));
}

function doPost(e) {
  const params = (e && e.parameter) || {};
  const form = FORMS[params.form];
  if (!form) return json_({ result: 'error', error: 'Không rõ dữ liệu gửi từ form nào' });

  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    const row = [new Date()].concat(form.fields.map(([key]) => cell_(params[key], key === form.phoneField)));
    getSheet_(form).appendRow(row);
  } catch (error) {
    return json_({ result: 'error', error: String(error) });
  } finally {
    lock.releaseLock();
  }
  notify_(form, params);
  return json_({ result: 'success' });
}

function getSheet_(form) {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = spreadsheet.getSheetByName(form.sheet) || spreadsheet.insertSheet(form.sheet);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(['Thời gian'].concat(form.fields.map(([, label]) => label)));
    sheet.getRange(1, 1, 1, form.fields.length + 1).setFontWeight('bold');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

// Dấu ' đầu ô: giữ số 0 đầu của số điện thoại và chặn nội dung kiểu "=IMPORTXML(...)" chạy thành công thức.
function cell_(value, isPhone) {
  const text = String(value || '').slice(0, 1000);
  return isPhone || /^[=+\-@]/.test(text) ? "'" + text : text;
}

function notify_(form, params) {
  if (!NOTIFY_EMAIL) return;
  try {
    const lines = form.fields.filter(([key]) => params[key]).map(([key, label]) => label + ': ' + params[key]);
    MailApp.sendEmail(
      NOTIFY_EMAIL,
      '[Tuấn Kiệt] ' + form.subject + ': ' + (params[form.nameField] || ''),
      lines.join('\n')
    );
  } catch (error) {
    console.error('Không gửi được email báo: ' + error);
  }
}

function json_(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}
