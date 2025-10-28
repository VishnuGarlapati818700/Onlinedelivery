import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import H from './HomePage';
import Help from './Help'; 
import AfterLoginUser from './AfterLoginUser';
import AfterLoginShopkeepers from './AfterLoginShopkeepers';
import A from './afterlogindelivery'
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<H />} />
        <Route path="/Help" element={<Help />} />
        <Route path="/afterloginuser" element={<AfterLoginUser />} />
        <Route path="/afterloginshopkeepers" element={<AfterLoginShopkeepers />} />
        <Route path='afterlogindelivery' element={<A/>}/>
      </Routes>
    </Router>
  );
}

export default App;