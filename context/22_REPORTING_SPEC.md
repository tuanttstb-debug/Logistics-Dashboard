# 22 — Đặc tả báo cáo (Sheet 50 & 70)

> Sheet 50 là **mục tiêu cuối** của dự án và là **ưu tiên #1** hiện tại.

## 1. Sheet 50 — Báo cáo NGANG cho CEO

### Nguyên tắc

Sinh từ kho dọc `fact_CostLines` bằng group/pivot. **Không** tính toán lại phân loại ở đây — mọi nhãn đã có sẵn trong kho.
Số dùng: **`Amount_USD`** (đã gồm VAT).

### Cấu trúc mong muốn (đã chốt trong phụ lục mục 22)

Mỗi forwarder tách thành 4 khối theo `Import/Export`:

```
FORWARDER A
├── Import
│   ├── Air freight / Sea freight        ← theo Standard Cost + Mode chuẩn
│   ├── Customs
│   ├── Trucking
│   ├── Origin LCC
│   └── Dest LCC
├── Export
│   └── (cùng cấu trúc nhóm phí)
├── Overhead
│   └── liệt kê theo TỪNG TÊN PHÍ GỐC — mỗi phí 1 dòng
│       (Customs administration fee / Settlement report fee / Lifting fee / ...)
└── Third party
    └── (chưa chốt cách hiển thị — xem 31_OPEN_QUESTIONS)
```

**Tất cả quy về USD.**

### Điểm cần lưu ý khi dựng

| Điểm | Yêu cầu |
|---|---|
| Freight tách Air/Sea | Kết hợp `Standard Cost = "Freight"` với `Mode chuẩn` |
| Overhead | **Không gộp** vào Customs/Trucking. Hiện dòng riêng theo `Standard Cost` (đã là tên phí tiếng Anh riêng) |
| Gia Bảo | Hiển thị tên riêng "Gia Bảo", nằm trong khối Overhead |
| Ghép lô nhiều forwarder | Group theo `B/L` từ kho dọc — một lô có dòng ở nhiều forwarder |
| VAT | Đã nằm trong `Amount_USD`, không cộng thêm |
| Dòng âm | Giữ (giảm giá/điều chỉnh) — sẽ tự trừ vào tổng |

### Chiều phân tích khả dụng (đã có sẵn trong kho)

`Month` · `Forwarder` · `Import/Export` · `Mode chuẩn` · `Route` · `Loại hàng` · `Standard Cost` · `FWD Column`

### `[CHƯA CHỐT]` trước khi dựng

1. Báo cáo theo **Route** đặt ở đâu — chiều thứ 2 trong cùng bảng, hay bảng riêng?
2. Khối **Third party** hiển thị thế nào? (liên quan pay-on-behalf)
3. Có cần cột **so sánh tháng trước** / lũy kế năm không?
4. Có cần chỉ số **đơn giá** (USD/kg, USD/CBM) trên báo cáo CEO không?

→ Xem `31_OPEN_QUESTIONS.md`.

---

## 2. Sheet 70 — Dashboard

Chưa thiết kế. Định hướng ban đầu: KPI + biểu đồ + bộ lọc.

Gợi ý nội dung (chờ xác nhận):

- Tổng chi phí tháng, so tháng trước, so cùng kỳ
- Cơ cấu theo `Standard Cost` (biểu đồ tròn/cột chồng)
- Cơ cấu theo `Forwarder`
- Xu hướng theo tháng
- Top Route theo chi phí
- Đơn giá xu hướng (USD/kg air, USD/CBM sea)

---

## 3. Pay-on-behalf & Arising fee (sheet 18) — giai đoạn sau

**Bối cảnh:** liên quan trực tiếp tới nhãn `Third party`.

| Trường hợp | Xử lý |
|---|---|
| Công ty trả hộ và **thu lại được** | **Pay-on-behalf** — báo cáo chỉ hiện **số ĐÃ CHI**, không đưa số thu vào tổng chi phí |
| Công ty trả hộ và **không thu lại được** | **Arising fee** — là chi phí thật |

**Ghi chú:** số thu thường **cao hơn** số chi = biên quản lý ẩn. Đây là một **hướng Kaizen tiềm năng** — xem `20_ANALYSIS_FRAMEWORK.md`.

Dữ liệu ở sheet `18_POB_Import_Raw`, gắn theo B/L, case-by-case.

---

## 4. Khi xuất báo cáo ra file khác (docx/pptx/xlsx)

Nếu cần làm deck hoặc báo cáo Word cho CEO từ dữ liệu này:

- **Đọc số từ bản export/copy**, không thao tác vào `Logistics_System.xlsx`
- Ghi rõ **kỳ báo cáo** và **tỷ giá** đã dùng
- Nêu rõ số đã gồm VAT
- Nếu có dòng âm hoặc điều chỉnh lớn → chú thích, đừng để CEO tự đoán
