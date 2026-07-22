# CHANGE LOG — Logistics Cost Dashboard

> Ghi mọi thay đổi, mới nhất trên cùng.

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
