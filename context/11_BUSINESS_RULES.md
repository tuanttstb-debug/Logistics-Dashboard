# 11 — Quy tắc nghiệp vụ & công thức chuẩn

> Đây là **nguồn chân lý** về logic phân loại. Nếu code trong file Excel khác file này → một trong hai sai, phải làm rõ trước khi sửa.
> Mọi thay đổi ở đây phải ghi log vào `30_DECISIONS_LOG.md`.

---

## 1. Phân loại phí — `Standard Cost`

**Cách làm:** không đổi tay từng dòng. **Lật dọc (Unpivot) → merge `Map_Cost`.**

- **Khóa merge KÉP:** `(Original Cost Name + Forwarder)`, Join Kind **Left Outer**.
- **Vì sao 2 cột:** cùng tên phí (ví dụ "NET CHARGE") xuất hiện ở nhiều forwarder trong `Map_Cost`. Merge chỉ theo tên phí → 1 dòng khớp nhiều dòng → **nhân dòng** (đã dính lỗi ×3 ở DHL).
- Phải thêm cột `Forwarder` **TRƯỚC** merge, và chọn 2 cột **đúng thứ tự** ở cả hai bảng.
- Sau merge expand lấy `Standard Cost` + `FWD Column` (bỏ tick prefix).
- `Standard Cost` null = tên phí chưa có trong `Map_Cost` → QC bắt → thêm dòng vào từ điển.

**5 nhóm chuẩn:** `Freight` · `Origin LCC` · `Dest LCC` · `Trucking` · `Customs`

**Cấu trúc `Map_Cost`:** `Forwarder | Original Cost Name | Standard Cost | FWD Column | Notes`
Đã **bỏ** 2 cột `Include in Total` và `Pay on Behalf Eligible` (xem QĐ-06, QĐ-08).

**Nguyên tắc tên phí:** giữ **1 tên chuẩn** cho mỗi phí. **Không** liệt kê trước nhiều biến thể phòng xa — dễ nhân dòng. Tên lạ để rơi vào QC.

---

## 2. Quy đổi USD — `Amount_USD`

Merge `fact_CostLines` với `Map_ExchangeRate` theo `Month` (Text `YYYY-MM`), expand `USD_Rate`. Rồi:

```
if [Forwarder] = "EI" then
  (if [Currency] = "USD" then [Amount] else [Amount] / [Exchange Rate])
else [Amount] / [USD_Rate]
```

- EI + USD → giữ nguyên
- EI + VND → chia **tỷ giá riêng từng lô** (`Exchange Rate` trên debit EI). Áp cho 2 phí: `PHÍ CHỨNG TỪ`, `PHÍ LÀM HÀNG`
- Còn lại (VND) → chia **tỷ giá chung tháng** (`USD_Rate`)

> ⚠️ **Thứ tự bước quan trọng:** bước đổi tên / ép kiểu cột phải nằm **TRƯỚC** bước tính `Amount_USD`. Đã dính lỗi `field 'Exchange Rate' not found` do khoảng trắng thừa + bước rename nằm sau.

**Lọc:** `Amount ≠ 0` đặt ở tầng chung `fact_CostLines`. **Giữ dòng âm** (giảm giá / điều chỉnh).

**VAT:** tính cả VAT vào chi phí. VAT của phí nào → gộp vào `Standard Cost` của phí đó. DHL/FedEx Export = 8%; FedEx Import = 5.26%. EI có 1 cột VAT lump → map theo quyết định người dùng.

---

## 3. `Mode chuẩn`

```
if [Forwarder] = "DHL" or [Forwarder] = "FedEx Export" or [Forwarder] = "FedEx Import" then "Courier"
else if [Mode] = null then null
else if Text.Contains(Text.Lower([Mode]), "air") then "Air"
else if Text.Contains(Text.Lower([Mode]), "sea") or Text.Lower([Mode]) = "lcl" or Text.Lower([Mode]) = "fcl" then "Sea"
else if Text.Lower([Mode]) = "cpn" or Text.Contains(Text.Lower([Mode]), "courier") then "Courier"
else if Text.Lower([Mode]) = "tc" or Text.Contains(Text.Lower([Mode]), "local") then "Local"
else null
```

Case-insensitive để chịu được dữ liệu Dolphin.

**Token theo nguồn:**

| Nguồn | Giá trị Mode gốc |
|---|---|
| VVMV | `AIR` / `LCL` / `FCL` / `CPN` / `TC` |
| EI | `air import` / `sea export`... |
| DHL, FedEx | không có Mode → gán cứng `Courier` |
| **Dolphin** | ⚠️ cột Mode gốc là **số pallet** (`1PLT`...), **KHÔNG phải phương thức** |

> ⚠️ **Dolphin:** người dùng phải **gõ tay** `LCL` / `FCL` / `AIR` vào sheet 15 **mỗi tháng**. Đây là thao tác thủ công bắt buộc trong checklist.

---

## 4. `Import/Export` — 4 giá trị

**Thứ tự điều kiện rất quan trọng, không được đảo.**

```
if [#"FWD Column"] = "Overhead FWD" then "Overhead"
else if ([Forwarder]="DHL" or [Forwarder]="FedEx Export" or [Forwarder]="FedEx Import")
        and [ORIGIN]<>null and [DESTINATION]<>null
        and [ORIGIN]<>"VN" and [DESTINATION]<>"VN" then "Third party"
else if [Forwarder]="FedEx Export" then "Export"
else if [Forwarder]="FedEx Import" then "Import"
else if [Forwarder]="DHL" then (if [DESTINATION]="VN" then "Import"
                                else if [ORIGIN]="VN" then "Export"
                                else null)
else if [Forwarder]="EI" then (theo chữ "import"/"export" trong Mode)
else if [Forwarder]="VVMV" or [Forwarder]="Dolphin" then (theo số tờ khai: "1"→Import, "3"→Export)
else null
```

**Luật theo hãng:**

| Hãng | Căn cứ |
|---|---|
| FedEx | Theo **tên hãng** (FedEx Export → Export, FedEx Import → Import) |
| DHL | Theo **tuyến VN** (DESTINATION=VN → Import; ORIGIN=VN → Export) |
| EI | Theo **chữ** "import"/"export" trong cột Mode |
| VVMV / Dolphin | Theo **tiền tố số tờ khai**: `1` = nhập, `3` = xuất |

---

## 5. `Third party`

**Định nghĩa:** DHL/FedEx, cả `ORIGIN` lẫn `DESTINATION` đều khác `"VN"` → hàng **không phải của công ty**.

**Ràng buộc quan trọng:** điều kiện `Forwarder` phải chặn sẵn — chỉ áp cho DHL/FedEx. VVMV/Dolphin/EI **không có cột ORIGIN** nên nếu không chặn sẽ **gán nhầm hàng loạt**.

**Hệ quả:**

- Không thuộc Material hay Equipment → `Loại hàng` để trống
- `Route` mặc định `"Other"` — **tự động**, không phải điền tay
- QC **cố ý bỏ qua** lô Third party
- Sau này báo cáo ở pay-on-behalf (nếu đòi được tiền) hoặc arising fee (nếu không)

> ⚠️ Quy tắc này **THAY THẾ** quyết định cũ *"DHL/FedEx cả 2 đầu đều không VN → vẫn đặt Import"*. Xem QĐ-21.

---

## 6. `Route`

### 6.1. Nguyên tắc winner-take-all (hàng NHẬP)

Từ sheet 17 (`Table13`): mỗi lô → chọn Route có **tổng số lượng lớn nhất**. Hòa → **Trị giá NT (customs value) lớn nhất**.

Con người điền cột Dự án tay ở báo cáo tờ khai; máy chỉ gom nhóm và chọn quán quân.

| Query | Khóa | Dùng cho |
|---|---|---|
| `Route_byCDS` (→ sheet 30) | Số tờ khai | VVMV, Dolphin |
| `Route_byBL` | B/L | EI, FedEx, DHL nhập (không có CDS trong debit) |

### 6.2. Hàng XUẤT — lấy trực tiếp sheet 16

`Route_Export`: lấy thẳng cột Route của sheet 16, khóa **B/L = Tracking#**.

**Lý do đổi:** sheet 16 phủ đủ cả lô Sample (không có tờ khai). Cách cũ (dò invoice → tờ khai) không phủ được. Xem QĐ-22.

### 6.3. Công thức Route cuối (bước `Added Custom6`, cột `Route_new`)

```
if [#"FWD Column"] = "Overhead FWD" then null
else [#"Update_Manual.Route"] ?? [Route_Export] ?? [Route_CDS] ?? [Route_BL]
     ?? (if [#"Import/Export"]="Third party" then "Other" else null)
```

**Thứ tự ưu tiên hiệu dụng:**

```
UpdateManual  →  Route_Export  →  Route_CDS  →  Route_BL  →  "Other" (nếu Third party)  →  null
```

> Ghi chú: `[Route]` trong công thức thực tế là cột đã gộp Route_Export/CDS/BL từ các bước merge trước.

### 6.4. Chuẩn hóa dữ liệu Route (xử trong `Route_Export`)

| Giá trị nguồn | Xử lý |
|---|---|
| `Transfer` | → đổi thành `Other` |
| `x` | → `null` (không có route) |
| ô trống | → `null` |
| Lệch hoa/thường (`Agiga`, `Ford`) | **sửa tay ở nguồn sheet 16** |

`24_List_Project` dùng để kiểm chính tả tên dự án ở QC.

---

## 7. `Loại hàng` — Material vs Equipment & Toolings

**Nguồn:** cột `Mã loại hình` của tờ khai (sheet 17), tra qua từ điển `26_Map_LoaiHinh` (bảng `MapLoaiHinh`).

| Mã loại hình | Loại hàng |
|---|---|
| `E11`, `E15` | **Material** |
| `E13`, `G13`, `G51` | **Equipment & Toolings** |
| `E42`, `B13`, `G23`, `B11`, `H21`, `B12`, `G61` (mã xuất) | *(trống)* |
| `A21`, `H11` | ⚠️ **CHƯA QUYẾT ĐỊNH** — để trống, xử khi phát sinh |

**Bảng tra:** `LoaiHang_byCDS` (mỗi tờ khai 1 mã, **không cần** winner-take-all) và `LoaiHang_byBL`.

**Xử lý xung đột:** B/L nào lẫn 2 nhóm (một B/L nhiều tờ khai khác loại) → **để trống**, người dùng điền tay qua UpdateManual. Thực tế `LH_CDS` đứng trước `LH_BL` nên các lô có CDS tự khớp đúng, hiếm khi cần điền tay.

**Phạm vi:** **chỉ áp cho hàng nhập.** Hàng xuất / Overhead / Third party để trống theo thiết kế.

Lô nhập không có tờ khai (hàng third-party đi qua VN, hàng mẫu...) → QC báo *"Không có tờ khai"* để người dùng tự quyết.

---

## 8. `Overhead`

**Định nghĩa:** chi phí không thuộc lô nào — lệ phí hải quan nộp gộp cả tháng, phí nâng hạ, phí báo cáo quyết toán.

**Nguồn:** sheet `19_Overhead_Raw`, bảng `OverheadRaw`, cột: `Forwarder`, `B/L`, `Original Cost Name`, `Amount (VND)`.
Query `stg_Overhead` chuẩn hóa → merge `Map_Cost` → gắn `Month` → **Append vào `fact_CostLines`**.

**Nhận diện:** dấu hiệu **duy nhất** là `FWD Column = "Overhead FWD"` trong `Map_Cost`. **Không dùng** cột cờ Yes/No.

**Tên phí:** 4 dòng đã thêm vào `Map_Cost` với `Standard Cost` = tên phí tiếng Anh riêng — *Customs administration fee*, *Settlement report fee*, *Lifting fee*. **Cố ý KHÔNG gộp** vào Customs/Trucking, để hiện dòng riêng ở báo cáo.

**Xử lý ở fact:**

- `Import/Export = "Overhead"`
- `Route` và `Loại hàng` bị **ép về `null`** — chèn `if [#"FWD Column"]="Overhead FWD" then null else ...` vào **đầu** cả 2 công thức

> ⚠️ **Bẫy đã xử:** overhead có B/L (Gia Bảo) sẽ khớp `Route_byBL` / `LoaiHang_byBL` và **bị cuốn vào project**. Đã chặn bằng công thức trên. Nhờ đó **được tự do điền B/L** ở sheet 19 để lưu vết, không sợ cuốn nhầm.

**Gia Bảo:** nhà cung cấp thứ 7, chuyên nâng hạ hàng nặng, một dòng phí duy nhất, hiển thị tên riêng "Gia Bảo". Nhập chung sheet 19, **không dựng staging riêng**.

**Tiền tệ:** tất cả overhead là VND → quy USD bằng tỷ giá chung sheet 23.

---

## 9. `25_Update_Manual` — ghi đè tay, ưu tiên CAO NHẤT

Bảng Excel `UpdateManual`, **5 cột máy đọc**: `B/L`, `Route`, `Import/Export`, `Mode`, `Loại hàng`.
Các cột khác bị bỏ qua nhờ `MissingField.UseNull`.

**Ràng buộc:** **mỗi B/L đúng 1 dòng.** Query dùng `Table.Distinct` theo B/L — nhiều dòng thì **chỉ lấy dòng đầu**.

**Quy trình chuẩn:**

1. Copy bảng lỗi từ sheet 60
2. Paste **Values** vào sheet 25
3. **Xóa trắng 4 cột** (Route, Import/Export, Mode, Loại hàng)
4. Điền lại **đúng ô cần**
5. Refresh

> ⚠️ **Lỗi từng gặp:** dán nguyên giá trị từ QC mà **không xóa trắng** → giá trị `"Import"` cũ **đè chết** nhãn `"Third party"` tự động sinh. **Bắt buộc xóa trắng trước khi điền.**

---

## 10. Tự-link B/L cho VVMV hàng xuất

**Trước:** người dùng gõ tay số B/L cho lô xuất VVMV.
**Nay:** `stg_VVMV` tự dò invoice → vận đơn qua bảng cầu `ExportBridge_INV` (invoice-chuẩn-hóa → `Tracking#`, lấy từ sheet 16).

**Luật cột B/L nâng cấp:**

| Trường hợp | B/L |
|---|---|
| `Local` | CDS No |
| **trống** | **Tracking# theo invoice** |
| còn lại | giữ nguyên |

**Đã kiểm:** 37/37 lô xuất khớp đúng số B/L đang gõ tay — **0 lệch**. Một invoice chỉ ứng 1 vận đơn (an toàn).

**Chi phí:** bước merge này nằm trước Unpivot → Refresh chậm lên ~3 phút. Chấp nhận (QĐ-26).

---

## 11. Chuẩn hóa số invoice

Dùng cho Route xuất và link B/L VVMV. Bỏ tiền tố `UHAN-`, cắt đuôi `-N`:

```
let s = Text.Replace(Text.From([INVOICE NO.]), "UHAN-", "")
in Text.Trim(if Text.Contains(s, "-")
             then Text.BeforeDelimiter(s, "-", {0, RelativePosition.FromEnd})
             else s)
```

| Đầu vào | Kết quả |
|---|---|
| `UHAN-INV06764-1` | `INV06764` |
| `E01066-1` | `E01066` |
| `E01067` | `E01067` |

Áp cho: `Route_Export` (gián tiếp), `ExportBridge_INV`.

> Đã **bỏ** cách "lấy 8 ký tự cuối" vì mong manh với đuôi `-N`.

---

## 12. Ba nghĩa của "Pay on behalf" — đừng lẫn

| Nghĩa | Bản chất | Xử lý |
|---|---|---|
| (a) Forwarder ứng hộ trả cảng/kho, đòi lại công ty | **Chi phí thật của công ty** | Map vào nhóm chuẩn (thường Dest LCC hoặc Customs) |
| (b) "POB" là một **cột phí dịch vụ riêng** của Dolphin | **Chi phí thật** | Map vào nhóm chuẩn |
| (c) Công ty trả hộ bên khác rồi **thu lại** | Case-by-case | Sheet 18; báo cáo chỉ hiện **số ĐÃ CHI**, không đưa số thu vào tổng chi phí |

Với (c): số thu thường **cao hơn** số chi = biên quản lý ẩn. Phân tích để sau.

---

## 13. Quy tắc kỹ thuật Power Query bắt buộc

1. **Xóa bước "Changed Type" tự sinh** ở mọi query — nó ép số dài thành scientific notation và ép chữ `2026-06` thành ngày.
2. **Ép cột mã (`B/L`, `CDS No`) về Text.**
3. `Month` = `ThangBaoCao[Column1]{0}`, ép **Text**, định dạng `YYYY-MM`.
4. Tên cột khớp **tuyệt đối** — hoa/thường/khoảng trắng.
5. Bước rename / ép kiểu phải nằm **TRƯỚC** bước dùng cột đó.
6. Đổi thứ tự cột: chuột phải tiêu đề → **Move**, không kéo thả.
