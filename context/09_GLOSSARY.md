# 09 — Từ điển thuật ngữ

## Nghiệp vụ logistics

| Thuật ngữ | Nghĩa |
|---|---|
| **Forwarder** | Công ty giao nhận — lo vận chuyển, thủ tục, kho bãi thay công ty |
| **Debit / Debit note** | Giấy báo nợ forwarder gửi hàng tháng — **đầu vào chính** của hệ thống |
| **Shipment / Lô hàng** | Một lần vận chuyển. Một lô có thể đi qua **nhiều forwarder** cho các dịch vụ khác nhau |
| **B/L (Bill of Lading)** | Vận đơn — **khóa định danh lô** trong hệ thống này |
| **HBL / MBL** | House B/L (forwarder cấp) / Master B/L (hãng tàu cấp) |
| **AWB** | Air Waybill — vận đơn hàng không |
| **Tracking#** | Số theo dõi lô — trên sheet 16, dùng làm B/L cho hàng xuất |
| **CDS No** | Số tờ khai hải quan. Khóa thay thế khi không có B/L (hàng Local) |
| **Mã loại hình** | Mã trên tờ khai chỉ hình thức xuất/nhập (E11, E15, E13...) — nguồn `Loại hàng` |
| **Trị giá NT** | Trị giá nguyên tệ trên tờ khai — tiêu chí phá hòa khi chọn Route |
| **Incoterm** | Điều kiện thương mại quốc tế (FCA, DAP...) — quy định ai chịu chi phí nào |
| **CW (Chargeable Weight)** | Trọng lượng tính cước |
| **CBM** | Mét khối — đơn vị thể tích, dùng cho hàng sea |
| **LCL / FCL** | Less than Container Load / Full Container Load — hàng lẻ / nguyên container |
| **CPN** | Courier — chuyển phát nhanh (token trong dữ liệu VVMV) |
| **TC** | Local / vận chuyển nội địa (token trong dữ liệu VVMV) |

## Nhóm chi phí

| Nhóm | Nghĩa |
|---|---|
| **Freight** | Cước vận chuyển chính |
| **Origin LCC** | Origin Local Charge — phí địa phương **đầu đi** |
| **Dest LCC** | Destination Local Charge — phí địa phương **đầu đến** |
| **Trucking** | Vận tải nội địa |
| **Customs** | Thủ tục hải quan |
| **Overhead** | Chi phí chung không thuộc lô nào — hiện dòng riêng theo tên phí |

## Khái niệm riêng của dự án

| Thuật ngữ | Nghĩa |
|---|---|
| **`fact_CostLines`** | Kho dữ liệu dọc — 1 dòng = 1 khoản phí. Trái tim hệ thống |
| **Long format / DỌC** | Mỗi khoản phí một dòng. Ngược với debit gốc (phí nằm ngang) |
| **Wide format / NGANG** | Báo cáo cho CEO — phí nằm ngang theo cột |
| **Architecture B** | Lưu DỌC, sinh báo cáo NGANG sau. Kiến trúc đã chốt |
| **Staging (`stg_*`)** | Query chuẩn hóa từng forwarder, connection-only |
| **Tầng chung** | Các bước trong `fact_CostLines` áp cho **mọi** forwarder |
| **`Standard Cost`** | Nhóm phí chuẩn sau khi tra `Map_Cost` |
| **`FWD Column`** | Cột đích trên báo cáo. `"Overhead FWD"` là **dấu hiệu nhận diện overhead** |
| **`Mode chuẩn`** | Phương thức đã chuẩn hóa: Air / Sea / Courier / Local |
| **`Route`** | Dự án / khách hàng mà lô hàng thuộc về |
| **`Loại hàng`** | Material vs Equipment & Toolings — chỉ áp hàng nhập |
| **`Third party`** | Hàng **không phải của công ty**, DHL/FedEx với cả 2 đầu không phải VN |
| **Winner-take-all** | Luật chọn Route: dự án có Qty lớn nhất thắng cả lô. Hòa → Trị giá NT lớn nhất |
| **`UpdateManual`** | Bảng ghi đè tay theo B/L — ưu tiên **cao nhất** |
| **QC_Errors** | Lưới an toàn ở sheet 60, bắt dòng lỗi trước khi báo cáo |
| **Lô Sample** | Hàng mẫu — không có tờ khai, nên Route xuất phải lấy từ sheet 16 |

## Pay on behalf — 3 nghĩa khác nhau

| | Nghĩa | Xử lý |
|---|---|---|
| **(a)** | Forwarder ứng tiền trả cảng/kho, đòi lại công ty | **Chi phí thật** → map vào nhóm chuẩn |
| **(b)** | "POB" là một **cột phí dịch vụ riêng** của Dolphin | **Chi phí thật** → map vào nhóm chuẩn |
| **(c)** | Công ty trả hộ bên khác rồi **thu lại** | Sheet 18, case-by-case. Báo cáo chỉ hiện **số đã chi** |

| Thuật ngữ | Nghĩa |
|---|---|
| **Pay-on-behalf** | Trường hợp (c) khi **thu lại được** tiền |
| **Arising fee** | Trường hợp (c) khi **không thu lại được** → là chi phí thật |

## Power Query

| Thuật ngữ | Nghĩa |
|---|---|
| **Unpivot / Lật dọc** | Biến các cột chi phí nằm ngang thành dòng — bước cốt lõi của mỗi staging |
| **Append / `Table.Combine`** | Nối các bảng theo chiều dọc. Khớp theo **tên cột** |
| **Merge** | Ghép cột từ bảng khác theo khóa. Tương đương VLOOKUP |
| **Left Outer Join** | Giữ mọi dòng bảng trái, lấy dữ liệu khớp từ bảng phải |
| **Connection-only** | Query chạy nhưng không đổ ra sheet |
| **Changed Type** | Bước tự sinh — **luôn phải xóa** vì làm hỏng số dài và ngày tháng |
| **`??`** | Toán tử coalesce — lấy giá trị đầu tiên không null |
| **`MissingField.UseNull`** | Cho phép query chạy dù bảng nguồn thiếu cột |
| **`Table.Distinct`** | Bỏ trùng — dùng đảm bảo mỗi B/L 1 dòng trong UpdateManual |
| **`Table.Buffer`** | Nạp bảng vào bộ nhớ để tăng tốc. **Đã cân nhắc nhưng không dùng** |

## Viết tắt trong bộ tài liệu

| | |
|---|---|
| **QĐ-xx** | Quyết định số xx trong `30_DECISIONS_LOG.md` |
| **Q-xx** | Câu hỏi mở trong `31_OPEN_QUESTIONS.md` |
| **G-xx** | Gap — khoảng trống thông tin |
| **D-xx** | Nợ kỹ thuật (Debt) |
| **H-x** | Giả thuyết (Hypothesis) trong `20_ANALYSIS_FRAMEWORK.md` |
| **K-xxx** | Sáng kiến Kaizen trong `21_INITIATIVE_TRACKER.md` |
| **P-xx** | Cải tiến quy trình đã hoàn thành |
| **`[GAP]`** | Đánh dấu chỗ thiếu thông tin ngay trong file |
| **⛔ SUPERSEDED** | Quyết định đã bị thay thế |
