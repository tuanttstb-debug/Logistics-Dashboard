# SESSION HANDOVER — Logistics Cost Dashboard

> Mới nhất trên cùng. Mỗi phiên một block. Chỉ ghi delta của phiên.

## 2026-07-28 (chốt) — ✅ BASELINE KHỚP: $44,062.16 (tỷ giá đúng, thủ phạm = VAT mất khi dán)

- **✅ Task completed — đóng lệch baseline.** Sau khi user dán lại cột VAT của VVMV: `rebuildFact` live = **1479 dòng · $44,062.16** vs Excel **1480 / $44,062** → **tiền khớp đến từng cent**. Hành trình chẩn đoán per-source đã xác định:
  1. **Tỷ giá 26452 ĐÚNG** (bác bỏ nghi vấn ~26008 ban đầu) — 4 nguồn (DHL/FedExImp/FedExExp/EI) khớp $ khít ở rate này chứng minh.
  2. **Thủ phạm = cột VAT của `14_VVMV_Raw` mất dữ liệu khi dán** (text `-` thay vì số → `num_`→null → GAS bỏ; Excel giữ số). User dán lại đúng → VVMV **909→934 dòng** (+19 VAT · +$739.57), khớp debit Excel (934).
  3. **Nghịch lý −6 (pipeline 909 vs diag 915) TỰ TAN** — nay pipeline = diag = 934. **Không có bug `readSheetObjects_`**; chênh 6 là do state VAT dở dang giữa 2 lần chạy.
- **🧭 Decision — chấp nhận baseline 1479 (không ép 1480):** dòng lệch duy nhất = `Báo cáo quyết toán` (overhead VVMV, **amount trống → $0**); GAS bỏ dòng không tiền (line 82/158). Ép giữ nó sẽ phá luật đang loại đúng 123 dòng $0 của FedEx. Lệch mang **$0** → chấp nhận, tiền tài chính đã đúng 100%.
- **📁 Files changed:** gỡ hàm chẩn đoán tạm `diagVVMV` khỏi `backend/Transform.gs` (+ menu) — đã xong việc; giữ nâng cấp `report_` per-source $. Test **50/50 PASS**. EVD regen. Docs.
- **⚠️ QUAN TRỌNG — KHÔNG thêm `Lệ phí hải quan` (6.150.000/$232.50) vào `19_Overhead_Raw`:** tiền đã khớp $44,062.16 mà Overhead vẫn 3 dòng → $232.50 đó **đã tính rồi** (qua cột `Infrastructure fee, lphq` trong debit VVMV). Thêm nữa → **double-count $44,294.67**. Để yên sheet 19.
- **➡️ Next step:** baseline xong. Còn: (1) dán data POB vào `18_ImportPOB_Raw` → rebuildFact → kiểm `?action=pob`; (2) mở web trên data thật kiểm trang Logistics record; (3) nợ bảo mật TD-11.

## 2026-07-28 — Công cụ chẩn đoán lệch baseline: report_ log $ theo nguồn

- **✅ Task completed:**
  - **Nâng cấp `report_` (Transform.gs)** để phục vụ đối chiếu tổng lệch baseline ($43.322,6/1454 live vs $44.062/1480 Excel). Trước đây log per-source chỉ có **số dòng**; nay thêm **USD theo từng nguồn** + phơi số **dòng bị filter `Amount=0` nuốt**: mỗi nguồn in `<N> dòng · $<USD> (raw <M>, bỏ <K> dòng Amount=0)`.
  - **Cơ chế:** gắn nhãn `_src` cho từng dòng fact tại orchestrator (`rebuildFact`) theo nguồn staging (STAGES.forwarder / 'Overhead' / 'POB (Pay on behalf)'); `report_` gom `usdBySrc`/`cntBySrc` theo `_src`. `_src` **không** thuộc `FACT_HEADERS` → `writeFact_` bỏ qua, không ghi ra tab fact (an toàn, không rò).
  - Test `test/run_tests.cjs` **50/50 PASS** (+1 assert per-source USD). Mock xác minh: `VVMV: 3 dòng · $192 (raw 4, bỏ 1 dòng Amount=0)` — đúng ý đồ tách bạch.
- **📁 Files changed:** `backend/Transform.gs` (orchestrator tag `_src` + rewrite `report_`), `test/run_tests.cjs` (+1 assert), EVD regen.
- **🧭 Decision:** đối chiếu baseline là **HAI lỗi độc lập** — (①) **tỷ giá** (26452 vs Excel, ảnh hưởng $ đồng đều mọi nguồn VND non-EI; dự đoán rate Excel ~26008) và (②) **−26 dòng** (không do tỷ giá — nghi filter `Transform.gs:82` bỏ dòng phí 0đ, hoặc snapshot raw ≠ Excel). Per-source $ cho phép tách: tỷ lệ `live_$/excel_$` **đồng đều** → thuần tỷ giá; nguồn lệch tỷ lệ → mất dòng/sai map. EI dùng rate per-row → tỷ lệ ≈1,0 làm mốc đối chứng.
- **🚧 Blocker / cần đối chiếu:** vẫn như handover-2 — **cần user redeploy (New version) + chạy lại `rebuildFact`** để đọc bảng "Theo nguồn" mới trong Logger; POB sheet 18 còn rỗng.
- **➡️ Next step:** (1) redeploy + rebuildFact → đọc log per-source; (2) tính `live_$/excel_$` per nguồn để chốt rate Excel; (3) cộng cột "bỏ K dòng Amount=0" — nếu ≈26 thì thủ phạm là filter `Amount=0`, quyết fact Excel có giữ dòng 0đ không.
- **⚠️ Regression risk:** thấp — chỉ thêm field `_src` (bị `writeFact_` bỏ) + thêm dòng log; không đổi số fact/tổng. `report_` giữ nguyên 5 dòng đầu (Full/POB/TỔNG/Route) → frontend & assert cũ không đổi.

## 2026-07-25 (handover-2) — Fix setupSheets "cột đã nhập" + DEPLOY LIVE + xác minh endpoint thật

- **✅ Task completed:**
  - Root-fix `Setup.gs::ensureTab_` — **chỉ** ép Plain text khi tab **vừa tạo/rỗng**; tab đã có data (đã dán / đã chuyển thành Google Sheets **Table** / có column type) → **bỏ qua** `setNumberFormat` nên hết lỗi *"Bạn không thể đặt định dạng số của các ô trong một cột đã nhập."* User xác nhận **`setupSheets` PASS**. (Chẩn đoán: stack trỏ `Setup.gs:82` = dòng bản CŨ → user chạy bản cũ; đã dán bản mới.)
  - **User đã chạy `rebuildFact()` + Deploy New version (link giữ nguyên).** GAS live = **v0.3.0**.
  - **Xác minh endpoint thật (curl):** `?action=ping`→v0.3.0 ✅ · `?action=meta`→`rowCount 1454 · totalUsd $43.322,6 (Full) · pobUsd 0 · routes=[AGIGA,AIC,EFI,FORD,LUCID,MRO,OEM,Other,PURE]` (⇒ **Route ×3 chạy đúng trên data thật**) · `?action=pob`→`{ok, count:0}` (endpoint sống; **sheet 18 rỗng** nên chưa có POB).
- **📁 Files changed:** `backend/Setup.gs` (commit `d65e068`); docs handover.
- **🧭 Decision:** `setupSheets` idempotent an toàn với tab đã có data / Table — **không (re)định dạng** cột đã có dữ liệu (`rebuildFact` tự set text cột khóa A/C/D/E của fact).
- **🚧 Blocker / cần đối chiếu:**
  - ⚠️ **Tổng lệch baseline:** live **1454 dòng/$43.322,6** vs Excel target **1480/$44.062** (~−1,7% tiền, −26 dòng). Nghi vấn: **tỷ giá Sheets = 26452** (nếu Excel dùng rate thấp hơn → USD cao hơn, khớp gần hết phần $); −26 dòng có thể do **raw data hiện tại ≠ snapshot Excel**. **User cần đối chiếu** per-source (log rebuildFact) + rate 23_Map_ExchangeRate.
  - **POB chưa có dữ liệu:** sheet `18_ImportPOB_Raw` rỗng → dán data POB rồi chạy lại `rebuildFact` mới thấy dòng Pay-on-behalf + POB detail trên web.
- **➡️ Next step:** (1) đối chiếu 1454/$43.322,6: xem log per-source + rate 26452; (2) dán data POB sheet 18 → rebuildFact; (3) mở web (dữ liệu thật) kiểm trang Logistics record + POB detail.
- **⚠️ Regression risk:** tab đã có data KHÔNG được (re)ép Plain text → mã dài (B/L, CDS) có thể hiện scientific nếu cột chưa set Plain text (cosmetic; fact tự set). Muốn ép tab raw: **Table → Convert to range** rồi Format → Số → Văn bản thuần.

## 2026-07-25 (handover) — Sửa getMeta Full/POB + ghi TECH_DEBT

> Delta nhỏ sau block chính cùng ngày (Phase A+B đã push `993bb6f`).

- **✅ Task completed:** `getMeta()` tách **`totalUsd` = Full (loại POB)** để đối chiếu baseline **$44.062**, thêm `pobUsd` + `grandTotalUsd` + `fullCount`/`pobCount` (QĐ-51 nay áp cả tầng meta, không chỉ report.js). Cập nhật `TECH_DEBT.md` (resolve TD-03/TD-14; thêm TD-17..TD-20). Test **49/49 PASS** (thêm 3 assert getMeta). EVD regen.
- **📁 Files changed:** `backend/DataService.gs` (getMeta), `test/run_tests.cjs` (+3 assert), `AI_CONTEXT/TECH_DEBT.md`, EVD/*.
- **🧭 Decision:** QĐ-51 mở rộng — mọi API/lớp trả "tổng Full" đều **loại `Pay on behalf`**; POB luôn là field tách.
- **🚧 Blocker:** vẫn chờ user dán GS mới + `rebuildFact()` + **Deploy New version** (TD-19). `?action=meta` bản cũ trả `totalUsd`=all; bản mới trả Full — nhắc user đối chiếu bằng **bản đã deploy lại**.
- **➡️ Next step:** như block chính — chạy thật rebuildFact (đối chiếu `meta.totalUsd`≈$44.062 + `meta.pobUsd`), deploy, so bố cục với Excel.
- **⚠️ Regression risk:** đổi **ngữ nghĩa `getMeta.totalUsd`** (all → Full). Frontend không hiển thị field này trong report (chỉ dùng months/forwarders/routes cho dropdown), nên an toàn; nhưng ai từng curl `?action=meta` so tổng cần biết nay là Full (POB ở `pobUsd`).

## 2026-07-25 — Phase A hoàn chỉnh (Route/Loại hàng/POB) + Phase B trang Logistics record

### ✅ Task completed
- **Phase A** (`backend/Transform.gs`): thêm **Route ×3** (`buildRouteExport_` sheet 16 khóa B/L=Tracking#; `buildRouteWTA_` winner-take-all sheet 17 theo CDS & BL, hòa→Trị giá NT; ưu tiên UpdateManual→Export→CDS→BL→Third party 'Other'→null), **Loại hàng ×2** (`loadMapLoaiHinh_` 26 + `buildLoaiHang_` sheet 17, xung đột→null, chỉ hàng nhập), **UpdateManual** (`buildUpdateManual_`, tab 25 optional), **POB** (`stagePOB_` sheet 18 → nhãn `Pay on behalf`, VND→USD tỷ giá tháng). `commonTier_(r,rate,dims)` gắn Route/Loại hàng. `report_` tách **Full vs POB** (giữ verify $44.062).
- **Phase B web:** `report.js` (`lrMonthlySeries/lrImport/lrExport/lrOverhead` — **khử trùng** CW/B-L/CDS theo lô; QĐ-51 lọc POB khỏi dashboard/forwarder/route); `views.js` (`logisticsRecord` bảng phân cấp tháng-cột + `pobTable`); `app.js` (nav `logistics-record` + 2 bar chart + `loadPOB`); `index.html` nav; `api.js`/`routes.js` `pob()`; `Code.gs`/`DataService.gs` `?action=pob` (`getPOB` đọc 18 lấy quote-customer/remark).
- **Test:** `test/run_tests.cjs` (Node + Spreadsheet giả) — **46/46 PASS**: rebuildFact end-to-end (Route=PURE winner-take-all, Loại hàng=Material, Third party→Other, Overhead→null, POB $=VND/rate, report tách Full/POB), unit (normRoute_/reduceWTA_ tie-break/routeFor_ ưu tiên), report.js lr* (weight khử trùng 120≠240, POB tách khỏi Full), views render. **Xác minh trình duyệt** bằng `EVD/preview_live.html` (mock): 4+1 trang render, chart OK, POB detail 2 dòng, Dashboard total = Full ($17.510, loại POB).
- **EVD:** `evidence_phaseAB_*.txt`, `fact_sample_*.json`, `preview_live.html`, `preview_logistics_record.html`, `screenshot_logistics_record.jpg`.

### 🧭 Decision
- **QĐ-51:** POB vào fact (nhãn `Pay on behalf`) nhưng **KHÔNG** tính vào Full logistics của Dashboard/Báo cáo CEO/Route (3 trang lọc bỏ) — giữ baseline $44.062; trang Logistics record hiện Full/POB/Total riêng (§12c).
- Ground truth Route/Loại hàng/POB = `context/11_BUSINESS_RULES.md` §6/§7/§9 + header raw thật trong `backend/Setup.gs` (16/17/18/26).

### 🚧 Blocker / lưu ý
- **Người dùng phải:** dán `backend/*.gs` mới vào Apps Script → chạy `rebuildFact()` → đối chiếu log **Full ≈ $44.062** + dòng POB; kiểm "Route/Loại hàng có giá trị" > 0. **Deploy → New version** để `?action=pob` sống (nếu không, POB detail trên web báo lỗi tải).
- Tab **25_UpdateManual** vẫn optional (chưa có → bỏ qua an toàn). Sheet 18 cần có dữ liệu POB thì mới ra dòng.
- 🔴 Nợ bảo mật **TD-11** vẫn nguyên.

### ➡️ Next step
1. Người dùng chạy `rebuildFact()` bản mới + deploy New version → đối chiếu Full/POB + Route/Loại hàng.
2. So bố cục trang **Logistics record** với ảnh báo cáo Excel thật; chỉnh nhãn/thứ tự dự án nếu cần.
3. (Tùy) tinh chỉnh chart nhiều tháng, làm tròn USD.

### ⚠️ Regression risk
- `commonTier_` đổi chữ ký (thêm `dims`) — chỉ gọi từ `rebuildFact`; đã test.
- `report.js` dashboard/forwarder/route nay **lọc POB** — nếu fact chưa có dòng POB thì không đổi số; khi có POB, số 3 trang này KHÔNG đổi (đúng QĐ-51), chỉ trang Logistics record cộng POB.
- `?action=pob` đọc sheet 18 trực tiếp — cần deploy New version; bản cũ trả 'Unknown action'.

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
