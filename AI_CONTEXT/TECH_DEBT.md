# TECH DEBT — Logistics Cost Dashboard

> Nợ kỹ thuật đã biết. Delta phiên 2026-07-22 (Chặng 1+2).

| ID | Nợ | Ảnh hưởng | Xử lý |
|---|---|---|---|
| ~~TD-01~~ | ~~Chưa phải git repo~~ | — | ✅ Đã init + push `8b008e6`; dọn clone rỗng lồng nhau |
| **TD-02** | App chạy **dữ liệu mẫu** (`mock-data.js`), chưa nối GAS/Sheets | Chưa phải số thật | Deploy backend + dán URL |
| **TD-03** | **Chưa xác minh trực quan** trên trình duyệt | Có thể lỗi layout/chart chưa phát hiện | Mở `index.html` kiểm tay |
| **TD-04** | **Chart.js từ CDN** | Offline/CSP chặn → biểu đồ trắng | Đã guard không vỡ trang; cân nhắc nhúng cục bộ nếu cần |
| **TD-05** | Field tên đặc biệt (`Import/Export`, `Mode chuẩn`) đọc bằng bracket | GAS đổi tên header → `undefined` | Xác nhận tên cột thật khi có Sheets (ASSUMPTION-W03) |
| **TD-06** | **Chưa có bộ lọc** forwarder/Import-Export/Mode ở UI (chỉ có chọn tháng) | Xem theo lát cắt phải đổi trang | Thêm khi cần |
| ~~TD-07~~ | ~~`data/` nhị phân trong repo~~ | — | ✅ Đã gỡ `data/` khỏi tracking + `.gitignore` (`ba780e2`) |
| **TD-11** | 🔴 **Dữ liệu công ty thật vẫn trong LỊCH SỬ Git** (`8b008e6`, `d26e33a`): 2 file xlsx (shipper/consignee, số tiền, path Y:/Z:, tên nhân viên). Gỡ ở HEAD không xóa lịch sử | Nếu repo public = lộ dữ liệu; có thể đã cache/fork | Đổi repo **Private** ngay; cân nhắc **rewrite history + force-push** (git filter-repo). Xem TODO_NEXT Ưu tiên 0 |
| **TD-08** | Dòng phí net = 0 tháng này bị **ẩn** khỏi bảng báo cáo | Lệch khi đối chiếu từng dòng với Excel | Chấp nhận; ghi rõ trong DESIGN_SYSTEM |
| **TD-09** | Chưa làm tròn `Amount_USD` 2 số lẻ; chưa xử **đơn giá** (QĐ-40) | Số lẻ dài; thiếu USD/kg, USD/CBM | Giai đoạn Kaizen |
| **TD-10** | Chưa phân quyền/đăng nhập (Q-W03) | Ai có link đều xem được | Quyết định khi deploy |

> Nợ kế thừa từ engine Excel (Refresh ~3 phút, Dolphin gõ Mode tay…): xem `context/31_OPEN_QUESTIONS.md` §4.
