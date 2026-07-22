/* config/env.js — cấu hình môi trường.
 * SỬA GS_WEBAPP_URL sau khi deploy backend/ làm Google Apps Script Web App.
 * File này nạp ĐẦU TIÊN (xem index.html). */
window.APP_CONFIG = {
  APP_NAME: 'Logistics Cost Dashboard',
  VERSION: '0.2.0',

  // Dán URL Web App của Apps Script vào đây (dạng https://script.google.com/macros/s/.../exec)
  // Để trống '' ở Chặng 1 → web hiện màn hình placeholder.
  GS_WEBAPP_URL: '',

  // Tùy chọn: đọc tất cả tháng hay từng tháng (xem OPEN_QUESTION Q-W04)
  LOAD_ALL_MONTHS: true,

  // Khi GS_WEBAPP_URL trống: true = hiện dữ liệu MẪU để xem UI; false = màn hình placeholder
  USE_MOCK: true,

  // Bật log ra console khi debug
  DEBUG: true,
};
