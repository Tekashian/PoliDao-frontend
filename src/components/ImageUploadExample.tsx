'use client';

import React, { useState, useRef } from 'react';
import { useImageUpload } from '@/hooks/useImageUpload';

interface FundraiserData {
  title: string;
  description: string;
  targetAmount: string;
  imageUrl?: string;
}

export default function ImageUploadExample() {
  const [fundraiserData, setFundraiserData] = useState<FundraiserData>({
    title: '',
    description: '',
    targetAmount: '',
  });
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadImage, isUploading, error, progress } = useImageUpload();

  // Handle file selection
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    
    // Create preview URL
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  // Handle form submission
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!fundraiserData.title || !fundraiserData.description) {
      alert('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);

    try {
      let imageUrl = '';

      // First, upload image if selected
      if (selectedFile) {
        console.log('📤 Uploading image...');
        imageUrl = await uploadImage(selectedFile);
        console.log('✅ Image uploaded, URL:', imageUrl);
      }

      // Then create fundraiser with image URL
      const fundraiserPayload = {
        ...fundraiserData,
        imageUrl,
      };

      console.log('📝 Creating fundraiser:', fundraiserPayload);
      
      // Here you would call your fundraiser creation API
      // await createFundraiser(fundraiserPayload);
      
      alert(`Fundraiser created successfully! ${imageUrl ? `Image URL: ${imageUrl}` : 'No image'}`);
      
      // Reset form
      setFundraiserData({ title: '', description: '', targetAmount: '' });
      setSelectedFile(null);
      setPreviewUrl('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

    } catch (error) {
      console.error('❌ Submission error:', error);
      alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof FundraiserData, value: string) => {
    setFundraiserData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Create Fundraiser with Image</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Image Upload Section */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Fundraiser Image (Optional)
          </label>
          
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
          
          {error && (
            <p className="mt-2 text-sm text-red-600">❌ {error}</p>
          )}
          
          {isUploading && (
            <div className="mt-2">
              <div className="flex items-center">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <span className="ml-2 text-sm text-gray-600">{progress}%</span>
              </div>
              <p className="text-sm text-gray-600 mt-1">📤 Uploading...</p>
            </div>
          )}
          
          {previewUrl && (
            <div className="mt-4">
              <p className="text-sm text-gray-600 mb-2">Preview:</p>
              <img 
                src={previewUrl} 
                alt="Preview" 
                className="w-full max-w-sm h-48 object-cover rounded-lg border"
              />
            </div>
          )}
        </div>

        {/* Form Fields */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Title *
          </label>
          <input
            type="text"
            value={fundraiserData.title}
            onChange={(e) => handleInputChange('title', e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter fundraiser title"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description *
          </label>
          <textarea
            value={fundraiserData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            required
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Describe your fundraiser"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Target Amount (USDC) *
          </label>
          <input
            type="number"
            value={fundraiserData.targetAmount}
            onChange={(e) => handleInputChange('targetAmount', e.target.value)}
            required
            min="1"
            step="0.01"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="1000.00"
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting || isUploading}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
        >
          {isSubmitting ? (
            <div className="flex items-center justify-center">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
              Creating Fundraiser...
            </div>
          ) : (
            '🚀 Create Fundraiser'
          )}
        </button>
      </form>

      {/* Display Created Image */}
      {fundraiserData.imageUrl && (
        <div className="mt-6 p-4 bg-green-50 rounded-lg">
          <h3 className="text-lg font-medium text-green-800 mb-2">✅ Image Uploaded</h3>
          <p className="text-sm text-green-700 mb-2">URL: {fundraiserData.imageUrl}</p>
          <img 
            src={fundraiserData.imageUrl} 
            alt="Uploaded" 
            className="w-full max-w-sm h-48 object-cover rounded-lg border"
          />
        </div>
      )}
    </div>
  );
}
