'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Heart, MessageCircle, Send, Award, Plus, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { Post } from '@/types';
import { useAuthStore } from '@/store/authStore';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { getInitials, formatRelativeTime } from '@/lib/utils';

function PostCard({ post }: { post: Post }) {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [showComments, setShowComments] = useState(false);
  const [comment, setComment] = useState('');

  const likeMutation = useMutation({
    mutationFn: () => api.post(`/social/posts/${post.id}/like`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['feed'] }),
  });

  const commentMutation = useMutation({
    mutationFn: (content: string) => api.post(`/social/posts/${post.id}/comments`, { content }),
    onSuccess: () => {
      setComment('');
      queryClient.invalidateQueries({ queryKey: ['feed'] });
    },
    onError: () => toast.error('Failed to add comment'),
  });

  const profile = post.user?.profile;
  const initials = profile ? getInitials(profile.firstName, profile.lastName) : 'U';

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-5">
        {/* Author */}
        <div className="flex items-center gap-3 mb-4">
          <Avatar className="w-10 h-10">
            <AvatarImage src={profile?.avatar} />
            <AvatarFallback className="text-sm">{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <p className="font-semibold text-sm">
              {profile ? `${profile.firstName} ${profile.lastName}` : 'Unknown User'}
            </p>
            <p className="text-xs text-muted-foreground">
              {profile?.headline || post.user?.role} • {formatRelativeTime(post.createdAt)}
            </p>
          </div>
          {post.type !== 'GENERAL' && (
            <span className="text-xs px-2 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 font-medium">
              {post.type}
            </span>
          )}
        </div>

        {/* Content */}
        <p className="text-sm leading-relaxed mb-4 whitespace-pre-line">{post.content}</p>

        {/* Image */}
        {post.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={post.imageUrl} alt="Post" className="w-full rounded-xl mb-4 max-h-64 object-cover" />
        )}

        {/* Actions */}
        <div className="flex items-center gap-4 pt-3 border-t border-border">
          <button
            onClick={() => likeMutation.mutate()}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-red-500 transition-colors"
          >
            <Heart className="w-4 h-4" />
            <span>{post.likesCount}</span>
          </button>
          <button
            onClick={() => setShowComments(!showComments)}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-indigo-500 transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
            <span>{post._count?.comments || post.comments?.length || 0}</span>
          </button>
        </div>

        {/* Comments */}
        {showComments && (
          <div className="mt-4 space-y-3">
            {post.comments?.map((c) => (
              <div key={c.id} className="flex gap-2">
                <Avatar className="w-7 h-7 flex-shrink-0">
                  <AvatarImage src={c.user?.profile?.avatar} />
                  <AvatarFallback className="text-xs">
                    {c.user?.profile ? getInitials(c.user.profile.firstName, c.user.profile.lastName) : 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="bg-muted rounded-xl px-3 py-2 flex-1">
                  <p className="text-xs font-semibold">
                    {c.user?.profile ? `${c.user.profile.firstName} ${c.user.profile.lastName}` : 'User'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">{c.content}</p>
                </div>
              </div>
            ))}

            {/* Add comment */}
            <div className="flex gap-2">
              <Avatar className="w-7 h-7 flex-shrink-0">
                <AvatarImage src={user?.profile?.avatar} />
                <AvatarFallback className="text-xs">
                  {user?.profile ? getInitials(user.profile.firstName, user.profile.lastName) : 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 flex gap-2">
                <input
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Write a comment..."
                  className="flex-1 bg-muted rounded-xl px-3 py-2 text-xs outline-none"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && comment.trim()) {
                      commentMutation.mutate(comment.trim());
                    }
                  }}
                />
                <button
                  onClick={() => comment.trim() && commentMutation.mutate(comment.trim())}
                  disabled={!comment.trim() || commentMutation.isPending}
                  className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5 text-white" />
                </button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function CommunityPage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [newPost, setNewPost] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['feed'],
    queryFn: async () => {
      const { data } = await api.get('/social/feed?limit=20');
      return data;
    },
  });

  const createPostMutation = useMutation({
    mutationFn: (content: string) => api.post('/social/posts', { content }),
    onSuccess: () => {
      setNewPost('');
      toast.success('Post shared!');
      queryClient.invalidateQueries({ queryKey: ['feed'] });
    },
    onError: () => toast.error('Failed to create post'),
  });

  const posts: Post[] = data?.data || [];
  const profile = user?.profile;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Community</h1>
        <p className="text-muted-foreground text-sm mt-1">Connect with your university community</p>
      </div>

      {/* Create post */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-3">
            <Avatar className="w-10 h-10 flex-shrink-0">
              <AvatarImage src={profile?.avatar} />
              <AvatarFallback className="text-sm">
                {profile ? getInitials(profile.firstName, profile.lastName) : 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <Textarea
                value={newPost}
                onChange={(e) => setNewPost(e.target.value)}
                placeholder="Share an achievement, ask a question, or post an update..."
                rows={3}
                className="mb-3"
              />
              <div className="flex justify-end">
                <Button
                  size="sm"
                  onClick={() => newPost.trim() && createPostMutation.mutate(newPost.trim())}
                  disabled={!newPost.trim() || createPostMutation.isPending}
                  className="bg-gradient-to-r from-indigo-500 to-violet-600 text-white border-0 gap-2"
                >
                  {createPostMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <><Plus className="w-4 h-4" /> Share</>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Feed */}
      {isLoading ? (
        Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-48 rounded-xl" />)
      ) : posts.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No posts yet. Be the first to share!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post, i) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <PostCard post={post} />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
