import React from 'react';

export const AboutPage: React.FC = () => {
  return (
    <div className="prose dark:prose-invert max-w-none p-4 bg-white border-2 border-black" style={{ boxShadow: '8px 8px 0px rgba(0,0,0,1)' }}>
      <h1 className="text-3xl font-bold border-b-2 border-black pb-2 mb-4">Về VNU Docs Hub</h1>
      <p className="text-lg">
        VNU Docs Hub là một dự án được tạo ra với mục tiêu xây dựng một cộng đồng chia sẻ kiến thức cởi mở và miễn phí dành riêng cho sinh viên Đại học Quốc gia Hà Nội.
      </p>
      <p className="text-lg">
        Sứ mệnh của chúng tôi là cung cấp một nền tảng tập trung, nơi sinh viên có thể dễ dàng tìm kiếm, tải xuống và chia sẻ tài liệu học tập, đề thi, và các ghi chú hữu ích. Bên cạnh đó, chúng tôi cũng khuyến khích việc đưa ra những đánh giá chân thực và khách quan về các giảng viên để giúp các thế hệ sinh viên sau có những lựa chọn tốt nhất cho con đường học vấn của mình.
      </p>
      <p className="text-lg">
        Dự án được xây dựng và phát triển với mong muốn góp phần tạo ra một môi trường học thuật năng động và tương trợ lẫn nhau.
      </p>
    </div>
  );
};
