'use client';

import React, { useState, useEffect } from 'react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PortfolioPDF from './PortfolioPDF';

interface PDFExportButtonProps {
  profile: any;
  achievements: any[];
}

export default function PDFExportButton({ profile, achievements }: PDFExportButtonProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return (
      <Button variant="outline" className="w-full gap-2 mt-4" disabled>
        <Download className="w-4 h-4" />
        Preparing PDF...
      </Button>
    );
  }

  return (
    <PDFDownloadLink
      document={<PortfolioPDF profile={profile} achievements={achievements} />}
      fileName={`${profile?.firstName || 'Student'}_Portfolio.pdf`}
      className="w-full"
    >
      {({ blob, url, loading, error }) => (
        <Button 
          variant="outline" 
          className="w-full gap-2 mt-4 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-950/30 dark:hover:bg-indigo-950/50 dark:text-indigo-300 dark:border-indigo-800"
          disabled={loading}
        >
          <Download className="w-4 h-4" />
          {loading ? 'Generating PDF...' : 'Download Portfolio as PDF'}
        </Button>
      )}
    </PDFDownloadLink>
  );
}
