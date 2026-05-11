'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Clock, Eye, MessageSquare, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { Achievement } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { categoryLabels, categoryIcons, formatDate, getInitials } from '@/lib/utils';

export default function VerifyPage() {
  const queryClient = useQueryClient();
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);
  const [remarks, setRemarks] = useState('');
  const [reviewAction, setReviewAction] = useState<string>('');

  const { data, isLoading } = useQuery({
    queryKey: ['pending-verifications'],
    queryFn: async () => {
      const { data } = await api.get('/verifications/pending?limit=20');
      return data;
    },
  });

  const { data: statsData } = useQuery({
    queryKey: ['verification-stats'],
    queryFn: async () => {
      const { data } = await api.get('/verifications/stats');
      return data.data;
    },
  });

  const reviewMutation = useMutation({
    mutationFn: ({ id, status, remarks }: { id: string; status: string; remarks?: string }) =>
      api.post(`/verifications/${id}/review`, { status, remarks }),
    onSuccess: (_, vars) => {
      toast.success(`Achievement ${vars.status.toLowerCase()}`);
      queryClient.invalidateQueries({ queryKey: ['pending-verifications'] });
      queryClient.invalidateQueries({ queryKey: ['verification-stats'] });
      setSelectedAchievement(null);
      setRemarks('');
    },
    onError: () => toast.error('Review failed'),
  });

  const achievements: Achievement[] = data?.data || [];

  const handleReview = (status: string) => {
    if (!selectedAchievement) return;
    reviewMutation.mutate({ id: selectedAchievement.id, status, remarks });
  };

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold">Verification Queue</h1>
        <p className="text-muted-foreground text-sm mt-1">Review and verify student achievement submissions</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Pending', value: statsData?.pending || 0, icon: Clock, color: 'from-yellow-400 to-amber-500', bg: 'bg-yellow-50 dark:bg-yellow-950/20' },
          { label: 'Under Review', value: statsData?.underReview || 0, icon: Eye, color: 'from-blue-400 to-indigo-500', bg: 'bg-blue-50 dark:bg-blue-950/20' },
          { label: 'Approved', value: statsData?.approved || 0, icon: CheckCircle, color: 'from-green-400 to-emerald-500', bg: 'bg-green-50 dark:bg-green-950/20' },
          { label: 'Rejected', value: statsData?.rejected || 0, icon: XCircle, color: 'from-red-400 to-rose-500', bg: 'bg-red-50 dark:bg-red-950/20' },
        ].map((stat, i) => (
          <Card key={i} className={`${stat.bg} border-0`}>
            <CardContent className="p-4">
              <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center mb-2`}>
                <stat.icon className="w-4 h-4 text-white" />
              </div>
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Queue */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
      ) : achievements.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <CheckCircle className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">All caught up!</p>
          <p className="text-sm">No pending verifications at the moment.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {achievements.map((achievement, i) => {
            const profile = achievement.user?.profile;
            const initials = profile ? getInitials(profile.firstName, profile.lastName) : 'U';

            return (
              <motion.div
                key={achievement.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className="hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      {/* Student info */}
                      <Avatar className="w-10 h-10 flex-shrink-0">
                        <AvatarImage src={profile?.avatar} />
                        <AvatarFallback className="text-sm">{initials}</AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-lg">{categoryIcons[achievement.category]}</span>
                          <p className="font-semibold text-sm truncate">{achievement.title}</p>
                          <Badge variant="outline" className="text-xs flex-shrink-0">
                            {categoryLabels[achievement.category]}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span>{profile ? `${profile.firstName} ${profile.lastName}` : 'Unknown'}</span>
                          {profile?.rollNumber && <span>• {profile.rollNumber}</span>}
                          {achievement.issuingAuthority && <span>• {achievement.issuingAuthority}</span>}
                          {achievement.issueDate && <span>• {formatDate(achievement.issueDate)}</span>}
                        </div>
                      </div>

                      {/* Status badge */}
                      <Badge variant={achievement.status === 'SUBMITTED' ? 'warning' : 'info'} className="flex-shrink-0">
                        {achievement.status}
                      </Badge>

                      {/* Actions */}
                      <div className="flex gap-2 flex-shrink-0">
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1 text-xs"
                          onClick={() => setSelectedAchievement(achievement)}
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Review
                        </Button>
                        <Button
                          size="sm"
                          className="gap-1 text-xs bg-green-500 hover:bg-green-600 text-white border-0"
                          onClick={() => reviewMutation.mutate({ id: achievement.id, status: 'APPROVED' })}
                          disabled={reviewMutation.isPending}
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1 text-xs text-destructive hover:text-destructive"
                          onClick={() => { setSelectedAchievement(achievement); setReviewAction('REJECTED'); }}
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Review detail modal */}
      <Dialog open={!!selectedAchievement} onOpenChange={() => { setSelectedAchievement(null); setRemarks(''); setReviewAction(''); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Review Achievement</DialogTitle>
          </DialogHeader>
          {selectedAchievement && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-muted/50">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">{categoryIcons[selectedAchievement.category]}</span>
                  <h3 className="font-semibold">{selectedAchievement.title}</h3>
                </div>
                {selectedAchievement.description && (
                  <p className="text-sm text-muted-foreground mb-2">{selectedAchievement.description}</p>
                )}
                <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                  {selectedAchievement.issuingAuthority && <span>Issuer: {selectedAchievement.issuingAuthority}</span>}
                  {selectedAchievement.issueDate && <span>Date: {formatDate(selectedAchievement.issueDate)}</span>}
                  {selectedAchievement.credentialId && <span>ID: {selectedAchievement.credentialId}</span>}
                </div>
                {selectedAchievement.documents?.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs font-medium mb-1">Documents:</p>
                    {selectedAchievement.documents.map((doc) => (
                      <a key={doc.id} href={doc.fileUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline block">
                        📎 {doc.fileName}
                      </a>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium flex items-center gap-1">
                  <MessageSquare className="w-3.5 h-3.5" />
                  Remarks (optional)
                </label>
                <Textarea
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Add feedback for the student..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <Button
                  className="bg-green-500 hover:bg-green-600 text-white border-0 gap-1"
                  onClick={() => handleReview('APPROVED')}
                  disabled={reviewMutation.isPending}
                >
                  {reviewMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><CheckCircle className="w-4 h-4" /> Approve</>}
                </Button>
                <Button
                  variant="outline"
                  className="gap-1"
                  onClick={() => handleReview('RESUBMISSION_REQUIRED')}
                  disabled={reviewMutation.isPending}
                >
                  <Clock className="w-4 h-4" /> Resubmit
                </Button>
                <Button
                  variant="outline"
                  className="gap-1 text-destructive hover:text-destructive"
                  onClick={() => handleReview('REJECTED')}
                  disabled={reviewMutation.isPending}
                >
                  <XCircle className="w-4 h-4" /> Reject
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
