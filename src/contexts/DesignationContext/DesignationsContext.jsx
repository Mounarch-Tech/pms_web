import React, { createContext, useState, useEffect, useContext } from 'react';
import { DepartmentsContext } from '../DepartmentContext/DepartmentsContext';

const API_BASE = import.meta.env.VITE_API_URL;

export const DesignationsContext = createContext({
    designationsList: [],
    refreshDesignations: () => { },
    loading: false,
    error: null,
});

export const DesignationsProvider = ({ children }) => {
    const { departmentsList } = useContext(DepartmentsContext);
    const [designationsList, setDesignationsList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const refreshDesignations = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`${API_BASE}getDesignations`);
            if (!res.ok) throw new Error("Failed to fetch designations");
            const data = await res.json();
            console.log('data of designations : ', data)
            setDesignationsList(data);
        } catch (err) {
            console.error('Failed to fetch designations:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (departmentsList.length > 0) refreshDesignations();
    }, [departmentsList]);

    return (
        <DesignationsContext.Provider value={{ designationsList, refreshDesignations, loading, error }}>
            {children}
        </DesignationsContext.Provider>
    );
};
