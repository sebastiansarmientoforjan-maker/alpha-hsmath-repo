'use client';

import React, { useState, useCallback } from 'react';
import { Upload, X, CheckCircle } from 'lucide-react';
import { BrutalButton } from './BrutalButton';

interface FileUploaderProps {
  onUpload: (files: File[]) => Promise<void>;
  accept?: string;
  multiple?: boolean;
}

export const FileUploader: React.FC<FileUploaderProps> = ({
  onUpload,
  accept = '.html',
  multiple = true,
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadComplete, setUploadComplete] = useState(false);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      const droppedFiles = Array.from(e.dataTransfer.files).filter((file) =>
        file.name.endsWith('.html')
      );

      if (droppedFiles.length > 0) {
        setFiles(multiple ? [...files, ...droppedFiles] : [droppedFiles[0]]);
      }
    },
    [files, multiple]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      setFiles(multiple ? [...files, ...selectedFiles] : [selectedFiles[0]]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (files.length === 0) return;

    setUploading(true);
    try {
      await onUpload(files);
      setUploadComplete(true);
      setTimeout(() => {
        setFiles([]);
        setUploadComplete(false);
      }, 2000);
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="w-full">
      {/* Drop Zone */}
      <div
        className={`relative border-4 border-dashed p-12 transition-all ${
          dragActive
            ? 'border-cool-blue bg-cool-blue/10'
            : 'border-dark bg-white hover:bg-bg-light'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          id="file-upload"
          className="hidden"
          accept={accept}
          multiple={multiple}
          onChange={handleChange}
        />

        <label
          htmlFor="file-upload"
          className="flex flex-col items-center justify-center cursor-pointer"
        >
          <Upload size={48} className="text-dark mb-4" />
          <p className="text-lg font-bold text-dark mb-2">
            Drag & Drop HTML Files Here
          </p>
          <p className="text-sm text-dark/60">or click to browse</p>
        </label>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="mt-6 space-y-3">
          {files.map((file, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-4 border-4 border-dark bg-white"
            >
              <div className="flex items-center gap-3">
                <Upload size={20} className="text-cool-blue" />
                <span className="font-medium text-dark">{file.name}</span>
                <span className="text-sm text-dark/60">
                  ({(file.size / 1024).toFixed(2)} KB)
                </span>
              </div>
              <button
                onClick={() => removeFile(index)}
                className="text-alert-orange hover:text-dark transition-colors"
              >
                <X size={20} />
              </button>
            </div>
          ))}

          <div className="flex gap-4">
            <BrutalButton
              onClick={handleUpload}
              disabled={uploading || uploadComplete}
              variant="primary"
            >
              {uploading ? 'Uploading...' : uploadComplete ? 'Success!' : 'Upload Files'}
            </BrutalButton>

            {uploadComplete && (
              <div className="flex items-center gap-2 text-cool-blue font-bold">
                <CheckCircle size={20} />
                Files uploaded successfully
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
