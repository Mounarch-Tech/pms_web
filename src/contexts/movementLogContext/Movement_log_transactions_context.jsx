import React, { createContext, useState, useEffect } from "react";
import axios from "axios";

// Create Context
export const Movement_log_transactions_context = createContext();

// Create Provider Component
export const Movement_log_transactions_context_Provider = ({ children }) => {
    const [movement_log_transaction_list, setMovement_log_transaction_list] = useState([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)

    const API_BASE_URL = import.meta.env.VITE_API_URL;

    // Fetch all logs from API
    const fetchAllMovementLogTransactions = async () => {
        try {
            setLoading(true)
            setError(null)
            const response = await axios.get(`${API_BASE_URL}getAllMovementTransactionLogs`);
            setMovement_log_transaction_list(response.data);
        } catch (err) {
            console.error("Failed to fetch All movement logs transactions in its context :", err);
            setError("Failed to load movement transactions")
        } finally {
            setLoading(false)
        }
    };

    // Fetch transactions by month and year
    const fetchTransactionsByMonthYear = async (month_year) => {
        try {
            const response = await axios.get(`${API_BASE_URL}getMovementTransactionsByMonth/${month_year}`);
            return response.data;
        } catch (err) {
            console.error("Failed to fetch transactions by month:", err);
            throw err;
        }
    };

    // Fetch transaction by ID
    const fetchTransactionById = async (SMLTA_ID) => {
        try {
            const response = await axios.get(`${API_BASE_URL}getMovementTransaction/${SMLTA_ID}`);
            return response.data;
        } catch (err) {
            console.error("Failed to fetch transaction by ID:", err);
            throw err;
        }
    };

    // Fetch latest transaction by movement log ID
    const fetchLatestTransactionByMovLogId = async (mov_log_id) => {
        try {
            // You might need to add this endpoint to your backend
            const response = await axios.get(`${API_BASE_URL}getLatestMovementTransaction/${mov_log_id}`);
            return response.data;
        } catch (err) {
            console.error("Failed to fetch latest transaction:", err);
            throw err;
        }
    };

    // Fetch on mount
    useEffect(() => {
        fetchAllMovementLogTransactions();
    }, []);

    return (
        <Movement_log_transactions_context.Provider value={{
            movement_log_transaction_list,
            loading,
            error,
            refreshMovement_log_transactions_list: fetchAllMovementLogTransactions,
            getTransactionsByMonthYear: fetchTransactionsByMonthYear,
            getTransactionById: fetchTransactionById,
            getLatestTransactionByMovLogId: fetchLatestTransactionByMovLogId
        }}>
            {children}
        </Movement_log_transactions_context.Provider>
    );
};