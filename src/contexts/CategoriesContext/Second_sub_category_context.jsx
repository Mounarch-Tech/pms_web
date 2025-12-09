import React, { createContext, useState, useEffect } from "react";
import axios from "axios";

// Create Context
export const Second_sub_category_context = createContext();

// Create Provider Component
export const Second_sub_category_contextProvider = ({ children }) => {
    const [secondSubCategoryList, setSecondSubCategoryList] = useState([]);

    const API_BASE_URL = import.meta.env.VITE_API_URL;

    // Fetch crew data from API
    const fetchSecondSubCategoryList = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}getAllSecondSubCategories`);
            setSecondSubCategoryList(response.data);
        } catch (err) {
            console.error("Failed to fetch Second sub category data in it frontend context :", err);
        }
    }

    useEffect(()=>{fetchSecondSubCategoryList()}, [])

    return (
        <Second_sub_category_context.Provider value={{ secondSubCategoryList, refreshSecondSubCategoryList: fetchSecondSubCategoryList }}>
            {children}
        </Second_sub_category_context.Provider>
    );
};
