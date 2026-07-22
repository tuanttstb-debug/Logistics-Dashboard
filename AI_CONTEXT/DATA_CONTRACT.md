# DATA CONTRACT — fact_CostLines → Google Sheets → Web

> Hợp đồng dữ liệu giữa engine Excel và web. **Nguồn chân lý cột: `context/12_DATA_DICTIONARY.md`.** File này chỉ mô tả cách dữ liệu đó lên Google Sheets và tới web.

## 1. Nguồn: kho `fact_CostLines`

**Nguồn thật (đã đối chiếu 2026-07-22 — QĐ-41):** sheet **`40_FACT_CostLines`** trong `data/Logistics_System.xlsx`, **cột A:X (24 cột), header ở DÒNG 9**, data dòng 10→ (T6/2026: ~1.480 dòng).
- **BỎ** dòng ghi chú 1–8 ("⚠ ĐỪNG GÕ TAY").
- **BỎ** khối **AF:AZ** (legend schema v2: `Cost Stage/Cost Bucket/Mã lô hàng/Is Overhead/Pay on behalf/…`) — chỉ có tiêu đề, **không** phải DB.

Mỗi dòng = **1 khoản phí** của 1 lô. Web **chỉ đọc**, không sửa. Không tái cài đặt logic phân loại trong JS — dữ liệu tới web đã gắn đủ nhãn.

### Cột (giữ nguyên tên gốc — QĐ: KHÔNG đổi tên cột)

| Cột | Kiểu | Ghi chú cho web |
|---|---|---|
| `Month` | Text `YYYY-MM` | Khóa lọc tháng. **Không** để JS ép thành Date. *(Hiện DB chỉ có `2026-06` — QĐ-42)* |
| `Forwarder` | Text | `DHL`, `FedEx Export`, `FedEx Import`, `Dolphin`, `VVMV`, `EI`, `Gia Bảo`. *(T6/2026: VVMV chiếm 63%)* |
| `B/L` | Text | Khóa lô. Đừng ép số |
| `INVOICE NO.` | Text | ⚠️ Tên cột thật **có dấu chấm**. Có thể trống |
| `CDS NO.` | Text | ⚠️ Tên cột thật **có dấu chấm**. Có thể trống |
| `Shipper` | Text | |
| `Consignee` | Text | Có thể null |
| `Origin` / `ORIGIN` | Text | |
| `Destination` / `DESTINATION` | Text | |
| `Mode` | Text | Thô — **không dùng** để phân loại ở web |
| `CW` | Number | Trọng lượng (kg) — cho đơn giá (Chặng 2) |
| `CBM` | Number | Thể tích — cho đơn giá (Chặng 2) |
| `Original Cost Name` | Text | Tên phí gốc |
| `Amount` | Number | Tiền gốc (có thể **âm** — giữ) |
| `Currency` | Text | Chỉ đúng chắc cho EI |
| `Exchange Rate` | Number | Tỷ giá riêng lô (EI) |
| `USD_Rate` | Number | Tỷ giá chung tháng |
| **`Amount_USD`** | Number | ★ **Số dùng cho MỌI báo cáo web** |
| `Standard Cost` | Text | `Freight`·`Origin LCC`·`Dest LCC`·`Trucking`·`Customs`·(tên phí overhead) |
| `FWD Column` | Text | `...FWD`; `Overhead FWD` = dấu hiệu overhead |
| `Mode chuẩn` | Text | `Air`·`Sea`·`Courier`·`Local`·null |
| `Import/Export` | Text | `Import`·`Export`·`Overhead`·`Third party`·null |
| `Route` | Text | Tên project · `Other` · null |
| `Loại hàng` | Text | `Material`·`Equipment & Toolings`·trống |

> ★ Web cộng/nhóm **luôn dùng `Amount_USD`**, không dùng `Amount`.

---

## 2. Đưa lên Google Sheets

- Tab tên **`fact_CostLines`**, hàng 1 = tiêu đề cột (khớp tuyệt đối tên trên).
- Quy trình tháng của owner (dạng thao tác text, không script):
  1. Excel: **Refresh All** → mở sheet `40_FACT_CostLines`.
  2. Chọn khối **cột A:X**, **từ dòng 9 (header) tới dòng cuối có dữ liệu** — KHÔNG lấy dòng 1–8, KHÔNG lấy khối AF:AZ.
  3. Copy → Google Sheets → tab `fact_CostLines`, ô A1 → dán **Paste values only** (Ctrl+Shift+V).
  4. Đảm bảo cột `Month`, `B/L`, `INVOICE NO.`, `CDS NO.` để **Plain text** (Format → Plain text) trước khi dán, tránh số khoa học / ngày.
  5. Không đổi thứ tự/tên cột.
- (Chi tiết từng nút bấm sẽ đưa vào SOP tháng khi Chặng 2 chốt.)

> **[ASSUMPTION-W02]** Đẩy dữ liệu là **thủ công copy/paste** mỗi tháng. Chưa tự động Excel→Sheets. Ghi ở `ASSUMPTION_LOG.md`.

---

## 3. API trả về web (JSON)

`GET ?action=facts&month=YYYY-MM`
```json
{
  "ok": true,
  "count": 1234,
  "rows": [
    {
      "Month": "2026-06", "Forwarder": "DHL", "B/L": "1Z...",
      "Amount_USD": 123.45, "Standard Cost": "Freight",
      "Import/Export": "Import", "Mode chuẩn": "Courier",
      "Route": "PURE", "Loại hàng": "Material"
    }
  ]
}
```

`GET ?action=meta`
```json
{ "ok": true,
  "months": ["2026-05","2026-06"],
  "forwarders": ["DHL","EI","..."],
  "routes": ["PURE","EFI","Other"] }
```

Tên trường JSON **giữ đúng tên cột gốc** (kể cả dấu `/` và tiếng Việt) để không phát sinh lớp ánh xạ. JS truy cập bằng `row["Import/Export"]`, `row["Mode chuẩn"]`.

---

## 4. Cạm bẫy chuyển tiếp (từ `12_DATA_DICTIONARY.md` §5)

| Bẫy | Ở web biểu hiện | Phòng |
|---|---|---|
| Số dài thành scientific | `B/L` sai | Cột mã để **Text** trên Sheets |
| `2026-06` thành ngày | Lọc tháng lệch | `Month` để **Plain text** trên Sheets |
| Amount âm bị bỏ | Tổng lệch | **Giữ** dòng âm; không filter `>0` |
| Trùng cột `Origin`/`ORIGIN` | Đọc nhầm field | Xác nhận tiêu đề Sheets trước khi map |
