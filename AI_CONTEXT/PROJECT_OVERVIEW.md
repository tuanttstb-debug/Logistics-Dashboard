# PROJECT OVERVIEW — Logistics Cost Dashboard

## Tóm tắt

**Logistics Cost Dashboard** là web app nội bộ trình bày báo cáo **chi phí logistics** cho Tổng Giám đốc (CEO). Đây là **tầng báo cáo/dashboard** của hệ thống Logistics Cost — thay cho Sheet 50 (báo cáo ngang) và Sheet 70 (dashboard) dự kiến làm trong Excel.

> Dự án web này **không thay thế** engine dữ liệu. Toàn bộ xử lý gom/chuẩn hóa chi phí vẫn nằm ở **Excel + Power Query** (`data\Logistics_System.xlsx`). Web chỉ **đọc** kho đã chuẩn hóa `fact_CostLines` và trình bày.

Quyết định đảo trục: xem `../context/30_DECISIONS_LOG.md` **QĐ-33/34/35**; việc gộp thư mục: **QĐ-36**.

---

## Bối cảnh nghiệp vụ

| Mục | Giá trị |
|---|---|
| Tổ chức | Công ty nhập/xuất hàng điện tử (Xây Lắp) |
| Mục tiêu gốc | Rút thời gian làm báo cáo tháng ~4h → ~30 phút |
| Người tiêu thụ | Tổng Giám đốc (CEO); sau đó là phân tích Kaizen |
| Ngôn ngữ | Tiếng Việt (vi-VN) |
| Nguồn dữ liệu | Kho `fact_CostLines` (Excel) → đẩy lên **Google Sheets** |
| Ràng buộc | Người dùng phải **tự bảo trì ~5 năm** |

---

## Engine dữ liệu (thượng nguồn — KHÔNG thuộc repo này)

7 nguồn forwarder (DHL, FedEx Export, FedEx Import, EI, VVMV, Dolphin, Gia Bảo) → 7 query staging → kho dọc **`fact_CostLines`** (1 dòng = 1 khoản phí). Đã gắn 4 chiều phân loại: `Mode chuẩn`, `Import/Export`, `Route`, `Loại hàng`; quy đổi `Amount_USD`. **QC sạch.**

Chi tiết engine: bộ tài liệu trong `context/` (`10_MODEL_SPEC`, `11_BUSINESS_RULES`, `12_DATA_DICTIONARY`).

---

## Người dùng & vai trò

| Vai trò | Sử dụng chính |
|---|---|
| CEO / BLĐ | Xem báo cáo ngang + dashboard (chỉ đọc) |
| Người vận hành (owner) | Refresh Excel → đẩy dữ liệu lên Sheets → mở web xem |

Hiện **không có** phân quyền đăng nhập (giai đoạn đầu). Xem `OPEN_QUESTION.md` Q-W03.

---

## Phạm vi (giai đoạn 1)

**Trong phạm vi:**
- Dashboard KPI tổng chi phí logistics (USD) theo tháng
- Báo cáo ngang cho CEO: mỗi forwarder tách Import / Export / Overhead / Third party; detail theo nhóm phí chuẩn
- Bộ lọc: tháng, forwarder, Import/Export, Mode, Route
- Đọc dữ liệu từ Google Sheets (một chiều: chỉ đọc)

**Ngoài phạm vi (giai đoạn 1):**
- Ghi/sửa dữ liệu từ web (dữ liệu chỉ chỉnh ở Excel)
- Phân quyền / đăng nhập
- Pay-on-behalf / arising fee (chờ QĐ-28)
- Phân tích Kaizen (làm sau khi báo cáo ổn định)

---

## Technology Stack (QĐ-34 — giống SHTD)

| Tầng | Công nghệ |
|---|---|
| Frontend | Vanilla HTML5 + CSS3 + ES2020 JS (không framework nặng) |
| Charts | Chart.js (CDN) |
| Icons | Font Awesome (CDN) |
| Backend | Google Apps Script Web App |
| Database | Google Sheets (tab `fact_CostLines`) |
| Hosting | GitHub Pages (tĩnh) hoặc mở file cục bộ |

---

## Trạng thái hiện tại

**Chặng 1 (đang làm):** dựng bộ `AI_CONTEXT` + skeleton HTML/CSS/JS + khung GAS. Chưa có UI thật.

**Chặng 2 (chờ):** thiết kế báo cáo CEO thật — **bị chặn** bởi Q-02→Q-05 ở `../context/31_OPEN_QUESTIONS.md`. Xem `OPEN_QUESTION.md` + `PROJECT_STATE.md`.
