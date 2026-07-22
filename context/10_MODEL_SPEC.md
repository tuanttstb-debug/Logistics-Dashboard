# 10 — Đặc tả mô hình (Model Spec)

**File hệ thống:** `Logistics_System.xlsx`
**Kiến trúc:** "Architecture B" — lưu DỌC ở sheet 40, sinh báo cáo NGANG sau.

## 1. Luồng dữ liệu

```
[7 nguồn debit]  →  dán vào  →  [Sheet Raw 10-15, 19]
                                      │  (mỗi nguồn 1 query staging)
                                      ▼
   stg_DHL · stg_FedExExp · stg_FedExImp · stg_Dolphin · stg_VVMV · Stg_EI · stg_Overhead
                                      │  Append — Table.Combine (7 query)
                                      ▼
                              [ fact_CostLines ]  →  đổ ra  →  [Sheet 40_FACT_CostLines]
                                      │
                                      │  TẦNG CHUNG (áp 1 lần cho mọi nguồn):
                                      │  1. Lọc Amount ≠ 0
                                      │  2. Merge tỷ giá → Amount_USD
                                      │  3. Mode chuẩn
                                      │  4. Import/Export (gồm Overhead, Third party)
                                      │  5. Merge Route ×3 (Export/CDS/BL) + UpdateManual
                                      │  6. Merge Loại hàng ×2 (CDS/BL) + UpdateManual
                                      ▼
                    [Sheet 50 — báo cáo NGANG]  +  [Sheet 70 — Dashboard]   ← CHƯA LÀM
                                      ▲
                            [Sheet 60 — QC_Errors]  ← lưới an toàn
```

## 2. Danh sách sheet

| Sheet | Mục đích | Trạng thái |
|---|---|---|
| `00_HƯỚNG DẪN` | Hướng dẫn + **ô khai báo tháng B2** (named range `ThangBaoCao`, Text `YYYY-MM`) | ✅ |
| `10_DHL_Raw` | Dán debit DHL — tiêu đề 1 dòng sẵn | ✅ |
| `11_FedExExp_Raw` | Dán debit FedEx Export — bỏ đầu trang khi dán | ✅ |
| `12_FedExImp_Raw` | Dán debit FedEx Import — có cột STT | ✅ |
| `13_EI_Raw` | Dán debit EI — tiêu đề sạch tự gõ | ✅ |
| `14_VVMV_Raw` | Dán debit VVMV — tiêu đề sạch tự gõ | ✅ |
| `15_Dolphin_Raw` | Dán debit Dolphin — tiêu đề sạch tự gõ. **Phải gõ tay Mode** (LCL/FCL/AIR) | ✅ |
| `16_ExportMgmt_Raw` | Export Management: `INVOICE NO.`, `Tracking#`, `Route (Note cho FCA, DAP)` | ✅ |
| `17_CustomsDetail_Raw` | Chi tiết tờ khai — con người điền Dự án | ✅ |
| `18_POB_Import_Raw` | Chi hộ hàng nhập, case-by-case theo B/L | ⬜ chưa dùng |
| `19_Overhead_Raw` | Chi phí chung + Gia Bảo. Cột: Forwarder, B/L, Original Cost Name, Amount (VND) | ✅ |
| `20_Map_Forwarder` | Bản đồ forwarder (tiền tệ, ghi chú) | 📄 chỉ tham chiếu |
| `21_Map_Column` | Bản đồ đổi tên cột | 📄 chỉ tham chiếu |
| `22_Map_Cost` | **★ TỪ ĐIỂN TÊN PHÍ** — quan trọng nhất | ✅ |
| `23_Map_ExchangeRate` | Tỷ giá USD theo tháng: `Month, USD_Rate, Note` | ✅ |
| `24_List_Project` | Danh sách dự án hợp lệ — dùng kiểm chính tả Route ở QC | ✅ |
| `25_Update_Manual` | Bảng ghi đè tay, ưu tiên cao nhất | ✅ |
| `26_Map_LoaiHinh` | Từ điển mã loại hình tờ khai → Loại hàng | ✅ |
| `30_Route_byDeclaration` | Kết quả `Route_byCDS` | ✅ |
| `40_FACT_CostLines` | **KHO DỌC** — đầu ra chính | ✅ |
| `50_MERGE_SHIPMENT` | Báo cáo NGANG cho CEO | ⬜ **ưu tiên #1** |
| `60_QC_Errors` | Lưới an toàn | ✅ |
| `70_Dashboard` | Dashboard | ⬜ |

> ⚠️ `20_Map_Forwarder` và `21_Map_Column` **không query nào đọc** — chỉ là tài liệu tham khảo. Đã quyết định không tự động hóa đổi tên cột bằng `Map_Column` (xem QĐ-10).

## 3. Tên bảng Excel — TUYỆT ĐỐI KHÔNG ĐỔI

| Bảng | Sheet | | Bảng | Sheet |
|---|---|---|---|---|
| `Table1` | 10 — DHL | | `Table13` | 17 — Tờ khai |
| `Table7` | 11 — FedEx Export | | `OverheadRaw` | 19 — Overhead |
| `Table11` | 12 — FedEx Import | | `Map_Forwarder` | 20 |
| `Table8` ⚠️ | 13 — EI | | `Map_Column` | 21 |
| `Table14` | 14 — VVMV | | `Map_Cost` | 22 |
| `Table12` | 15 — Dolphin | | `Map_ExchangeRate` | 23 |
| `Table16` | 16 — ExportMgmt | | `List_Project` | 24 |
| | | | `UpdateManual` | 25 |
| | | | `MapLoaiHinh` | 26 |

> ⚠️ `Table8` (EI) tên như rác nhưng **đang được dùng** — đừng đổi.
> ⚠️ Cột `Route (Note cho FCA, DAP)` trên sheet 16 — **đừng đổi tên**. Đã từng đổi và làm hỏng cả chuỗi ExportMgmt → ExportBridge → fact.

## 4. Danh sách query

### Staging (7) — connection-only

`stg_DHL` · `stg_FedExExp` · `stg_FedExImp` · `stg_Dolphin` · `stg_VVMV` · `Stg_EI` · `stg_Overhead`

### Kho

`fact_CostLines` — load ra sheet 40. Append 7 staging → lọc Amount≠0 → USD → Mode chuẩn → Import/Export → merge Route ×3 + UpdateManual → merge Loại hàng ×2 + UpdateManual.

### Route

`Route_byCDS` (→ sheet 30) · `Route_byBL` · `Route_Export` · `ExportBridge_INV`

### Loại hàng

`LoaiHang_byCDS` · `LoaiHang_byBL` · `Map_LoaiHinh`

### Ghi đè & kiểm lỗi

`Update_Manual` · `QC_Errors` (→ sheet 60)

### Từ điển

`Map_Cost` · `Map_ExchangeRate` · `ThangBaoCao` · `ExportMgmt`

### ĐÃ XÓA — đừng dựng lại

- `Route_byInvoice8` — thay bằng route xuất lấy trực tiếp sheet 16
- `ExportBridge` — như trên

## 5. Khung xử lý mỗi forwarder (staging) — LUÔN theo thứ tự này

1. Nạp Raw (From Table/Range). **Xóa bước "Changed Type" tự sinh.**
2. Với forwarder tiêu đề nhiều dòng: đã chuẩn hóa tiêu đề sạch ở Raw trước khi nạp.
3. Lọc dòng rác (Total / Grand Total / overhead).
4. **Lật dọc (Unpivot)** các cột chi phí → `Original Cost Name` + `Amount`.
5. Đổi tên `Attribute → Original Cost Name`, `Value → Amount`.
6. **Thêm cột `Forwarder` — TRƯỚC merge.** Bắt buộc.
7. **Merge 2 cột** `(Original Cost Name + Forwarder)` với `Map_Cost` → expand `Standard Cost` + `FWD Column`.
8. Thêm `Month` (đọc ô khai báo tháng).
9. Ép cột mã (`B/L`, `CDS No`) về **Text**.
10. **Choose Columns** — giữ đúng bộ cột chuẩn.
11. Đặt **Connection-only**.
12. **Append** vào `fact_CostLines`.

## 6. Bộ cột giữ cho từng forwarder

| Forwarder | Bộ cột |
|---|---|
| **DHL** | `Month, B/L, Shipper, Consignee, Origin, Destination, CW, Original Cost Name, Amount, Standard Cost, FWD Column, Forwarder` |
| **FedEx Exp/Imp** | như DHL |
| **Dolphin** | `Month, B/L, Shipper, CW, Original Cost Name, Amount, Standard Cost, FWD Column, Forwarder` + đã vá thêm `CDS No` (và `Mode`/`CBM` nếu có). Không có Consignee/Origin/Destination |
| **VVMV** | `Month, B/L, Invoice No, CDS No, Shipper, Destination, Mode, CW, CBM, Original Cost Name, Amount, Standard Cost, FWD Column, Forwarder` |
| **EI** | `Month, B/L, Mode, CW, CBM, Currency, Exchange Rate, Original Cost Name, Amount, Standard Cost, FWD Column, Forwarder` — bỏ cột `Expeditors inv` vì 1 ô chứa 2 invoice |
| **Overhead** | `Forwarder, B/L, Original Cost Name, Amount` + Month, sau merge Map_Cost |

## 7. Quy tắc Append

- Append khớp theo **TÊN cột**, không theo vị trí.
- **Thiếu cột = OK** (tự bù null). **Lệch tên = LỖI** (xé đôi cột).
- Tên phải khớp **từng ký tự**, phân biệt HOA/thường và khoảng trắng.
- Thêm nguồn mới = chỉ thêm tên query vào `Table.Combine`.

## 8. Xử lý cột B/L đặc thù VVMV

| Loại lô | Quy tắc B/L |
|---|---|
| Import | HBL — giữ nguyên |
| Local (cột B = "Local") | thay bằng **CDS No** |
| Export (cột B = "Export") | **tự động** dò invoice → `Tracking#` qua `ExportBridge_INV` |

Đã **Trim** cột B/L để bỏ khoảng trắng thừa (dữ liệu có `"Export "`).

## 9. Hiệu năng

Refresh hiện mất **~3 phút**, nguyên nhân là bước merge `ExportBridge_INV` nằm **trước** Unpivot trong `stg_VVMV`.

Đã cân nhắc `Table.Buffer` và gộp query đọc sheet 17, nhưng **quyết định KHÔNG làm** (QĐ-26) vì rủi ro làm gãy file đang chạy đúng. Nếu 3 phút trở thành vấn đề → tối ưu **trên bản copy**.
