import React, { createContext, useState, useEffect } from 'react';

const API_BASE = import.meta.env.VITE_API_URL;

export const UserContexts = createContext();

export const UsersProvider = ({ children }) => {
  const [usersList, setUsersList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refreshUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}getAllUsers`);
      if (!res.ok) throw new Error("Failed to fetch users");
      const data = await res.json();
      setUsersList(data);
    } catch (err) {
      console.error('Failed to fetch users:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUsers();
  }, []);

  return (
    <UserContexts.Provider value={{ usersList, refreshUsers, loading, error }}>
      {children}
    </UserContexts.Provider>
  );
};
