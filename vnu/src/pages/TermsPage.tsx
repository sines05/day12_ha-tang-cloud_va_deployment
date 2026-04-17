import React from 'react';

export const TermsPage: React.FC = () => {
  return (
    <div className="prose dark:prose-invert max-w-none p-6 bg-white border-2 border-black" style={{ boxShadow: '8px 8px 0px rgba(0,0,0,1)' }}>
      <h1 className="text-3xl font-bold border-b-2 border-black pb-2 mb-2">Điều khoản & Quy định</h1>
      <p className="text-sm text-gray-500 mb-6">Cập nhật lần cuối: Ngày 1 tháng 1, 2026</p>
      
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold">1. Giới thiệu</h2>
        <p>Chào mừng bạn đến với VNU Docs Hub! Chúng tôi là một nền tảng cộng đồng, hoạt động với mục tiêu tạo ra một không gian minh bạch và ẩn danh để sinh viên chia sẻ, tham khảo các đánh giá, nhận xét về giảng viên và môn học. Bằng việc truy cập và sử dụng website, bạn mặc nhiên đồng ý với toàn bộ các điều khoản được nêu dưới đây.</p>
        <p>Nền tảng này được xây dựng trên nguyên tắc ẩn danh. Chúng tôi không yêu cầu đăng ký, không thu thập thông tin định danh cá nhân. Mọi nội dung đều do cộng đồng đóng góp, chỉ mang tính tham khảo và không đại diện cho quan điểm của bất kỳ tổ chức hay cá nhân nào.</p>

        <h2 className="text-2xl font-semibold">2. Nguyên tắc Ẩn danh</h2>
        <p>Tính ẩn danh là cốt lõi trong hoạt động của VNU Docs Hub. Chúng tôi cam kết:</p>
        <ul className="list-disc list-inside space-y-2">
            <li><strong>Không yêu cầu tài khoản:</strong> Bạn có toàn quyền đọc, tìm kiếm và đăng tải nội dung mà không cần đăng nhập hay cung cấp bất kỳ thông tin cá nhân nào.</li>
            <li><strong>Không truy vết định danh:</strong> Các bài đăng không được gắn với bất kỳ thông tin nào có thể định danh người viết.</li>
            <li><strong>Lưu trữ IP vì lý do an ninh:</strong> Để bảo vệ hệ thống khỏi spam và lạm dụng, địa chỉ IP của bạn có thể được ghi lại khi đăng tải nội dung. Dữ liệu này được xử lý riêng biệt, không liên kết với nội dung bài đăng và sẽ được xóa định kỳ. Chúng tôi cam kết không sử dụng dữ liệu này để xác định danh tính người dùng.</li>
            <li><strong>Không thể sửa/xóa nội dung:</strong> Do không có tài khoản, bạn sẽ không thể tự mình chỉnh sửa hoặc xóa nội dung đã đăng. Vui lòng cân nhắc kỹ trước khi gửi.</li>
        </ul>

        <h2 className="text-2xl font-semibold">3. Trách nhiệm về Nội dung</h2>
        <p>Là một nền tảng mở, trách nhiệm về nội dung thuộc về người đăng tải.</p>
        <ul className="list-disc list-inside space-y-2">
            <li><strong>Trách nhiệm của bạn:</strong> Bạn hoàn toàn chịu trách nhiệm về mặt pháp lý và đạo đức đối với nội dung mình đăng tải. Hãy đảm bảo nội dung của bạn là trung thực và mang tính xây dựng.</li>
            <li><strong>Nội dung bị cấm:</strong> Nghiêm cấm mọi nội dung lăng mạ, vu khống, bôi nhọ, tiết lộ thông tin cá nhân của người khác trái phép, hoặc các nội dung vi phạm pháp luật và thuần phong mỹ tục.</li>
            <li><strong>Quyền của chúng tôi:</strong> Ban quản trị VNU Docs Hub có quyền kiểm duyệt và gỡ bỏ bất kỳ nội dung nào vi phạm các quy định trên mà không cần thông báo trước.</li>
        </ul>

        <h2 className="text-2xl font-semibold">4. Từ chối Trách nhiệm</h2>
        <p>Chúng tôi không chịu trách nhiệm về tính chính xác hay hậu quả phát sinh từ nội dung do người dùng đăng tải.</p>
        <ul className="list-disc list-inside space-y-2">
            <li>Mọi thông tin trên website chỉ mang tính chất tham khảo. Người dùng cần tự mình đánh giá và chịu rủi ro khi sử dụng thông tin.</li>
            <li>Chúng tôi không đảm bảo dịch vụ sẽ luôn hoạt động liên tục, không có lỗi kỹ thuật hoặc không bị gián đoạn.</li>
        </ul>
        
        <h2 className="text-2xl font-semibold">5. Quyền Sở hữu Trí tuệ</h2>
        <p>Chúng tôi tôn trọng quyền sở hữu trí tuệ và yêu cầu người dùng cũng làm như vậy.</p>
        <ul className="list-disc list-inside space-y-2">
            <li><strong>Nội dung của bạn:</strong> Bạn giữ quyền sở hữu với nội dung gốc mình tạo ra. Tuy nhiên, bằng việc đăng tải, bạn cấp cho VNU Docs Hub quyền sử dụng vĩnh viễn, miễn phí để hiển thị, lưu trữ và định dạng lại nội dung đó trên nền tảng.</li>
            <li><strong>Nền tảng của chúng tôi:</strong> Giao diện, logo, và mã nguồn của website thuộc về VNU Docs Hub. Mọi hành vi sao chép, nhân bản vì mục đích thương mại mà không có sự cho phép đều bị nghiêm cấm.</li>
        </ul>

        <h2 className="text-2xl font-semibold">6. Chính sách Bảo mật</h2>
        <p>Chính sách này làm rõ cách chúng tôi xử lý dữ liệu theo nguyên tắc ẩn danh.</p>
        <ul className="list-disc list-inside space-y-2">
            <li><strong>Thu thập dữ liệu:</strong> Như đã nêu ở mục 2, chúng tôi chỉ ghi lại tạm thời dữ liệu kỹ thuật tối thiểu (như địa chỉ IP) để đảm bảo an ninh hệ thống. Chúng tôi không thu thập thông tin định danh cá nhân.</li>
            <li><strong>Không chia sẻ dữ liệu:</strong> Chúng tôi cam kết không bán, chia sẻ hoặc trao đổi dữ liệu kỹ thuật này cho bất kỳ bên thứ ba nào.</li>
            <li><strong>Liên hệ về bảo mật:</strong> Mọi thắc mắc về bảo mật, vui lòng liên hệ qua địa chỉ email được cung cấp tại trang "Liên hệ".</li>
        </ul>

        <h2 className="text-2xl font-semibold">7. Thay đổi Điều khoản</h2>
        <p>Chúng tôi có quyền cập nhật các điều khoản này vào bất kỳ lúc nào. Các thay đổi sẽ có hiệu lực ngay khi được đăng tải. Việc bạn tiếp tục sử dụng website sau khi có thay đổi đồng nghĩa với việc bạn chấp nhận các điều khoản mới.</p>
      </div>
    </div>
  );
};
