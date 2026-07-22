# 12 — Data Dictionary

## 1. Bộ cột `fact_CostLines` (kho dọc — sheet 40)

Mỗi dòng = **1 khoản phí** của 1 lô.

### Định danh & thời gian

| Cột | Ý nghĩa | Nguồn | Quy tắc |
|---|---|---|---|
| `Month` | Tháng báo cáo | Ô `ThangBaoCao` (B2 sheet 00) | **Text** `YYYY-MM`, không để thành ngày |
| `Forwarder` | Tên nhà cung cấp | Gán cứng trong mỗi `stg_*` | Chuỗi đúng: `DHL`, `FedEx Export`, `FedEx Import`, `Dolphin`, `VVMV`, `EI`, `Gia Bảo` |
| `B/L` | **Khóa lô** — số vận đơn | Debit (AWB/HBL/MBL) | **Text**. Local = CDS No; VVMV Export = tự-link từ invoice |
| `Invoice No` | Số hóa đơn | Debit | Chỉ forwarder nào có |
| `CDS No` | Số tờ khai — chìa gắn Route | Debit VVMV/Dolphin | **Text**. DHL/FedEx/EI không có |

### Thuộc tính lô

| Cột | Ý nghĩa | Nguồn | Ghi chú |
|---|---|---|---|
| `Shipper` | Người gửi | Debit | |
| `Consignee` | Người nhận | Debit (DHL/FedEx) | Thiếu ở Dolphin/VVMV → Append bù null |
| `Origin` / `ORIGIN` | Nơi đi | Debit | Dùng cho luật Third party |
| `Destination` / `DESTINATION` | Nơi đến | Debit | Dùng cho luật Import/Export của DHL |
| `Mode` | Phương thức — **thô** | Debit (`type`, LCL/AIR/CPN/TC...) | ⚠️ Dolphin: giá trị gốc là **số pallet**, phải gõ tay |
| `CW` | Trọng lượng tính cước | Debit (CHRGBL WGHT / Kgs / CW) | |
| `CBM` | Thể tích | Debit (VVMV/EI/Dolphin) | Cho hàng sea |

### Tiền

| Cột | Ý nghĩa | Nguồn | Quy tắc |
|---|---|---|---|
| `Original Cost Name` | Tên phí gốc trên debit | Sau Unpivot | Khóa merge với `Map_Cost` |
| `Amount` | Số tiền **gốc** | Sau Unpivot | Giữ nguyên tệ gốc. Lọc `≠ 0`, **giữ số âm** |
| `Currency` | Tiền tệ của dòng | EI: cột điều kiện theo tên phí; khác: suy theo Forwarder | Chỉ cần đúng cho EI |
| `Exchange Rate` | Tỷ giá **riêng từng lô** | Debit EI | Forwarder khác để trống |
| `USD_Rate` | Tỷ giá **chung** tháng | Merge `Map_ExchangeRate` theo `Month` | |
| `Amount_USD` | **Số tiền quy đổi USD** | Công thức điều kiện | ★ Số dùng cho mọi báo cáo |

### Phân loại

| Cột | Giá trị hợp lệ | Nguồn |
|---|---|---|
| `Standard Cost` | `Freight` · `Origin LCC` · `Dest LCC` · `Trucking` · `Customs` · *(tên phí overhead riêng)* | Merge `Map_Cost` |
| `FWD Column` | Cột đích trên báo cáo, vd `Freight FWD`, **`Overhead FWD`** | Merge `Map_Cost` |
| `Mode chuẩn` | `Air` · `Sea` · `Courier` · `Local` · null | Tính ở tầng chung |
| `Import/Export` | `Import` · `Export` · `Overhead` · `Third party` · null | Tính ở tầng chung |
| `Route` (`Route_new`) | Tên project theo `List_Project`, hoặc `Other`, hoặc null | Merge ×3 + UpdateManual |
| `Loại hàng` | `Material` · `Equipment & Toolings` · trống | Merge `LoaiHang_byCDS`/`byBL` + UpdateManual |

> `FWD Column = "Overhead FWD"` là **dấu hiệu duy nhất** nhận diện dòng overhead.

---

## 2. Bảng từ điển

### `22_Map_Cost` — ★ quan trọng nhất

| Cột | Nội dung |
|---|---|
| `Forwarder` | Phải khớp tuyệt đối chuỗi trong `stg_*` |
| `Original Cost Name` | Tên phí gốc trên debit |
| `Standard Cost` | 1 trong 5 nhóm, hoặc tên phí overhead riêng |
| `FWD Column` | Cột đích báo cáo |
| `Notes` | Ghi chú tự do |

Đã **bỏ** `Include in Total` (QĐ-06) và `Pay on Behalf Eligible` (QĐ-08).
Người dùng là **chủ** từ điển này — tự sửa nội dung, **không đổi tên cột tiêu đề**.

### `23_Map_ExchangeRate`

`Month` (Text `YYYY-MM`) · `USD_Rate` · `Note`

### `24_List_Project`

Danh sách tên dự án hợp lệ. Dùng để QC bắt "Route lạ".
`[GAP]` — nội dung danh sách chưa được ghi lại trong context. Ví dụ đã biết: `PURE`, `EFI`, `AGIGA`, `Ford`, và giá trị đặc biệt `Other`.

### `25_UpdateManual`

5 cột máy đọc: `B/L` · `Route` · `Import/Export` · `Mode` · `Loại hàng`. Mỗi B/L **đúng 1 dòng**.

### `26_MapLoaiHinh`

`Mã loại hình` → `Loại hàng`. Xem bảng đầy đủ ở `11_BUSINESS_RULES.md` mục 7.

---

## 3. Bảng nguồn bổ trợ

### Sheet 16 — Export Management (`Table16`)

| Cột | Dùng để |
|---|---|
| `INVOICE NO.` | Khóa nối với invoice VVMV (sau chuẩn hóa) |
| `Tracking#` | = B/L của lô xuất |
| `Route (Note cho FCA, DAP)` | ⚠️ **ĐỪNG ĐỔI TÊN** — nguồn Route hàng xuất |

Phủ cả lô Sample (không có tờ khai) — lý do chọn sheet này làm nguồn Route xuất.

### Sheet 17 — Chi tiết tờ khai (`Table13`)

| Cột | Dùng để |
|---|---|
| Số tờ khai | Khóa `Route_byCDS`, `LoaiHang_byCDS` |
| B/L | Khóa `Route_byBL`, `LoaiHang_byBL` — có cho **oversea import** |
| Dự án | **Con người điền tay** → nguồn Route hàng nhập |
| Số lượng | Tiêu chí winner-take-all (ưu tiên 1) |
| Trị giá NT | Tiêu chí phá hòa (ưu tiên 2) |
| `Mã loại hình` | Nguồn `Loại hàng` |

### Sheet 19 — Overhead (`OverheadRaw`)

`Forwarder` · `B/L` · `Original Cost Name` · `Amount (VND)`
B/L được phép điền để lưu vết — đã chặn không cuốn vào project.

---

## 4. Khóa & quan hệ

| Quan hệ | Khóa | Ghi chú |
|---|---|---|
| Định danh lô | `B/L` | Local dùng `CDS No` |
| Phí → nhóm chuẩn | **KÉP**: `(Original Cost Name + Forwarder)` | Bắt buộc 2 cột, tránh nhân dòng |
| Dòng → tỷ giá | `Month` | Text `YYYY-MM` |
| Route nhập — VVMV/Dolphin | `CDS No` | |
| Route nhập — EI/FedEx/DHL | `B/L` | |
| Route xuất | `B/L` = `Tracking#` (sheet 16) | |
| Loại hàng | `CDS No` trước, `B/L` sau | |
| Ghi đè tay | `B/L` | Mỗi B/L 1 dòng |
| Invoice VVMV xuất → Tracking# | Invoice **đã chuẩn hóa** | Qua `ExportBridge_INV` |

---

## 5. Cạm bẫy dữ liệu đã biết

| Bẫy | Biểu hiện | Cách xử |
|---|---|---|
| Nhân dòng khi merge | Số rows là bội số (×2, ×3) | Merge **2 cột**, thêm Forwarder **trước** merge |
| Cột bị xé đôi khi Append | Xuất hiện 2 cột `Month`, hoặc `Origin` và `ORIGIN` | Tên lệch hoa/thường hoặc khoảng trắng ẩn → gõ lại khớp tuyệt đối |
| Số dài thành scientific | `8.72E+11` | Xóa bước Changed Type; ép cột mã về Text |
| `2026-06` thành ngày | Ô tháng hiển thị dạng date | Xóa bước Changed Type ở query `ThangBaoCao` |
| `field '…' not found` | Lỗi khi tính `Amount_USD` | Khoảng trắng thừa (`Exchange Rate `) hoặc bước rename nằm SAU |
| Cột thừa null sau Append | Nhiều cột lạ toàn null | Một `stg_*` chưa Choose Columns đúng bộ |
| Overhead bị cuốn vào project | Dòng overhead có Route/Loại hàng | Đã chặn bằng điều kiện `Overhead FWD` ở đầu 2 công thức |
| UpdateManual đè nhãn tự động | `Third party` biến thành `Import` | **Xóa trắng 4 cột trước khi điền** |
| Dolphin Mode sai | `Mode chuẩn` = null hàng loạt | Gõ tay LCL/FCL/AIR vào sheet 15 |
