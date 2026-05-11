'use client';

import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { UserPlus, Upload, CheckCircle, Share2 } from 'lucide-react';

const steps = [
  {
    icon: UserPlus,
    step: '01',
    title: 'Create Your Profile',
    description: 'Sign up and build your academic identity — add skills, interests, bio, and social links.',
    color: 'from-indigo-500 to-blue-600',
  },
  {
    icon: Upload,
    step: '02',
    title: 'Add Achievements',
    description: 'Upload certificates with smart OCR auto-fill, or manually add internships, hackathons, and more.',
    color: 'from-violet-500 to-purple-600',
  },
  {
    icon: CheckCircle,
    step: '03',
    title: 'Get Verified',
    description: 'Submit for faculty verification. Track status in real-time and receive instant notifications.',
    color: 'from-pink-500 to-rose-600',
  },
  {
    icon: Share2,
    step: '04',
    title: 'Share & Grow',
    description: 'Share your verified portfolio with recruiters, get AI career guidance, and connect with peers.',
    color: 'from-amber-500 to-orange-600',
  },
];

export function HowItWorksSection() {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 });

  return (
    <section id="how-it-works" ref={ref} className="py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-50 dark:bg-violet-950/50 border border-violet-200 dark:border-violet-800 text-violet-700 dark:text-violet-300 text-sm font-medium mb-4">
            Simple workflow
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold mb-4">
            Get started in <span className="gradient-text">4 simple steps</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            From signup to a verified, shareable portfolio — the whole journey takes minutes.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 relative">
          {/* Connector line */}
          <div className="hidden lg:block absolute top-16 left-[12.5%] right-[12.5%] h-0.5 bg-gradient-to-r from-indigo-500 via-violet-500 to-amber-500 opacity-30" />

          {steps.map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.15 }}
              className="relative text-center group"
            >
              {/* Step number + icon */}
              <div className="relative inline-flex mb-6">
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                  <step.icon className="w-7 h-7 text-white" />
                </div>
                <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-background border-2 border-border flex items-center justify-center text-xs font-bold text-muted-foreground">
                  {step.step}
                </div>
              </div>

              <h3 className="font-bold text-lg mb-3">{step.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{step.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
