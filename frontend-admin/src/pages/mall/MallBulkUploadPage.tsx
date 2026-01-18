import { useState } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { useRequireMallAdmin } from "@/hooks/useAdminAuth";
import api from "@/lib/axios";
import { useToast } from "@/hooks/use-toast";
import UploadDropCard from "@/components/ui/UploadDropCard";

import {
  Upload,
  FileSpreadsheet,
  Image as ImageIcon,
  Download,
  Loader2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

const MallBulkUploadPage = () => {
  const { loading } = useRequireMallAdmin();
  const { toast } = useToast();

  const [csv, setCsv] = useState<File | null>(null);
  const [zip, setZip] = useState<File | null>(null);
  const [mode, setMode] = useState<"increment" | "replace">("increment");
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<any>(null);

  /* ========================
     CSV TEMPLATE
  ======================== */
  const downloadTemplate = () => {
    const csv = `name,barcode,price,marked_price,stock_quantity,description,category,image_name
Sample Product,1234567890,99,129,10,Sample desc,Electronics,sample.jpg`;

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "bulk_product_template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  /* ========================
     ERROR CSV DOWNLOAD
  ======================== */
  const downloadErrorCSV = async () => {
    if (!result?.failed_rows?.length) return;

    const res = await api.post(
      "/admin/products/bulk-upload/errors/",
      { failed_rows: result.failed_rows },
      { responseType: "blob" }
    );

    const url = window.URL.createObjectURL(res.data);
    const a = document.createElement("a");
    a.href = url;
    a.download = "bulk_upload_errors.csv";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  /* ========================
     UPLOAD HANDLER
  ======================== */
  const handleUpload = async () => {
    if (!csv) {
      toast({ title: "CSV required", variant: "destructive" });
      return;
    }

    setUploading(true);
    setProgress(0);
    setResult(null);

    try {
      const form = new FormData();
      form.append("csv", csv);
      form.append("mode", mode);
      if (zip) form.append("zip", zip);

      const res = await api.post("/admin/products/bulk-upload/", form, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (e) => {
          if (e.total) {
            setProgress(Math.round((e.loaded * 100) / e.total));
          }
        },
      });

      setResult(res.data.data);
      toast({ title: "Bulk upload completed" });

      // 🔥 RESET FILE INPUTS
      setCsv(null);
      setZip(null);
    } catch (err: any) {
      toast({
        title: "Upload failed",
        description: err.response?.data?.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  /* ========================
     LOADING
  ======================== */
  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-10 w-10 animate-spin text-paymall-primary" />
      </div>
    );
  }

  return (
    <AdminLayout
      title="Bulk Product Upload"
      subtitle="Upload products using CSV and optional images ZIP"
    >
      <div className="max-w-5xl mx-auto space-y-8">

        {/* HEADER ACTION BAR */}
        <div className="flex items-center justify-between">
          <Button variant="outline" size="sm" onClick={downloadTemplate}>
            <Download className="h-4 w-4 mr-2" />
            CSV Template
          </Button>

          {/* STOCK STRATEGY TOGGLE */}
          <div className="flex items-center gap-3">
            <Label className="text-sm text-gray-600">Replace</Label>
            <Switch
              checked={mode === "increment"}
              onCheckedChange={(v) =>
                setMode(v ? "increment" : "replace")
              }
            />
            <Label className="text-sm font-medium">Increment</Label>
          </div>
        </div>

        {/* FILE UPLOADS */}
        <div className="grid md:grid-cols-2 gap-6">
          <UploadDropCard
            title="Product CSV"
            description="Mandatory. Contains product details."
            icon={<FileSpreadsheet className="h-10 w-10" />}
            accept=".csv"
            required
            file={csv}
            onChange={setCsv}
          />

          <UploadDropCard
            title="Images ZIP (Optional)"
            description={
              <>
                Filenames must match{" "}
                <code className="px-1 py-0.5 bg-gray-100 rounded">
                  image_name
                </code>
              </>
            }
            icon={<ImageIcon className="h-10 w-10" />}
            accept=".zip"
            file={zip}
            onChange={setZip}
          />
        </div>

        {/* PROGRESS */}
        {uploading && (
          <Card>
            <CardContent className="pt-6">
              <Progress value={progress} />
              <p className="text-center text-sm text-gray-500 mt-2">
                Uploading… {progress}%
              </p>
            </CardContent>
          </Card>
        )}

        {/* CENTERED UPLOAD BUTTON */}
        <div className="flex justify-center">
          <Button
            size="lg"
            className="bg-paymall-primary px-10"
            onClick={handleUpload}
            disabled={uploading || !csv}
          >
            {uploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing…
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Upload Products
              </>
            )}
          </Button>
        </div>

        {/* RESULT SUMMARY */}
        {result && (
          <Alert
            variant={result.failure_count ? "destructive" : "default"}
          >
            <AlertTitle>
              {result.failure_count
                ? "Upload completed with errors"
                : "Upload successful"}
            </AlertTitle>
            <AlertDescription>
              Success: {result.success_count} · Failed:{" "}
              {result.failure_count}
            </AlertDescription>
          </Alert>
        )}

        {/* INLINE ERROR PREVIEW */}
        {result?.failure_count > 0 && (
          <Card className="border-red-300">
            <CardHeader>
              <CardTitle>Row Errors</CardTitle>
            </CardHeader>
            <CardContent className="max-h-64 overflow-auto space-y-2">
              {result.failed_rows.map((row: any, idx: number) => (
                <div
                  key={idx}
                  className="text-sm bg-red-50 border border-red-200 rounded p-2"
                >
                  <span className="font-semibold">
                    Row {row.row}:
                  </span>{" "}
                  {row.error}
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* DOWNLOAD ERROR CSV */}
        {result?.failure_count > 0 && (
          <div className="flex justify-center">
            <Button variant="outline" onClick={downloadErrorCSV}>
              Download Error CSV
            </Button>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default MallBulkUploadPage;
