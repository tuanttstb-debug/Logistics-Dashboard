# TECH DEBT — Logistics Cost Dashboard

> Nợ kỹ thuật đã biết. Delta phiên **2026-07-25** (Phase A+B: Route/Loại hàng/POB + trang Logistics record).

| ID | Nợ | Ảnh hưởng | Xử lý |
|---|---|---|---|
| ~~TD-01~~ | ~~Chưa phải git repo~~ | — | ✅ Đã init + push `8b008e6`; dọn clone rỗng lồng nhau |
| ~~TD-02~~ | ~~App chạy dữ liệu mẫu, chưa nối GAS~~ | — | ✅ Đã deploy Web App + `USE_MOCK:false`; `rebuildFact` dựng fact thật |
| **TD-17** | **Ground truth `pq_section1.m` KHÔNG còn local** (gitignored + đã xóa) | Sửa Route/Loại hàng dựa `11_BUSINESS_RULES.md §6/§7/§9` + header `Setup.gs`; nếu mã M gốc lệch doc → không có M để đối chiếu | Nếu nghi ngờ, trích lại từ DataMashup của `Logistics_System.xlsx` |
| **TD-18** | **POB nằm TRONG `40_FACT_CostLines`** (nhãn `Pay on behalf`) → tổng MỌI dòng fact > baseline $44.062 | "Full" chỉ đúng nhờ lọc ở tầng JS (QĐ-51) + `getMeta.totalUsd` (đã sửa loại POB). Ai tự sum fact thô sẽ gồm POB | Luôn lọc `Import/Export='Pay on behalf'` khi cần Full; dùng `getMeta` (totalUsd=Full, pobUsd riêng) |
| ~~TD-19~~ | ~~Code GAS mới chưa chạy trên Sheets thật~~ | — | ✅ Đã dán + `rebuildFact()` + **Deploy New version** (2026-07-25). Live v0.3.0; xác minh `ping`/`meta`/`pob` thật. Route ×3 chạy đúng (routes thật) |
| **TD-21** | ⚠️ **Tổng live lệch baseline:** `?action=meta` = **1454 dòng/$43.322,6** (Full) vs Excel **1480/$44.062** (~−1,7% $, −26 dòng) | Con số CEO có thể lệch report tay; chưa rõ do rate hay data | Đối chiếu **log per-source** `rebuildFact` + **tỷ giá 23 (đang 26452)** (nghi Excel dùng rate thấp hơn → phần $ khớp); soi −26 dòng do raw snapshot khác |
| **TD-22** | **Sheet `18_ImportPOB_Raw` rỗng** → `pobCount=0`, POB detail trống | Chức năng POB đã deploy nhưng chưa có dữ liệu để hiện | Dán data POB vào sheet 18 → chạy lại `rebuildFact` |
| **TD-20** | **Test dùng Spreadsheet GIẢ** (`test/run_tests.cjs`, fixtures) — 49/49 PASS | Chứng minh LOGIC, không chạy trên GAS/dữ liệu thật → lệch header/tên cột thật chưa lộ | Đối chiếu log `rebuildFact` thật (Full≈$44.062 + POB) |
| **TD-12** | 🔴 **Web App "Anyone"** + URL trong repo → ai có link đọc được cost thật (shipper/consignee/số tiền) | Lộ dữ liệu tài chính | Đổi repo Private + cân nhắc phân quyền GAS (TD-10) trước khi dùng rộng |
| **TD-13** | `rebuildFact` **xóa hẳn + tạo lại** tab `40_FACT_CostLines` mỗi lần chạy | Mất format/ghi chú thủ công trên tab (nếu có); tốn thao tác | Chấp nhận (tab do máy làm chủ); không sửa tay tab này |
| ~~TD-14~~ | ~~Route/Loại hàng chưa port sang GAS; tab 25 chưa lên Sheets~~ | — | ✅ **Đã port** Route×3 + Loại hàng×2 + UpdateManual + POB (`Transform.gs`, 2026-07-25); tab 25 vẫn optional |
| **TD-15** | `Mode chuẩn` port đúng PQ = **khớp chuỗi chính xác** — EI chỉ bắt `air import` (không bắt `sea export`/`air export`…) → nhiều EI để `Mode chuẩn=null` | Air/Sea của EI thiếu → biểu đồ tách Air/Sea lệch cho EI | Di sản PQ; nâng cấp bằng `Text.Contains` khi rà soát nghiệp vụ (ghi OPEN_QUESTIONS) |
| **TD-16** | DB mới **1 tháng** (2026-06, QĐ-42) | Chuỗi thời gian 18 tháng của Logistics record chỉ hiện 1 cột (QĐ-46: lớn dần) | Thêm tháng dần; không backfill tay |
| ~~TD-03~~ | ~~Chưa xác minh trực quan trên trình duyệt~~ | — | ✅ Xác minh qua `EVD/preview_live.html` (mock): 5 trang render, chart OK, POB detail, Dashboard total=Full |
| **TD-04** | **Chart.js từ CDN** | Offline/CSP chặn → biểu đồ trắng | Đã guard không vỡ trang; cân nhắc nhúng cục bộ nếu cần |
| **TD-05** | Field tên đặc biệt (`Import/Export`, `Mode chuẩn`) đọc bằng bracket | GAS đổi tên header → `undefined` | Xác nhận tên cột thật khi có Sheets (ASSUMPTION-W03) |
| **TD-06** | **Chưa có bộ lọc** forwarder/Import-Export/Mode ở UI (chỉ có chọn tháng) | Xem theo lát cắt phải đổi trang | Thêm khi cần |
| ~~TD-07~~ | ~~`data/` nhị phân trong repo~~ | — | ✅ Đã gỡ `data/` khỏi tracking + `.gitignore` (`ba780e2`) |
| **TD-11** | 🔴 **Dữ liệu công ty thật vẫn trong LỊCH SỬ Git** (`8b008e6`, `d26e33a`): 2 file xlsx (shipper/consignee, số tiền, path Y:/Z:, tên nhân viên). Gỡ ở HEAD không xóa lịch sử | Nếu repo public = lộ dữ liệu; có thể đã cache/fork | Đổi repo **Private** ngay; cân nhắc **rewrite history + force-push** (git filter-repo). Xem TODO_NEXT Ưu tiên 0 |
| **TD-08** | Dòng phí net = 0 tháng này bị **ẩn** khỏi bảng báo cáo | Lệch khi đối chiếu từng dòng với Excel | Chấp nhận; ghi rõ trong DESIGN_SYSTEM |
| **TD-09** | Chưa làm tròn `Amount_USD` 2 số lẻ; chưa xử **đơn giá** (QĐ-40) | Số lẻ dài; thiếu USD/kg, USD/CBM | Giai đoạn Kaizen |
| **TD-10** | Chưa phân quyền/đăng nhập (Q-W03) | Ai có link đều xem được | Quyết định khi deploy |

> Nợ kế thừa từ engine Excel (Refresh ~3 phút, Dolphin gõ Mode tay…): xem `context/31_OPEN_QUESTIONS.md` §4.
