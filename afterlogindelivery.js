import React, { useEffect, useState } from 'react';
import Header from './Header';
import Footer from './Footer';
import C from './C';
export default function AfterLoginShopkeepers() {
const[Email,setEmail]=useState('');
const [Name, setName] = useState('');
const email = localStorage.getItem('Email');
const name = localStorage.getItem('Name');
  useEffect(() => {
    if (email) {
      setEmail(email);
            console.log(Email);

    }
    if (name) {
      setName(name);
    }
  }, [email]);

  return (
    <>
      <Header help="🤖"l="logout"/>
      <div style={{ marginTop: '50px' }}>
        <C email={Email} name={Name}/>
        <Footer/>
      </div>
    </>
  );
}
