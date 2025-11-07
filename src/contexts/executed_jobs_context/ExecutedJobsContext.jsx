import React, { createContext, useState, useEffect } from "react";
import axios from "axios";

// Create Context
export const ExecutedJobsContext = createContext();

// Create Provider Component
export const ExecutedJobsContextProvider = ({ children }) => {
  const [executedJobList, setExecutedJobList] = useState([]);

  const API_BASE_URL = import.meta.env.VITE_API_URL;

  // Fetch job types from API
  const fetchExecutedJobs = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}getAllExecutedJobs`);
      setExecutedJobList(response.data);
    } catch (err) {
      console.error("Failed to fetch executed Jobs :", err);
    }
  };

  // Fetch on mount
  useEffect(() => {
    fetchExecutedJobs();
  }, []);

  return (
    <ExecutedJobsContext.Provider value={{ executedJobList, refreshExecutedJobs: fetchExecutedJobs }}>
      {children}
    </ExecutedJobsContext.Provider>
  );
};
