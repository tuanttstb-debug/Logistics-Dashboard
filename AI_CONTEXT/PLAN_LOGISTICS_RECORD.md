# PLAN — Chức năng "Logistics record" cho Dashboard

> Nghiên cứu & plan 2026-07-22. Nguồn tham chiếu báo cáo: `data/Logistics record JUN 2026.xlsx`, sheet **"Logistics record"** (bản tính tay AS-IS). Logic engine: `context/10_MODEL_SPEC.md`, `11_BUSINESS_RULES.md`.

## Context / mục tiêu
Dựng một trang **"Logistics record"** trong dashboard **bám cấu trúc bảng + kiểu biểu đồ** của báo cáo CEO Excel, do **fact của ta sinh số** (sẽ lệch bản tay: tỷ giá/điều chỉnh khác — chấp nhận).

Báo cáo Excel gồm: chuỗi tháng (Full/POB/Total) · bảng Import (Raw materials / Equipment) · bảng Export (theo dự án) · 2 bar chart (Import 3 series, Export theo dự án) · bảng chi tiết Pay-on-behalf.

## Quyết định đã chốt (phỏng vấn 2026-07-22)
- **QĐ-45:** Hoàn thiện **pipeline trước** (VVMV/Dolphin/EI + Route + Loại hàng + POB) rồi mới dựng view.
- **QĐ-46:** Chuỗi thời gian **chỉ hiện tháng thực có** trong fact (nay 1 tháng, lớn dần). Không backfill tay.
- **QĐ-47:** Dựng **cả 4 khối** (chuỗi tháng · Import · Export · POB detail) + 2 bar chart.
- **QĐ-48:** **POB = sheet `18_ImportPOB_Raw`**, đưa vào fact như nhãn `Import/Export='Pay on behalf'` (tính vào tổng; report tách Full vs POB vs Total qua nhãn).
- **QĐ-49:** Report **"Customs & Trucking fees" = chỉ nhóm `Customs` + `Trucking`**. `Origin LCC`/`Dest LCC` → **dòng riêng "Local charges (LCC)"** (Subtotal = Freight + Customs&Trucking + LCC = tổng thật).
- **QĐ-50:** Cột AMOUNT sheet 18 (POB) = **VND** → quy USD theo `USD_Rate` tháng.
- **Thứ tự Phase A:** VVMV → Dolphin → EI → Route → Loại hàng → POB (validate tổng sau mỗi bước).

## Ánh xạ report → fact
| Dòng report | Từ fact |
|---|---|
| Full logistics cost (Unigen pays) | Σ `Amount_USD` (`Import/Export` ≠ 'Pay on behalf') theo tháng |
| Pay on behalf of others | Σ `Amount_USD` (`Import/Export` = 'Pay on behalf') |
| Total | Σ tất cả |
| Import → Raw materials / Equipment | `Import/Export`='Import', nhóm theo `Loại hàng` (Material / Equipment & Toolings) |
| Export → theo dự án | `Import/Export`='Export', nhóm theo `Route` |
| Freight | `Standard Cost`='Freight' |
| Customs & Trucking fees | `Standard Cost` ∈ {Customs, Trucking} |
| Local charges (LCC) *(thêm)* | `Standard Cost` ∈ {Origin LCC, Dest LCC} |
| Weight (KG) | Σ `CW` |
| Shipment No# | đếm `B/L` phân biệt |
| Declaration No# | đếm `CDS NO.` phân biệt |
| Customs fees in Month / Others | `Import/Export`='Overhead' |
| POB detail (Tracking/INV, Consignee, Amount, Quote customer) | sheet 18 (đọc trực tiếp cho cột quote/remark) |

---

## PHASE A — Hoàn thiện GAS pipeline (`backend/Transform.gs`)

Cắm thêm staging + tầng chung; giữ đúng **bộ cột §6** cho từng nguồn (khuôn đã có trong `COURIER_SOURCES`).

**A1. Staging VVMV** (§5/§6/§8/§10/§11) — nguồn lớn nhất:
- Cột phí = header ∩ Map_Cost(VVMV). Keep: B/L(HBL No.), INVOICE NO.(Invoice No), CDS NO.(Custom No), Shipper, Destination, Mode, CW(Kgs), CBM.
- **B/L §8:** Import→HBL; Local→CDS No; Export→bridge invoice→Tracking# (đọc `16_ExportMgmt_Raw`) + chuẩn hóa invoice (§11 bỏ `UHAN-`, cắt `-N`).
- Import/Export: tiền tố tờ khai (1=Import, 3=Export). Mode chuẩn từ Mode.

**A2. Staging Dolphin** (§6): keep B/L(HBL no), INVOICE NO., CDS NO., Shipper, Mode, CW, CBM. Import/Export theo tờ khai. Mode gõ tay (đọc như có).

**A3. Staging EI** (§6/§2): keep B/L(MBL/HBL), Mode(type), CW, CBM, Currency, Exchange Rate. **Amount_USD riêng:** USD→giữ; VND→ /Exchange Rate (lô) cho PHÍ CHỨNG TỪ/PHÍ LÀM HÀNG. Import/Export theo chữ import/export trong type.

**A4. Route ×3** (§6) — thêm bảng cần lên Sheets: `16` (đã có), `17_CustomsDetail_Raw` (đã có), `30_Route_byDeclaration` (hoặc tự tính winner-take-all trong GAS từ sheet 17):
- `Route_Export`: sheet 16 key B/L=Tracking#, chuẩn hóa (Transfer→Other, x/trống→null).
- `Route_byCDS`: sheet 17 winner-take-all (Σ Qty lớn nhất/tờ khai, hòa→Trị giá NT lớn nhất) → map theo CDS NO.
- `Route_byBL`: theo B/L.
- **Ưu tiên:** Route_Export → Route_CDS → Route_BL → (Third party→'Other') → null. Overhead→null.

**A5. Loại hàng ×2** (§7): sheet 17 `Mã loại hình` → `26_Map_LoaiHinh` (E11/E15→Material; E13/G13/G51→Equipment). by CDS rồi by BL. Chỉ hàng nhập.

**A6. POB** (QĐ-48): đọc `18_ImportPOB_Raw` → fact rows `Import/Export='Pay on behalf'`, `Amount`, `Route`, `B/L`, `INVOICE NO.`, Shipper. (Cột Amount quote customer/remark KHÔNG vào 24-cột fact → phục vụ POB detail qua action riêng.)

**Đối chiếu Phase A:** tổng đủ 7 nguồn ≈ **1.480 dòng / $44.062** (fact Excel). QC log phí chưa map / route lạ.

---

## PHASE B — Trang "Logistics record" (web)

**B1. Điều hướng:** thêm nav item "📋 Logistics record" (`index.html` sidebar + `app.js` render).

**B2. `report.js` — hàm tổng hợp** (đọc toàn bộ fact, mọi tháng):
- `lrMonthlySeries()` → [{month, full, pob, total}] (theo nhãn Pay on behalf).
- `lrImport()` → theo tháng × {Raw materials, Equipment}: {freight, customsTrucking, lcc, weight, shipments, declarations, subtotal} + Other + Subtotal Import.
- `lrExport()` → theo tháng × dự án (Route): {freight, customsTrucking, lcc, weight, subtotal} + Subtotal Export.
- `lrOverhead()` → Customs fees in Month / Others.

**B3. `views.js` — bảng phân cấp** giống Excel (cột = tháng thực có; hàng = chỉ tiêu phân cấp Import/Export). Dùng `report.css` sẵn có.

**B4. Charts** (`app.js`, Chart.js bar):
- Chart Import: 3 series (Raw materials / Equipment / Other) theo tháng.
- Chart Export: series theo dự án theo tháng.
- 1 tháng → 1 cụm cột; lớn dần khi thêm tháng.

**B5. POB detail:** action GAS mới `?action=pob` đọc `18_ImportPOB_Raw` (Tracking/INV, Consignee/Shipper, Amount, Quote customer, Remark) → bảng ở cuối trang. (Web đọc thêm; không đổi luồng fact.)
- `api.js`: thêm `Api.pob()`; `routes.js`: thêm route.

---

## Verification
1. `node --check` toàn bộ .gs + .js.
2. Phase A: chạy `rebuildFact()` → đối chiếu tổng 7 nguồn ≈ 1.480/$44.062; kiểm Route/Loại hàng có giá trị (không còn null hàng loạt); `diagMaps`/QC log sạch.
3. Phase B: mở trang Logistics record → so bố cục bảng + 2 chart với ảnh báo cáo Excel; kiểm Full+POB=Total; Subtotal=Freight+Customs&Trucking+LCC.
4. Commit + push từng phase (lệ handover).

## Trạng thái: PLAN CHỐT — sẵn sàng code Phase A (A1 VVMV) khi có go-ahead.
