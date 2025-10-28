import Header from './Header';
import Home from './Home';
import About from './About';
import Services from './Services';
import ShopContact from './ShopContact';
import Footer from './Footer';

const HomePage = () => {
  return (
    <>
      <Header help="🤖"ShL="Shopkeeper Login"   DL="Delivery Login" UL="User Login"/>
      <Home />
      <About />
      <Services />
      <ShopContact />
      <Footer />
    </>
  );
};

export default HomePage;

