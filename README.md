# Auto Skip Ads

Extension cho Edge/Chrome: tự bấm nút Bỏ qua quảng cáo video, tắt tiếng
và tua nhanh quảng cáo để nhạc không bị gián đoạn khi bạn không ngồi trước máy.

## Cài thủ công

1. Tải hoặc clone repo này về một thư mục cố định.
2. Mở `edge://extensions` (hoặc `chrome://extensions`) và bật **Developer mode**.
3. Bấm **Load unpacked** rồi chọn thư mục repo.

## Cách hoạt động

- Phát hiện quảng cáo qua class `ad-showing` của player.
- Tắt tiếng, tua nhanh 16x, và thử bấm nút Skip khi nút hiện ra.
- Hết quảng cáo thì trả lại tiếng và tốc độ phát bình thường.

## Lưu ý

- Dự án cá nhân, không liên kết với YouTube hay Google.
- Giao diện YouTube thay đổi thường xuyên nên extension có thể ngừng hoạt động.
- Tự động xử lý quảng cáo có thể đi ngược điều khoản sử dụng của YouTube. Hãy tự chịu trách nhiệm khi dùng.