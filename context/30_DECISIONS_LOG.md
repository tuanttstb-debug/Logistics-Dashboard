# 30 — Nhật ký quyết định

> **Quy tắc:** không xóa quyết định cũ. Nếu bị thay, đánh dấu `⛔ SUPERSEDED` và trỏ tới quyết định mới.
> Trước khi đổi bất kỳ quy tắc nào, đọc file này để biết vì sao nó đang như vậy.

**Ký hiệu:** ✅ đang hiệu lực · ⛔ đã bị thay thế

---

## Giai đoạn 1 — Kiến trúc & nền tảng (Handover gốc, mục 11)

| ID | Quyết định | Lý do | TT |
|---|---|---|---|
| **QĐ-01** | **Architecture B**: lưu DỌC ở sheet 40, sinh báo cáo NGANG sau | Kho tái sử dụng được cho mọi báo cáo. Đã bác đề xuất "bỏ bảng giao dịch" từ ChatGPT | ✅ |
| **QĐ-02** | Mỗi forwarder = 1 query staging connection-only, theo khung chung; gộp bằng Append | Tách bạch, dễ thêm nguồn mới | ✅ |
| **QĐ-03** | **Khóa merge phí là KÉP** `(Original Cost Name + Forwarder)`; thêm Forwarder **TRƯỚC** merge | Cùng tên phí ở nhiều forwarder → merge 1 cột gây **nhân dòng ×3** (đã dính lỗi ở DHL) | ✅ |
| **QĐ-04** | Bộ cột chuẩn khớp tên **tuyệt đối** (hoa/thường/khoảng trắng). Thiếu cột → bù null; lệch tên → lỗi | Append khớp theo tên cột | ✅ |
| **QĐ-05** | **B/L là khóa lô**; Local dùng **CDS No**; VVMV Local dùng CDS No | Invoice có thể **trùng giữa các nhà cung cấp** → không an toàn làm khóa | ✅ |
| **QĐ-06** | **Báo cáo TÍNH CẢ VAT.** Bỏ cột `Include in Total` khỏi `Map_Cost`. VAT của phí nào gộp vào `Standard Cost` của phí đó | Báo cáo cũ đã tính VAT → giữ nhất quán | ✅ |
| **QĐ-07** | **"Pay on behalf" của forwarder** (Infrastructure fee, Local charge, Storage, Customs fee) = **chi phí thật** → map vào nhóm chuẩn (thường Dest LCC hoặc Customs) | Khác bản chất với "chi hộ charge lại bên khác" | ✅ |
| **QĐ-08** | **"Chi hộ charge lại bên khác"** = case-by-case ở sheet 18 theo B/L; báo cáo chỉ hiện **số ĐÃ CHI**. Bỏ cột `Pay on Behalf Eligible` khỏi `Map_Cost` | Là thuộc tính case-by-case, không cố định theo loại phí | ✅ |
| **QĐ-09** | `Map_Cost` chỉ chứa cái **cố định**: Forwarder, Original Cost Name, Standard Cost, FWD Column, Notes. Người dùng là chủ từ điển, không đổi tên cột tiêu đề | Ổn định cấu trúc, tự do nội dung | ✅ |
| **QĐ-10** | **Không tự động hóa đổi tên cột bằng `Map_Column`.** Giữ sheet 21 làm tài liệu tham chiếu | Với 6 forwarder, đổi tay 4–5 cột/forwarder một lần khi xây đơn giản hơn dựng cơ chế map | ✅ |
| **QĐ-11** | Tên phí: **giữ 1 tên chuẩn**, không liệt kê nhiều biến thể phòng xa | Dễ nhân dòng. Dựa vào QC_Errors để bắt tên lạ | ✅ |
| **QĐ-12** | **Lọc `Amount ≠ 0`** ở tầng chung; **giữ dòng âm** | Dòng âm là giảm giá/điều chỉnh, có ý nghĩa | ✅ |
| **QĐ-13** | Ô khai báo tháng: B2 sheet 00, named `ThangBaoCao`, Text `YYYY-MM`; query connection-only, **đã xóa Changed Type** | Tránh `2026-06` bị ép thành ngày | ✅ |
| **QĐ-14** | **Xóa bước "Changed Type" tự sinh** ở mọi query | Ép số dài thành scientific, ép chữ thành ngày | ✅ |
| **QĐ-15** | **Ép cột mã (B/L, CDS No) về Text** | Tránh số khoa học | ✅ |
| **QĐ-16** | Forwarder tiêu đề nhiều dòng (Dolphin/VVMV/EI): **gõ tiêu đề sạch tay ở Raw**. Tiêu đề 1 dòng (DHL/FedEx): đổi tên trong query | Đơn giản, dễ bảo trì hơn xử merged header trong PQ | ✅ |
| **QĐ-17** | Tiền tệ: báo cáo USD. EI dùng **tỷ giá riêng từng lô** cho 2 phí VND (`PHÍ CHỨNG TỪ`, `PHÍ LÀM HÀNG`); các forwarder khác dùng tỷ giá chung sheet 23. Cột `Currency` chỉ cần đúng cho EI | EI debit chủ yếu USD, có tỷ giá riêng trên debit | ✅ |
| **QĐ-18** | **Route winner-take-all:** dự án có **Qty lớn nhất** thắng; hòa → **Trị giá NT** lớn nhất. Con người điền Dự án tay, máy chọn quán quân | Một lô nhiều mã hàng thuộc nhiều dự án | ✅ |
| **QĐ-19** | Bộ cột giữ cho từng forwarder (xem `10_MODEL_SPEC.md` mục 6). Bỏ cột `Expeditors inv` của EI | 1 ô chứa 2 invoice → không dùng làm khóa được | ✅ |
| **QĐ-20** | VAT theo tỷ lệ khác nhau: DHL/FedEx Export **8%**; FedEx Import **5.26%**; map vào nhóm phí tương ứng | Thực tế debit | ✅ |
| **QĐ-05b** | ⛔ VVMV Export: **người dùng tự điền B/L bằng tay** trước khi dán; query khỏi merge ExportMgmt | Lúc đó Invoice ExportMgmt = 8 ký tự cuối của Invoice VVMV → phức tạp | ⛔ **THAY bởi QĐ-26** |
| **QĐ-18b** | ⛔ Route hàng **Export** gắn qua **Invoice** | Debit export chỉ có Invoice | ⛔ **THAY bởi QĐ-22** |
| **QĐ-21a** | ⛔ DHL/FedEx cả 2 đầu đều không VN → **vẫn đặt Import** | Chưa nhận ra đây là hàng của bên thứ ba | ⛔ **THAY bởi QĐ-21** |

---

## Giai đoạn 2 — Tầng phân loại (Phụ lục, mục 21)

| ID | Quyết định | Lý do | TT |
|---|---|---|---|
| **QĐ-21** | **`Third party`**: DHL/FedEx, cả `ORIGIN` lẫn `DESTINATION` đều khác `"VN"` → `Import/Export = "Third party"`. Chỉ áp DHL/FedEx. Route mặc định `"Other"` | Bản chất là hàng **không phải của công ty**, không thuộc Material/Equipment. Phải chặn theo Forwarder vì VVMV/Dolphin/EI **không có cột ORIGIN** → không chặn sẽ gán nhầm hàng loạt | ✅ **thay QĐ-21a** |
| **QĐ-22** | **Route hàng xuất lấy TRỰC TIẾP cột Route của sheet 16**, khóa B/L = Tracking#. Bỏ đường tờ khai/invoice cho hàng xuất. **Đã xóa** `Route_byInvoice8` và `ExportBridge` | Sheet 16 phủ đủ cả **lô Sample** (không có tờ khai) — đường cũ không phủ được | ✅ **thay QĐ-18b** |
| **QĐ-23** | Chuẩn hóa Route: `Transfer` → `Other`; `x` và ô trống → `null` (xử trong `Route_Export`); lệch hoa/thường (`Agiga`, `Ford`) **sửa tay ở nguồn sheet 16** | Sửa ở nguồn để dữ liệu gốc cũng sạch | ✅ |
| **QĐ-24** | **Overhead** nhận diện bằng `FWD Column = "Overhead FWD"` (không dùng cột cờ Yes). `Standard Cost` = tên phí tiếng Anh riêng, **không gộp** vào Customs/Trucking. Route & Loại hàng **luôn null**. **Được phép điền B/L** | Một dấu hiệu duy nhất, ít chỗ sai. Giữ tên phí riêng để hiện dòng riêng ở báo cáo CEO. Ép null để chặn bẫy overhead có B/L bị cuốn vào project | ✅ |
| **QĐ-25** | **Loại hàng**: E11/E15 → Material; E13/G13/G51 → Equipment & Toolings; mã xuất → trống; **A21/H11 chưa quyết định**. B/L lẫn 2 nhóm → để trống, điền tay (CDS đứng trước nên hiếm khi cần). **Chỉ áp hàng nhập** | Nguồn tin cậy nhất là mã loại hình tờ khai | ✅ |
| **QĐ-26** | **Tự-link B/L cho VVMV xuất** qua `ExportBridge_INV` (invoice chuẩn hóa → Tracking#). **Chấp nhận Refresh ~3 phút, KHÔNG tối ưu** | Kiểm 37/37 lô khớp, 0 lệch; một invoice chỉ ứng 1 vận đơn. Không tối ưu vì **rủi ro làm gãy file đang chạy đúng** > lợi ích tiết kiệm 3 phút | ✅ **thay QĐ-05b** |
| **QĐ-27** | **`UpdateManual`: mỗi B/L đúng 1 dòng** (`Table.Distinct`); **bắt buộc xóa trắng 4 cột trước khi điền** | Đã dính lỗi: dán nguyên giá trị từ QC → `"Import"` cũ **đè chết** nhãn `"Third party"` tự động | ✅ |
| **QĐ-28** | **Pay-on-behalf và arising fee: để giai đoạn sau** | Ưu tiên sheet 50 trước | ✅ |
| **QĐ-29** | Chuẩn hóa invoice: bỏ tiền tố `UHAN-`, cắt đuôi `-N`. **Bỏ cách "lấy 8 ký tự cuối"** | Cách cũ mong manh với đuôi `-N` | ✅ |
| **QĐ-30** | `Mode chuẩn` dùng **case-insensitive**; **Dolphin phải gõ tay** LCL/FCL/AIR mỗi tháng | Cột Mode gốc của Dolphin là **số pallet** (`1PLT`), không phải phương thức | ✅ |

---

## Giai đoạn 3 — Quản trị context

| ID | Quyết định | Lý do | TT |
|---|---|---|---|
| **QĐ-31** | Thư mục chuẩn của dự án: **`D:\Workspace\Logistics Ha`** | Một chỗ duy nhất, không phân mảnh | ⛔ **THAY bởi QĐ-36** |
| **QĐ-32** | Context tách **2 tầng**: kỹ thuật (10–13) và phân tích (20–22), cộng nền chung (00–09) và quản trị (30–32) | Tránh lẫn việc sửa model với việc phân tích số | ✅ |

---

## Giai đoạn 4 — Đảo trục sang Web (2026-07-22)

| ID | Quyết định | Lý do | TT |
|---|---|---|---|
| **QĐ-33** | **Đảo phạm vi:** bổ sung một **web app dashboard** (tầng báo cáo cho CEO) vào dự án, đẩy lên **Git** giống dự án mẫu `SHTD-Dashboard`. Excel + Power Query **GIỮ nguyên** vai trò *engine dữ liệu* (kho `fact_CostLines`); web chỉ là **tầng trình bày/dashboard**, KHÔNG thay thế tầng dữ liệu Excel. **Thay** điều lệ "web app ngoài phạm vi" ở `01_PROJECT_CONTEXT.md` §2 và `02_WAYS_OF_WORKING.md` §1 | Người dùng chủ động yêu cầu (2026-07-22); SHTD-Dashboard là mẫu web đã vận hành thực tế, tái dùng được concept | ✅ **thay điều lệ phạm vi gốc (01 §2 / 02 §1)** |
| **QĐ-34** | **Kiến trúc web giống SHTD:** SPA (vanilla HTML/CSS/JS, không framework nặng), backend **Google Apps Script**, DB **Google Sheets**. Kho `fact_CostLines` được đẩy từ Excel lên Google Sheets làm nguồn cho web đọc | Đã có mẫu vận hành thật; không cần server riêng; hợp mục tiêu tự bàn giao. Bác phương án web tĩnh đọc export vì người dùng chọn hướng SHTD | ✅ |
| **QĐ-35** | **Rủi ro ghi nhận (chưa chặn):** web app + GAS là **kỹ năng mới** so với năng lực Excel/Power Query hiện tại và mục tiêu tự bảo trì 5 năm. Chấp nhận có chủ đích; bù lại bằng bộ `AI_CONTEXT` chi tiết + `WORKING_RULE` + `GITHUB_WORKFLOW` để dễ bàn giao | Đảm bảo minh bạch đánh đổi, không âm thầm tăng nợ bảo trì | ✅ |
| **QĐ-36** | **Gộp toàn bộ dự án về một repo:** `D:\Workspace\Production\Logistics-Dashboard`. Cấu trúc: `AI_CONTEXT/` (doc web) · `context/` (16 file 00–32 của engine Excel) · `data/` (`Logistics_System.xlsx` + `_source`) · `index.html`/`assets`/`backend` (mã web). Thư mục cũ `D:\Workspace\Logistics Ha` đã bị xóa | Một repo Git duy nhất, không phân mảnh giữa doc-Excel và mã-web; phân tầng rõ tài liệu / dữ liệu / mã | ✅ **thay QĐ-31** |
| **QĐ-37** | **(Trả lời Q-02)** Khối **Third party** hiển thị như **khối thứ 4 riêng trong mỗi forwarder** (ngang hàng Import/Export/Overhead) và **CÓ cộng vào tổng** chi phí | Người dùng chọn (2026-07-22). Giữ nhất quán cấu trúc Sheet 50. Khi làm pay-on-behalf (QĐ-28) có thể xem lại cách tách số thu | ✅ |
| **QĐ-38** | **(Trả lời Q-03)** Báo cáo theo **Route** đặt ở **trang/tab riêng "Theo Route"** (bảng Route × Import/Export/Tổng USD). Báo cáo chính vẫn theo Forwarder | Tránh làm bảng chính rối/rộng; Route là góc nhìn thứ 2 | ✅ |
| **QĐ-39** | **(Trả lời Q-04)** Báo cáo/dashboard **CÓ so sánh kỳ:** cột tháng hiện tại · tháng liền trước · % thay đổi · **lũy kế năm (YTD)** | CEO cần theo dõi xu hướng. Ràng buộc: cần đủ nhiều tháng dữ liệu (G-01) — tháng thiếu thì hiển thị "—" | ✅ |
| **QĐ-40** | **(Trả lời Q-05)** **Chưa làm đơn giá** (USD/kg, USD/CBM) ở Chặng 2 | Tránh rủi ro de-dup CW/CBM sai từ đầu; để dành phân tích Kaizen. Bác phương án làm ngay | ✅ |
| **QĐ-41** | **DB của web = sheet `40_FACT_CostLines` (cột A:X, header dòng 9) của `Logistics_System.xlsx`.** 24 cột A:X là nguồn; **bỏ** dòng ghi chú 1–8 và khối legend **AF:AZ** (schema v2 chưa dùng). File `Logistics record JUN 2026.xlsx` là **hệ thủ công AS-IS**, chỉ là nguồn ghi chép — **không** đẩy lên web | Đối chiếu file thật 2026-07-22: A:X khớp DATA_CONTRACT/context. AF:AZ (Cost Stage/Cost Bucket/POB) chỉ có tiêu đề, không data → là dự kiến nâng cấp, không phải DB hiện tại | ✅ |
| **QĐ-42** | **Chấp nhận fact chỉ có 1 tháng (2026-06).** So sánh kỳ/YTD (QĐ-39) hiển thị "—" khi thiếu tháng trước; tự có khi các tháng sau được refresh + dán thêm. Lịch sử cũ (2025-01→2026-05) nằm ở file record, **chưa** backfill | Ưu tiên chạy thật tháng hiện tại; bác backfill (tốn công) và bác ghép 2 nguồn (phức tạp) ở giai đoạn này | ✅ |
| **QĐ-43** | **DB Google Sheets quản lý TOÀN BỘ raw data:** tạo 11 tab RAW (10–19, giữ đúng header gốc `Logistics_System.xlsx`) **+ giữ** tab `fact_CostLines`. **Excel vẫn là engine** (Power Query tính fact) — Sheets chỉ là KHO lưu raw + fact, **không** tính toán trên Sheets. Web **vẫn chỉ đọc** `fact_CostLines` | Bác phương án "chỉ giữ fact" (mất raw gốc) và bác phương án "dựng lại transform trong GAS" (rất lớn, lệch QĐ-34/35). Giữ raw trên cloud để lưu trữ/tra cứu tập trung, web không gãy | ✅ |

---

## Mẫu ghi quyết định mới

```
| **QĐ-43** | [Nội dung quyết định] | [Lý do — nhất là lý do BÁC bỏ phương án khác] | ✅ |
```

Nếu thay quyết định cũ: sửa dòng cũ thành `⛔ **THAY bởi QĐ-xx**`, giữ nguyên nội dung và lý do gốc.
