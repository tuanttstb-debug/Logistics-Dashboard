# CHANGE LOG — Logistics Cost Dashboard

> Ghi mọi thay đổi, mới nhất trên cùng.

## 2026-07-22 (chiều) — Xác định phạm vi DB thật + hoàn thiện GAS

### Bối cảnh
Đối chiếu 2 file Excel thật (đọc bản copy, không đụng gốc): `Logistics record JUN 2026.xlsx` (hệ thủ công AS-IS, không phải DB) và `Logistics_System.xlsx` (Power Query, chứa DB).

### Phát hiện & quyết định
- **QĐ-41:** DB = `40_FACT_CostLines` **cột A:X, header dòng 9** (1.480 dòng T6/2026). Bỏ ghi chú dòng 1–8 và legend AF:AZ (schema v2). Cột A:X **khớp** DATA_CONTRACT, trừ tên thật `INVOICE NO.`/`CDS NO.` (có dấu chấm).
- **QĐ-42:** fact chỉ có 1 tháng (2026-06) → so sánh kỳ/YTD hiển thị "—"; chấp nhận, chưa backfill.
- Số thật: VVMV 63%; Import 1389/Export 83/Third party 4/Overhead 4; route thật gồm cả **MRO, AIC, LUCID, OEM** (ngoài context G-04); **1/1480 thiếu Amount_USD**; tổng USD T6 = $44,062.

### Thay đổi
- **docs:** QĐ-41/42; cập nhật `DATA_CONTRACT.md` (nguồn A:X, header dòng 9, SOP dán A:X, tên cột `INVOICE NO.`/`CDS NO.`); `context/31` G-01/G-04.
- **fix(js):** `constants.js` INVOICE/CDS đúng tên thật.
- **feat(gas):** `Config.gs` thêm `COL_IE`/`COL_MONEY`; `DataService.gs` meta thêm `rowCount/impExp/missingUsd/totalUsd`.
- **test:** node --check constants + 4 GAS PASS.

## 2026-07-22 — Chặng 2: UI thật (v0.2.0)

### Bối cảnh
Chốt Q-02→Q-05 (QĐ-37→40): Third party = khối riêng có vào tổng; Route = trang riêng; có so sánh kỳ (tháng trước + % + YTD); chưa làm đơn giá.

### Thay đổi
- **docs:** ghi QĐ-37→40; đóng Q-02→Q-05 ở `context/31_OPEN_QUESTIONS.md` + `AI_CONTEXT/OPEN_QUESTION.md`; cập nhật DESIGN_SYSTEM/UIUX bản thật, PROJECT_STATE, TODO.
- **feat(dashboard):** `report.js` (engine tổng hợp: forwarderReport/routeReport/dashboard + so sánh kỳ) · `views.js` (render 4 trang) · viết lại `app.js` (điều hướng SPA + chọn tháng + Chart.js).
- **feat:** 3 biểu đồ Chart.js (doughnut nhóm phí, bar forwarder, line xu hướng); màu theo token, vẽ lại khi đổi theme.
- **feat:** `mock-data.js` + `USE_MOCK` — xem UI khi chưa nối Google Sheets.
- **style:** `report.css` (bảng báo cáo, KPI so sánh, màu tăng=đỏ/giảm=xanh); `index.html` thêm Chart.js CDN + chọn tháng + nav.
- **test:** node --check toàn bộ JS/GS PASS; smoke-test `report.js` khớp tổng ($17,510 = tổng forwarder), dòng âm trừ đúng.

### Chưa làm
- Deploy GAS + Google Sheet (đang chạy mock). Bộ lọc forwarder/mode. Xác minh trực quan trình duyệt.

## 2026-07-22 — Chặng 1: khởi tạo dự án web

### Bối cảnh
Đảo trục từ hệ thống Excel-only sang bổ sung web app dashboard cho CEO (QĐ-33/34/35). Gộp toàn bộ về một repo (QĐ-36).

### Thay đổi
- **chore:** gộp `D:\Workspace\Logistics Ha` → `D:\Workspace\Production\Logistics-Dashboard` (`context/`, `data/`); xóa thư mục cũ.
- **docs:** ghi QĐ-33/34/35/36 vào `context/30_DECISIONS_LOG.md`; QĐ-31 → SUPERSEDED.
- **docs:** cập nhật `context/00_INDEX.md` đường dẫn mới.
- **docs:** tạo bộ `AI_CONTEXT/`: PROJECT_OVERVIEW, SYSTEM_ARCHITECTURE, DATA_CONTRACT, WORKING_RULE, GITHUB_WORKFLOW, OPEN_QUESTION, ASSUMPTION_LOG, THEME_ARCHITECTURE, RESPONSIVE_GUIDE, DESIGN_SYSTEM (khung), UIUX_SYSTEM (khung), PROJECT_STATE, TODO, CHANGE_LOG.
- **feat:** skeleton web `index.html` + `config/env.js` + `config/routes.js` + `assets/css/*` + `assets/js/*` (chạy được, hiện placeholder, chưa có dữ liệu thật).
- **chore(gas):** khung `backend/Code.gs` + `Config.gs` + `DataService.gs` + `Utils.gs`.
- **chore:** `.gitignore`, `README.md`.

### Chưa làm
- UI thật (chặn Q-02→Q-05). Google Sheet + deploy GAS. `git init` + push.
