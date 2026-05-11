import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistanceToNow } from 'date-fns';
import { AchievementCategory, VerificationStatus } from '@/types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date): string {
  return format(new Date(date), 'MMM d, yyyy');
}

export function formatRelativeTime(date: string | Date): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export const categoryColors: Record<AchievementCategory, string> = {
  ACADEMIC: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  CERTIFICATION: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  INTERNSHIP: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  WORKSHOP: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  HACKATHON: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  RESEARCH: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
  LEADERSHIP: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  CLUB: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
  VOLUNTEERING: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
  AWARD: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  PEER_RECOGNITION: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
  OTHER: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
};

export const statusConfig: Record<VerificationStatus, { label: string; className: string }> = {
  DRAFT: { label: 'Draft', className: 'status-draft' },
  SUBMITTED: { label: 'Submitted', className: 'status-pending' },
  UNDER_REVIEW: { label: 'Under Review', className: 'status-review' },
  APPROVED: { label: 'Approved', className: 'status-approved' },
  REJECTED: { label: 'Rejected', className: 'status-rejected' },
  RESUBMISSION_REQUIRED: { label: 'Resubmit', className: 'status-pending' },
};

export const categoryLabels: Record<AchievementCategory, string> = {
  ACADEMIC: 'Academic',
  CERTIFICATION: 'Certification',
  INTERNSHIP: 'Internship',
  WORKSHOP: 'Workshop',
  HACKATHON: 'Hackathon',
  RESEARCH: 'Research',
  LEADERSHIP: 'Leadership',
  CLUB: 'Club Activity',
  VOLUNTEERING: 'Volunteering',
  AWARD: 'Award',
  PEER_RECOGNITION: 'Peer Recognition',
  OTHER: 'Other',
};

export const categoryIcons: Record<AchievementCategory, string> = {
  ACADEMIC: '🎓',
  CERTIFICATION: '📜',
  INTERNSHIP: '💼',
  WORKSHOP: '🔧',
  HACKATHON: '💻',
  RESEARCH: '🔬',
  LEADERSHIP: '👑',
  CLUB: '🏆',
  VOLUNTEERING: '🤝',
  AWARD: '🥇',
  PEER_RECOGNITION: '⭐',
  OTHER: '📌',
};
