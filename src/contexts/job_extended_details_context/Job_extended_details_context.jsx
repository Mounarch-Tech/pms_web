import React, { createContext, useState, useEffect } from "react";
import axios from "axios";

// Create Context
export const Job_extended_details_context = createContext();

// Create Provider Component
export const Job_extended_details_context_Provider = ({ children }) => {
  const [extendedJobsList, setExtendedJobsList] = useState([]);

  const API_BASE_URL = import.meta.env.VITE_API_URL;

  // Fetch job types from API
  const fetchExtendedJobsList = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}getAllExtendedJobs`);
      setExtendedJobsList(response.data);
    } catch (err) {
      console.error("Failed to fetch Extended Jobs :", err);
    }
  };

  // Fetch on mount
  useEffect(() => {
    fetchExtendedJobsList();
  }, []);

  return (
    <Job_extended_details_context.Provider value={{ extendedJobsList, refreshExtendedJobsList: fetchExtendedJobsList }}>
      {children}
    </Job_extended_details_context.Provider>
  );
};
