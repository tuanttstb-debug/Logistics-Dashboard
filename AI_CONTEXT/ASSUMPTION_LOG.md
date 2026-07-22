# ASSUMPTION LOG — Logistics Cost Dashboard

> Mọi giả định của web ghi ở đây để **xác nhận với owner**, không âm thầm coi là đúng.

| ID | Giả định | Rủi ro nếu sai | Trạng thái |
|---|---|---|---|
| **ASSUMPTION-W01** | GAS xử lý CORS/preflight OPTIONS đủ ổn cho browser dùng thật | Nếu host GitHub Pages (khác origin) có thể lỗi CORS → phải chuyển JSONP hoặc mở file cùng origin | ⬜ Chưa kiểm thực tế |
| **ASSUMPTION-W02** | Đẩy `fact_CostLines` Excel→Sheets là **thủ công copy/paste** mỗi tháng | Nếu owner muốn tự động → cần giải pháp khác (add-in / API), tăng độ phức tạp | ⬜ Chờ Q-W02 |
| **ASSUMPTION-W03** | Tên trường JSON giữ đúng tên cột gốc (kể cả `/`, tiếng Việt) | Nếu Sheets/GAS đổi tên khi export → JS đọc `undefined` | ⬜ Kiểm khi có dữ liệu thật |
| **ASSUMPTION-W04** | Web dùng **`Amount_USD`** cho mọi phép cộng, bỏ qua `Amount`/`Currency` | Nếu có dòng thiếu `Amount_USD` → tổng thiếu | ⬜ Cần QC ở web (đếm null) |
| **ASSUMPTION-W05** | Số dòng/tháng đủ nhỏ để tải hết một lần vào trình duyệt | Nếu quá lớn → chậm, cần phân trang server | ⬜ Chờ Q-W05 |

## Quy tắc
- Thêm giả định mới → thêm dòng, đặt trạng thái ⬜.
- Được owner xác nhận đúng → ✅ và (nếu là quyết định) ghi sang `context/30_DECISIONS_LOG.md`.
- Bị bác → ⛔ và ghi cách xử thay thế.
