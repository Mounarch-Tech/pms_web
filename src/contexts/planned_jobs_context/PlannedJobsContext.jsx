import React, { createContext, useState, useEffect } from "react";
import axios from "axios";

// Create Context
export const PlannedJobsContext = createContext();

// Create Provider Component
export const PlannedJobsProvider = ({ children }) => {
  const [plannedJobList, setPlannedJobList] = useState([]);

  const activeJobStatusMap = {
    1: "Generated",
    2: "Not Acknowledged",
    3: "Acknowledged",
    4: "Executed",
    5: "First Verification Done",
    6: "Second Verification Done",
    7: "Extension Requested",
    8: "Extension Accepted"
  };


  const API_BASE_URL = import.meta.env.VITE_API_URL;

  // Fetch job types from API
  const fetchPlannedJobs = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}getPlannedJobs`);
      setPlannedJobList(response.data);
    } catch (err) {
      console.error("Failed to fetch Planned Jobs :", err);
    }
  };

  // Fetch on mount
  useEffect(() => {
    fetchPlannedJobs();
  }, []);

  return (
    <PlannedJobsContext.Provider value={{ plannedJobList, refreshPlannedJobs: fetchPlannedJobs, activeJobStatusMap }}>
      {children}
    </PlannedJobsContext.Provider>
  );
};
