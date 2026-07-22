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
- [x] Viết `backend/Setup.gs` (`setupSheets()`) — QĐ-43: tạo **11 tab RAW (10–19)** + `fact_CostLines`, header thật + Plain text.
- [ ] Dán `backend/Setup.gs` mới vào Apps Script (thay bản cũ) → **Chạy `setupSheets()`** (chọn hàm → ▶ Run → Allow). Kiểm 12 tab đã tạo; `?action=meta` hết báo "Không thấy tab".
- [x] (QĐ-43) Dán raw từng nguồn vào tab 10–19; dán map 22/23/24/26.
- [x] **(QĐ-44)** Viết `backend/Transform.gs::rebuildFact()` dựng `40_FACT_CostLines` TỪ raw (thay PQ). v1 courier+overhead. Đổi tên tab fact → `40_FACT_CostLines`. `Setup.gs` thêm `00_Config`.

## ✅ Ưu tiên 2b — rebuildFact courier + fix (XONG)
- [x] Chạy `rebuildFact()` courier+overhead; fix: validate tháng, `monthKey_`, `writeFact_` làm chủ tab (xóa+tạo), bỏ dư `INVOICE NO.` (§6), nút Đồng bộ web, deploy "New version".

## 🔴 Ưu tiên 2c — Phase A: port PQ đủ 6 nguồn (ĐANG)
- [x] Trích 22 query M gốc (`data/_source/pq_section1.m`). Viết lại `Transform.gs` theo khuôn `UnpivotOtherColumns`; thêm VVMV/Dolphin/EI.
- [ ] **Dán `Transform.gs` mới → `rebuildFact()` → đối chiếu 1.480 dòng/$44.062** (VVMV 936/$27.056 · Dolphin 29/$2.195 · EI 37/$2.105 · DHL 23/$1.398 · FedExExp 25/$585 · FedExImp 429/$9.891 · Overhead 4/$1.066). Lệch → soi QC.
- [ ] **Route ×3 + Loại hàng ×2** (mã M có sẵn: winner-take-all sheet 17, bridge sheet 16, Map_LoaiHinh 26). Cần dán tab **25_UpdateManual** (optional).
- [ ] **POB** sheet 18 → nhãn `Import/Export='Pay on behalf'` (QĐ-48/50, VND→USD).

## 🔴 Ưu tiên 2d — Phase B: trang Logistics record (sau pipeline)
- [ ] `report.js` tổng hợp (chuỗi tháng Full/POB/Total · Import theo Loại hàng · Export theo Route · Overhead) + `views.js` bảng phân cấp + 2 bar chart + action `?action=pob`. Chi tiết: `PLAN_LOGISTICS_RECORD.md`.
- [ ] Viết **SOP đẩy Excel→Sheets** từng bước (Refresh All → copy raw 10–19 → paste values → rebuildFact).

## 🟠 Ưu tiên 3 — Xác minh & hoàn thiện UI
- [ ] Mở `index.html` kiểm 4 trang + đổi tháng + dark mode + mobile (768/480).
- [ ] (Tùy) bộ lọc forwarder / Import-Export / Mode trên topbar.
- [ ] (Tùy) làm tròn USD, trạng thái rỗng rõ hơn.

## 🟡 Web-Q còn mở (hỏi owner)
- Q-W01 host ở đâu (GitHub Pages → rủi ro CORS) · Q-W04 đọc tất cả/từng tháng · Q-W05 số dòng/tháng.

## ⚪ Sau này
- Đơn giá USD/kg, USD/CBM (QĐ-40 hoãn) · Pay-on-behalf (QĐ-28) · Sheet 70 nâng cao · phân tích Kaizen.
