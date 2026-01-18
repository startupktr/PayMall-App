import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CheckCircle, X } from "lucide-react";
import clsx from "clsx";

interface UploadDropCardProps {
  title: string;
  description?: React.ReactNode;
  icon: React.ReactNode;
  file: File | null;
  accept: string;
  required?: boolean;
  onChange: (file: File | null) => void;
}

const UploadDropCard: React.FC<UploadDropCardProps> = ({
  title,
  description,
  icon,
  file,
  accept,
  required = false,
  onChange,
}) => {
  return (
    <Card className="hover:shadow-md transition relative">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {icon}
          {title}
          {required && <span className="text-red-500">*</span>}
        </CardTitle>
        {description && (
          <CardDescription>{description}</CardDescription>
        )}
      </CardHeader>

      <CardContent>
        <label className="block cursor-pointer">
          <input
            type="file"
            accept={accept}
            className="hidden"
            onChange={(e) => onChange(e.target.files?.[0] || null)}
          />

          <div
            className={clsx(
              "relative rounded-xl border-2 border-dashed p-8 text-center transition",
              file
                ? "border-green-400 bg-green-50"
                : "border-gray-300 hover:border-paymall-primary hover:bg-gray-50"
            )}
          >
            {/* ❌ REMOVE BUTTON */}
            {file && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onChange(null);
                }}
                className="absolute top-2 right-2 rounded-full bg-white shadow p-1 hover:bg-gray-100"
              >
                <X className="h-4 w-4 text-gray-600" />
              </button>
            )}

            {!file ? (
              <div className="flex flex-col items-center">
                <div className="mb-3 text-gray-400">{icon}</div>
                <p className="text-sm font-medium text-gray-700">
                  Click to upload file
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {accept.replace(".", "").toUpperCase()} file
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <CheckCircle className="h-8 w-8 text-green-600" />
                <p className="text-sm font-medium text-gray-900">
                  {file.name}
                </p>
                <p className="text-xs text-gray-500">
                  {(file.size / 1024).toFixed(1)} KB
                </p>
              </div>
            )}
          </div>
        </label>
      </CardContent>
    </Card>
  );
};

export default UploadDropCard;
