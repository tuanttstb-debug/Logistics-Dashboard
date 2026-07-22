# 01 — Bối cảnh dự án

## 1. Một câu tóm tắt

Hệ thống báo cáo chi phí logistics chạy **100% trong Excel + Power Query**, gom debit của 7 nguồn nhà cung cấp về một kho dữ liệu dọc chuẩn hóa (`fact_CostLines`), phục vụ báo cáo cho CEO và làm nền cho Kaizen chi phí.

## 2. Mục tiêu

| | |
|---|---|
| **Mục tiêu định lượng** | Rút thời gian làm báo cáo tháng từ **~4 tiếng xuống ~30 phút** |
| **Quy trình đích** | Dán debit vào sheet Raw + điền tháng & tỷ giá + bấm **Refresh All** |
| **Người tiêu thụ báo cáo** | Tổng Giám đốc (CEO) |
| **Yêu cầu bàn giao** | Người dùng phải tự bảo trì và mở rộng trong **~5 năm**, không phụ thuộc ai |

**Ngoài phạm vi (đã chốt, đừng đề xuất lại):** SQL Server, Power BI, Access, web app, hay bất kỳ hệ thống IT nào ngoài Excel. Không xây phần kế toán/hạch toán — đây là báo cáo chi phí quản trị. Không tự động hóa khâu con người điền Dự án (Route) vào báo cáo tờ khai.

## 3. Vấn đề đang giải quyết (AS-IS)

Mỗi tháng phải gộp thủ công debit của nhiều forwarder có cấu trúc khác nhau: đổi tên cột, gom nhóm chi phí bằng SUMIF riêng cho từng forwarder, tra B/L và Route bằng VLOOKUP, ghép lô bị tách qua nhiều forwarder, xử chi hộ, quy đổi VND→USD, ráp báo cáo ngang bằng công thức.

Sáu vấn đề cốt lõi của cách cũ:

| # | Vấn đề | Nguyên nhân | Ảnh hưởng |
|---|---|---|---|
| 1 | Mỗi forwarder một bộ công thức riêng | Debit khác cấu trúc/tên | Tốn thời gian, khó bảo trì |
| 2 | Gom chi phí bằng SUMIF thủ công | Không có lớp chuẩn hóa | Dễ quét nhầm cột VAT/Total → tính trùng |
| 3 | Tra B/L, Route thủ công | Không có bảng tra tự động | Chậm, dễ sai |
| 4 | Ghép lô tách qua nhiều forwarder | Dữ liệu rời rạc | Sót hoặc nhân chi phí |
| 5 | Phụ thuộc người làm | Quy trình nằm trong đầu người | Nghỉ việc là tắc |
| 6 | Không có kho dữ liệu tái sử dụng | Làm thẳng ra báo cáo | Muốn xem theo Route phải làm lại từ đầu |

**Khác biệt cốt lõi của hệ thống mới:** thay SUMIF rải rác bằng **một kho dọc + từ điển ánh xạ**; thay tra tay bằng **merge tự động**.

## 4. Bối cảnh nghiệp vụ

Công ty nhập/xuất hàng **điện tử**, thuê nhiều forwarder lo: cước vận chuyển (Freight), phí địa phương đầu đi (Origin LCC), phí địa phương đầu đến (Dest LCC), vận tải nội địa (Trucking), thủ tục hải quan (Customs).

**Shipment (lô hàng):** một lô có thể đi qua **nhiều forwarder** cho các dịch vụ khác nhau → một lô sinh nhiều dòng chi phí ở nhiều forwarder.
**Khóa định danh lô = B/L.** Hàng Local (không có B/L) dùng **CDS No** (số tờ khai).

**Debit:** mỗi dòng là một lô, các cột chi phí nằm **ngang**. Cuối bảng thường có dòng Total/Grand Total và có thể có dòng overhead không gắn lô.

## 5. Nguồn dữ liệu

### Nhà cung cấp dịch vụ

| Nguồn | Vai trò | Sheet | Bảng Excel | Tiền tệ |
|---|---|---|---|---|
| DHL | Courier, cả 2 chiều | 10 | `Table1` | VND |
| FedEx Export | Courier, chiều xuất | 11 | `Table7` | VND |
| FedEx Import | Courier, chiều nhập | 12 | `Table11` | VND |
| EI (Expeditors) | Giao nhận, air/sea | 13 | `Table8` | **Chủ yếu USD**, 2 phí VND |
| VVMV | Giao nhận — có cả Import/Local/Export trong một bảng | 14 | `Table14` | VND |
| Dolphin | Giao nhận air/sea | 15 | `Table12` | VND |
| **Gia Bảo** | Nâng hạ hàng nặng — 1 dòng phí duy nhất | 19 (chung Overhead) | `OverheadRaw` | VND |

> Gia Bảo là nguồn thứ 7, **không có staging riêng** — nhập chung sheet 19 Overhead, hiển thị tên riêng "Gia Bảo" ở báo cáo.

**VVMV có 3 loại lô:** Import (STT 1–530, cột B = HBL) · Local (531–562, B = "Local") · Export (563–599, B = "Export").

### Dữ liệu bổ trợ

| Sheet | Nội dung | Dùng để |
|---|---|---|
| 16 — Export Management (`Table16`) | Invoice ↔ Tracking#, kèm cột Route | **Route hàng xuất** + tự-link B/L cho VVMV xuất |
| 17 — Chi tiết tờ khai (`Table13`) | Tờ khai hải quan, con người điền cột Dự án | **Route hàng nhập** + **Loại hàng** |
| 18 — POB Import | Chi hộ hàng nhập, case-by-case theo B/L | Pay-on-behalf (chưa làm) |
| 23 — Map_ExchangeRate | Tỷ giá USD theo tháng | Quy đổi |

## 6. Bốn chiều phân loại

Mỗi dòng trong `fact_CostLines` được gắn 4 nhãn. Công thức đầy đủ ở `11_BUSINESS_RULES.md`.

| Chiều | Giá trị | Nguồn quyết định |
|---|---|---|
| `Mode chuẩn` | Air · Sea · Courier · Local | Forwarder + cột Mode gốc |
| `Import/Export` | Import · Export · Overhead · Third party | Luật riêng theo từng hãng |
| `Route` | Tên project (theo `List_Project`) hoặc `Other` | Sheet 17 (nhập) / Sheet 16 (xuất) |
| `Loại hàng` | Material · Equipment & Toolings | Mã loại hình tờ khai — **chỉ hàng nhập** |

Và một chiều phân loại phí: `Standard Cost` — 5 nhóm chuẩn **Freight · Origin LCC · Dest LCC · Trucking · Customs**, cộng các dòng overhead có tên phí riêng.

## 7. Bốn loại chi phí (theo `Import/Export`)

1. **Import** — hàng nhập của công ty.
2. **Export** — hàng xuất của công ty.
3. **Overhead** — chi phí chung không thuộc lô nào: lệ phí hải quan nộp gộp cả tháng, phí nâng hạ, phí báo cáo quyết toán. Không Route, không Loại hàng.
4. **Third party** — hàng **không phải của công ty**: đi DHL/FedEx với cả `ORIGIN` lẫn `DESTINATION` đều khác `"VN"`. Route mặc định `Other`. Sau này báo cáo dưới dạng pay-on-behalf (nếu thu lại được tiền) hoặc arising fee (nếu không).

## 8. Nguyên tắc tiền tệ

- Báo cáo cuối bằng **USD**.
- **Tính cả VAT** vào chi phí (báo cáo cũ đã tính → giữ nhất quán). VAT của phí nào gộp vào `Standard Cost` của phí đó.
- Tỷ giá: EI dùng **tỷ giá riêng từng lô** (cột `Exchange Rate` trên debit) cho 2 phí VND; các nguồn khác dùng **tỷ giá chung** tháng ở sheet 23.
- VAT theo tỷ lệ khác nhau: DHL/FedEx Export **8%**; FedEx Import **5.26%**.

## 9. Trạng thái hiện tại (2026-07-21)

**Đã xong:**

- 7 query staging (6 forwarder + `stg_Overhead`) → kho `fact_CostLines`
- Lọc `Amount ≠ 0`, quy đổi `Amount_USD` (chạy đúng)
- Cột `Mode chuẩn`, `Import/Export`, `Route`, `Loại hàng`
- Nhãn `Third party`
- Overhead (sheet 19 + `stg_Overhead`)
- Bảng ghi đè tay `25_Update_Manual`
- Lưới kiểm lỗi `60_QC_Errors` — **hiện QC sạch**
- Tự-link B/L cho VVMV hàng xuất qua invoice — kiểm **37/37 lô khớp, 0 lệch**

**Chưa làm:**

- **Sheet 50 — báo cáo ngang cho CEO** (ưu tiên cao nhất, mục tiêu cuối)
- Sheet 70 — dashboard
- Pay-on-behalf / arising fee (sheet 18)
- Ghi chú bảo trì VVMV/EI
- Chưa có phân tích Kaizen thực chất — mới xong nền dữ liệu

**Đánh đổi đã chấp nhận:** Refresh mất **~3 phút** do bước merge tự-link B/L (merge trước Unpivot). Quyết định **KHÔNG tối ưu** để giữ file ổn định.

## 10. Nguyên tắc thiết kế xuyên suốt

1. **Lưu DỌC, báo cáo NGANG.** Kho `fact_CostLines` là long format (1 dòng = 1 khoản phí); báo cáo ngang sinh sau từ kho.
2. **Chuẩn hóa một lần, chạy mãi.** Việc áp cho mọi forwarder (quy đổi USD, Route, Mode, lọc 0, Loại hàng) làm **một lần ở tầng chung** `fact_CostLines`, không làm ở từng staging.
3. **Query staging chỉ lo 3 việc:** chuẩn hóa cột, phân loại phí, định danh lô.
4. **Đơn giản thắng phức tạp.** Đừng dựng cơ chế phức tạp để tiết kiệm việc chỉ làm một lần.
5. **Ổn định > tối ưu.** File đang chạy đúng thì không đụng vào vì lý do hiệu năng. Nếu tối ưu, làm trên bản copy.
6. **Không đổi tên bảng Excel và tên cột nguồn.** Đã từng đổi tên cột và làm gãy cả chuỗi query.
7. **QC là lưới an toàn, không phải trang trí.** Mỗi tháng chạy sheet 60 và xử hết trước khi báo cáo.
8. **Ghi đè tay là ngoại lệ.** Nếu một loại lỗi phải sửa tay lặp lại nhiều tháng → sửa quy tắc ở model, đừng sửa tay mãi.
9. **Mọi quyết định phân loại phải ghi vào `30_DECISIONS_LOG.md`.**
