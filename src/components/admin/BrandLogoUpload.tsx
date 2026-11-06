/**
 * Brand logo upload component for Nova A to Z Parts admin panel.
 * Allows admin users to upload and manage brand logos.
 */

import { useState } from "react";
import { BrandLogo } from "@/lib/brand-logos";

export function BrandLogoUpload({ brand }: { brand: BrandLogo }) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadError(null);

    try {
      // Simulate upload logic here (replace with actual API call)
      // For now, we'll just update the local state to reflect the file
      const reader = new FileReader();
      reader.onload = (event) => {
        const imageUrl = event.target?.result as string;
        // Update the brand logo path in the database
        // This would be handled by an action function in the backend
        setUploadSuccess(true);
        setTimeout(() => {
          setIsUploading(false);
        }, 1000);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setUploadError("Failed to upload logo.");
      setIsUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative w-24 h-24 rounded-full bg-slate-200 overflow-hidden border-4 border-slate-300 cursor-pointer group transition-all hover:border-brand hover:shadow-lg">
        {brand.imagePath ? (
          <img
            src={brand.imagePath}
            alt="Brand Logo"
            className="w-full h-full object-contain"
          />
        ) : (
          <div className="flex items-center justify-center text-slate-500">
            <span className="material-symbols-outlined text-[24px] group-hover:text-brand">upload</span>
          </div>
        )}
      </div>
      <input
        type="file"
        accept="image/*"
        onChange={handleUpload}
        className="hidden"
        id="brand-logo-upload"
      />
      <label htmlFor="brand-logo-upload" className="px-3 py-2 rounded-md border border-border bg-white text-sm font-semibold text-steel-700 hover:bg-slate-50">
        {isUploading ? "Uploading..." : "Upload Brand Logo"}
      </label>
      {uploadError && <p className="text-sm text-danger mt-1">{uploadError}</p>}
      {uploadSuccess && <p className="text-sm text-success mt-1">Logo updated successfully!</p>}
    </div>
  );
}