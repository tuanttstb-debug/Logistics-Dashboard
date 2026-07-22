# 32 — Roadmap

**Cập nhật:** 2026-07-21

## 1. Trạng thái tổng thể

```
Tầng dữ liệu   ████████████████████  100%   ✅ QC sạch
Tầng báo cáo   ░░░░░░░░░░░░░░░░░░░░    0%   ⬜ ưu tiên #1
Tầng phân tích ░░░░░░░░░░░░░░░░░░░░    0%   ⬜ chờ tầng báo cáo
```

## 2. Việc còn lại — theo thứ tự ưu tiên

### 🔴 Ưu tiên 1 — Sheet 50: Báo cáo NGANG cho CEO

**Đây là mục tiêu cuối của dự án.**

Trước khi bắt tay, **phải hỏi người dùng** 4 câu ở `31_OPEN_QUESTIONS.md`: Q-02 (hiển thị Third party), Q-03 (chiều Route), Q-04 (so sánh kỳ), Q-05 (đơn giá).

Cấu trúc đã chốt: mỗi forwarder tách Import / Export / Overhead / Third party; trong Import/Export detail theo nhóm phí (Air/Sea freight, Customs, Trucking, Origin/Dest LCC); Overhead liệt kê theo từng tên phí gốc, mỗi phí 1 dòng; tất cả USD.

Chi tiết: `22_REPORTING_SPEC.md`.

### 🟠 Ưu tiên 2 — Sheet 70: Dashboard

KPI, biểu đồ, bộ lọc. Chưa thiết kế. Làm sau khi sheet 50 ổn định.

### 🟡 Ưu tiên 3 — Pay-on-behalf / Arising fee

Liên quan nhãn `Third party` + sheet 18 chi hộ. Cần chốt Q-06 trước.

### 🟡 Ưu tiên 4 — Ghi chú bảo trì VVMV & EI

DHL, FedEx, Dolphin đã có. Cần cho mục tiêu tự bảo trì 5 năm.

### ⚪ Ưu tiên 5 — SOP bàn giao hoàn chỉnh

Gộp: quy trình tháng + ghi chú từng forwarder + sổ tay xử lỗi. Phần lớn đã nằm ở `13_QC_AND_OPS.md`, cần rà lại với người dùng.

### ⚪ Tùy chọn

- Tối ưu hiệu năng (nếu 3 phút thành vấn đề) — **làm trên bản copy**
- Làm tròn `Amount_USD` về 2 số thập phân
- Bổ sung trường **ngày** vào staging (mở khóa phân tích lead time)

## 3. Sau khi xong tầng báo cáo — chuyển sang Kaizen

Thứ tự đề xuất:

1. Xác nhận số tháng dữ liệu đang có (G-01)
2. Chốt baseline và bộ KPI (`20_ANALYSIS_FRAMEWORK.md` mục 4)
3. Kiểm chứng giả thuyết H1–H7 bằng số thật
4. Chọn 2–3 sáng kiến khả thi nhất → ghi vào `21_INITIATIVE_TRACKER.md`
5. Đo và báo cáo

## 4. Đã hoàn thành

### Giai đoạn 1 — Nền tảng

- Architecture Review (chốt Architecture B)
- Dựng khung `Logistics_System.xlsx`, seed `Map_Cost`
- Ô khai báo tháng `ThangBaoCao`
- 6/6 forwarder vào kho — DHL → FedEx Exp → FedEx Imp → Dolphin → VVMV → EI
  - *(VVMV và EI người dùng tự hoàn thành)*
- Lọc `Amount ≠ 0`
- Quy đổi USD (`Amount_USD`) chạy đúng
- Sắp xếp thứ tự cột
- Ghi chú bảo trì DHL, FedEx, Dolphin

### Giai đoạn 2 — Tầng phân loại

- Cột `Mode chuẩn`
- Cột `Import/Export` (4 giá trị)
- Nhãn `Third party`
- `Route` — nhập (sheet 17, winner-take-all) và xuất (sheet 16, trực tiếp)
- `25_Update_Manual` — ghi đè tay
- `60_QC_Errors` — lưới an toàn, **hiện sạch**
- Overhead — sheet 19 + `stg_Overhead` + Gia Bảo
- `Loại hàng` — Material / Equipment & Toolings
- Tự-link B/L cho VVMV xuất (37/37 khớp, 0 lệch)

### Giai đoạn 3 — Quản trị context

- Bộ tài liệu context chuẩn tại `D:\Workspace\Logistics Ha`

## 5. Câu mở đầu cho phiên tiếp theo

> *"Tiếp tục dự án Logistics Cost. Context ở `D:\Workspace\Logistics Ha` — đọc `00_INDEX.md`, `01_PROJECT_CONTEXT.md`, `02_WAYS_OF_WORKING.md`, `32_ROADMAP.md` trước. Hôm nay làm Sheet 50 — báo cáo ngang cho CEO. Hỏi tôi 4 câu ở `31_OPEN_QUESTIONS.md` trước khi bắt đầu."*
