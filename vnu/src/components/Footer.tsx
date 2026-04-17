import React from 'react';
import { Link } from 'react-router-dom';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-100 dark:bg-gray-800 mt-12 py-6 border-t-2 border-black">
      <div className="container mx-auto px-4 flex flex-col sm:flex-row justify-between items-center text-sm text-gray-600 dark:text-gray-400">
        <div className="mb-4 sm:mb-0">
          <p>&copy; {new Date().getFullYear()} VNU Docs Hub. All Rights Reserved.</p>
        </div>
        <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-6">
          <Link to="/about" className="hover:text-gray-900 dark:hover:text-white hover:underline">
            Giới thiệu
          </Link>
          <Link to="/contact" className="hover:text-gray-900 dark:hover:text-white hover:underline">
            Liên hệ
          </Link>
          <Link to="/terms" className="hover:text-gray-900 dark:hover:text-white hover:underline">
            Điều khoản & Bảo mật
          </Link>
        </div>
      </div>
    </footer>
  );
};
