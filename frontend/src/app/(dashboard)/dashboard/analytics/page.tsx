'use client';

import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { BarChart3, Users, Trophy, TrendingUp, CheckCircle } from 'lucide-react';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { categoryLabels } from '@/lib/utils';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend,
} from 'recharts';

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#f97316', '#14b8a6'];

export default function AnalyticsPage() {
  const { user } = useAuthStore();
  const isFaculty = user?.role === 'FACULTY';
  const isAdmin = user?.role === 'DEPARTMENT_ADMIN' || user?.role === 'SUPER_ADMIN';

  const { data, isLoading } = useQuery({
    queryKey: ['analytics', user?.role],
    queryFn: async () => {
      const endpoint = isAdmin ? '/analytics/admin' : isFaculty ? '/analytics/faculty' : '/analytics/student';
      const { data } = await api.get(endpoint);
      return data.data;
    },
    enabled: !!user,
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
        <div className="grid grid-cols-2 gap-6">
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </div>
    );
  }

  // Admin dashboard
  if (isAdmin && data) {
    const categoryData = data.categoryStats?.map((c: { category: string; count: number }) => ({
      name: categoryLabels[c.category as keyof typeof categoryLabels] || c.category,
      count: c.count,
    })) || [];

    const trendData = Object.entries(data.registrationTrend || {}).map(([month, count]) => ({
      month: month.slice(5), // MM
      students: count,
    }));

    return (
      <div className="space-y-6 max-w-6xl">
        <div>
          <h1 className="text-2xl font-bold">Admin Analytics</h1>
          <p className="text-muted-foreground text-sm mt-1">Platform-wide insights and metrics</p>
        </div>

        {/* Overview stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Students', value: data.overview?.totalStudents, icon: Users, color: 'from-blue-400 to-indigo-500', bg: 'bg-blue-50 dark:bg-blue-950/20' },
            { label: 'Total Achievements', value: data.overview?.totalAchievements, icon: Trophy, color: 'from-amber-400 to-orange-500', bg: 'bg-amber-50 dark:bg-amber-950/20' },
            { label: 'Approved', value: data.overview?.totalApproved, icon: CheckCircle, color: 'from-green-400 to-emerald-500', bg: 'bg-green-50 dark:bg-green-950/20' },
            { label: 'Approval Rate', value: `${data.overview?.approvalRate}%`, icon: TrendingUp, color: 'from-violet-400 to-purple-500', bg: 'bg-violet-50 dark:bg-violet-950/20' },
          ].map((stat, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
              <Card className={`${stat.bg} border-0`}>
                <CardContent className="p-5">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center mb-3`}>
                    <stat.icon className="w-5 h-5 text-white" />
                  </div>
                  <p className="text-3xl font-bold">{stat.value}</p>
                  <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Category breakdown */}
          <Card>
            <CardHeader><CardTitle className="text-base">Achievements by Category</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={categoryData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }} />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {categoryData.map((_: unknown, index: number) => (
                      <Cell key={index} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Registration trend */}
          <Card>
            <CardHeader><CardTitle className="text-base">Student Registration Trend</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }} />
                  <Line type="monotone" dataKey="students" stroke="#6366f1" strokeWidth={2} dot={{ fill: '#6366f1', r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Faculty dashboard
  if (isFaculty && data) {
    const trendData = Object.entries(data.verificationTrend || {}).map(([status, count]) => ({
      status,
      count,
    }));

    return (
      <div className="space-y-6 max-w-6xl">
        <div>
          <h1 className="text-2xl font-bold">Faculty Analytics</h1>
          <p className="text-muted-foreground text-sm mt-1">Verification metrics and student insights</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Pending', value: data.pendingCount, color: 'from-yellow-400 to-amber-500', bg: 'bg-yellow-50 dark:bg-yellow-950/20' },
            { label: 'Under Review', value: data.underReviewCount, color: 'from-blue-400 to-indigo-500', bg: 'bg-blue-50 dark:bg-blue-950/20' },
            { label: 'Approved Today', value: data.approvedToday, color: 'from-green-400 to-emerald-500', bg: 'bg-green-50 dark:bg-green-950/20' },
            { label: 'Total Reviewed', value: Object.values(data.verificationTrend || {}).reduce((a: number, b) => a + (b as number), 0), color: 'from-violet-400 to-purple-500', bg: 'bg-violet-50 dark:bg-violet-950/20' },
          ].map((stat, i) => (
            <Card key={i} className={`${stat.bg} border-0`}>
              <CardContent className="p-5">
                <p className="text-3xl font-bold">{stat.value}</p>
                <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader><CardTitle className="text-base">Verification Status Distribution</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={trendData} dataKey="count" nameKey="status" cx="50%" cy="50%" outerRadius={80} label>
                  {trendData.map((_: unknown, index: number) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="text-center py-16 text-muted-foreground">
      <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-30" />
      <p>Analytics not available for your role.</p>
    </div>
  );
}
