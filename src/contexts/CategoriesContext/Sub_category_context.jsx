import React, { createContext, useState, useEffect } from "react";
import axios from "axios";

// Create Context
export const Sub_category_context = createContext();

// Create Provider Component
export const Sub_category_contextProvider = ({ children }) => {
    const [subCategoryList, setSubCategoryList] = useState([]);

    const API_BASE_URL = import.meta.env.VITE_API_URL;

    // Fetch crew data from API
    const fetchSubCategoryList = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}getAllSubCategories`);
            setSubCategoryList(response.data);
        } catch (err) {
            console.error("Failed to fetch sub category data in it frontend context :", err);
        }
    }

    useEffect(()=>{fetchSubCategoryList()}, [])

    return (
        <Sub_category_context.Provider value={{ subCategoryList, refreshSubCategoryList: fetchSubCategoryList }}>
            {children}
        </Sub_category_context.Provider>
    );
};
