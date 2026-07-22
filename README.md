# Logistics Cost Dashboard

Web app nội bộ trình bày **báo cáo chi phí logistics** cho CEO. Là **tầng báo cáo** của hệ thống Logistics Cost — dữ liệu do **Excel + Power Query** chuẩn hóa (kho `fact_CostLines`), đẩy lên **Google Sheets**, web đọc qua **Google Apps Script**.

> Web **chỉ đọc**. Mọi logic chi phí ở Excel — xem `context/`.

## Cấu trúc repo

```
Logistics-Dashboard/
├── AI_CONTEXT/     ← tài liệu dự án web (đọc trước khi code)
├── context/        ← tài liệu engine Excel (00–32) + nhật ký quyết định
├── data/           ← Logistics_System.xlsx + _source (KHÔNG sửa bằng script)
├── config/         ← env.js (URL GAS), routes.js
├── assets/         ← css/, js/
├── backend/        ← Google Apps Script (.gs) — deploy riêng
└── index.html      ← điểm vào SPA
```

## Chạy thử (Chặng 1)

Mở `index.html` bằng trình duyệt. Chưa có `GS_WEBAPP_URL` → hiện màn hình placeholder (bình thường).

## Kết nối dữ liệu (Chặng sau)

1. Tạo Google Sheet, tab `fact_CostLines`; dán dữ liệu từ Excel (xem `AI_CONTEXT/DATA_CONTRACT.md`).
2. Dán mã trong `backend/` vào Apps Script của Sheet, Deploy → Web App → copy URL.
3. Dán URL vào `config/env.js` (`GS_WEBAPP_URL`).

## Tài liệu bắt buộc đọc

`AI_CONTEXT/PROJECT_OVERVIEW.md` · `SYSTEM_ARCHITECTURE.md` · `DATA_CONTRACT.md` · `WORKING_RULE.md` · `OPEN_QUESTION.md`.

## Trạng thái

Chặng 1 (skeleton + context) — xong. UI thật chờ trả lời Q-02→Q-05 (`AI_CONTEXT/OPEN_QUESTION.md`).
