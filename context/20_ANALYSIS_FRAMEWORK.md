# 20 — Khung phân tích chi phí & Kaizen

> **Trạng thái: KHUNG RỖNG.** Nền dữ liệu đã xong nhưng chưa có phân tích thực chất nào.
> File này định nghĩa *cách* sẽ phân tích, để khi có dữ liệu nhiều tháng thì làm ngay được và làm nhất quán.

## 1. Điều kiện tiên quyết

Phân tích Kaizen có ý nghĩa cần:

- [ ] **Ít nhất 3–6 tháng dữ liệu** trong `fact_CostLines` (hiện `[GAP]` — chưa rõ đã có bao nhiêu tháng)
- [ ] QC sạch ở mọi tháng
- [ ] Sheet 50 chạy được (để có số tổng hợp đối chiếu)
- [ ] Thống nhất **baseline** — tháng/kỳ nào làm gốc so sánh

## 2. Các chiều phân tích khả dụng

Kho `fact_CostLines` cho phép cắt theo:

| Chiều | Câu hỏi trả lời được |
|---|---|
| `Month` | Xu hướng, mùa vụ, so cùng kỳ |
| `Forwarder` | Nhà cung cấp nào đắt/rẻ, tỷ trọng phụ thuộc |
| `Standard Cost` | Tiền chảy vào nhóm phí nào |
| `Mode chuẩn` | Air vs Sea vs Courier vs Local |
| `Import/Export` | Chiều nào tốn hơn |
| `Route` | Dự án/khách hàng nào tốn chi phí logistics |
| `Loại hàng` | Material vs Equipment & Toolings |
| `B/L` | Chi phí trọn gói một lô (ghép nhiều forwarder) |

**Chiều kết hợp đáng giá nhất:** `Forwarder × Standard Cost × Mode chuẩn` — trả lời "ai đắt ở khoản gì, trên phương thức nào".

## 3. Cost driver — giả thuyết cần kiểm chứng

> Đây là **giả thuyết**, chưa có số chứng minh. Đánh dấu rõ để không nhầm là kết luận.

| # | Giả thuyết | Cách kiểm | Dữ liệu cần |
|---|---|---|---|
| H1 | Tỷ trọng Air freight cao hơn cần thiết — có lô đáng lẽ đi Sea | So `Amount_USD` theo `Mode chuẩn`, soi các lô Air có CW lớn / không gấp | `Mode chuẩn`, `CW`, ngày (chưa có) |
| H2 | Đơn giá cùng tuyến chênh lệch giữa các forwarder | Tính USD/kg (air), USD/CBM (sea) theo Forwarder cùng Origin-Destination | `CW`, `CBM`, `Origin`, `Destination` |
| H3 | Local charge (Origin/Dest LCC) phình so với Freight | Tỷ lệ LCC / Freight theo Forwarder theo tháng | `Standard Cost` |
| H4 | Chi phí Courier (DHL/FedEx) bị dùng cho lô không gấp | Soi `Mode chuẩn = Courier` với CW lớn | `CW` |
| H5 | Chênh lệch thu-chi ở pay-on-behalf là biên quản lý ẩn đáng thu hồi | So số thu vs số chi ở sheet 18 | Sheet 18 (chưa dựng) |
| H6 | Một số Route có chi phí logistics/đơn vị cao bất thường | `Amount_USD` theo Route, chuẩn hóa theo khối lượng | `Route`, `CW`/`CBM` |
| H7 | Chi phí Third party đang bị công ty gánh mà không thu lại | Tổng `Amount_USD` nhóm Third party theo tháng | `Import/Export` |

## 4. Bộ chỉ số theo dõi (KPI)

Định nghĩa trước để mọi lần tính ra cùng một con số.

| Chỉ số | Công thức | Ghi chú |
|---|---|---|
| **Tổng chi phí logistics** | `SUM(Amount_USD)` | Đã gồm VAT |
| **Cơ cấu nhóm phí** | `SUM(Amount_USD)` theo `Standard Cost` / tổng | 5 nhóm + overhead |
| **Đơn giá Air** | `SUM(Amount_USD where Freight & Air)` / `SUM(CW)` | USD/kg |
| **Đơn giá Sea** | `SUM(Amount_USD where Freight & Sea)` / `SUM(CBM)` | USD/CBM |
| **Tỷ lệ LCC/Freight** | `(Origin LCC + Dest LCC)` / `Freight` | Chỉ báo phí phụ phình |
| **Tỷ trọng Air** | `Amount_USD (Air)` / tổng Freight | Chỉ báo dùng air quá mức |
| **Overhead ratio** | `Amount_USD (Overhead)` / tổng | |
| **Chi phí Third party** | `SUM(Amount_USD where Third party)` | Nên tiến về 0 nếu thu lại được |
| **Tập trung nhà cung cấp** | Tỷ trọng forwarder lớn nhất | Rủi ro phụ thuộc |

> ⚠️ **Cảnh báo về đơn giá:** `CW`/`CBM` gắn ở mức lô, nhưng kho là long format (nhiều dòng phí/lô). Tính đơn giá phải **de-duplicate theo B/L** trước khi cộng CW/CBM, nếu không sẽ nhân lên nhiều lần. Đây là bẫy dễ mắc nhất khi phân tích.

## 5. Quy trình một lần phân tích

1. **Chốt câu hỏi** — cụ thể, có thể trả lời bằng số
2. **Chốt phạm vi** — kỳ nào, forwarder nào, loại chi phí nào
3. **Kiểm chất lượng dữ liệu kỳ đó** — QC sạch chưa, có tháng nào thiếu không
4. **Cắt số** theo chiều đã định, dùng `Amount_USD`
5. **Kiểm tra chéo** — tổng có khớp sheet 50 không; có bị nhân dòng không
6. **Kết luận + độ tin cậy** — nói rõ cái gì là số thật, cái gì là suy đoán
7. **Nếu ra sáng kiến** → ghi vào `21_INITIATIVE_TRACKER.md`

## 6. Nguyên tắc trung thực khi phân tích

1. **Phân biệt rõ số thật vs giả thuyết.** Số lấy từ `fact_CostLines` là số thật; suy luận nguyên nhân là giả thuyết.
2. **Nêu giới hạn dữ liệu.** Ít tháng thì không kết luận xu hướng. Một tháng bất thường không phải là trend.
3. **Cẩn thận với dòng âm** — điều chỉnh/giảm giá có thể làm méo so sánh kỳ.
4. **Đổi tỷ giá gây ảo giác tiết kiệm.** Khi so sánh kỳ, kiểm tỷ giá có đổi không trước khi kết luận chi phí giảm.
5. **Không so sánh kỳ có phạm vi khác nhau** (vd tháng thiếu 1 forwarder).
6. **Chi phí giảm chưa chắc là tốt** — có thể do khối lượng giảm. Luôn chuẩn hóa theo CW/CBM khi so sánh hiệu quả.

## 7. `[GAP]` — Chưa có trong context

- Quy mô chi phí logistics/năm của công ty
- Số tháng dữ liệu hiện có trong kho
- Mục tiêu tiết kiệm cụ thể CEO đặt ra (nếu có)
- Danh sách đầy đủ project trong `List_Project`
- Đã có sáng kiến Kaizen nào đang chạy chưa
- Có benchmark thị trường / báo giá vendor để so không
