import { Request, Response } from 'express';
import OpenAI from 'openai';
import prisma from '../config/prisma';
import { sendSuccess, sendError } from '../utils/apiResponse';
import { config } from '../config/env';
import { logger } from '../utils/logger';

const openai = new OpenAI({ apiKey: config.openai.apiKey });

export const chatWithAura = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user!.userId;
  const { message, conversationHistory = [] } = req.body;

  if (!message) {
    sendError(res, 'Message is required', 400);
    return;
  }

  // Fetch user context for personalized responses
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      profile: {
        include: {
          skills: { include: { skill: true } },
          interests: true,
        },
      },
      achievements: {
        where: { status: 'APPROVED' },
        select: { title: true, category: true, issuingAuthority: true },
        take: 10,
      },
    },
  });

  const profile = user?.profile;
  const skills = profile?.skills.map(s => s.skill.name).join(', ') || 'None listed';
  const interests = profile?.interests.map(i => i.name).join(', ') || 'None listed';
  const achievements = user?.achievements.map(a => `${a.title} (${a.category})`).join(', ') || 'None yet';

  const systemPrompt = `You are Aura, an intelligent AI career and academic assistant for Uni-Connect — a university achievement platform.

Student Context:
- Name: ${profile?.firstName} ${profile?.lastName}
- Skills: ${skills}
- Interests: ${interests}
- Achievements: ${achievements}
- Profile Completion: ${profile?.completionScore || 0}%

Your role is to:
1. Suggest relevant internships, certifications, and career paths based on the student's profile
2. Identify skill gaps and recommend courses/certifications to fill them
3. Recommend clubs, events, and activities that align with their interests
4. Provide career guidance and path recommendations
5. Help students strengthen their academic portfolio
6. Analyze profile strength and suggest improvements

Be encouraging, specific, and actionable. Keep responses concise but helpful. Use emojis sparingly for friendliness.`;

  try {
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory.slice(-10), // Keep last 10 messages for context
      { role: 'user', content: message },
    ];

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      max_tokens: 800,
      temperature: 0.7,
    });

    const reply = completion.choices[0]?.message?.content || 'I apologize, I could not generate a response.';

    sendSuccess(res, { reply, usage: completion.usage }, 'Aura response');
  } catch (error) {
    logger.error('OpenAI API error:', error);
    // Fallback response when API is unavailable
    const fallbackReply = generateFallbackResponse(message, profile?.firstName || 'Student', skills, interests);
    sendSuccess(res, { reply: fallbackReply, fallback: true }, 'Aura response (offline mode)');
  }
};

export const getRecommendations = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user!.userId;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      profile: {
        include: {
          skills: { include: { skill: true } },
          interests: true,
        },
      },
      achievements: {
        where: { status: 'APPROVED' },
        select: { category: true },
      },
    },
  });

  if (!user) {
    sendError(res, 'User not found', 404);
    return;
  }

  const skills = user.profile?.skills.map(s => s.skill.name) || [];
  const interests = user.profile?.interests.map(i => i.name) || [];
  const achievementCategories = user.achievements.map(a => a.category);

  // Generate smart recommendations based on profile
  const recommendations = generateSmartRecommendations(skills, interests, achievementCategories);

  // Save recommendations to DB
  await prisma.recommendation.deleteMany({ where: { userId, isActioned: false } });
  await prisma.recommendation.createMany({
    data: recommendations.map(r => ({ ...r, userId })),
  });

  const saved = await prisma.recommendation.findMany({
    where: { userId },
    orderBy: { relevance: 'desc' },
    take: 10,
  });

  sendSuccess(res, saved, 'Recommendations fetched');
};

export const analyzeProfile = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user!.userId;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      profile: {
        include: {
          skills: { include: { skill: true } },
          interests: true,
        },
      },
      achievements: { where: { status: 'APPROVED' } },
    },
  });

  if (!user) {
    sendError(res, 'User not found', 404);
    return;
  }

  const profile = user.profile;
  const achievements = user.achievements;

  // Analyze profile strength
  const analysis = {
    overallScore: profile?.completionScore || 0,
    strengths: [] as string[],
    gaps: [] as string[],
    suggestions: [] as string[],
    categoryBreakdown: {
      academic: achievements.filter(a => a.category === 'ACADEMIC').length,
      certifications: achievements.filter(a => a.category === 'CERTIFICATION').length,
      internships: achievements.filter(a => a.category === 'INTERNSHIP').length,
      leadership: achievements.filter(a => a.category === 'LEADERSHIP').length,
      clubs: achievements.filter(a => a.category === 'CLUB').length,
    },
  };

  // Identify strengths
  if ((profile?.skills.length || 0) >= 5) analysis.strengths.push('Strong skill portfolio');
  if (achievements.length >= 5) analysis.strengths.push('Active achievement record');
  if (profile?.bio) analysis.strengths.push('Complete profile bio');
  if (profile?.linkedinUrl) analysis.strengths.push('LinkedIn presence');

  // Identify gaps
  if (!profile?.bio) analysis.gaps.push('Missing profile bio');
  if ((profile?.skills.length || 0) < 3) analysis.gaps.push('Limited skills listed');
  if (analysis.categoryBreakdown.certifications === 0) analysis.gaps.push('No certifications');
  if (analysis.categoryBreakdown.internships === 0) analysis.gaps.push('No internship experience');
  if (analysis.categoryBreakdown.leadership === 0) analysis.gaps.push('No leadership activities');
  if (!profile?.linkedinUrl) analysis.gaps.push('No LinkedIn profile linked');

  // Generate suggestions
  if (analysis.categoryBreakdown.certifications === 0) {
    analysis.suggestions.push('Add relevant certifications to boost your profile credibility');
  }
  if (analysis.categoryBreakdown.internships === 0) {
    analysis.suggestions.push('Apply for internships to gain practical experience');
  }
  if (analysis.categoryBreakdown.leadership === 0) {
    analysis.suggestions.push('Join student clubs or take on leadership roles');
  }
  if ((profile?.completionScore || 0) < 70) {
    analysis.suggestions.push('Complete your profile to improve visibility to recruiters');
  }

  sendSuccess(res, analysis, 'Profile analysis complete');
};

// Fallback response generator (when OpenAI is unavailable)
function generateFallbackResponse(message: string, name: string, skills: string, interests: string): string {
  const lowerMsg = message.toLowerCase();

  if (lowerMsg.includes('internship')) {
    return `Hi ${name}! Based on your skills (${skills}), I'd recommend exploring internships on platforms like LinkedIn, Internshala, and AngelList. Focus on roles that align with your technical background. Would you like specific recommendations?`;
  }
  if (lowerMsg.includes('certification') || lowerMsg.includes('course')) {
    return `Great question, ${name}! For certifications, consider platforms like Coursera, edX, or Google's free certifications. Based on your interests (${interests}), there are many relevant options available. What specific area would you like to focus on?`;
  }
  if (lowerMsg.includes('career') || lowerMsg.includes('path')) {
    return `${name}, career planning is crucial! Based on your profile, I can see you have a strong foundation. Consider mapping out a 2-year plan with specific milestones. Would you like help creating a career roadmap?`;
  }
  if (lowerMsg.includes('skill') || lowerMsg.includes('learn')) {
    return `To strengthen your profile, ${name}, I recommend focusing on in-demand skills in your field. Your current skills (${skills}) are a great start. Consider adding complementary skills to make yourself more versatile.`;
  }

  return `Hello ${name}! I'm Aura, your AI career assistant. I can help you with career guidance, skill recommendations, internship suggestions, and profile optimization. What would you like to explore today?`;
}

// Smart recommendation generator
function generateSmartRecommendations(
  skills: string[],
  interests: string[],
  achievementCategories: string[]
): Array<{ type: string; title: string; description: string; url?: string; relevance: number }> {
  const recommendations = [];

  // Certification recommendations based on skills
  if (skills.some(s => ['javascript', 'react', 'node'].includes(s.toLowerCase()))) {
    recommendations.push({
      type: 'certification',
      title: 'Meta Front-End Developer Certificate',
      description: 'Advance your web development skills with this industry-recognized certification from Meta.',
      url: 'https://www.coursera.org/professional-certificates/meta-front-end-developer',
      relevance: 0.95,
    });
  }

  if (skills.some(s => ['python', 'data', 'ml', 'ai'].includes(s.toLowerCase()))) {
    recommendations.push({
      type: 'certification',
      title: 'Google Data Analytics Certificate',
      description: 'Build job-ready skills in data analytics with this Google certification.',
      url: 'https://www.coursera.org/professional-certificates/google-data-analytics',
      relevance: 0.92,
    });
  }

  // Club recommendations if no leadership
  if (!achievementCategories.includes('LEADERSHIP') && !achievementCategories.includes('CLUB')) {
    recommendations.push({
      type: 'club',
      title: 'Join a Technical Club',
      description: 'Participating in technical clubs builds leadership skills and expands your network. Look for coding clubs, robotics teams, or entrepreneurship cells.',
      relevance: 0.88,
    });
  }

  // Internship recommendation
  if (!achievementCategories.includes('INTERNSHIP')) {
    recommendations.push({
      type: 'internship',
      title: 'Apply for Summer Internships',
      description: 'Gain practical experience through internships. Platforms like LinkedIn, Internshala, and company career pages are great starting points.',
      url: 'https://www.linkedin.com/jobs/internship-jobs/',
      relevance: 0.90,
    });
  }

  // Career path recommendation
  recommendations.push({
    type: 'career',
    title: 'Explore Career Paths',
    description: 'Based on your profile, consider exploring roles in software development, data science, or product management. Each path has unique growth opportunities.',
    relevance: 0.75,
  });

  return recommendations;
}
