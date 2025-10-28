import React, { useEffect, useState } from 'react';
import Header from './Header';
import CurrentLocationMap from './CurrentLocationMap';
import Footer from './Footer';
import Body from './BodyOfUser';
export default function AfterLoginUser() {
  const [Name, setName] = useState('');
const[Email,setEmail]=useState('');
const[Role,setRole]=useState('');
const name = localStorage.getItem('Name');
    const email = localStorage.getItem('Email');
    const role = localStorage.getItem('Role');
  useEffect(() => {
    if (name) {
      setName(name);
    }
    if (email) {
      setEmail(email);
    }
    if (role) {
      setRole(role);
    }
  }, [email,role]);

  return (
    <>
      <Header help="🤖"   personalInfo="Update Info" email={Email} role={Role} l="logout" />
      <div style={{ marginTop: '50px' }}>
        <CurrentLocationMap name={Name} email={Email} role={Role}/>
        <Body email={Email} role={Role}/>
      </div>
      <Footer/>
    </>
  );
}
