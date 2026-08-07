# TECH DEBT — Logistics Cost Dashboard

> Nợ kỹ thuật đã biết. Delta phiên **2026-07-28** (chốt baseline: ✅ TD-21 resolved; thêm công cụ report_ per-source $).

| ID | Nợ | Ảnh hưởng | Xử lý |
|---|---|---|---|
| ~~TD-01~~ | ~~Chưa phải git repo~~ | — | ✅ Đã init + push `8b008e6`; dọn clone rỗng lồng nhau |
| ~~TD-02~~ | ~~App chạy dữ liệu mẫu, chưa nối GAS~~ | — | ✅ Đã deploy Web App + `USE_MOCK:false`; `rebuildFact` dựng fact thật |
| **TD-17** | **Ground truth `pq_section1.m` KHÔNG còn local** (gitignored + đã xóa) | Sửa Route/Loại hàng dựa `11_BUSINESS_RULES.md §6/§7/§9` + header `Setup.gs`; nếu mã M gốc lệch doc → không có M để đối chiếu | Nếu nghi ngờ, trích lại từ DataMashup của `Logistics_System.xlsx` |
| **TD-18** | **POB nằm TRONG `40_FACT_CostLines`** (nhãn `Pay on behalf`) → tổng MỌI dòng fact > baseline $44.062 | "Full" chỉ đúng nhờ lọc ở tầng JS (QĐ-51) + `getMeta.totalUsd` (đã sửa loại POB). Ai tự sum fact thô sẽ gồm POB | Luôn lọc `Import/Export='Pay on behalf'` khi cần Full; dùng `getMeta` (totalUsd=Full, pobUsd riêng) |
| ~~TD-19~~ | ~~Code GAS mới chưa chạy trên Sheets thật~~ | — | ✅ Đã dán + `rebuildFact()` + **Deploy New version** (2026-07-25). Live v0.3.0; xác minh `ping`/`meta`/`pob` thật. Route ×3 chạy đúng (routes thật) |
| ~~TD-21~~ | ✅ **GIẢI QUYẾT (2026-07-28):** baseline KHỚP — `rebuildFact` = **1479 dòng/$44,062.16** vs Excel 1480/$44.062 (tiền khớp đến cent) | — | Thủ phạm = **cột VAT `14_VVMV_Raw` mất data khi dán** (text `-`→`num_`null→bỏ); user dán lại → VVMV 909→934 (+$739.57). **Tỷ giá 26452 ĐÚNG** (4 nguồn khớp $ chứng minh). Lệch −1 dòng = `Báo cáo quyết toán` $0 → chấp nhận. Sinh TD-23/TD-24 |
| **TD-23** | **GAS bỏ dòng fact amount trống/`Amount=0`** (Transform.gs:82,158) → live 1479 vs Excel 1480 (1 dòng overhead VVMV `Báo cáo quyết toán` $0) | Số dòng lệch 1 so Excel; **tiền không đổi** ($0) | Chấp nhận (QĐ). Ép giữ dòng $0-overhead sẽ phá luật loại đúng 123 dòng $0-debit FedEx — không đáng cho 1 dòng $0 |
| **TD-24** | **Cột VAT/số dạng kế toán `-` bị `num_`→null** (mất khi dán Excel→Sheets) | Nếu nguồn khác cũng có cột `-`/công thức, dán sai → mất dòng+tiền âm thầm | Khi dán raw: đảm bảo cột số ra **số thật** (Paste values, convert `-`→0). Có thể vá `num_` coi `-`=0 nếu tái diễn |
| **TD-22** | **Sheet `18_ImportPOB_Raw` rỗng** → `pobCount=0`, POB detail trống | Chức năng POB đã deploy nhưng chưa có dữ liệu để hiện | Dán data POB vào sheet 18 → chạy lại `rebuildFact` |
| **TD-20** | **Test dùng Spreadsheet GIẢ** (`test/run_tests.cjs`, fixtures) — 49/49 PASS | Chứng minh LOGIC, không chạy trên GAS/dữ liệu thật → lệch header/tên cột thật chưa lộ | Đối chiếu log `rebuildFact` thật (Full≈$44.062 + POB) |
| **TD-12** | 🟠 **Web App "Anyone"** + URL public → ai có link đọc được cost thật (shipper/consignee/số tiền) | Lộ dữ liệu tài chính | ⚠️ **QĐ 2026-08-07 — CHẤP NHẬN phơi nhiễm URL:** user chốt **GitHub Pages public là BẮT BUỘC** để hosting → SPA client tự phục vụ `env.js` cho mọi browser → **URL GAS public theo thiết kế** (che trong git vô nghĩa; `env.local.js` không tới được Pages). URL cũ đã redact khỏi lịch sử + rotate URL mới, verify live 1479/$44.062,16. **Rủi ro tồn dư:** data tài chính vẫn đọc được qua URL. **Biện pháp DUY NHẤT còn lại = kiểm soát tầng GAS** (TD-10): thêm **token bí mật** vào mọi request (`?token=…`, GAS từ chối nếu sai) — token này vẫn lộ trong env.js public nên chỉ chặn bot vô danh, KHÔNG chặn người xem source; hoặc chấp nhận phơi nhiễm. Cân nhắc thật: dữ liệu này có đủ nhạy để KHÔNG hợp với hosting public không? |
| **TD-13** | `rebuildFact` **xóa hẳn + tạo lại** tab `40_FACT_CostLines` mỗi lần chạy | Mất format/ghi chú thủ công trên tab (nếu có); tốn thao tác | Chấp nhận (tab do máy làm chủ); không sửa tay tab này |
| ~~TD-14~~ | ~~Route/Loại hàng chưa port sang GAS; tab 25 chưa lên Sheets~~ | — | ✅ **Đã port** Route×3 + Loại hàng×2 + UpdateManual + POB (`Transform.gs`, 2026-07-25); tab 25 vẫn optional |
| **TD-15** | `Mode chuẩn` port đúng PQ = **khớp chuỗi chính xác** — EI chỉ bắt `air import` (không bắt `sea export`/`air export`…) → nhiều EI để `Mode chuẩn=null` | Air/Sea của EI thiếu → biểu đồ tách Air/Sea lệch cho EI | Di sản PQ; nâng cấp bằng `Text.Contains` khi rà soát nghiệp vụ (ghi OPEN_QUESTIONS) |
| **TD-16** | DB mới **1 tháng** (2026-06, QĐ-42) | Chuỗi thời gian 18 tháng của Logistics record chỉ hiện 1 cột (QĐ-46: lớn dần) | Thêm tháng dần; không backfill tay |
| ~~TD-03~~ | ~~Chưa xác minh trực quan trên trình duyệt~~ | — | ✅ Xác minh qua `EVD/preview_live.html` (mock): 5 trang render, chart OK, POB detail, Dashboard total=Full |
| **TD-04** | **Chart.js từ CDN** | Offline/CSP chặn → biểu đồ trắng | Đã guard không vỡ trang; cân nhắc nhúng cục bộ nếu cần |
| **TD-05** | Field tên đặc biệt (`Import/Export`, `Mode chuẩn`) đọc bằng bracket | GAS đổi tên header → `undefined` | Xác nhận tên cột thật khi có Sheets (ASSUMPTION-W03) |
| **TD-06** | **Chưa có bộ lọc** forwarder/Import-Export/Mode ở UI (chỉ có chọn tháng) | Xem theo lát cắt phải đổi trang | Thêm khi cần |
| ~~TD-07~~ | ~~`data/` nhị phân trong repo~~ | — | ✅ Đã gỡ `data/` khỏi tracking + `.gitignore` (`ba780e2`) |
| ~~TD-11~~ | ✅ **GIẢI QUYẾT LỊCH SỬ (2026-08-06):** rewrite bằng `git filter-repo` xóa `data/` (**4 file:** 2 xlsx + 2 handover `.md` trong `_source/`, không phải "2 xlsx" như ghi cũ) khỏi **toàn bộ 25 commit** + force-push (`75cab6a`→`9220231`). Verify: history sạch, không còn `data/` lẫn deployment-ID. Backup bundle `logi-backup-allrefs.bundle` ở scratchpad; 4 file gốc vẫn trên đĩa (gitignored) | ⚠️ **Dư nợ:** repo TỪNG public → GitHub còn **cache SHA cũ** (`8b008e6`, `d26e33a`) truy cập trực tiếp tới khi GC; có thể đã bị fork/clone | **User cần:** (1) đổi repo **Private**; (2) liên hệ **GitHub Support** purge cached commits + gỡ fork; (3) coi dữ liệu như **đã lộ** (repo từng public) |
| **TD-08** | Dòng phí net = 0 tháng này bị **ẩn** khỏi bảng báo cáo | Lệch khi đối chiếu từng dòng với Excel | Chấp nhận; ghi rõ trong DESIGN_SYSTEM |
| **TD-09** | Chưa làm tròn `Amount_USD` 2 số lẻ; chưa xử **đơn giá** (QĐ-40) | Số lẻ dài; thiếu USD/kg, USD/CBM | Giai đoạn Kaizen |
| **TD-10** | Chưa phân quyền/đăng nhập (Q-W03) | Ai có link đều xem được | Quyết định khi deploy |

> Nợ kế thừa từ engine Excel (Refresh ~3 phút, Dolphin gõ Mode tay…): xem `context/31_OPEN_QUESTIONS.md` §4.
