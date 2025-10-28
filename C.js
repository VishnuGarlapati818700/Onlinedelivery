import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  Popup,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const redIcon = new L.Icon({
  iconUrl: "https://maps.google.com/mapfiles/ms/icons/red-dot.png",
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});
const blueIcon = new L.Icon({
  iconUrl: "https://maps.google.com/mapfiles/ms/icons/blue-dot.png",
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

const SpeedControl = ({ speed }) => {
  const map = useMap();

  useEffect(() => {
    const control = L.control({ position: "bottomleft" });

    control.onAdd = () => {
      const div = L.DomUtil.create("div", "leaflet-bar leaflet-control");
      div.style.background = "green";
      div.style.color = "white";
      div.style.width = "50px";
      div.style.height = "50px";
      div.style.lineHeight = "50px";
      div.style.textAlign = "center";
      div.style.borderRadius = "50%";
      div.style.fontWeight = "bold";
      div.style.fontSize = "12px";
      div.style.margin = "10px";
      div.innerText = `${speed} km/h`;
      return div;
    };

    control.addTo(map);
    return () => control.remove();
  }, [map, speed]);

  return null;
};

export default function C({ email, name }) {
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [currentPos, setCurrentPos] = useState(null);
  const [routeCoords, setRouteCoords] = useState([]);
  const [steps, setSteps] = useState([]);
  const [isNavigating, setIsNavigating] = useState(false);
  const [speed, setSpeed] = useState("0");
  const [slideConfirmed, setSlideConfirmed] = useState(false);
  const [totalAmount, setTotalAmount] = useState(0);
  const [slideProgress, setSlideProgress] = useState(0);

  const sliderRef = useRef(null);
  const sliderContainerRef = useRef(null);
  const stepIndex = useRef(0);
  const lastPosition = useRef(null);
  const lastTimestamp = useRef(null);

  // 🟡 POLLING every 5 seconds to refresh orders
  useEffect(() => {
    const fetchOrders = () => {
      axios
        .post("http://localhost:8090/auth/get-customer-orders", { email })
        .then((res) => setOrders(res.data))
        .catch((err) => console.error("Fetch error:", err));
    };

    fetchOrders(); // initial fetch
    const intervalId = setInterval(fetchOrders, 5000); // poll every 5s

    return () => clearInterval(intervalId);
  }, [email]);

  useEffect(() => {
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude, speed: spd } = pos.coords;
        const newPos = [latitude, longitude];
        setCurrentPos(newPos);

        const now = Date.now();
        if (spd != null) {
          setSpeed((spd * 3.6).toFixed(2));
        } else if (lastPosition.current && lastTimestamp.current) {
          const d = getDistance(lastPosition.current, newPos);
          const t = (now - lastTimestamp.current) / 1000;
          const kmph = (d / t) * 3600;
          setSpeed(kmph.toFixed(2));
        }
        lastPosition.current = newPos;
        lastTimestamp.current = now;

        if (isNavigating && steps[stepIndex.current]) {
          const step = steps[stepIndex.current];
          const dist = getDistance(newPos, [step.lat, step.lon]);
          if (dist < 0.05) {
            speak(step.instruction);
            stepIndex.current++;
          }
        }
      },
      (err) => console.error("Location error:", err),
      { enableHighAccuracy: true }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, [steps, isNavigating]);

  const getDistance = (c1, c2) => {
    const R = 6371;
    const dLat = (c2[0] - c1[0]) * Math.PI / 180;
    const dLon = (c2[1] - c1[1]) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(c1[0] * Math.PI / 180) *
        Math.cos(c2[0] * Math.PI / 180) *
        Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  const speak = (text) => {
    const u = new SpeechSynthesisUtterance(text);
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  };

  const fetchRoute = async (lat, lng) => {
    if (!currentPos) return;
    const res = await axios.post("http://localhost:8090/api/route", {
      lat: currentPos[0],
      lon: currentPos[1],
      to_coords: [lng, lat],
    });

    const coords = res.data.features[0].geometry.coordinates.map(
      ([lon, lat]) => [lat, lon]
    );
    setRouteCoords(coords);

    const segment = res.data.features[0].properties.segments[0];
    const s = segment.steps.map((step) => ({
      instruction: step.instruction,
      lat: coords[step.way_points[0]][0],
      lon: coords[step.way_points[0]][1],
    }));
    setSteps(s);
    stepIndex.current = 0;
  };

  return (
    <div style={{ padding: "20px", color: "black" }}>
      <h1>Orders for {name}</h1>
      {orders.length === 0 ? (
        <p>No orders found.</p>
      ) : (
        orders.map((order) => (
          <div key={order.id} style={{
            background: "#f9f9f9",
            boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
            borderRadius: "10px",
            padding: "15px",
            marginBottom: "20px",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>{new Date(order.createdAt).toLocaleString()}</span>
              <button
                style={{
                  backgroundColor: "#007bff",
                  color: "white",
                  border: "none",
                  padding: "5px 10px",
                  borderRadius: "5px",
                  cursor: "pointer",
                }}
                onClick={() => {
                  setSelectedOrder(order);
                  setModalVisible(true);
                  setSlideConfirmed(false);
                  setSlideProgress(0);
                  setTotalAmount(0);
                  fetchRoute(order.latitude, order.longitude);
                }}
              >
                📍 Delivery
              </button>
            </div>

            <p><strong>Phone:</strong> {order.customerPhone}</p>
            <p><strong>Location:</strong> {order.deliveryLocation}</p>

            <div style={{
              display: 'flex', flexWrap: 'wrap', gap: '20px', marginTop: '15px', justifyContent: 'center'
            }}>
              {JSON.parse(order.productListJson).map((product, idx) => (
                <div key={idx} style={{
                  background: '#fff',
                  border: '1px solid #ccc',
                  borderRadius: '10px',
                  padding: '15px',
                  minWidth: '200px',
                  maxWidth: '220px',
                }}>
                  <h4>{product.name}</h4>
                  {product.img ? (
                    <img src={product.img} alt={product.name} style={{
                      width: '100%', borderRadius: '8px', maxHeight: '150px', objectFit: 'cover'
                    }} />
                  ) : <div style={{ width: '100%', height: '150px', background: '#eee' }}>No image</div>}
                  <p>Price: ₹{product.price}</p>
                  <p>Quantity: {product.quantity || 1}</p>
                </div>
              ))}
            </div>
          </div>
        ))
      )}

      {modalVisible && selectedOrder && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(0,0,0,0.5)",
          display: "flex", justifyContent: "center", alignItems: "center",
          zIndex: 9999
        }}>
          <div style={{
            background: "white", padding: 10, borderRadius: 10, width: "90%", maxWidth: 600, position: "relative"
          }}>
            <button onClick={() => {
              setModalVisible(false);
              setIsNavigating(false);
              window.speechSynthesis.cancel();
            }} style={{
              background: "none", border: "none", fontSize: "24px", cursor: "pointer", position: "absolute", top: 10, left: 10
            }}>←</button>

            {slideConfirmed ? (
              <div style={{
                background: "#fff",
                padding: 40,
                borderRadius: 16,
                textAlign: "center",
                width: "100%",
                maxWidth: 400,
                margin: "auto"
              }}>
                <h2 style={{ fontSize: 22, color: "#333", marginBottom: 20 }}>🧾 Total Amount</h2>
                <p style={{ fontSize: 30, fontWeight: "bold", color: "#28a745", marginBottom: 30 }}>
                  ₹{totalAmount}
                </p>
              </div>
            ) : (
              <>
                <MapContainer center={currentPos || [20.59, 78.96]} zoom={17} style={{ height: 400, marginTop: 30 }}>
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  {currentPos && <Marker position={currentPos} icon={blueIcon}><Popup>You</Popup></Marker>}
                  <Marker position={[selectedOrder.latitude, selectedOrder.longitude]} icon={redIcon}><Popup>Destination</Popup></Marker>
                  {routeCoords.length > 0 && <Polyline positions={routeCoords} color="blue" />}
                  {isNavigating && <SpeedControl speed={speed} />}
                </MapContainer>

                <button
                  onClick={() => setIsNavigating(!isNavigating)}
                  style={{
                    marginTop: 10,
                    width: "100%",
                    padding: 10,
                    backgroundColor: isNavigating ? "#dc3545" : "#28a745",
                    color: "white",
                    border: "none",
                    borderRadius: 5,
                    fontWeight: "bold",
                    fontSize: 16
                  }}
                >
                  {isNavigating ? "⏹ Stop" : "▶ Start"}
                </button>

                <div
                  ref={sliderContainerRef}
                  style={{
                    marginTop: 10,
                    background: "#ccc",
                    borderRadius: 30,
                    overflow: "hidden",
                    position: "relative",
                    height: 50,
                    userSelect: "none"
                  }}
                  onMouseMove={(e) => {
                    if (!sliderRef.current?.isDragging) return;
                    const rect = sliderContainerRef.current.getBoundingClientRect();
                    let newX = e.clientX - rect.left;
                    newX = Math.max(0, Math.min(newX, rect.width));
                    setSlideProgress((newX / rect.width) * 100);
                  }}
                  onMouseUp={() => {
                    if (!sliderRef.current?.isDragging) return;
                    sliderRef.current.isDragging = false;
                    if (slideProgress > 90) {
                      const products = JSON.parse(selectedOrder.productListJson);
                      const total = products.reduce((sum, p) => sum + p.price * (p.quantity || 1), 0);
                      setTotalAmount(total);
                      setSlideConfirmed(true);

                      fetch("http://localhost:8090/auth/delete-order", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ id: selectedOrder.id })
                      })
                        .then(res => res.text())
                        .then(console.log)
                        .catch(console.error);

                    } else {
                      setSlideProgress(0);
                    }
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      height: "100%",
                      width: `${slideProgress}%`,
                      background: "#28a745",
                      borderRadius: 30
                    }}
                  ></div>
                  <div
                    ref={sliderRef}
                    onMouseDown={() => {
                      sliderRef.current.isDragging = true;
                    }}
                    style={{
                      position: "absolute",
                      top: 0,
                      left: `${slideProgress}%`,
                      height: "100%",
                      width: 'auto',
                      background: "#007bff",
                      color: "white",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      borderRadius: 30,
                      fontWeight: "bold",
                      cursor: "grab"
                    }}
                  >
                    👉 complete delivery
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
