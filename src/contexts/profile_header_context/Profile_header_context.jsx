import React, { createContext, useState, useEffect } from "react";
import axios from "axios";

// Create Context
export const Profile_header_context = createContext();

// Create Provider Component
export const Profile_header_contextProvider = ({ children }) => {

    const API_BASE_URL = import.meta.env.VITE_API_URL;

    const [profiles, setProfiles] = useState([])
    let formIDs = []
    let processIDs = []

    const fetchAllProfiles = async () => {
        try {
            await axios.get(`${API_BASE_URL}getAllProfiles`)
                .then(res => {
                    // console.log('profile res :: ', res)
                    setProfiles(res.data.data);
                    (res.data.data).map((pf) => {
                        formIDs.push((pf.form_ids)?.split(','))
                        // console.log('formIDs : ', formIDs)

                        processIDs.push((pf.process_ids)?.split(','))
                        // console.log('processIDs : ', processIDs)
                    })
                })
        }
        catch (err) {
            console.error("Failed to fetch Profile List in Profile Context :", err);
        }
    }

    useEffect(() => {
        fetchAllProfiles()
    }, [])

    return (
        <Profile_header_context.Provider value={{ profiles, formIDs, processIDs, refreshProfiles: fetchAllProfiles }}>
            {children}
        </Profile_header_context.Provider>
    );
};
// console.log