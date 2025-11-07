import React, { createContext, useState, useEffect } from "react";
import axios from "axios";

// Create Context
export const DesignationContext = createContext();

// Create Provider Component
export const DesignationContextProvider = ({ children }) => {
    const [designationList, setDesignationList] = useState([]);

    const API_BASE_URL = import.meta.env.VITE_API_URL;

    // Fetch Designation data from API
    const fetchDesignationData = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}getDesignations`);
            setDesignationList(response.data);
        } catch (err) {
            console.error("Failed to fetch Designation List :", err);
        }
    };

    // Fetch on mount
    useEffect(() => {
        fetchDesignationData();
    }, []);

    return (
        <DesignationContext.Provider value={{ designationList, refreshDesignationList: fetchDesignationData }}>
            {children}
        </DesignationContext.Provider>
    );
};
