import Header from './base/header';
import Login from './login/login';
import Markets from './markets/markets';
import Wallet from './wallet/wallet';
import Leaderboard from './leaderboard/leaderboard';
import VerifyOTP from './otp/verifyOTP'
import Profile from './profile/profile';
import { AuthProvider } from './session_management/authentication_context';
import './App.css';

import SignUp from './signUp/sign_up';
import { PlacePositionPage } from './placePosition/placePosition';

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Activate from './activation/activate';

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="App">
          <Header />
          <Routes>
            <Route path="/" element={<Markets/>} />
            <Route path="/markets" element={<Markets/>} />
            <Route path="/market/:marketId" element={<PlacePositionPage />} />
            <Route path="activate/:token" element={<Activate/ >} />
            <Route path="/login" element={<Login />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/sign-up" element={<SignUp />} />
            <Route path="/verify-otp" element={<VerifyOTP />} />
            <Route path="/wallet" element={<Wallet/>} />
          </Routes>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;