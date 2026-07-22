# THEME ARCHITECTURE — Logistics Cost Dashboard

## Nguyên tắc

- **Token trước, giá trị sau.** Mọi màu/khoảng cách/bo góc khai báo 1 chỗ: `assets/css/variables.css`. Không hard-code trong component.
- **2 theme:** sáng (mặc định) + tối. Chuyển bằng `data-theme` trên `<html>`, lưu `localStorage['logi_theme']`.
- Bảng màu **logistics**: navy nền tin cậy + teal/cyan điểm nhấn + amber cảnh báo + đỏ/xanh lá cho tăng/giảm chi phí.

## Cơ chế

```html
<html data-theme="light">   <!-- hoặc "dark" -->
```

```css
:root, :root[data-theme="light"] {
  --bg-app:      #f5f7fa;
  --bg-surface:  #ffffff;
  --text-1:      #0f2233;
  --text-2:      #5b6b7a;
  --border:      #e2e8f0;
  --brand:       #0e7490;   /* teal 700 */
  --brand-navy:  #0f2a43;
  --accent:      #06b6d4;   /* cyan 500 */
  --pos:         #dc2626;   /* chi phí TĂNG = đỏ */
  --neg:         #16a34a;   /* chi phí GIẢM = xanh */
  --warn:        #d97706;
}
:root[data-theme="dark"] {
  --bg-app:      #0b1620;
  --bg-surface:  #12212f;
  --text-1:      #e6eef5;
  --text-2:      #9fb2c2;
  --border:      #1e3345;
  --brand:       #22d3ee;
  --brand-navy:  #0a1a2a;
  --accent:      #38bdf8;
  --pos:         #f87171;
  --neg:         #4ade80;
  --warn:        #fbbf24;
}
```

> **Quy ước màu chi phí:** với báo cáo chi phí, **tăng = xấu (đỏ)**, **giảm = tốt (xanh)** — ngược với tài chính lời/lỗ. Nhất quán toàn app.

## JS toggle (dự kiến `helpers.js`)

```js
function setTheme(t){ document.documentElement.dataset.theme = t;
  localStorage.setItem('logi_theme', t); }
function initTheme(){ setTheme(localStorage.getItem('logi_theme') || 'light'); }
```

## Do / Don't

| Do | Don't |
|---|---|
| `var(--brand)` | hard-code `#0e7490` |
| Thêm token mới vào `variables.css` | rải màu lẻ trong component |
| Kiểm cả 2 theme khi đổi màu | chỉ test theme sáng |
