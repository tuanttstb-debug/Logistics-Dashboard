# PHỤ LỤC CẬP NHẬT — PHIÊN LÀM VIỆC (tiếp nối Tài liệu Bàn giao)

> Dán phần này vào **cuối** Project Handover gốc. Nó ghi lại mọi thay đổi/bổ sung trong phiên này.
> Khi có mâu thuẫn giữa phụ lục này và bản gốc → **ưu tiên phụ lục** (đây là trạng thái mới nhất).

---

## 19. CẬP NHẬT LỚN TRONG PHIÊN NÀY

### 19.1. Tổng quan những gì đã làm

Phiên này đã hoàn thiện phần lớn tầng xử lý dữ liệu của `fact_CostLines`. Thứ tự đã làm:
**Mode chuẩn → Import/Export → Third party → Route (nhập + xuất) → UpdateManual → QC_Errors → Overhead → Loại hàng (NVL/Equipment) → tự-link B/L cho VVMV xuất.**
Kết quả: QC sạch, kho `fact_CostLines` đủ trường cho báo cáo. Chưa làm: Sheet 50 (báo cáo ngang), Sheet 70 (dashboard), pay-on-behalf / arising fee.

### 19.2. Cột `Mode chuẩn` (mới)

Thêm ở tầng chung `fact_CostLines`. Công thức (case-insensitive cho Dolphin):
```
if [Forwarder] = "DHL" or [Forwarder] = "FedEx Export" or [Forwarder] = "FedEx Import" then "Courier"
else if [Mode] = null then null
else if Text.Contains(Text.Lower([Mode]), "air") then "Air"
else if Text.Contains(Text.Lower([Mode]), "sea") or Text.Lower([Mode]) = "lcl" or Text.Lower([Mode]) = "fcl" then "Sea"
else if Text.Lower([Mode]) = "cpn" or Text.Contains(Text.Lower([Mode]), "courier") then "Courier"
else if Text.Lower([Mode]) = "tc" or Text.Contains(Text.Lower([Mode]), "local") then "Local"
else null
```
- **Dolphin**: cột Mode gốc là **số pallet** (`1PLT`…), KHÔNG phải phương thức. Người dùng phải **gõ tay** `LCL`/`FCL`/`AIR` vào sheet 15 mỗi tháng.
- VVMV token: AIR/LCL/FCL/CPN/TC. EI: `air import`/`sea export`…

### 19.3. Cột `Import/Export` (mới) — có 4 giá trị

Import · Export · **Overhead** · **Third party**. Công thức (thứ tự quan trọng):
```
if [#"FWD Column"] = "Overhead FWD" then "Overhead"
else if ([Forwarder]="DHL" or [Forwarder]="FedEx Export" or [Forwarder]="FedEx Import") and [ORIGIN]<>null and [DESTINATION]<>null and [ORIGIN]<>"VN" and [DESTINATION]<>"VN" then "Third party"
else if [Forwarder]="FedEx Export" then "Export"
else if [Forwarder]="FedEx Import" then "Import"
else if [Forwarder]="DHL" then (if [DESTINATION]="VN" then "Import" else if [ORIGIN]="VN" then "Export" else null)
else if [Forwarder]="EI" then (theo chữ "import"/"export" trong Mode)
else if [Forwarder]="VVMV" or [Forwarder]="Dolphin" then (theo số tờ khai: "1"→Import, "3"→Export)
else null
```
**Luật Import/Export theo hãng:** FedEx theo tên hãng; DHL theo tuyến VN; EI theo chữ trong Mode; VVMV/Dolphin theo tiền tố số tờ khai (1=nhập, 3=xuất).

### 19.4. Nhãn `Third party` (mới — THAY một quyết định cũ)

**⚠ Thay đổi quyết định:** Quyết định cũ *"DHL/FedEx cả 2 đầu đều không VN → vẫn đặt Import"* đã bị **THAY** bằng:
> DHL/FedEx, cả `ORIGIN` lẫn `DESTINATION` đều khác `"VN"` → **`Import/Export = "Third party"`**.
- Chỉ áp cho DHL/FedEx (điều kiện Forwarder chặn sẵn — VVMV/Dolphin/EI không có ORIGIN nên phải chặn, nếu không sẽ gán nhầm hàng loạt).
- Bản chất: hàng **không phải của công ty**. Không thuộc Material/Equipment. Sau này báo cáo ở pay-on-behalf (nếu đòi được tiền) hoặc arising fee (nếu không).
- **Route của Third party mặc định = `"Other"`** (tự động, không phải điền tay).

### 19.5. Cột `Route` — hoàn chỉnh, VÀ ĐỔI THIẾT KẾ hàng xuất

**Route hàng NHẬP:** winner-take-all từ sheet 17 (`Table13`):
- `Route_byCDS` (sheet 30): mỗi tờ khai → Route có tổng số lượng lớn nhất (hòa → Trị giá NT lớn nhất). Dùng cho VVMV/Dolphin.
- `Route_byBL`: cùng luật, khóa theo B/L. Dùng cho EI/FedEx/DHL nhập (không có CDS trong debit).

**⚠ Route hàng XUẤT — ĐỔI THIẾT KẾ:** trước đây dò qua invoice → tờ khai. Nay **lấy TRỰC TIẾP cột Route của sheet 16** (`Route_Export`), khóa **B/L = Tracking#**. Lý do: sheet 16 phủ đủ cả lô Sample (không có tờ khai). **Đã XÓA `Route_byInvoice8` và `ExportBridge`** (không còn dùng).

**Thứ tự ưu tiên cột Route cuối trong fact** (bước `Added Custom6`, tên cột `Route_new`):
```
if [#"FWD Column"] = "Overhead FWD" then null
else [#"Update_Manual.Route"] ?? [Route_Export] ?? [Route_CDS] ?? [Route_BL] ?? (if [#"Import/Export"]="Third party" then "Other" else null)
```
*(Ghi chú: `[Route]` trong công thức thực tế là cột đã gộp Route_Export/CDS/BL từ các bước merge trước — thứ tự hiệu dụng: UpdateManual → Export → CDS → BL → Third-party mặc định.)*

**Chuẩn hóa dữ liệu Route (trong `Route_Export`):**
- `Transfer` → đổi thành `Other`.
- `x` và ô trống → thành `null` (không có route).
- Lệch hoa/thường (`Agiga`/`Ford`) → sửa tay ở nguồn sheet 16.

### 19.6. `25_Update_Manual` (mới) — bảng ghi đè tay, ưu tiên CAO NHẤT

- Bảng Excel `UpdateManual`, 5 cột máy đọc: `B/L`, `Route`, `Import/Export`, `Mode`, `Loại hàng` (cột khác bỏ qua nhờ `MissingField.UseNull`).
- **Mỗi B/L đúng 1 dòng** (query `Table.Distinct` theo B/L — nhiều dòng thì chỉ lấy dòng đầu).
- Quy trình: copy bảng lỗi từ sheet 60 → Paste **Values** → **xóa trắng 4 cột** → điền lại đúng ô cần → Refresh.
- **⚠ Lỗi từng gặp:** dán nguyên giá trị từ QC mà không xóa trắng → giá trị "Import" cũ đè chết nhãn "Third party" tự động. **Bắt buộc xóa trắng trước khi điền.**

### 19.7. `60_QC_Errors` (mới) — lưới an toàn

Query đọc `fact_CostLines`, liệt kê dòng lỗi + cột `QC_Issue`. Nạp ra sheet 60. Các lỗi bắt:
Phí chưa map · Chưa xác định Import/Export · Không có tờ khai (Import mà thiếu Loại hàng) · Chưa có Route · Route lạ (không có trong `List_Project`) · Mode chưa chuẩn hóa.
**Cố ý BỎ QUA:** dòng Overhead (`FWD Column="Overhead FWD"`); lô Third party (Route tự Other); hàng xuất (không cần Loại hàng).

### 19.8. Overhead — chi phí chung (mới)

- **Định nghĩa:** chi phí không thuộc lô nào (lệ phí hải quan nộp gộp cả tháng, phí nâng hạ, báo cáo quyết toán).
- **Nguồn:** sheet mới `19_Overhead_Raw` (bảng `OverheadRaw`, cột: Forwarder, B/L, Original Cost Name, Amount (VND)). Query `stg_Overhead` chuẩn hóa + merge Map_Cost + gắn Month, rồi **Append vào `fact_CostLines`** (Table.Combine giờ có 7 query, thêm `stg_Overhead`).
- **Nhận diện:** dấu hiệu duy nhất là **`FWD Column = "Overhead FWD"`** trong `Map_Cost` (không dùng cột cờ Yes). 4 dòng đã thêm vào Map_Cost với `Standard Cost` = tên phí tiếng Anh riêng (Customs administration fee, Settlement report fee, Lifting fee) — cố ý KHÔNG gộp vào Customs/Trucking, để hiện dòng riêng ở báo cáo tổng/theo-FWD.
- **Xử lý ở fact:** overhead → `Import/Export = "Overhead"`; và **Route + Loại hàng bị ép về `null`** (chèn `if [#"FWD Column"]="Overhead FWD" then null else …` vào đầu cả 2 công thức Route và Loại hàng).
- **⚠ Bẫy đã xử:** overhead có B/L (Gia Bảo) sẽ khớp Route_byBL/LoaiHang_byBL và bị cuốn vào project — đã chặn bằng công thức trên. Nhờ đó **được tự do điền B/L** ở sheet 19 (để lưu vết), không sợ cuốn nhầm.
- **Gia Bảo:** nhà cung cấp thứ 7 (chuyên nâng hạ hàng nặng), một dòng phí duy nhất, hiển thị tên riêng "Gia Bảo". Nhập chung sheet 19, không dựng staging riêng.
- Tất cả overhead là **VND** → quy USD bằng tỷ giá chung sheet 23.

### 19.9. Cột `Loại hàng` (mới) — Nguyên vật liệu vs Equipment & Toolings

- **Nguồn:** `Mã loại hình` tờ khai (sheet 17), qua từ điển mới `26_Map_LoaiHinh` (bảng `MapLoaiHinh`).
- **Quy tắc:** E11, E15 → **Material**; E13, G13, G51 → **Equipment & Toolings**; các mã xuất (E42/B13/G23/B11/H21/B12/G61) → trống; **A21, H11 → CHƯA quyết định** (để trống, xử khi phát sinh).
- **Bảng tra:** `LoaiHang_byCDS` (mỗi tờ khai 1 mã, không cần winner-take-all) và `LoaiHang_byBL`. B/L nào lẫn 2 nhóm (một B/L nhiều tờ khai khác loại) → để trống (luật (c): người dùng điền tay qua UpdateManual). Thực tế `LH_CDS` đứng trước `LH_BL` nên các lô có CDS tự khớp đúng, không cần điền tay.
- **Chỉ áp cho hàng nhập.** Hàng xuất/Overhead/Third party để trống theo thiết kế.
- Lô nhập không có tờ khai (hàng third-party đi qua VN, hàng mẫu…) → QC báo "Không có tờ khai" để người dùng tự quyết.

### 19.10. Tự-link B/L cho VVMV hàng xuất (mới — thay việc gõ tay)

- **Trước:** người dùng gõ tay số B/L cho lô xuất VVMV.
- **Nay:** `stg_VVMV` tự dò invoice → vận đơn qua bảng cầu mới `ExportBridge_INV` (invoice-chuẩn-hóa → Tracking#, lấy từ sheet 16). Luật cột B/L nâng cấp: `Local`→CDS No; **trống→Tracking# theo invoice**; còn lại giữ nguyên.
- Đã kiểm: 37/37 lô xuất khớp đúng số B/L đang gõ tay (0 lệch). Một invoice chỉ ứng 1 vận đơn (an toàn).
- **⚠ Hiệu năng:** bước này (merge trước Unpivot) làm Refresh chậm lên ~3 phút. Đã cân nhắc tối ưu (Table.Buffer / gộp query đọc sheet 17) nhưng **quyết định KHÔNG làm** vì rủi ro làm gãy file đang chạy đúng. Chấp nhận 3 phút.

### 19.11. Chuẩn hóa số invoice (dùng cho route xuất & link B/L VVMV)

Công thức chuẩn hóa (bỏ tiền tố `UHAN-`, cắt đuôi `-N`):
```
let s = Text.Replace(Text.From([INVOICE NO.]), "UHAN-", "")
in Text.Trim(if Text.Contains(s, "-") then Text.BeforeDelimiter(s, "-", {0, RelativePosition.FromEnd}) else s)
```
- `UHAN-INV06764-1` → `INV06764`; `E01066-1` → `E01066`; `E01067` → `E01067`.
- Áp cho: `Route_Export`(gián tiếp), `ExportBridge_INV`. (Đã bỏ cách "lấy 8 ký tự cuối" vì mong manh với đuôi `-N`.)

---

## 20. DANH SÁCH QUERY & SHEET HIỆN TẠI

### Query đang chạy (theo vai trò)
- **Staging (7):** `stg_DHL`, `stg_FedExExp`, `stg_FedExImp`, `stg_Dolphin`, `stg_VVMV`, `Stg_EI`, `stg_Overhead`.
- **Kho:** `fact_CostLines` (Append 7 staging → lọc Amount≠0 → USD → Mode chuẩn → Import/Export → merge Route ×3 + UpdateManual → merge Loại hàng ×2 + UpdateManual).
- **Route:** `Route_byCDS`(→sheet 30), `Route_byBL`, `Route_Export`, `ExportBridge_INV`.
- **Loại hàng:** `LoaiHang_byCDS`, `LoaiHang_byBL`, `Map_LoaiHinh`.
- **Ghi đè tay:** `Update_Manual`.
- **Kiểm lỗi:** `QC_Errors` (→sheet 60).
- **Từ điển:** `Map_Cost`, `Map_ExchangeRate`, `ThangBaoCao`, `ExportMgmt`.
- **ĐÃ XÓA:** `Route_byInvoice8`, `ExportBridge` (thay bằng route xuất theo sheet 16).

### Tên bảng Excel (KHÔNG đổi)
`Table1`(10-DHL) · `Table7`(11-FedExExp) · `Table11`(12-FedExImp) · `Table8`(13-EI, ⚠ tên như rác nhưng đang dùng) · `Table14`(14-VVMV) · `Table12`(15-Dolphin) · `Table16`(16-ExportMgmt) · `Table13`(17-Tờ khai) · `OverheadRaw`(19) · `Map_Forwarder`(20) · `Map_Column`(21) · `Map_Cost`(22) · `Map_ExchangeRate`(23) · `List_Project`(24) · `UpdateManual`(25) · `MapLoaiHinh`(26).

### Ghi chú kỹ thuật
- Cột `Route (Note cho FCA, DAP)` trên sheet 16 — **đừng đổi tên** (đã từng đổi làm hỏng cả chuỗi ExportMgmt → ExportBridge → fact).
- `Map_Forwarder` (20) và `Map_Column` (21): **không query nào đọc** — chỉ là tài liệu tham khảo.
- Đã có tài liệu riêng: **"Ghi chú từng sheet"** và **"Checklist mỗi tháng"** (dán vào file cho người dùng cuối).

---

## 21. QUYẾT ĐỊNH MỚI CHỐT TRONG PHIÊN (bổ sung mục 11 gốc)

1. Third party THAY luật "cả 2 đầu không VN → Import"; chỉ áp DHL/FedEx; Route mặc định "Other".
2. Route hàng xuất lấy trực tiếp sheet 16 (B/L=Tracking#), bỏ đường tờ khai/invoice cho xuất.
3. `Transfer`→`Other`, `x`→trống (xử trong query `Route_Export`); hoa/thường sửa ở nguồn.
4. Overhead nhận diện bằng `FWD Column="Overhead FWD"`; Standard Cost = tên phí tiếng Anh riêng; Route & Loại hàng luôn trống; được phép điền B/L.
5. Loại hàng: E11/E15→Material; E13/G13/G51→Equipment & Toolings; A21/H11 chưa quyết; B/L lẫn nhóm → điền tay (nhưng CDS đứng trước nên hiếm khi cần).
6. Tự-link B/L VVMV xuất qua invoice; chấp nhận Refresh ~3 phút, không tối ưu (giữ ổn định).
7. UpdateManual: mỗi B/L 1 dòng; bắt buộc xóa trắng trước khi điền.
8. Pay-on-behalf và arising fee: để giai đoạn sau.

---

## 22. VIỆC CÒN LẠI (cập nhật roadmap)

1. **Sheet 50 — Báo cáo NGANG cho CEO** (ưu tiên cao nhất, mục tiêu cuối). Cấu trúc mong muốn: mỗi forwarder tách **Import / Export / Overhead / Third party**; trong Import/Export detail theo nhóm phí (Air/Sea freight, Customs, Trucking, Origin/Dest LCC); Overhead liệt kê theo từng tên phí gốc (mỗi phí 1 dòng); tất cả USD.
2. **Sheet 70 — Dashboard.**
3. **Pay-on-behalf / Arising fee** (liên quan Third party + sheet 18 chi hộ).
4. (Tùy chọn) tối ưu hiệu năng nếu 3 phút trở thành vấn đề — làm trên bản copy.
5. Ghi chú bảo trì VVMV/EI (đã có tài liệu "Ghi chú từng sheet").

---

## 23. NẾU TIẾP TỤC Ở CHAT MỚI (cập nhật mục 18 gốc)

Câu mở đầu gợi ý: *"Tiếp tục dự án Logistics Cost. Đã xong: Mode chuẩn, Import/Export, Third party, Route (nhập từ sheet 17 / xuất từ sheet 16), Loại hàng, Overhead, UpdateManual, QC_Errors, tự-link B/L VVMV. QC sạch. Việc tiếp theo: Sheet 50 — báo cáo ngang cho CEO."*

Đọc kèm: Project Handover gốc + phụ lục này + file "Ghi chú từng sheet" + "Checklist mỗi tháng".
