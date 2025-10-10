import Header from './base/header';
import Login from './login/login';
import Markets from './markets/markets';
import Wallet from './wallet/wallet';
import VerifyOTP from './otp/verifyOTP'
import Profile from './profile/profile';
import { AuthProvider } from './session_management/authentication_context';
import './App.css';

import SignUp from './signUp/sign_up';

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
            <Route path="activate/:token" element={<Activate/ >} />
            <Route path="/login" element={<Login />} />
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