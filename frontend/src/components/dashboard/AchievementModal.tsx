'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { Achievement } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { categoryLabels, categoryIcons } from '@/lib/utils';

const schema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().optional(),
  category: z.string().min(1, 'Select a category'),
  issuingAuthority: z.string().optional(),
  issueDate: z.string().optional(),
  expiryDate: z.string().optional(),
  credentialId: z.string().optional(),
  credentialUrl: z.string().url('Enter a valid URL').optional().or(z.literal('')),
  tags: z.string().optional(),
  isPublic: z.boolean().default(true),
});

type FormData = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onClose: () => void;
  achievement?: Achievement | null;
  prefillData?: Partial<FormData>;
}

export function AchievementModal({ open, onClose, achievement, prefillData }: Props) {
  const queryClient = useQueryClient();
  const isEditing = !!achievement;

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { isPublic: true, category: '' },
  });

  const category = watch('category');

  useEffect(() => {
    if (achievement) {
      reset({
        title: achievement.title,
        description: achievement.description || '',
        category: achievement.category,
        issuingAuthority: achievement.issuingAuthority || '',
        issueDate: achievement.issueDate ? achievement.issueDate.split('T')[0] : '',
        expiryDate: achievement.expiryDate ? achievement.expiryDate.split('T')[0] : '',
        credentialId: achievement.credentialId || '',
        credentialUrl: achievement.credentialUrl || '',
        tags: achievement.tags?.map(t => t.tag.name).join(', ') || '',
        isPublic: achievement.isPublic,
      });
    } else if (prefillData) {
      reset({ ...prefillData, isPublic: true, category: prefillData.category || '' });
    } else {
      reset({ isPublic: true, category: '' });
    }
  }, [achievement, prefillData, reset]);

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      const payload = {
        ...data,
        tags: data.tags ? data.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      };
      if (isEditing) {
        return api.put(`/achievements/${achievement!.id}`, payload);
      }
      return api.post('/achievements', payload);
    },
    onSuccess: () => {
      toast.success(isEditing ? 'Achievement updated!' : 'Achievement created!');
      queryClient.invalidateQueries({ queryKey: ['achievements'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      onClose();
    },
    onError: () => toast.error('Something went wrong'),
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Achievement' : 'Add Achievement'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4 mt-2">
          {/* Title */}
          <div className="space-y-1.5">
            <Label>Title *</Label>
            <Input placeholder="e.g. AWS Cloud Practitioner" {...register('title')} />
            {errors.title && <p className="text-destructive text-xs">{errors.title.message}</p>}
          </div>

          {/* Category */}
          <div className="space-y-1.5">
            <Label>Category *</Label>
            <Select value={category} onValueChange={(v) => setValue('category', v)}>
              <SelectTrigger className={errors.category ? 'border-destructive' : ''}>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(categoryLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {categoryIcons[value as keyof typeof categoryIcons]} {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.category && <p className="text-destructive text-xs">{errors.category.message}</p>}
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label>Description</Label>
            <Textarea placeholder="Brief description of this achievement..." rows={3} {...register('description')} />
          </div>

          {/* Issuing authority */}
          <div className="space-y-1.5">
            <Label>Issuing Authority</Label>
            <Input placeholder="e.g. Amazon Web Services" {...register('issuingAuthority')} />
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Issue Date</Label>
              <Input type="date" {...register('issueDate')} />
            </div>
            <div className="space-y-1.5">
              <Label>Expiry Date</Label>
              <Input type="date" {...register('expiryDate')} />
            </div>
          </div>

          {/* Credential */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Credential ID</Label>
              <Input placeholder="ABC123XYZ" {...register('credentialId')} />
            </div>
            <div className="space-y-1.5">
              <Label>Credential URL</Label>
              <Input placeholder="https://..." {...register('credentialUrl')} />
              {errors.credentialUrl && <p className="text-destructive text-xs">{errors.credentialUrl.message}</p>}
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-1.5">
            <Label>Tags (comma-separated)</Label>
            <Input placeholder="cloud, aws, certification" {...register('tags')} />
          </div>

          {/* Visibility */}
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
            <input
              type="checkbox"
              id="isPublic"
              className="w-4 h-4 rounded"
              {...register('isPublic')}
            />
            <Label htmlFor="isPublic" className="cursor-pointer">
              Make this achievement public on my portfolio
            </Label>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-gradient-to-r from-indigo-500 to-violet-600 text-white border-0"
              disabled={mutation.isPending}
            >
              {mutation.isPending ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{isEditing ? 'Saving...' : 'Creating...'}</>
              ) : (
                isEditing ? 'Save Changes' : 'Create Achievement'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
