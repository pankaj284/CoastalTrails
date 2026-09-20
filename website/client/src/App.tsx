import { lazy, Suspense, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Routes, Route, useNavigate, Navigate, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import { Lock } from 'lucide-react';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { AuthModal } from './components/AuthModal';
import { AssistantChat } from './components/AssistantChat';
import { Button } from './components/ui/Button';
import type { CommandItem } from './components/ui/CommandPalette';
import { TideLine } from './components/ui/TideLine';
import { GrainOverlay } from './components/ui/GrainOverlay';
import { ClickSpark } from './components/ui/ClickSpark';
import { Skeleton } from './components/ui/Skeleton';
import { easeOut } from './lib/motion';
import type { Homestay, User } from './types';
import { api } from './services/api';

const ExplorePage = lazy(() => import('./pages/ExplorePage').then((m) => ({ default: m.ExplorePage })));
const StayDetailPage = lazy(() => import('./pages/StayDetailPage').then((m) => ({ default: m.StayDetailPage })));
const RouteNavigatorPage = lazy(() => import('./pages/RouteNavigatorPage').then((m) => ({ default: m.RouteNavigatorPage })));
const ReservationStatusPage = lazy(() => import('./pages/ReservationStatusPage').then((m) => ({ default: m.ReservationStatusPage })));
const DatabaseStudioPage = lazy(() => import('./pages/DatabaseStudioPage').then((m) => ({ default: m.DatabaseStudioPage })));
const SurveyWorkspacePage = lazy(() => import('./survey/SurveyWorkspacePage').then((m) => ({ default: m.SurveyWorkspacePage })));
const BookingPage = lazy(() => import('./pages/BookingPage').then((m) => ({ default: m.BookingPage })));
const CommandPalette = lazy(() => import('./components/ui/CommandPalette').then((m) => ({ default: m.CommandPalette })));

function PageFallback() {
  return (
    <div className="min-h-[calc(100dvh-10rem)] space-y-6">
      <Skeleton className="h-72 w-full rounded-3xl" />
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Skeleton className="h-64 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    </div>
  );
}

function RequireAuth({
  user,
  onRequireAuth,
  onExplore,
  children,
}: {
  user: User | null;
  onRequireAuth: () => void;
  onExplore: () => void;
  children: ReactNode;
}) {
  if (user) return <>{children}</>;
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center rounded-3xl border border-line bg-elevated px-8 py-16 text-center">
      <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-tide-glow/15 text-tide">
        <Lock className="h-6 w-6" />
      </div>
      <p className="overline mb-2">Members only</p>
      <h1 className="font-display text-2xl font-semibold tracking-tight text-ink">Sign in to view bookings</h1>
      <p className="mt-2 max-w-sm text-sm text-ink-2">Your reservations, vouchers and holds are visible only after you sign in.</p>
      <Button className="mt-6" onClick={onRequireAuth}>
        Sign in to continue
      </Button>
      <button onClick={onExplore} className="mt-3 text-xs font-semibold text-tide hover:underline">
        Explore stays instead
      </button>
    </div>
  );
}

export function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const [homestays, setHomestays] = useState<Homestay[]>([]);
  const [selectedStay, setSelectedStay] = useState<Homestay | null>(null);
  const [recentRefCode, setRecentRefCode] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'register'>('signin');
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);

  const fetchStays = async (beach?: string, search?: string, checkIn?: string, checkOut?: string) => {
    try {
      setLoading(true);
      const data = await api.getHomestays({ location: beach, search, checkIn, checkOut });
      setHomestays(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStays();
    try {
      const savedUser = localStorage.getItem('gokarna_traveler_user');
      if (savedUser) setCurrentUser(JSON.parse(savedUser));
    } catch (e) {
      console.warn('Failed to parse saved user:', e);
    }
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsPaletteOpen((p) => !p);
      }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  const commandItems = useMemo<CommandItem[]>(
    () => [
      { id: 'home', group: 'Navigate', label: 'Explore homestays', hint: '/', onSelect: () => navigate('/') },
      { id: 'trails', group: 'Navigate', label: 'Cliff trails & ferry', hint: '/trails', onSelect: () => navigate('/trails') },
      { id: 'bookings', group: 'Navigate', label: 'Track bookings', hint: '/bookings', onSelect: () => navigate('/bookings') },
      { id: 'database', group: 'Tools', label: 'Database studio', hint: '/database', onSelect: () => navigate('/database') },
      { id: 'survey', group: 'Tools', label: 'Field survey', hint: '/survey', onSelect: () => navigate('/survey') },
    ],
    [navigate],
  );

  const handleSelectStay = (stay: Homestay) => {
    setSelectedStay(stay);
    navigate(`/stay/${stay.id}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBookStay = (stay: Homestay) => {
    navigate(`/book/${stay.id}`);
  };

  return (
    <div className="flex min-h-dvh flex-col bg-paper text-ink">
      <TideLine />
      <GrainOverlay />
      <ClickSpark />

      <Navbar
        currentUser={currentUser}
        onOpenAuth={(mode = 'signin') => {
          setAuthMode(mode);
          setIsAuthOpen(true);
        }}
        onSignOut={() => {
          localStorage.removeItem('gokarna_traveler_user');
          setCurrentUser(null);
        }}
        onOpenPalette={() => setIsPaletteOpen(true)}
      />

      <main className="w-full flex-1 px-4 pb-6 pt-20 sm:px-8 sm:pt-24 lg:px-10">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28, ease: easeOut }}
        >
          <Suspense fallback={<PageFallback />}>
          <Routes>
            <Route
              path="/"
              element={
                <ExplorePage
                  homestays={homestays}
                  loading={loading}
                  onSelectStay={handleSelectStay}
                  onBookStay={handleBookStay}
                  onFilterChange={(beach, search, checkIn, checkOut) => fetchStays(beach, search, checkIn, checkOut)}
                />
              }
            />
            <Route
              path="/homestays"
              element={
                <ExplorePage
                  homestays={homestays}
                  loading={loading}
                  onSelectStay={handleSelectStay}
                  onBookStay={handleBookStay}
                  onFilterChange={(beach, search, checkIn, checkOut) => fetchStays(beach, search, checkIn, checkOut)}
                />
              }
            />

            <Route
              path="/stay/:id"
              element={
                <StayDetailPage
                  homestay={selectedStay}
                  onBack={() => navigate('/')}
                  onBook={(stay) => handleBookStay(stay || selectedStay!)}
                  onNavigateRoute={() => navigate('/trails')}
                />
              }
            />

            <Route path="/trails" element={<RouteNavigatorPage />} />
            <Route path="/route" element={<Navigate to="/trails" replace />} />

            <Route
              path="/bookings"
              element={
                <RequireAuth
                  user={currentUser}
                  onRequireAuth={() => {
                    setAuthMode('signin');
                    setIsAuthOpen(true);
                  }}
                  onExplore={() => navigate('/')}
                >
                  <ReservationStatusPage initialRefCode={recentRefCode} onExploreStays={() => navigate('/')} />
                </RequireAuth>
              }
            />
            <Route
              path="/reservation/:refCode"
              element={
                <RequireAuth
                  user={currentUser}
                  onRequireAuth={() => {
                    setAuthMode('signin');
                    setIsAuthOpen(true);
                  }}
                  onExplore={() => navigate('/')}
                >
                  <ReservationStatusPage onExploreStays={() => navigate('/')} />
                </RequireAuth>
              }
            />

            <Route
              path="/book/:id"
              element={
                <RequireAuth
                  user={currentUser}
                  onRequireAuth={() => {
                    setAuthMode('signin');
                    setIsAuthOpen(true);
                  }}
                  onExplore={() => navigate('/')}
                >
                  <BookingPage />
                </RequireAuth>
              }
            />
            <Route path="/database" element={<DatabaseStudioPage />} />
            <Route path="/survey" element={<SurveyWorkspacePage />} />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          </Suspense>
        </motion.div>
      </main>

      <Footer
        onNavigate={navigate}
        onFilterStay={(location) => {
          fetchStays(location);
        }}
      />

      <AuthModal
        isOpen={isAuthOpen}
        initialMode={authMode}
        onClose={() => setIsAuthOpen(false)}
        onAuthSuccess={(user) => setCurrentUser(user)}
      />

      <Suspense fallback={null}>
        <CommandPalette open={isPaletteOpen} onClose={() => setIsPaletteOpen(false)} items={commandItems} />
      </Suspense>

      <AssistantChat />
    </div>
  );
}

export default App;
