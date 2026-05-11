'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Filter, Upload, Trophy, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { Achievement, AchievementCategory, VerificationStatus } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { categoryColors, categoryLabels, categoryIcons, statusConfig, formatDate } from '@/lib/utils';
import { AchievementModal } from '@/components/dashboard/AchievementModal';
import { OCRUploadModal } from '@/components/dashboard/OCRUploadModal';

export default function AchievementsPage() {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showOCR, setShowOCR] = useState(false);
  const [editingAchievement, setEditingAchievement] = useState<Achievement | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['achievements', search, categoryFilter, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (categoryFilter) params.set('category', categoryFilter);
      if (statusFilter) params.set('status', statusFilter);
      const { data } = await api.get(`/achievements?${params}`);
      return data;
    },
  });

  const submitMutation = useMutation({
    mutationFn: (id: string) => api.post(`/achievements/${id}/submit`),
    onSuccess: () => {
      toast.success('Submitted for verification!');
      queryClient.invalidateQueries({ queryKey: ['achievements'] });
    },
    onError: () => toast.error('Failed to submit'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/achievements/${id}`),
    onSuccess: () => {
      toast.success('Achievement deleted');
      queryClient.invalidateQueries({ queryKey: ['achievements'] });
    },
    onError: () => toast.error('Failed to delete'),
  });

  const achievements: Achievement[] = data?.data || [];

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Achievements</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {achievements.length} achievement{achievements.length !== 1 ? 's' : ''} tracked
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowOCR(true)} className="gap-2">
            <Upload className="w-4 h-4" />
            OCR Upload
          </Button>
          <Button
            size="sm"
            onClick={() => { setEditingAchievement(null); setShowModal(true); }}
            className="bg-gradient-to-r from-indigo-500 to-violet-600 text-white border-0 gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Achievement
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search achievements..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-44">
            <Filter className="w-4 h-4 mr-2 text-muted-foreground" />
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Categories</SelectItem>
            {Object.entries(categoryLabels).map(([value, label]) => (
              <SelectItem key={value} value={value}>{categoryIcons[value as AchievementCategory]} {label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Statuses</SelectItem>
            {Object.entries(statusConfig).map(([value, { label }]) => (
              <SelectItem key={value} value={value}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Achievement grid */}
      {isLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-48 rounded-xl" />)}
        </div>
      ) : achievements.length === 0 ? (
        <div className="text-center py-20">
          <Trophy className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
          <h3 className="text-lg font-semibold mb-2">No achievements yet</h3>
          <p className="text-muted-foreground text-sm mb-6">Start tracking your academic journey</p>
          <Button
            onClick={() => setShowModal(true)}
            className="bg-gradient-to-r from-indigo-500 to-violet-600 text-white border-0 gap-2"
          >
            <Plus className="w-4 h-4" /> Add Your First Achievement
          </Button>
        </div>
      ) : (
        <AnimatePresence>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {achievements.map((achievement, i) => (
              <motion.div
                key={achievement.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className="card-hover overflow-hidden">
                  {/* Category color bar */}
                  <div className={`h-1 w-full bg-gradient-to-r ${getCategoryGradient(achievement.category)}`} />
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <span className="text-2xl">{categoryIcons[achievement.category]}</span>
                      <Badge className={`text-xs ${statusConfig[achievement.status].className}`}>
                        {statusConfig[achievement.status].label}
                      </Badge>
                    </div>

                    <h3 className="font-semibold text-sm mb-1 line-clamp-2">{achievement.title}</h3>
                    {achievement.issuingAuthority && (
                      <p className="text-xs text-muted-foreground mb-2">{achievement.issuingAuthority}</p>
                    )}

                    <div className="flex flex-wrap gap-1 mb-3">
                      <Badge className={`text-xs ${categoryColors[achievement.category]}`}>
                        {categoryLabels[achievement.category]}
                      </Badge>
                      {achievement.tags?.slice(0, 2).map((t) => (
                        <Badge key={t.tag.id} variant="outline" className="text-xs">{t.tag.name}</Badge>
                      ))}
                    </div>

                    {achievement.issueDate && (
                      <p className="text-xs text-muted-foreground mb-3">{formatDate(achievement.issueDate)}</p>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 mt-auto">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 text-xs"
                        onClick={() => { setEditingAchievement(achievement); setShowModal(true); }}
                      >
                        Edit
                      </Button>
                      {achievement.status === 'DRAFT' || achievement.status === 'RESUBMISSION_REQUIRED' ? (
                        <Button
                          size="sm"
                          className="flex-1 text-xs bg-gradient-to-r from-indigo-500 to-violet-600 text-white border-0"
                          onClick={() => submitMutation.mutate(achievement.id)}
                          disabled={submitMutation.isPending}
                        >
                          {submitMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Submit'}
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 text-xs text-destructive hover:text-destructive"
                          onClick={() => {
                            if (confirm('Delete this achievement?')) deleteMutation.mutate(achievement.id);
                          }}
                        >
                          Delete
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </AnimatePresence>
      )}

      {/* Modals */}
      <AchievementModal
        open={showModal}
        onClose={() => { setShowModal(false); setEditingAchievement(null); }}
        achievement={editingAchievement}
      />
      <OCRUploadModal open={showOCR} onClose={() => setShowOCR(false)} />
    </div>
  );
}

function getCategoryGradient(category: AchievementCategory): string {
  const gradients: Record<AchievementCategory, string> = {
    ACADEMIC: 'from-blue-400 to-indigo-500',
    CERTIFICATION: 'from-purple-400 to-violet-500',
    INTERNSHIP: 'from-green-400 to-emerald-500',
    WORKSHOP: 'from-yellow-400 to-amber-500',
    HACKATHON: 'from-orange-400 to-red-500',
    RESEARCH: 'from-indigo-400 to-blue-500',
    LEADERSHIP: 'from-red-400 to-rose-500',
    CLUB: 'from-pink-400 to-fuchsia-500',
    VOLUNTEERING: 'from-teal-400 to-cyan-500',
    AWARD: 'from-amber-400 to-yellow-500',
    PEER_RECOGNITION: 'from-cyan-400 to-sky-500',
    OTHER: 'from-gray-400 to-slate-500',
  };
  return gradients[category] || 'from-indigo-400 to-violet-500';
}
