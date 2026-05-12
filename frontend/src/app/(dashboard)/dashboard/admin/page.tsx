'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Users, Trophy, Building2, TrendingUp, CheckCircle, UserCheck, Shield, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { getInitials } from '@/lib/utils';

export default function AdminPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const queryClient = useQueryClient();

  // Guard: only admins
  useEffect(() => {
    if (user && user.role !== 'SUPER_ADMIN' && user.role !== 'DEPARTMENT_ADMIN') {
      router.push('/dashboard');
    }
  }, [user, router]);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: async () => {
      const { data } = await api.get('/analytics/admin');
      return data.data;
    },
    enabled: !!user && (user.role === 'SUPER_ADMIN' || user.role === 'DEPARTMENT_ADMIN'),
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

  const overview = data?.overview || {};
  const recentUsers = data?.recentUsers || [];
  const departmentStats = data?.departmentStats || [];
  const categoryStats = data?.categoryStats || [];

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center">
          <Shield className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Admin Panel</h1>
          <p className="text-muted-foreground text-sm">Platform management and oversight</p>
        </div>
      </div>

      {/* Overview stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Students', value: overview.totalStudents ?? 0, icon: Users, color: 'from-blue-400 to-indigo-500', bg: 'bg-blue-50 dark:bg-blue-950/20' },
          { label: 'Total Achievements', value: overview.totalAchievements ?? 0, icon: Trophy, color: 'from-amber-400 to-orange-500', bg: 'bg-amber-50 dark:bg-amber-950/20' },
          { label: 'Approved', value: overview.totalApproved ?? 0, icon: CheckCircle, color: 'from-green-400 to-emerald-500', bg: 'bg-green-50 dark:bg-green-950/20' },
          { label: 'Approval Rate', value: `${overview.approvalRate ?? 0}%`, icon: TrendingUp, color: 'from-violet-400 to-purple-500', bg: 'bg-violet-50 dark:bg-violet-950/20' },
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
        {/* Recent students */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <UserCheck className="w-4 h-4" /> Recently Joined Students
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentUsers.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No students yet</p>
            ) : (
              recentUsers.map((u: { id: string; profile?: { firstName: string; lastName: string; avatar?: string; rollNumber?: string }; email: string; role: string; createdAt: string }) => {
                const profile = u.profile;
                const initials = profile ? getInitials(profile.firstName, profile.lastName) : 'U';
                return (
                  <div key={u.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                    <Avatar className="w-9 h-9">
                      <AvatarImage src={profile?.avatar} />
                      <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {profile ? `${profile.firstName} ${profile.lastName}` : u.email}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {profile?.rollNumber || u.email}
                      </p>
                    </div>
                    <Badge variant="secondary" className="text-xs capitalize">
                      {u.role.toLowerCase().replace('_', ' ')}
                    </Badge>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* Department stats */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="w-4 h-4" /> Department Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {departmentStats.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No departments configured</p>
            ) : (
              departmentStats.map((dept: { id: string; name: string; code: string; _count: { users: number; achievements: number } }) => (
                <div key={dept.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div>
                    <p className="text-sm font-medium">{dept.name}</p>
                    <p className="text-xs text-muted-foreground">{dept.code}</p>
                  </div>
                  <div className="flex gap-3 text-right">
                    <div>
                      <p className="text-sm font-bold">{dept._count?.users ?? 0}</p>
                      <p className="text-xs text-muted-foreground">Students</p>
                    </div>
                    <div>
                      <p className="text-sm font-bold">{dept._count?.achievements ?? 0}</p>
                      <p className="text-xs text-muted-foreground">Achievements</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Category breakdown */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Achievement Category Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {categoryStats.map((c: { category: string; count: number }, i: number) => (
              <div key={i} className="p-3 rounded-xl bg-muted/50 text-center">
                <p className="text-xl font-bold">{c.count}</p>
                <p className="text-xs text-muted-foreground capitalize mt-1">
                  {c.category.toLowerCase().replace('_', ' ')}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick actions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <Button variant="outline" className="gap-2" onClick={() => router.push('/dashboard/verify')}>
              <CheckCircle className="w-4 h-4" /> Review Queue
            </Button>
            <Button variant="outline" className="gap-2" onClick={() => router.push('/dashboard/analytics')}>
              <TrendingUp className="w-4 h-4" /> View Analytics
            </Button>
            <Button variant="outline" className="gap-2" onClick={() => router.push('/dashboard/notifications')}>
              <Users className="w-4 h-4" /> Notifications
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
