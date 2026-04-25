import Header from './components/header/header';
import LoginPage from './services/login/LoginPage';
import MarketPage from './services/markets/MarketPage';
import Wallet from './services/wallet/WalletPage';
import LeaderboardPage from './services/leaderboard/LeaderboardPage';
import OtpModal from './services/otp/OtpModal'
import ProfilePage from './services/profile/ProfilePage';
import AdminDashboard from './services/admin/AdminDashboard';
import MarketManagementPage from './services/marketManagement/MarketManagementPage';
import ProtectedRoute from './components/ProtectedRoute';

import { AuthProvider } from './auth-pages/authentication_context';

import SignUp from './services/signUp/SignUpPage';
import { PlacePositionPage } from './services/placePosition/PlacePositionPage';

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Activate from './auth-pages/activate';

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="App">
          <Header />
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<MarketPage />} />
            <Route path="/markets" element={<MarketPage />} />
            <Route path="/market/:marketId" element={<PlacePositionPage />} />
            <Route path="activate/:token" element={<Activate />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/leaderboard" element={<LeaderboardPage />} />
            <Route path="/sign-up" element={<SignUp />} />
            <Route path="/verify-otp" element={<OtpModal />} />

            {/* Protected routes */}
            <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
            <Route path="/wallet" element={<ProtectedRoute><Wallet /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
            <Route path="/market-management" element={<ProtectedRoute><MarketManagementPage /></ProtectedRoute>} />
          </Routes>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;