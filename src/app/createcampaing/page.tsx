"use client";
import { useState } from "react";
import Image from "next/image";

interface UploadResponse {
  success: boolean;
  imageId: string;
  cid: string;
  url: string;
  filename: string;
  message: string;
}

export default function CreateCampaignPage() {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    targetAmount: "",
    deadline: "",
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [uploadedImage, setUploadedImage] = useState<UploadResponse | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        setUploadedImage(result);
        alert("Zdjęcie zostało przesłane pomyślnie!");
      } else {
        alert(`Błąd: ${result.error}`);
      }
    } catch (error) {
      console.error("Upload error:", error);
      alert("Błąd podczas przesyłania pliku");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!uploadedImage) {
      alert("Proszę najpierw przesłać zdjęcie");
      return;
    }

    setIsSubmitting(true);
    try {
      const campaignData = {
        ...formData,
        imageId: uploadedImage.imageId,
        imageCid: uploadedImage.cid,
        imageUrl: uploadedImage.url,
      };

      // TODO: Implement campaign creation API
      console.log("Campaign data:", campaignData);
      alert("Zbiórka zostanie utworzona (TODO: implement API)");
    } catch (error) {
      console.error("Campaign creation error:", error);
      alert("Błąd podczas tworzenia zbiórki");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Utwórz Nową Zbiórkę</h1>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium mb-2">
            Tytuł zbiórki
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            required
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            placeholder="Wprowadź tytuł zbiórki"
          />
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium mb-2">
            Opis
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            required
            rows={4}
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            placeholder="Opisz swoją zbiórkę"
          />
        </div>

        {/* Target Amount */}
        <div>
          <label htmlFor="targetAmount" className="block text-sm font-medium mb-2">
            Kwota docelowa (ETH)
          </label>
          <input
            type="number"
            id="targetAmount"
            name="targetAmount"
            value={formData.targetAmount}
            onChange={handleInputChange}
            required
            step="0.01"
            min="0"
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            placeholder="0.00"
          />
        </div>

        {/* Deadline */}
        <div>
          <label htmlFor="deadline" className="block text-sm font-medium mb-2">
            Termin zakończenia
          </label>
          <input
            type="date"
            id="deadline"
            name="deadline"
            value={formData.deadline}
            onChange={handleInputChange}
            required
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Image Upload */}
        <div>
          <label htmlFor="image" className="block text-sm font-medium mb-2">
            Zdjęcie zbiórki
          </label>
          <input
            type="file"
            id="image"
            accept="image/*"
            onChange={handleFileChange}
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
          />
          
          {imagePreview && (
            <div className="mt-4">
              <Image
                src={imagePreview}
                alt="Preview"
                width={300}
                height={200}
                className="rounded-md object-cover"
              />
              <button
                type="button"
                onClick={uploadImage}
                disabled={isUploading}
                className="mt-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                {isUploading ? "Przesyłanie..." : "Prześlij Zdjęcie"}
              </button>
            </div>
          )}

          {uploadedImage && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-md">
              <p className="text-green-800">✅ Zdjęcie przesłane pomyślnie!</p>
              <p className="text-sm text-gray-600">CID: {uploadedImage.cid}</p>
            </div>
          )}
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isSubmitting || !uploadedImage}
          className="w-full py-3 px-4 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? "Tworzenie..." : "Utwórz Zbiórkę"}
        </button>
      </form>
    </div>
  );
}
