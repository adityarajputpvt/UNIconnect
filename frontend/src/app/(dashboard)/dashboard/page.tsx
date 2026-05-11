'use client';

import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Trophy, Clock, CheckCircle, Sparkles, Star, TrendingUp, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { StudentDashboard } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { categoryLabels, categoryIcons, formatRelativeTime } from '@/lib/utils';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6'];

export default function DashboardPage() {
  const { user } = useAuthStore();
  const role = user?.role;

  const { data, isLoading } = useQuery<StudentDashboard>({
    queryKey: ['dashboard', role],
    queryFn: async () => {
      const endpoint = role === 'STUDENT' ? '/analytics/student'
        : role === 'FACULTY' ? '/analytics/faculty'
        : '/analytics/admin';
      const { data } = await api.get(endpoint);
      return data.data;
    },
    enabled: !!user,
  });

  if (isLoading) return <DashboardSkeleton />;

  const profile = user?.profile;
  const firstName = profile?.firstName || 'there';

  // For student dashboard
  const stats = data?.achievementStats || {};
  const totalAchievements = Object.values(stats).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Welcome header */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold">
          Good {getGreeting()}, {firstName}! 👋
        </h1>
        <p className="text-muted-foreground mt-1">
          Here&apos;s what&apos;s happening with your academic journey.
        </p>
      </motion.div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: 'Total Achievements',
            value: totalAchievements,
            icon: Trophy,
            color: 'from-amber-400 to-orange-500',
            bg: 'bg-amber-50 dark:bg-amber-950/20',
          },
          {
            label: 'Approved',
            value: stats['APPROVED'] || 0,
            icon: CheckCircle,
            color: 'from-green-400 to-emerald-500',
            bg: 'bg-green-50 dark:bg-green-950/20',
          },
          {
            label: 'Pending Review',
            value: data?.pendingVerifications || 0,
            icon: Clock,
            color: 'from-blue-400 to-indigo-500',
            bg: 'bg-blue-50 dark:bg-blue-950/20',
          },
          {
            label: 'Kudos Received',
            value: data?.kudosReceived || 0,
            icon: Star,
            color: 'from-pink-400 to-rose-500',
            bg: 'bg-pink-50 dark:bg-pink-950/20',
          },
        ].map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
          >
            <Card className={`${stat.bg} border-0`}>
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center`}>
                    <stat.icon className="w-5 h-5 text-white" />
                  </div>
                  <TrendingUp className="w-4 h-4 text-muted-foreground" />
                </div>
                <p className="text-3xl font-bold">{stat.value}</p>
                <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Profile completion */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Profile Completion</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-2">
                <span className="text-3xl font-bold gradient-text-brand">{profile?.completionScore || 0}%</span>
                <Badge variant={profile?.completionScore && profile.completionScore >= 80 ? 'success' : 'warning'}>
                  {profile?.completionScore && profile.completionScore >= 80 ? 'Strong' : 'Needs work'}
                </Badge>
              </div>
              <Progress value={profile?.completionScore || 0} className="mb-4" />
              <div className="space-y-2">
                {[
                  { label: 'Add bio', done: !!profile?.bio },
                  { label: 'Add skills', done: (profile?.skills?.length || 0) > 0 },
                  { label: 'Upload resume', done: !!profile?.resumeUrl },
                  { label: 'Link LinkedIn', done: !!profile?.linkedinUrl },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <div className={`w-4 h-4 rounded-full flex items-center justify-center ${item.done ? 'bg-green-500' : 'bg-muted'}`}>
                      {item.done && <CheckCircle className="w-3 h-3 text-white" />}
                    </div>
                    <span className={item.done ? 'line-through text-muted-foreground' : ''}>{item.label}</span>
                  </div>
                ))}
              </div>
              <Link href="/dashboard/profile">
                <Button variant="outline" size="sm" className="w-full mt-4 gap-1">
                  Complete Profile <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </motion.div>

        {/* Category breakdown chart */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="lg:col-span-2">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Achievement Categories</CardTitle>
            </CardHeader>
            <CardContent>
              {data?.categoryBreakdown && data.categoryBreakdown.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={data.categoryBreakdown.map(c => ({
                    name: categoryLabels[c.category as keyof typeof categoryLabels] || c.category,
                    count: c.count,
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{
                        background: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        fontSize: '12px',
                      }}
                    />
                    <Bar dataKey="count" fill="url(#barGradient)" radius={[4, 4, 0, 0]} />
                    <defs>
                      <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#6366f1" />
                        <stop offset="100%" stopColor="#8b5cf6" />
                      </linearGradient>
                    </defs>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-48 flex flex-col items-center justify-center text-muted-foreground">
                  <Trophy className="w-10 h-10 mb-2 opacity-30" />
                  <p className="text-sm">No approved achievements yet</p>
                  <Link href="/dashboard/achievements">
                    <Button size="sm" className="mt-3 bg-gradient-to-r from-indigo-500 to-violet-600 text-white border-0">
                      Add Achievement
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent achievements */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card>
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-base">Recent Achievements</CardTitle>
              <Link href="/dashboard/achievements" className="text-xs text-primary hover:underline">View all</Link>
            </CardHeader>
            <CardContent className="space-y-3">
              {data?.recentAchievements?.length ? (
                data.recentAchievements.map((a) => (
                  <div key={a.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                    <span className="text-xl">{categoryIcons[a.category]}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{a.title}</p>
                      <p className="text-xs text-muted-foreground">{formatRelativeTime(a.createdAt)}</p>
                    </div>
                    <Badge
                      variant={a.status === 'APPROVED' ? 'success' : a.status === 'REJECTED' ? 'destructive' : 'secondary'}
                      className="text-xs"
                    >
                      {a.status}
                    </Badge>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  <p className="text-sm">No achievements yet</p>
                  <Link href="/dashboard/achievements">
                    <Button size="sm" variant="outline" className="mt-2">Add your first</Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* AI Recommendations */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
          <Card>
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-violet-500" />
                <CardTitle className="text-base">Aura Recommendations</CardTitle>
              </div>
              <Link href="/dashboard/aura" className="text-xs text-primary hover:underline">Chat with Aura</Link>
            </CardHeader>
            <CardContent className="space-y-3">
              {data?.recommendations?.length ? (
                data.recommendations.map((r) => (
                  <div key={r.id} className="p-3 rounded-xl bg-gradient-to-r from-violet-50 to-indigo-50 dark:from-violet-950/20 dark:to-indigo-950/20 border border-violet-200 dark:border-violet-800">
                    <div className="flex items-start gap-2">
                      <span className="text-sm">
                        {r.type === 'certification' ? '📜' : r.type === 'internship' ? '💼' : r.type === 'club' ? '🏆' : '🎯'}
                      </span>
                      <div>
                        <p className="text-sm font-medium">{r.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{r.description}</p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Complete your profile to get AI recommendations</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-64" />
      <div className="grid grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
      </div>
      <div className="grid grid-cols-3 gap-6">
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-64 rounded-xl col-span-2" />
      </div>
    </div>
  );
}
