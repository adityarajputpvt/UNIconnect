'use client';

import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import {
  Trophy, Brain, Shield, Users, BarChart3,
  FileText, Scan, Bell, Globe, Zap,
} from 'lucide-react';

const features = [
  {
    icon: Trophy,
    title: 'Achievement Management',
    description: 'Track academic achievements, certifications, internships, hackathons, and more in one organized hub.',
    color: 'from-amber-400 to-orange-500',
    bg: 'bg-amber-50 dark:bg-amber-950/20',
  },
  {
    icon: Scan,
    title: 'Smart OCR Upload',
    description: 'Upload certificates and let AI automatically extract title, issuer, date, and certificate ID.',
    color: 'from-blue-400 to-indigo-600',
    bg: 'bg-blue-50 dark:bg-blue-950/20',
  },
  {
    icon: Brain,
    title: 'Aura AI Assistant',
    description: 'Get personalized career guidance, skill gap analysis, and smart recommendations powered by GPT-4.',
    color: 'from-violet-400 to-purple-600',
    bg: 'bg-violet-50 dark:bg-violet-950/20',
  },
  {
    icon: Shield,
    title: 'Verified Credentials',
    description: 'Faculty-verified achievements build trust with recruiters and institutions.',
    color: 'from-green-400 to-emerald-600',
    bg: 'bg-green-50 dark:bg-green-950/20',
  },
  {
    icon: Globe,
    title: 'Public Portfolio',
    description: 'Generate a shareable, recruiter-ready portfolio page with privacy controls.',
    color: 'from-pink-400 to-rose-600',
    bg: 'bg-pink-50 dark:bg-pink-950/20',
  },
  {
    icon: Users,
    title: 'Community Feed',
    description: 'Connect with peers, share achievements, give kudos, and stay updated on campus events.',
    color: 'from-teal-400 to-cyan-600',
    bg: 'bg-teal-50 dark:bg-teal-950/20',
  },
  {
    icon: BarChart3,
    title: 'Analytics Dashboards',
    description: 'Rich dashboards for students, faculty, and admins with engagement heatmaps and trends.',
    color: 'from-indigo-400 to-blue-600',
    bg: 'bg-indigo-50 dark:bg-indigo-950/20',
  },
  {
    icon: Bell,
    title: 'Real-time Notifications',
    description: 'Instant alerts for verification updates, kudos, recommendations, and events via WebSockets.',
    color: 'from-orange-400 to-red-500',
    bg: 'bg-orange-50 dark:bg-orange-950/20',
  },
  {
    icon: FileText,
    title: 'PDF Export',
    description: 'Download your complete achievement record as a professional PDF resume.',
    color: 'from-slate-400 to-gray-600',
    bg: 'bg-slate-50 dark:bg-slate-950/20',
  },
  {
    icon: Zap,
    title: 'Role-Based Access',
    description: 'Tailored experiences for students, faculty verifiers, department admins, and super admins.',
    color: 'from-yellow-400 to-amber-500',
    bg: 'bg-yellow-50 dark:bg-yellow-950/20',
  },
];

export function FeaturesSection() {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.05 });

  return (
    <section id="features" ref={ref} className="py-24 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-sm font-medium mb-4">
            Everything you need
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold mb-4">
            Built for the modern{' '}
            <span className="gradient-text">university experience</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            From achievement tracking to AI career guidance, Uni-Connect brings together everything students and institutions need.
          </p>
        </motion.div>

        {/* Features grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {features.map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.05 }}
              className={`${feature.bg} rounded-2xl p-6 border border-border card-hover group`}
            >
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 shadow-sm group-hover:scale-110 transition-transform`}>
                <feature.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-semibold text-base mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
