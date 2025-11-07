import React, { createContext, useState, useEffect, useContext } from 'react';
import { UserAuthContext } from '../userAuth/UserAuthContext';

const API_BASE = import.meta.env.VITE_API_URL;

export const ShipsContext = createContext({
  shipsList: [],
  refreshShips: () => { },
  loading: false,
  error: null,
});

export const ShipsProvider = ({ children }) => {
  const { user } = useContext(UserAuthContext)
  const [shipsList, setShipsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refreshShips = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}getShipsIDandName`);
      // console.log('res :: ', res)
      if (!res.ok) throw new Error("Failed to fetch ships");
      const data = await res.json();


      setShipsList([{ SHA_ID: 'office', ship_name: 'Office' }, ...data]);
    } catch (err) {
      console.error('Failed to fetch ships:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshShips();
  }, []);

  return (
    <ShipsContext.Provider value={{ shipsList, refreshShips, loading, error }}>
      {children}
    </ShipsContext.Provider>
  );
};
