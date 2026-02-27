'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { BrutalCard, BrutalButton } from '@/components/ui';
import { Microscope, Database, FileText, ArrowRight, TrendingUp, LogOut } from 'lucide-react';
import { auth, googleProvider } from '@/lib/firebase';
import { signInWithRedirect, getRedirectResult, signOut, User } from 'firebase/auth';
import { isAdmin, isAuthorizedViewer } from '@/lib/stakeholderApproval';

export default function Home() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Handle redirect result from Google sign-in
    const handleRedirectResult = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result && result.user) {
          const userEmail = result.user.email;

          // Redirect based on role
          if (isAdmin(userEmail)) {
            router.push('/admin');
          } else if (isAuthorizedViewer(userEmail)) {
            router.push('/stakeholders');
          } else {
            await signOut(auth);
            alert('Access denied. Only @alpha.school emails are authorized.');
          }
        }
      } catch (error) {
        console.error('Redirect result error:', error);
      }
    };

    handleRedirectResult();

    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [router]);

  const handleGoogleSignIn = async () => {
    try {
      await signInWithRedirect(auth, googleProvider);
    } catch (error) {
      console.error('Sign in error:', error);
      alert('Failed to sign in. Please try again.');
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const handleAccessPortal = () => {
    if (user) {
      // User is signed in, redirect based on role
      if (isAdmin(user.email)) {
        router.push('/admin');
      } else if (isAuthorizedViewer(user.email)) {
        router.push('/stakeholders');
      }
    } else {
      // Not signed in, trigger Google sign in
      handleGoogleSignIn();
    }
  };

  return (
    <div className="min-h-screen bg-bg-light">
      {/* Header */}
      <header className="border-b-4 border-dark bg-white p-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-dark">Alpha Math Research Hub</h1>
            <p className="text-sm text-dark/70">AI-Powered Learning Pattern Analysis</p>
          </div>
          <div className="flex items-center gap-4">
            {loading ? (
              <div className="text-dark/60 text-sm">Loading...</div>
            ) : user ? (
              <>
                <div className="text-right">
                  <p className="text-sm font-medium text-dark">{user.displayName || 'User'}</p>
                  <p className="text-xs text-dark/70">{user.email}</p>
                </div>
                <BrutalButton onClick={handleAccessPortal} variant="primary">
                  {isAdmin(user.email) ? 'Admin Panel' : 'View Reports'}
                </BrutalButton>
                <BrutalButton onClick={handleSignOut} variant="secondary" className="gap-2">
                  <LogOut size={16} />
                  Sign Out
                </BrutalButton>
              </>
            ) : (
              <BrutalButton onClick={handleGoogleSignIn} variant="primary" className="gap-2">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Sign in with Google
              </BrutalButton>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-6xl mx-auto px-6 py-16">
        <div className="mb-16">
          <div className="inline-block px-4 py-2 border-4 border-dark bg-cool-blue text-dark font-bold mb-6">
            📈 Accelerating Math Mastery 2x Through Data-Driven Insights
          </div>
          <h2 className="text-5xl font-bold text-dark mb-6">
            Transform Math Education Through AI-Powered Research
          </h2>
          <p className="text-xl text-dark/70 font-serif mb-4">
            Uncover hidden patterns in student learning data, design adaptive pathways, and make
            evidence-based pedagogical decisions that accelerate concept mastery across K-12 mathematics.
          </p>
          <p className="text-lg text-dark/60 font-serif">
            Built for Alpha School by Sebastian Sarmiento • HS Math DRI
          </p>
        </div>

        {/* Research Process Flow */}
        <div className="mb-12 p-6 border-4 border-dark bg-white">
          <h3 className="text-2xl font-bold text-dark mb-6 text-center">Research-First Workflow</h3>
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex-1 text-center">
              <div className="w-16 h-16 mx-auto mb-3 flex items-center justify-center border-4 border-dark bg-cool-blue">
                <Microscope size={32} />
              </div>
              <h4 className="font-bold text-dark mb-1">1. Investigate</h4>
              <p className="text-sm text-dark/60">Analyze learning patterns with AI</p>
            </div>
            <ArrowRight size={32} className="text-dark/40 hidden md:block" />
            <div className="flex-1 text-center">
              <div className="w-16 h-16 mx-auto mb-3 flex items-center justify-center border-4 border-dark bg-cool-blue">
                <FileText size={32} />
              </div>
              <h4 className="font-bold text-dark mb-1">2. Document</h4>
              <p className="text-sm text-dark/60">Create immersive evidence reports</p>
            </div>
            <ArrowRight size={32} className="text-dark/40 hidden md:block" />
            <div className="flex-1 text-center">
              <div className="w-16 h-16 mx-auto mb-3 flex items-center justify-center border-4 border-dark bg-cool-blue">
                <Database size={32} />
              </div>
              <h4 className="font-bold text-dark mb-1">3. Decide</h4>
              <p className="text-sm text-dark/60">Make data-backed decisions</p>
            </div>
            <ArrowRight size={32} className="text-dark/40 hidden md:block" />
            <div className="flex-1 text-center">
              <div className="w-16 h-16 mx-auto mb-3 flex items-center justify-center border-4 border-dark bg-alert-orange">
                <TrendingUp size={32} />
              </div>
              <h4 className="font-bold text-dark mb-1">4. Impact</h4>
              <p className="text-sm text-dark/60">Track 2x mastery acceleration</p>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <BrutalCard hoverable>
            <Microscope size={40} className="text-cool-blue mb-4" />
            <h3 className="text-xl font-bold text-dark mb-3">Research Repository</h3>
            <p className="text-dark/70 font-serif mb-4">
              Document learning pattern analysis, content development strategies, and AI-powered
              adaptive pathways with measurable impact metrics.
            </p>
            <button
              onClick={handleAccessPortal}
              className="inline-flex items-center gap-2 text-cool-blue font-bold hover:underline"
            >
              Explore Investigations <ArrowRight size={16} />
            </button>
          </BrutalCard>

          <BrutalCard hoverable>
            <Database size={40} className="text-cool-blue mb-4" />
            <h3 className="text-xl font-bold text-dark mb-3">Decision Logs</h3>
            <p className="text-dark/70 font-serif mb-4">
              Link pedagogical decisions to research findings. Track adjustments, validate
              hypotheses, and document the evolution of instructional strategies.
            </p>
            <button
              onClick={handleAccessPortal}
              className="inline-flex items-center gap-2 text-cool-blue font-bold hover:underline"
            >
              View Decisions <ArrowRight size={16} />
            </button>
          </BrutalCard>

          <BrutalCard hoverable>
            <FileText size={40} className="text-cool-blue mb-4" />
            <h3 className="text-xl font-bold text-dark mb-3">Evidence Reports</h3>
            <p className="text-dark/70 font-serif mb-4">
              Interactive scrollytelling narratives that transform complex data analysis
              into compelling visual stories for stakeholders.
            </p>
            <button
              onClick={handleAccessPortal}
              className="inline-flex items-center gap-2 text-cool-blue font-bold hover:underline"
            >
              Browse Reports <ArrowRight size={16} />
            </button>
          </BrutalCard>
        </div>

        {/* Impact Highlight */}
        <BrutalCard className="bg-alert-orange mb-12">
          <div className="text-center">
            <TrendingUp size={48} className="mx-auto mb-4" />
            <h3 className="text-3xl font-bold text-dark mb-2">
              Measurable Impact
            </h3>
            <p className="text-xl text-dark/80 font-serif">
              Our data-driven approach has demonstrated <strong>2x acceleration</strong> in concept mastery
              across multiple mathematical domains and grade levels.
            </p>
          </div>
        </BrutalCard>

        {/* CTA Section */}
        <BrutalCard className="bg-cool-blue">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-2xl font-bold text-dark mb-2">
                Ready to Accelerate Learning?
              </h3>
              <p className="text-dark/80 font-serif">
                Start documenting investigations, uploading evidence, and making data-backed decisions.
              </p>
            </div>
            <BrutalButton onClick={handleAccessPortal} variant="secondary" className="bg-white whitespace-nowrap">
              {user ? (isAdmin(user.email) ? 'Access Admin Panel' : 'View Reports') : 'Sign In to Access'} <ArrowRight size={20} className="inline ml-2" />
            </BrutalButton>
          </div>
        </BrutalCard>

        {/* Info Section */}
        <div className="mt-12 pt-12 border-t-4 border-dark">
          <h3 className="text-2xl font-bold text-dark mb-4">About This Hub</h3>
          <div className="font-serif text-dark/80 space-y-3">
            <p>
              The Alpha Math Research Hub is a specialized platform for documenting and analyzing
              pedagogical innovations in mathematics education. Leveraging AI and advanced data analysis,
              we uncover learning patterns, design adaptive content, and validate instructional strategies
              that demonstrably accelerate student mastery.
            </p>
            <p>
              Built on a <strong>Research-First Architecture</strong>, every pedagogical decision is
              grounded in evidence, tracked over time, and continuously refined based on measurable outcomes.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 pt-6 border-t-4 border-dark text-center">
          <p className="text-sm font-bold text-dark/70">
            Alpha School • High School Mathematics • Sebastian Sarmiento, DRI
          </p>
          <p className="text-xs text-dark/50 mt-2">
            Powered by AI-driven learning pattern analysis and evidence-based pedagogy
          </p>
        </div>
      </main>
    </div>
  );
}
