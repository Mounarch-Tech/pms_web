import React, { createContext, useState, useEffect } from "react";
import axios from "axios";

// Create Context
export const JobFailedContext = createContext();

// Create Provider Component
export const JobFailedContextProvider = ({ children }) => {
    const [failedJobsList, setFailedJobsList] = useState([]);

    const API_BASE_URL = import.meta.env.VITE_API_URL;

    // Fetch job types from API
    const fetchFailedJobsList = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}getAllFailedJobs`);
            setFailedJobsList(response.data);
        } catch (err) {
            console.error("Failed to fetch Failed Jobs :", err);
        }
    };

    // Fetch on mount
    useEffect(() => {
        fetchFailedJobsList();
    }, []);

    return (
        <JobFailedContext.Provider value={{ failedJobsList, refreshFailedJobsList: fetchFailedJobsList }}>
            {children}
        </JobFailedContext.Provider>
    );
};
