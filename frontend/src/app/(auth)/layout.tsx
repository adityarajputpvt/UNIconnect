import Link from 'next/link';
import { Sparkles } from 'lucide-react';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left — Branding panel */}
      <div className="hidden lg:flex flex-col bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 relative overflow-hidden">
        {/* Grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:32px_32px]" />
        {/* Blobs */}
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-white/10 rounded-full blur-3xl" />

        <div className="relative flex flex-col h-full p-12">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl text-white">Uni-Connect</span>
          </Link>

          {/* Center content */}
          <div className="flex-1 flex flex-col justify-center">
            <h1 className="text-4xl font-bold text-white mb-4 leading-tight">
              Your complete student journey starts here
            </h1>
            <p className="text-white/70 text-lg leading-relaxed mb-8">
              Track achievements, get AI career guidance, build verified portfolios, and connect with your university community.
            </p>

            {/* Feature list */}
            <div className="space-y-3">
              {[
                '🏆 Verified achievement tracking',
                '🤖 Aura AI career assistant',
                '📜 Smart OCR certificate upload',
                '🌐 Shareable public portfolio',
                '📊 Real-time analytics dashboard',
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 text-white/80 text-sm">
                  <div className="w-1.5 h-1.5 rounded-full bg-white/60" />
                  {item}
                </div>
              ))}
            </div>
          </div>

          {/* Bottom quote */}
          <div className="border-t border-white/20 pt-6">
            <p className="text-white/60 text-sm italic">
              "Uni-Connect helped me land my dream job by showcasing my verified achievements."
            </p>
            <p className="text-white/80 text-sm font-medium mt-2">— Priya Sharma, Google SWE</p>
          </div>
        </div>
      </div>

      {/* Right — Form */}
      <div className="flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg gradient-text-brand">Uni-Connect</span>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
