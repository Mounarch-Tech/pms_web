import React, { createContext, useState, useEffect } from 'react';

const API_BASE = import.meta.env.VITE_API_URL;

export const ShipsHealthContext = createContext({
  shipHealthList: [],
  refreshShipHealth: () => { },
  loading: false,
  error: null,
});

export const ShipHealthProvider = ({ children }) => {
  const [shipHealthList, setShipHealthList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refreshShipHealth = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}getAllShipsHealthList`);
      if (!res.ok) throw new Error("Failed to fetch ship health");
      const data = await res.json();
      setShipHealthList(data);
    } catch (err) {
      console.error('Failed to fetch ship health:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshShipHealth();
  }, []);

  return (
    <ShipsHealthContext.Provider value={{ shipHealthList, refreshShipHealth, loading, error }}>
      {children}
    </ShipsHealthContext.Provider>
  );
};
