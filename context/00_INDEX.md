# 00 — INDEX / Bản đồ context dự án Logistics Cost

> **File đọc ĐẦU TIÊN trong mọi phiên làm việc mới.**
> Mục đích: giữ một context ổn định, không phải kể lại lịch sử chat mỗi lần.

| | |
|---|---|
| **Dự án** | Logistics Cost — hệ thống báo cáo chi phí logistics (Excel + Power Query) |
| **Thư mục chuẩn** | `D:\Workspace\Production\Logistics-Dashboard` (đã gộp — QĐ-36) |
| **File hệ thống** | `data\Logistics_System.xlsx` |
| **Tài liệu context (file này)** | trong `context\` |
| **Dự án web** | doc ở `AI_CONTEXT\`, mã ở gốc repo |
| **Owner** | Tran The Tuan (tuantt.stb@gmail.com) |
| **Cập nhật context** | 2026-07-21 |
| **Nguồn dựng** | Project Handover (mục 1–18) + Phụ lục cập nhật (mục 19–23) |
| **Trạng thái** | Tầng dữ liệu xong, QC sạch. Tầng báo cáo (Sheet 50/70) chưa làm |

---

## 1. Bản đồ tài liệu

### Tầng 0 — Nền chung

| File | Nội dung | Khi nào đọc |
|---|---|---|
| `00_INDEX.md` | File này — bản đồ + quy ước | **Luôn luôn** |
| `01_PROJECT_CONTEXT.md` | Bối cảnh, mục tiêu, phạm vi, nguồn dữ liệu, trạng thái, nguyên tắc | **Luôn luôn** |
| `02_WAYS_OF_WORKING.md` | Hồ sơ người dùng + phong cách hướng dẫn bắt buộc | **Luôn luôn** |
| `09_GLOSSARY.md` | Từ điển thuật ngữ logistics, dự án, Power Query | Khi gặp term lạ |

### Tầng 1 — Kỹ thuật (mô hình dữ liệu)

| File | Nội dung | Khi nào đọc |
|---|---|---|
| `10_MODEL_SPEC.md` | Luồng dữ liệu, danh sách sheet/query/bảng, khung xử lý staging | Khi sửa/mở rộng model |
| `11_BUSINESS_RULES.md` | **Nguồn chân lý** — toàn bộ quy tắc + công thức M | Khi sửa logic phân loại |
| `12_DATA_DICTIONARY.md` | Định nghĩa từng cột, khóa & quan hệ, cạm bẫy dữ liệu | Khi phân tích hoặc debug |
| `13_QC_AND_OPS.md` | Checklist tháng, các lỗi QC, sổ tay lỗi Power Query | Khi chạy chu kỳ tháng |

### Tầng 2 — Phân tích & Kaizen

| File | Nội dung | Khi nào đọc |
|---|---|---|
| `20_ANALYSIS_FRAMEWORK.md` | Chiều phân tích, giả thuyết cost driver, KPI, nguyên tắc trung thực | Khi phân tích số liệu |
| `21_INITIATIVE_TRACKER.md` | Sáng kiến Kaizen — baseline/target/actual | Khi theo dõi tiết kiệm |
| `22_REPORTING_SPEC.md` | Đặc tả Sheet 50 (báo cáo CEO) và Sheet 70 (dashboard) | Khi build báo cáo/deck |

### Tầng 3 — Quản trị dự án

| File | Nội dung | Khi nào đọc |
|---|---|---|
| `30_DECISIONS_LOG.md` | 32 quyết định, có đánh dấu quyết định bị thay thế | **Trước khi đổi bất kỳ quy tắc nào** |
| `31_OPEN_QUESTIONS.md` | Câu hỏi chưa chốt, khoảng trống dữ liệu, nợ kỹ thuật | **Đầu mỗi phiên** |
| `32_ROADMAP.md` | Việc còn lại theo ưu tiên, việc đã xong | **Đầu mỗi phiên** |

---

## 2. Khởi động phiên làm việc mới

👉 **Mở `_PROMPT_MO_DAU.md`, copy Prompt A, dán vào đầu chat mới.** File đó có sẵn biến thể cho từng loại việc và prompt kết thúc phiên.

Bản rút gọn nếu vội:

> *"Tiếp tục dự án Logistics Cost. Context ở `D:\Workspace\Logistics Ha` — đọc `00_INDEX.md`, `01_PROJECT_CONTEXT.md`, `02_WAYS_OF_WORKING.md`, `32_ROADMAP.md`, `31_OPEN_QUESTIONS.md` trước, không quét cả thư mục. Tóm tắt trạng thái + kế hoạch trước khi làm. Không giả định — thiếu thì hỏi. Hôm nay tôi muốn làm: [việc cụ thể]."*

Tùy việc, đọc thêm:

| Việc | Đọc thêm |
|---|---|
| Sửa / mở rộng model | `10`, `11`, `30` |
| Chạy chu kỳ tháng | `13` |
| Debug lỗi | `13`, `12`, `11` |
| Phân tích số liệu | `12`, `20` |
| Làm báo cáo / deck | `22`, `20`, `12` |
| **Dựng Sheet 50** | `22`, `31` (phải hỏi Q-02→Q-05 trước) |

---

## 3. Ba điều tuyệt đối không được quên

1. ❌ **Không sửa `Logistics_System.xlsx` bằng openpyxl/pandas/script** — sẽ phá hủy Power Query. Chỉ đưa hướng dẫn text.
2. ❌ **Không đổi tên bảng Excel và tên cột nguồn** — đã từng làm gãy cả chuỗi query.
3. ✅ **Hướng dẫn từng bước, giải thích "tại sao", tiếng Việt, ngắn gọn** — người dùng phải tự bảo trì hệ thống 5 năm.

Chi tiết: `02_WAYS_OF_WORKING.md`.

---

## 4. Quy ước cập nhật context

1. **Quyết định mới → ghi vào `30_DECISIONS_LOG.md` ngay**, kèm lý do. Nếu thay quyết định cũ, KHÔNG xóa dòng cũ — đánh dấu `⛔ SUPERSEDED` và trỏ tới quyết định mới.
2. **Đổi quy tắc nghiệp vụ → sửa `11_BUSINESS_RULES.md`**, đồng thời ghi log ở `30`.
3. **Thêm cột/query → cập nhật `10` và `12`.**
4. **Câu hỏi chưa trả lời được → đẩy vào `31_OPEN_QUESTIONS.md`**, không tự suy đoán.
5. **Không sửa lịch sử** — các file là trạng thái hiện tại; lịch sử nằm ở `30`.

---

## 5. Độ đầy đủ của context

Bộ này hợp nhất **Handover gốc (mục 1–18)** và **Phụ lục (mục 19–23)**. Khi hai nguồn mâu thuẫn, **phụ lục thắng** — các quyết định bị thay đã được đánh dấu trong `30_DECISIONS_LOG.md`.

**Chưa có:** tài liệu "Ghi chú từng sheet" và "Checklist mỗi tháng" gốc. `13_QC_AND_OPS.md` được dựng lại từ nội dung 2 handover, có thể thiếu chi tiết thao tác — nên rà lại với người dùng.

Các khoảng trống khác được đánh dấu `[GAP]` trong từng file và tổng hợp ở `31_OPEN_QUESTIONS.md`.
