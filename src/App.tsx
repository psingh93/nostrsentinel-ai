import React, { useState, useEffect } from 'react';
import { SecurityProvider } from './context/SecurityContext.tsx';
import { ToastProvider } from './context/ToastContext.tsx';
import { Navbar } from './components/Navbar.tsx';
import { LandingPage } from './pages/LandingPage.tsx';
import { DashboardPage } from './pages/DashboardPage.tsx';
import { AnalyzePage } from './pages/AnalyzePage.tsx';
import { ThreatsPage } from './pages/ThreatsPage.tsx';
import { RelaysPage } from './pages/RelaysPage.tsx';
import { SettingsPage } from './pages/SettingsPage.tsx';
import { Shield, Github, Heart, Radio } from 'lucide-react';

export default function App() {
  const [currentPath, setCurrentPath] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname;
      if (['/', '/dashboard', '/analyze', '/threats', '/relays', '/settings'].includes(path)) {
        return path;
      }
    }
    return '/';
  });

  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      if (['/', '/dashboard', '/analyze', '/threats', '/relays', '/settings'].includes(path)) {
        setCurrentPath(path);
      } else {
        setCurrentPath('/');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (path: string) => {
    try {
      window.history.pushState({}, '', path);
    } catch {}
    setCurrentPath(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderCurrentPage = () => {
    switch (currentPath) {
      case '/dashboard':
        return <DashboardPage navigate={navigate} />;
      case '/analyze':
        return <AnalyzePage />;
      case '/threats':
        return <ThreatsPage navigate={navigate} />;
      case '/relays':
        return <RelaysPage navigate={navigate} />;
      case '/settings':
        return <SettingsPage />;
      case '/':
      default:
        return <LandingPage navigate={navigate} />;
    }
  };

  return (
    <SecurityProvider>
      <ToastProvider>
        <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-black">
          {/* Top Navbar */}
          <Navbar currentPath={currentPath} navigate={navigate} />

          {/* Main Content Area */}
          <main className="flex-1">
            {renderCurrentPage()}
          </main>

          {/* Footer */}
          <footer className="border-t border-cyan-950/60 bg-[#070a12] py-8 text-xs text-slate-500 font-mono">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-cyan-400" />
                <span className="font-semibold text-slate-300">NostrSentinel AI</span>
                <span>• Autonomous Nostr Protocol Security</span>
              </div>

              <div className="flex items-center gap-6 text-[11px]">
                <button
                  onClick={() => navigate('/settings')}
                  className="hover:text-cyan-300 transition"
                >
                  Privacy & Key Policy
                </button>
                <button
                  onClick={() => navigate('/relays')}
                  className="hover:text-cyan-300 transition"
                >
                  Relay Mesh
                </button>
                <span className="text-slate-600">NIP-01 • NIP-07 • NIP-19</span>
              </div>
            </div>
          </footer>
        </div>
      </ToastProvider>
    </SecurityProvider>
  );
}
