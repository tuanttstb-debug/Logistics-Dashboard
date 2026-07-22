# TECH DEBT — Logistics Cost Dashboard

> Nợ kỹ thuật đã biết. Delta phiên 2026-07-22 (Chặng 1+2).

| ID | Nợ | Ảnh hưởng | Xử lý |
|---|---|---|---|
| **TD-01** | Thư mục **chưa phải git repo** (`.git` không có) dù tưởng đã push | Không commit/push được; mất lịch sử | Làm rõ + `git init`/nối remote (TODO_NEXT #1) |
| **TD-02** | App chạy **dữ liệu mẫu** (`mock-data.js`), chưa nối GAS/Sheets | Chưa phải số thật | Deploy backend + dán URL |
| **TD-03** | **Chưa xác minh trực quan** trên trình duyệt | Có thể lỗi layout/chart chưa phát hiện | Mở `index.html` kiểm tay |
| **TD-04** | **Chart.js từ CDN** | Offline/CSP chặn → biểu đồ trắng | Đã guard không vỡ trang; cân nhắc nhúng cục bộ nếu cần |
| **TD-05** | Field tên đặc biệt (`Import/Export`, `Mode chuẩn`) đọc bằng bracket | GAS đổi tên header → `undefined` | Xác nhận tên cột thật khi có Sheets (ASSUMPTION-W03) |
| **TD-06** | **Chưa có bộ lọc** forwarder/Import-Export/Mode ở UI (chỉ có chọn tháng) | Xem theo lát cắt phải đổi trang | Thêm khi cần |
| **TD-07** | `data/Logistics_System.xlsx` (nhị phân) nằm trong repo | Repo phình, khó diff | `.gitignore` có sẵn dòng tắt `data/` nếu muốn |
| **TD-08** | Dòng phí net = 0 tháng này bị **ẩn** khỏi bảng báo cáo | Lệch khi đối chiếu từng dòng với Excel | Chấp nhận; ghi rõ trong DESIGN_SYSTEM |
| **TD-09** | Chưa làm tròn `Amount_USD` 2 số lẻ; chưa xử **đơn giá** (QĐ-40) | Số lẻ dài; thiếu USD/kg, USD/CBM | Giai đoạn Kaizen |
| **TD-10** | Chưa phân quyền/đăng nhập (Q-W03) | Ai có link đều xem được | Quyết định khi deploy |

> Nợ kế thừa từ engine Excel (Refresh ~3 phút, Dolphin gõ Mode tay…): xem `context/31_OPEN_QUESTIONS.md` §4.
