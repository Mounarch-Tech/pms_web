import React, { createContext, useState, useEffect } from "react";
import axios from "axios";

// Create Context
export const JobTypeContext = createContext();

// Create Provider Component
export const JobTypeProvider = ({ children }) => {
  const [jobTypesList, setJobTypesList] = useState([]);
  const [jobTypesIDandNameList, setJobTypesIDandNameList] = useState([]);

  const API_BASE_URL = import.meta.env.VITE_API_URL;

  // Fetch job types from API
  const fetchJobTypes = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}getJobTypes`);
      setJobTypesList(response.data);
    } catch (err) {
      console.error("Failed to fetch job types:", err);
    }
  };

  const fetchJobTypesHaveIDandTypeName = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}getAllJobTypesHaveIDandTypeName`);
      setJobTypesIDandNameList(response.data);
    } catch (err) {
      console.error("Failed to fetch job types:", err);
    }
  };

  useEffect(() => {
    fetchJobTypes();
    fetchJobTypesHaveIDandTypeName();
  }, []);

  return (
    <JobTypeContext.Provider
      value={{
        jobTypesList,
        refreshJobTypes: fetchJobTypes,
        jobTypesIDandNameList,
        refreshJobTypesIDandName: fetchJobTypesHaveIDandTypeName
      }}
    >
      {children}
    </JobTypeContext.Provider>
  );
};

