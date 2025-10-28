import React, { useState, useEffect } from "react";
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

export default function CitySelectorMapForm(props) {
  const [inputCity, setInputCity] = useState("");
  const [showMapForm, setShowMapForm] = useState(false);
  const [currentPos, setCurrentPos] = useState(null);
  const [selectedPos, setSelectedPos] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [submittedCity, setSubmittedCity] = useState("");

  const handleVoiceInput = () => {
    const recognition = new window.webkitSpeechRecognition();
    recognition.lang = "en-IN";
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInputCity(transcript);
      setIsProcessing(false);
    };
    recognition.onerror = () => setIsProcessing(false);
    recognition.onend = () => setIsProcessing(false);
    recognition.start();
    setIsProcessing(true);
  };

  useEffect(() => {
    if (props.email && props.role) {
      fetch(`http://localhost:8090/auth/get-${props.role}-data`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: props.email, role: props.role })
      })
        .then(res => res.json())
        .then(data => {
          if (data) {
            setSubmittedCity(data.location || "");
          }
        })
        .catch(err => console.error("Fetch failed", err));
    }
  }, [props.email, props.role]);

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
      reverseGeocode(selectedPos);
    }
  }, [selectedPos]);

  useEffect(() => {
    if (showMapForm && submittedCity) {
      setInputCity(submittedCity);
    }
  }, [showMapForm]);

  const reverseGeocode = async ([lat, lon]) => {
    try {
      const res = await fetch(`http://localhost:8090/api/reverse-geocode?lat=${lat}&lon=${lon}`);
      const data = await res.json();
      setInputCity(data.city || "Unknown location");
    } catch (err) {
      console.error("Reverse geocode failed", err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSubmit = async () => {
    const location = inputCity || submittedCity;
    setSubmittedCity(location);
    setInputCity("");
    setIsProcessing(false);
    setShowMapForm(false);

    try {
      const response = await fetch(`http://localhost:8090/auth/update-${props.role}-data`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email: props.email,
          role: props.role,
          location: location,
          productsJson: null
        })
      });

      if (response.ok) {
        console.log("Location successfully updated in DB");
      } else {
        const err = await response.text();
        console.error("Error updating location:", err);
      }
    } catch (error) {
      console.error("Failed to update location:", error);
    }
  };

  return (
    <div style={{ padding: 20, color: 'black', justifyItems: 'center', alignItems:'center',width: '100vw', backgroundColor:'#f0f0f0', border:'1px black solid'}}>
    <div style={{ padding: 20, color: 'black', justifyItems: 'center', width: '100%' }}>
      <h4 style={{ textAlign: "center", fontSize: "20px", fontWeight: "bold" }}>
        Welcome: {props.name || ''}
      </h4>

      <div style={{
        display: "flex",
        alignItems: "center",
        border: "1px solid #ccc",
        borderRadius: 6,
        padding: "5px 10px",
        width: '90%',
        backgroundColor:'white'
      }}>
        <input
          type="text"
          value={inputCity}
          onChange={(e) => setInputCity(e.target.value)}
          placeholder="Enter city name"
          style={{
            flex: 1,
            border: "none",
            outline: "none",
            fontSize: "16px",
            width:'40px'
          }}
        />

        <button
          onClick={handleVoiceInput}
          disabled={isProcessing}
          title="Voice input"
          style={{
            background: "none",
            border: "none",
            padding: "0 6px",
            cursor: isProcessing ? "not-allowed" : "pointer"
          }}
        >
          <img
            src={isProcessing
              ? "https://img.icons8.com/ios-filled/100/808080/microphone.png"
              : "https://img.icons8.com/color/200/microphone.png"}
            alt="Mic"
            style={{ width: 24, height: 24 }}
          />
        </button>

        <button
          onClick={() => setShowMapForm(true)}
          disabled={isProcessing}
          title="Select from map"
          style={{
            background: "none",
            border: "none",
            padding: "0 6px",
            cursor: isProcessing ? "not-allowed" : "pointer"
          }}
        >
          <img
            src={isProcessing
              ? "https://img.icons8.com/ios-filled/100/808080/google-maps.png"
              : "https://img.icons8.com/color/200x/google-maps.png"}
            alt="Map"
            style={{ width: 24, height: 24 }}
          />
        </button>

        {inputCity && (
          <button
            onClick={handleSubmit}
            disabled={isProcessing}
            style={{
              marginLeft: 6,
              background: isProcessing ? "gray" : "green",
              color: "white",
              border: "none",
              padding: "5px 12px",
              borderRadius: 4,
              fontSize: "14px",
              cursor: isProcessing ? "not-allowed" : "pointer"
            }}
          >
            Submit
          </button>
        )}
      </div>

      {submittedCity && (
        <h2 style={{ marginTop: 10, width: '100vw' }}>
          Location: {submittedCity}
        </h2>
      )}

      {showMapForm && currentPos && selectedPos && (
        <div style={{
          marginTop: 20,
          padding: 10,
          border: "1px solid #ccc",
          borderRadius: 8,
          background: "#f9f9f9",
          position: "relative",
          width: "100vw"
        }}>
          <button
            onClick={() => {
              setShowMapForm(false);
              setIsProcessing(false);
            }}
            style={{
              position: "absolute",
              top: 8,
              left: 10,
              background: "none",
              border: "none",
              fontSize: "18px",
              cursor: "pointer"
            }}
            aria-label="Close map"
          >
            ←
          </button>

          <h3 style={{ marginTop: 0 }}>Select Location</h3>

          <MapContainer
            center={selectedPos}
            zoom={13}
            style={{ height: "400px", width: "100%", marginBottom: 10 }}
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
              <Popup>Drag or click to change location</Popup>
            </Marker>
          </MapContainer>
        </div>
      )}
    </div>
    </div>
  );
}
