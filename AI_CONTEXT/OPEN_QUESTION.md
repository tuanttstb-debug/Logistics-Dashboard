# OPEN QUESTIONS — Logistics Cost Dashboard

> Đọc đầu mỗi phiên. **Đừng tự suy đoán rồi làm tiếp.**

## 1. Câu hỏi chặn thiết kế UI (Chặng 2) — ✅ ĐÃ CHỐT 2026-07-22

| # | Kết quả |
|---|---|
| **Q-02** | ✅ QĐ-37 — Third party = khối riêng trong mỗi forwarder, **có** vào tổng |
| **Q-03** | ✅ QĐ-38 — Route = **trang riêng** "Theo Route" (Route × Import/Export/Tổng) |
| **Q-04** | ✅ QĐ-39 — **có** so sánh kỳ: tháng trước + % + YTD |
| **Q-05** | ✅ QĐ-40 — **chưa** làm đơn giá (để Kaizen) |

→ Đã mở khóa Chặng 2. DESIGN_SYSTEM/UIUX đã cập nhật bản thật.

## 2. Câu hỏi riêng của web

| # | Câu hỏi | Ảnh hưởng |
|---|---|---|
| **Q-W01** | Web host ở đâu — **GitHub Pages** (khác origin, rủi ro CORS) hay **mở file cục bộ**? | Chiến lược CORS ở `backend/Utils.gs` |
| **Q-W02** | Đẩy `fact_CostLines` lên Sheets **thủ công copy/paste** hàng tháng có chấp nhận không? | SOP tháng; xem ASSUMPTION-W02 |
| **Q-W03** | Có cần **phân quyền/đăng nhập** không, hay chỉ chia sẻ link nội bộ? | Có làm auth hay không |
| **Q-W04** | Web đọc **tất cả tháng** một lần hay **từng tháng** theo bộ lọc? | Khối lượng dữ liệu / hiệu năng api |
| **Q-W05** | Dữ liệu bao nhiêu dòng/tháng (ước lượng)? | Có cần phân trang/tối ưu không |

## 3. Cách dùng

- Trả lời được → chuyển thành QĐ trong `context/30_DECISIONS_LOG.md`, xóa khỏi đây.
- Câu chặn báo cáo (Q-02→Q-05) đồng bộ với `context/31_OPEN_QUESTIONS.md` — sửa cả hai khi chốt.
