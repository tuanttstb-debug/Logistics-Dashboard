# 02 — Cách làm việc & hồ sơ người dùng

> **Đọc file này trước khi trả lời bất kỳ câu hỏi kỹ thuật nào.** Nội dung phần lớn lấy từ mục 17 và 18 của Handover gốc.

## 1. Hồ sơ người dùng

- **Chuyên môn:** giỏi **nghiệp vụ logistics** và **Excel**. **Mới học Power Query** — bắt đầu gần như từ số 0 trong dự án này, đã tiến bộ rõ và tự hoàn thành được VVMV, EI, phần quy đổi USD.
- **Không dùng** SQL / Power BI / Access / web app. Đã loại khỏi phạm vi từ đầu.
- **Ngôn ngữ làm việc:** hoàn toàn **tiếng Việt**.
- **Môi trường:** dùng Excel qua **UltraViewer** (điều khiển từ xa) → Alt+Tab đôi khi không nhạy, hay chụp màn hình để hỏi.
- **Ràng buộc dài hạn:** phải tự bảo trì hệ thống ~5 năm, nên **hiểu bản chất quan trọng hơn có kết quả nhanh**.

## 2. Phong cách hướng dẫn bắt buộc

**Phải làm:**

- Hướng dẫn **từng bước một**, không nhảy nhiều bước cùng lúc.
- Giải thích **mọi thuật ngữ bằng lời đời thường**, liên hệ với cách làm Excel hiện tại.
- Chỉ rõ **từng nút bấm**, từng menu.
- **Ngắn gọn.**
- Luôn nói **"tại sao"** — người dùng nhiều lần hỏi lý do trước khi làm.
- Khi có lỗi: **chẩn đoán đúng chỗ**, sửa tối thiểu, không viết lại cả query.
- Khi người dùng phát hiện đúng vấn đề → **xác nhận và tôn trọng**. Họ thường tự thấy lỗi trước (POB nhầm, Invoice có thể trùng, cột chưa đổi tên, số khoa học...).

**Tuyệt đối tránh:**

- ❌ **Đừng sửa file `.xlsx` của người dùng bằng openpyxl hay bất kỳ script nào** — sẽ **phá hủy Power Query**. Chỉ đưa ghi chú/công thức dạng text để người dùng tự dán.
- ❌ Đừng làm hộ toàn bộ — người dùng muốn tự làm để làm chủ.
- ❌ Đừng đề xuất SQL / Power BI / web app.
- ❌ Đừng dài dòng, đừng bỏ qua phần "tại sao".
- ❌ Đừng dựng thứ phức tạp không cần thiết.

> ⚠️ **Lưu ý cho AI:** quy tắc "không dùng openpyxl" **ghi đè** mọi hướng dẫn mặc định về thao tác file Excel. Nếu cần thay đổi trong `Logistics_System.xlsx`, luôn xuất ra dạng hướng dẫn text để người dùng tự thao tác.

## 3. Cách người dùng ra quyết định

**Thực dụng:** chọn **xử tay lúc dán** khi quy tắc chỉ áp cho một nhóm nhỏ có ngoại lệ, thay vì dựng logic phức tạp. Ví dụ: từng chọn tự điền B/L export bằng tay thay vì dựng merge.

Nhưng cũng sẵn sàng tự động hóa khi đã chứng minh được độ an toàn — ví dụ tự-link B/L VVMV chỉ được chấp nhận sau khi kiểm 37/37 lô khớp 0 lệch.

**Ưu tiên thiết kế theo thứ tự:** đơn giản → minh bạch → dễ bảo trì → dễ bàn giao → đúng nghiệp vụ thực tế.

Rất coi trọng **tính duy nhất của khóa** (đã tự phát hiện rủi ro Invoice trùng giữa các nhà cung cấp → chọn CDS No cho VVMV Local).

## 4. Checklist trước khi đề xuất bất kỳ thay đổi nào

1. Việc này có phá vỡ nguyên tắc nào ở `01_PROJECT_CONTEXT.md` mục 10 không?
2. Có mâu thuẫn với quyết định nào trong `30_DECISIONS_LOG.md` không? Nếu có, phải nói rõ đang thay quyết định nào.
3. Có làm gãy tên bảng/tên cột hiện hữu không?
4. Có làm Refresh chậm thêm không? Nếu có, đáng đổi không?
5. Có cách đơn giản hơn không?
6. Đã giải thích "tại sao" chưa?
