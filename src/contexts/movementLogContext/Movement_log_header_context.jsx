import React, { createContext, useState, useEffect } from "react";
import axios from "axios";

// Create Context
export const Movement_log_header_context = createContext();

// Create Provider Component
export const Movement_log_header_context_Provider = ({ children }) => {
    const [movement_log_header_list, setMovement_log_header_list] = useState([])
    const [movement_log_header_impacted_comp_full_heirarchy, setMovement_log_header_impacted_comp_full_heirarchy] = useState([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)

    const API_BASE_URL = import.meta.env.VITE_API_URL;

    // Fetch all logs from API
    const fetchAllMovementLogsHeader = async () => {
        try {
            setLoading(true)
            setError(null)
            const response = await axios.get(`${API_BASE_URL}getAllMovementLogHeaders`);
            setMovement_log_header_list(response.data);
        } catch (err) {
            console.error("Failed to fetch All movement logs header in its context :", err);
            setError("Failed to load movement logs")
        } finally {
            setLoading(false)
        }
    };

    // Fetch movement logs with applied component hierarchy
    const fetchMovementLogsWithAppliedHierarchy = async (mov_log_id, ship_id = null) => {
        try {
            setLoading(true)
            setError(null)

            // FIX: Construct URL correctly with parameters
            let url = `${API_BASE_URL}getMovementLogWithAppliedCompHeirarchy/${mov_log_id}`;

            // Add ship_id as query parameter if provided
            if (ship_id) {
                url += `?ship_id=${ship_id}`;
            }

            console.log('Fetching movement log hierarchy from:', url);

            const response = await axios.get(url);

            // FIX: Return the data directly instead of setting state
            // This allows components to use the data as needed
            return response.data;
        } catch (err) {
            console.error("Failed to fetch movement logs with applied hierarchy:", err);
            setError("Failed to load component hierarchy")
            return null;
        } finally {
            setLoading(false)
        }
    };

    // Fetch single movement log with applied hierarchy
    const fetchMovementLogWithAppliedHierarchy = async (mov_log_id, ship_id = null) => {
        try {
            let url = `${API_BASE_URL}getMovementLogWithAppliedCompHeirarchy/${mov_log_id}`;

            // Add ship_id as query parameter if provided
            if (ship_id) {
                url += `?ship_id=${ship_id}`;
            }

            console.log('Fetching single movement log hierarchy from:', url);

            const response = await axios.get(url);
            return response.data;
        } catch (err) {
            console.error("Failed to fetch movement log with applied hierarchy:", err);
            throw err;
        }
    };

    // Fetch movement logs by ship
    const fetchMovementLogsByShip = async (ship_id) => {
        try {
            const response = await axios.get(`${API_BASE_URL}getMovementLogsByShip/${ship_id}`);
            return response.data;
        } catch (err) {
            console.error("Failed to fetch movement logs by ship:", err);
            throw err;
        }
    };

    // Fetch movement log with components
    const fetchMovementLogWithComponents = async (mov_log_id, ship_id = null) => {
        try {
            let url = `${API_BASE_URL}getMovementLogWithComponents/${mov_log_id}`;

            if (ship_id) {
                url += `?ship_id=${ship_id}`;
            }

            const response = await axios.get(url);
            return response.data;
        } catch (err) {
            console.error("Failed to fetch movement log with components:", err);
            throw err;
        }
    };

    // Refresh all data
    const refreshAllData = async (ship_id = null) => {
        await Promise.all([
            fetchAllMovementLogsHeader(),
            fetchMovementLogsWithAppliedHierarchy(ship_id)
        ]);
    };

    // Fetch on mount
    useEffect(() => {
        fetchAllMovementLogsHeader();
        // Don't fetch hierarchy by default - let components request it when needed
    }, []);

    return (
        <Movement_log_header_context.Provider value={{
            movement_log_header_list,
            movement_log_header_impacted_comp_full_heirarchy,
            loading,
            error,
            refreshMovement_log_header_list: fetchAllMovementLogsHeader,
            refreshMovementLogsWithHierarchy: fetchMovementLogsWithAppliedHierarchy,
            getMovementLogWithHierarchy: fetchMovementLogWithAppliedHierarchy,
            getMovementLogsByShip: fetchMovementLogsByShip,
            getMovementLogWithComponents: fetchMovementLogWithComponents,
            refreshAllData
        }}>
            {children}
        </Movement_log_header_context.Provider>
    );
};