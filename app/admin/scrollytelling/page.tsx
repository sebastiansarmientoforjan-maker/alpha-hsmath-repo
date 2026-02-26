'use client';

import { useState } from 'react';
import { BrutalCard, BrutalInput } from '@/components/ui';
import { FileUploader } from '@/components/ui/FileUploader';
import { uploadHtmlReport } from '@/lib/uploadHtmlReport';

export default function ScrollytellingAdmin() {
  const [title, setTitle] = useState('');
  const [tags, setTags] = useState('');
  const [status, setStatus] = useState<'Published' | 'Archived' | 'Draft'>('Draft');

  const handleUpload = async (files: File[]) => {
    if (!title) {
      alert('Please enter a title for the report');
      return;
    }

    try {
      const tagsArray = tags.split(',').map((tag) => tag.trim()).filter(Boolean);

      // Upload each file
      for (const file of files) {
        await uploadHtmlReport(file, title, tagsArray, status);
      }

      // Reset form
      setTitle('');
      setTags('');
      setStatus('Draft');
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload files. Make sure Firebase is configured correctly.');
    }
  };

  return (
    <div>
      <h1 className="text-4xl font-bold text-dark mb-2">Scrollytelling Reports</h1>
      <p className="text-dark/70 mb-8">
        Upload immersive HTML reports with scrollytelling narratives
      </p>

      <BrutalCard className="mb-6">
        <h2 className="text-xl font-bold text-dark mb-4">Report Metadata</h2>

        <div className="space-y-4">
          <BrutalInput
            label="Report Title"
            placeholder="e.g., Q1 Algebra Masters Analysis"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <BrutalInput
            label="Tags (comma-separated)"
            placeholder="e.g., algebra, Q1, analysis"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
          />

          <div>
            <label className="block text-dark font-bold mb-2 text-sm uppercase tracking-wide">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className="w-full border-4 border-dark bg-white px-4 py-3 text-dark font-medium focus:outline-none focus:shadow-[4px_4px_0px_0px_rgba(18,18,18,1)]"
            >
              <option value="Draft">Draft</option>
              <option value="Published">Published</option>
              <option value="Archived">Archived</option>
            </select>
          </div>
        </div>
      </BrutalCard>

      <BrutalCard>
        <h2 className="text-xl font-bold text-dark mb-4">Upload Files</h2>
        <FileUploader onUpload={handleUpload} accept=".html" multiple />
      </BrutalCard>

      <div className="mt-6 p-4 border-4 border-alert-orange bg-alert-orange/10">
        <p className="font-bold text-dark mb-2">⚠️ Important Notes:</p>
        <ul className="text-sm text-dark/80 space-y-1 list-disc list-inside font-serif">
          <li>HTML files should be self-contained with embedded styles and scripts</li>
          <li>Large external dependencies may affect loading performance</li>
          <li>Only Published reports will appear in the public Gallery</li>
          <li>Make sure Firebase is configured in .env.local before uploading</li>
        </ul>
      </div>
    </div>
  );
}
