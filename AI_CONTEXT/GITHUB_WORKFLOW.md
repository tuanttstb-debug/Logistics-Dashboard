# GITHUB WORKFLOW — Logistics Cost Dashboard

## Repository

```
Local : D:\Workspace\Production\Logistics-Dashboard
Remote: (chưa tạo) — dự kiến github.com/<user>/Logistics-Dashboard
Branch: main
```

> Chưa `git init`. Xem "Khởi tạo lần đầu" bên dưới.

---

## Chiến lược nhánh (gọn — dự án 1 người)

```
main         ← luôn chạy được, đẩy production
feature/*    ← tính năng mới (tách từ main)
fix/*        ← sửa lỗi
docs/*       ← chỉ tài liệu (AI_CONTEXT, context)
```

Dự án nhỏ, một người vận hành → có thể **push thẳng `main`** cho thay đổi nhỏ; dùng nhánh khi thử tính năng lớn. (Tương tự thói quen SHTD.)

---

## Quy ước commit (Conventional Commits)

```
<type>(<scope>): <mô tả ngắn>
```

| Type | Khi dùng |
|---|---|
| `feat` | Tính năng mới |
| `fix` | Sửa lỗi |
| `refactor` | Đổi code, không đổi hành vi |
| `docs` | Chỉ tài liệu |
| `style` | CSS/định dạng |
| `chore` | Cấu hình, build |

| Scope | Vùng |
|---|---|
| `dashboard` | KPI + biểu đồ |
| `report` | Báo cáo ngang CEO |
| `filter` | Bộ lọc |
| `api` | api.js / kết nối GAS |
| `gas` | backend Apps Script |
| `css` | Styles |
| `docs` | AI_CONTEXT / context |

Ví dụ:
```
docs: khởi tạo bộ AI_CONTEXT + skeleton Chặng 1
feat(dashboard): thêm KPI tổng chi phí USD theo tháng
fix(api): xử null Amount_USD khi cộng tổng
chore: thêm .gitignore, README
```

---

## Khởi tạo lần đầu (checklist)

```bash
cd "D:/Workspace/Production/Logistics-Dashboard"
git init
git add .gitignore README.md AI_CONTEXT/ context/ config/ assets/ backend/ index.html
git commit -m "docs: khởi tạo repo Logistics Cost Dashboard (Chặng 1 skeleton)"
# Tạo repo rỗng trên GitHub rồi:
git branch -M main
git remote add origin https://github.com/<user>/Logistics-Dashboard.git
git push -u origin main
```

> **Cân nhắc `data/`:** `Logistics_System.xlsx` là file nhị phân ~vài trăm KB. Mặc định `.gitignore` **có commit** file này (versioning engine). Nếu không muốn đẩy dữ liệu thật lên GitHub công khai → bỏ comment dòng `data/` trong `.gitignore`.

---

## Trước khi push

- [ ] Không có secret thật trong `config/env.js` (URL GAS công khai là chấp nhận được, nhưng cân nhắc repo private).
- [ ] `CHANGE_LOG.md` đã cập nhật.
- [ ] Mở `index.html` chạy thử không lỗi console.
