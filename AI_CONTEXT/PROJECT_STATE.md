# PROJECT STATE — Logistics Cost Dashboard

**Cập nhật:** 2026-07-28

> **Δ phiên 2026-07-22:** Chặng 1+2 xong (UI 4 trang, chạy mock) + **đã git init/commit/push** (github.com/tuanttstb-debug/Logistics-Dashboard). Đã dọn 1 clone rỗng lồng nhau.
> **Δ (tối):** xác định phạm vi DB (QĐ-41 `40_FACT_CostLines` A:X / QĐ-42 1 tháng), hoàn thiện GAS BE, viết `SOP_DEPLOY.md`, **gỡ `data/` khỏi Git** (đã push `ba780e2`). 🔴 **Còn nợ bảo mật:** dữ liệu công ty vẫn trong lịch sử Git (xem `TECH_DEBT.md` TD-11).
> **Δ (khuya):** DB đa-tab raw 10–19 + `40_FACT_CostLines` (QĐ-43). **GAS tự dựng fact TỪ raw** (QĐ-44, `Transform.gs::rebuildFact`, thay Power Query) — Web App đã deploy, chạy thật courier+overhead. Đổi tên tab fact `fact_CostLines`→`40_FACT_CostLines`. Nút Đồng bộ web.
> **Δ (khuya-3):** **Phase A** port PQ (trích 22 query M gốc) — staging đủ **6 nguồn** (VVMV/Dolphin/EI + courier), tầng chung USD/Mode/Import-Export; Route/Loại hàng đang làm. Plan **Logistics record** (QĐ-45..50) `PLAN_LOGISTICS_RECORD.md`. **Chưa validate** bản 6 nguồn. Handover: `SESSION_HANDOVER.md`; việc kế tiếp: `TODO_NEXT.md`.
> **Δ 2026-07-25 (v0.3.0):** Hoàn tất **Phase A** (Route ×3 + Loại hàng ×2 + UpdateManual + POB trong `Transform.gs`; `report_` tách Full/POB) và **Phase B** (trang **Logistics record**: `report.js` lr*, `views.js`, `app.js` 2 chart, `?action=pob`). **QĐ-51** POB không vào Full của 3 trang cũ (áp cả `getMeta.totalUsd`=Full, `pobUsd` riêng). Test `test/run_tests.cjs` **49/49 PASS** + xác minh trình duyệt (EVD). Sửa `Setup.gs` chịu lỗi "cột đã nhập" (bỏ format tab đã có data). **ĐÃ DEPLOY LIVE v0.3.0** — xác minh endpoint thật: `meta` 1454 dòng/$43.322,6 Full, **Route ×3 chạy đúng** (routes thật AGIGA/FORD/PURE/MRO…), `?action=pob` sống (sheet 18 rỗng). ⚠️ **Cần đối chiếu** tổng lệch baseline ($43.322,6/1454 vs $44.062/1480 — nghi tỷ giá 26452 + snapshot raw); dán data POB sheet 18.
> **Δ 2026-07-28:** Nâng cấp `report_` (Transform.gs) — log **USD theo từng nguồn** + phơi **dòng bị filter `Amount=0`** (`<N> dòng · $<USD> (raw <M>, bỏ <K>)`), qua nhãn `_src` (không ghi vào fact). Mục đích: **tách bạch** lỗi tỷ giá (①, $ đồng đều) vs mất dòng (②, −26 dòng) khi đối chiếu baseline. Test **50/50 PASS**. Chờ user redeploy + rebuildFact để đọc bảng per-source.

## Trạng thái tổng thể

```
Engine dữ liệu (Excel)   ████████████████████ 100%  ✅ nay là THAM CHIẾU logic (PQ port sang GAS)
Context + kiến trúc web  ████████████████████ 100%  ✅
UI/Dashboard thật        ██████████████████░░  ~90%  ✅ Chặng 2 (+ nút Đồng bộ)
GAS pipeline (rebuildFact)███████████████████░  ~95%  🟢 7 nguồn + Route ×3 + Loại hàng ×2 + POB (code xong, test 46/46; chờ user chạy thật)
Logistics record (mới)   ██████████████████░░   90%  🟢 Phase A+B code xong + test; chờ deploy New version cho ?action=pob
Git repo                 ████████████████████ 100%  ✅ push (HEAD d6c03fe)
```

**Chặng 2 đã hiện thực (2026-07-22):** 4 trang — Dashboard (KPI + so sánh kỳ + 3 biểu đồ Chart.js) · Báo cáo CEO theo forwarder (Import/Export/Overhead/Third party, freight tách Air/Sea) · Theo Route · Giới thiệu. Chọn tháng, dark mode. Chạy được trên **dữ liệu mẫu** (`assets/js/mock-data.js`); logic đã smoke-test khớp tổng.

## Đã xong (Chặng 1)

- Gộp dự án về `D:\Workspace\Production\Logistics-Dashboard` (QĐ-36): `AI_CONTEXT/` · `context/` · `data/`.
- Ghi QĐ-33/34/35 (đảo trục web), QĐ-36 (gộp thư mục).
- Bộ `AI_CONTEXT`: PROJECT_OVERVIEW, SYSTEM_ARCHITECTURE, DATA_CONTRACT, WORKING_RULE, GITHUB_WORKFLOW, OPEN_QUESTION, ASSUMPTION_LOG, THEME/RESPONSIVE, khung DESIGN_SYSTEM/UIUX, PROJECT_STATE, TODO, CHANGE_LOG.
- Skeleton: `index.html` + `config/` + `assets/css` + `assets/js` + `backend/` (khung rỗng, chạy được, hiện placeholder).

## Đang chặn / còn lại

- **Dữ liệu thật** 🟡 GAS Web App đã deploy + `GS_WEBAPP_URL` đã dán (`USE_MOCK:false`), ping OK. Còn: chạy `setupSheets()` tạo tab + dán A:X. Xem `SESSION_HANDOVER` khuya 2026-07-22.
- Chưa xác minh trực quan trên trình duyệt thật (mới smoke-test logic + syntax).
- Web-Q còn mở: Q-W01 (CORS/host), Q-W04 (đọc tất cả/từng tháng), Q-W05 (số dòng/tháng).

## Việc kế tiếp

1. Mở `index.html` xem UI trên dữ liệu mẫu; góp ý layout.
2. Tạo Google Sheet + tab `fact_CostLines`, deploy `backend/` làm Web App, dán URL vào `config/env.js` → tắt mock.
3. Viết SOP đẩy dữ liệu Excel→Sheets từng bước.
