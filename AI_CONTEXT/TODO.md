# TODO — Logistics Cost Dashboard

## ✅ Chặng 1 — Skeleton + Git
- [x] Gộp thư mục về repo mới (QĐ-36)
- [x] Bộ AI_CONTEXT nền + kiến trúc
- [x] Skeleton `index.html` + config + css + js + backend
- [x] `git init` + first commit + push `main`

## ✅ Chặng 2 — UI thật (Q-02→Q-05 chốt QĐ-37→40)
- [x] DESIGN_SYSTEM.md + UIUX_SYSTEM.md bản đầy đủ
- [x] Trang Dashboard: KPI + so sánh kỳ + biểu đồ (Chart.js)
- [x] Trang Báo cáo CEO (forwarder × Import/Export/Overhead/Third party; freight tách Air/Sea)
- [x] Trang Theo Route (QĐ-38)
- [x] Chọn tháng · dark mode · dữ liệu mẫu để xem UI
- [ ] Bộ lọc thêm: forwarder · Import/Export · Mode (hiện chưa; cân nhắc sau)
- [ ] Xác minh trực quan trên trình duyệt + góp ý CEO

## ⬜ Kết nối dữ liệu
- [ ] Tạo Google Sheet + tab `fact_CostLines`
- [ ] Viết SOP đẩy dữ liệu Excel→Sheets (từng bước, tiếng Việt)
- [ ] Deploy `backend/` làm GAS Web App → lấy URL
- [ ] Dán `GS_WEBAPP_URL` vào `config/env.js`
- [ ] Test `?action=ping` / `facts` / `meta`

## 🟡 Sau này
- [ ] Dark mode hoàn thiện
- [ ] Responsive mobile (768/480)
- [ ] Đơn giá de-dup CW/CBM theo B/L (nếu Q-05 = có)
- [ ] Pay-on-behalf (chờ QĐ-28)

> Xong việc nào → đánh `[x]` ngay + ghi `CHANGE_LOG.md`.
