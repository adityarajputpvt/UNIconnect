'use client';

import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const faqs = [
  {
    q: 'Is Uni-Connect free for students?',
    a: 'Yes! The core features — profile, achievement tracking, portfolio, and community — are completely free for students. Premium features like advanced AI recommendations and PDF exports are available on the Pro plan.',
  },
  {
    q: 'How does the OCR certificate upload work?',
    a: 'When you upload a certificate image, our AI (powered by Tesseract.js) automatically extracts the title, issuer, date, and certificate ID. You can review and edit the extracted data before saving — it saves significant time compared to manual entry.',
  },
  {
    q: 'How are achievements verified?',
    a: 'Students submit achievements for review. Faculty verifiers and department admins can approve, reject, or request resubmission with remarks. The entire workflow is tracked with timestamps and audit logs.',
  },
  {
    q: 'Can I control who sees my portfolio?',
    a: 'Absolutely. You have full privacy controls — toggle your portfolio public or private, choose which achievements to show, and control visibility per achievement. Your portfolio URL is shareable only when you make it public.',
  },
  {
    q: 'What AI model powers Aura?',
    a: 'Aura is powered by OpenAI GPT-4o-mini, with your profile context (skills, interests, achievements) injected into every conversation for personalized responses. It works in offline mode with smart fallback responses when the API is unavailable.',
  },
  {
    q: 'Can universities integrate Uni-Connect with their existing ERP?',
    a: 'Yes. Uni-Connect provides REST APIs and webhook support for integration with existing student information systems, LMS platforms, and ERP systems. Contact us for enterprise integration options.',
  },
  {
    q: 'Is student data secure?',
    a: 'Security is a top priority. We use bcrypt password hashing, JWT with refresh token rotation, rate limiting, RBAC middleware, input sanitization, and CORS protection. All files are stored securely on Cloudinary.',
  },
  {
    q: 'How do I get my university onboarded?',
    a: 'Reach out through our contact form or email us at partnerships@uniconnect.edu. We offer a free pilot program for universities with dedicated onboarding support.',
  },
];

function FAQItem({ q, a, index }: { q: string; a: string; index: number }) {
  const [open, setOpen] = useState(false);
  const { ref, inView } = useInView({ triggerOnce: true });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 15 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      className="border border-border rounded-xl overflow-hidden"
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-5 text-left hover:bg-muted/50 transition-colors"
      >
        <span className="font-semibold text-sm pr-4">{q}</span>
        <ChevronDown
          className={`w-5 h-5 text-muted-foreground flex-shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && (
        <div className="px-5 pb-5">
          <p className="text-muted-foreground text-sm leading-relaxed">{a}</p>
        </div>
      )}
    </motion.div>
  );
}

export function FAQSection() {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 });

  return (
    <section id="faq" ref={ref} className="py-24">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          className="text-center mb-12"
        >
          <h2 className="text-4xl sm:text-5xl font-bold mb-4">
            Frequently asked <span className="gradient-text">questions</span>
          </h2>
          <p className="text-xl text-muted-foreground">
            Everything you need to know about Uni-Connect.
          </p>
        </motion.div>

        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <FAQItem key={i} q={faq.q} a={faq.a} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
