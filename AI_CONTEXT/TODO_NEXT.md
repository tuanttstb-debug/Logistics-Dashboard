# TODO NEXT — Logistics Cost Dashboard

> Việc kế tiếp theo ưu tiên. Delta phiên 2026-07-22. Checklist ngắn ở `TODO.md`.

## 🔴 Ưu tiên 0 — BẢO MẬT lịch sử data (MỚI)
- [ ] Đổi repo sang **Private** (GitHub → Settings → Danger Zone) — làm ngay.
- [ ] Quyết có **rewrite history + force-push** để xóa `data/` khỏi mọi commit (`8b008e6`, `d26e33a`) không. Xem `TECH_DEBT.md` TD-11.
- [x] Gỡ `data/` khỏi tracking + `.gitignore` (push `ba780e2`) — chỉ hết ở bản mới, **chưa** hết lịch sử.

## ✅ Ưu tiên 1 — Git (XONG)
- [x] `git init` + push `origin/main`. Dọn clone rỗng lồng nhau.

## 🔴 Ưu tiên 2 — Kết nối dữ liệu thật
- [x] **Xác định phạm vi DB** (QĐ-41/42): `40_FACT_CostLines` A:X, header dòng 9, 1 tháng (2026-06).
- [x] Hoàn thiện GAS BE (`Config`/`DataService`/`Code`/`Utils`) khớp scope; sửa tên cột thật.
- [x] Viết **`SOP_DEPLOY.md`** (tạo Sheet + dán A:X + deploy GAS + nối env.js).
- [x] Dán mã `backend/*.gs` vào Apps Script của Sheet; Deploy → Web app → copy `/exec` URL.
- [x] Dán URL vào `config/env.js` `GS_WEBAPP_URL` + `USE_MOCK: false`. `?action=ping` ✅.
- [x] Viết `backend/Setup.gs` (`setupSheets()`) tạo tab `fact_CostLines` + header + Plain text.
- [ ] **Chạy `setupSheets()`** trong Apps Script editor (chọn hàm → ▶ Run → Allow). `?action=meta` hết báo "Không thấy tab".
- [ ] Dán A:X từ dòng 9 Excel vào ô A1 tab `fact_CostLines` (Ctrl+Shift+V, Paste values only) → refresh web thấy dữ liệu thật.
- [ ] Viết **SOP đẩy Excel→Sheets** từng bước (Refresh All → copy sheet 40 → paste values).

## 🟠 Ưu tiên 3 — Xác minh & hoàn thiện UI
- [ ] Mở `index.html` kiểm 4 trang + đổi tháng + dark mode + mobile (768/480).
- [ ] (Tùy) bộ lọc forwarder / Import-Export / Mode trên topbar.
- [ ] (Tùy) làm tròn USD, trạng thái rỗng rõ hơn.

## 🟡 Web-Q còn mở (hỏi owner)
- Q-W01 host ở đâu (GitHub Pages → rủi ro CORS) · Q-W04 đọc tất cả/từng tháng · Q-W05 số dòng/tháng.

## ⚪ Sau này
- Đơn giá USD/kg, USD/CBM (QĐ-40 hoãn) · Pay-on-behalf (QĐ-28) · Sheet 70 nâng cao · phân tích Kaizen.
