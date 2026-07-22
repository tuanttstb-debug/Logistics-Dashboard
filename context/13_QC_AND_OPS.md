# 13 — QC & Vận hành hàng tháng

## 1. Checklist chu kỳ tháng

> Mục tiêu: **~30 phút**. Làm đúng thứ tự.

### Bước 0 — Chuẩn bị

- [ ] **Backup** `Logistics_System.xlsx` (copy file, ghi ngày vào tên)
- [ ] Thu thập: 6 debit + báo cáo tờ khai + Export Management + tỷ giá tháng

### Bước 1 — Khai báo

- [ ] Sheet `00` ô **B2**: điền tháng dạng Text `YYYY-MM` (vd `2026-07`)
- [ ] Sheet `23_Map_ExchangeRate`: thêm dòng tháng mới + `USD_Rate`

### Bước 2 — Dán dữ liệu debit

- [ ] `10_DHL_Raw` — dán thẳng
- [ ] `11_FedExExp_Raw` — **bỏ đầu trang** khi dán
- [ ] `12_FedExImp_Raw` — có cột STT
- [ ] `13_EI_Raw` — dán khớp tiêu đề sạch có sẵn
- [ ] `14_VVMV_Raw` — dán khớp tiêu đề sạch có sẵn
- [ ] `15_Dolphin_Raw` — dán khớp tiêu đề sạch có sẵn
- [ ] ⚠️ **`15_Dolphin_Raw`: gõ tay cột Mode** (`LCL` / `FCL` / `AIR`) — cột gốc là số pallet, không dùng được
- [ ] `19_Overhead_Raw` — nhập chi phí chung + dòng Gia Bảo

### Bước 3 — Dán dữ liệu bổ trợ

- [ ] `16_ExportMgmt_Raw` — Export Management. Kiểm cột Route: sửa lệch hoa/thường (`Agiga`, `Ford`) **ngay tại nguồn**
- [ ] `17_CustomsDetail_Raw` — báo cáo tờ khai, đảm bảo cột **Dự án đã điền tay** đầy đủ

### Bước 4 — Refresh

- [ ] **Data → Refresh All**
- [ ] ⏱ Chờ **~3 phút** — bình thường, không phải treo

### Bước 5 — QC (bắt buộc, không được bỏ)

- [ ] Mở **sheet 60** `QC_Errors`
- [ ] Xử hết lỗi theo bảng ở mục 2 dưới
- [ ] Nếu phải ghi đè tay → làm đúng quy trình mục 3
- [ ] **Refresh lại** và kiểm sheet 60 đã sạch

### Bước 6 — Kiểm tra nhanh độ tin cậy

- [ ] Tổng `Amount_USD` có hợp lý so với tháng trước không? (chênh > 30% → soi lại)
- [ ] Số dòng `fact_CostLines` có bất thường không? (bội số → nghi nhân dòng)
- [ ] Có forwarder nào tổng = 0 không? (nghi chưa dán / dán lệch cột)

### Bước 7 — Báo cáo

- [ ] Sheet 50 — báo cáo ngang *(chưa dựng)*
- [ ] Sheet 70 — dashboard *(chưa dựng)*
- [ ] **Ctrl+S** và lưu bản backup sau khi chạy xong

---

## 2. `60_QC_Errors` — các lỗi bắt và cách xử

Query đọc `fact_CostLines`, liệt kê dòng lỗi kèm cột `QC_Issue`, nạp ra sheet 60.

| `QC_Issue` | Nghĩa | Cách xử |
|---|---|---|
| **Phí chưa map** | `Standard Cost` null — tên phí chưa có trong từ điển | Thêm dòng vào `22_Map_Cost` (đúng cặp Forwarder + tên phí gốc) |
| **Chưa xác định Import/Export** | Không rơi vào luật nào | Kiểm ORIGIN/DESTINATION/Mode/số tờ khai. Nếu là ngoại lệ thật → điền tay qua UpdateManual |
| **Không có tờ khai** | Hàng nhập nhưng thiếu `Loại hàng` | Lô third-party đi qua VN, hàng mẫu... → người dùng tự quyết, điền tay nếu cần |
| **Chưa có Route** | Route null | Kiểm cột Dự án ở sheet 17 đã điền chưa; hàng xuất kiểm cột Route sheet 16 |
| **Route lạ** | Route không có trong `List_Project` | Sai chính tả → sửa ở nguồn (sheet 16/17). Hoặc dự án mới → thêm vào `24_List_Project` |
| **Mode chưa chuẩn hóa** | `Mode chuẩn` null | Thường là Dolphin chưa gõ tay Mode. Hoặc token lạ → bổ sung luật |

### Các trường hợp QC **cố ý BỎ QUA** (không phải lỗi)

- Dòng **Overhead** (`FWD Column = "Overhead FWD"`) — theo thiết kế không có Route/Loại hàng
- Lô **Third party** — Route tự động `Other`
- **Hàng xuất** — không cần `Loại hàng`

---

## 3. Quy trình ghi đè tay qua `25_Update_Manual`

1. Copy bảng lỗi từ sheet 60
2. Paste **Values** (không phải paste thường) vào sheet 25
3. ⚠️ **XÓA TRẮNG 4 cột**: `Route`, `Import/Export`, `Mode`, `Loại hàng`
4. Điền lại **chỉ những ô thật sự cần**
5. Kiểm: **mỗi B/L đúng 1 dòng**
6. Refresh

> ⚠️ Bỏ bước 3 → giá trị cũ từ QC sẽ **đè chết** nhãn tự động (vd `Third party` bị đổi thành `Import`). Đây là lỗi đã thực sự xảy ra.

**Nguyên tắc:** ghi đè tay là **ngoại lệ**. Nếu một loại lỗi phải sửa tay lặp lại nhiều tháng → sửa quy tắc trong model, đừng sửa tay mãi.

---

## 4. Sổ tay lỗi Power Query (đã gặp, sẽ còn gặp)

| Lỗi | Dấu hiệu | Nguyên nhân | Cách sửa |
|---|---|---|---|
| **Nhân dòng khi merge** | Số ROWS là bội số ×2, ×3 | Merge chỉ theo tên phí | Merge **2 cột** (Forwarder + Original Cost Name); thêm Forwarder **trước** merge |
| **Cột xé đôi khi Append** | 2 cột `Month`, hoặc `Origin` và `ORIGIN` | Tên lệch hoa/thường hoặc khoảng trắng ẩn | Gõ lại tên khớp **từng ký tự** |
| **Số thành scientific** | `8.72E+11` | Bước `Changed Type` tự sinh | Xóa bước đó; ép cột mã về **Text** |
| **`2026-06` thành ngày** | Ô tháng ra dạng date | `Changed Type` ở query `ThangBaoCao` | Xóa bước đó |
| **`field '…' not found`** | Lỗi khi tính `Amount_USD` | Khoảng trắng thừa (`Exchange Rate `) hoặc bước rename nằm SAU bước dùng cột | Sửa tên sạch + đưa rename lên **trước** |
| **Cột thừa toàn null** | Nhiều cột lạ sau Append | Một `stg_*` chưa Choose Columns | Kiểm số COLUMNS từng staging |
| **"Close & Load To…" bị chìm** | Không thấy menu | Query đã từng load ra sheet | Bấm **Close & Load** thường → chuột phải query → **Load To… → Only Create Connection** (làm từ ngoài Excel) |
| **Khó kéo thả đổi thứ tự cột** | — | — | Chuột phải tiêu đề → **Move** (Left/Right/To Beginning) |

---

## 5. Các hiểu lầm đã được làm rõ

- **"Đổi tiêu đề"** cho forwarder nhiều dòng (Dolphin/VVMV/EI) = **gõ ở sheet Raw**, KHÔNG phải trong query.
- Đổi tên cột **trong query** (DHL/FedEx, tiêu đề 1 dòng) khác với **tiêu đề sạch ở Raw**.
- Tắt cửa sổ Power Query / Queries & Connections **không mất** query.
- Ba nghĩa "Pay on behalf" — xem `11_BUSINESS_RULES.md` mục 12.

---

## 6. Cảnh báo an toàn file

> ❌ **KHÔNG BAO GIỜ** sửa `Logistics_System.xlsx` bằng openpyxl, pandas, hay bất kỳ script nào.
> Sẽ **phá hủy toàn bộ Power Query** trong file.
> Mọi thay đổi phải đưa ra dạng **hướng dẫn text** để người dùng tự thao tác trong Excel.

Luôn backup trước khi thay đổi cấu trúc query.
