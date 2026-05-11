'use client';

import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { Star, Quote } from 'lucide-react';

const testimonials = [
  {
    name: 'Riya Verma',
    role: 'CSE Student, AKTU Lucknow',
    avatar: '👩‍💻',
    rating: 5,
    text: 'Uni-Connect made managing my certificates and internships so easy. The OCR upload is a game changer — I just photograph my certificate and everything fills in automatically!',
    highlight: 'Saved hours of manual entry',
  },
  {
    name: 'Dr. Suresh Pandey',
    role: 'Professor, HBTU Kanpur',
    avatar: '👨‍🏫',
    rating: 5,
    text: 'As a faculty verifier, the dashboard is incredibly efficient. I can review, approve or request resubmission with remarks in seconds. The audit trail is exactly what we needed for accreditation.',
    highlight: '10x faster verification',
  },
  {
    name: 'Mohit Agarwal',
    role: 'Final Year, IET Lucknow',
    avatar: '🧑‍💼',
    rating: 5,
    text: 'My public portfolio on Uni-Connect got noticed by two recruiters within days of going live. The verified credentials gave them real confidence in my profile.',
    highlight: '2 recruiter contacts in 3 days',
  },
  {
    name: 'Priya Tiwari',
    role: 'B.Tech CSE, MMMUT Gorakhpur',
    avatar: '👩‍🔬',
    rating: 5,
    text: "Aura identified that I was missing cloud certifications for my target role. I followed the roadmap and got AWS certified in 6 weeks. The AI guidance is genuinely useful and personalized.",
    highlight: 'AWS certified in 6 weeks',
  },
  {
    name: 'Prof. Anjali Srivastava',
    role: 'HOD Computer Science, KNIT Sultanpur',
    avatar: '👩‍🏫',
    rating: 5,
    text: 'The admin analytics dashboard gives us real-time insights into student engagement and achievement trends across departments. It has become essential for our NAAC accreditation reports.',
    highlight: 'Streamlined NAAC accreditation',
  },
  {
    name: 'Deepak Yadav',
    role: 'Final Year, GCET Greater Noida',
    avatar: '🧑‍🎓',
    rating: 5,
    text: 'The community feed and kudos system made our campus feel more connected. I love celebrating my peers\' achievements and getting recognized for my own work publicly.',
    highlight: 'Stronger campus community',
  },
];

export function TestimonialsSection() {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.05 });

  return (
    <section id="testimonials" ref={ref} className="py-24 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 text-sm font-medium mb-4">
            <Star className="w-3.5 h-3.5 fill-current" />
            Loved by students & faculty
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold mb-4">
            Real stories from <span className="gradient-text">real users</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Join thousands of students and educators who have transformed their university experience.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="bg-card border border-border rounded-2xl p-6 card-hover relative overflow-hidden"
            >
              {/* Quote icon */}
              <Quote className="absolute top-4 right-4 w-8 h-8 text-muted/30" />

              {/* Stars */}
              <div className="flex gap-1 mb-4">
                {Array.from({ length: t.rating }).map((_, j) => (
                  <Star key={j} className="w-4 h-4 fill-amber-400 text-amber-400" />
                ))}
              </div>

              {/* Highlight badge */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 text-xs font-medium mb-3">
                ✨ {t.highlight}
              </div>

              {/* Text */}
              <p className="text-muted-foreground text-sm leading-relaxed mb-6">"{t.text}"</p>

              {/* Author */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-xl">
                  {t.avatar}
                </div>
                <div>
                  <p className="font-semibold text-sm">{t.name}</p>
                  <p className="text-muted-foreground text-xs">{t.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
