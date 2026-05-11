'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, Play, Star, Users, Award, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';

const floatingCards = [
  { icon: '🏆', label: 'Achievement Verified', sub: 'Hackathon Winner', color: 'from-amber-400 to-orange-500', delay: 0 },
  { icon: '🤖', label: 'Aura AI', sub: 'Skill gap detected', color: 'from-violet-400 to-purple-600', delay: 0.2 },
  { icon: '📜', label: 'Certificate Added', sub: 'AWS Cloud Practitioner', color: 'from-blue-400 to-indigo-600', delay: 0.4 },
  { icon: '⭐', label: 'Kudos Received', sub: 'Leadership excellence', color: 'from-pink-400 to-rose-600', delay: 0.6 },
];

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
      {/* Animated background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-violet-500/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-radial from-indigo-500/5 to-transparent rounded-full" />
        {/* Grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px]" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left content */}
          <div>
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-sm font-medium mb-6"
            >
              <Star className="w-3.5 h-3.5 fill-current" />
              AI-Powered University Ecosystem
            </motion.div>

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-5xl sm:text-6xl lg:text-7xl font-bold leading-tight mb-6"
            >
              Your Complete{' '}
              <span className="gradient-text">Student Journey</span>{' '}
              in One Platform
            </motion.h1>

            {/* Subheadline */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-xl text-muted-foreground leading-relaxed mb-8 max-w-lg"
            >
              Manage achievements, build verified portfolios, get AI career guidance, and connect with your university community — all in one place.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-wrap gap-4 mb-12"
            >
              <Link href="/register">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white border-0 shadow-glow-sm hover:shadow-glow-md transition-all gap-2 text-base px-8"
                >
                  Start for Free
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="gap-2 text-base px-8">
                <Play className="w-4 h-4 fill-current" />
                Watch Demo
              </Button>
            </motion.div>

            {/* Social proof */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="flex flex-wrap items-center gap-6"
            >
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2">
                  {['🧑‍🎓', '👩‍💻', '🧑‍🔬', '👩‍🎨'].map((emoji, i) => (
                    <div key={i} className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-sm border-2 border-background">
                      {emoji}
                    </div>
                  ))}
                </div>
                <span className="text-sm text-muted-foreground">
                  <strong className="text-foreground">10,000+</strong> students
                </span>
              </div>
              <div className="flex items-center gap-1">
                {[1,2,3,4,5].map(i => (
                  <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                ))}
                <span className="text-sm text-muted-foreground ml-1">4.9/5 rating</span>
              </div>
            </motion.div>
          </div>

          {/* Right — Dashboard mockup */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="relative hidden lg:block"
          >
            {/* Main dashboard card */}
            <div className="relative bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">
              {/* Dashboard header */}
              <div className="bg-gradient-to-r from-indigo-500 to-violet-600 p-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white text-sm font-bold">A</div>
                  <div>
                    <p className="text-white font-semibold text-sm">Arjun Sharma</p>
                    <p className="text-white/70 text-xs">Computer Science • 3rd Year</p>
                  </div>
                  <div className="ml-auto bg-white/20 rounded-full px-3 py-1 text-white text-xs font-medium">
                    85% Complete
                  </div>
                </div>
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-3 gap-0 border-b border-border">
                {[
                  { icon: Award, label: 'Achievements', value: '24', color: 'text-indigo-500' },
                  { icon: Users, label: 'Connections', value: '156', color: 'text-violet-500' },
                  { icon: TrendingUp, label: 'Profile Score', value: '92', color: 'text-pink-500' },
                ].map((stat, i) => (
                  <div key={i} className={`p-4 text-center ${i < 2 ? 'border-r border-border' : ''}`}>
                    <stat.icon className={`w-5 h-5 ${stat.color} mx-auto mb-1`} />
                    <p className="font-bold text-lg">{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                  </div>
                ))}
              </div>

              {/* Recent achievements */}
              <div className="p-4 space-y-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Recent Achievements</p>
                {[
                  { emoji: '🏆', title: 'Smart India Hackathon', status: 'Approved', color: 'text-green-500' },
                  { emoji: '📜', title: 'AWS Cloud Practitioner', status: 'Under Review', color: 'text-blue-500' },
                  { emoji: '💼', title: 'Google Summer Internship', status: 'Approved', color: 'text-green-500' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                    <span className="text-xl">{item.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.title}</p>
                    </div>
                    <span className={`text-xs font-medium ${item.color}`}>{item.status}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Floating notification cards */}
            {floatingCards.map((card, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.5 + card.delay }}
                className={`absolute ${
                  i === 0 ? '-top-4 -left-8' :
                  i === 1 ? '-top-4 -right-8' :
                  i === 2 ? '-bottom-4 -left-8' :
                  '-bottom-4 -right-8'
                } bg-card border border-border rounded-xl shadow-lg p-3 flex items-center gap-2 min-w-[160px]`}
                style={{ animation: `float ${3 + i * 0.5}s ease-in-out infinite`, animationDelay: `${i * 0.5}s` }}
              >
                <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${card.color} flex items-center justify-center text-sm`}>
                  {card.icon}
                </div>
                <div>
                  <p className="text-xs font-semibold">{card.label}</p>
                  <p className="text-xs text-muted-foreground">{card.sub}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
