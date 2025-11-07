import React, { createContext, useState, useEffect } from "react";
import axios from "axios";

// Create Context
export const Movement_log_transactions_context = createContext();

// Create Provider Component
export const Movement_log_transactions_context_Provider = ({ children }) => {
    const [movement_log_transaction_list, setMovement_log_transaction_list] = useState([])
    const API_BASE_URL = import.meta.env.VITE_API_URL;

    // Fetch all logs from API
    const fetchAllMovementLogTransactions = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}getAllMovementTransactionLogs`);
            setMovement_log_transaction_list(response.data);
        } catch (err) {
            console.error("Failed to fetch All movement logs transactions in its context :", err);
        }
    };

    // Fetch on mount
    useEffect(() => {
        fetchAllMovementLogTransactions();
    }, []);

    return (
        <Movement_log_transactions_context.Provider value={{ movement_log_transaction_list, refreshMovement_log_transactions_list: fetchAllMovementLogTransactions }}>
            {children}
        </Movement_log_transactions_context.Provider>
    );
};
