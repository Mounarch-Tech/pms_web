// contexts/ComponentTreeContext.js
import React, { createContext, useState, useEffect } from "react";
import axios from "axios";

export const Functionality_context = createContext();

export const Functionality_context_Provider = ({ children }) => {
    const [isNewJCDClicked, setIsNewJCDClicked] = useState(false)
    const [isViewJCDClicked, setIsViewJCDClicked] = useState(false)
    const [isActiveJobsClicked, setIsActiveJobsClicked] = useState(false)
    const [isCompletedJobsClicked, setIsCompletedJobsClicked] = useState(false)
    const [isUpcomingJobsClicked, setIsUpcomingJobsClicked] = useState(false)
    return (
        <Functionality_context.Provider
            value={{
                setIsNewJCDClicked, setIsViewJCDClicked, setIsActiveJobsClicked, setIsCompletedJobsClicked, setIsUpcomingJobsClicked,
                isNewJCDClicked, isViewJCDClicked, isActiveJobsClicked, isCompletedJobsClicked, isUpcomingJobsClicked
            }}>
            {children}
        </Functionality_context.Provider>
    );
};