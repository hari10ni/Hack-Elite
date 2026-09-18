import React, { useState } from "react";
import JSZip from "jszip";
import {
  Upload,
  FolderArchive,
  FileCode,
  CheckCircle2,
  AlertTriangle,
  Zap,
  ArrowRight,
  ShieldCheck,
  FileText,
} from "lucide-react";

interface UploadPageProps {
  onFilesReady: (projectName: string, files: Record<string, string>) => void;
  onLoadSample: () => void;
  isLoading: boolean;
  currentFilesCount: number;
}

const EXCLUDED_PATHS = [".git/", "__pycache__/", "node_modules/", ".venv/", "venv/", ".idea/", ".vscode/"];
const ALLOWED_EXTS = [".py", ".md", ".txt", ".json", ".yaml", ".yml", ".sql"];

export const UploadPage: React.FC<UploadPageProps> = ({
  onFilesReady,
  onLoadSample,
  isLoading,
  currentFilesCount,
}) => {
  const [projectName, setProjectName] = useState("My Python Project");
  const [stagedFiles, setStagedFiles] = useState<Record<string, string>>({});
  const [warnings, setWarnings] = useState<string[]>([]);
  const [isProcessingZip, setIsProcessingZip] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const processZipFile = async (file: File) => {
    setIsProcessingZip(true);
    setWarnings([]);
    try {
      const zip = new JSZip();
      const content = await zip.loadAsync(file);
      const extracted: Record<string, string> = {};
      const newWarnings: string[] = [];

      const entries = Object.keys(content.files);
      if (entries.length > 300) {
        throw new Error(`ZIP contains ${entries.length} files. Maximum allowed is 300.`);
      }

      for (const fileName of entries) {
        const fileObj = content.files[fileName];
        if (fileObj.dir) continue;

        // Security: Path Traversal check
        if (fileName.includes("../") || fileName.startsWith("/")) {
          newWarnings.push(`Skipped suspicious path: ${fileName}`);
          continue;
        }

        // Exclusion filters
        if (EXCLUDED_PATHS.some((ex) => fileName.includes(ex))) {
          continue;
        }

        // Allowed extension check
        const ext = fileName.slice(fileName.lastIndexOf(".")).toLowerCase();
        if (!ALLOWED_EXTS.includes(ext)) {
          continue;
        }

        const text = await fileObj.async("text");
        extracted[fileName] = text;
      }

      setStagedFiles(extracted);
      setWarnings(newWarnings);
      setProjectName(file.name.replace(/\.[^/.]+$/, ""));
    } catch (err: any) {
      setWarnings([err.message || "Failed to process ZIP file"]);
    } finally {
      setIsProcessingZip(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processZipFile(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processZipFile(e.dataTransfer.files[0]);
    }
  };

  const handleProceed = () => {
    if (Object.keys(stagedFiles).length === 0) return;
    onFilesReady(projectName, stagedFiles);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto py-4">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#202522]">Project Upload & Workspace Setup</h1>
        <p className="text-xs text-[#718477] mt-1">
          Upload a Python project ZIP or load the ready-to-test Student Information System sample.
        </p>
      </div>

      {/* Quick Action: Sample Project Banner */}
      <div className="p-4 rounded-xl bg-[#FFFFFF] border border-[#718477]/30 flex items-center justify-between flex-wrap gap-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-[#394A3F] text-[#FFFFFF] shadow-sm">
            <Zap className="w-5 h-5 text-[#C6A76B]" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[#202522]">
              Want to skip uploading? Load Sample Student Information System
            </h3>
            <p className="text-xs text-[#718477] mt-0.5">
              Contains <code className="bg-[#F7F5EF] text-[#394A3F] px-1 py-0.5 rounded border border-[#718477]/25 font-semibold">database.py</code>, <code className="bg-[#F7F5EF] text-[#394A3F] px-1 py-0.5 rounded border border-[#718477]/25 font-semibold">student.py</code>, <code className="bg-[#F7F5EF] text-[#394A3F] px-1 py-0.5 rounded border border-[#718477]/25 font-semibold">login.py</code>, <code className="bg-[#F7F5EF] text-[#394A3F] px-1 py-0.5 rounded border border-[#718477]/25 font-semibold">payment.py</code>, <code className="bg-[#F7F5EF] text-[#394A3F] px-1 py-0.5 rounded border border-[#718477]/25 font-semibold">dashboard.py</code>, and 5 unit test suites.
            </p>
          </div>
        </div>
        <button
          onClick={onLoadSample}
          disabled={isLoading}
          className="px-4 py-2 rounded-lg bg-[#394A3F] hover:bg-[#2D3A2A] text-[#FFFFFF] font-semibold text-xs flex items-center gap-1.5 transition-colors shadow-sm disabled:opacity-50"
        >
          {isLoading ? "Loading..." : "Load Sample Project"}
          <ArrowRight className="w-4 h-4 text-[#C6A76B]" />
        </button>
      </div>

      {/* Upload Zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
        className={`rounded-2xl border-2 border-dashed p-8 text-center transition-all shadow-sm ${
          dragActive
            ? "border-[#394A3F] bg-[#394A3F]/10"
            : "border-[#718477]/35 bg-[#FFFFFF] hover:border-[#394A3F]"
        }`}
      >
        <FolderArchive className="w-12 h-12 text-[#394A3F] mx-auto mb-3" />
        <h3 className="font-semibold text-[#202522] text-sm">
          Drag & Drop Python Project ZIP here
        </h3>
        <p className="text-xs text-[#718477] mt-1 max-w-sm mx-auto">
          Supports <code className="bg-[#F7F5EF] text-[#202522] px-1 py-0.5 rounded">.zip</code> archives up to 25MB. Safe client-side extraction automatically
          skips <code className="bg-[#F7F5EF] text-[#202522] px-1 py-0.5 rounded">.git</code>, virtual environments, and caches.
        </p>

        <label className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#F7F5EF] hover:bg-[#EAE6DA] text-[#202522] text-xs font-semibold cursor-pointer border border-[#718477]/30 transition-colors shadow-sm">
          <Upload className="w-3.5 h-3.5 text-[#394A3F]" />
          Choose File from Disk
          <input
            type="file"
            accept=".zip"
            onChange={handleFileChange}
            className="hidden"
          />
        </label>

        {isProcessingZip && (
          <p className="text-xs text-[#394A3F] mt-3 font-mono font-semibold">Extracting and validating files...</p>
        )}
      </div>

      {/* Security & Filter Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-[#202522]">
        <div className="p-3 rounded-lg bg-[#FFFFFF] border border-[#718477]/25 flex items-center gap-2 shadow-sm">
          <ShieldCheck className="w-4 h-4 text-[#394A3F] shrink-0" />
          <span className="font-medium">Non-Executing Static AST Analysis</span>
        </div>
        <div className="p-3 rounded-lg bg-[#FFFFFF] border border-[#718477]/25 flex items-center gap-2 shadow-sm">
          <CheckCircle2 className="w-4 h-4 text-[#394A3F] shrink-0" />
          <span className="font-medium">Automatic .git & venv filtering</span>
        </div>
        <div className="p-3 rounded-lg bg-[#FFFFFF] border border-[#718477]/25 flex items-center gap-2 shadow-sm">
          <CheckCircle2 className="w-4 h-4 text-[#394A3F] shrink-0" />
          <span className="font-medium">Path Traversal (Zip Slip) Protected</span>
        </div>
      </div>

      {/* Warnings */}
      {warnings.length > 0 && (
        <div className="p-3.5 rounded-xl bg-[#C6A76B]/15 border border-[#C6A76B]/40 text-xs text-[#845F1E] space-y-1">
          <div className="flex items-center gap-1.5 font-semibold">
            <AlertTriangle className="w-4 h-4 text-[#C6A76B]" />
            Upload Warnings:
          </div>
          <ul className="list-disc list-inside">
            {warnings.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Staged Files Preview */}
      {Object.keys(stagedFiles).length > 0 && (
        <div className="rounded-xl border border-[#718477]/25 bg-[#FFFFFF] p-5 space-y-4 shadow-sm">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <FileCode className="w-4 h-4 text-[#394A3F]" />
              <h3 className="font-semibold text-sm text-[#202522]">
                Extracted Files Ready for AST Analysis ({Object.keys(stagedFiles).length})
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="Project Name"
                className="bg-[#F7F5EF] border border-[#718477]/30 rounded px-2.5 py-1 text-xs text-[#202522] focus:outline-none focus:border-[#394A3F]"
              />
              <button
                onClick={handleProceed}
                disabled={isLoading}
                className="px-4 py-1.5 rounded-lg bg-[#394A3F] hover:bg-[#2D3A2A] text-[#FFFFFF] font-semibold text-xs flex items-center gap-1.5 transition-colors shadow-sm disabled:opacity-50"
              >
                {isLoading ? "Analyzing AST..." : "Proceed to AST Analysis"}
                <ArrowRight className="w-3.5 h-3.5 text-[#C6A76B]" />
              </button>
            </div>
          </div>

          <div className="max-h-60 overflow-y-auto divide-y divide-[#718477]/15 font-mono text-xs border border-[#718477]/25 rounded-lg bg-[#F7F5EF]/30">
            {Object.keys(stagedFiles).map((fn, idx) => (
              <div
                key={idx}
                className="py-2 px-3 flex items-center justify-between hover:bg-[#F7F5EF] text-[#202522]"
              >
                <span className="truncate">{fn}</span>
                <span className="text-[#718477] text-[11px]">
                  {stagedFiles[fn].split("\n").length} lines
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
