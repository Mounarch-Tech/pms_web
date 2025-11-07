import React, { createContext, useState, useEffect } from "react";
import axios from "axios";

// Create Context
export const CrewContext = createContext();

// Create Provider Component
export const CrewContextProvider = ({ children }) => {
  const [crewList, setCrewList] = useState([]);
  const [employeeList, setEmployeeList] = useState([]);

  const API_BASE_URL = import.meta.env.VITE_API_URL;

  // Fetch crew data from API
  const fetchCrewData = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}getCrewData`);
      setCrewList(response.data);
    } catch (err) {
      console.error("Failed to fetch Crew Data :", err);
    }
  };

  const fetchEmployeeList = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}getEmployeeList`);
      setEmployeeList(response.data);
    } catch (err) {
      console.error("Failed to fetch EMployee LIst Data :", err);
    }
  };

  // Fetch on mount
  useEffect(() => {
    fetchCrewData();
  }, []);

  // Fetch on mount
  useEffect(() => {
    fetchEmployeeList();
  }, []);

  return (
    <CrewContext.Provider value={{ crewList, refreshCrewList: fetchCrewData, employeeList, refreshEmployeeList: fetchEmployeeList }}>
      {children}
    </CrewContext.Provider>
  );
};
