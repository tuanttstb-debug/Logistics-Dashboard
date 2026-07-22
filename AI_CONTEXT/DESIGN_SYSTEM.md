# DESIGN SYSTEM — Logistics Cost Dashboard

> ✅ **Chặng 2 (2026-07-22).** Q-02→Q-05 đã chốt (QĐ-37→40). Layout báo cáo/dashboard đã hiện thực. Nền: token, app-shell, component cơ bản + component báo cáo bên dưới.

## Kiến trúc CSS

```
assets/css/
├── variables.css   ← TẤT CẢ token (SỬA Ở ĐÂY TRƯỚC). Nạp đầu tiên
├── base.css        ← reset, html/body, focus
├── layout.css      ← app-shell: sidebar, topbar, main
├── components.css  ← card, kpi, button, badge, table, toast
└── responsive.css  ← breakpoints. Nạp cuối
```
**Thứ tự nạp quan trọng** — `variables.css` luôn đầu.

## Token (xem `THEME_ARCHITECTURE.md` cho màu 2 theme)

- Màu: `--brand`, `--brand-navy`, `--accent`, `--pos` (tăng=đỏ), `--neg` (giảm=xanh), `--warn`.
- Khoảng cách: `--space-1..8` (4px×). Bo góc: `--radius-sm/md/lg/xl`. Bóng: `--shadow-1/2` (tối giản).

## Component cơ bản (đã có trong skeleton)

### App shell
```html
<div class="app">
  <aside class="app-sidebar" id="sidebar">…</aside>
  <div class="app-body">
    <header class="app-topbar">…</header>
    <main class="app-main" id="view">…</main>
  </div>
</div>
```

### KPI card
```html
<div class="kpi kpi--brand">
  <div class="kpi-label">Tổng chi phí (USD)</div>
  <div class="kpi-value">$0</div>
  <div class="kpi-sub">— tháng —</div>
</div>
```
Modifier: `.kpi--brand` `.kpi--warn` `.kpi--pos` `.kpi--neg`.

### Card / Button / Badge / Table
```html
<div class="card"><div class="card-head"><h3 class="card-title">…</h3></div>…</div>
<button class="btn btn--primary">…</button>
<button class="btn btn--ghost">…</button>
<span class="badge badge--import">Import</span>
<div class="table-scroll"><table class="tbl">…</table></div>
```

## Đặt tên

- Block `.name`, element `.name-el`, modifier `.name--mod` / `.is-state`.
- JS: module IIFE, state riêng `_var`, public `window.Module`.

## Do / Don't

| Do | Don't |
|---|---|
| `var(--brand)`, `var(--space-4)` | hard-code màu/px |
| bảng rộng bọc `.table-scroll` | để body cuộn ngang |
| dùng `Amount_USD` cho số | dùng `Amount` gốc |

## Component báo cáo (Chặng 2 — đã hiện thực, `assets/css/report.css`)

- **KPI có so sánh kỳ** (QĐ-39): mỗi KPI hiện số tháng này + `▲/▼ %` so tháng trước + dòng `YTD`.
- **Bảng báo cáo forwarder** (`.tbl-report`): hàng khối `.row-block` (Import/Export/Overhead/Third party — QĐ-37) → hàng dòng phí `.row-line` → hàng tổng `.row-total`. Cột: Khoản mục · Tháng này · Tháng trước · %△ · YTD. Freight tách Air/Sea theo `Mode chuẩn`.
- **Trang Theo Route** (QĐ-38): bảng Route × Import/Export/Tổng + so sánh kỳ.
- **Biểu đồ** (Chart.js): doughnut cơ cấu nhóm phí, bar theo forwarder, line xu hướng tháng. Màu lấy từ token, vẽ lại khi đổi theme.
- **Màu so sánh** (`.delta.up/.down`): chi phí **tăng = `--pos` (đỏ)**, **giảm = `--neg` (xanh)** — ngược lời/lỗ.
- **Chọn tháng**: `#monthSelect` trên topbar; đổi tháng → re-render toàn trang.

> Đơn giá (USD/kg, USD/CBM) **chưa làm** (QĐ-40) — để Kaizen sau.
