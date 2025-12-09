import React, { createContext, useState, useEffect } from "react";
import axios from "axios";

// Create Context
export const Third_sub_category_context = createContext();

// Create Provider Component
export const Third_sub_category_contextProvider = ({ children }) => {
    const [thirdSubCategoryList, setThirdSubCategoryList] = useState([]);

    const API_BASE_URL = import.meta.env.VITE_API_URL;

    // Fetch crew data from API
    const fetchThirdSubCategoryList = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}getAllThirdSubCategories`);
            setThirdSubCategoryList(response.data);
        } catch (err) {
            console.error("Failed to fetch Third sub category data in it frontend context :", err);
        }
    }

    useEffect(() => { fetchThirdSubCategoryList() }, [])

    return (
        <Third_sub_category_context.Provider value={{ thirdSubCategoryList, refreshThirdSubCategoryList: fetchThirdSubCategoryList }}>
            {children}
        </Third_sub_category_context.Provider>
    );
};
