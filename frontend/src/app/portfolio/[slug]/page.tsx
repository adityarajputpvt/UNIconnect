import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Globe, Mail, Linkedin, Github, Twitter, MapPin, Award, ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { categoryLabels, categoryIcons, categoryColors, formatDate } from '@/lib/utils';
import { AchievementCategory } from '@/types';

async function getPortfolio(slug: string) {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/profiles/portfolio/${slug}`,
      { next: { revalidate: 60 } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data.data;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const data = await getPortfolio(params.slug);
  if (!data) return { title: 'Portfolio Not Found' };
  const { profile } = data;
  return {
    title: `${profile.firstName} ${profile.lastName} — Uni-Connect Portfolio`,
    description: profile.bio || `View ${profile.firstName}'s verified academic achievements on Uni-Connect.`,
  };
}

export default async function PortfolioPage({ params }: { params: { slug: string } }) {
  const data = await getPortfolio(params.slug);
  if (!data) notFound();

  const { profile, achievements } = data;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:32px_32px]" />
        <div className="relative max-w-4xl mx-auto px-4 py-16">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            {/* Avatar */}
            <div className="w-24 h-24 rounded-2xl bg-white/20 flex items-center justify-center text-4xl font-bold text-white flex-shrink-0 overflow-hidden">
              {profile.avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={profile.avatar} alt={profile.firstName} className="w-full h-full object-cover" />
              ) : (
                `${profile.firstName[0]}${profile.lastName[0]}`
              )}
            </div>

            <div className="text-center sm:text-left">
              <h1 className="text-3xl font-bold text-white mb-1">
                {profile.firstName} {profile.lastName}
              </h1>
              {profile.headline && (
                <p className="text-white/80 text-lg mb-2">{profile.headline}</p>
              )}
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 text-white/70 text-sm">
                {profile.location && (
                  <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{profile.location}</span>
                )}
                {profile.batch && <span>Batch {profile.batch}</span>}
                {profile.cgpa && <span>CGPA: {profile.cgpa}</span>}
              </div>

              {/* Social links */}
              <div className="flex items-center justify-center sm:justify-start gap-3 mt-3">
                {profile.linkedinUrl && (
                  <a href={profile.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-white/70 hover:text-white transition-colors">
                    <Linkedin className="w-5 h-5" />
                  </a>
                )}
                {profile.githubUrl && (
                  <a href={profile.githubUrl} target="_blank" rel="noopener noreferrer" className="text-white/70 hover:text-white transition-colors">
                    <Github className="w-5 h-5" />
                  </a>
                )}
                {profile.twitterUrl && (
                  <a href={profile.twitterUrl} target="_blank" rel="noopener noreferrer" className="text-white/70 hover:text-white transition-colors">
                    <Twitter className="w-5 h-5" />
                  </a>
                )}
                {profile.website && (
                  <a href={profile.website} target="_blank" rel="noopener noreferrer" className="text-white/70 hover:text-white transition-colors">
                    <Globe className="w-5 h-5" />
                  </a>
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="sm:ml-auto flex gap-4">
              <div className="text-center bg-white/10 rounded-xl px-4 py-3">
                <p className="text-2xl font-bold text-white">{achievements.length}</p>
                <p className="text-white/70 text-xs">Achievements</p>
              </div>
              <div className="text-center bg-white/10 rounded-xl px-4 py-3">
                <p className="text-2xl font-bold text-white">{profile.skills?.length || 0}</p>
                <p className="text-white/70 text-xs">Skills</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-10 space-y-8">
        {/* Bio */}
        {profile.bio && (
          <section>
            <h2 className="text-lg font-bold mb-3">About</h2>
            <p className="text-muted-foreground leading-relaxed">{profile.bio}</p>
          </section>
        )}

        {/* Skills */}
        {profile.skills?.length > 0 && (
          <section>
            <h2 className="text-lg font-bold mb-3">Skills</h2>
            <div className="flex flex-wrap gap-2">
              {profile.skills.map((s: { skill: { id: string; name: string }; level?: string }) => (
                <Badge key={s.skill.id} variant="secondary" className="text-sm">
                  {s.skill.name}
                  {s.level && <span className="ml-1 text-muted-foreground text-xs">• {s.level}</span>}
                </Badge>
              ))}
            </div>
          </section>
        )}

        {/* Achievements */}
        {achievements.length > 0 && (
          <section>
            <h2 className="text-lg font-bold mb-4">
              Verified Achievements
              <Badge variant="success" className="ml-2 text-xs">All Verified</Badge>
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {achievements.map((a: {
                id: string;
                title: string;
                category: AchievementCategory;
                issuingAuthority?: string;
                issueDate?: string;
                description?: string;
                credentialUrl?: string;
                tags: Array<{ tag: { id: string; name: string } }>;
              }) => (
                <Card key={a.id} className="overflow-hidden card-hover">
                  <div className={`h-1 w-full bg-gradient-to-r ${getCategoryGradient(a.category)}`} />
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">{categoryIcons[a.category]}</span>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm mb-1">{a.title}</h3>
                        {a.issuingAuthority && (
                          <p className="text-xs text-muted-foreground">{a.issuingAuthority}</p>
                        )}
                        {a.issueDate && (
                          <p className="text-xs text-muted-foreground">{formatDate(a.issueDate)}</p>
                        )}
                        <div className="flex flex-wrap gap-1 mt-2">
                          <Badge className={`text-xs ${categoryColors[a.category]}`}>
                            {categoryLabels[a.category]}
                          </Badge>
                          {a.tags?.slice(0, 2).map((t: { tag: { id: string; name: string } }) => (
                            <Badge key={t.tag.id} variant="outline" className="text-xs">{t.tag.name}</Badge>
                          ))}
                        </div>
                        {a.credentialUrl && (
                          <a href={a.credentialUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-primary hover:underline mt-2">
                            <ExternalLink className="w-3 h-3" />
                            View credential
                          </a>
                        )}
                      </div>
                      <Award className="w-4 h-4 text-green-500 flex-shrink-0" title="Verified" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Footer */}
        <div className="border-t border-border pt-6 text-center">
          <p className="text-muted-foreground text-sm">
            Verified portfolio powered by{' '}
            <a href="/" className="text-indigo-500 font-medium hover:underline">Uni-Connect</a>
          </p>
        </div>
      </div>
    </div>
  );
}

function getCategoryGradient(category: AchievementCategory): string {
  const gradients: Record<AchievementCategory, string> = {
    ACADEMIC: 'from-blue-400 to-indigo-500',
    CERTIFICATION: 'from-purple-400 to-violet-500',
    INTERNSHIP: 'from-green-400 to-emerald-500',
    WORKSHOP: 'from-yellow-400 to-amber-500',
    HACKATHON: 'from-orange-400 to-red-500',
    RESEARCH: 'from-indigo-400 to-blue-500',
    LEADERSHIP: 'from-red-400 to-rose-500',
    CLUB: 'from-pink-400 to-fuchsia-500',
    VOLUNTEERING: 'from-teal-400 to-cyan-500',
    AWARD: 'from-amber-400 to-yellow-500',
    PEER_RECOGNITION: 'from-cyan-400 to-sky-500',
    OTHER: 'from-gray-400 to-slate-500',
  };
  return gradients[category] || 'from-indigo-400 to-violet-500';
}
