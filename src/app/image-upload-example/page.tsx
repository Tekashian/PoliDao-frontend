"use client";
import { useState } from "react";
import Image from "next/image";

interface UploadResponse {
  success: boolean;
  imageId: string;
  url: string; // ADD: URL field
  filename: string;
  message: string;
}

export default function ImageUploadExample() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [uploadResult, setUploadResult] = useState<UploadResponse | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string>("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setError("");
      setUploadResult(null);
      
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async () => {
    if (!selectedFile) {
      setError("Proszę wybrać plik");
      return;
    }

    setIsUploading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        setUploadResult(result);
      } else {
        setError(result.error || "Błąd podczas przesyłania");
      }
    } catch (error) {
      console.error("Upload error:", error);
      setError("Błąd podczas przesyłania pliku");
    } finally {
      setIsUploading(false);
    }
  };

  const resetForm = () => {
    setSelectedFile(null);
    setImagePreview("");
    setUploadResult(null);
    setError("");
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Test Przesyłania Zdjęć</h1>
      
      <div className="space-y-6">
        {/* File Input */}
        <div>
          <label htmlFor="file" className="block text-sm font-medium mb-2">
            Wybierz zdjęcie
          </label>
          <input
            type="file"
            id="file"
            accept="image/*"
            onChange={handleFileChange}
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-sm text-gray-500 mt-1">
            Obsługiwane formaty: JPEG, PNG, GIF, WebP (max 10MB)
          </p>
        </div>

        {/* Image Preview */}
        {imagePreview && (
          <div>
            <h3 className="text-lg font-medium mb-2">Podgląd:</h3>
            <Image
              src={imagePreview}
              alt="Preview"
              width={400}
              height={300}
              className="rounded-md object-cover border"
            />
            <div className="mt-4 flex gap-4">
              <button
                onClick={uploadImage}
                disabled={isUploading}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {isUploading ? "Przesyłanie..." : "Prześlij"}
              </button>
              <button
                onClick={resetForm}
                className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
              >
                Reset
              </button>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-800">❌ {error}</p>
          </div>
        )}

        {/* Success Result */}
        {uploadResult && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-md">
            <h3 className="text-lg font-medium text-green-800 mb-2">
              ✅ Przesłano pomyślnie!
            </h3>
            <div className="space-y-2 text-sm">
              <p><strong>ID w MongoDB:</strong> {uploadResult.imageId}</p>
              <p><strong>Nazwa pliku:</strong> {uploadResult.filename}</p>
              <p><strong>URL:</strong> 
                <a 
                  href={uploadResult.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline ml-1"
                >
                  {uploadResult.url}
                </a>
              </p>
            </div>
            
            <div className="mt-4">
              <h4 className="font-medium mb-2">Zdjęcie z MongoDB:</h4>
              {uploadResult.url && (
                <Image
                  src={uploadResult.url}
                  alt="Uploaded"
                  width={400}
                  height={300}
                  className="rounded-md object-cover border"
                  unoptimized // ADD: disable Next.js optimization for our custom endpoint
                />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
