# WORKING RULES — Logistics Cost Dashboard

> Kế thừa tinh thần `context/02_WAYS_OF_WORKING.md`. Người dùng giỏi nghiệp vụ + Excel, **mới học web**. Hướng dẫn **từng bước, tiếng Việt, luôn nói "tại sao"**.

## Nguyên tắc cốt lõi

1. **Web chỉ ĐỌC.** Mọi logic phân loại/công thức chi phí ở **Excel** (`context/11_BUSINESS_RULES.md`). Không tái cài đặt trong JS.
2. **Không đổi tên cột `fact_CostLines`.** Đã từng làm gãy chuỗi query ở engine. Web bám đúng tên gốc (`DATA_CONTRACT.md`).
3. **Không giả định.** Thiếu thông tin → hỏi. Câu hỏi mở ghi ở `OPEN_QUESTION.md`.
4. **Ghi mọi thay đổi** vào `CHANGE_LOG.md`; việc còn lại vào `TODO.md`.
5. **Đơn giản thắng phức tạp; ổn định > tối ưu** (kế thừa `01_PROJECT_CONTEXT.md` §10).

---

## Quy tắc sửa code

### Trước khi sửa
- [ ] Đọc `SYSTEM_ARCHITECTURE.md` — hiểu thứ tự load JS.
- [ ] Xem việc có bị chặn bởi mục nào trong `OPEN_QUESTION.md` không.
- [ ] Xác nhận không đụng `DATA_CONTRACT.md` (tên cột/kiểu).

### Khi sửa
- [ ] Một thay đổi logic / một commit.
- [ ] Không hard-code màu/khoảng cách — dùng token trong `assets/css/variables.css`.
- [ ] Không đổi thứ tự `<script>` trong `index.html` nếu chưa hiểu phụ thuộc.
- [ ] Không đổi tên hàm mà chưa tìm hết nơi gọi.

### Sau khi sửa
- [ ] Mở `index.html`, kiểm: tải dữ liệu, KPI, bộ lọc, dark mode, mobile.
- [ ] Cập nhật `CHANGE_LOG.md` + `TODO.md`.

---

## Vùng rủi ro cao

| Vùng | Vì sao nguy hiểm |
|---|---|
| `config/env.js` (`GS_WEBAPP_URL`) | Sai URL → web không có dữ liệu |
| `api.js` parse JSON | Sai → hỏng toàn bộ bảng |
| Tên cột trong `constants.js` | Lệch tên gốc → cột null hàng loạt |
| `backend/*.gs` | Deploy sai → CORS/lỗi mạng |

---

## KHÔNG làm (nếu chưa hỏi owner)

- KHÔNG cho web **ghi** ngược lên Sheets/Excel (giai đoạn 1 chỉ đọc).
- KHÔNG đổi `GS_WEBAPP_URL`, `GS_SHEET_ID`, tên tab `fact_CostLines`.
- KHÔNG đề xuất SQL / Power BI / framework nặng (React/Vue…) — giữ vanilla theo QĐ-34.
- KHÔNG động vào `data\Logistics_System.xlsx` bằng script/openpyxl — **phá Power Query** (`02_WAYS_OF_WORKING.md` §2).

---

## Khi nhờ AI hỗ trợ

1. Luôn đưa `DATA_CONTRACT.md` + `OPEN_QUESTION.md` làm context.
2. Nói rõ đang làm Chặng nào (1: skeleton · 2: UI thật).
3. Yêu cầu AI liệt kê **mọi file/hàm bị ảnh hưởng** trước khi sửa.
4. Đối chiếu output với `ASSUMPTION_LOG.md` — AI có thể lặp lại giả định đã gắn cờ.
