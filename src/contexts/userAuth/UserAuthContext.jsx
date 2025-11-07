import React, { createContext, useEffect, useState } from 'react';

export const UserAuthContext = createContext();

export const UserAuthProvider = ({ children }) => {
    // const [user] = useState({
    //     EHA_ID: "EHA_0001",
    //     ship_id: 'SHA_0002',
    //     emp_no: "ENG_0001",
    //     emp_name: "Lokesh Wagh",
    //     emp_email: "lokeshwagh5072@gmail.com",
    //     emp_mob1: "9028944707",
    //     access_code: "LW0507",
    //     emp_dob: "2002-07-05",
    //     emp_doj: "2020-05-07",
    //     emp_desg: "DESG_0003",
    //     reporting_to: null,
    //     DEPT_ID: "DEPT_003",
    //     inserted_on: "2025-07-21 00:00:00",
    //     emp_status: 1,
    //     emp_type: 2,
    //     profile_ids: "PROFILE_0001"
    // });

    const [user, setUser] = useState(null);

    return (
        <UserAuthContext.Provider value={{ user, setUser }}>
            {children}
        </UserAuthContext.Provider>
    );
};