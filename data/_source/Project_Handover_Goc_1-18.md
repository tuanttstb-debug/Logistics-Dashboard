# TÀI LIỆU BÀN GIAO DỰ ÁN — HỆ THỐNG BÁO CÁO LOGISTICS COST
### (Excel + Power Query) — Bản bàn giao chính thức để chuyển sang phiên làm việc mới

> **Cách dùng tài liệu này:** Dán toàn bộ nội dung vào đầu một đoạn chat mới với Claude. Sau đó Claude có thể tiếp tục dự án ngay mà không cần hỏi lại các vấn đề đã thống nhất. Đọc kỹ **Phần 16, 17, 18** trước khi bắt tay, vì đó là các nguyên tắc và phong cách bắt buộc.

---

## 1. TỔNG QUAN DỰ ÁN

- **Tên dự án:** Hệ thống Báo cáo Chi phí Logistics (Logistics Cost) — tự động hóa bằng Excel + Power Query.
- **Mục tiêu cuối cùng:** Rút thời gian làm báo cáo chi phí logistics hằng tháng từ **~4 tiếng xuống còn ~30 phút**, chạy **100% trong Excel** (không dùng SQL Server, Power BI, web app, hệ thống IT ngoài). Báo cáo phục vụ **Tổng Giám đốc (CEO)** ra quyết định.
- **Vấn đề đang giải quyết:** Mỗi tháng phải gộp thủ công debit (giấy báo nợ) của nhiều forwarder có cấu trúc khác nhau, đổi tên cột, gom nhóm chi phí bằng SUMIF, tra cứu B/L/Route, ghép lô bị tách — tốn thời gian, dễ sai, phụ thuộc người làm.
- **Người sử dụng / chủ hệ thống:** Một nhân viên logistics (người dùng trong dự án này) — **giỏi nghiệp vụ logistics + Excel, nhưng MỚI học Power Query**. Người này phải tự **bảo trì và mở rộng hệ thống trong ~5 năm** mà không phụ thuộc ai.
- **Phạm vi dự án:**
  - Chuẩn hóa và gộp debit của **6 forwarder** thành một kho dữ liệu dọc thống nhất.
  - Quy đổi mọi chi phí về **USD**.
  - Phân loại chi phí về **5 nhóm chuẩn**.
  - (Kế tiếp) Gắn Route (dự án/khách hàng), chuẩn hóa Mode, dựng báo cáo ngang cho CEO + Dashboard.
- **Ngoài phạm vi:**
  - Không dùng SQL, Power BI, Access, web app, hay bất kỳ hệ thống IT nào ngoài Excel.
  - Không tự động hóa khâu **nhập tay Dự án (Route)** vào báo cáo tờ khai — con người vẫn điền Dự án cho từng mã hàng; máy chỉ gom và chọn "quán quân".
  - Không xây phần kế toán/hạch toán; chỉ là báo cáo chi phí quản trị.

---

## 2. BỐI CẢNH NGHIỆP VỤ

**Công ty** nhập/xuất hàng (điện tử) và thuê nhiều **forwarder** (công ty giao nhận) lo các dịch vụ logistics: cước vận chuyển (freight), phí địa phương đầu đi (Origin Local Charge), phí địa phương đầu đến (Destination Local Charge), vận tải nội địa (Trucking), thủ tục hải quan (Customs).

**Nguồn dữ liệu hằng tháng:**
1. **Debit (giấy báo nợ)** từ mỗi forwarder — mỗi forwarder một file Excel, **cấu trúc/tên cột/tên phí HOÀN TOÀN KHÁC NHAU**. Đây là đầu vào chính.
2. **Báo cáo chi tiết tờ khai hải quan** — dùng để xác định **Route** (mỗi lô thuộc dự án/khách hàng nào: PURE, EFI, AGIGA…). Con người điền tay cột Dự án cho từng dòng mã hàng.
3. **Export Management** (bảng Invoice ↔ B/L cho hàng xuất) — để tra B/L khi debit chỉ có Invoice.
4. **Tỷ giá USD** theo tháng.

**Các forwarder (6):**
- **DHL** — chuyển phát nhanh (courier). Debit VND.
- **FedEx Export** — courier, hàng xuất. Debit VND.
- **FedEx Import** — courier, hàng nhập. Debit VND.
- **Dolphin** — giao nhận (air/sea import/export). Debit VND.
- **VVMV** — giao nhận, có cả Import/Local/Export trong một bảng. Debit VND.
- **EI (Expeditors)** — giao nhận air import. **Debit chủ yếu USD** (2 phí VND).

**Shipment (lô hàng):** Một lô có thể đi qua **nhiều forwarder** cho các dịch vụ khác nhau (freight một bên, trucking bên khác, customs bên khác…), nên **một lô sinh nhiều dòng chi phí ở nhiều forwarder**. Khóa định danh lô = **B/L** (số vận đơn); với hàng Local (không có B/L) dùng **số tờ khai (CDS No)**.

**Debit:** mỗi dòng là một lô + nhiều cột chi phí nằm **ngang**. Một số forwarder có khối "Pay on behalf" (forwarder ứng tiền trả cảng/kho, đòi lại công ty). Cuối bảng thường có dòng Total/Grand Total và có thể có dòng overhead ("Lệ phí hải quan") không gắn lô.

**Báo cáo Logistics (đầu ra cuối):** báo cáo ngang cho CEO, tách chi phí theo nhóm (Freight/Origin LCC/Dest LCC/Trucking/Customs), theo forwarder, theo Route (dự án), tách Air/Sea, quy về USD. Có tính cả VAT.

**Cách dữ liệu di chuyển:**
Debit từng forwarder → dán vào sheet Raw tương ứng → Power Query chuẩn hóa từng forwarder (query `stg_*`) → gộp (Append) vào kho dọc `40_FACT_CostLines` → (tầng chung) quy đổi USD, gắn Route, chuẩn hóa Mode → sinh báo cáo ngang (sheet 50) + Dashboard (sheet 70).

---

## 3. QUY TRÌNH HIỆN TẠI (AS-IS) — cách làm cũ (thủ công)

1. Nhận 6 file debit + báo cáo tờ khai + Export Management + tỷ giá.
2. Với **mỗi forwarder**: mở debit, xóa dòng Total, tự nhận diện cột chi phí, dùng **SUMIF** gom từng nhóm chi phí (mỗi forwarder một bộ công thức riêng vì tên/cột khác nhau).
3. Tự **đổi tên** cột/phí về chuẩn của báo cáo, tự **canh không quét nhầm cột VAT/Total**.
4. Tra **B/L** cho hàng xuất (VLOOKUP từ Export Management vì debit chỉ có Invoice).
5. Xác định **Route** cho từng lô (điền Dự án tay ở báo cáo tờ khai, rồi phân bổ).
6. **Ghép lô bị tách** (một lô nằm ở nhiều forwarder) lại.
7. Xử **chi hộ** (pay on behalf) — khoản trả hộ và thu lại.
8. Quy đổi VND→USD.
9. Ráp tất cả thành báo cáo ngang cho CEO bằng công thức Excel.

→ Toàn bộ ~4 tiếng/tháng, lặp lại mỗi tháng, dễ sai, khó bàn giao.

*(Ghi chú: người dùng đã từng làm việc với ChatGPT dựng data dictionary + mapping trước đó; trong dự án này đã đánh giá lại độc lập.)*

---

## 4. NHỮNG VẤN ĐỀ CỦA HỆ THỐNG CŨ

| # | Vấn đề | Nguyên nhân | Ảnh hưởng | Ví dụ | Ưu tiên |
|---|---|---|---|---|---|
| 1 | Mỗi forwarder một bộ công thức riêng | Debit khác cấu trúc/tên | Tốn thời gian, khó bảo trì | SUMIF DHL khác VVMV | Cao |
| 2 | Gom chi phí bằng SUMIF thủ công | Không có lớp chuẩn hóa | Dễ quét nhầm/sót cột (VAT, Total) | Quét nhầm cột Total → tính trùng | Cao |
| 3 | Tra B/L, Route thủ công | Không có bảng tra tự động | Chậm, dễ sai | VLOOKUP tay từng lô xuất | Cao |
| 4 | Ghép lô tách qua nhiều forwarder | Dữ liệu rời rạc | Sót/nhân chi phí | 1 lô ở 3 forwarder | Trung |
| 5 | Phụ thuộc người làm | Quy trình trong đầu người | Nghỉ việc là tắc | — | Cao |
| 6 | Không có kho dữ liệu tái sử dụng | Làm thẳng ra báo cáo | Không phân tích lại được | Muốn xem theo Route phải làm lại | Trung |

---

## 5. MỤC TIÊU CỦA HỆ THỐNG MỚI

- Mỗi tháng chỉ cần: **dán 6 debit vào 6 sheet Raw + điền vài ô khai báo (tháng, tỷ giá) + bấm Refresh All** → báo cáo tự cập nhật. Mục tiêu ~30 phút.
- **Chuẩn hóa một lần, chạy mãi:** mọi luật (đổi tên cột, gom phí, quy đổi) được "dạy" cho Power Query một lần; tháng sau máy tự chạy lại.
- **Lưu dữ liệu dạng DỌC** (1 dòng = 1 khoản phí) → từ kho này sinh mọi báo cáo/dashboard.
- **Tự bảo trì:** người dùng hiểu từng bước, thêm forwarder/sửa phí chỉ bằng thêm dòng vào bảng từ điển, không đụng công thức phức tạp.
- Khác biệt cốt lõi so với cũ: thay **SUMIF rải rác** bằng **một kho dọc + từ điển ánh xạ**; thay **tra tay** bằng **merge tự động**.

---

## 6. KIẾN TRÚC GIẢI PHÁP ĐÃ THỐNG NHẤT ("Architecture B")

**Nguyên tắc lõi:** *Lưu dữ liệu dạng DỌC (long format) — mỗi dòng = 1 khoản phí — ở `40_FACT_CostLines`; sinh báo cáo NGANG (wide) cho CEO sau.*

**Luồng dữ liệu:**
```
[6 Debit thô]  →  dán vào  →  [Sheet Raw 10–16]
                                   │  (mỗi forwarder 1 query)
                                   ▼
        stg_DHL, stg_FedExExp, stg_FedExImp, stg_Dolphin, stg_VVMV, stg_EI   (connection-only)
                                   │  Append (Table.Combine)
                                   ▼
                        [fact_CostLines]  →  đổ ra  →  [Sheet 40_FACT_CostLines]  (KHO DỌC)
                                   │  (tầng chung — áp 1 lần cho mọi forwarder)
                                   │  • lọc Amount ≠ 0
                                   │  • merge tỷ giá + tính Amount_USD
                                   │  • (kế tiếp) chuẩn hóa Mode, gắn Route, overhead
                                   ▼
                     [Sheet 50 — báo cáo NGANG cho CEO]  +  [Sheet 70 — Dashboard]
```

**Khung xử lý mỗi forwarder (staging `stg_[tên]`) — LUÔN theo thứ tự này:**
1. Nạp Raw (From Table/Range). Xóa bước "Changed Type" tự sinh.
2. (Với forwarder tiêu đề nhiều dòng) đã chuẩn hóa tiêu đề sạch ở Raw trước khi nạp.
3. Lọc dòng rác (Total/Grand Total/overhead).
4. **Lật dọc (Unpivot)** các cột chi phí → 2 cột `Original Cost Name` + `Amount`.
5. Đổi tên `Attribute→Original Cost Name`, `Value→Amount`.
6. **Thêm cột `Forwarder` (TRƯỚC merge)** — bắt buộc.
7. **Merge 2 cột `(Original Cost Name + Forwarder)`** với `Map_Cost` → expand `Standard Cost` + `FWD Column`.
8. Thêm `Month` (đọc ô khai báo tháng).
9. Ép các cột mã (B/L, CDS No) về **Text**.
10. **Choose Columns** — giữ đúng bộ cột chuẩn.
11. **Connection-only**.
12. **Append** vào `fact_CostLines`.

**Nâng cấp tương lai:** có thể chuyển sang Power Pivot (Data Model) nếu cần, nhưng hiện giữ Power Query + Excel table cho đơn giản.

---

## 7. CÁC BẢNG DỮ LIỆU (SHEET & QUERY)

**File hệ thống:** `Logistics_System.xlsx`.

### Sheet
| Sheet | Mục đích | Ghi chú |
|---|---|---|
| `00_HƯỚNG DẪN` | Trang hướng dẫn + **ô khai báo tháng B2** (đặt tên `ThangBaoCao`, Text `2026-06`) | Quy trình hằng tháng ghi ở đây |
| `10_DHL_Raw` | Dán debit DHL | Tiêu đề 1 dòng sẵn |
| `11_FedExExp_Raw` | Dán debit FedEx Export | Bỏ đầu trang khi dán |
| `12_FedExImp_Raw` | Dán debit FedEx Import | Có cột STT |
| `13_EI_Raw` | Dán debit EI | Tiêu đề sạch tự gõ |
| `14_VVMV_Raw` | Dán debit VVMV | Tiêu đề sạch tự gõ |
| `15_Dolphin_Raw` | Dán debit Dolphin | Tiêu đề sạch tự gõ |
| `16_ExportMgmt_Raw` | Export Management (Invoice ↔ B/L) | Cột `INVOICE NO.` và `Tracking#` |
| `17_CustomsDetail_Raw` | Báo cáo chi tiết tờ khai (để tính Route) | Con người điền Dự án |
| `18_POB_Import_Raw` | Chi hộ hàng nhập (case-by-case, người dùng thêm) | Gắn theo B/L |
| `20_Map_Forwarder` | Bản đồ forwarder (tiền tệ VND/USD + ghi chú) | Tham chiếu |
| `21_Map_Column` | Bản đồ đổi tên cột | **Chỉ dùng THAM CHIẾU, không tự động hóa** (xem QĐ) |
| `22_Map_Cost` | **★ TỪ ĐIỂN TÊN PHÍ** (quan trọng nhất) | Xem Phần 8 |
| `23_Map_ExchangeRate` | Tỷ giá USD theo tháng | Cột `Month, USD_Rate, Note` |
| `24_List_Project` | Danh sách dự án hợp lệ (kiểm chính tả Route) | Chưa dùng nhiều |
| `30_Route_byDeclaration` | (Chưa dựng) Route winner-take-all từ tờ khai | — |
| `40_FACT_CostLines` | **KHO DỌC** — đầu ra chính | Do `fact_CostLines` đổ ra |
| `50_MERGE_SHIPMENT` | (Chưa dựng) Báo cáo ngang cho CEO | — |
| `60_QC_Errors` | (Chưa dựng) Lưới an toàn bắt tên lạ | — |
| `70_Dashboard` | (Chưa dựng) Dashboard | — |

### Query (Power Query)
| Query | Loại | Vai trò |
|---|---|---|
| `stg_DHL`, `stg_FedExExp`, `stg_FedExImp`, `stg_Dolphin`, `stg_VVMV`, `stg_EI` | Connection-only | Chuẩn hóa từng forwarder |
| `Map_Cost` | Connection-only | Từ điển tên phí (để merge) |
| `ThangBaoCao` | Connection-only | Đọc ô tháng B2 (đã xóa Changed Type để không thành ngày) |
| `ExportMgmt` | Connection-only | Tra B/L cho VVMV xuất (hiện VVMV đã tự điền B/L nên tạm không dùng) |
| `Map_ExchangeRate` | Connection-only | Tỷ giá chung tháng |
| `fact_CostLines` | Load ra sheet 40 | Append tất cả stg_* + tầng chung (lọc 0, quy đổi USD…) |

**Khóa chính / liên kết:**
- Khóa lô = **B/L**; Local = **CDS No**; (VVMV Local hiện dùng CDS No).
- Merge phí: khóa **kép** `(Original Cost Name + Forwarder)`.
- Quy đổi: liên kết `Month` với `Map_ExchangeRate`.
- Route (kế tiếp): VVMV/Dolphin qua `CDS No`; EI/FedEx/DHL Import qua `B/L`, Export qua `Invoice`.

---

## 8. DATA DICTIONARY

### Bộ cột chuẩn của kho `fact_CostLines` (đã mở rộng dần)
Bộ tối thiểu ban đầu là 12 cột; sau các yêu cầu Route/Mode/USD đã mở rộng. **Bộ chuẩn hiện tại:**

| Cột chuẩn | Ý nghĩa | Nguồn | Quy tắc |
|---|---|---|---|
| `Month` | Tháng báo cáo (Text `YYYY-MM`) | Ô `ThangBaoCao` (B2 sheet 00) | Text, không để thành ngày |
| `Forwarder` | Tên forwarder | Gán cứng trong mỗi stg_* | Đúng: `DHL`, `FedEx Export`, `FedEx Import`, `Dolphin`, `VVMV`, `EI` |
| `B/L` | Khóa lô (số vận đơn) | Debit (AWB/HBL/MBL). Local=CDS No; VVMV Export=B/L tự điền | **Text** (tránh số khoa học) |
| `Invoice No` | Số hóa đơn | Debit | Giữ ở forwarder có |
| `CDS No` | Số tờ khai (chìa Route) | Debit VVMV/Dolphin | **Text**; VVMV/Dolphin có |
| `Shipper` | Người gửi | Debit | |
| `Consignee` | Người nhận | Debit (DHL/FedEx có) | Thiếu ở Dolphin/VVMV → Append bù trống |
| `Origin` | Nơi đi | Debit | Thiếu ở vài forwarder → bù trống |
| `Destination` | Nơi đến | Debit | |
| `Mode` | Phương thức (thô) | Debit (`type`, LCL/AIR/CPN/TC…) | **Chưa chuẩn hóa** (xem Phần 15) |
| `CW` | Trọng lượng tính cước | Debit (CHRGBL WGHT/Kgs/CW) | |
| `CBM` | Thể tích | Debit (VVMV/EI/Dolphin) | Cho hàng sea |
| `Original Cost Name` | Tên phí gốc trên debit | Sau Unpivot | Khóa merge với Map_Cost |
| `Amount` | Số tiền gốc (VND hoặc USD) | Sau Unpivot | Giữ nguyên tệ gốc |
| `Currency` | Đơn vị tiền của dòng | EI: cột điều kiện theo tên phí; khác: suy theo Forwarder | EI có cả USD & VND |
| `Exchange Rate` | Tỷ giá riêng từng dòng (chỉ EI) | Debit EI | Forwarder khác để trống |
| `USD_Rate` | Tỷ giá chung tháng | Merge từ `Map_ExchangeRate` theo Month | |
| `Amount_USD` | **Số tiền đã quy đổi USD** | Công thức điều kiện (Phần 10) | Kết quả cuối để báo cáo |
| `Standard Cost` | Nhóm phí chuẩn | Merge từ `Map_Cost` | 1 trong 5 nhóm |
| `FWD Column` | Cột đích trên báo cáo | Merge từ `Map_Cost` | ví dụ "Freight FWD" |

### `22_Map_Cost` (từ điển tên phí) — cột hiện tại
`Forwarder | Original Cost Name | Standard Cost | FWD Column | Notes`
(đã **BỎ** `Include in Total` và `Pay on Behalf Eligible` — xem QĐ Phần 11.)

### 5 nhóm chi phí chuẩn (`Standard Cost`)
`Freight` · `Origin LCC` · `Dest LCC` · `Trucking` · `Customs` (+ overhead riêng).

---

## 9. QUY TẮC CHUẨN HÓA DỮ LIỆU

- **Tên cột chuẩn:** mọi forwarder phải đổi về **cùng một bộ tên** (`B/L`, `CW`, `Origin`, `Destination`, `CBM`…). Power Query **phân biệt HOA/thường và KHOẢNG TRẮNG** → tên phải khớp **từng ký tự** (nếu không, Append xé thành 2 cột). Đổi tên **trong query** (với forwarder tiêu đề 1 dòng: DHL/FedEx), hoặc **gõ tiêu đề sạch ở Raw** (với forwarder tiêu đề nhiều dòng: Dolphin/VVMV/EI).
- **Chuẩn hóa tên phí:** không đổi tay từng dòng; **lật dọc rồi tra `Map_Cost`**. Giữ **1 tên chuẩn** cho mỗi phí; không liệt kê trước nhiều biến thể (dễ nhân dòng). Tên lạ để rơi vào `60_QC_Errors`.
- **Chuẩn hóa Forwarder:** gán cứng chuỗi đúng trong mỗi stg_* (phải khớp cột Forwarder của `Map_Cost`).
- **Chuẩn hóa Mode (CHƯA làm):** `AIR→Air`; `LCL/FCL→Sea`; `CPN→Courier`; `TC→Local`; DHL/FedEx gán cứng `Courier`. Cần thêm cột **Import/Export**.
- **Chuẩn hóa Route (CHƯA làm):** winner-take-all (xem Phần 11).
- **Chuẩn hóa Customer/Route:** dùng `24_List_Project` để kiểm chính tả tên dự án.
- **Chuẩn hóa Shipment/khóa lô:** B/L là khóa; Local dùng CDS No; VVMV Export tự điền B/L; VVMV Local dùng CDS No.
- **Tiền tệ:** báo cáo cuối là **USD**. Mọi VND quy đổi (Phần 10). **Tính cả VAT** vào chi phí.

---

## 10. QUY TẮC MERGE DỮ LIỆU

### a) Merge tên phí (Debit ↔ Map_Cost) — cốt lõi
- **Khóa kép:** `(Original Cost Name + Forwarder)`, Join Kind **Left Outer**.
- **Vì sao 2 cột:** cùng tên phí (ví dụ "NET CHARGE") xuất hiện ở nhiều forwarder trong `Map_Cost`; nếu merge chỉ theo tên phí → 1 dòng khớp nhiều dòng → **nhân dòng** (đã dính lỗi ×3 ở DHL). Vì thế **phải thêm cột Forwarder TRƯỚC khi merge**, và chọn 2 cột **đúng thứ tự** ở cả hai bảng.
- Sau merge, **expand** lấy `Standard Cost` + `FWD Column` (bỏ tick prefix).
- Kiểm: `Standard Cost` null = tên phí chưa có trong `Map_Cost` → thêm dòng.

### b) Merge tỷ giá (Month ↔ Map_ExchangeRate)
- Merge `fact_CostLines` với `Map_ExchangeRate` theo `Month` (Text `YYYY-MM`), expand `USD_Rate`.
- Công thức quy đổi (Custom Column `Amount_USD`):
```
if [Forwarder] = "EI" then
  (if [Currency] = "USD" then [Amount] else [Amount] / [Exchange Rate])
else [Amount] / [USD_Rate]
```
  - EI+USD → giữ nguyên; EI+VND → chia **tỷ giá riêng từng lô** (`Exchange Rate`); còn lại (VND) → chia **tỷ giá chung** (`USD_Rate`).
  - ⚠️ Thứ tự bước quan trọng: bước đổi tên/ép kiểu cột phải nằm **TRƯỚC** bước tính `Amount_USD` (đã dính lỗi "field 'Exchange Rate' not found" do dấu cách thừa + do bước rename nằm sau).

### c) Merge nhiều forwarder (Append)
- `fact_CostLines` = `Table.Combine({stg_DHL, stg_FedExExp, stg_FedExImp, stg_Dolphin, stg_VVMV, stg_EI})`.
- Append khớp theo **TÊN cột**, không theo vị trí/thứ tự. **Thiếu cột = OK** (tự bù null); **lệch tên = LỖI** (xé đôi cột).
- Thêm forwarder mới sau này = chỉ thêm tên vào `Table.Combine`.

### d) Merge B/L cho Export (VVMV) — hiện KHÔNG dùng
- Ban đầu định merge `Invoice No` ↔ `ExportMgmt[INVOICE NO.]` lấy `Tracking#`. **Nhưng** Invoice ExportMgmt = **8 ký tự cuối** của Invoice VVMV, và chỉ áp cho export → phức tạp. **Quyết định:** người dùng **tự điền thẳng B/L cho hàng Export trước khi dán** → query khỏi merge ExportMgmt.

### e) Merge lô (Import/Export/Local trong VVMV) — xử cột B/L
- Import: B/L = HBL (giữ nguyên).
- Local (B ghi "Local"): thay bằng **CDS No** (số tờ khai) qua cột điều kiện.
- Export (B ghi "Export"/"Export "): người dùng đã tự điền B/L.
- Đã **Trim** cột B/L để bỏ khoảng trắng thừa ("Export ").

### f) Merge Shipment (ghép lô nhiều forwarder) — CHƯA làm
- Sẽ thực hiện ở sheet 50 (group/pivot theo B/L từ kho dọc).

---

## 11. TOÀN BỘ CÁC QUYẾT ĐỊNH ĐÃ THỐNG NHẤT (phần quan trọng nhất)

1. **Kiến trúc "Architecture B":** lưu DỌC ở sheet 40, sinh báo cáo NGANG sau. (Đã bác đề xuất "bỏ bảng giao dịch" từ ChatGPT.)
2. **Mỗi forwarder = 1 query staging connection-only**, theo khung chung; gộp bằng `fact_CostLines` (Append).
3. **Khóa merge phí là KÉP** `(Original Cost Name + Forwarder)`; **thêm Forwarder TRƯỚC merge**.
4. **Bộ cột chuẩn** phải khớp tên tuyệt đối (hoa/thường/khoảng trắng). Thiếu cột → bù null; lệch tên → lỗi.
5. **B/L là khóa lô**; Local dùng **CDS No**; VVMV Export **tự điền B/L**; VVMV Local dùng **CDS No** (an toàn hơn Invoice vì Invoice có thể trùng giữa các nhà cung cấp).
6. **Báo cáo TÍNH CẢ VAT.** Đã **BỎ cột `Include in Total`** khỏi `Map_Cost`. VAT của phí nào → gộp vào `Standard Cost` của phí đó (EI có 1 cột VAT lump → map theo quyết định người dùng).
7. **"Pay on behalf" của forwarder** (Infrastructure fee, Local charge, Storage, Customs fee…) = **chi phí thật của công ty** → map vào nhóm chuẩn (thường **Dest LCC** hoặc **Customs**). Đây KHÁC "chi hộ charge lại bên khác".
8. **"Chi hộ charge lại bên khác"** (công ty trả hộ rồi thu lại) = **case-by-case**, nằm ở **sheet 18** theo B/L; báo cáo chỉ hiển thị **số ĐÃ CHI**, không đưa số thu vào tổng chi phí. (Số thu thường CAO hơn số chi = biên quản lý ẩn — phân tích để sau.) Đã **BỎ cột `Pay on Behalf Eligible`** khỏi `Map_Cost` vì nó là thuộc tính case-by-case, không cố định theo loại phí.
9. **`Map_Cost` chỉ chứa cái CỐ ĐỊNH** (Forwarder, Original Cost Name, Standard Cost, FWD Column, Notes). Người dùng là **chủ** từ điển này, tự sửa nội dung; **không đổi tên cột tiêu đề**.
10. **Không tự động hóa đổi tên cột bằng `Map_Column`** — với 6 forwarder, đổi tay 4–5 cột/forwarder (một lần khi xây) đơn giản hơn dựng cơ chế map. Giữ `21_Map_Column` làm tài liệu tham chiếu.
11. **Tên phí: giữ 1 tên chuẩn**, không liệt kê nhiều biến thể phòng xa (dễ nhân dòng); dựa vào `60_QC_Errors` để bắt tên lạ.
12. **Lọc `Amount ≠ 0`** đặt ở `fact_CostLines` (áp cho mọi forwarder); **giữ dòng âm** (giảm giá/điều chỉnh).
13. **Ô khai báo tháng:** B2 sheet 00, tên `ThangBaoCao`, Text `YYYY-MM`; query `ThangBaoCao` connection-only (đã **xóa Changed Type** để không thành ngày). Cột `Month` = `ThangBaoCao[Column1]{0}`, ép Text.
14. **Xóa bước "Changed Type" tự sinh** ở mọi query (nó ép số dài thành scientific, ép chữ `2026-06` thành ngày).
15. **Ép cột mã (B/L, CDS No) về Text** để tránh số khoa học.
16. **Forwarder tiêu đề nhiều dòng (Dolphin/VVMV/EI):** gõ **tiêu đề sạch tay ở Raw** rồi dán dữ liệu khớp cột (đơn giản, dễ bảo trì hơn xử merged header trong PQ). Forwarder tiêu đề 1 dòng (DHL/FedEx): dán thẳng, đổi tên trong query.
17. **Tiền tệ / quy đổi USD:** báo cáo cuối USD. EI = USD với 2 phí VND (`PHÍ CHỨNG TỪ`, `PHÍ LÀM HÀNG`) dùng **tỷ giá riêng từng lô** (cột `Exchange Rate` trên debit EI). Các forwarder khác VND dùng **tỷ giá chung** `23_Map_ExchangeRate`. Cột `Currency` chỉ cần đúng cho EI (theo tên phí); 5 forwarder kia suy theo Forwarder, **không cần đánh dấu Currency**.
18. **Route (winner-take-all):** dự án có **Qty lớn nhất** trong lô thắng; hòa → **Trị giá NT** (customs value) lớn nhất. Con người điền Dự án tay ở báo cáo tờ khai; máy gom nhóm chọn quán quân. **Chìa gắn Route:** VVMV & Dolphin → **CDS No**; EI/FedEx/DHL **Import → B/L**, **Export → Invoice**. (Báo cáo tờ khai có B/L cho **oversea import**; mọi lô đều có CDS.) DHL/FedEx/EI **không có CDS No trên debit**.
19. **Cột giữ cho từng forwarder** (đã chốt qua thực làm):
    - DHL: `Month, B/L, Shipper, Consignee, Origin, Destination, CW, Original Cost Name, Amount, Standard Cost, FWD Column, Forwarder`.
    - FedEx Exp/Imp: như DHL.
    - Dolphin: `Month, B/L, Shipper, CW, Original Cost Name, Amount, Standard Cost, FWD Column, Forwarder` + đã **vá thêm CDS No** (và Mode/CBM nếu có). Không có Consignee/Origin/Destination.
    - VVMV: `Month, B/L, Invoice No, CDS No, Shipper, Destination, Mode, CW, CBM, Original Cost Name, Amount, Standard Cost, FWD Column, Forwarder`.
    - EI: `Month, B/L, Mode, CW, CBM, Currency, Exchange Rate, Original Cost Name, Amount, Standard Cost, FWD Column, Forwarder`. (Bỏ cột `Expeditors inv` vì 1 ô chứa 2 invoice; EI import gắn Route bằng B/L.)
20. **VAT theo tỷ lệ khác nhau:** DHL/FedEx Export = VAT 8%; FedEx Import = VAT 5.26%; các dòng VAT map vào nhóm phí tương ứng.

---

## 12. NHỮNG GIẢ ĐỊNH

**Đã xác nhận:**
- Mọi lô đều có số tờ khai (CDS). Debit VVMV/Dolphin có CDS No; DHL/FedEx/EI **không** có CDS No trên debit.
- Báo cáo chi tiết tờ khai có **B/L cho oversea import**.
- EI debit chủ yếu USD; 2 phí `PHÍ CHỨNG TỪ`, `PHÍ LÀM HÀNG` là VND, dùng tỷ giá riêng từng lô.
- VVMV có 3 loại lô: Import (STT 1–530, B=HBL), Local (531–562, B="Local"), Export (563–599, B="Export").
- Báo cáo cũ **đã tính VAT** → tiếp tục tính VAT để nhất quán.

**Chưa xác nhận / cần xác nhận:**
- Với lô **không phải oversea import** (courier/local/export), cách gắn Route cụ thể qua B/L/Invoice và quan hệ **1 B/L–1 Route** (có nhân dòng không?).
- DHL/FedEx (courier) có nằm trong báo cáo tờ khai để tra Route không, hay Route lấy cách khác.
- Cách hiển thị **chi hộ hàng nhập** (sheet 18) trên báo cáo cuối.
- Overhead ("Lệ phí hải quan") của Dolphin/VVMV nhập vào kho thế nào (dòng không có B/L).
- Có forwarder/loại tiền nào ngoài VND/USD trong tương lai không (công thức Currency hiện mặc định "không USD = VND").

---

## 13. NHỮNG VIỆC ĐÃ HOÀN THÀNH (timeline)

1. **Architecture Review** (11 phần, tiếng Việt) — đã giao (`Architecture_Review_Logistics_Cost.md`). Chốt Architecture B, chỉ ra thiếu lớp USD, mơ hồ Route, debit bẩn cần query riêng, cảnh báo "over-document/under-build".
2. Dựng **file khung** `Logistics_System.xlsx` (các sheet 00–70) + seed `Map_Cost`.
3. Chốt **ô khai báo tháng** `ThangBaoCao`.
4. **DHL** — xong (học từ số 0: unpivot, merge, month, choose columns, load sheet 40). Sửa **lỗi nhân dòng ×3** bằng merge 2 cột (đưa Forwarder trước merge).
5. **FedEx Export** — xong (bỏ đầu trang; học Append; chuyển sang kiến trúc staging connection-only + `fact_CostLines`).
6. **FedEx Import** — xong (cột STT, VAT 5.26%). Sửa lỗi 2 cột Month do **khoảng trắng ẩn**.
7. **Dolphin** — xong (tiêu đề 2 dòng → tiêu đề sạch tay; 10 cột phí gồm khối POB; phân biệt 3 nghĩa "POB"; forwarder thiếu Consignee/Origin/Destination). Đã **vá thêm CDS No**.
8. **VVMV** — xong (tiêu đề 3 dòng; 3 loại lô; xử B/L: Import=HBL, Local=CDS No, Export tự điền; 8 cột phí). Người dùng **tự hoàn thành**.
9. **EI** — xong (tiêu đề 3 dòng; USD; bỏ cột invoice đa giá trị; thêm `Currency` điều kiện + giữ `Exchange Rate`). Người dùng **tự add**.
10. **Append đủ 6 forwarder** vào `fact_CostLines`.
11. **Lọc Amount ≠ 0** ở tầng chung.
12. **Quy đổi USD** — xong: merge tỷ giá theo Month + cột `Amount_USD` điều kiện (EI tỷ giá riêng, còn lại tỷ giá chung). Sửa lỗi thứ tự bước & khoảng trắng thừa `Exchange Rate `.
13. **Sắp xếp lại thứ tự cột** trong `fact_CostLines` (dùng Move, không kéo thả).
14. **Ghi chú bảo trì** đã tạo cho DHL, FedEx, Dolphin.

---

## 14. NHỮNG VIỆC ĐANG THỰC HIỆN

- Về mặt forwarder: **đã xong cả 6**.
- Về tầng chung: **quy đổi USD đã xong**. Đang ở **ranh giới chuyển sang các việc tầng chung còn lại** (Mode → Route → overhead → QC → báo cáo ngang → dashboard).
- Chưa có việc nào dở dang giữa chừng cần "nối tiếp trong query"; điểm dừng sạch sau khi quy đổi USD chạy đúng.

---

## 15. NHỮNG VIỆC CÒN LẠI (ROADMAP — theo thứ tự nên làm)

1. **Chuẩn hóa Mode** (tầng chung): tạo map `AIR→Air, LCL/FCL→Sea, CPN→Courier, TC→Local`; DHL/FedEx gán `Courier`. Thêm cột **Import/Export** (để courier biết tra Route bằng B/L hay Invoice). *(Việc nhẹ, nên làm trước để thắng nhanh.)*
2. **Vá đồng bộ forwarder cũ:** DHL/FedEx thêm `Mode="Courier"`; bổ sung `CW/CBM/Mode/CDS No` nơi thiếu cho khớp bộ cột chuẩn.
3. **Gắn Route (winner-take-all)** — việc lớn, cần thiết kế:
   - Dựng bảng Route từ `17_CustomsDetail_Raw`: gom theo lô, chọn dự án Qty lớn nhất (hòa → Trị giá NT lớn nhất).
   - Bảng Route **đa chìa** (CDS No, B/L, Invoice) → Route.
   - Merge vào kho: VVMV/Dolphin qua CDS No; EI/FedEx/DHL Import qua B/L, Export qua Invoice.
   - Cần xác nhận các giả định ở Phần 12 (courier có trong tờ khai không, 1 B/L–1 Route…).
4. **Overhead** ("Lệ phí hải quan"…): nhập các dòng không có B/L vào kho, đánh dấu riêng.
5. **`60_QC_Errors`** — lưới an toàn: liệt kê dòng có `Standard Cost` null (tên phí/cột lạ chưa map) để người dùng bổ sung `Map_Cost`.
6. **Sheet 50 — báo cáo NGANG cho CEO:** group/pivot từ kho dọc (theo Forwarder/nhóm phí/Route/Air-Sea), dùng `Amount_USD`.
7. **Sheet 70 — Dashboard** (KPI, biểu đồ, bộ lọc).
8. **Chi hộ hàng nhập (sheet 18):** cách hiển thị số đã chi vs thu lại.
9. **Ghi chú bảo trì VVMV + EI**; tổng hợp **SOP bàn giao** hoàn chỉnh (quy trình tháng + ghi chú từng forwarder + cách xử lỗi thường gặp).
10. (Tùy chọn) **Làm tròn `Amount_USD`** 2 số thập phân.

---

## 16. NHỮNG LƯU Ý QUAN TRỌNG (lỗi từng gặp + nguyên tắc)

**Các lỗi từng gặp và cách sửa (sẽ còn gặp lại):**
- **Nhân dòng khi merge:** do merge chỉ theo tên phí. → Merge **2 cột** (Forwarder + Original Cost Name), thêm Forwarder **trước** merge. Dấu hiệu: số ROWS là bội số (×2, ×3).
- **Cột bị "xé đôi" khi Append** (ví dụ 2 cột Month, hay `Origin` và `ORIGIN`): do tên lệch **hoa/thường** hoặc **khoảng trắng ẩn**. → Gõ lại tên cho khớp tuyệt đối.
- **Số dài thành scientific** (`8.72E+11`) hoặc **`2026-06` thành ngày**: do bước **Changed Type** tự sinh. → Xóa bước đó; ép cột mã về **Text**.
- **"Close & Load To…" bị chìm**: do query đã từng load ra sheet. → Bấm **Close & Load** thường rồi **chuột phải query → Load To… → Only Create Connection** (làm từ ngoài Excel).
- **Cột thừa null sau Append**: do một forwarder chưa **Choose Columns** về đúng bộ chuẩn (còn cột lạ). → Kiểm số COLUMNS từng stg_*.
- **Lỗi "field '…' not found" trong công thức:** do tên cột có **khoảng trắng thừa** (ví dụ `Exchange Rate `) hoặc **bước rename nằm SAU bước dùng cột**. → Sửa tên sạch + đưa bước rename lên **trước**.
- **Kéo thả đổi thứ tự cột khó**: dùng **chuột phải tiêu đề → Move** (Left/Right/To Beginning) thay vì kéo.

**Các hiểu lầm từng được làm rõ:**
- "Đổi tiêu đề" cho forwarder nhiều dòng là **gõ ở sheet Raw**, KHÔNG phải trong query.
- Đổi tên cột "trong query" (DHL/FedEx) khác với "tiêu đề sạch ở Raw" (Dolphin/VVMV/EI).
- Ba nghĩa "Pay on behalf": (a) forwarder ứng hộ = chi phí thật → nhóm chuẩn; (b) POB là một **cột phí dịch vụ** riêng của Dolphin = chi phí thật; (c) chi hộ công ty thu lại bên khác = sheet 18.
- Tắt cửa sổ Power Query / Queries & Connections **không mất** query.

**Nguyên tắc phải luôn tuân thủ:**
- **Không sửa file làm việc của người dùng bằng openpyxl** — sẽ phá hủy Power Query. Đưa ghi chú dạng text để người dùng tự dán.
- Query từng forwarder chỉ lo: **chuẩn hóa cột + phân loại phí + định danh**. Các việc **áp cho mọi forwarder** (quy đổi USD, Route, Mode, chi hộ, lọc 0) làm **MỘT LẦN ở tầng chung** `fact_CostLines`.
- **Đơn giản thắng phức tạp**: đừng dựng cơ chế phức tạp để tiết kiệm việc chỉ làm một lần.

---

## 17. HỒ SƠ NGƯỜI DÙNG (chỉ ghi điều đã xuất hiện)

- **Trình độ:** giỏi **nghiệp vụ logistics** và **Excel**; **mới học Power Query** (bắt đầu gần như số 0, đã tiến bộ rõ và tự hoàn thành được VVMV, EI, quy đổi). Không dùng SQL/Power BI (đã loại khỏi phạm vi).
- **Phong cách hướng dẫn mong muốn:** **từng bước một**, giải thích **mọi thuật ngữ bằng lời đời thường**, liên hệ với cách làm hiện tại, **ngắn gọn**, chỉ rõ **từng nút bấm**. Khi lỗi, cần **chẩn đoán đúng chỗ** và sửa tối thiểu.
- **Yêu cầu hiểu bản chất:** nhiều lần hỏi "tại sao" — cần hiểu lý do trước khi làm, để tự bảo trì 5 năm. Rất coi trọng **tính duy nhất của khóa**, tính **bảo trì/bàn giao**, tránh phụ thuộc người khác.
- **Tư duy tốt:** thường tự phát hiện vấn đề (POB nhầm, Invoice có thể trùng, cột chưa đổi tên, số khoa học…). Nên **tôn trọng và xác nhận** khi họ đúng; giải thích rõ khi họ hiểu nhầm.
- **Quyết định thực dụng:** chọn **xử tay lúc dán** khi quy tắc chỉ áp một nhóm nhỏ có ngoại lệ (ví dụ tự điền B/L export, tự sửa 8 ký tự cuối), thay vì dựng logic phức tạp.
- **Điều từng yêu cầu KHÔNG làm:** không làm hộ toàn bộ (muốn tự làm để làm chủ); không dựng thứ phức tạp không cần thiết; không dùng công cụ ngoài Excel.
- **Ưu tiên thiết kế:** đơn giản, minh bạch, dễ bảo trì, dễ bàn giao, đúng nghiệp vụ thực tế của công ty.
- **Ngôn ngữ:** làm việc hoàn toàn bằng **tiếng Việt**.
- **Môi trường:** dùng Excel qua **UltraViewer** (điều khiển từ xa) → Alt+Tab đôi khi không nhạy; hay chụp màn hình để hỏi.

---

## 18. NẾU PHẢI TIẾP TỤC DỰ ÁN Ở ĐOẠN CHAT MỚI

**Đọc trước:** Phần 16 (lưu ý/lỗi), Phần 17 (phong cách), Phần 11 (quyết định), Phần 6–10 (kiến trúc/merge/data dictionary).

**Tuyệt đối tránh:**
- Đừng sửa file `.xlsx` của người dùng bằng openpyxl (phá Power Query). Chỉ đưa ghi chú text.
- Đừng làm hộ toàn bộ — hướng dẫn để họ tự làm và **hiểu**.
- Đừng đề xuất SQL/Power BI/web app.
- Đừng dài dòng; đừng nhảy nhiều bước một lúc; đừng bỏ qua "tại sao".
- Đừng để bước rename/ép kiểu nằm SAU bước dùng cột đó.

**Nguyên tắc phải giữ nguyên:**
- Lưu DỌC ở sheet 40; sinh báo cáo NGANG sau.
- Merge phí **2 cột** (Forwarder + Original Cost Name); Forwarder thêm **trước** merge.
- Việc áp cho mọi forwarder → làm **1 lần ở `fact_CostLines`**.
- Tên cột khớp tuyệt đối (hoa/thường/khoảng trắng); mã về Text; xóa Changed Type.
- Giữ 1 tên phí chuẩn + dựa QC_Errors; tính cả VAT; báo cáo USD.

**Trạng thái hiện tại:**
- 6/6 forwarder đã vào kho `40_FACT_CostLines`.
- Đã lọc Amount ≠ 0 và **quy đổi USD (`Amount_USD`) chạy đúng**.
- Chưa làm: Mode, Route, overhead, QC_Errors, vá đồng bộ forwarder cũ, sheet 50 (báo cáo ngang), sheet 70 (dashboard), ghi chú VVMV/EI + SOP.

**Bước đầu tiên nên làm:** hỏi người dùng muốn bắt đầu từ **Chuẩn hóa Mode** (nhẹ, thắng nhanh) hay **Route** (lớn). Gợi ý: làm **Mode trước**, rồi **Route**. Trước khi làm Route, xác nhận các giả định chưa chốt ở Phần 12 (courier có trong báo cáo tờ khai không; quan hệ 1 B/L–1 Route; cách gắn Route cho courier/local/export).

**Câu mở đầu gợi ý cho chat mới:**
> "Tiếp tục dự án Logistics Cost (Excel + Power Query). Đây là tài liệu bàn giao đầy đủ: [dán toàn bộ file này]. Trạng thái: 6/6 forwarder đã vào kho, đã quy đổi USD xong. Ta bắt đầu bước tiếp theo — chuẩn hóa Mode. Hướng dẫn từng bước, ngắn gọn, giải thích rõ, tiếng Việt."

---

*Hết tài liệu bàn giao. Nhớ Ctrl+S và lưu một bản backup file `Logistics_System.xlsx` trước khi tiếp tục.*
