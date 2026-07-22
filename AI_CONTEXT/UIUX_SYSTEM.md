# UI/UX SYSTEM — Logistics Cost Dashboard

> ✅ **Chặng 2 (2026-07-22).** Q-02→Q-05 đã chốt. 4 trang đã hiện thực: Dashboard · Báo cáo CEO (forwarder) · Theo Route · Giới thiệu.

## Người dùng đích
- **CEO/BLĐ:** xem nhanh, chỉ đọc. Cần **con số lớn, rõ, ít nhiễu**; hiểu trong <30 giây.
- **Owner vận hành:** đổi bộ lọc, đối chiếu với Excel.

## Nguyên tắc UX
1. **Một câu trả lời mỗi màn hình.** Dashboard trả lời "tháng này tốn bao nhiêu, vào đâu".
2. **Số tiền luôn USD, có định dạng** (`$1,234`), không hiện số thô dài.
3. **Tăng chi phí = đỏ, giảm = xanh** (nhất quán, ngược lời/lỗ).
4. **Bộ lọc dính (sticky)** ở đầu; đổi lọc → mọi khối cập nhật.
5. **Trạng thái rỗng/không dữ liệu** phải nói rõ ("Chưa có dữ liệu tháng này — kiểm Google Sheets").
6. **Không lồng quá 2 cấp** menu; CEO không cần học.

## Bố cục dự kiến (khung)
```
┌─ Topbar: tiêu đề · chọn Tháng · nút Refresh · toggle theme ─┐
├─ Sidebar: Dashboard · Báo cáo CEO · (Route) · Giới thiệu   ┤
├─ KPI row: Tổng USD · Import · Export · Overhead · 3rd party │
├─ Biểu đồ: cơ cấu theo nhóm phí / theo forwarder            │
└─ Bảng báo cáo ngang (chi tiết) — cuộn ngang                │
```

## Trạng thái tải
- Skeleton/`Đang tải…` khi gọi API.
- Lỗi mạng → toast đỏ + nút "Thử lại".

## Accessibility
- Tương phản đạt WCAG AA ở cả 2 theme.
- Nút có `aria-label`; bảng có `<caption>`/`scope`.

## Đã chốt & hiện thực (Chặng 2)
- **Q-02:** Third party là KPI riêng + khối riêng trong mỗi forwarder, có vào tổng (QĐ-37).
- **Q-03:** Route là trang riêng "Theo Route" (QĐ-38).
- **Q-04:** so sánh kỳ ở cả KPI và bảng: tháng trước + % + YTD (QĐ-39).
- **Q-05:** đơn giá chưa làm (QĐ-40).

## Cách xem (dữ liệu mẫu)
Mở `index.html` — nếu chưa nối Google Sheets và `USE_MOCK=true` (mặc định), app hiển thị **dữ liệu mẫu** để xem toàn bộ UI. Toast nhắc "đang xem dữ liệu MẪU".
