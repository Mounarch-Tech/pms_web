
import React, { createContext, useState, useEffect } from "react";
import axios from "axios";

// Create Context
export const JcdShipCombinationContext = createContext();

// Create Provider Component
export const JcdShipCombinationContextProvider = ({ children }) => {
  const [JCD_ship_combinations_list, setJCD_ship_combinations_list] = useState([]);
  const [JCD_ship_wise_group_combinations_list, setJCD_ship_wise_group_combinations_list] = useState([]);

  const API_BASE_URL = import.meta.env.VITE_API_URL;

  // Fetch JCD schedule from API
  const fetchJCD_ship_combinations = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}getAllJCDsFromCombinationAll`);
      setJCD_ship_combinations_list(response.data);
    } catch (err) {
      console.error("Failed to fetch JCD Schedules:", err);
    }
  };

  // Fetch JCD schedule from API
  const fetchJCD_ship_wise_group_combinations = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}getAllJCDsShipWiseGroupFromCombinationAll`);
      setJCD_ship_wise_group_combinations_list(response.data);
    } catch (err) {
      console.error("Failed to fetch JCD Schedules:", err);
    }
  };

  // Fetch on mount
  useEffect(() => {
    fetchJCD_ship_combinations();
    fetchJCD_ship_wise_group_combinations()
  }, []);

  return (
    <JcdShipCombinationContext.Provider
      value={{
        JCD_ship_combinations_list,
        refreshJCD_ship_combinations_list: fetchJCD_ship_combinations,
        JCD_ship_wise_group_combinations_list,
        RefreshJCD_ship_wise_group_combinations: fetchJCD_ship_wise_group_combinations
      }}
    >
      {children}
    </JcdShipCombinationContext.Provider>
  );
};
// localhost