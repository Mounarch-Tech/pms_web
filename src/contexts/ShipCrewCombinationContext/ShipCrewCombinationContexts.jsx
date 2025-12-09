import React, { createContext, useState, useEffect } from 'react';

const API_BASE = import.meta.env.VITE_API_URL;

export const ShipCrewCombinationContext = createContext({
  crewData: [],
  refreshCrewData: () => { },
  loading: false,
  error: null,
});

export const ShipCrewCombinationProvider = ({ children }) => {
  const [crewData, setCrewData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refreshCrewData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}getAllocationsByShip`);
      if (!res.ok) throw new Error("Failed to fetch crew data");
      const data = await res.json();
      setCrewData(data);
    } catch (err) {
      console.error('Failed to fetch crew data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshCrewData();
  }, []);

  return (
    <ShipCrewCombinationContext.Provider value={{ crewData, refreshCrewData, loading, error }}>
      {children}
    </ShipCrewCombinationContext.Provider>
  );
};
