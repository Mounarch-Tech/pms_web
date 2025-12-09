import React, { createContext, useState, useEffect } from 'react';

const API_BASE = import.meta.env.VITE_API_URL;

export const DepartmentsContext = createContext();

export const DepartmentsProvider = ({ children }) => {
    const [departmentsList, setDepartmentsList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const refreshDepartments = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`${API_BASE}getDepartments`);
            if (!res.ok) throw new Error("Failed to fetch departments");
            const data = await res.json();
            // console.log('data : ', data)
            setDepartmentsList(data);
        } catch (err) {
            console.error('Failed to fetch departments:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        refreshDepartments();
    }, []);

    return (
        <DepartmentsContext.Provider value={{ departmentsList, refreshDepartments, loading, error }}>
            {children}
        </DepartmentsContext.Provider>
    );
};
// localhost