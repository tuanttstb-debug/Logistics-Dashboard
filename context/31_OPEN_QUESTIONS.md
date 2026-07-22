# 31 — Câu hỏi mở & khoảng trống context

> Đọc file này **đầu mỗi phiên**. Đây là những chỗ **chưa chốt** — đừng tự suy đoán rồi làm tiếp.

---

## 1. Quyết định nghiệp vụ chưa chốt

| # | Câu hỏi | Ảnh hưởng | Chặn việc gì |
|---|---|---|---|
| **Q-01** | Mã loại hình **`A21`** và **`H11`** thuộc Material hay Equipment & Toolings? | Cột `Loại hàng` để trống với các lô này | Không chặn — xử khi phát sinh (QĐ-25) |
| ~~Q-02~~ | Khối **Third party** hiển thị thế nào? | — | ✅ **QĐ-37** (khối riêng/forwarder, có vào tổng) |
| ~~Q-03~~ | Báo cáo theo **Route** đặt ở đâu? | — | ✅ **QĐ-38** (trang riêng "Theo Route") |
| ~~Q-04~~ | Cần **so sánh tháng trước** / lũy kế năm không? | — | ✅ **QĐ-39** (có: tháng trước + % + YTD) |
| ~~Q-05~~ | Cần **đơn giá** (USD/kg, USD/CBM) không? | — | ✅ **QĐ-40** (chưa làm, để Kaizen) |
| **Q-06** | Cách hiển thị **chi hộ hàng nhập** (sheet 18) — số chi và số thu trình bày ra sao? | Thiết kế pay-on-behalf | Chặn việc pay-on-behalf (đã hoãn — QĐ-28) |
| **Q-07** | Quan hệ **1 B/L – 1 Route** có luôn đúng không? Có trường hợp nào 1 B/L phải chia nhiều Route? | Rủi ro nhân dòng khi merge Route | Chưa thấy vỡ, nhưng nên xác nhận |
| **Q-08** | Tương lai có forwarder hoặc loại tiền nào **ngoài VND/USD** không? | Công thức `Currency` hiện mặc định "không USD = VND" | Không chặn hiện tại |

---

## 2. Khoảng trống dữ liệu trong kho

Các trường **chưa có** trong `fact_CostLines`, làm hạn chế phân tích:

| Thiếu | Hệ quả | Có nên bổ sung? |
|---|---|---|
| **Ngày** (ngày chứng từ / ngày lô) | Không đo được lead time, không phân tích được tính gấp của lô Air | Cân nhắc sau khi xong sheet 50, làm trên bản copy |
| **CW/CBM ở mức lô đã de-dup** | Tính đơn giá phải tự xử lý de-duplicate theo B/L, dễ sai | Có thể xử ở tầng báo cáo |
| **Incoterm** | Không biết ai chịu chi phí nào theo hợp đồng | Tùy nhu cầu Kaizen |
| **Giá trị hàng hóa** | Không tính được tỷ lệ chi phí logistics / giá trị hàng | Tùy nhu cầu Kaizen |

---

## 3. Thông tin bối cảnh chưa được ghi lại

| # | Chưa biết | Vì sao cần |
|---|---|---|
| **G-01** | Kho hiện có **bao nhiêu tháng dữ liệu**? Bắt đầu từ tháng nào? | Quyết định phân tích xu hướng có ý nghĩa hay không |
| **G-02** | **Quy mô chi phí logistics/năm** của công ty | Đánh giá độ lớn của cơ hội tiết kiệm |
| **G-03** | CEO có đặt **mục tiêu tiết kiệm cụ thể** không? | Đặt target cho initiative |
| **G-04** | Danh sách đầy đủ trong **`24_List_Project`** | Kiểm Route lạ; báo cáo theo dự án. Đã biết một phần: `PURE`, `EFI`, `AGIGA`, `Ford`, `Other` |
| **G-05** | **Nội dung `Map_Cost`** — danh sách tên phí gốc → nhóm chuẩn của từng forwarder | Cần khi debug phí chưa map |
| **G-06** | Ai vận hành file hàng tháng ngoài người dùng chính? | Mức độ chi tiết cần cho SOP |
| **G-07** | Đã có **sáng kiến Kaizen** nào đang chạy chưa? | Tránh trùng lặp |
| **G-08** | Có **benchmark thị trường / báo giá vendor** để đối chiếu không? | Phân tích H2 (đơn giá chênh lệch) |
| **G-09** | Tài liệu **"Ghi chú từng sheet"** và **"Checklist mỗi tháng"** gốc — chưa có bản đầy đủ | `13_QC_AND_OPS.md` được dựng lại từ suy luận, có thể thiếu chi tiết |

---

## 4. Nợ kỹ thuật đã biết

| # | Nợ | Trạng thái |
|---|---|---|
| **D-01** | Refresh mất **~3 phút** do merge trước Unpivot trong `stg_VVMV` | Chấp nhận có chủ đích (QĐ-26). Chỉ động vào nếu thành vấn đề, và làm trên **bản copy** |
| **D-02** | Bảng EI tên `Table8` — tên vô nghĩa | Không sửa. Đổi tên sẽ gãy query |
| **D-03** | Dolphin phải **gõ tay Mode** mỗi tháng | Không có nguồn tự động. Đã đưa vào checklist |
| **D-04** | Sheet 20, 21 (`Map_Forwarder`, `Map_Column`) không query nào đọc | Giữ làm tài liệu tham chiếu (QĐ-10) |
| **D-05** | Chưa có **ghi chú bảo trì cho VVMV và EI** (DHL/FedEx/Dolphin đã có) | Nên làm trước khi bàn giao |
| **D-06** | Chưa làm tròn `Amount_USD` về 2 số thập phân | Tùy chọn, ưu tiên thấp |

---

## 5. Cách dùng file này

- Câu hỏi được trả lời → chuyển thành quyết định trong `30_DECISIONS_LOG.md`, xóa khỏi đây
- Phát hiện khoảng trống mới → thêm vào đây thay vì tự suy đoán
- Trước khi bắt đầu sheet 50: **phải hỏi người dùng Q-02, Q-03, Q-04, Q-05**
