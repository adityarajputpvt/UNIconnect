'use client';

import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { Sparkles, Send } from 'lucide-react';

const chatMessages = [
  { role: 'user', text: 'What skills should I focus on for a software engineering career?' },
  {
    role: 'aura',
    text: "Based on your profile, I'd recommend strengthening your system design knowledge and adding cloud certifications (AWS/GCP). You're missing internship experience — I've found 3 relevant openings that match your skills! 🚀",
  },
  { role: 'user', text: 'Can you suggest some certifications?' },
  {
    role: 'aura',
    text: "Absolutely! Given your Python and ML skills, here are my top picks:\n• Google Professional ML Engineer\n• AWS Machine Learning Specialty\n• TensorFlow Developer Certificate\n\nAll are highly valued by top tech companies. Want me to create a study plan? 📚",
  },
];

export function AuraPreviewSection() {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 });

  return (
    <section id="aura" ref={ref} className="py-24 bg-gradient-to-b from-background to-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left — Chat UI */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="relative"
          >
            <div className="bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">
              {/* Chat header */}
              <div className="bg-gradient-to-r from-violet-600 to-purple-700 p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-white font-bold">Aura</p>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                    <p className="text-white/70 text-xs">AI Career Assistant • Online</p>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="p-4 space-y-4 min-h-[300px]">
                {chatMessages.map((msg, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={inView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.4, delay: 0.3 + i * 0.2 }}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {msg.role === 'aura' && (
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center mr-2 flex-shrink-0 mt-1">
                        <Sparkles className="w-3.5 h-3.5 text-white" />
                      </div>
                    )}
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm whitespace-pre-line ${
                        msg.role === 'user'
                          ? 'bg-gradient-to-br from-indigo-500 to-violet-600 text-white rounded-tr-sm'
                          : 'bg-muted text-foreground rounded-tl-sm'
                      }`}
                    >
                      {msg.text}
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Input */}
              <div className="p-4 border-t border-border">
                <div className="flex items-center gap-2 bg-muted rounded-xl px-4 py-3">
                  <input
                    type="text"
                    placeholder="Ask Aura anything about your career..."
                    className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                    readOnly
                  />
                  <button className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                    <Send className="w-3.5 h-3.5 text-white" />
                  </button>
                </div>
              </div>
            </div>

            {/* Glow */}
            <div className="absolute -inset-4 bg-gradient-to-r from-violet-500/20 to-purple-500/20 rounded-3xl blur-2xl -z-10" />
          </motion.div>

          {/* Right — Description */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-50 dark:bg-violet-950/50 border border-violet-200 dark:border-violet-800 text-violet-700 dark:text-violet-300 text-sm font-medium mb-6">
              <Sparkles className="w-3.5 h-3.5" />
              Meet Aura
            </div>

            <h2 className="text-4xl sm:text-5xl font-bold mb-6">
              Your personal{' '}
              <span className="gradient-text">AI career guide</span>
            </h2>

            <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
              Aura analyzes your profile, achievements, and goals to deliver hyper-personalized
              career guidance — available 24/7.
            </p>

            <div className="space-y-4">
              {[
                { emoji: '🎯', title: 'Skill Gap Detection', desc: 'Identifies missing skills for your target career path' },
                { emoji: '💼', title: 'Internship Matching', desc: 'Finds relevant opportunities based on your profile' },
                { emoji: '📜', title: 'Certification Roadmap', desc: 'Recommends the right certifications in the right order' },
                { emoji: '🏆', title: 'Profile Strength Analysis', desc: 'Scores your profile and suggests improvements' },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 20 }}
                  animate={inView ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 0.4, delay: 0.4 + i * 0.1 }}
                  className="flex items-start gap-4 p-4 rounded-xl bg-card border border-border hover:border-violet-300 dark:hover:border-violet-700 transition-colors"
                >
                  <span className="text-2xl">{item.emoji}</span>
                  <div>
                    <p className="font-semibold text-sm">{item.title}</p>
                    <p className="text-muted-foreground text-sm">{item.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
