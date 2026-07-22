# 21 — Initiative Tracker (Sáng kiến Kaizen)

> **Trạng thái: CHƯA CÓ SÁNG KIẾN NÀO ĐƯỢC GHI NHẬN.**
> Bảng dưới là khung sẵn. Sáng kiến đầu tiên nên xuất phát từ giả thuyết trong `20_ANALYSIS_FRAMEWORK.md` mục 3.

## 1. Bảng theo dõi

| ID | Sáng kiến | Giả thuyết gốc | Chủ trì | Trạng thái | Baseline (USD/kỳ) | Target | Actual | Kỳ đo | Ghi chú |
|---|---|---|---|---|---|---|---|---|---|
| K-001 | *(trống)* | | | | | | | | |

**Trạng thái hợp lệ:** `Ý tưởng` → `Đang phân tích` → `Đã duyệt` → `Đang triển khai` → `Đang đo` → `Hoàn thành` / `Dừng`

## 2. Quy tắc ghi nhận

1. **Mỗi sáng kiến phải có baseline bằng số** lấy từ `fact_CostLines`, ghi rõ kỳ nào và phạm vi nào. Không có baseline = không đo được = không ghi vào bảng.
2. **Target phải có kỳ hạn.**
3. **Actual đo bằng cùng công thức với baseline**, cùng phạm vi. Nếu đổi công thức giữa chừng → ghi chú rõ.
4. **Chuẩn hóa theo khối lượng** khi khối lượng biến động (USD/kg, USD/CBM), nếu không sẽ nhầm "hàng ít hơn" thành "tiết kiệm được".
5. **Kiểm tỷ giá** trước khi kết luận tiết kiệm — tỷ giá đổi có thể tạo tiết kiệm ảo.
6. Sáng kiến bị dừng cũng **giữ lại dòng**, ghi lý do — tránh đề xuất lại cùng một thứ.

## 3. Cải tiến đã thực hiện (về quy trình, không phải chi phí)

Đây là các Kaizen về **thời gian và độ tin cậy**, đã hoàn thành trong dự án:

| # | Cải tiến | Trước | Sau | Trạng thái |
|---|---|---|---|---|
| P-01 | Tự động hóa gộp debit bằng Power Query | ~4 tiếng/tháng, SUMIF thủ công | Dán + Refresh, mục tiêu ~30 phút | ✅ tầng dữ liệu xong, chờ sheet 50 để đo đủ |
| P-02 | Tự-link B/L cho VVMV hàng xuất | Gõ tay từng lô | Tự dò invoice → Tracking#, 37/37 khớp | ✅ |
| P-03 | Lưới QC tự động (sheet 60) | Không có, lỗi lọt tới báo cáo | Bắt 6 loại lỗi trước khi báo cáo | ✅ |
| P-04 | Chuẩn hóa tên phí bằng từ điển `Map_Cost` | Đổi tay từng dòng | Merge tự động, tên lạ rơi vào QC | ✅ |
| P-05 | Kho dữ liệu tái sử dụng (`fact_CostLines`) | Làm thẳng ra báo cáo, không phân tích lại được | Cắt được theo mọi chiều | ✅ |

> Lưu ý khi báo cáo thành quả: **P-01 chưa đo được đầy đủ** cho tới khi sheet 50 chạy, vì hiện vẫn phải ráp báo cáo cuối bằng tay.

## 4. Ý tưởng chờ đánh giá

Chưa được chốt là sáng kiến — cần số liệu trước.

| Ý tưởng | Xuất phát từ | Cần gì để đánh giá |
|---|---|---|
| Chuyển một phần lô Air sang Sea | H1 | Dữ liệu ngày/lead time (**hiện chưa có trong kho**) |
| Đàm phán lại đơn giá với forwarder đắt nhất | H2 | Đơn giá USD/kg, USD/CBM theo forwarder cùng tuyến |
| Siết local charge | H3 | Tỷ lệ LCC/Freight nhiều tháng |
| Thu hồi chi phí Third party | H7 | Tổng Third party + cơ chế thu |
| Khai thác biên pay-on-behalf | H5 | Sheet 18 (chưa dựng) |

## 5. `[GAP]` cản trở phân tích Kaizen

Kho hiện **chưa có** các trường sau, làm hạn chế phân tích:

- **Ngày** (ngày chứng từ / ngày lô hàng) → không đo được lead time, không phân tích được tính gấp
- **Số lượng / trọng lượng ở mức lô đã de-dup** → phải tự xử lý khi tính đơn giá
- **Incoterm** → không biết ai chịu chi phí nào theo hợp đồng
- **Giá trị hàng hóa** → không tính được tỷ lệ chi phí logistics / giá trị hàng

Nếu muốn Kaizen sâu, cân nhắc bổ sung trường ngày vào staging. Nhưng theo nguyên tắc "ổn định > tối ưu", chỉ làm khi đã xong sheet 50 và làm trên bản copy trước.
