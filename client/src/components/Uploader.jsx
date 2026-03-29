import { useState, useRef } from 'react';
import { UploadCloud, FileText, Loader2, RefreshCw, FolderOpen, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { uploadBook } from '../api';

export default function Uploader({ onUploadComplete }) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState(null);
  const failedFileRef = useRef(null); // keep last failed file for retry
  const fileInputRef = useRef(null);

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (selectedFile) => {
    const validTypes = ['.epub', '.pdf', '.mobi', '.prc', '.txt'];
    const ext = selectedFile.name.toLowerCase().match(/\.[^.]+$/);
    
    if (ext && validTypes.includes(ext[0])) {
      setFile(selectedFile);
      setError(null);
    } else {
      setFile(null);
      setError('Please upload a valid document (.epub, .pdf, .mobi, .prc, .txt)');
    }
  };

  const submitUpload = async (fileToUpload) => {
    const target = fileToUpload || file;
    if (!target) return;
    failedFileRef.current = target;
    setIsUploading(true);
    setError(null);
    try {
      const data = await uploadBook(target);
      failedFileRef.current = null;
      onUploadComplete(data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to process the book.');
    } finally {
      setIsUploading(false);
      setFile(null);
    }
  };

  const handleRetry = () => {
    if (failedFileRef.current) {
      submitUpload(failedFileRef.current);
    }
  };

  const handleSelectAnother = () => {
    setError(null);
    setFile(null);
    failedFileRef.current = null;
    // Reset the hidden file input so the same file can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-6 rounded-2xl bg-slate-800/50 backdrop-blur-xl border border-slate-700 shadow-2xl">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent mb-3">
          Upload your Book
        </h2>
        <p className="text-slate-400">Supported formats: EPUB, PDF, MOBI, PRC</p>
      </div>

      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-xl p-12 transition-all duration-300 ${
          isDragOver ? 'border-cyan-400 bg-cyan-900/20' : 'border-slate-600 hover:border-slate-500 bg-slate-800/30'
        } flex flex-col items-center justify-center cursor-pointer overflow-hidden group`}
      >
        <input 
          ref={fileInputRef}
          type="file" 
          onChange={handleFileChange} 
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
          disabled={isUploading || !!error}
          accept=".epub,.pdf,.mobi,.prc,.txt"
        />
        
        <AnimatePresence mode="wait">
          {!file && !isUploading && (
            <motion.div key="default" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center pointer-events-none">
              <UploadCloud className="w-16 h-16 text-slate-400 group-hover:text-cyan-400 transition-colors mb-4" />
              <p className="text-lg font-medium text-slate-200">Drag & drop your file here</p>
              <p className="text-sm text-slate-500 mt-2">or click to browse</p>
            </motion.div>
          )}

          {file && !isUploading && (
            <motion.div key="file" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex flex-col items-center z-20">
              <FileText className="w-16 h-16 text-cyan-400 mb-4" />
              <p className="text-lg font-medium text-slate-200">{file.name}</p>
              <p className="text-sm text-slate-400 mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
              <button 
                onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault(); 
                    submitUpload();
                }}
                className="mt-6 px-6 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white rounded-full font-semibold shadow-lg shadow-cyan-500/30 transition-all pointer-events-auto"
              >
                Start Processing
              </button>
            </motion.div>
          )}

          {isUploading && (
            <motion.div key="uploading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center pointer-events-none">
               <Loader2 className="w-16 h-16 text-cyan-400 animate-spin mb-4" />
               <p className="text-lg font-medium text-slate-200">Processing Book...</p>
               <p className="text-sm text-slate-400 mt-2 text-center max-w-sm">Extracting chapters and preparing text-to-speech engine.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-4 p-4 rounded-xl border border-red-500/40 bg-red-900/20 text-red-200"
          >
            <div className="flex items-center gap-2 mb-3">
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
              <p className="text-sm font-medium">{error}</p>
            </div>
            <div className="flex gap-3 justify-center">
              {failedFileRef.current && (
                <button
                  onClick={handleRetry}
                  className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white text-sm font-semibold shadow-lg shadow-cyan-500/20 transition-all"
                >
                  <RefreshCw className="w-4 h-4" />
                  Retry
                </button>
              )}
              <button
                onClick={handleSelectAnother}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm font-semibold border border-slate-600 transition-all"
              >
                <FolderOpen className="w-4 h-4" />
                Select Another File
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
