import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './App.css';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMapEvents
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const yellowIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-yellow.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const blueIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const ClickToSetMarker = ({ setSelectedPos }) => {
  useMapEvents({
    click(e) {
      setSelectedPos([e.latlng.lat, e.latlng.lng]);
    }
  });
  return null;
};

export default function BodyOfUser({ email, role }) {
  const [location, setLocation] = useState('');
  const [shopkeepers, setShopkeepers] = useState([]);
  const [cartCounts, setCartCounts] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [step, setStep] = useState('cart');
  const [deliveryLocation, setDeliveryLocation] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showMapForm, setShowMapForm] = useState(false);
  const [currentPos, setCurrentPos] = useState(null);
  const [selectedPos, setSelectedPos] = useState(null);

  const handleQuantityChange = (key, value, availability) => {
    if (value < 0 || value > availability) return;
    setCartCounts(prev => ({ ...prev, [key]: value }));
  };

  const totalItems = Object.values(cartCounts).reduce((a, b) => a + b, 0);
  const totalPrice = Object.entries(cartCounts).reduce((sum, [key, count]) => {
    const [si, pi] = key.split('_').map(Number);
    try {
      const products = JSON.parse(shopkeepers[si].productsJson || '[]');
      const price = products[pi]?.price || 0;
      return sum + price * count;
    } catch {
      return sum;
    }
  }, 0);

  const handleBuyNow = () => {
    const selectedByShop = {};
    shopkeepers.forEach((shop, si) => {
      let products = [];
      try {
        products = JSON.parse(shop.productsJson || '[]');
      } catch {}
      products.forEach((p, pi) => {
        const key = `${si}_${pi}`;
        const count = cartCounts[key] || 0;
        if (count > 0) {
          if (!selectedByShop[shop.email]) {
            selectedByShop[shop.email] = {
              shopkeeperEmail: shop.email,
              shopkeeperPassword: shop.password,
              products: []
            };
          }
          selectedByShop[shop.email].products.push({
            name: p.name,
            price: p.price,
            quantity: count,
            img: p.imageUrl
          });
        }
      });
    });

    const allSelected = Object.values(selectedByShop);
    if (allSelected.length === 0) return;
    setSelectedProducts(allSelected);
    setStep('delivery');
    setShowModal(true);
  };

  useEffect(() => {
    if (email && role === 'user') {
      axios.post('http://localhost:8090/auth/get-user-data', { email, role })
        .then(res => {
          const loc = res.data.location || '';
          setLocation(loc);
          setDeliveryLocation(prev => prev || loc);
        })
        .catch(err => console.error('User location fetch failed:', err));
    }
  }, [email, role]);

  useEffect(() => {
    if (location) {
      axios.get('http://localhost:8090/auth/all-shopkeepers')
        .then(res => {
          const filtered = res.data.filter(shop => {
            if (shop.location !== location) return false;
            try {
              const products = JSON.parse(shop.productsJson || '[]');
              return products.some(p => p.availability > 0);
            } catch {
              return false;
            }
          });
          setShopkeepers(filtered);
        });
    }
  }, [location]);
  useEffect(() => {
  const interval = setInterval(() => {
    if (email && role === 'user') {
      axios.post('http://localhost:8090/auth/get-user-data', { email, role })
        .then(res => {
          const loc = res.data.location || '';
          setLocation(prevLoc => {
            if (prevLoc !== loc) {
              setDeliveryLocation(prev => prev || loc); // Optional: update delivery location if not set
              return loc;
            }
            return prevLoc;
          });
        })
        .catch(err => console.error('Polling user location failed:', err));
    }
  },0); // every 10 seconds

  return () => clearInterval(interval); // cleanup
}, [email, role]);

  useEffect(() => {
    if (showMapForm) {
      setIsProcessing(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = [pos.coords.latitude, pos.coords.longitude];
          setCurrentPos(coords);
          setSelectedPos(coords);
        },
        () => alert("Please allow location access."),
        { enableHighAccuracy: true }
      );
    }
  }, [showMapForm]);

  useEffect(() => {
    if (selectedPos) {
      setIsProcessing(true);
      fetch(`http://localhost:8090/api/full-address-reverse-geocode?lat=${selectedPos[0]}&lon=${selectedPos[1]}`)
        .then(res => res.json())
        .then(data => {
          const fullAddress = Object.values(data).filter(Boolean).join(', ');
          setDeliveryLocation(fullAddress);
        })
        .catch(() => alert('Failed to get full address'))
        .finally(() => setIsProcessing(false));
    }
  }, [selectedPos]);

  const handleVoiceInput = () => {
    setIsProcessing(true);
    const recognition = new window.webkitSpeechRecognition();
    recognition.lang = "en-IN";
    recognition.onresult = (event) => {
      setDeliveryLocation(event.results[0][0].transcript);
      setIsProcessing(false);
    };
    recognition.onerror = () => setIsProcessing(false);
    recognition.start();
  };

  const submitDeliveryOrder = async () => {
    if (!customerPhone || !deliveryLocation || selectedProducts.length === 0) {
      alert('Please fill in all fields');
      return;
    }

    try {
      for (const shop of selectedProducts) {
        const payload = {
          shopkeeperEmail: shop.shopkeeperEmail,
          customerPhone,
          deliveryLocation,
          latitude: selectedPos?.[0] || null,
          longitude: selectedPos?.[1] || null,
          productListJson: shop.products
        };

        await axios.post('http://localhost:8090/auth/save-customer-order', payload);
console.log("Submitting order payload:", payload);

        const res = await axios.post('http://localhost:8090/auth/get-shopkeeper-products', { email: shop.shopkeeperEmail });
        let originalProducts = JSON.parse(res.data.productsJson || '[]');

        for (const p of shop.products) {
          const index = originalProducts.findIndex(op => op.name === p.name);
          if (index !== -1) {
            originalProducts[index].availability -= p.quantity;
            if (originalProducts[index].availability <= 0) {
              originalProducts.splice(index, 1);
            }
          }
        }

        await axios.post('http://localhost:8090/auth/update-shopkeeper-data', {
          email: shop.shopkeeperEmail,
          role: 'shopkeeper',
          location,
          productsJson: JSON.stringify(originalProducts)
        });
      }

      alert('Order(s) placed successfully!');
      setCartCounts({});
      setShowModal(false);
      setStep('cart');

      if (location) {
        const res = await axios.get('http://localhost:8090/auth/all-shopkeepers');
        const filtered = res.data.filter(shop => {
          if (shop.location !== location) return false;
          try {
            const products = JSON.parse(shop.productsJson || '[]');
            return products.some(p => p.availability > 0);
          } catch {
            return false;
          }
        });
        setShopkeepers(filtered);
      }

    } catch (err) {
      console.error('Order submission failed:', err);
      alert('Something went wrong while placing your order.');
    }
  };
return (
    <div style={{ padding: '20px', backgroundColor: '#f0f0f0', color: 'black', marginBottom: '70px',border:'1px solid black'}}>
      <h2 style={{ textAlign: 'center', marginBottom: '30px' }}>
        Nearby Shops {location && `(Location: ${location})`}
      </h2>

      {shopkeepers.length === 0 ? (
        <div style={{ textAlign: 'center', marginTop: '50px', fontSize: '18px', color: 'gray', height:"55vh"}}>
            No shops available in your location.
        </div>
        ) : (shopkeepers.map((shop, si) => {
        let products = [];
        try {
          products = JSON.parse(shop.productsJson || '[]');
          console.log("Products from DB:", products);

        } catch {}

        return (
          <div key={si} style={{ margin: '0 auto 30px', backgroundColor: '#fff', borderRadius: '10px', padding: '20px', boxShadow: '0 0 10px rgba(0,0,0,0.1)', maxWidth: '900px' }}>
            <h3 style={{ textAlign: 'center', color: 'black' }}>{shop.fullName}</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '20px', marginTop: '20px' }}>
              {products.map((p, pi) => {
                const key = `${si}_${pi}`;
                const count = cartCounts[key] || 0;
                
                return (
                  <div key={key} style={{
                    background: '#fafafa',
                    border: '1px solid #ccc',
                    borderRadius: '10px',
                    padding: '15px',
                    width: '220px',
                    textAlign: 'center',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
                    color: 'black'
                  }}>
                    
                    <h4>{p.name}</h4>
                    {p.imageUrl && (
                      <img src={p.imageUrl} alt={p.name} style={{ width: '100%', height: '140px', objectFit: 'cover', borderRadius: '6px', marginBottom: '10px' }} />
                    )}
                    <p>Price: ₹{p.price}</p>
                    <p>Availability: {p.availability}</p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '120px', margin: '10px auto 0', backgroundColor: '#e8e8e8', borderRadius: '6px', padding: '4px' }}>
                      <button onClick={() => handleQuantityChange(key, count - 1, p.availability)} style={{ width: '30px', height: '36px', fontSize: '18px', border: 'none', backgroundColor: '#ccc', borderRadius: '4px', cursor: 'pointer' }}>-</button>
                      <input type="number" value={count} readOnly style={{ width: '40px', height: '36px', textAlign: 'center', fontSize: '16px', border: '1px solid #aaa', borderRadius: '4px', backgroundColor: '#fff' }} />
                      <button onClick={() => handleQuantityChange(key, count + 1, p.availability)} style={{ width: '30px', height: '36px', fontSize: '18px', border: 'none', backgroundColor: '#ccc', borderRadius: '4px', cursor: 'pointer' }}>+</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      }))}

      {totalItems > 0 && !showModal && (
        <button onClick={() => { setShowModal(true); setStep('cart'); }} style={{
          position: 'fixed',
          bottom: '90px',
          right: '20px',
          backgroundColor: '#28a745',
          color: 'white',
          padding: '12px 20px',
          borderRadius: '30px',
          border: 'none',
          fontSize: '16px',
          boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
          zIndex: 1000
        }}>
          🛒 Cart ({totalItems})
        </button>
      )}

      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 999
        }}>
          <div className="modal-slide" style={{
            width: '90%',
            maxWidth: '450px',
            background: 'white',
            borderRadius: '10px',
            padding: '20px',
            position: 'relative',
            color: 'black'
          }}>
            <button onClick={() => {
              if (step === 'delivery') {
                setStep('cart');
              } else {
                setShowModal(false);
              }
            }} style={{
              position: 'absolute',
              top: '10px',
              left: '10px',
              fontSize: '18px',
              background: 'none',
              border: 'none',
              cursor: 'pointer'
            }}>←</button>

            {step === 'cart' && (
              <>
                <h3 style={{ textAlign: 'center', marginBottom: '20px' }}>🛒 Your Cart</h3>
                <hr />
                {shopkeepers.map((shop, si) => {
                  let products = [];
                  try {
                    products = JSON.parse(shop.productsJson || '[]');
                  } catch {}
                  const shopCartItems = products.map((p, pi) => {
                    const key = `${si}_${pi}`;
                    const count = cartCounts[key] || 0;
                    if (count > 0) {
                      return (
                        <div key={key} style={{ marginBottom: '10px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '15px' }}>
                            <span>{p.name} x {count}</span>
                            <span>₹{p.price * count}</span>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }).filter(Boolean);

                  if (shopCartItems.length === 0) return null;

                  return (
                    <div key={si} style={{ marginBottom: '20px' }}>
                      <h4 style={{ marginBottom: '8px', color: '#000' }}>{shop.fullName}</h4>
                      {shopCartItems}
                    </div>
                  );
                })}
                <hr />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', marginTop: '20px', fontSize: '17px' }}>
                  <span>Total:</span>
                  <span>₹{totalPrice}</span>
                </div>
                <button onClick={handleBuyNow} style={{
                  marginTop: '20px', width: '100%', padding: '12px',
                  backgroundColor: '#007bff', color: 'white', border: 'none',
                  borderRadius: '5px', fontSize: '16px'
                }}>Buy Now</button>
              </>
            )}

            {step === 'delivery' && (
              <>
                <h3 style={{ textAlign: 'center', marginBottom: '10px' }}>Delivery Address</h3>
                <input type="text" value={customerPhone}
  onChange={(e) => setCustomerPhone(e.target.value)}
  placeholder="Enter phone number"
  style={{
    width: '100%', padding: '10px', marginBottom: '10px',
    fontSize: '16px', borderRadius: '5px', border: '1px solid #ccc'
  }} />

<div style={{ position: 'relative', marginBottom: '10px' }}>
  <textarea
  value={deliveryLocation}
  onChange={(e) => setDeliveryLocation(e.target.value)}
  placeholder="Enter full delivery address"
  rows={3}
  style={{
    width: '100%',
    padding: '10px',
    fontSize: '16px',
    borderRadius: '5px',
    border: '1px solid #ccc',
    resize: 'none',
    marginBottom: '10px'
  }}
/>

<div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
  <button
    onClick={handleVoiceInput}
    disabled={isProcessing}
    style={{
      background: isProcessing ? '#aaa' : '#28a745',
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      padding: '8px 12px',
      fontSize: '15px',
      cursor: isProcessing ? 'not-allowed' : 'pointer',
      flex: 1,
      marginRight: '5px'
    }}
  >
    🎤 Voice
  </button>

  <button
    onClick={() => setShowMapForm(true)}
    disabled={isProcessing}
    style={{
      background: isProcessing ? '#aaa' : '#007bff',
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      padding: '8px 12px',
      fontSize: '15px',
      cursor: isProcessing ? 'not-allowed' : 'pointer',
      flex: 1,
      marginLeft: '5px'
    }}
  >
    📍 Map
  </button>
</div>

</div>

{showMapForm && currentPos && selectedPos && (
  <div style={{
    marginBottom: 10,
    border: '1px solid #ccc',
    borderRadius: 6,
    overflow: 'hidden'
  }}>
    <MapContainer
      center={selectedPos}
      zoom={13}
      style={{ height: "300px", width: "100%" }}
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <ClickToSetMarker setSelectedPos={setSelectedPos} />
      <Marker position={currentPos} icon={blueIcon}>
        <Popup>Current Location</Popup>
      </Marker>
      <Marker
        position={selectedPos}
        icon={yellowIcon}
        draggable
        eventHandlers={{
          dragend: (e) => {
            const { lat, lng } = e.target.getLatLng();
            setSelectedPos([lat, lng]);
          }
        }}
      >
        <Popup>Drag to your delivery location</Popup>
      </Marker>
    </MapContainer>
  </div>
)}

<button onClick={submitDeliveryOrder} style={{
  marginTop: '10px', width: '100%', padding: '12px',
  backgroundColor: '#007bff', color: 'white', border: 'none',
  borderRadius: '5px', fontSize: '16px'
}}>Submit Order</button>


                {showMapForm && currentPos && selectedPos && (
                  <div style={{
                    marginTop: 10, border: '1px solid #ccc', borderRadius: 6,
                    overflow: 'hidden'
                  }}>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
