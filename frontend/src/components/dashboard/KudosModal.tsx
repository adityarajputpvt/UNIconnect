'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Loader2, Star } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

const kudosCategories = [
  { value: 'leadership', label: '👑 Leadership' },
  { value: 'teamwork', label: '🤝 Teamwork' },
  { value: 'innovation', label: '💡 Innovation' },
  { value: 'helpfulness', label: '🙌 Helpfulness' },
  { value: 'excellence', label: '🏆 Excellence' },
  { value: 'creativity', label: '🎨 Creativity' },
];

interface Props {
  open: boolean;
  onClose: () => void;
}

export function KudosModal({ open, onClose }: Props) {
  const [receiverEmail, setReceiverEmail] = useState('');
  const [message, setMessage] = useState('');
  const [category, setCategory] = useState('');

  const mutation = useMutation({
    mutationFn: async () => {
      // First find user by email
      const { data: profileData } = await api.get(`/profiles/search?email=${encodeURIComponent(receiverEmail)}`);
      const receiverId = profileData?.data?.userId;
      if (!receiverId) throw new Error('User not found');
      return api.post('/social/kudos', { receiverId, message, category });
    },
    onSuccess: () => {
      toast.success('Kudos sent! 🎉');
      setReceiverEmail('');
      setMessage('');
      setCategory('');
      onClose();
    },
    onError: (err: Error) => {
      toast.error(err.message === 'User not found' ? 'User not found with that email' : 'Failed to send kudos');
    },
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Star className="w-5 h-5 text-amber-500" />
            Send Kudos
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label>Recipient Email *</Label>
            <Input
              type="email"
              placeholder="colleague@university.edu"
              value={receiverEmail}
              onChange={(e) => setReceiverEmail(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Category</Label>
            <div className="grid grid-cols-3 gap-2">
              {kudosCategories.map((cat) => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => setCategory(cat.value === category ? '' : cat.value)}
                  className={`px-2 py-2 rounded-lg text-xs font-medium transition-colors text-center ${
                    category === cat.value
                      ? 'bg-amber-100 dark:bg-amber-950/40 border-2 border-amber-400 text-amber-700 dark:text-amber-300'
                      : 'bg-muted hover:bg-muted/80 border-2 border-transparent'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Message (optional)</Label>
            <Textarea
              placeholder="Tell them why they deserve this kudos..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
            <Button
              className="flex-1 bg-gradient-to-r from-amber-400 to-orange-500 text-white border-0 gap-2"
              onClick={() => mutation.mutate()}
              disabled={!receiverEmail.trim() || mutation.isPending}
            >
              {mutation.isPending ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Sending...</>
              ) : (
                <><Star className="w-4 h-4" /> Send Kudos</>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
