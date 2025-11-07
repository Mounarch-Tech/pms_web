import React, { createContext, useState, useEffect } from "react";
import axios from "axios";

// Create Context
export const Ship_health_details_context = createContext();

// Create Provider Component
export const Ship_health_details_context_provider = ({ children }) => {

    const [shipsHealthList, setShipsHealthList] = useState(null)
    const API_BASE_URL = import.meta.env.VITE_API_URL;

    const fetchShipsHealth = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}getAllShipsHealthList`);
            setShipsHealthList(response.data);
        } catch (err) {
            console.error("Failed to fetch All ships health list :", err);
        }
    };

    // Fetch on mount
    useEffect(() => {
        fetchShipsHealth();
        // fetchAgencies();
    }, []);

    return (
        <Ship_health_details_context.Provider value={{ shipsHealthList, refreshShipsHealthList: fetchShipsHealth }}>
            {children}
        </Ship_health_details_context.Provider>
    );
};
