# TODO NEXT — Logistics Cost Dashboard

> Việc kế tiếp theo ưu tiên. Delta phiên 2026-07-22. Checklist ngắn ở `TODO.md`.

## 🔴 Ưu tiên 0 — BẢO MẬT lịch sử data
- [x] **Rewrite history + force-push (2026-08-06):** `git filter-repo` xóa `data/` (**4 file**) khỏi **toàn bộ 25 commit** + redact deployment-ID GAS (`env.js`→`REDACTED-ROTATED`). Force-push `75cab6a`→`9220231`. Verify history sạch. Backup bundle ở scratchpad. Xem `TECH_DEBT.md` TD-11 (resolved).
- [x] Gỡ `data/` khỏi tracking + `.gitignore` (push `ba780e2`) — nay lịch sử cũng đã sạch.
- [x] ~~Đổi repo Private~~ — **QĐ 2026-08-07: GIỮ PUBLIC** (GitHub Pages hosting bắt buộc). Đánh đổi: URL GAS public theo thiết kế → chuyển trọng tâm bảo mật sang **tầng GAS (TD-10)**.
- [ ] 🟠 **[USER/DEV] TD-10 — chốt kiểm soát data qua URL public:** thêm token GAS (chặn bot, không chặn xem source) HOẶC đổi kiến trúc backend có auth nếu data quá nhạy cho public.
- [x] ✅ **Rotate endpoint GAS (2026-08-07):** user redeploy *New deployment* → gửi URL `/exec` mới → đã dán lại `config/env.js`, verify `?action=ping` v0.3.0 + `?action=meta` 1479/$44.062,16 → app đọc data thật lại. **Còn:** đổi quyền GAS khỏi "Anyone" (TD-10); URL mới vẫn trong repo → chỉ an toàn nếu repo Private.
- [ ] 🔴 **[USER] GitHub Support:** yêu cầu purge **cached commits** (`8b008e6`, `d26e33a`) + gỡ mọi **fork** (force-push không xóa cache; repo từng public → giả định đã lộ).
- [ ] **[USER] Re-clone** mọi bản sao khác (toàn bộ SHA đã đổi).

## ✅ Ưu tiên 1 — Git (XONG)
- [x] `git init` + push `origin/main`. Dọn clone rỗng lồng nhau.

## 🔴 Ưu tiên 2 — Kết nối dữ liệu thật
- [x] **Xác định phạm vi DB** (QĐ-41/42): `40_FACT_CostLines` A:X, header dòng 9, 1 tháng (2026-06).
- [x] Hoàn thiện GAS BE (`Config`/`DataService`/`Code`/`Utils`) khớp scope; sửa tên cột thật.
- [x] Viết **`SOP_DEPLOY.md`** (tạo Sheet + dán A:X + deploy GAS + nối env.js).
- [x] Dán mã `backend/*.gs` vào Apps Script của Sheet; Deploy → Web app → copy `/exec` URL.
- [x] Dán URL vào `config/env.js` `GS_WEBAPP_URL` + `USE_MOCK: false`. `?action=ping` ✅.
- [x] Viết `backend/Setup.gs` (`setupSheets()`) — QĐ-43: tạo **11 tab RAW (10–19)** + `fact_CostLines`, header thật + Plain text.
- [ ] Dán `backend/Setup.gs` mới vào Apps Script (thay bản cũ) → **Chạy `setupSheets()`** (chọn hàm → ▶ Run → Allow). Kiểm 12 tab đã tạo; `?action=meta` hết báo "Không thấy tab".
- [x] (QĐ-43) Dán raw từng nguồn vào tab 10–19; dán map 22/23/24/26.
- [x] **(QĐ-44)** Viết `backend/Transform.gs::rebuildFact()` dựng `40_FACT_CostLines` TỪ raw (thay PQ). v1 courier+overhead. Đổi tên tab fact → `40_FACT_CostLines`. `Setup.gs` thêm `00_Config`.

## ✅ Ưu tiên 2b — rebuildFact courier + fix (XONG)
- [x] Chạy `rebuildFact()` courier+overhead; fix: validate tháng, `monthKey_`, `writeFact_` làm chủ tab (xóa+tạo), bỏ dư `INVOICE NO.` (§6), nút Đồng bộ web, deploy "New version".

## 🔴 Ưu tiên 2c — Phase A: port PQ đủ 6 nguồn + Route/Loại hàng/POB (XONG code)
- [x] Trích 22 query M gốc. Viết lại `Transform.gs` theo khuôn `UnpivotOtherColumns`; thêm VVMV/Dolphin/EI.
- [x] **Route ×3 + Loại hàng ×2 + UpdateManual + POB** trong `Transform.gs` (2026-07-25). Test 46/46 PASS (`test/run_tests.cjs`, EVD).
- [x] Sửa `Setup.gs` chịu lỗi **"cột đã nhập"** (bỏ ép Plain text trên tab đã có data / Table). `setupSheets` **PASS**.
- [x] **Người dùng:** dán `backend/*.gs` mới → `rebuildFact()` → **Deploy New version** (link giữ nguyên). GAS live **v0.3.0**; Route ×3 chạy đúng trên data thật.
- [x] ✅ **Đối chiếu tổng lệch baseline — XONG (2026-07-28).** Live `rebuildFact` = **1479 dòng/$44,062.16** vs Excel **1480/$44.062** → **tiền khớp đến cent**. Thủ phạm = **cột VAT `14_VVMV_Raw` mất data khi dán** (text `-`→`num_`null→GAS bỏ); user dán lại → VVMV 909→934 (+19 VAT/+$739.57). **Tỷ giá 26452 ĐÚNG** (4 nguồn khớp $ đã chứng minh, KHÔNG sửa). Lệch −1 dòng = `Báo cáo quyết toán` amount trống ($0) → **chấp nhận** (mang $0, ép giữ sẽ phá luật loại 123 dòng $0 FedEx). ⚠️ **KHÔNG** thêm `Lệ phí hải quan` ($232.50) vào sheet 19 — đã tính trong cột debit `Infrastructure fee, lphq`, thêm là double-count ($44,294.67).
- [ ] 🔴 **[USER — ĐANG CHỜ] Chốt "sheet tiếp theo":** POB(18) / 50_MERGE_SHIPMENT / 60_QC_Errors / 70_Dashboard (adv). Câu hỏi mở cuối phiên 2026-08-07, chưa chọn → tôi triển khai khi có hướng.
- [x] ✅ **Overhead safety-net + đăng ký Map_Cost (2026-08-07):** `stageOverhead_` mặc định Overhead FWD cho khoản chưa map + user đăng ký Evergreen vào `22_Map_Cost`. Test 55/55. Xem TD-25.
- [x] ✅ **Re-match baseline sau khi thêm Evergreen + đổi rate (2026-08-07):** Excel $45.061,40 vs GAS $44.402,40 lệch $659 = **DATA out-of-sync** (rate 26452 vs 26462 · DHL Sheets thiếu 4 lô ~$818 · FedEx Import lệch amount ~$144 · VVMV +1 dòng $0 TD-23), KHÔNG phải bug code. User đồng bộ Sheets←Excel → GAS `meta` **1495 dòng/$45.061,40** khớp cent. Xem TD-26.
- [ ] 🟠 **[SOP] Viết SOP đồng bộ Excel→Sheets** (raw 10–19 + rate 23 + map 22/25/26 → rebuildFact → đối chiếu `meta.totalUsd` = Excel) để tránh lệch "ảo" tái diễn (TD-26).
- [ ] **POB:** dán data vào `18_ImportPOB_Raw` → `rebuildFact` → kiểm `?action=pob` + POB detail trên web (nay sheet 18 rỗng → count 0).
- [ ] (Cosmetic) mã dài hiện scientific ở tab raw đã thành Table → **Convert to range** rồi Format → Số → Văn bản thuần. (VVMV 936/$27.056 · Dolphin 29/$2.195 · EI 37/$2.105 · DHL 23/$1.398 · FedExExp 25/$585 · FedExImp 429/$9.891 · Overhead 4/$1.066) + dòng **POB** riêng; kiểm log "Route/Loại hàng có giá trị" > 0. Lệch → soi QC.

## 🟢 Ưu tiên 2d — Phase B: trang Logistics record (XONG code)
- [x] `report.js` (`lrMonthlySeries/lrImport/lrExport/lrOverhead`, khử trùng CW/B-L/CDS) + `views.js` bảng phân cấp + `pobTable` + `app.js` 2 bar chart + `?action=pob` (`getPOB`). **QĐ-51** lọc POB khỏi 3 trang Full. Xác minh trình duyệt (EVD).
- [ ] **Người dùng:** **Deploy → New version** để `?action=pob` sống (POB detail trên web).
- [ ] Viết **SOP đẩy Excel→Sheets** từng bước (Refresh All → copy raw 10–19 → paste values → rebuildFact).
- [ ] So bố cục trang Logistics record với ảnh báo cáo Excel thật; chỉnh nhãn/thứ tự dự án nếu cần.

## 🟠 Ưu tiên 3 — Xác minh & hoàn thiện UI
- [ ] Mở `index.html` kiểm 4 trang + đổi tháng + dark mode + mobile (768/480).
- [ ] (Tùy) bộ lọc forwarder / Import-Export / Mode trên topbar.
- [ ] (Tùy) làm tròn USD, trạng thái rỗng rõ hơn.

## 🟡 Web-Q còn mở (hỏi owner)
- Q-W01 host ở đâu (GitHub Pages → rủi ro CORS) · Q-W04 đọc tất cả/từng tháng · Q-W05 số dòng/tháng.

## ⚪ Sau này
- Đơn giá USD/kg, USD/CBM (QĐ-40 hoãn) · Pay-on-behalf (QĐ-28) · Sheet 70 nâng cao · phân tích Kaizen.
