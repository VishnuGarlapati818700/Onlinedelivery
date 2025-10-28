import React, { useEffect, useState } from 'react';
import Header from './Header';
import CurrentLocationMap from './CurrentLocationMap';
import Body from './BodyOfShopkeepers';
import Footer from './Footer';
export default function AfterLoginShopkeepers() {
  const [Name, setName] = useState('');
const[Email,setEmail]=useState('');
const[Role,setRole]=useState('');
const name = localStorage.getItem('Name');
    const email = localStorage.getItem('Email');
    const role = localStorage.getItem('Role');
  useEffect(() => {
    if (name) {
      setName(name);
      console.log(Name);
    }
    if (email) {
      setEmail(email);
            console.log(Email);

    }
    if (role) {
      setRole(role);
            console.log(Role);

    }
  }, [email,role]);

  return (
    <>
      <Header help="🤖"   personalInfo="Update Info" email={Email} role={Role} l="logout"/>
      <div style={{ marginTop: '50px' }}>
        <CurrentLocationMap name={Name} email={Email} role={Role}/>
        <Body  email={Email} role={Role}/>
        <Footer/>
      </div>
    </>
  );
}
