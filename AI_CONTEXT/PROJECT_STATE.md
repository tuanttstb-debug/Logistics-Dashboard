# PROJECT STATE — Logistics Cost Dashboard

**Cập nhật:** 2026-07-22

> **Δ phiên 2026-07-22:** Chặng 1+2 xong (UI 4 trang, chạy mock). Handover đầy đủ ở `SESSION_HANDOVER.md`; nợ ở `TECH_DEBT.md`; việc kế tiếp ở `TODO_NEXT.md`. **Đính chính:** thư mục **chưa phải git repo** (`.git` không có) — chưa commit/push được (TD-01).

## Trạng thái tổng thể

```
Engine dữ liệu (Excel)   ████████████████████ 100%  ✅ QC sạch (không đổi)
Context + kiến trúc web  ████████████████████ 100%  ✅
UI/Dashboard thật        ██████████████████░░  ~90%  ✅ Chặng 2 (chạy trên mock)
Backend GAS deploy       ░░░░░░░░░░░░░░░░░░░░    0%  ⬜ chờ Sheets + URL
Git repo                 ░░░░░░░░░░░░░░░░░░░░    0%  ⛔ chưa init (.git không có — TD-01)
```

**Chặng 2 đã hiện thực (2026-07-22):** 4 trang — Dashboard (KPI + so sánh kỳ + 3 biểu đồ Chart.js) · Báo cáo CEO theo forwarder (Import/Export/Overhead/Third party, freight tách Air/Sea) · Theo Route · Giới thiệu. Chọn tháng, dark mode. Chạy được trên **dữ liệu mẫu** (`assets/js/mock-data.js`); logic đã smoke-test khớp tổng.

## Đã xong (Chặng 1)

- Gộp dự án về `D:\Workspace\Production\Logistics-Dashboard` (QĐ-36): `AI_CONTEXT/` · `context/` · `data/`.
- Ghi QĐ-33/34/35 (đảo trục web), QĐ-36 (gộp thư mục).
- Bộ `AI_CONTEXT`: PROJECT_OVERVIEW, SYSTEM_ARCHITECTURE, DATA_CONTRACT, WORKING_RULE, GITHUB_WORKFLOW, OPEN_QUESTION, ASSUMPTION_LOG, THEME/RESPONSIVE, khung DESIGN_SYSTEM/UIUX, PROJECT_STATE, TODO, CHANGE_LOG.
- Skeleton: `index.html` + `config/` + `assets/css` + `assets/js` + `backend/` (khung rỗng, chạy được, hiện placeholder).

## Đang chặn / còn lại

- **Dữ liệu thật** ⬜ chưa tạo Google Sheet + deploy GAS + dán `GS_WEBAPP_URL` → hiện đang chạy mock.
- Chưa xác minh trực quan trên trình duyệt thật (mới smoke-test logic + syntax).
- Web-Q còn mở: Q-W01 (CORS/host), Q-W04 (đọc tất cả/từng tháng), Q-W05 (số dòng/tháng).

## Việc kế tiếp

1. Mở `index.html` xem UI trên dữ liệu mẫu; góp ý layout.
2. Tạo Google Sheet + tab `fact_CostLines`, deploy `backend/` làm Web App, dán URL vào `config/env.js` → tắt mock.
3. Viết SOP đẩy dữ liệu Excel→Sheets từng bước.
