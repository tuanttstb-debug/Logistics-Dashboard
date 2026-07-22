# Prompt mở đầu phiên làm việc

> Copy khối bên dưới, dán vào đầu đoạn chat mới, điền `[…]` rồi gửi.

---

## A. Prompt chuẩn (dùng cho mọi tác vụ)

```
Dự án: Logistics Cost. Context: D:\Workspace\Logistics Ha

ĐỌC TRƯỚC, theo đúng thứ tự:
- 00_INDEX.md
- 01_PROJECT_CONTEXT.md
- 02_WAYS_OF_WORKING.md
- 32_ROADMAP.md
- 31_OPEN_QUESTIONS.md

Không quét toàn bộ thư mục. Chỉ đọc thêm file liên quan tới việc hôm nay:
- Sửa/mở rộng model  → 10_MODEL_SPEC.md, 11_BUSINESS_RULES.md, 30_DECISIONS_LOG.md
- Chạy chu kỳ tháng   → 13_QC_AND_OPS.md
- Debug lỗi           → 13_QC_AND_OPS.md, 12_DATA_DICTIONARY.md, 11_BUSINESS_RULES.md
- Phân tích số liệu   → 12_DATA_DICTIONARY.md, 20_ANALYSIS_FRAMEWORK.md
- Báo cáo / deck      → 22_REPORTING_SPEC.md, 20_ANALYSIS_FRAMEWORK.md, 12_DATA_DICTIONARY.md

SAU KHI ĐỌC, trả lời gọn 4 mục trước khi làm bất cứ việc gì:
1. Trạng thái hiện tại (2-3 câu)
2. Việc còn dang dở + việc ưu tiên tiếp theo
3. Quyết định gần nhất có ảnh hưởng tới việc hôm nay (dẫn mã QĐ-xx)
4. Kế hoạch thực hiện đề xuất, chia bước nhỏ

RÀNG BUỘC BẮT BUỘC:
- Tuân thủ quyết định đã chốt trong 30_DECISIONS_LOG.md. Muốn làm khác một
  quyết định ✅ đang hiệu lực thì phải nói rõ đang đề xuất thay QĐ nào và vì sao,
  chờ tôi đồng ý. Không âm thầm làm khác.
- Dùng đúng thuật ngữ trong 09_GLOSSARY.md.
- KHÔNG sửa Logistics_System.xlsx bằng openpyxl/pandas/script — sẽ phá Power Query.
  Chỉ đưa hướng dẫn text để tôi tự thao tác trong Excel.
- KHÔNG đổi tên bảng Excel và tên cột nguồn.
- KHÔNG đề xuất SQL / Power BI / web app — đã ngoài phạm vi.
- Hướng dẫn từng bước một, tiếng Việt, ngắn gọn, chỉ rõ từng nút bấm,
  và luôn giải thích "tại sao".
- KHÔNG GIẢ ĐỊNH. Thiếu thông tin thì hỏi tôi. Nếu câu hỏi đã có trong
  31_OPEN_QUESTIONS.md thì hỏi luôn trước khi bắt tay.

Việc hôm nay: [MÔ TẢ VIỆC CỤ THỂ]
```

---

## B. Biến thể — dựng Sheet 50 (báo cáo CEO)

Dùng Prompt A, thay dòng cuối bằng:

```
Việc hôm nay: dựng Sheet 50 — báo cáo NGANG cho CEO.
Đọc thêm 22_REPORTING_SPEC.md.
Trước khi bắt tay, hỏi tôi Q-02, Q-03, Q-04, Q-05 trong 31_OPEN_QUESTIONS.md —
4 câu này đang chặn thiết kế.
```

## C. Biến thể — chạy chu kỳ tháng

```
Việc hôm nay: chạy chu kỳ tháng [YYYY-MM].
Đọc thêm 13_QC_AND_OPS.md. Dẫn tôi qua checklist theo thứ tự,
dừng ở từng bước chờ tôi xác nhận xong mới sang bước sau.
Đặc biệt nhắc tôi: gõ tay cột Mode cho Dolphin ở sheet 15.
```

## D. Biến thể — phân tích số liệu

```
Việc hôm nay: phân tích [CÂU HỎI CỤ THỂ].
Đọc thêm 12_DATA_DICTIONARY.md và 20_ANALYSIS_FRAMEWORK.md.
Lưu ý bẫy: kho là long format — tính đơn giá phải de-dup theo B/L trước
khi cộng CW/CBM, nếu không sẽ nhân lên nhiều lần.
Phân biệt rõ đâu là số thật lấy từ fact_CostLines, đâu là suy đoán của bạn.
```

---

## E. Prompt kết thúc phiên (đừng quên)

Chạy trước khi đóng chat để context không bị lệch:

```
Kết thúc phiên. Cập nhật context ở D:\Workspace\Logistics Ha:
1. Quyết định mới phát sinh → thêm vào 30_DECISIONS_LOG.md (kèm lý do).
   Nếu thay quyết định cũ → đánh dấu ⛔ dòng cũ, đừng xóa.
2. Thay đổi quy tắc nghiệp vụ → sửa 11_BUSINESS_RULES.md.
3. Thêm/sửa cột, query → cập nhật 10_MODEL_SPEC.md và 12_DATA_DICTIONARY.md.
4. Câu hỏi đã trả lời → xóa khỏi 31_OPEN_QUESTIONS.md, chuyển thành quyết định.
   Câu hỏi mới phát sinh → thêm vào.
5. Cập nhật 32_ROADMAP.md: việc vừa xong, việc ưu tiên tiếp theo.
Liệt kê cho tôi các file đã sửa và tóm tắt thay đổi.
```

---

## Vì sao prompt này thiết kế như vậy

| Thành phần | Lý do |
|---|---|
| Danh sách đọc **cố định 5 file** | Đủ để định hướng, không tốn context. Các file khác đọc theo nhu cầu |
| "Không quét toàn bộ thư mục" | Tránh nạp 1.500 dòng context cho một việc nhỏ |
| Bắt tóm tắt **trước khi** làm | Phát hiện sớm nếu AI hiểu sai trạng thái — rẻ hơn nhiều so với phát hiện sau khi đã sửa query |
| Bắt dẫn mã **QĐ-xx** | Buộc AI thật sự đọc decisions log, không đoán |
| "Không âm thầm làm khác quyết định" | Lỗi nguy hiểm nhất: AI tự ý thay quy tắc phân loại mà không báo |
| Nhắc lại 3 điều cấm | Đây là các lỗi đã thực sự xảy ra hoặc gây hậu quả nặng |
| "Không giả định — thiếu thì hỏi" | Còn 8 câu hỏi mở chưa chốt |
| Prompt kết thúc phiên | Context chỉ ổn định nếu được cập nhật. Không có bước này thì sau vài phiên sẽ lệch |
