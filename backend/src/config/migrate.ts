/**
 * Applies the Prisma schema directly to PGlite by translating
 * the schema models into CREATE TABLE statements.
 * This bypasses the need for `prisma migrate` (which requires a TCP connection).
 */
import { PGlite } from '@electric-sql/pglite';

export async function applyMigrations(db: PGlite): Promise<void> {
  console.log('📦 Applying database schema...');

  // Run all DDL in a single transaction
  await db.exec(`
    -- Enable extensions (PGlite has gen_random_uuid built-in, no extension needed)
    -- gen_random_uuid() is available natively in PostgreSQL 13+

    -- Enums
    DO $$ BEGIN
      CREATE TYPE "Role" AS ENUM ('STUDENT','FACULTY','DEPARTMENT_ADMIN','SUPER_ADMIN');
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;

    DO $$ BEGIN
      CREATE TYPE "VerificationStatus" AS ENUM (
        'DRAFT','SUBMITTED','UNDER_REVIEW','APPROVED','REJECTED','RESUBMISSION_REQUIRED'
      );
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;

    DO $$ BEGIN
      CREATE TYPE "AchievementCategory" AS ENUM (
        'ACADEMIC','CERTIFICATION','INTERNSHIP','WORKSHOP','HACKATHON',
        'RESEARCH','LEADERSHIP','CLUB','VOLUNTEERING','AWARD','PEER_RECOGNITION','OTHER'
      );
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;

    DO $$ BEGIN
      CREATE TYPE "NotificationType" AS ENUM (
        'VERIFICATION_UPDATE','ACHIEVEMENT_APPROVED','ACHIEVEMENT_REJECTED',
        'NEW_RECOMMENDATION','KUDOS_RECEIVED','POST_LIKE','POST_COMMENT',
        'EVENT_REMINDER','SYSTEM'
      );
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;

    DO $$ BEGIN
      CREATE TYPE "PostType" AS ENUM (
        'GENERAL','ACHIEVEMENT','EVENT','ANNOUNCEMENT','CLUB'
      );
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;

    -- departments
    CREATE TABLE IF NOT EXISTS "departments" (
      "id"          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      "name"        TEXT UNIQUE NOT NULL,
      "code"        TEXT UNIQUE NOT NULL,
      "description" TEXT,
      "headId"      TEXT,
      "isActive"    BOOLEAN NOT NULL DEFAULT true,
      "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      "updatedAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    -- users
    CREATE TABLE IF NOT EXISTS "users" (
      "id"                  TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      "email"               TEXT UNIQUE NOT NULL,
      "password"            TEXT NOT NULL,
      "role"                "Role" NOT NULL DEFAULT 'STUDENT',
      "isEmailVerified"     BOOLEAN NOT NULL DEFAULT false,
      "emailVerifyToken"    TEXT,
      "resetPasswordToken"  TEXT,
      "resetPasswordExpiry" TIMESTAMPTZ,
      "refreshToken"        TEXT,
      "isActive"            BOOLEAN NOT NULL DEFAULT true,
      "lastLoginAt"         TIMESTAMPTZ,
      "createdAt"           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      "updatedAt"           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      "departmentId"        TEXT REFERENCES "departments"("id")
    );
    CREATE INDEX IF NOT EXISTS "users_email_idx" ON "users"("email");
    CREATE INDEX IF NOT EXISTS "users_role_idx"  ON "users"("role");

    -- profiles
    CREATE TABLE IF NOT EXISTS "profiles" (
      "id"              TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      "userId"          TEXT UNIQUE NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
      "firstName"       TEXT NOT NULL,
      "lastName"        TEXT NOT NULL,
      "avatar"          TEXT,
      "coverImage"      TEXT,
      "bio"             TEXT,
      "headline"        TEXT,
      "phone"           TEXT,
      "location"        TEXT,
      "website"         TEXT,
      "linkedinUrl"     TEXT,
      "githubUrl"       TEXT,
      "twitterUrl"      TEXT,
      "resumeUrl"       TEXT,
      "rollNumber"      TEXT UNIQUE,
      "batch"           TEXT,
      "cgpa"            FLOAT,
      "completionScore" INT NOT NULL DEFAULT 0,
      "isPublic"        BOOLEAN NOT NULL DEFAULT true,
      "portfolioSlug"   TEXT UNIQUE,
      "createdAt"       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      "updatedAt"       TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS "profiles_userId_idx"       ON "profiles"("userId");
    CREATE INDEX IF NOT EXISTS "profiles_portfolioSlug_idx" ON "profiles"("portfolioSlug");

    -- skills
    CREATE TABLE IF NOT EXISTS "skills" (
      "id"        TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      "name"      TEXT UNIQUE NOT NULL,
      "category"  TEXT,
      "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    -- profile_skills
    CREATE TABLE IF NOT EXISTS "profile_skills" (
      "id"        TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      "profileId" TEXT NOT NULL REFERENCES "profiles"("id") ON DELETE CASCADE,
      "skillId"   TEXT NOT NULL REFERENCES "skills"("id"),
      "level"     TEXT,
      "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE("profileId","skillId")
    );

    -- interests
    CREATE TABLE IF NOT EXISTS "interests" (
      "id"        TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      "profileId" TEXT NOT NULL REFERENCES "profiles"("id") ON DELETE CASCADE,
      "name"      TEXT NOT NULL,
      "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    -- achievements
    CREATE TABLE IF NOT EXISTS "achievements" (
      "id"               TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      "userId"           TEXT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
      "departmentId"     TEXT REFERENCES "departments"("id"),
      "title"            TEXT NOT NULL,
      "description"      TEXT,
      "category"         "AchievementCategory" NOT NULL,
      "issuingAuthority" TEXT,
      "issueDate"        TIMESTAMPTZ,
      "expiryDate"       TIMESTAMPTZ,
      "credentialId"     TEXT,
      "credentialUrl"    TEXT,
      "status"           "VerificationStatus" NOT NULL DEFAULT 'DRAFT',
      "isPublic"         BOOLEAN NOT NULL DEFAULT true,
      "isFeatured"       BOOLEAN NOT NULL DEFAULT false,
      "ocrConfidence"    FLOAT,
      "ocrRawText"       TEXT,
      "ocrMetadata"      JSONB,
      "createdAt"        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      "updatedAt"        TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS "achievements_userId_idx"   ON "achievements"("userId");
    CREATE INDEX IF NOT EXISTS "achievements_status_idx"   ON "achievements"("status");
    CREATE INDEX IF NOT EXISTS "achievements_category_idx" ON "achievements"("category");

    -- documents
    CREATE TABLE IF NOT EXISTS "documents" (
      "id"             TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      "achievementId"  TEXT NOT NULL REFERENCES "achievements"("id") ON DELETE CASCADE,
      "fileName"       TEXT NOT NULL,
      "fileUrl"        TEXT NOT NULL,
      "fileType"       TEXT NOT NULL,
      "fileSize"       INT NOT NULL,
      "cloudinaryId"   TEXT,
      "isOcrProcessed" BOOLEAN NOT NULL DEFAULT false,
      "createdAt"      TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    -- tags
    CREATE TABLE IF NOT EXISTS "tags" (
      "id"        TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      "name"      TEXT UNIQUE NOT NULL,
      "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    -- achievement_tags
    CREATE TABLE IF NOT EXISTS "achievement_tags" (
      "achievementId" TEXT NOT NULL REFERENCES "achievements"("id") ON DELETE CASCADE,
      "tagId"         TEXT NOT NULL REFERENCES "tags"("id"),
      PRIMARY KEY("achievementId","tagId")
    );

    -- achievement_skills
    CREATE TABLE IF NOT EXISTS "achievement_skills" (
      "achievementId" TEXT NOT NULL REFERENCES "achievements"("id") ON DELETE CASCADE,
      "skillId"       TEXT NOT NULL REFERENCES "skills"("id"),
      PRIMARY KEY("achievementId","skillId")
    );

    -- verifications
    CREATE TABLE IF NOT EXISTS "verifications" (
      "id"            TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      "achievementId" TEXT NOT NULL REFERENCES "achievements"("id") ON DELETE CASCADE,
      "reviewerId"    TEXT REFERENCES "users"("id"),
      "status"        "VerificationStatus" NOT NULL,
      "remarks"       TEXT,
      "requestedAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      "reviewedAt"    TIMESTAMPTZ,
      "createdAt"     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      "updatedAt"     TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS "verifications_achievementId_idx" ON "verifications"("achievementId");
    CREATE INDEX IF NOT EXISTS "verifications_reviewerId_idx"    ON "verifications"("reviewerId");

    -- posts
    CREATE TABLE IF NOT EXISTS "posts" (
      "id"         TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      "userId"     TEXT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
      "type"       "PostType" NOT NULL DEFAULT 'GENERAL',
      "content"    TEXT NOT NULL,
      "imageUrl"   TEXT,
      "isPublic"   BOOLEAN NOT NULL DEFAULT true,
      "likesCount" INT NOT NULL DEFAULT 0,
      "createdAt"  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      "updatedAt"  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS "posts_userId_idx" ON "posts"("userId");

    -- comments
    CREATE TABLE IF NOT EXISTS "comments" (
      "id"        TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      "postId"    TEXT NOT NULL REFERENCES "posts"("id") ON DELETE CASCADE,
      "userId"    TEXT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
      "content"   TEXT NOT NULL,
      "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS "comments_postId_idx" ON "comments"("postId");

    -- post_likes
    CREATE TABLE IF NOT EXISTS "post_likes" (
      "id"        TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      "postId"    TEXT NOT NULL REFERENCES "posts"("id") ON DELETE CASCADE,
      "userId"    TEXT NOT NULL,
      "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE("postId","userId")
    );

    -- kudos
    CREATE TABLE IF NOT EXISTS "kudos" (
      "id"         TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      "giverId"    TEXT NOT NULL REFERENCES "users"("id"),
      "receiverId" TEXT NOT NULL REFERENCES "users"("id"),
      "message"    TEXT,
      "category"   TEXT,
      "createdAt"  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS "kudos_receiverId_idx" ON "kudos"("receiverId");

    -- notifications
    CREATE TABLE IF NOT EXISTS "notifications" (
      "id"        TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      "userId"    TEXT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
      "type"      "NotificationType" NOT NULL,
      "title"     TEXT NOT NULL,
      "message"   TEXT NOT NULL,
      "data"      JSONB,
      "isRead"    BOOLEAN NOT NULL DEFAULT false,
      "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS "notifications_userId_isRead_idx" ON "notifications"("userId","isRead");

    -- recommendations
    CREATE TABLE IF NOT EXISTS "recommendations" (
      "id"          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      "userId"      TEXT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
      "type"        TEXT NOT NULL,
      "title"       TEXT NOT NULL,
      "description" TEXT NOT NULL,
      "url"         TEXT,
      "relevance"   FLOAT,
      "isActioned"  BOOLEAN NOT NULL DEFAULT false,
      "metadata"    JSONB,
      "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS "recommendations_userId_idx" ON "recommendations"("userId");

    -- audit_logs
    CREATE TABLE IF NOT EXISTS "audit_logs" (
      "id"        TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      "userId"    TEXT REFERENCES "users"("id"),
      "action"    TEXT NOT NULL,
      "entity"    TEXT NOT NULL,
      "entityId"  TEXT,
      "oldData"   JSONB,
      "newData"   JSONB,
      "ipAddress" TEXT,
      "userAgent" TEXT,
      "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS "audit_logs_userId_idx"          ON "audit_logs"("userId");
    CREATE INDEX IF NOT EXISTS "audit_logs_entity_entityId_idx" ON "audit_logs"("entity","entityId");
  `);

  console.log('✅ Schema applied successfully');
}
