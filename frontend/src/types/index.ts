// ============================================
// UNI-CONNECT TYPE DEFINITIONS
// ============================================

export type Role = 'STUDENT' | 'FACULTY' | 'DEPARTMENT_ADMIN' | 'SUPER_ADMIN';

export type VerificationStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'RESUBMISSION_REQUIRED';

export type AchievementCategory =
  | 'ACADEMIC'
  | 'CERTIFICATION'
  | 'INTERNSHIP'
  | 'WORKSHOP'
  | 'HACKATHON'
  | 'RESEARCH'
  | 'LEADERSHIP'
  | 'CLUB'
  | 'VOLUNTEERING'
  | 'AWARD'
  | 'PEER_RECOGNITION'
  | 'OTHER';

export type NotificationType =
  | 'VERIFICATION_UPDATE'
  | 'ACHIEVEMENT_APPROVED'
  | 'ACHIEVEMENT_REJECTED'
  | 'NEW_RECOMMENDATION'
  | 'KUDOS_RECEIVED'
  | 'POST_LIKE'
  | 'POST_COMMENT'
  | 'EVENT_REMINDER'
  | 'SYSTEM';

// ============================================
// USER & PROFILE
// ============================================

export interface User {
  id: string;
  email: string;
  role: Role;
  isEmailVerified: boolean;
  isActive: boolean;
  lastLoginAt?: string;
  createdAt: string;
  profile?: Profile;
  department?: Department;
}

export interface Profile {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  coverImage?: string;
  bio?: string;
  headline?: string;
  phone?: string;
  location?: string;
  website?: string;
  linkedinUrl?: string;
  githubUrl?: string;
  twitterUrl?: string;
  resumeUrl?: string;
  rollNumber?: string;
  batch?: string;
  cgpa?: number;
  completionScore: number;
  isPublic: boolean;
  portfolioSlug?: string;
  skills: ProfileSkill[];
  interests: Interest[];
}

export interface ProfileSkill {
  id: string;
  skill: Skill;
  level?: string;
}

export interface Skill {
  id: string;
  name: string;
  category?: string;
}

export interface Interest {
  id: string;
  name: string;
}

export interface Department {
  id: string;
  name: string;
  code: string;
  description?: string;
}

// ============================================
// ACHIEVEMENT
// ============================================

export interface Achievement {
  id: string;
  userId: string;
  title: string;
  description?: string;
  category: AchievementCategory;
  issuingAuthority?: string;
  issueDate?: string;
  expiryDate?: string;
  credentialId?: string;
  credentialUrl?: string;
  status: VerificationStatus;
  isPublic: boolean;
  isFeatured: boolean;
  ocrConfidence?: number;
  createdAt: string;
  updatedAt: string;
  tags: AchievementTag[];
  skills: AchievementSkill[];
  documents: Document[];
  verifications: Verification[];
  user?: User;
}

export interface AchievementTag {
  tag: { id: string; name: string };
}

export interface AchievementSkill {
  skill: Skill;
}

export interface Document {
  id: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
}

// ============================================
// VERIFICATION
// ============================================

export interface Verification {
  id: string;
  achievementId: string;
  reviewerId?: string;
  reviewer?: User;
  status: VerificationStatus;
  remarks?: string;
  requestedAt: string;
  reviewedAt?: string;
  createdAt: string;
}

// ============================================
// SOCIAL
// ============================================

export interface Post {
  id: string;
  userId: string;
  user: User;
  type: string;
  content: string;
  imageUrl?: string;
  isPublic: boolean;
  likesCount: number;
  createdAt: string;
  comments: Comment[];
  _count?: { comments: number; likes: number };
}

export interface Comment {
  id: string;
  postId: string;
  userId: string;
  user: User;
  content: string;
  createdAt: string;
}

export interface Kudos {
  id: string;
  giverId: string;
  giver: User;
  receiverId: string;
  message?: string;
  category?: string;
  createdAt: string;
}

// ============================================
// NOTIFICATION
// ============================================

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  isRead: boolean;
  createdAt: string;
}

// ============================================
// AI / RECOMMENDATION
// ============================================

export interface Recommendation {
  id: string;
  type: string;
  title: string;
  description: string;
  url?: string;
  relevance?: number;
  isActioned: boolean;
  createdAt: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

// ============================================
// API RESPONSE
// ============================================

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ============================================
// DASHBOARD
// ============================================

export interface StudentDashboard {
  profile: Profile;
  achievementStats: Record<string, number>;
  recentAchievements: Achievement[];
  pendingVerifications: number;
  recommendations: Recommendation[];
  kudosReceived: number;
  categoryBreakdown: Array<{ category: string; count: number }>;
  activityByMonth: Record<string, number>;
}

export interface FacultyDashboard {
  pendingCount: number;
  underReviewCount: number;
  approvedToday: number;
  recentSubmissions: Achievement[];
  verificationTrend: Record<string, number>;
}

export interface AdminDashboard {
  overview: {
    totalStudents: number;
    totalAchievements: number;
    totalApproved: number;
    approvalRate: number;
    engagementStats: number;
  };
  departmentStats: Department[];
  categoryStats: Array<{ category: string; count: number }>;
  recentUsers: User[];
  registrationTrend: Record<string, number>;
}
