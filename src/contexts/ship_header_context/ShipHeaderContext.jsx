import React, { createContext, useState, useEffect, useContext } from "react";
import axios from "axios";
import { UserAuthContext } from "../userAuth/UserAuthContext";
import { OfficeStaffCombination_Context } from "../OfficeStaffCombinationContext/OfficeStaffCombination_Context";

// Create Context
export const ShipHeaderContext = createContext();

// Create Provider Component
export const ShipHeaderProvider = ({ children }) => {
  const [shipsList, setShipsList] = useState([]);
  const [agencyList, setAgencyList] = useState([]);
  const [shipData, setShipData] = useState([]);
  const [shipsIDandNameList, setShipsIDandNameList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const { user } = useContext(UserAuthContext);
  const { officeStaffList } = useContext(OfficeStaffCombination_Context);

  const API_BASE_URL = import.meta.env.VITE_API_URL;

  const fetchShips = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${API_BASE_URL}getAllShipsList`);

      setShipsList(response.data);
    } catch (err) {
      console.error("Failed to fetch All ships data:", err);
      setError("Failed to fetch ships list");
    } finally {
      setLoading(false);
    }
  };

  const fetchAgencies = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}getVesselHeaderData`);
      setAgencyList(response.data);
    } catch (err) {
      console.error("Failed to fetch All Agencies List:", err);
    }
  };

  const fetchShipsIDandName = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}getShipsIDandName`);
      setShipsIDandNameList(response.data);
    } catch (err) {
      console.error("Failed to fetch ships ID and Name:", err);
    }
  };

  // Fetch ships when user changes
  useEffect(() => {
    if (user) {
      fetchShips();
      fetchAgencies();
    }
  }, [user]);

  return (
    <ShipHeaderContext.Provider
      value={{
        shipsList,
        setShipsList,
        refreshShipsList: fetchShips,
        agencyList,
        refreshAgencyList: fetchAgencies,
        shipsIDandNameList,
        refreshShipsIDandName: fetchShipsIDandName,
        shipData,
        loading,
        error,
      }}
    >
      {children}
    </ShipHeaderContext.Provider>
  );
};
