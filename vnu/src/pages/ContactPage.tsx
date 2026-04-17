import React from 'react';

export const ContactPage: React.FC = () => {
  return (
    <div className="prose dark:prose-invert max-w-none p-4 bg-white border-2 border-black" style={{ boxShadow: '8px 8px 0px rgba(0,0,0,1)' }}>
      <h1 className="text-3xl font-bold border-b-2 border-black pb-2 mb-4">Liên hệ</h1>
      <p className="text-lg">
        Chúng tôi luôn lắng nghe mọi ý kiến đóng góp, báo cáo lỗi, hoặc các yêu cầu hợp tác để cải thiện VNU Docs Hub ngày một tốt hơn.
      </p>
      <p className="text-lg">
        Mọi thông tin chi tiết xin vui lòng gửi email về địa chỉ:
        {' '}
        <a href="mailto:contact.vnudocshub@email.com" className="text-blue-600 hover:underline">contact@vnudocshub.com</a>
      </p>
      <p className="text-lg">
        Chúng tôi sẽ cố gắng phản hồi trong thời gian sớm nhất. Xin cảm ơn!
      </p>
    </div>
  );
};
