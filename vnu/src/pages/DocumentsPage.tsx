import React, { useState, useEffect } from 'react';
import { useHead } from '@unhead/react';
import { DocumentList } from '../components/DocumentList';
import { Pagination } from '../components/Pagination';
import { Tabs } from '../components/Tabs';
import { useAppContext } from '../contexts/AppContext';

export const DocumentsPage: React.FC = () => {
  const {
    documents,
    universities,
    loading,
    currentPage,
    totalPages,
    fetchDocuments,
    searchTerm, // We'll handle search in a later step
    selectedUniversityId
  } = useAppContext();

  const [title, setTitle] = useState('Tài liệu & Đề thi - VNU DOCS HUB');
  const [description, setDescription] = useState('Tìm kiếm, chia sẻ và tải xuống hàng ngàn tài liệu, đề thi, và bài giảng từ các trường đại học trong ĐHQGHN.');

  useEffect(() => {
    const selectedUniversity = universities.find(u => u.id === selectedUniversityId);
    let newTitle = 'Tài liệu & Đề thi - VNU DOCS HUB';
    let newDescription = 'Tìm kiếm, chia sẻ và tải xuống hàng ngàn tài liệu, đề thi, và bài giảng từ các trường đại học trong ĐHQGHN. Một trung tâm tài nguyên học tập miễn phí cho sinh viên.';

    if (searchTerm) { // Using searchTerm directly now
        newTitle = `Kết quả tìm kiếm cho "${searchTerm}" - VNU DOCS HUB`;
        newDescription = `Xem kết quả tìm kiếm cho từ khóa '${searchTerm}' trên VNU Docs Hub.`;
    } else if (selectedUniversity) {
        newTitle = `Tài liệu ${selectedUniversity.abbreviation} - ${selectedUniversity.name} | VNU DOCS HUB`;
        newDescription = `Khám phá và tải xuống tài liệu, đề thi, và bài giảng từ ${selectedUniversity.name} - ${selectedUniversity.abbreviation}.`;
    }

    if (currentPage > 1) {
        newTitle = `${newTitle} - Trang ${currentPage}`;
        newDescription = `${newDescription} (Trang ${currentPage})`;
    }

    setTitle(newTitle);
    setDescription(newDescription);
  }, [currentPage, searchTerm, selectedUniversityId, universities]);

  useHead({
    title,
    meta: [
      { name: 'description', content: description }
    ]
  });

  const handlePageChange = (newPage: number) => {
    fetchDocuments(newPage);
  };
  
  if (loading && documents.length === 0) {
    // Show a loading indicator only on the initial load.
    // For subsequent page loads, the UI will show the old data while new data is fetched.
    return <div className="text-center p-10">Loading documents...</div>;
  }

  return (
    <>
      <Tabs />
      <DocumentList
        documents={documents}
        universities={universities}
      />
      <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
      />
    </>
  );
};