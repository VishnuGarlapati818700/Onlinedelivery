import { useState, useEffect } from 'react';
import axios from 'axios';

let userTab = null;
let shopkeeperTab = null;

const AuthForm = ({ onClose, onViewChange, role, i }) => {
  const backendRole = role === 'delivery' ? 'shopkeeper' : role;

  const [view, setView] = useState('login');
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState('');
  const [signupSuccess, setSignupSuccess] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState(false);

  useEffect(() => {
    if (signupSuccess) {
      setView('signupSuccess');
    }
  }, [signupSuccess]);

  const changeView = (newView) => {
    setView(newView);
    onViewChange?.(newView);
  };

  const goBackToLogin = () => {
    setView('login');
    setStep(1);
    setEmail('');
    setPassword('');
    setOtp('');
    setNewPassword('');
    setMessage('');
    setSignupSuccess(false);
    setOtpVerified(false);
    setShowForgot(false);
    setForgotSuccess(false);
    onViewChange?.('login');
  };

  const inputStyle = {
    padding: '10px',
    border: '1px solid #ccc',
    borderRadius: '6px',
    outline: 'none',
    width: '100%',
    backgroundColor: '#fff',
    color: '#000',
  };

  const arrowButtonStyle = {
    fontSize: '24px',
    cursor: 'pointer',
    color: '#000',
    background: 'none',
    border: 'none',
    position: 'absolute',
    top: '-70px',
    left: '-10px',
  };

  const headingStyle = {
    position: 'absolute',
    top: '-60px',
    left: '25px',
    fontSize: '28px',
    fontWeight: 'bold',
    marginBottom: '10px',
    color: '#000',
  };

  const subheadingStyle = {
    fontSize: '20px',
    fontWeight: '600',
    marginBottom: '10px',
    color: '#555',
  };

  const sendOtpForSignup = async () => {
    try {
      const res = await axios.post('http://localhost:8090/otp/send', { email });
      setMessage(res.data);
    } catch (err) {
      setMessage(err.response?.data || 'Error sending OTP');
    }
  };

  const verifyOtpForSignup = async () => {
    try {
      await axios.post('http://localhost:8090/otp/verify', { email, otp, role: backendRole });
      setMessage('OTP verified for signup!');
      setOtpVerified(true);
    } catch (err) {
      setMessage(err.response?.data || 'OTP verification failed');
      setOtpVerified(false);
    }
  };

  const signup = async () => {
    if (!otpVerified) {
      setMessage('Please verify OTP before signing up.');
      return;
    }
    try {
      await axios.post('http://localhost:8090/auth/signup', {
        fullName,
        email,
        password,
        role: backendRole,
      });
      setSignupSuccess(true);
      setMessage('');
    } catch (err) {
      setSignupSuccess(false);
      setMessage(err.response?.data || 'Signup failed');
    }
  };

  const login = async (e) => {
    e.preventDefault();
    try {
      const checkRes = await axios.get('http://localhost:8090/auth/check-email', {
        params: { email, role: backendRole },
      });

      if (!checkRes.data) {
        if (role === 'delivery') {
          setMessage('Email not found.');
          return;
        }
        setMessage('Email not found. Redirecting to Sign Up...');
        setTimeout(() => {
          changeView('signup');
          setMessage('');
        }, 1500);
        return;
      }

      const res = await axios.post('http://localhost:8090/auth/loginn', {
        email,
        password,
        role: backendRole
      });

      if (res.data.success) {
        localStorage.setItem('Name', res.data.name);
        localStorage.setItem('Email', email);
        localStorage.setItem('Role', role);
        setMessage('');
        setShowForgot(false);

        if (userTab && !userTab.closed) userTab.close();
        if (shopkeeperTab && !shopkeeperTab.closed) shopkeeperTab.close();

        if (role === 'delivery') {
          shopkeeperTab = window.open('/afterlogindelivery', '_blank');
        } else if (role === 'shopkeeper') {
          shopkeeperTab = window.open('/afterloginshopkeepers', '_blank');
        } else {
          userTab = window.open('/afterloginuser', '_blank');
        }

        onClose?.();
      } else {
        setMessage(res.data.message || 'Login failed');
        if (role !== 'delivery') setShowForgot(true);
      }
    } catch (err) {
      setMessage(err.response?.data?.message || 'Login failed');
      if (role !== 'delivery') setShowForgot(true);
    }
  };

  const sendOtp = async () => {
    try {
      const res = await axios.post('http://localhost:8090/otp/send', { email });
      setMessage(res.data);
      setStep(2);
    } catch (err) {
      setMessage(err.response?.data || 'Error sending OTP');
    }
  };

  const verifyOtp = async () => {
    try {
      await axios.post('http://localhost:8090/otp/verify', { email, otp, role: backendRole });
      setMessage('OTP verified. Please set new password.');
      setOtpVerified(true);
    } catch (err) {
      setMessage(err.response?.data || 'OTP verification failed');
    }
  };

  const updatePassword = async () => {
    try {
      await axios.post('http://localhost:8090/auth/reset-password', {
        email,
        newPassword,
        role: backendRole
      });
      setForgotSuccess(true);
      setMessage('');
    } catch (err) {
      setMessage(err.response?.data || 'Failed to update password');
    }
  };

  return (
    <div style={{ position: 'relative', maxWidth: '400px', margin: '60px auto', textAlign: 'center' }}>
      {view !== 'login' && (
        <button onClick={goBackToLogin} style={arrowButtonStyle}>←</button>
      )}
      <div style={{
        padding: '20px',
        backgroundColor: '#fff',
        borderRadius: '12px',
        boxShadow: '0 0 10px rgba(0,0,0,0.2)'
      }}>
        {/* Login */}
        {view === 'login' && (
          <>
            <h1 style={headingStyle}>Login to Your Account</h1>
            <h2 style={subheadingStyle}>Login</h2>
            <form onSubmit={login} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <input type="email" placeholder={role === 'delivery' ? 'Shopkeeper Email' : 'Email'} required style={inputStyle} value={email} onChange={(e) => setEmail(e.target.value)} />
              <div style={{ position: 'relative' }}>
                <input type={showPassword ? 'text' : 'password'} placeholder="Password" required style={inputStyle} value={password} onChange={(e) => setPassword(e.target.value)} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} style={{
                  position: 'absolute', right: '10px', top: '10px',
                  background: 'none', border: 'none', cursor: 'pointer', color: '#007BFF'
                }}>
                  {showPassword ? '👁️‍🗨️' : '👁️'}
                </button>
              </div>
              <button type="submit" style={{ padding: '10px', backgroundColor: '#333', color: '#fff' }}>Login</button>
            </form>

            {role !== "delivery" && showForgot && (
              <p style={{ marginTop: '10px' }}>
                <button onClick={() => { changeView('forgot'); setStep(1); setMessage(''); setOtpVerified(false); }}
                  style={{ background: 'none', color: '#007BFF', border: 'none', cursor: 'pointer' }}>
                  Forgot Password?
                </button>
              </p>
            )}

            {role !== "delivery" && (
              <p style={{ marginTop: '20px' }}>
                Don't have an account?
                <button onClick={() => { changeView('signup'); setMessage(''); }}
                  style={{ marginLeft: '5px', background: 'none', color: '#007BFF', border: 'none', cursor: 'pointer' }}>
                  Sign Up
                </button>
              </p>
            )}

            {message && <p style={{ color: 'red', marginTop: '10px' }}>{message}</p>}
          </>
        )}

        {/* Signup */}
        {view === 'signup' && (
          <>
            <h1 style={headingStyle}>Create a New Account</h1>
            <h2 style={subheadingStyle}>Sign Up</h2>
            <form onSubmit={(e) => { e.preventDefault(); signup(); }}
              style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <input type="text" placeholder={i} required style={inputStyle} value={fullName} onChange={(e) => setFullName(e.target.value)} />
              <div style={{ display: 'flex', gap: '10px' }}>
                <input type="email" placeholder="Email" required style={{ ...inputStyle, flex: 1 }} value={email} onChange={(e) => {
                  setEmail(e.target.value); setOtpVerified(false); setOtp(''); setMessage('');
                }} />
                <button type="button" onClick={sendOtpForSignup}>Send OTP</button>
              </div>
              {message && !otpVerified && (
                <>
                  <input type="text" placeholder="Enter OTP" value={otp} onChange={(e) => setOtp(e.target.value)} required style={inputStyle} />
                  <button type="button" onClick={verifyOtpForSignup} style={{
                    height: '45px', backgroundColor: '#333', color: '#fff', border: 'none', borderRadius: '6px'
                  }}>Verify OTP</button>
                  <p style={{ color: otpVerified ? 'green' : 'red', margin: 0 }}>{message}</p>
                </>
              )}
              {otpVerified && (
                <>
                  <div style={{ position: 'relative' }}>
                    <input type={showPassword ? 'text' : 'password'} placeholder="Password" required style={inputStyle} value={password} onChange={(e) => setPassword(e.target.value)} />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} style={{
                      position: 'absolute', right: '10px', top: '10px', background: 'none', border: 'none', cursor: 'pointer', color: '#007BFF'
                    }}>{showPassword ? '👁️‍🗨️' : '👁️'}</button>
                  </div>
                  <button type="submit" style={{ padding: '10px', backgroundColor: '#333', color: '#fff' }}>Sign Up</button>
                </>
              )}
            </form>
          </>
        )}

        {/* Forgot Password */}
        {view === 'forgot' && (
          <>
            <h1 style={headingStyle}>Reset Your Password</h1>
            <h2 style={subheadingStyle}>Forgot Password</h2>
            {forgotSuccess ? (
  <div style={{ textAlign: 'center', paddingTop: '10px' }}>
    <div style={{ fontSize: '60px', color: 'green' }}>✔️</div>
    <h2 style={{ fontSize: '22px', color: '#000', marginTop: '10px' }}>Password Updated!</h2>
    <p style={{ color: '#555' }}>Password Updated Successfully!</p>
    <button
      onClick={goBackToLogin}
      style={{
        marginTop: '20px',
        padding: '10px',
        backgroundColor: '#333',
        color: '#fff',
        border: 'none',
        borderRadius: '6px',
        cursor: 'pointer'
      }}
    >
      Back to Login
    </button>
  </div>
) : (
              <>
                {step === 1 && (
                  <>
                    <input type="email" placeholder="Enter your registered email" value={email} onChange={(e) => setEmail(e.target.value)} required style={{ ...inputStyle, marginBottom: '10px' }} />
                    <button onClick={sendOtp} style={{ padding: '10px', backgroundColor: '#333', color: '#fff' }}>Send OTP</button>
                  </>
                )}
                {step === 2 && !otpVerified && (
                  <>
                    <input type="text" placeholder="Enter OTP" value={otp} onChange={(e) => setOtp(e.target.value)} required style={{ ...inputStyle, marginBottom: '10px' }} />
                    <button onClick={verifyOtp} style={{
                      height: '45px', backgroundColor: '#333', color: '#fff', border: 'none', borderRadius: '6px'
                    }}>Verify OTP</button>
                  </>
                )}
                {step === 2 && otpVerified && (
                  <>
                    <input type="password" placeholder="Enter new password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required style={{ ...inputStyle, marginBottom: '10px' }} />
                    <button onClick={updatePassword} style={{ padding: '10px', backgroundColor: '#333', color: '#fff' }}>Update Password</button>
                  </>
                )}
                {message && <p style={{ marginTop: '10px', color: 'green' }}>{message}</p>}
              </>
            )}
          </>
        )}

        {/* Signup Success */}
        {view === 'signupSuccess' && (
          <>
            <h1 style={headingStyle}>Signup Successful</h1>
            <h2 style={subheadingStyle}>Your account has been created.</h2>
            <div style={{ fontSize: '60px', color: 'green', marginBottom: '20px' }}>✔️</div>
            <button
              onClick={goBackToLogin}
              style={{
                padding: '10px',
                backgroundColor: '#333',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              Go to Login
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default AuthForm;
