import React, { createContext, useState, useEffect } from 'react';

const API_BASE = import.meta.env.VITE_API_URL;

export const OfficeStaffCombination_Context = createContext({
  officeStaffList: [],
  refreshOfficeStaffList: () => { },
  loading: false,
  error: null,
});

export const OfficeStaffCombinationProvider = ({ children }) => {
  const [officeStaffList, setOfficeStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refreshOfficeStaffList = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}getAllOfficeStaffCombinationList`);
      if (!res.ok) throw new Error("Failed to fetch Office Staff List");
      const data = await res.json();
      setOfficeStaffList(data);
    } catch (err) {
      console.error('Failed to fetch Office Staff List:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshOfficeStaffList();
  }, []);

  return (
    <OfficeStaffCombination_Context.Provider value={{ officeStaffList, refreshOfficeStaffList, loading, error }}>
      {children}
    </OfficeStaffCombination_Context.Provider>
  );
};
