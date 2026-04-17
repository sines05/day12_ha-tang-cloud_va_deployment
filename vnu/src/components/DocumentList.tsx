import React from 'react';
import type { Document, University } from '../types';
import { DocumentCard } from './DocumentCard';
import emptyDocsImg from '../assets/images/empty_docs.webp';

interface DocumentListProps {
  documents: Document[];
  universities: University[];
}

export const DocumentList: React.FC<DocumentListProps> = ({ documents, universities }) => {
  const universityMap = new Map(universities.map(uni => [uni.id, uni]));

  if (documents.length === 0) {
    return (
        <div className="flex flex-col items-center justify-center p-12 my-8 border-[3px] border-black bg-yellow-100 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-transform hover:-translate-y-1 hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] duration-200 ease-in-out">
            <img 
              src={emptyDocsImg} 
              alt="No documents found" 
              className="w-56 h-56 mb-6 object-contain mix-blend-multiply" 
              loading="lazy" 
              decoding="async" 
            />
            <h3 className="text-2xl font-bold text-black uppercase mb-2 tracking-tight">It's empty in here!</h3>
            <p className="text-black font-medium text-lg max-w-md text-center">No documents found. Try a different filter or search term.</p>
        </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {documents.map((doc) => {
        const university = universityMap.get(doc.universityId);
        return (
            <DocumentCard 
                key={doc.id} 
                document={doc} 
                university={university}
            />
        );
      })}
    </div>
  );
};