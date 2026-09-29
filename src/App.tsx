import { useState, useEffect } from 'react'
import type { Screen, SearchQuery } from './types'
import PhoneFrame from './components/PhoneFrame'
import BottomNav from './components/BottomNav'
import SplashScreen from './screens/SplashScreen'
import OnboardingScreen from './screens/OnboardingScreen'
import LoginScreen from './screens/LoginScreen'
import RegisterScreen from './screens/RegisterScreen'
import ForgotPasswordScreen from './screens/ForgotPasswordScreen'
import HomeScreen from './screens/HomeScreen'
import SearchScreen from './screens/SearchScreen'
import RideDetailScreen from './screens/RideDetailScreen'
import PostRideScreen from './screens/PostRideScreen'
import ChatListScreen from './screens/ChatListScreen'
import ChatDetailScreen from './screens/ChatDetailScreen'
import TripsScreen from './screens/TripsScreen'
import ProfileScreen from './screens/ProfileScreen'
import NotificationsScreen from './screens/NotificationsScreen'
import NotificationDetailScreen from './screens/NotificationDetailScreen'
import SuccessScreen from './screens/SuccessScreen'
import EditProfileScreen from './screens/profile/EditProfileScreen'
import VerificationScreen from './screens/profile/VerificationScreen'
import WalletScreen from './screens/profile/WalletScreen'
import NotificationSettingsScreen from './screens/profile/NotificationSettingsScreen'
import PrivacySecurityScreen from './screens/profile/PrivacySecurityScreen'
import DarkModeScreen from './screens/profile/DarkModeScreen'
import EmergencyContactsScreen from './screens/profile/EmergencyContactsScreen'
import HelpSupportScreen from './screens/profile/HelpSupportScreen'
import LegalScreen from './screens/profile/LegalScreen'
import { notifications } from './mockData'
import BookingConfirmationScreen from './screens/BookingConfirmationScreen'
import PaymentScreen from './screens/PaymentScreen'
import RideTrackingScreen from './screens/RideTrackingScreen'
import RateReviewScreen from './screens/RateReviewScreen'
import PublicProfileScreen from './screens/PublicProfileScreen'
import SOSScreen from './screens/SOSScreen'
import LanguageScreen from './screens/LanguageScreen'

const BOTTOM_NAV_SCREENS: Screen[] = ['home', 'search', 'trips', 'chat-list', 'profile']

export default function App() {
  const [screen, setScreen] = useState<Screen>('splash')
  const [selectedRideId, setSelectedRideId] = useState<string>('r1')
  const [selectedChatId, setSelectedChatId] = useState<string>('c1')
  const [successType, setSuccessType] = useState<'booking' | 'ride-published'>('booking')
  const [selectedNotificationId, setSelectedNotificationId] = useState<string>('')
  const [legalType, setLegalType] = useState<'terms' | 'privacy'>('terms')
  const [darkMode, setDarkMode] = useState<'light' | 'dark' | 'system'>('light')
  const [prevScreen, setPrevScreen] = useState<Screen>('home')
  const [selectedDriverId, setSelectedDriverId] = useState<string>('d1')
  const [driverMode, setDriverMode] = useState(false)
  // Lifted above Home/Search so it survives navigating to Ride Detail (or
  // anywhere else) and back — see SearchScreen/HomeScreen for how it's used.
  const [searchQuery, setSearchQuery] = useState<SearchQuery>({
    pickup: '', pickupSubtitle: '', dropoff: '', dropoffSubtitle: '', date: 'Today', timeLabel: 'Any Time',
  })
  const updateSearchQuery = (patch: Partial<SearchQuery>) => setSearchQuery((q) => ({ ...q, ...patch }))
  const unreadNotifications = notifications.filter((n) => !n.read).length

  const go = (s: Screen) => { setPrevScreen(screen); setScreen(s) }

  // Auto-advance from splash
  useEffect(() => {
    if (screen === 'splash') {
      const t = setTimeout(() => go('onboarding'), 2800)
      return () => clearTimeout(t)
    }
  }, [screen])

  const showBottomNav = BOTTOM_NAV_SCREENS.includes(screen)

  return (
    <div
      className="min-h-screen flex items-center justify-center overflow-auto"
      style={{
        background: 'radial-gradient(ellipse at 20% 20%, #1e3a8a 0%, #0f172a 50%, #020617 100%)',
        padding: '24px 16px',
      }}
    >
      {/* App showcase label */}
      <div className="hidden xl:block absolute left-10 top-1/2 -translate-y-1/2 max-w-xs">
        <div className="flex items-center gap-3 mb-4">
          <div
            className="w-10 h-10 rounded-2xl flex items-center justify-center"
            style={{ background: 'rgba(37,99,235,0.8)', border: '1px solid rgba(255,255,255,0.15)' }}
          >
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <path d="M3 18 Q7 10 11 7 Q15 4 19 2" stroke="rgba(255,255,255,0.3)" strokeWidth="5" strokeLinecap="round" />
              <path d="M3 18 Q7 10 11 7 Q15 4 19 2" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeDasharray="3 4" />
              <circle cx="11" cy="7" r="4.5" fill="white" />
              <circle cx="11" cy="7" r="2.2" fill="#2563EB" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-white" style={{ fontFamily: "'Outfit', sans-serif" }}>
              Share<span style={{ color: '#60A5FA' }}>Ride</span>
            </h1>
            <p className="text-xs text-white/50">Hybrid Mobile App</p>
          </div>
        </div>
        <p className="text-sm text-white/60 leading-relaxed mb-6" style={{ fontFamily: "'Inter', sans-serif" }}>
          A production-ready ride-sharing platform. Post rides, find seats, chat with drivers, and travel together safely.
        </p>
        <div className="space-y-2">
          {[
            { screen: 'home' as Screen, label: 'Home (Map)', icon: '🗺️' },
            { screen: 'search' as Screen, label: 'Discover', icon: '🔍' },
            { screen: 'ride-detail' as Screen, label: 'Ride Detail', icon: '🚗' },
            { screen: 'post-ride' as Screen, label: 'Post a Ride', icon: '➕' },
            { screen: 'chat-list' as Screen, label: 'Messages', icon: '💬' },
            { screen: 'trips' as Screen, label: 'My Rides', icon: '📋' },
            { screen: 'profile' as Screen, label: 'Profile', icon: '👤' },
            { screen: 'notifications' as Screen, label: 'Notifications', icon: '🔔' },
            { screen: 'onboarding' as Screen, label: 'Onboarding', icon: '👋' },
            { screen: 'login' as Screen, label: 'Login / OTP', icon: '🔑' },
          ].map(({ screen: s, label, icon }) => (
            <button
              key={s}
              onClick={() => go(s)}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left transition-all text-sm"
              style={{
                background: screen === s ? 'rgba(37,99,235,0.3)' : 'rgba(255,255,255,0.05)',
                border: `1px solid ${screen === s ? 'rgba(59,130,246,0.5)' : 'rgba(255,255,255,0.08)'}`,
                color: screen === s ? '#93C5FD' : 'rgba(255,255,255,0.6)',
                fontFamily: "'Inter', sans-serif",
              }}
            >
              <span>{icon}</span>
              <span>{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Phone */}
      <PhoneFrame>
        {/* Screen layer */}
        <div className="absolute inset-0" style={{ top: 0 }}>
          {screen === 'splash' && <SplashScreen />}

          {screen === 'onboarding' && (
            <OnboardingScreen onComplete={() => go('login')} />
          )}

          {screen === 'login' && (
            <LoginScreen
              onLogin={() => go('home')}
              onRegister={() => go('register')}
              onForgotPassword={() => go('forgot-password')}
            />
          )}

          {screen === 'register' && (
            <RegisterScreen
              onBack={() => go('login')}
              onSuccess={() => go('home')}
              onSignIn={() => go('login')}
            />
          )}

          {screen === 'forgot-password' && (
            <ForgotPasswordScreen
              onBack={() => go('login')}
              onSuccess={() => go('login')}
            />
          )}

          {screen === 'home' && (
            <HomeScreen
              onNavigate={go}
              onNotifications={() => go('notifications')}
              onSearch={() => go('search')}
              onPostRide={() => go('post-ride')}
              onSOS={() => go('sos')}
              driverMode={driverMode}
              onToggleDriverMode={() => setDriverMode((m) => !m)}
              query={searchQuery}
              onQueryChange={updateSearchQuery}
              onSelectRide={(id) => { setSelectedRideId(id); go('ride-detail') }}
            />
          )}

          {screen === 'search' && (
            <SearchScreen
              onNavigate={go}
              onBack={() => go('home')}
              onSelectRide={(id) => { setSelectedRideId(id); go('ride-detail') }}
              query={searchQuery}
              onQueryChange={updateSearchQuery}
              onPostRide={() => go('post-ride')}
            />
          )}

          {screen === 'ride-detail' && (
            <RideDetailScreen
              rideId={selectedRideId}
              onBack={() => go(prevScreen as Screen)}
              onNavigate={go}
              onBook={() => go('payment')}
              onChat={(id) => { setSelectedChatId(id); go('chat-detail') }}
              onViewDriverProfile={(id) => { setSelectedDriverId(id); go('public-profile') }}
            />
          )}

          {screen === 'payment' && (
            <PaymentScreen
              rideId={selectedRideId}
              seats={1}
              onBack={() => go('ride-detail')}
              onSuccess={() => go('booking-confirmation')}
            />
          )}

          {screen === 'booking-confirmation' && (
            <BookingConfirmationScreen
              rideId={selectedRideId}
              onDone={() => go('trips')}
              onTrackRide={() => go('ride-tracking')}
            />
          )}

          {screen === 'ride-tracking' && (
            <RideTrackingScreen
              rideId={selectedRideId}
              onBack={() => go('trips')}
              onSOS={() => go('sos')}
            />
          )}

          {screen === 'rate-review' && (
            <RateReviewScreen
              rideId={selectedRideId}
              onBack={() => go('trips')}
              onSubmit={() => go('trips')}
            />
          )}

          {screen === 'public-profile' && (
            <PublicProfileScreen
              driverId={selectedDriverId}
              onBack={() => go('ride-detail')}
              onChat={() => go('chat-detail')}
              onBookRide={() => go('payment')}
            />
          )}

          {screen === 'sos' && (
            <SOSScreen onClose={() => go(prevScreen as Screen)} />
          )}

          {screen === 'post-ride' && (
            <PostRideScreen
              onBack={() => go('home')}
              onPublish={() => { setSuccessType('ride-published'); go('success') }}
            />
          )}

          {screen === 'chat-list' && (
            <ChatListScreen
              onOpenChat={(id) => { setSelectedChatId(id); go('chat-detail') }}
            />
          )}

          {screen === 'chat-detail' && (
            <ChatDetailScreen
              contactId={selectedChatId}
              onBack={() => go('chat-list')}
              onViewRide={() => go('ride-detail')}
            />
          )}

          {screen === 'trips' && (
            <TripsScreen
              onSelectRide={(id) => { setSelectedRideId(id); go('ride-detail') }}
              onTrackRide={(id) => { setSelectedRideId(id); go('ride-tracking') }}
              onRateRide={(id) => { setSelectedRideId(id); go('rate-review') }}
              onCancelRide={(_id) => go('trips')}
            />
          )}

          {screen === 'profile' && (
            <ProfileScreen onNavigate={go} />
          )}

          {screen === 'notifications' && (
            <NotificationsScreen
              onBack={() => go('home')}
              onSelectNotification={(id) => { setSelectedNotificationId(id); go('notification-detail') }}
            />
          )}

          {screen === 'notification-detail' && (
            <NotificationDetailScreen
              notification={notifications.find((n) => n.id === selectedNotificationId) || notifications[0]}
              onBack={() => go('notifications')}
              onNavigate={go}
            />
          )}

          {screen === 'edit-profile' && (
            <EditProfileScreen onBack={() => go('profile')} onSave={() => go('profile')} />
          )}

          {screen === 'verification' && (
            <VerificationScreen onBack={() => go('profile')} />
          )}

          {screen === 'wallet' && (
            <WalletScreen onBack={() => go('profile')} />
          )}

          {screen === 'notification-settings' && (
            <NotificationSettingsScreen onBack={() => go('profile')} />
          )}

          {screen === 'privacy-security' && (
            <PrivacySecurityScreen onBack={() => go('profile')} />
          )}

          {screen === 'dark-mode' && (
            <DarkModeScreen
              onBack={() => go('profile')}
              current={darkMode}
              onChange={(m) => setDarkMode(m)}
            />
          )}

          {screen === 'emergency-contacts' && (
            <EmergencyContactsScreen onBack={() => go('profile')} />
          )}

          {screen === 'help-support' && (
            <HelpSupportScreen onBack={() => go('profile')} onReplayOnboarding={() => go('onboarding')} />
          )}

          {screen === 'language' && (
            <LanguageScreen onBack={() => go('profile')} />
          )}

          {screen === 'terms' && (
            <LegalScreen type="terms" onBack={() => go('profile')} />
          )}

          {screen === 'privacy-policy' && (
            <LegalScreen type="privacy" onBack={() => go('profile')} />
          )}

          {screen === 'success' && (
            <SuccessScreen
              type={successType}
              onDone={() => go(successType === 'booking' ? 'trips' : 'home')}
            />
          )}
        </div>

        {/* Bottom nav — only on main tab screens */}
        {showBottomNav && (
          <BottomNav
            active={screen}
            onNavigate={go}
            onPostRide={() => go('post-ride')}
            unreadNotifications={unreadNotifications}
          />
        )}
      </PhoneFrame>

      {/* Mobile quick nav (small screens) */}
      <div
        className="xl:hidden fixed bottom-0 left-0 right-0 bg-black/80 backdrop-blur-sm border-t border-white/10 px-4 py-2 flex gap-2 overflow-x-auto hide-scrollbar z-50"
      >
        {[
          { s: 'home', icon: '🏠' },
          { s: 'search', icon: '🔍' },
          { s: 'ride-detail', icon: '🚗' },
          { s: 'post-ride', icon: '➕' },
          { s: 'chat-list', icon: '💬' },
          { s: 'trips', icon: '📋' },
          { s: 'profile', icon: '👤' },
          { s: 'onboarding', icon: '👋' },
          { s: 'login', icon: '🔑' },
          { s: 'notifications', icon: '🔔' },
        ].map(({ s, icon }) => (
          <button
            key={s}
            onClick={() => go(s as Screen)}
            className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-lg transition-all"
            style={{ background: screen === s ? 'rgba(37,99,235,0.5)' : 'rgba(255,255,255,0.08)' }}
          >
            {icon}
          </button>
        ))}
      </div>
    </div>
  )
}
