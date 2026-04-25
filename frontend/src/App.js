import Header from './components/header/header';
import LoginPage from './services/login/LoginPage';
import MarketPage from './services/markets/MarketPage';
import Wallet from './services/wallet/WalletPage';
import LeaderboardPage from './services/leaderboard/LeaderboardPage';
import OtpModal from './services/otp/OtpModal'
import ProfilePage from './services/profile/ProfilePage';
import AdminDashboard from './services/admin/AdminDashboard';
import MarketManagementPage from './services/marketManagement/MarketManagementPage';

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
            <Route path="/" element={<MarketPage/>} />
            <Route path="/markets" element={<MarketPage/>} />
            <Route path="/market/:marketId" element={<PlacePositionPage />} />
            <Route path="activate/:token" element={<Activate/>} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/leaderboard" element={<LeaderboardPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/sign-up" element={<SignUp />} />
            <Route path="/verify-otp" element={<OtpModal />} />
            <Route path="/wallet" element={<Wallet/>} />
            <Route path="/admin" element={<AdminDashboard/>} />
            <Route path="/market-management" element={<MarketManagementPage/>} />
          </Routes>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;