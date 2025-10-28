import { useState, useEffect } from 'react';
import axios from 'axios';
import Help from './Help';
import AuthForm from './AuthForm';

const Header = (props) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showKeeperLogin, setShowKeeperLogin] = useState(false);
  const [showUserLogin, setShowUserLogin] = useState(false);
  const [showDeliveryLogin, setShowDeliveryLogin] = useState(false);
  const [showPersonalInfoModal, setShowPersonalInfoModal] = useState(false);
  const [authView, setAuthView] = useState('login');
  const [isDesktop, setIsDesktop] = useState(window.innerWidth > 700);

  const toggleMenu = () => setMenuOpen(!menuOpen);

  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth > 700);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <>
      <nav className="navbar">
        <div className="logo">My local Business</div>
        <label onClick={toggleMenu} className="hamburger" style={{ fontSize: '24px', cursor: 'pointer', display: isDesktop ? 'none' : 'block' }}>
          &#9776;
        </label>

        <ul className="menu" style={{
          display: menuOpen || isDesktop ? 'flex' : 'none',
          flexDirection: isDesktop ? 'row' : 'column',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '10px', margin: 0
        }}>
          {props.help && (
            <li style={{ ...circleHelpStyle }} onClick={() => setShowHelp(true)} title="Help">
              {props.help}
            </li>
          )}

          {props.ShL && (
            <li style={listItemStyle} onClick={() => { setShowKeeperLogin(true); setAuthView('login'); }}>
              {props.ShL}
            </li>
          )}

          {props.DL && (
            <li style={listItemStyle} onClick={() => { setShowDeliveryLogin(true); setAuthView('login'); }}>
              {props.DL}
            </li>
          )}

          {props.UL && (
            <li style={listItemStyle} onClick={() => { setShowUserLogin(true); setAuthView('login'); }}>
              {props.UL}
            </li>
          )}

          {props.personalInfo && (
            <li style={listItemStyle} onClick={() => setShowPersonalInfoModal(true)}>
              {props.personalInfo}
            </li>
          )}

          {props.l && (
            <li style={listItemStyle} onClick={() => window.close()}>
              {props.l}
            </li>
          )}
        </ul>
      </nav>

      {/* Help Modal */}
      {showHelp && (
        <div style={overlayStyle} onClick={() => setShowHelp(false)}>
          <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
            <div style={backArrowStyle} onClick={() => setShowHelp(false)}>←</div>
            <h1 style={headingStyle}>Need Help?</h1>
            <Help />
          </div>
        </div>
      )}

      {/* Shopkeeper Login Modal */}
      {showKeeperLogin && (
        <div style={overlayStyle} onClick={() => setShowKeeperLogin(false)}>
          <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
            {authView === 'login' && <div style={backArrowStyle} onClick={() => setShowKeeperLogin(false)}>←</div>}
            <AuthForm role="shopkeeper" i={"Enter Shop Name"} onClose={() => setShowKeeperLogin(false)} onViewChange={setAuthView} />
          </div>
        </div>
      )}

      {/* Delivery Login Modal */}
      {showDeliveryLogin && (
        <div style={overlayStyle} onClick={() => setShowDeliveryLogin(false)}>
          <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
            {authView === 'login' && <div style={backArrowStyle} onClick={() => setShowDeliveryLogin(false)}>←</div>}
            <AuthForm role="delivery" onClose={() => setShowDeliveryLogin(false)} onViewChange={setAuthView} />
          </div>
        </div>
      )}

      {/* User Login Modal */}
      {showUserLogin && (
        <div style={overlayStyle} onClick={() => setShowUserLogin(false)}>
          <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
            {authView === 'login' && <div style={backArrowStyle} onClick={() => setShowUserLogin(false)}>←</div>}
            <AuthForm role="user" i={"Enter Full Name"}onClose={() => setShowUserLogin(false)} onViewChange={setAuthView} />
          </div>
        </div>
      )}

      {/* Personal Info Modal */}
      {showPersonalInfoModal && (
        <div style={overlayStyle} onClick={() => setShowPersonalInfoModal(false)}>
          <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
            <div style={backArrowStyle} onClick={() => setShowPersonalInfoModal(false)}>←</div>
            <h1 style={headingStyle}>Update Personal Info</h1>
            <PersonalInfoForm email={props.email} role={props.role} />
          </div>
        </div>
      )}
    </>
  );
};

const PersonalInfoForm = ({ email, role }) => {
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [response, setResponse] = useState('');

  useEffect(() => {
    if (email && role) {
      axios.post('http://localhost:8090/auth/get-profile', { email, role })
        .then(res => {
          if (res.data.fullName) {
            setFullName(res.data.fullName);
          }
        })
        .catch(() => {
          setFullName('');
        });
    }
  }, [email, role]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://localhost:8090/auth/update-profile', {
        email,
        role,
        fullName,
        newPassword: password
      });
      setResponse(res.data);
    } catch (err) {
      setResponse(err.response?.data || 'Error updating personal info');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input type="text" placeholder="Full Name" value={fullName} onChange={(e) => setFullName(e.target.value)} style={inputStyle} />
      <input type="password" placeholder="New Password" value={password} onChange={(e) => setPassword(e.target.value)} style={inputStyle} />
      <button type="submit" style={buttonStyle}>Update Info</button>
      <p style={{ textAlign: 'center', color: 'green' }}>{response}</p>
    </form>
  );
};

// Styles
const overlayStyle = {
  position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
  backgroundColor: 'rgba(0,0,0,0.6)',
  display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
};

const modalStyle = {
  backgroundColor: '#fff', padding: '30px', borderRadius: '10px',
  width: '400px', maxHeight: '90vh', overflowY: 'auto',
  position: 'relative', boxShadow: '0 0 20px rgba(0,0,0,0.3)'
};

const backArrowStyle = {
  position: 'absolute', top: '10px', left: '15px',
  fontSize: '24px', cursor: 'pointer', color: '#333', zIndex: 1001
};

const headingStyle = {
  textAlign: 'center', fontSize: '28px',
  fontWeight: 'bold', marginBottom: '20px', color: '#000'
};

const inputStyle = {
  display: 'block', margin: '10px auto', padding: '10px',
  width: '100%', borderRadius: '5px', border: '1px solid #ccc'
};

const buttonStyle = {
  padding: '10px', marginTop: '10px',
  backgroundColor: '#4CAF50', color: '#fff',
  border: 'none', borderRadius: '5px', width: '100%', cursor: 'pointer'
};

const listItemStyle = {
  cursor: 'pointer', textAlign: 'center', margin: '5px 10px'
};

const circleHelpStyle = {
  width: '30px',
  height: '30px',
  borderRadius: '50%',
  border: '1px solid #333',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  fontWeight: 'bold',
  color: '#333',
  backgroundColor: '#fff',
  cursor: 'pointer',
  textAlign: 'center'
};

export default Header;
