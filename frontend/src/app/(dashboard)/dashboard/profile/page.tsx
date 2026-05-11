'use client';

import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Camera, Save, Loader2, Plus, X, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { getInitials } from '@/lib/utils';

const profileSchema = z.object({
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  headline: z.string().max(120).optional(),
  bio: z.string().max(500).optional(),
  phone: z.string().optional(),
  location: z.string().optional(),
  website: z.string().url().optional().or(z.literal('')),
  linkedinUrl: z.string().url().optional().or(z.literal('')),
  githubUrl: z.string().url().optional().or(z.literal('')),
  twitterUrl: z.string().url().optional().or(z.literal('')),
  rollNumber: z.string().optional(),
  batch: z.string().optional(),
  cgpa: z.string().optional(),
  isPublic: z.boolean().default(true),
});

type ProfileForm = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const { user, fetchMe } = useAuthStore();
  const queryClient = useQueryClient();
  const profile = user?.profile;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [skills, setSkills] = useState<Array<{ name: string; level: string }>>(
    profile?.skills?.map(s => ({ name: s.skill.name, level: s.level || 'intermediate' })) || []
  );
  const [interests, setInterests] = useState<string[]>(
    profile?.interests?.map(i => i.name) || []
  );
  const [newSkill, setNewSkill] = useState('');
  const [newInterest, setNewInterest] = useState('');

  const { register, handleSubmit, formState: { errors } } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: profile?.firstName || '',
      lastName: profile?.lastName || '',
      headline: profile?.headline || '',
      bio: profile?.bio || '',
      phone: profile?.phone || '',
      location: profile?.location || '',
      website: profile?.website || '',
      linkedinUrl: profile?.linkedinUrl || '',
      githubUrl: profile?.githubUrl || '',
      twitterUrl: profile?.twitterUrl || '',
      rollNumber: profile?.rollNumber || '',
      batch: profile?.batch || '',
      cgpa: profile?.cgpa?.toString() || '',
      isPublic: profile?.isPublic ?? true,
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: ProfileForm & { skills: typeof skills; interests: typeof interests }) =>
      api.put('/profiles', data),
    onSuccess: () => {
      toast.success('Profile updated!');
      fetchMe();
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: () => toast.error('Failed to update profile'),
  });

  const avatarMutation = useMutation({
    mutationFn: (file: File) => {
      const formData = new FormData();
      formData.append('avatar', file);
      return api.post('/profiles/avatar', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
    },
    onSuccess: () => {
      toast.success('Avatar updated!');
      fetchMe();
    },
    onError: () => toast.error('Failed to upload avatar'),
  });

  const onSubmit = (data: ProfileForm) => {
    updateMutation.mutate({ ...data, skills, interests });
  };

  const addSkill = () => {
    if (newSkill.trim() && !skills.find(s => s.name === newSkill.trim())) {
      setSkills([...skills, { name: newSkill.trim(), level: 'intermediate' }]);
      setNewSkill('');
    }
  };

  const addInterest = () => {
    if (newInterest.trim() && !interests.includes(newInterest.trim())) {
      setInterests([...interests, newInterest.trim()]);
      setNewInterest('');
    }
  };

  const initials = profile ? getInitials(profile.firstName, profile.lastName) : 'U';

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Edit Profile</h1>
        <p className="text-muted-foreground text-sm mt-1">Keep your profile up to date for better opportunities</p>
      </div>

      {/* Profile completion */}
      <Card className="bg-gradient-to-r from-indigo-50 to-violet-50 dark:from-indigo-950/20 dark:to-violet-950/20 border-indigo-200 dark:border-indigo-800">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold">Profile Completion</p>
            <span className="text-lg font-bold gradient-text-brand">{profile?.completionScore || 0}%</span>
          </div>
          <Progress value={profile?.completionScore || 0} />
          {profile?.portfolioSlug && (
            <a
              href={`/portfolio/${profile.portfolioSlug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 mt-2 hover:underline"
            >
              <ExternalLink className="w-3 h-3" />
              View public portfolio
            </a>
          )}
        </CardContent>
      </Card>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Avatar */}
        <Card>
          <CardHeader><CardTitle className="text-base">Profile Photo</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="relative">
                <Avatar className="w-20 h-20">
                  <AvatarImage src={profile?.avatar} />
                  <AvatarFallback className="text-xl">{initials}</AvatarFallback>
                </Avatar>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-indigo-500 flex items-center justify-center text-white hover:bg-indigo-600 transition-colors"
                >
                  {avatarMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) avatarMutation.mutate(file);
                  }}
                />
              </div>
              <div>
                <p className="text-sm font-medium">{profile?.firstName} {profile?.lastName}</p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
                <p className="text-xs text-muted-foreground capitalize mt-0.5">{user?.role?.toLowerCase().replace('_', ' ')}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Basic info */}
        <Card>
          <CardHeader><CardTitle className="text-base">Basic Information</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>First Name *</Label>
                <Input {...register('firstName')} className={errors.firstName ? 'border-destructive' : ''} />
              </div>
              <div className="space-y-1.5">
                <Label>Last Name *</Label>
                <Input {...register('lastName')} className={errors.lastName ? 'border-destructive' : ''} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Headline</Label>
              <Input placeholder="e.g. CS Student | Full-Stack Developer | Open to Opportunities" {...register('headline')} />
            </div>
            <div className="space-y-1.5">
              <Label>Bio</Label>
              <Textarea placeholder="Tell your story..." rows={4} {...register('bio')} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Phone</Label>
                <Input placeholder="+91 98765 43210" {...register('phone')} />
              </div>
              <div className="space-y-1.5">
                <Label>Location</Label>
                <Input placeholder="Mumbai, India" {...register('location')} />
              </div>
            </div>
            {user?.role === 'STUDENT' && (
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label>Roll Number</Label>
                  <Input placeholder="2021CS001" {...register('rollNumber')} />
                </div>
                <div className="space-y-1.5">
                  <Label>Batch</Label>
                  <Input placeholder="2021-2025" {...register('batch')} />
                </div>
                <div className="space-y-1.5">
                  <Label>CGPA</Label>
                  <Input type="number" step="0.01" min="0" max="10" placeholder="8.5" {...register('cgpa')} />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Social links */}
        <Card>
          <CardHeader><CardTitle className="text-base">Social Links</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {[
              { label: 'Website', field: 'website' as const, placeholder: 'https://yoursite.com' },
              { label: 'LinkedIn', field: 'linkedinUrl' as const, placeholder: 'https://linkedin.com/in/username' },
              { label: 'GitHub', field: 'githubUrl' as const, placeholder: 'https://github.com/username' },
              { label: 'Twitter', field: 'twitterUrl' as const, placeholder: 'https://twitter.com/username' },
            ].map(({ label, field, placeholder }) => (
              <div key={field} className="space-y-1.5">
                <Label>{label}</Label>
                <Input placeholder={placeholder} {...register(field)} />
                {errors[field] && <p className="text-destructive text-xs">{errors[field]?.message}</p>}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Skills */}
        <Card>
          <CardHeader><CardTitle className="text-base">Skills</CardTitle></CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2 mb-3">
              {skills.map((skill, i) => (
                <Badge key={i} variant="secondary" className="gap-1 pr-1">
                  {skill.name}
                  <button type="button" onClick={() => setSkills(skills.filter((_, j) => j !== i))}>
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                placeholder="Add a skill..."
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSkill(); } }}
              />
              <Button type="button" variant="outline" size="sm" onClick={addSkill}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Interests */}
        <Card>
          <CardHeader><CardTitle className="text-base">Interests</CardTitle></CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2 mb-3">
              {interests.map((interest, i) => (
                <Badge key={i} variant="outline" className="gap-1 pr-1">
                  {interest}
                  <button type="button" onClick={() => setInterests(interests.filter((_, j) => j !== i))}>
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={newInterest}
                onChange={(e) => setNewInterest(e.target.value)}
                placeholder="Add an interest..."
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addInterest(); } }}
              />
              <Button type="button" variant="outline" size="sm" onClick={addInterest}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Visibility */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <input type="checkbox" id="isPublic" className="w-4 h-4 rounded" {...register('isPublic')} />
              <Label htmlFor="isPublic" className="cursor-pointer">
                Make my portfolio publicly visible
              </Label>
            </div>
          </CardContent>
        </Card>

        <Button
          type="submit"
          className="w-full bg-gradient-to-r from-indigo-500 to-violet-600 text-white border-0 h-11 gap-2"
          disabled={updateMutation.isPending}
        >
          {updateMutation.isPending ? (
            <><Loader2 className="w-4 h-4 animate-spin" />Saving...</>
          ) : (
            <><Save className="w-4 h-4" />Save Profile</>
          )}
        </Button>
      </form>
    </div>
  );
}
