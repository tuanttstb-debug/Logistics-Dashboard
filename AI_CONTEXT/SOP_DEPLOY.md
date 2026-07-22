# SOP — Đưa dữ liệu lên Google Sheets & Deploy backend (GAS)

> Hướng dẫn **từng bước, từng nút bấm**. Làm 1 lần khi cài đặt; hàng tháng chỉ lặp **Phần A bước A5–A7** (dán dữ liệu mới).
> DB = `40_FACT_CostLines` cột **A:X** (QĐ-41). Web **chỉ đọc**.

---

## PHẦN A — Tạo Google Sheet & dán dữ liệu

### A1. Tạo Sheet mới
1. Mở trình duyệt → vào **sheets.google.com** (đăng nhập tài khoản Google công ty).
2. Bấm ô **"Trống" (Blank)** để tạo bảng tính mới.
3. Bấm vào tên "Untitled spreadsheet" góc trên trái → gõ **`Logistics_DB`** → Enter.
> *Tại sao:* đây là "kho trung gian" để web đọc. Excel vẫn là nơi tính; Sheet chỉ chứa bản sao `fact_CostLines`.

### A2. Đặt tên tab đúng chuẩn
1. Dưới cùng, chuột phải tab **"Sheet1"** → **Rename** → gõ chính xác **`fact_CostLines`** → Enter.
> *Tại sao:* GAS tìm tab đúng tên này (`CONFIG.FACT_TAB`). Sai tên → không có dữ liệu.

> **⚡ Cách nhanh (thay A2–A3):** nếu đã dán `backend/Setup.gs` vào Apps Script (Phần B), chỉ cần chọn hàm **`setupSheets`** → ▶ Run. Nó **tự** tạo tab `fact_CostLines`, ghi 24 header mẫu, freeze dòng 1 và đặt Plain text cho cột khóa. Sau đó nhảy tới **A4** (lấy dữ liệu) rồi **A5** (dán đè lên header mẫu).

### A3. Định dạng cột chống lỗi số (LÀM TRƯỚC KHI DÁN)
1. Bấm chọn **cả cột A** (bấm chữ "A" trên đầu cột), giữ **Ctrl** bấm thêm đầu cột của **B/L, INVOICE NO., CDS NO.** *(tạm thời cứ chọn A, B, D, E — sẽ khớp sau khi dán)*. Đơn giản nhất: chọn **toàn bộ A:E**.
2. Menu **Format (Định dạng)** → **Number (Số)** → **Plain text (Văn bản thuần)**.
> *Tại sao:* `2026-06` dễ bị Sheet ép thành ngày; số vận đơn dài dễ thành `8.72E+11`. Ép Plain text trước là chặn tận gốc.

### A4. Lấy đúng vùng dữ liệu trong Excel (A:X, từ dòng 9)
1. Trong Excel, mở `data\Logistics_System.xlsx` → bấm **Data → Refresh All (Làm mới tất cả)**, đợi chạy xong (~3 phút).
2. Mở sheet **`40_FACT_CostLines`**.
3. Bấm chuột vào ô **`A9`** (ô chứa chữ "Month" — hàng tiêu đề thật).
4. Giữ **Ctrl + Shift**, bấm phím **↓** (mũi tên xuống) → chọn hết cột A tới dòng cuối.
5. Vẫn giữ **Ctrl + Shift**, bấm phím **→** (mũi tên phải) → vùng chọn mở rộng tới cột **X** rồi **dừng** (vì cột Y trống).
6. Bấm **Ctrl + C** để copy.
> *Tại sao:* vùng này đúng **A9:X\<dòng cuối\>** = 24 cột dữ liệu. Cột trống Y–AE tự chặn không cho quét nhầm sang khối legend AF:AZ; và bắt đầu từ dòng 9 để bỏ 8 dòng ghi chú "ĐỪNG GÕ TAY".

### A5. Dán vào Google Sheets (chỉ dán GIÁ TRỊ)
1. Sang tab `fact_CostLines`, bấm ô **`A1`**.
2. Bấm **Ctrl + Shift + V** (Paste values only — dán chỉ giá trị).
> *Tại sao:* dán thường sẽ kéo theo công thức/liên kết ổ mạng → hỏng. Chỉ cần **giá trị**.

### A6. Kiểm nhanh
1. Hàng 1 phải là 24 tiêu đề: `Month, Forwarder, B/L, INVOICE NO., CDS NO., … , Amount_USD, Route, Import/Export, Mode chuẩn, Loại hàng`.
2. Ô `A2` phải là `2026-06` (chữ, canh trái), không phải ngày.
> *Tại sao:* GAS đọc hàng 1 làm tên cột. Sai hàng 1 = sai toàn bộ.

### A7. (Hàng tháng) Cập nhật dữ liệu mới
- Tháng sau: Refresh All trong Excel → lặp **A4–A5** (xóa dữ liệu cũ trong tab trước rồi dán mới, hoặc dán đè từ A1). Web tự có thêm tháng → so sánh kỳ (QĐ-39) bắt đầu hiện số.

---

## PHẦN B — Deploy backend Apps Script

### B1. Mở trình soạn Apps Script
1. Vẫn trong Google Sheet `Logistics_DB` → menu **Extensions (Tiện ích mở rộng)** → **Apps Script**.
> *Tại sao:* gắn script vào đúng Sheet này để nó đọc được dữ liệu (`SpreadsheetApp.getActiveSpreadsheet`).

### B2. Tạo 4 file .gs khớp `backend/`
1. Trong Apps Script, file mặc định tên **`Code.gs`** đang mở → xóa hết nội dung mẫu, **dán** toàn bộ nội dung `backend/Code.gs`.
2. Bấm dấu **➕** cạnh "Files" → **Script** → đặt tên **`Config`** → dán nội dung `backend/Config.gs`.
3. Lặp lại tạo **`DataService`** (dán `backend/DataService.gs`), **`Utils`** (dán `backend/Utils.gs`) và **`Setup`** (dán `backend/Setup.gs` — script tạo tab tự động).
4. Bấm biểu tượng **💾 Save** (hoặc Ctrl+S).
> *Tại sao:* Apps Script gom tất cả file `.gs` thành một chương trình; tên file không cần đuôi `.gs` khi tạo.

### B3. Cấp quyền (chạy thử 1 lần)
1. Trên thanh công cụ, ô chọn hàm → chọn **`_selftest`** → bấm **Run (Chạy)**.
2. Hiện cửa sổ xin quyền → **Review permissions** → chọn tài khoản → "Advanced" → "Go to … (unsafe)" → **Allow**.
3. Xem **Execution log** hiện số dòng → OK.
> *Tại sao:* Google bắt cấp quyền đọc Sheet lần đầu. `_selftest` chỉ đọc, an toàn.

### B4. Deploy thành Web App
1. Góc trên phải bấm **Deploy (Triển khai)** → **New deployment (Triển khai mới)**.
2. Bấm bánh răng ⚙ cạnh "Select type" → chọn **Web app**.
3. Điền:
   - **Description:** `Logistics DB API v0.2`
   - **Execute as:** **Me (tôi)**
   - **Who has access:** **Anyone (Bất kỳ ai)**
4. Bấm **Deploy** → **Copy** cái **Web app URL** (dạng `https://script.google.com/macros/s/AKfy…/exec`).
> *Tại sao:* "Anyone" để web (khác domain) gọi được; "Execute as Me" để script dùng quyền của bạn đọc Sheet. URL này là địa chỉ API.

### B5. Kiểm API
1. Dán URL vào trình duyệt, thêm `?action=ping` ở cuối → Enter → phải thấy `{"ok":true,"version":"0.2.0"}`.
2. Thử `?action=meta` → thấy `months:["2026-06"]`, `forwarders`, `missingUsd:1`…
> *Tại sao:* xác nhận backend đọc đúng dữ liệu trước khi nối web.

---

## PHẦN C — Nối web với dữ liệu thật

### C1. Dán URL vào cấu hình
1. Mở `config/env.js` (bằng VS Code hoặc Notepad).
2. Dòng `GS_WEBAPP_URL: '',` → dán URL vào giữa 2 dấu nháy: `GS_WEBAPP_URL: 'https://script.google.com/macros/s/AKfy…/exec',`
3. Lưu file.
> *Tại sao:* web đọc biến này để gọi API. Khi có URL, web **tự bỏ** dữ liệu mẫu (`USE_MOCK`).

### C2. Mở web
1. Mở `index.html` bằng trình duyệt (nhấp đúp).
2. Không còn toast "DỮ LIỆU MẪU"; KPI hiện số thật tháng 6 (tổng ~$44,062).
3. Nếu thiếu `Amount_USD` → toast cảnh báo 1 dòng (đúng như QC).

### C3. Nếu gặp lỗi
| Triệu chứng | Cách xử |
|---|---|
| Trang trắng / "Lỗi tải dữ liệu" | Kiểm lại URL `env.js` đúng chưa; mở `?action=ping` xem sống không |
| Lỗi **CORS** trên Console | GET đơn giản tới GAS thường qua được (redirect có `Access-Control-Allow-Origin: *`). Nếu vẫn lỗi khi mở bằng `file://` → thử host bằng GitHub Pages, hoặc báo lại (Q-W01) |
| KPI trống nhưng ping OK | Kiểm tab tên đúng `fact_CostLines`, hàng 1 đúng tiêu đề |
| Số vận đơn thành `8.7E+11` | Cột chưa để Plain text — làm lại A3 rồi dán lại |

---

## Ghi chú
- **KHÔNG** commit `GS_WEBAPP_URL` thật nếu muốn giữ kín → có thể để trong `config/env.local.js` (đã có trong `.gitignore`). Hiện URL GAS "Anyone" không phải bí mật lớn, nhưng cân nhắc repo private.
- Mọi thay đổi phân loại/chi phí vẫn làm ở **Excel** (`context/11_BUSINESS_RULES.md`), rồi lặp Phần A. Web không sửa số.
