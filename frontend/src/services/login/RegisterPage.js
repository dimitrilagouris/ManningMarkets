// RegisterPage.jsx
import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEnvelope, faLock, faUser } from '@fortawesome/free-solid-svg-icons';
import './RegistrationPage.css';
import '../../styles/base.css';

function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState({});

  const validateEmail = (email) => {
    // check for uni email
    const universityDomains = [
      '.edu.au',
      '.edu',
      '.ac.uk',
      'sydney.edu.au'
    ];
    
    const isUniversityEmail = universityDomains.some(domain => 
      email.toLowerCase().endsWith(domain)
    );
    
    return isUniversityEmail;
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(email)) {
      newErrors.email = 'Please use a valid university email address';
    }
    
    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }
    
    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const onSubmit = e => {
    e.preventDefault();
    
    if (validateForm()) {
      //need API call
    }
  };

  return (
    <div className="registration-page">
      <div className="top-band" aria-hidden="true" />

      <div className="registration-image" role="img" aria-label="hero image" />

      <aside className="registration-side" aria-labelledby="registration-heading">
        <div className="registration-side__content">
          <h2 id="registration-heading" className="registration-side__title">Create Account</h2>
          <p className="registration-side__lead">
            Join Manning Markets with your university email to start trading in prediction markets.
          </p>

          <form className="registration-list" onSubmit={onSubmit}>
            <label className="registration-list__item registration-field" htmlFor="name">
              <div className="registration-list__label">
                <span>Full Name</span>
              </div>
              <div className={`registration-field__control ${errors.name ? 'error' : ''}`}>
                <FontAwesomeIcon icon={faUser} className="field-icon" />
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={e => {
                    setName(e.target.value);
                    setErrors({...errors, name: null});
                  }}
                  required
                />
              </div>
              {errors.name && <span className="error-message">{errors.name}</span>}
            </label>

            <label className="registration-list__item registration-field" htmlFor="email">
              <div className="registration-list__label">
                <span>University Email</span>
              </div>
              <div className={`registration-field__control ${errors.email ? 'error' : ''}`}>
                <FontAwesomeIcon icon={faEnvelope} className="field-icon" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={e => {
                    setEmail(e.target.value);
                    setErrors({...errors, email: null});
                  }}
                  placeholder="your.name@sydney.edu.au"
                  required
                />
              </div>
              {errors.email && <span className="error-message">{errors.email}</span>}
            </label>

            <label className="registration-list__item registration-field" htmlFor="password">
              <div className="registration-list__label">
                <span>Password</span>
              </div>
              <div className={`registration-field__control ${errors.password ? 'error' : ''}`}>
                <FontAwesomeIcon icon={faLock} className="field-icon" />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={e => {
                    setPassword(e.target.value);
                    setErrors({...errors, password: null});
                  }}
                  required
                />
              </div>
              {errors.password && <span className="error-message">{errors.password}</span>}
            </label>

            <label className="registration-list__item registration-field" htmlFor="confirmPassword">
              <div className="registration-list__label">
                <span>Confirm Password</span>
              </div>
              <div className={`registration-field__control ${errors.confirmPassword ? 'error' : ''}`}>
                <FontAwesomeIcon icon={faLock} className="field-icon" />
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={e => {
                    setConfirmPassword(e.target.value);
                    setErrors({...errors, confirmPassword: null});
                  }}
                  required
                />
              </div>
              {errors.confirmPassword && <span className="error-message">{errors.confirmPassword}</span>}
            </label>

            <button type="submit" className="registration-cta">Create Account</button>
          </form>

          <a className="info-link" href="#login">Already have an account? Log in</a>
        </div>
      </aside>
    </div>
  );
}

export default RegisterPage;
