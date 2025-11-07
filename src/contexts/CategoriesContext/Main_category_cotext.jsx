import React, { createContext, useState, useEffect } from "react";
import axios from "axios";

// Create Context
export const Main_category_cotext = createContext();

// Create Provider Component
export const Main_category_cotextProvider = ({ children }) => {
    const [mainCategoryList, setMainCategoryList] = useState([]);

    const API_BASE_URL = import.meta.env.VITE_API_URL;

    // Fetch crew data from API
    const fetchMainCategoryList = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}getAllMainCategories`);
            console.log('response : ', response)
            setMainCategoryList(response.data);
        } catch (err) {
            console.error("Failed to fetch Crew Data :", err);
        }
    }

    useEffect(() => {
        fetchMainCategoryList()
    }, [])

    return (
        <Main_category_cotext.Provider value={{ mainCategoryList, refreshMainCategoryList: fetchMainCategoryList }}>
            {children}
        </Main_category_cotext.Provider>
    );
};
