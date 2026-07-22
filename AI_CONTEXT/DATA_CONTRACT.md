# DATA CONTRACT — fact_CostLines → Google Sheets → Web

> Hợp đồng dữ liệu giữa engine Excel và web. **Nguồn chân lý cột: `context/12_DATA_DICTIONARY.md`.** File này chỉ mô tả cách dữ liệu đó lên Google Sheets và tới web.

## 0. Cấu trúc DB Google Sheets (QĐ-43)

DB trên Google Sheets quản lý **toàn bộ raw data** + bảng fact. **Excel vẫn là engine** (Power Query tính `fact_CostLines`); Sheets là **KHO lưu** raw + fact, **không** tính toán. **Web CHỈ ĐỌC `fact_CostLines`.**

| Tab | Vai trò | Cột | Nguồn (Logistics_System.xlsx) |
|---|---|---|---|
| `10_DHL_Raw` | Raw debit DHL (Courier) | 17 | sheet 10 |
| `11_FedExExp_Raw` | Raw debit FedEx xuất | 16 | sheet 11 |
| `12_FedExImp_Raw` | Raw debit FedEx nhập | 17 | sheet 12 |
| `13_EI_Raw` | Raw debit EI/Expeditors (USD) | 40 | sheet 13 |
| `14_VVMV_Raw` | Raw debit VVMV | 22 | sheet 14 |
| `15_Dolphin_Raw` | Raw debit Dolphin | 19 | sheet 15 |
| `16_ExportMgmt_Raw` | Invoice↔B/L (bắc cầu VVMV xuất) | 5 | sheet 16 |
| `17_CustomsDetail_Raw` | Chi tiết tờ khai (Route/Loại hàng) | 31 | sheet 17 |
| `18_ImportPOB_Raw` | Import Pay-on-behalf | 7 | sheet 18 |
| `19_Overhead_Raw` | Chi phí chung (VND) | 4 | sheet 19 |
| **`40_FACT_CostLines`** | **Bảng fact — WEB ĐỌC TAB NÀY** (rebuildFact ghi ra) | 24 (A:X) | sheet 40 |

- Tab raw: **header 1 dòng** (bỏ khối ghi chú/hướng dẫn của file Excel), **tất cả cột để Plain text** để giữ nguyên vẹn mã (Invoice/AWB/B/L/CDS/tờ khai) và ngày.
- Tạo tự động bằng `backend/Setup.gs` → hàm `setupSheets()`. Idempotent, không xóa data.

### 0.1. Dựng fact bằng GAS (QĐ-44) — thay Power Query

`fact_CostLines` nay do **`backend/Transform.gs::rebuildFact()`** dựng TỪ raw, **không** dán từ Excel nữa:
- **Cơ chế batch:** owner chạy `rebuildFact()` (menu *Logistics DB → Rebuild fact*, hoặc editor) sau khi dán raw → GAS đọc raw + `22_Map_Cost` + `23_Map_ExchangeRate` + tháng ở **`00_Config!B1`**, tính, GHI ra tab `40_FACT_CostLines`. Web CHỈ ĐỌC fact (nhanh).
- **Phụ thuộc trên Sheets:** `22_Map_Cost` (Forwarder, Original Cost Name, Standard Cost, FWD Column), `23_Map_ExchangeRate` (Month, USD_Rate), `00_Config` (A1=`ThangBaoCao`, B1=`YYYY-MM`).
- **v1 (tăng dần):** courier DHL/FedEx Exp/Imp + Overhead; trường lõi `Amount_USD`·`Standard Cost`·`Mode chuẩn`·`Import/Export` (Route/Loại hàng null). VVMV/Dolphin/EI + Route/Loại hàng bổ sung sau.
- **Đối chiếu:** v1 = 481 dòng/$12.940,87; đủ 7 nguồn = 1.480/$44.062. Excel PQ giữ vai trò **tham chiếu logic** (`context/11_BUSINESS_RULES.md`).

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
