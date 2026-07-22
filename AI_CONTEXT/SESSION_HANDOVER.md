# SESSION HANDOVER — Logistics Cost Dashboard

> Mới nhất trên cùng. Mỗi phiên một block. Chỉ ghi delta của phiên.

## 2026-07-22 (khuya-3) — Chạy thật + fix + plan Logistics record + Phase A port PQ

### ✅ Task completed
- **Chạy thật rebuildFact** (courier+overhead) + sửa loạt lỗi thực tế: tháng đọc "Cột 1" (named range rác) → validate `YYYY-MM`; tháng thành Date → `monthKey_`; header/data lệch cột → `writeFact_` làm chủ tab; lỗi "cột đã nhập" → **xóa hẳn + tạo tab mới**; staging courier **bỏ dư `INVOICE NO.`** (giữ đúng §6).
- **Nút Đồng bộ web** `refreshData()` (spinner + toast) thay F5. Deploy Web App lại (giữ link) — nhắc **phải chọn "New version"**.
- **Research báo cáo "Logistics record"** (`data/Logistics record JUN 2026.xlsx`) + 2 chart (Import/Export) → **plan** `AI_CONTEXT/PLAN_LOGISTICS_RECORD.md` (QĐ-45..50).
- **Phase A:** trích **toàn bộ 22 query M gốc** từ DataMashup (`data/_source/pq_section1.m`) → viết lại `Transform.gs` theo đúng khuôn PQ (`UnpivotOtherColumns`); thêm **VVMV/Dolphin/EI** staging + tầng chung (USD/Mode chuẩn/Import-Export).

### 📁 Files changed
- `backend/Transform.gs` (viết lại lớn — 6 staging + tầng chung), `backend/Setup.gs` (00_Config), `backend/Config.gs` (FACT_TAB=40_FACT_CostLines), `backend/DataService.gs`.
- `assets/js/app.js` (nút Đồng bộ), `assets/css/components.css` (spinner), `index.html`.
- Mới: `AI_CONTEXT/PLAN_LOGISTICS_RECORD.md`. Sửa: `context/30_DECISIONS_LOG` (QĐ-44..50), DATA_CONTRACT/SYSTEM_ARCHITECTURE/CHANGE_LOG.
- Ref (gitignored): `data/_source/pq_section1.m`.

### 🧭 Decision
- **QĐ-45..50** (plan Logistics record): hoàn thiện pipeline trước · chuỗi tháng chỉ hiện tháng thực có · dựng cả 4 khối · POB=sheet 18 (nhãn `Import/Export='Pay on behalf'`) · Customs&Trucking={Customs,Trucking}, Origin/Dest LCC→dòng "Local charges" riêng · POB VND→USD.
- **Khuôn PQ:** mọi staging = UnpivotOtherColumns(tập định danh); ground truth = mã M gốc (không đoán từ context).

### 🚧 Blocker / lưu ý
- **Chưa validate** rebuildFact bản đủ 6 nguồn — user cần dán `Transform.gs` mới + chạy, đối chiếu **1.480 dòng/$44.062**.
- Cần tab `25_UpdateManual` trên Sheets cho Route/Loại hàng (user mới thêm 22/23/24/26; **thiếu 25** → sẽ để optional).
- 🔴 Nợ bảo mật **TD-11** vẫn nguyên (chưa Private/rewrite history).

### ➡️ Next step
1. User dán `Transform.gs` mới → `rebuildFact()` → đối chiếu 1.480/$44.062 (VVMV 936/$27.056 · Dolphin 29/$2.195 · EI 37/$2.105 · courier · Overhead).
2. Khớp → **Route ×3 + Loại hàng ×2** (mã M gốc đã có: winner-take-all sheet 17, bridge sheet 16, Map_LoaiHinh 26, UpdateManual 25 optional).
3. Rồi **POB** (sheet 18 → nhãn) → **Phase B** trang Logistics record (report.js + views + 2 chart + action `?action=pob`).

### ⚠️ Regression risk
- `Transform.gs` **viết lại toàn bộ** — đổi từ intersect-Map_Cost sang unpivot-others; totals phải khớp $44.062, nếu lệch nguồn nào xem QC "phí chưa map" (thường do tên cột/tab lệch).
- `normHdr_` chuẩn hóa header — nếu tab raw có header lệch nhiều (khối ghi chú) vẫn tự dò; nhưng tên cột phải khớp Map_Cost sau chuẩn hóa.
- Web đọc `40_FACT_CostLines`: mỗi lần chạy rebuildFact xóa+tạo lại tab (mất format thủ công nếu có).

## 2026-07-22 (khuya-2) — GAS engine dựng fact từ raw (QĐ-44)

### ✅ Task completed
- Nghiên cứu Power Query cũ (`context/10_MODEL_SPEC`, `11_BUSINESS_RULES`) + trích Map_Cost (57 dòng), header 11 raw, mục tiêu đối chiếu.
- **Viết `backend/Transform.gs`** — `rebuildFact()`: batch dựng `40_FACT_CostLines` TỪ raw (thay PQ). v1 courier+overhead, lõi 4 trường. Menu `onOpen()`.
- `Setup.gs` thêm tab `00_Config`; **đổi tên tab fact** `fact_CostLines`→`40_FACT_CostLines` (Config/Setup/Transform).

### 🧭 Decision
- **QĐ-44:** GAS tự dựng fact từ raw (batch rebuildFact, ghi `40_FACT_CostLines`); v1 tăng dần courier→VVMV/Dolphin/EI; lõi 4 trường. THAY một phần QĐ-43 (Excel PQ nay là tham chiếu).

### 🚧 Blocker / lưu ý
- User đã dán map 22/23/24/26 + raw 10–19 lên Sheets. **Chưa** chạy `rebuildFact()`.
- Tab cũ `fact_CostLines` (nếu đã tạo) thành orphan → **rename thành `40_FACT_CostLines`** hoặc chạy lại `setupSheets()` (tự tạo tab mới).
- 🔴 Nợ bảo mật TD-11 vẫn nguyên.

### ➡️ Next step
1. Dán `Transform.gs` + `Setup.gs` mới vào Apps Script. Tạo/điền `00_Config!B1='2026-06'`.
2. Chạy `rebuildFact()` (menu *Logistics DB → Rebuild fact*). Đối chiếu log: **481 dòng / $12.940,87**.
3. `curl ?action=meta` (rowCount≈481, totalUsd≈12940.87) → refresh web.
4. Sau khi khớp: cắm staging VVMV/Dolphin/EI, rồi Route/Loại hàng.

### ⚠️ Regression risk
- `rebuildFact` **ghi đè** toàn bộ `40_FACT_CostLines` bằng v1 (courier+overhead) → tổng dashboard tạm còn ~$12.940 tới khi thêm 3 nguồn còn lại.
- Lọc dòng Total của DHL dựa AWB trống — nếu debit hãng khác có kiểu total khác cần bổ sung luật.

## 2026-07-22 (khuya) — Nối GAS Web App thật + script tạo sheet

### ✅ Task completed
- **Deploy GAS xong** (owner làm): URL Web App `AKfycby28…/exec`. Dán vào `config/env.js` + `USE_MOCK:false`.
- **Test:** `?action=ping` → `{ok:true,version:0.2.0}` ✅. `?action=meta` → `{ok:false, "Không thấy tab: fact_CostLines"}` (đúng, chưa tạo tab).
- **Viết `backend/Setup.gs`** — `setupSheets()`: tạo tab + header + Plain text, freeze dòng 1. Idempotent (không xóa data). Chạy trong editor, **không cần redeploy**.
- **QĐ-43 — DB đa-tab raw:** đọc cấu trúc sheet 10–19 của `Logistics_System.xlsx` (openpyxl), mở rộng `Setup.gs` tạo **11 tab RAW** (`10_DHL_Raw`…`19_Overhead_Raw`, header thật) **+ giữ** `fact_CostLines`. Sheets là KHO toàn bộ raw data; **Excel vẫn là engine**; web vẫn chỉ đọc `fact_CostLines`.

### 📁 Files changed
- Mới: `backend/Setup.gs`.
- Sửa: `config/env.js` (URL + USE_MOCK), `context/30_DECISIONS_LOG` (QĐ-43), `AI_CONTEXT/DATA_CONTRACT` (§0 cấu trúc DB), `SYSTEM_ARCHITECTURE`, `SOP_DEPLOY|TODO_NEXT|PROJECT_STATE|CHANGE_LOG`.

### 🚧 Blocker
- 🔴 Nợ bảo mật TD-11 vẫn nguyên (data trong lịch sử Git) — **chưa xử lý**. Nay thêm: Web App "Anyone" + URL trong repo → ai có URL đọc được cost data thật **khi sheet đã dán**. Cân nhắc repo Private trước khi dán data.
- Web chưa có dữ liệu: chưa chạy `setupSheets()`, chưa dán A:X.

### ➡️ Next step
1. Apps Script editor → chọn `setupSheets` → ▶ Run → Allow. Kiểm `?action=meta` hết báo lỗi tab.
2. Dán Excel `40_FACT_CostLines` A:X (từ dòng 9) vào ô A1 tab `fact_CostLines` (Ctrl+Shift+V) → refresh web.
3. Mở `index.html` xác minh 4 trang trên dữ liệu thật.

### ⚠️ Regression risk
- `setupSheets()` chỉ ghi header khi tab RỖNG; nếu chạy sau khi đã dán data → giữ nguyên data, chỉ re-apply Plain text (an toàn).
- Header mẫu ở Setup.gs là placeholder — bước Paste values only sẽ đè header thật lên.

## 2026-07-22 (tối) — SOP deploy + gỡ data/ khỏi Git

### ✅ Task completed
- Viết `AI_CONTEXT/SOP_DEPLOY.md` — 3 phần từng nút bấm: (A) tạo Google Sheet + dán **A:X từ dòng 9**, (B) deploy Apps Script → Web App, (C) nối `env.js` + bảng xử lỗi CORS.
- **Gỡ `data/` khỏi Git** (`git rm --cached`) + thêm `data/` vào `.gitignore` — 2 file xlsx vẫn **còn trên máy**. Lý do: chứa dữ liệu công ty thật (shipper/consignee, số tiền, đường dẫn ổ mạng Y:/Z:, tên nhân viên) đã lỡ push.
- Push: `d26e33a` (SOP+GAS+scope), `ba780e2` (gỡ data/).

### 📁 Files changed
- Mới: `AI_CONTEXT/SOP_DEPLOY.md`.
- Sửa: `.gitignore` (chặn `data/`), `README.md` (trỏ SOP).

### 🧭 Decision made
- Tiếp QĐ-41/42. Gỡ `data/` khỏi tracking, giữ cục bộ (chưa đánh số QĐ — thao tác vận hành).

### 🚧 Blocker
- 🔴 **BẢO MẬT:** dữ liệu công ty **vẫn còn trong LỊCH SỬ Git** (`8b008e6`, `d26e33a`) — GitHub còn phục vụ được. **Chưa quyết:** đổi repo Private / rewrite history + force-push / để nguyên. Nếu repo public thì đã lộ, có thể đã bị cache/fork.
- Chưa deploy GAS + Google Sheet → web vẫn chạy **mock**.

### ➡️ Next step
1. **Xử lý lịch sử data** — khuyến nghị đổi repo **Private ngay**, rồi cân nhắc rewrite history (tôi hướng dẫn khi bạn chốt).
2. Chạy **SOP_DEPLOY.md**: tạo Sheet + dán A:X → deploy GAS → dán URL vào `config/env.js` (tắt mock).

### ⚠️ Regression risk
- `.gitignore` chặn `data/` → sau này muốn commit file trong `data/` sẽ bị bỏ qua (phải `-f`).
- Nếu rewrite history: mọi SHA đổi → ai đã clone phải re-clone.

## 2026-07-22 (chiều) — Xác định phạm vi DB + hoàn thiện GAS BE

- **Task:** đọc 2 file Excel thật (bản copy, không đụng gốc), xác định DB trước khi viết GAS.
- **Kết quả:** DB = `40_FACT_CostLines` **A:X, header dòng 9**, 1.480 dòng, chỉ tháng **2026-06** (QĐ-41/42). File `Logistics record JUN` = hệ thủ công AS-IS, **không** phải DB. A:X khớp context (sửa tên `INVOICE NO.`/`CDS NO.`). Route thật thêm MRO/AIC/LUCID/OEM. 1/1480 thiếu Amount_USD.
- **Files changed:** `context/30` (QĐ-41/42), `context/31` (G-01/G-04), `AI_CONTEXT/DATA_CONTRACT|ASSUMPTION_LOG|CHANGE_LOG|TODO_NEXT`, `assets/js/constants.js`, `backend/Config.gs`, `backend/DataService.gs`.
- **Blocker:** so sánh kỳ/YTD hiện "—" (chỉ 1 tháng). Chưa tạo Google Sheet/deploy GAS.
- **Next:** tạo Sheet + dán A:X (SOP `DATA_CONTRACT §2`) → deploy `backend/` → dán URL `env.js`. **Chưa commit/push các thay đổi này.**
- **Regression risk:** đổi `constants.INVOICE/CDS` (không dùng trong report, an toàn); GAS meta thêm field (tương thích ngược).

## Phiên 2026-07-22 — Chặng 1 + Chặng 2 (v0.2.0)

### ✅ Task completed
- **Đảo trục** Excel-only → thêm web app dashboard cho CEO (QĐ-33/34/35).
- **Gộp repo:** dồn toàn bộ về `D:\Workspace\Production\Logistics-Dashboard` — `AI_CONTEXT/` (doc web) · `context/` (00–32 engine Excel) · `data/` (xlsx + _source); **xóa** thư mục cũ `D:\Workspace\Logistics Ha` (QĐ-36).
- **Chặng 1:** bộ AI_CONTEXT + skeleton HTML/CSS/JS + khung GAS (chạy placeholder).
- **Chặng 2:** chốt Q-02→Q-05 (QĐ-37→40); hiện thực UI 4 trang — Dashboard (5 KPI + so sánh kỳ + 3 biểu đồ Chart.js), Báo cáo CEO theo forwarder (Import/Export/Overhead/Third party, freight tách Air/Sea theo `Mode chuẩn`), Theo Route, Giới thiệu. Chọn tháng + dark mode + dữ liệu mẫu.
- **Kiểm:** `node --check` 10 JS + 4 GS PASS; smoke-test `report.js` khớp tổng ($17,510 = tổng forwarder), dòng âm trừ đúng.

### 📁 Files changed (chính)
- **Mới (Chặng 2):** `assets/js/mock-data.js`, `assets/js/report.js`, `assets/js/views.js`, `assets/css/report.css`.
- **Sửa (Chặng 2):** `assets/js/app.js` (viết lại: điều hướng + chọn tháng + Chart.js), `index.html` (Chart.js CDN, chọn tháng, nav), `config/env.js` (USE_MOCK, VERSION 0.2.0).
- **Docs:** `context/30_DECISIONS_LOG.md` (QĐ-33→40), `context/31_OPEN_QUESTIONS.md` (đóng Q-02→Q-05), `context/00_INDEX.md` (đường dẫn), `AI_CONTEXT/*` (toàn bộ bộ tài liệu web + cập nhật DESIGN_SYSTEM/UIUX/PROJECT_STATE/TODO/CHANGE_LOG/OPEN_QUESTION).
- **Di chuyển:** 15 file `.md` → `context/`; `Logistics_System.xlsx` + `_source/` → `data/`.

### 🧭 Decision made
QĐ-33 (đảo phạm vi web) · QĐ-34 (GAS+Sheets+vanilla SPA) · QĐ-35 (rủi ro bảo trì) · QĐ-36 (gộp repo, thay QĐ-31) · QĐ-37 (Third party khối riêng, có vào tổng) · QĐ-38 (Route trang riêng) · QĐ-39 (so sánh kỳ: tháng trước+%+YTD) · QĐ-40 (chưa làm đơn giá). Chi tiết: `context/30_DECISIONS_LOG.md`.

### 🚧 Blocker
- ✅ **Git đã xử lý:** init + commit `8b008e6` + push lên `origin/main` (trên `fe62e69`). Đã phát hiện & dọn 1 **clone rỗng lồng nhau** `Logistics-Dashboard/` (là "git đã push" nhầm của phiên trước).
- **Chưa có dữ liệu thật:** chưa tạo Google Sheet + deploy `backend/` GAS → app đang chạy **mock** (`USE_MOCK=true`, `GS_WEBAPP_URL` trống).
- **Chưa xác minh trực quan** trên trình duyệt (mới smoke-test logic + syntax).

### ➡️ Next step
1. Làm rõ trạng thái git → `git init` (nếu cần) + commit + push Chặng 1+2.
2. Tạo Google Sheet + tab `fact_CostLines`; deploy `backend/` làm Web App; dán URL vào `config/env.js` → tắt mock.
3. Viết SOP đẩy Excel→Sheets từng bước (tiếng Việt).
4. Mở `index.html` xác minh UI + góp ý; cân nhắc bộ lọc forwarder/mode.
Chi tiết: `TODO_NEXT.md`.

### ⚠️ Regression risk
- `app.js` **viết lại toàn bộ** — nav/chọn tháng/vẽ chart có thể lỗi tương tác; cần mở trình duyệt kiểm.
- **Chart.js từ CDN** — offline / bị CSP chặn → biểu đồ trắng (đã guard `typeof Chart`, không vỡ trang).
- Truy cập field tên đặc biệt (`Import/Export`, `Mode chuẩn`) bằng bracket — nếu GAS đổi tên header khi export → JS đọc `undefined` (ASSUMPTION-W03).
- Dòng phí net = 0 tháng này bị **ẩn** khỏi bảng (lọc `cur||prev||ytd`) — chấp nhận, nhưng lưu ý khi đối chiếu Excel.
- **Đường dẫn cũ** `D:\Workspace\Logistics Ha` đã xóa — mọi tham chiếu ngoài (bộ nhớ, script khác) tới path cũ sẽ hỏng.
