# RESPONSIVE GUIDE — Logistics Cost Dashboard

## Breakpoints

| Tên | Bề rộng | Hành vi |
|---|---|---|
| Desktop | ≥1280px | Sidebar đầy (240px) + nội dung rộng |
| Laptop | 1024–1279px | Sidebar 200px |
| Tablet | 768–1023px | Sidebar thu về off-canvas (nút ☰), KPI 2 cột |
| Mobile | ≤767px | 1 cột; bảng báo cáo cuộn ngang trong khung riêng |

Ngưỡng thu sidebar: **1024px** (class `.is-open` + overlay).

## Quy tắc

1. Đơn vị **tương đối** (`rem`, `%`, `fr`), tránh `px` cứng cho layout.
2. Bảng báo cáo ngang **rộng** → luôn bọc trong `.table-scroll { overflow-x:auto }`. **Thân trang không được cuộn ngang.**
3. Ảnh/biểu đồ: `max-width:100%`. Chart.js đặt `responsive:true, maintainAspectRatio:false` trong khung cao cố định.
4. KPI grid: `repeat(auto-fit, minmax(180px, 1fr))` — tự xuống hàng.
5. Chạm: nút tối thiểu 40px chiều cao trên mobile.

## File
Media queries gom ở `assets/css/responsive.css`, nạp **cuối cùng**.
