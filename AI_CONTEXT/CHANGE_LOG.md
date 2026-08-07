# CHANGE LOG — Logistics Cost Dashboard

> Ghi mọi thay đổi, mới nhất trên cùng.

## 2026-08-07 — Đối chiếu Excel↔GAS: đóng lệch $659 (DATA out-of-sync) → baseline $45.061,40

### Bối cảnh
User dán Evergreen + cập nhật `22_Map_Cost`/`25_UpdateManual`/`19_Overhead_Raw`, thấy Excel $45.061,39807 ≠ GAS $44.402,40 (lệch **$659**). Yêu cầu tìm nội dung lệch.

### Chẩn đoán (read-only; đọc Excel `40_FACT_CostLines` + so raw VND per-forwarder)
- Lệch KHÔNG do code — GAS xử lý đúng raw đang có trên Sheets; **Sheets lệch Excel**:
  1. **Rate:** Excel 26462 vs Sheets 26452 (~$16 + chênh cent mọi nguồn VND; EI khớp tuyệt đối vì rate per-row).
  2. **DHL:** Sheets thiếu 4 lô (AWB 1848752496/3270210414/4448587290/8056639732) = 15 dòng / 21.670.860 VND / ~$818.
  3. **FedEx Import:** cùng 429 dòng, Sheets nhiều hơn Excel 3.809.554 VND (~$144).
  - VVMV +1 dòng = `Báo cáo quyết toán` $0 (TD-23).

### Kết quả
- User đồng bộ Sheets ← Excel (raw + rate) → `rebuildFact` → GAS `?action=meta` **1495 dòng · $45.061,40** = Excel (khớp cent), `missingUsd 0`, Evergreen phân loại Overhead đúng.
- **Baseline mới:** 1495 dòng / **$45.061,40** / rate **26462**.
- **Không đổi code.** Docs: handover/PROJECT_STATE/TECH_DEBT/TODO.

## 2026-08-07 — Overhead: khoản CHƯA map vẫn phân loại Overhead (safety-net) + chốt root cause PQ

### Bối cảnh
User thêm tay dòng `Evergreen / Customs handling` vào `19_Overhead_Raw`. rebuildFact log `⚠️ Phí CHƯA map` và dòng bị loại khỏi các khối theo `Import/Export` (dashboard byIE / forwarderReport / lrOverhead) — dù VẪN vào tổng chung.

### Root cause (đối chiếu ground truth `data/_source/pq_section1.m`)
- `stg_Overhead` (M dòng 250–257): `19_Overhead_Raw` **LeftOuter join** `Map_Cost` → `Standard Cost`/`FWD Column` CHỈ từ join. Khoản không có trong Map_Cost → cả hai = **null**.
- `Import/Export` (M dòng 65): `if [FWD Column]="Overhead FWD" then "Overhead" else …`. FWD null → KHÔNG là Overhead → rơi xuống null → bị loại khỏi khối Overhead.
- ⇒ **Đây là thiết kế PQ, KHÔNG phải bug GAS.** `Map_Cost` là **bảng điều khiển**: khoản phí mới phải được đăng ký ở đó.

### Thay đổi
- **fix(gas):** `Transform.gs::stageOverhead_` — sheet 19 là KHO overhead nên khoản CHƯA map mặc định `FWD Column='Overhead FWD'` (→ `impExp_`→'Overhead', hiện đủ mọi khối + vào tổng nhất quán) và `Standard Cost`=tên gốc (nhãn có nghĩa). Cảnh báo `qc.unmapped` giữ làm FYI. **Safety-net**: GAS rộng lượng hơn PQ — khoản overhead quên đăng ký KHÔNG bị mất khỏi tổng.
- **test:** `test/run_tests.cjs` — thêm fixture `Evergreen/Customs handling` (chưa map) + 5 assert (FWD default, Import/Export=Overhead, Standard Cost=tên gốc, Amount_USD vào tổng, vẫn cảnh báo). **55/55 PASS**.
- **verify live:** `?action=facts` — Evergreen: FWD='Overhead FWD', Import/Export='Overhead', Amount_USD=340.24; **0 dòng Import/Export null**.

### Root-cause fix (QĐ user: Map_Cost + giữ safety-net)
- **[USER]** thêm dòng vào `22_Map_Cost`: `Evergreen | Customs handling | <Standard Cost> | Overhead FWD` → clear warning, GAS≡PQ, chuẩn hóa nhãn. Safety-net GAS vẫn giữ cho khoản tương lai.

## 2026-08-07 — Rotate GAS: dán URL mới vào env.js (khôi phục data thật)

### Thay đổi
- **fix(env):** `config/env.js` `GS_WEBAPP_URL` `REDACTED-ROTATED` → **URL Web App GAS mới** (user rotate/redeploy sau đợt bảo mật 2026-08-06). `USE_MOCK` giữ `false`.
- **verify:** `?action=ping` → `{ok, version:0.3.0}` ✅; `?action=meta` → **rowCount 1479 · totalUsd $44.062,16 · pobUsd 0 · routes 9 · forwarders 7** → baseline khớp, app đọc data thật lại.
- **docs:** TD-12 cập nhật (URL đã rotate + dán); SESSION_HANDOVER/PROJECT_STATE/TODO_NEXT.

### Lưu ý bảo mật (QĐ 2026-08-07)
- **GitHub Pages public bắt buộc** để hosting → **URL GAS public theo thiết kế** (SPA lộ env.js cho browser; che trong git vô nghĩa). Chấp nhận URL trong repo public. **Rủi ro tồn dư:** data tài chính đọc được qua URL → phải quyết **TD-10** (token GAS / auth backend). Còn: GitHub Support purge cache SHA cũ.

## 2026-07-25 (v0.3.0) — Phase A hoàn chỉnh + Phase B trang Logistics record

### Bối cảnh
Hoàn tất các chiều phân loại còn thiếu của pipeline (Route/Loại hàng/POB) và dựng trang **Logistics record** bám báo cáo CEO Excel. Ground truth: `context/11_BUSINESS_RULES.md` §6/§7/§9 + header raw thật (`backend/Setup.gs` 16/17/18/26).

### Thay đổi
- **feat(gas):** `Transform.gs` — **Route ×3** (`buildRouteExport_` sheet 16 khóa B/L=Tracking#, chuẩn hóa Transfer→Other/x→null; `buildRouteWTA_` winner-take-all sheet 17 theo CDS & BL, hòa→Trị giá NT; `routeFor_` ưu tiên UpdateManual→Export→CDS→BL→Third party 'Other'→null, Overhead→null), **Loại hàng ×2** (`loadMapLoaiHinh_` 26 + `buildLoaiHang_` sheet 17, xung đột→null, `loaiHangFor_` chỉ hàng nhập), **UpdateManual** (`buildUpdateManual_`, tab 25 optional), **POB** (`stagePOB_` sheet 18 → nhãn `Pay on behalf`, AMOUNT VND→USD tỷ giá tháng). `commonTier_(r,rate,dims)`. `report_` tách **Full vs POB**.
- **feat(gas):** `Code.gs` `?action=pob` + `DataService.gs::getPOB()` (đọc 18 lấy quote-customer/remark + Amount_USD).
- **feat(web):** `report.js` — `lrMonthlySeries/lrImport/lrExport/lrOverhead` (**khử trùng** CW/B-L/CDS theo lô — trọng lượng & số lô/tờ khai đúng); **QĐ-51** lọc `Pay on behalf` khỏi dashboard/forwarder/route.
- **feat(web):** `views.js` `logisticsRecord` (bảng phân cấp tháng-cột: Full/POB/Total · Import theo loại hàng · Export theo dự án · Overhead) + `pobTable`; `app.js` nav `logistics-record` + 2 bar chart + `loadPOB`; `index.html` nav item; `api.js`/`routes.js` `pob()`; `mock-data.js` +Loại hàng/CW/CDS/POB + `MOCK_POB`.
- **chore:** version bump **0.3.0** (env.js, Config.gs, index.html).
- **test:** `test/run_tests.cjs` (Node + Spreadsheet giả) — **46/46 PASS**. Bằng chứng `EVD/` (txt/json + `preview_live.html` mock + screenshot). Xác minh trình duyệt: Dashboard total = Full (POB loại), Logistics record 4 khối + chart + POB detail 2 dòng.
- **docs:** QĐ-51 (PLAN_LOGISTICS_RECORD); SESSION_HANDOVER/PROJECT_STATE/TODO_NEXT.

### Đối chiếu (người dùng chạy thật)
Dán `backend/*.gs` → `rebuildFact()` → **Full ≈ $44.062** (7 nguồn như cũ) + dòng **POB** riêng; log "Route/Loại hàng có giá trị" > 0. **Deploy New version** cho `?action=pob`.

## 2026-07-22 (khuya-3) — Phase A: port Power Query (staging đủ 6 nguồn)

### Bối cảnh
Trích **toàn bộ mã M gốc** từ DataMashup của `Logistics_System.xlsx` (`data/_source/pq_section1.m`, 22 query) làm ground truth thay vì mô tả context.

### Thay đổi
- **refactor(gas):** `Transform.gs` viết lại theo **đúng khuôn PQ**: mỗi nguồn `UnpivotOtherColumns(tập định danh)` → tầng chung 1 lần (Amount≠0 · USD_Rate · Amount_USD [EI riêng] · Mode chuẩn khớp-chuỗi-chính-xác · Import/Export). Thêm **VVMV** (bridge B/L invoice→Tracking# sheet 16, chuẩn hóa invoice §11), **Dolphin**, **EI** (40 cột, Currency VND/USD, tỷ giá riêng lô). DHL/FedEx sửa cho khớp PQ (unpivot-others, không intersect Map_Cost).
- `normHdr_` chuẩn hóa header (gộp xuống-dòng/space) để khớp tên cột dù lệch khoảng trắng.
- **Route/Loại hàng: bước kế** (giữ null) — validate tổng trước.
- **Đối chiếu:** kỳ vọng đủ 7 nguồn **1.480 dòng / $44.062** (VVMV 936/$27.056 · Dolphin 29/$2.195 · EI 37/$2.105 · DHL 23/$1.398 · FedExExp 25/$585 · FedExImp 429/$9.891 · Overhead 4/$1.066).

## 2026-07-22 (khuya-2) — GAS engine dựng fact từ raw (QĐ-44)

### Thay đổi
- **feat(gas):** `backend/Transform.gs` — `rebuildFact()` dựng `40_FACT_CostLines` TỪ raw 10–19 (thay Power Query). Batch: đọc raw + `22_Map_Cost` + `23_Map_ExchangeRate` + tháng `00_Config!B1` → GHI fact. Menu `onOpen()`. **v1:** courier (DHL/FedEx Exp/Imp) + Overhead; lõi 4 trường (Amount_USD·Standard Cost·Mode chuẩn·Import/Export). Reader tự dò header, `num_` parse text→số. QC log phí chưa map.
- **feat(gas):** `Setup.gs` thêm tab `00_Config` (A1=ThangBaoCao, B1=YYYY-MM).
- **rename:** tab fact `fact_CostLines` → **`40_FACT_CostLines`** (khớp quy ước raw 10–19) — `Config.FACT_TAB`, `Setup`, `Transform`. Web đọc + rebuildFact ghi cùng tab này.
- **Đối chiếu v1 (từ Excel):** 481 dòng/$12.940,87 (DHL 23/$1.398,37 · FedExExp 25/$585,09 · FedExImp 429/$9.890,95 · Overhead 4/$1.066,46). Đủ 7 nguồn: 1.480/$44.062.
- **docs:** QĐ-44; DATA_CONTRACT §0.1; SYSTEM_ARCHITECTURE.

## 2026-07-22 (khuya) — Nối GAS Web App thật + DB đa-tab raw

### Thay đổi
- **feat(gas):** `backend/Setup.gs` — `setupSheets()` chạy 1 lần trong editor.
  - **v1:** tạo tab `fact_CostLines` (24 header A:X).
  - **v2 (QĐ-43):** mở rộng tạo **11 tab RAW** (`10_DHL_Raw`…`19_Overhead_Raw`) + giữ `fact_CostLines`. Header thật trích từ `Logistics_System.xlsx`; tab raw để **Plain text toàn cột**. DB Google Sheets nay quản lý **toàn bộ raw data**; Excel vẫn là engine; web vẫn chỉ đọc `fact_CostLines`. Idempotent, không xóa dữ liệu.
- **feat(env):** dán `GS_WEBAPP_URL` thật (`AKfycby28…/exec`) vào `config/env.js`, đặt `USE_MOCK: false` → app đọc dữ liệu thật.
- **kiểm:** `?action=ping` → `{ok:true,version:0.2.0}` ✅. `?action=meta` báo thiếu tab `fact_CostLines` (đúng — chưa chạy `setupSheets` + chưa dán data).

### Fix sau rebuild thật
- **writeFact_ làm chủ tab:** xóa hẳn + tạo mới (tránh header cũ lệch cột, format ngày, lỗi "cột đã nhập").
- **getReportMonth_/monthKey_:** validate `YYYY-MM`, ép Date→YYYY-MM (Sheets tự đổi tháng thành ngày).
- **Giữ đúng bộ cột §6 (10_MODEL_SPEC):** staging courier dùng bản đồ `keep` — DHL/FedEx bỏ dư `INVOICE NO.` (đối chiếu fact Excel: DHL/FedEx chỉ giữ B/L·Shipper·Consignee·Origin·Destination·CW). Khuôn cho VVMV/Dolphin/EI (ghi chú kèm code).
- **Nút Đồng bộ web:** `refreshData()` (spinner+toast) thay F5.

### Còn lại
- Chạy `setupSheets()` trong editor → dán A:X (từ dòng 9 Excel) vào ô A1 (Paste values only) → refresh web.
- ⚠️ Web App "Anyone" + repo còn nợ bảo mật (TD-11): ai có URL đọc được cost data thật khi sheet đã dán.

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
