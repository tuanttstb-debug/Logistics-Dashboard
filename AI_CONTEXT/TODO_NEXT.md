# TODO NEXT — Logistics Cost Dashboard

> Việc kế tiếp theo ưu tiên. Delta phiên 2026-07-22. Checklist ngắn ở `TODO.md`.

## ✅ Ưu tiên 1 — Git (XONG)
- [x] `git init` + commit `8b008e6` + push `origin/main` (github.com/tuanttstb-debug/Logistics-Dashboard). Dọn clone rỗng lồng nhau.

## 🔴 Ưu tiên 2 — Kết nối dữ liệu thật
- [x] **Xác định phạm vi DB** (QĐ-41/42): `40_FACT_CostLines` A:X, header dòng 9, 1 tháng (2026-06).
- [x] Hoàn thiện GAS BE (`Config`/`DataService`/`Code`/`Utils`) khớp scope; sửa tên cột thật.
- [ ] Tạo Google Sheet, tab `fact_CostLines`; **dán A:X từ dòng 9** (xem SOP trong `DATA_CONTRACT.md` §2).
- [ ] Dán mã `backend/*.gs` vào Apps Script của Sheet; Deploy → Web app → copy `/exec` URL.
- [ ] Dán URL vào `config/env.js` `GS_WEBAPP_URL`; kiểm `?action=ping|facts|meta`.
- [ ] `USE_MOCK` để `true` cũng được (tự bỏ qua khi có URL), hoặc set `false`.
- [ ] Viết **SOP đẩy Excel→Sheets** từng bước (Refresh All → copy sheet 40 → paste values).

## 🟠 Ưu tiên 3 — Xác minh & hoàn thiện UI
- [ ] Mở `index.html` kiểm 4 trang + đổi tháng + dark mode + mobile (768/480).
- [ ] (Tùy) bộ lọc forwarder / Import-Export / Mode trên topbar.
- [ ] (Tùy) làm tròn USD, trạng thái rỗng rõ hơn.

## 🟡 Web-Q còn mở (hỏi owner)
- Q-W01 host ở đâu (GitHub Pages → rủi ro CORS) · Q-W04 đọc tất cả/từng tháng · Q-W05 số dòng/tháng.

## ⚪ Sau này
- Đơn giá USD/kg, USD/CBM (QĐ-40 hoãn) · Pay-on-behalf (QĐ-28) · Sheet 70 nâng cao · phân tích Kaizen.
