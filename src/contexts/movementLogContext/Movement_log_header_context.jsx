import React, { createContext, useState, useEffect } from "react";
import axios from "axios";

// Create Context
export const Movement_log_header_context = createContext();

// Create Provider Component
export const Movement_log_header_context_Provider = ({ children }) => {
    const [movement_log_header_list, setMovement_log_header_list] = useState([])
    const [movement_log_header_impacted_comp_full_heirarchy, setMovement_log_header_impacted_comp_full_heirarchy] = useState([])
    const API_BASE_URL = import.meta.env.VITE_API_URL;

    // Fetch all logs from API
    const fetchAllMovementLogsHeader = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}getAllMovementLogHeaders`);
            setMovement_log_header_list(response.data);
        } catch (err) {
            console.error("Failed to fetch All movement logs header in its context :", err);
        }
    };
    
    const fetchAllImpacedComponents = async () =>{
        try {
            const response = await axios.get(`${API_BASE_URL}getAllMovementLogsWithOnlyAppliedCompHeirarchy`);
            setMovement_log_header_impacted_comp_full_heirarchy(response.data);
        } catch (err) {
            console.error("Failed to fetch All movement logs header in its context :", err);
        }
    }

    // Fetch on mount
    useEffect(() => {
        fetchAllMovementLogsHeader();
        fetchAllImpacedComponents();
    }, []);

    return (
        <Movement_log_header_context.Provider value={{ movement_log_header_list, refreshMovement_log_header_list: fetchAllMovementLogsHeader, movement_log_header_impacted_comp_full_heirarchy, refreshMovement_log_header_impacted_comp_full_heirarchy : fetchAllImpacedComponents }}>
            {children}
        </Movement_log_header_context.Provider>
    );
};
