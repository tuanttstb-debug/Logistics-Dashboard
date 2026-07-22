# SYSTEM ARCHITECTURE — Logistics Cost Dashboard

## Tổng quan kiến trúc

```
┌──────────────────────────────────────────────────────────────┐
│  EXCEL (engine dữ liệu — KHÔNG thuộc repo này)               │
│  Logistics_System.xlsx  →  Power Query  →  fact_CostLines    │
│  (owner Refresh All mỗi tháng; QC sạch)                      │
└──────────────────────────────┬───────────────────────────────┘
                               │ Copy/paste hoặc export thủ công
                               │ (đẩy fact_CostLines lên tab Sheets)
                               ▼
┌──────────────────────────────────────────────────────────────┐
│  GOOGLE SHEETS (Database)                                    │
│  Tab `fact_CostLines`   ← kho dọc, 1 dòng = 1 khoản phí     │
│  Tab `Map_ExchangeRate` ← tỷ giá tháng (tùy chọn)           │
└──────────────────────────────┬───────────────────────────────┘
                               │ SpreadsheetApp API
                               ▼
┌──────────────────────────────────────────────────────────────┐
│  GOOGLE APPS SCRIPT (Web App — thư mục backend/)            │
│  Code.gs      ← Router doGet(action)                        │
│  Config.gs    ← SHEET_ID, TAB names, HEADERS               │
│  DataService.gs ← đọc fact_CostLines, trả JSON             │
│  Utils.gs     ← JSON response + CORS headers               │
└──────────────────────────────┬───────────────────────────────┘
                               │ HTTPS / fetch (JSON)
                               ▼
┌──────────────────────────────────────────────────────────────┐
│  BROWSER (SPA — index.html)                                 │
│  config/env.js     ← APP_CONFIG (webapp URL, version)      │
│  config/routes.js  ← builder URL API                       │
│  assets/js/                                                 │
│    constants.js  ← tên cột fact_CostLines, nhóm phí        │
│    helpers.js    ← format USD, debounce, sanitize          │
│    api.js        ← fetch wrapper (Api object)              │
│    store.js      ← cache dữ liệu + bộ lọc hiện hành        │
│    app.js        ← entry point: init, render, filter       │
└──────────────────────────────────────────────────────────────┘
```

---

## Luồng khởi động (dự kiến)

```
DOMContentLoaded
  → app.js::init()
      → Api.getFacts(month?)      [GET ?action=facts]
      → Store.setRows(data)
      → renderFilters()           ← tháng, forwarder, route từ dữ liệu
      → renderKPIs()              ← tổng USD, theo Import/Export
      → renderReportTable()       ← báo cáo ngang (Chặng 2)
      → renderCharts()            ← Chart.js (Chặng 2)
      → bindEvents()              ← đổi bộ lọc → re-render
```

---

## Nguyên tắc load JS (critical path)

Thứ tự script trong `index.html` — mỗi file phụ thuộc globals của file trước:

```
env.js → routes.js → constants.js → helpers.js
→ api.js → store.js → app.js
```

**Rủi ro:** đổi thứ tự hoặc thêm file sai vị trí → runtime error. Xem `WORKING_RULE.md`.

---

## API Contract (GAS ↔ SPA)

| Action | Method | Trả về |
|---|---|---|
| `?action=ping` | GET | `{ ok: true, version }` — kiểm tra kết nối |
| `?action=facts&month=YYYY-MM` | GET | `{ ok, rows: [...], count }` — dòng `fact_CostLines`; bỏ `month` = tất cả |
| `?action=meta` | GET | `{ ok, months: [...], forwarders: [...], routes: [...] }` — cho bộ lọc |

Chi tiết schema từng dòng: `DATA_CONTRACT.md`.

---

## CORS

GAS Web App deploy chế độ "Anyone" → set thủ công header CORS trong `Utils.gs::jsonResponse()`.

> **[ASSUMPTION-W01]** GAS xử lý preflight OPTIONS không ổn định với mọi browser. Nếu web mở bằng GitHub Pages (khác origin) mà lỗi CORS → cân nhắc dùng JSONP hoặc mở file cùng origin. Cần kiểm thực tế. Xem `ASSUMPTION_LOG.md`.

---

## State Management

Không dùng thư viện. State gom ở một chỗ (khác SHTD phân tán):

| State | Nơi lưu |
|---|---|
| Toàn bộ dòng đã tải | `Store._rows` (module) |
| Bộ lọc hiện hành | `Store._filter` (month, forwarder, route, mode, impexp) |
| Meta cho dropdown | `Store._meta` |
| Theme (light/dark) | `localStorage['logi_theme']` |

---

## Quan hệ với engine Excel

- Web **chỉ đọc**. Mọi thay đổi phân loại/công thức làm ở Excel (`11_BUSINESS_RULES.md`), rồi đẩy lại lên Sheets.
- **Không** tái cài đặt logic phân loại trong JS — dữ liệu tới web đã gắn đủ 4 chiều. JS chỉ **gộp/lọc/trình bày**.
