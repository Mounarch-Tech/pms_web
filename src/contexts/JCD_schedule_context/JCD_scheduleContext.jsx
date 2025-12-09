import React, { createContext, useState, useEffect } from "react";
import axios from "axios";

// Create Context
export const JCD_scheduleContext = createContext();

// Create Provider Component
export const JCD_scheduleContextProvider = ({ children }) => {
  const [JCD_schedule_List, setJCD_schedule_List] = useState([]);

  const API_BASE_URL = import.meta.env.VITE_API_URL;

  // Fetch JCD schedule from API
  const fetchJCD_schedule = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}getJCDSchedule`);
      setJCD_schedule_List(response.data);
    } catch (err) {
      console.error("Failed to fetch JCD Schedules:", err);
    }
  };

  // Fetch on mount
  useEffect(() => {
    fetchJCD_schedule();
  }, []);

  return (
    <JCD_scheduleContext.Provider
      value={{
        JCD_schedule_List,
        refreshJCDSchedules: fetchJCD_schedule,
      }}
    >
      {children}
    </JCD_scheduleContext.Provider>
  );
};
// localhost