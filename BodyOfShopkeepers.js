import React, { useEffect, useState } from 'react';
import axios from 'axios';

export default function BodyOfShopkeepers({ email, role }) {
  const [products, setProducts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', price: 1, availability: 1 });
  const [loadingAdd, setLoadingAdd] = useState(false);
  const [error, setError] = useState('');
  const [activeMenuIndex, setActiveMenuIndex] = useState(null);
  const [editIndex, setEditIndex] = useState(null);
  const [editFormData, setEditFormData] = useState({ name: '', price: 1, availability: 1 });
  const [isListening, setIsListening] = useState(false);
  const [isEditListening, setIsEditListening] = useState(false);

  useEffect(() => {
    if (email && role === "shopkeeper") {
      fetch("http://localhost:8090/auth/get-shopkeeper-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, role })
      })
        .then(res => res.json())
        .then(data => {
          let parsedProducts = [];
          try {
            parsedProducts = typeof data.productsJson === 'string'
              ? JSON.parse(data.productsJson)
              : data.productsJson;
            if (!Array.isArray(parsedProducts)) parsedProducts = [];
          } catch (err) {
            console.error("Failed to parse productsJson:", err);
            parsedProducts = [];
          }
          setProducts(parsedProducts);
        })
        .catch(err => console.error("Fetch shopkeeper products failed:", err));
    }
  }, [email, role]);

  useEffect(() => {
    if (role === 'shopkeeper' && email) {
      axios.post('http://localhost:8090/auth/update-shopkeeper-data', {
        email,
        role,
        productsJson: JSON.stringify(products)
      }).catch(err => console.error('Auto-update failed:', err));
    }
  }, [products, email, role]);

  const startVoiceInput = (setValue, setMicState) => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return alert("Speech recognition not supported.");
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-IN';
    recognition.onstart = () => setMicState(true);
    recognition.onend = () => setMicState(false);
    recognition.onresult = (event) => {
      const speechResult = event.results[0][0].transcript;
      setValue(speechResult);
    };
    recognition.start();
  };

  const handleAddProduct = async () => {
    const { name, price, availability } = formData;
    if (!name || price < 1 || availability < 1) return setError('Invalid input');
    setLoadingAdd(true);
    let imageUrl = '';
    try {
      const response = await fetch(`http://localhost:8090/api/image?q=${encodeURIComponent(name)}`);
      const data = await response.json();
      if (data?.hits?.length > 0) imageUrl = data.hits[0].webformatURL;
    } catch (err) {
      console.error('Image fetch failed:', err);
    }

    const newProduct = { ...formData, imageUrl };
    setProducts((prev) => [...prev, newProduct]);
    setFormData({ name: '', price: 1, availability: 1 });
    setShowForm(false);
    setLoadingAdd(false);
  };

  const handleDelete = (index) => {
    const updatedProducts = products.filter((_, i) => i !== index);
    setProducts(updatedProducts);
    setActiveMenuIndex(null);
  };

  const handleEditSubmit = async () => {
    let imageUrl = '';
    try {
      const res = await fetch(`http://localhost:8090/api/image?q=${encodeURIComponent(editFormData.name)}`);
      const data = await res.json();
      if (data?.hits?.length > 0) imageUrl = data.hits[0].webformatURL;
    } catch (err) {
      console.error("Image fetch failed on save:", err);
    }
    const updated = [...products];
    updated[editIndex] = { ...editFormData, imageUrl };
    setProducts(updated);
    setEditIndex(null);
    setEditFormData({ name: '', price: 1, availability: 1 });
  };

  const InputWithButtons = ({ label, value, onChange }) => {
    const [inputValue, setInputValue] = useState(value);
    useEffect(() => setInputValue(value), [value]);

    const handleBlur = () => {
      const sanitized = Math.max(1, parseInt(inputValue) || 1);
      onChange(sanitized);
    };

    return (
      <div style={{ marginTop: '10px', width: '100%' }}>
        <label>{label}</label>
        <div style={{ display: 'flex', alignItems: 'center', marginTop: '4px', backgroundColor: '#f0f0f0', borderRadius: '6px', padding: '4px', width: '100%' }}>
          <input
            type="number"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onBlur={handleBlur}
            style={{ flex: 1, fontSize: '16px', padding: '8px', border: '1px solid #ccc', borderRadius: '4px', outline: 'none', textAlign: 'center', backgroundColor: 'white' }}
          />
          <div style={{ display: 'flex', flexDirection: 'column', marginLeft: '8px' }}>
            <button onClick={() => onChange(value + 1)} style={{ padding: '2px 6px' }}>▲</button>
            <button onClick={() => onChange(Math.max(1, value - 1))} style={{ padding: '2px 6px' }}>▼</button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ minHeight: '70vh', width: '100vw', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0f0f0', color: 'black', padding: '50px', border: '1px black solid' }}>
      <h2>Shopkeeper Product List</h2>
      <div style={{ width: 'auto', backgroundColor: 'white', boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)', paddingLeft: '70px', paddingRight: '70px', paddingTop: '20px', paddingBottom: '20px' }}>
        {products.length === 0 ? <p>No products yet.</p> : (
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '20px' }}>
            {products.map((product, index) => (
              <div key={index} style={{ position: 'relative', background: '#fff', border: '1px solid #ccc', borderRadius: '10px', padding: '15px', minWidth: '200px' }}>
                <div style={{ position: 'absolute', top: '10px', right: '10px', cursor: 'pointer' }} onClick={() => setActiveMenuIndex(activeMenuIndex === index ? null : index)}>
                  ⋮
                </div>
                {activeMenuIndex === index && (
                  <div style={{ position: 'absolute', top: '35px', right: '10px', backgroundColor: 'white', border: '1px solid #ccc', borderRadius: '5px', zIndex: 1 }}>
                    <button onClick={() => {
                      setEditIndex(index);
                      setEditFormData({ ...products[index] });
                      setActiveMenuIndex(null);
                    }} style={{ padding: '8px', width: '100%', border: 'none', background: 'white' }}>Update</button>
                    <button onClick={() => handleDelete(index)} style={{ padding: '8px', width: '100%', border: 'none', background: 'white', color: 'red' }}>Delete</button>
                  </div>
                )}
                <h4>{product.name}</h4>
                {product.imageUrl && <img src={product.imageUrl} alt={product.name} style={{ width: '100%', borderRadius: '8px', maxHeight: '150px', objectFit: 'cover' }} />}
                <p>Price: ₹{product.price}</p>
                <p>Availability: {product.availability}</p>
              </div>
            ))}
          </div>
        )}
        <button onClick={() => setShowForm(true)} style={{ marginTop: '20px', padding: '10px 20px', background: '#4CAF50', color: 'white', border: 'none', borderRadius: '5px' }}>
          Add Product
        </button>
      </div>

      {/* Add Product Modal */}
      {showForm && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ background: '#f9f9f9', padding: '25px', borderRadius: '10px', width: '320px' }}>
            <h3>Add Product</h3>
            <div style={{ position: 'relative', marginBottom: '10px' }}>
              <input
                type="text"
                placeholder="Product Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                style={{ width: '100%', padding: '10px', paddingRight: '35px', borderRadius: '5px', border: '1px solid #ccc' }}
              />
              <button
                onClick={() => startVoiceInput((speech) => setFormData(prev => ({ ...prev, name: speech })), setIsListening)}
                style={{ position: 'absolute', right: '5px', top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'transparent', fontSize: '20px' }}
              >
                {isListening ? '🔴' : '🎤'}
              </button>
            </div>
            <InputWithButtons label="Price" value={formData.price} onChange={(v) => setFormData({ ...formData, price: v })} />
            <InputWithButtons label="Availability" value={formData.availability} onChange={(v) => setFormData({ ...formData, availability: v })} />
            {error && <p style={{ color: 'red' }}>{error}</p>}
            <div style={{ marginTop: '10px', textAlign: 'right' }}>
              <button onClick={handleAddProduct} disabled={loadingAdd} style={{ backgroundColor: '#2196F3', color: 'white', padding: '8px 14px', border: 'none', borderRadius: '5px', marginRight: '10px' }}>
                {loadingAdd ? 'Adding...' : 'Add'}
              </button>
              <button onClick={() => { setShowForm(false); setFormData({ name: '', price: 1, availability: 1 }); setError(''); }} style={{ backgroundColor: '#f44336', color: 'white', padding: '8px 14px', border: 'none', borderRadius: '5px' }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Update Product Modal */}
      {editIndex !== null && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ background: '#fff', padding: '25px', borderRadius: '10px', width: '340px' }}>
            <h3>Update Product</h3>
            <div style={{ position: 'relative', marginBottom: '10px' }}>
              <input
                type="text"
                value={editFormData.name}
                onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                style={{ width: '100%', padding: '10px', paddingRight: '35px', borderRadius: '5px', border: '1px solid #ccc' }}
              />
              <button
                onClick={() => startVoiceInput((speech) => setEditFormData(prev => ({ ...prev, name: speech })), setIsEditListening)}
                style={{ position: 'absolute', right: '5px', top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'transparent', fontSize: '20px' }}
              >
                {isEditListening ? '🔴' : '🎤'}
              </button>
            </div>
            <InputWithButtons label="Price" value={editFormData.price} onChange={(v) => setEditFormData({ ...editFormData, price: v })} />
            <InputWithButtons label="Availability" value={editFormData.availability} onChange={(v) => setEditFormData({ ...editFormData, availability: v })} />
            <div style={{ marginTop: '10px', textAlign: 'right' }}>
              <button onClick={handleEditSubmit} style={{ backgroundColor: '#2196F3', color: 'white', padding: '8px 14px', border: 'none', borderRadius: '5px', marginRight: '10px' }}>
                Save
              </button>
              <button onClick={() => setEditIndex(null)} style={{ backgroundColor: '#f44336', color: 'white', padding: '8px 14px', border: 'none', borderRadius: '5px' }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
