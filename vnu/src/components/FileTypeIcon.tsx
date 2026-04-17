import React from 'react';
import { FileType } from '../types';
import { FilePdfIcon } from './icons/FilePdfIcon';
import { FileDocxIcon } from './icons/FileDocxIcon';
import { FilePptxIcon } from './icons/FilePptxIcon';
import { FileZipIcon } from './icons/FileZipIcon';
import { FileImageIcon } from './icons/FileImageIcon';
import { FileTextIcon } from './icons/FileTextIcon';
import { FileHtmlIcon } from './icons/FileHtmlIcon';

interface FileTypeIconProps {
    fileType: FileType;
    className?: string;
}

export const FileTypeIcon: React.FC<FileTypeIconProps> = ({ fileType, className = "h-24 w-24" }) => {
    switch (fileType) {
        case 'PDF':
            return <FilePdfIcon className={`${className} text-red-600`} />;
        case 'DOCX':
        case 'DOC':
        case 'XLSX':
            return <FileDocxIcon className={`${className} text-blue-600`} />;
        case 'PPTX':
        case 'PPT':
            return <FilePptxIcon className={`${className} text-orange-600`} />;
        case 'ZIP':
        case 'RAR':
            return <FileZipIcon className={`${className} text-gray-600`} />;
        case 'JPEG':
        case 'PNG':
        case 'GIF':
            return <FileImageIcon className={`${className} text-green-600`} />;
        case 'TXT':
        case 'CSV':
        case 'IPYNB':
            return <FileTextIcon className={`${className} text-gray-500`} />;
        case 'HTML':
            return <FileHtmlIcon className={`${className} text-purple-600`} />;
        default:
            // Return a generic icon for any unhandled cases
            return <FileTextIcon className={`${className} text-gray-400`} />;
    }
};