'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Scan, CheckCircle, Loader2, FileImage, X } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { AchievementModal } from './AchievementModal';

interface OCRResult {
  extractedData: {
    title: string;
    issuer: string;
    date: string;
    certificateId: string;
  };
  confidence: number;
  fileUrl: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
}

type Step = 'upload' | 'processing' | 'review' | 'done';

export function OCRUploadModal({ open, onClose }: Props) {
  const [step, setStep] = useState<Step>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [ocrResult, setOcrResult] = useState<OCRResult | null>(null);
  const [showAchievementModal, setShowAchievementModal] = useState(false);
  const [progress, setProgress] = useState(0);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const f = acceptedFiles[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.webp'] },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
  });

  const processOCR = async () => {
    if (!file) return;
    setStep('processing');
    setProgress(0);

    // Simulate progress
    const interval = setInterval(() => {
      setProgress(p => Math.min(p + 15, 85));
    }, 400);

    try {
      const formData = new FormData();
      formData.append('certificate', file);

      const { data } = await api.post('/achievements/ocr/process', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      clearInterval(interval);
      setProgress(100);
      setOcrResult(data.data);
      setTimeout(() => setStep('review'), 500);
    } catch {
      clearInterval(interval);
      toast.error('OCR processing failed. Please try again.');
      setStep('upload');
    }
  };

  const handleClose = () => {
    setStep('upload');
    setFile(null);
    setPreview(null);
    setOcrResult(null);
    setProgress(0);
    onClose();
  };

  return (
    <>
      <Dialog open={open && !showAchievementModal} onOpenChange={handleClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Scan className="w-5 h-5 text-indigo-500" />
              Smart Certificate Upload
            </DialogTitle>
          </DialogHeader>

          <AnimatePresence mode="wait">
            {step === 'upload' && (
              <motion.div key="upload" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                    isDragActive
                      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/20'
                      : 'border-border hover:border-indigo-400 hover:bg-muted/50'
                  }`}
                >
                  <input {...getInputProps()} />
                  {preview ? (
                    <div className="relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={preview} alt="Certificate preview" className="max-h-48 mx-auto rounded-lg object-contain" />
                      <button
                        onClick={(e) => { e.stopPropagation(); setFile(null); setPreview(null); }}
                        className="absolute top-1 right-1 w-6 h-6 rounded-full bg-destructive text-white flex items-center justify-center"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <FileImage className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
                      <p className="font-medium text-sm mb-1">
                        {isDragActive ? 'Drop your certificate here' : 'Drag & drop your certificate'}
                      </p>
                      <p className="text-xs text-muted-foreground">JPG, PNG, WebP up to 10MB</p>
                    </>
                  )}
                </div>

                <div className="mt-4 p-3 rounded-lg bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-800">
                  <p className="text-xs text-indigo-700 dark:text-indigo-300">
                    🤖 Our AI will automatically extract the title, issuer, date, and certificate ID from your image.
                  </p>
                </div>

                <div className="flex gap-3 mt-4">
                  <Button variant="outline" className="flex-1" onClick={handleClose}>Cancel</Button>
                  <Button
                    className="flex-1 bg-gradient-to-r from-indigo-500 to-violet-600 text-white border-0 gap-2"
                    onClick={processOCR}
                    disabled={!file}
                  >
                    <Scan className="w-4 h-4" />
                    Process with AI
                  </Button>
                </div>
              </motion.div>
            )}

            {step === 'processing' && (
              <motion.div key="processing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="py-8 text-center">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center mx-auto mb-4 animate-pulse">
                  <Scan className="w-8 h-8 text-white" />
                </div>
                <h3 className="font-semibold mb-2">Processing Certificate...</h3>
                <p className="text-muted-foreground text-sm mb-4">AI is extracting information from your certificate</p>
                <Progress value={progress} className="mb-2" />
                <p className="text-xs text-muted-foreground">{progress}% complete</p>
              </motion.div>
            )}

            {step === 'review' && ocrResult && (
              <motion.div key="review" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="flex items-center gap-2 mb-4 p-3 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <p className="text-sm text-green-700 dark:text-green-400">
                    Extracted with {Math.round(ocrResult.confidence)}% confidence
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label>Title (extracted)</Label>
                    <Input defaultValue={ocrResult.extractedData.title} id="ocr-title" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Issuer (extracted)</Label>
                    <Input defaultValue={ocrResult.extractedData.issuer} id="ocr-issuer" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label>Date</Label>
                      <Input defaultValue={ocrResult.extractedData.date} id="ocr-date" />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Certificate ID</Label>
                      <Input defaultValue={ocrResult.extractedData.certificateId} id="ocr-certid" />
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 mt-4">
                  <Button variant="outline" className="flex-1" onClick={() => setStep('upload')}>
                    Re-upload
                  </Button>
                  <Button
                    className="flex-1 bg-gradient-to-r from-indigo-500 to-violet-600 text-white border-0"
                    onClick={() => setShowAchievementModal(true)}
                  >
                    Continue to Add
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </DialogContent>
      </Dialog>

      {/* Achievement modal with pre-filled OCR data */}
      {showAchievementModal && ocrResult && (
        <AchievementModal
          open={showAchievementModal}
          onClose={() => { setShowAchievementModal(false); handleClose(); }}
          prefillData={{
            title: ocrResult.extractedData.title,
            issuingAuthority: ocrResult.extractedData.issuer,
          }}
        />
      )}
    </>
  );
}
