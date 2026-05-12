'use client';

import { motion } from 'framer-motion';
import { Globe, Copy, ExternalLink, Eye, EyeOff, Share2, Loader2 } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import dynamic from 'next/dynamic';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const PDFExportButton = dynamic(() => import('@/components/dashboard/PDFExportButton'), { ssr: false });
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';

export default function PortfolioPage() {
  const { user, fetchMe } = useAuthStore();
  const queryClient = useQueryClient();
  const profile = user?.profile;
  const [isPublic, setIsPublic] = useState(profile?.isPublic ?? true);

  const { data: achievementsData } = useQuery({
    queryKey: ['achievements'],
    queryFn: async () => {
      const { data } = await api.get('/achievements');
      return data.data;
    },
    enabled: !!user,
  });

  const visibilityMutation = useMutation({
    mutationFn: (pub: boolean) => api.put('/profiles', { isPublic: pub }),
    onSuccess: (_, pub) => {
      setIsPublic(pub);
      toast.success(pub ? 'Portfolio is now public' : 'Portfolio is now private');
      fetchMe();
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: () => toast.error('Failed to update visibility'),
  });

  const verifiedAchievements = achievementsData?.filter((a: { status: string }) => a.status === 'APPROVED') || [];

  const portfolioUrl = profile?.portfolioSlug
    ? `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/portfolio/${profile.portfolioSlug}`
    : null;

  const copyLink = () => {
    if (portfolioUrl) {
      navigator.clipboard.writeText(portfolioUrl);
      toast.success('Portfolio link copied!');
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Public Portfolio</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Your shareable, recruiter-ready portfolio page
        </p>
      </div>

      {/* Portfolio URL card */}
      <Card className="bg-gradient-to-r from-indigo-50 to-violet-50 dark:from-indigo-950/20 dark:to-violet-950/20 border-indigo-200 dark:border-indigo-800">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
              <Globe className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="font-semibold">Your Portfolio URL</p>
              <p className="text-sm text-muted-foreground">Share this with recruiters and connections</p>
            </div>
          </div>

          {portfolioUrl ? (
            <>
              <div className="flex items-center gap-2 p-3 rounded-lg bg-background border border-border mb-4">
                <p className="text-sm text-muted-foreground flex-1 truncate">{portfolioUrl}</p>
                <button onClick={copyLink} className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0">
                  <Copy className="w-4 h-4" />
                </button>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" size="sm" className="gap-2 flex-1" onClick={copyLink}>
                  <Copy className="w-4 h-4" /> Copy Link
                </Button>
                <a href={portfolioUrl} target="_blank" rel="noopener noreferrer" className="flex-1">
                  <Button size="sm" className="w-full gap-2 bg-gradient-to-r from-indigo-500 to-violet-600 text-white border-0">
                    <ExternalLink className="w-4 h-4" /> View Portfolio
                  </Button>
                </a>
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Complete your profile to generate a portfolio URL.</p>
          )}
        </CardContent>
      </Card>

      {/* Visibility settings */}
      <Card>
        <CardHeader><CardTitle className="text-base">Visibility Settings</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-3">
              {isPublic ? <Eye className="w-5 h-5 text-green-500" /> : <EyeOff className="w-5 h-5 text-muted-foreground" />}
              <div>
                <p className="text-sm font-medium">Public Portfolio</p>
                <p className="text-xs text-muted-foreground">
                  {isPublic ? 'Anyone with the link can view your portfolio' : 'Your portfolio is hidden from public'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {visibilityMutation.isPending && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
              <Switch
                checked={isPublic}
                onCheckedChange={(checked) => visibilityMutation.mutate(checked)}
                disabled={visibilityMutation.isPending}
              />
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">What&apos;s visible on your portfolio:</p>
            {[
              { label: 'Profile information', enabled: true },
              { label: 'Approved achievements only', enabled: true },
              { label: 'Skills & interests', enabled: true },
              { label: 'Social links', enabled: true },
              { label: 'Draft/rejected achievements', enabled: false },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <div className={`w-4 h-4 rounded-full flex items-center justify-center ${item.enabled ? 'bg-green-500' : 'bg-muted'}`}>
                  {item.enabled && <span className="text-white text-xs">✓</span>}
                </div>
                <span className={item.enabled ? '' : 'text-muted-foreground line-through'}>{item.label}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Share options */}
      <Card>
        <CardHeader><CardTitle className="text-base">Share & Export</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 mb-4">
            {[
              { label: 'Copy Link', icon: Copy, action: copyLink },
              {
                label: 'Share on LinkedIn',
                icon: Share2,
                action: () => portfolioUrl && window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(portfolioUrl)}`, '_blank'),
              },
            ].map((item, i) => (
              <Button key={i} variant="outline" className="gap-2" onClick={item.action}>
                <item.icon className="w-4 h-4" />
                {item.label}
              </Button>
            ))}
          </div>
          <PDFExportButton profile={profile} achievements={verifiedAchievements} />
        </CardContent>
      </Card>

      {/* Stats preview */}
      <Card>
        <CardHeader><CardTitle className="text-base">Portfolio Stats</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold gradient-text-brand">{profile?.completionScore || 0}%</p>
              <p className="text-xs text-muted-foreground">Profile Complete</p>
            </div>
            <div>
              <p className="text-2xl font-bold gradient-text-brand">{profile?.skills?.length || 0}</p>
              <p className="text-xs text-muted-foreground">Skills Listed</p>
            </div>
            <div className="flex flex-col items-center">
              <Badge variant={isPublic ? 'success' : 'secondary'} className="text-xs mb-1">
                {isPublic ? 'Public' : 'Private'}
              </Badge>
              <p className="text-xs text-muted-foreground">Visibility</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
