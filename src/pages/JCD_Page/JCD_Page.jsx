// pages/JCD_page.jsx
import React, { useContext, useEffect, useState } from 'react';
import axios from 'axios';

// Components
import TempComponentHierarchy from '../temp_component_heirarchy/Temp_component_heirarchy';
import JcdCreationForm from '../../components/JCD_components/JCD_creation_form';
import AfterComponentSelectionFunctionalities from '../../components/JCD_components/After_Component_Selection_Functionalities';

// Contexts
import { ComponentTreeContext } from '../../contexts/ComponentTreeContext/ComponentTreeContext';
import { Functionality_context } from '../../contexts/functionality_context/Functionality_context'; // Note: Consider renaming context file for consistency
import { UserAuthContext } from '../../contexts/userAuth/UserAuthContext';
import { ShipHeaderContext } from '../../contexts/ship_header_context/ShipHeaderContext';
import { Profile_header_context } from '../../contexts/profile_header_context/Profile_header_context'; // Note: Consider renaming context file for consistency
import { PlannedJobsContext } from '../../contexts/planned_jobs_context/PlannedJobsContext';

// Styles
import './JCD_page.css';

const JCDPage = () => {
    // --- Contexts ---
    const { selectedNode, selectNode } = useContext(ComponentTreeContext);
    const { plannedJobList, refreshPlannedJobs } = useContext(PlannedJobsContext);
    const { profiles } = useContext(Profile_header_context);
    const {
        isNewJCDClicked,
        isViewJCDClicked,
        isActiveJobsClicked,
        isCompletedJobsClicked,
        isUpcomingJobsClicked,
        setIsNewJCDClicked,
        setIsViewJCDClicked,
        setIsActiveJobsClicked,
        setIsCompletedJobsClicked,
        setIsUpcomingJobsClicked
    } = useContext(Functionality_context);

    const { user } = useContext(UserAuthContext);
    const { shipsList } = useContext(ShipHeaderContext);

    const [clicked_JCD_data, setClicked_JCD_data] = useState(null)

    // --- Local State ---
    const [shipName, setShipName] = useState(null);
    const [selectedShipID, setSelectedShipID] = useState(null);
    const [userJCDAccessFormID, setUserJCDAccessFormID] = useState([]);
    const [userJCDAccessProcessIDs, setUserJCDAccessProcessIDs] = useState([]);
    const [userProfileData, setUserProfileData] = useState([]);
    const [jcdsOnComponent, setJcdsOnComponent] = useState([]); // State for fetched JCDs

    const [toggelVeiwJobsOnJCD, setToggelVeiwJobsOnJCD] = useState('none')

    // --- Environment Variables ---
    const API_BASE_URL = import.meta.env.VITE_API_URL;

    // --- Effects ---

    // Reset context flags on component mount
    useEffect(() => {
        refreshPlannedJobs()
        selectNode(null);
        setIsActiveJobsClicked(false);
        setIsCompletedJobsClicked(false);
        setIsNewJCDClicked(false);
        setIsUpcomingJobsClicked(false);
        setIsViewJCDClicked(false);
    }, []);

    useEffect(() => {
        refreshPlannedJobs()
    }, [selectedShipID]);

    // Log ship name when it changes
    useEffect(() => {
        // console.log("Ship ID Updated:", selectedShipID);
    }, [selectedShipID]);

    // Fetch JCDs whenever the selected component node changes
    useEffect(() => {
        const fetchJCDsByShipAndComponent = async () => {
            if (!shipName || !selectedNode) return; // Ensure ship and component are selected

            try {
                const url = `${API_BASE_URL}getJCDsByShipID/${shipName.SHA_ID}/${selectedNode.data.CHA_ID}/${selectedNode.data.SCHA_ID}/${selectedNode.data.SSCHA_ID}/${selectedNode.data.TSCHA_ID}`;
                console.log("Fetching JCDs with URL:", url); // Optional: Log the URL for debugging
                const response = await axios.get(url);
                console.log("Fetched JCDs:", response.data);
                setJcdsOnComponent(response.data || []); // Ensure state is always an array
            } catch (err) {
                console.error('Error while fetching JCDs in JCD_Page for view JCDs:', err);
                setJcdsOnComponent([]); // Reset on error
            }
        };

        fetchJCDsByShipAndComponent();
    }, [selectedNode, shipName]); // Depend on selectedNode and shipName

    // Initial data fetching on component mount
    useEffect(() => {
        const fetchData = async () => {
            if (user?.EHA_ID) {
                await fetchShipIDByEmployeeID(user.EHA_ID);
            }
            if (user) {
                trackFormProcessAccessibility(user);
            }
        };

        fetchData();
    }, [user]); // Depend only on user

    // --- Helper Functions ---

    /**
     * Sets the full ship object in state based on its ID.
     * @param {string|number} shipID - The unique identifier of the ship.
     */
    const setShipNameByID = (shipID) => {
        const foundShip = shipsList.find(ship => ship.SHA_ID === shipID);
        if (foundShip) {
            setShipName(foundShip);
        } else {
            console.warn(`No ship found with ID: ${shipID}`);
        }
    };

    /**
     * Fetches the assigned ship ID for a given employee ID.
     * @param {string|number} empID - The employee's unique identifier.
     */
    const fetchShipIDByEmployeeID = async (empID) => {
        if (!empID) return;
        try {
            const response = await axios.get(`http://localhost:3000/api/getShipIDbyEmployeeID/${empID}`);
            const shipData = response.data?.[0];
            if (shipData?.SHA_ID) {
                // console.log("Fetched Ship ID for Employee:", shipData.SHA_ID);
                setShipNameByID(shipData.SHA_ID);
            } else {
                console.warn("No ship data found for employee ID:", empID);
            }
        } catch (err) {
            console.error("Error fetching ship ID for employee:", empID, err.message);
        }
    };

    /**
     * Determines the user's accessible JCD forms and processes based on their profile.
     * @param {Object} loggedInUser - The user object containing profile information.
     */
    const trackFormProcessAccessibility = (loggedInUser) => {
        const profileIDs = loggedInUser.profile_ids?.split(',') || [];
        const matchedProfiles = profileIDs
            .map(id => profiles.find(profile => profile.PROFILE_ID === id))
            .filter(Boolean); // Remove undefined entries

        // console.log('User Profile Data:', matchedProfiles);

        if (matchedProfiles.length > 0) {
            const firstProfile = matchedProfiles[0];
            const formIDs = firstProfile.form_ids?.split(',').filter(id => id.includes('JCD')) || [];
            const processIDs = firstProfile.process_ids?.split(',').filter(id => id.includes('JCD')) || [];

            setUserJCDAccessFormID(formIDs);
            setUserJCDAccessProcessIDs(processIDs);
            setUserProfileData(matchedProfiles);
        } else {
            console.warn("No valid user profile data found for:", loggedInUser.emp_name);
            setUserProfileData([]); // Explicitly set empty array if no profiles
        }
    };

    // --- Render Logic ---
    const renderViewJcdsTable = () => {
        if (!jcdsOnComponent || jcdsOnComponent.length === 0) {
            return <p style={{ textAlign: 'center', color: '#94a3b8', fontStyle: 'italic' }}>
                No JCDs found for this component.
            </p>
        }

        return (
            <div id="view-jcds-on-comp-table" style={{ width: '100%' }}>
                <table>
                    <thead>
                        <tr>
                            <th>Criticality</th>
                            <th>JCD Category</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {jcdsOnComponent.map((jcd, index) => (
                            <tr key={index} onClick={() => { handleClickOnVeiwJCD_Item(jcd) }}> {/* Consider using a unique ID from jcd object if available */}
                                <td>{jcd.criticality === 1 ? "Critical" : "Non Critical"}</td>
                                <td>{jcd.jcd_category === 1 ? "Servicable" : "Replacable"}</td> {/* Note: Typo in API response? */}
                                <td>{jcd.status === 1 ? "Active" : "Inactive"}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    };

    // Called when click on jcd in veiw jcd Module
    const handleClickOnVeiwJCD_Item = (clicked_JCD_data) => {
        if (clicked_JCD_data) {

            console.log(clicked_JCD_data)
            // console.log(clicked_JCD_data)
            setClicked_JCD_data(clicked_JCD_data);

            setIsViewJCDClicked(false)
            setIsNewJCDClicked(true)
        }
    }

    // function copySharedFields(source, target) {
    //     const result = { ...target }; // start with target

    //     for (const key in source) {
    //         if (key in target) {
    //             result[key] = source[key];
    //         }
    //     }

    //     return result;
    // }


    return (
        <div className="jcd-page-layout">
            {/* Conditional rendering based on user profile data */}
            {userProfileData && userProfileData.length > 0 ? (
                <>
                    {/* Left Side Container */}
                    <div id="left-side-container">
                        {/* Ship Selection for Office Users (emp_type 2) */}
                        {user.emp_type === 2 && (
                            <div id="select-ships-container">
                                <select
                                    name="ships-selection"
                                    id="ship-selection"
                                    value={selectedShipID || ""} // Controlled component
                                    onChange={(e) => setSelectedShipID(e.target.value)}
                                >
                                    <option value="">Select Ship</option>
                                    {shipsList.map((ship, index) => (
                                        <option key={index} value={ship.SHA_ID}>
                                            {ship.ship_name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {/* Ship Info for Ship Users (emp_type 1 or 3) */}
                        {(user.emp_type === 1 || user.emp_type === 3) && shipName && (
                            <>
                                <div id="select-ships-container">
                                    <select name="ships-selection" id="ship-selection" disabled>
                                        <option value={shipName.SHA_ID}>You are On: {shipName.ship_name}</option>
                                    </select>
                                </div>
                                <div className="tree-section">
                                    <h2>🔧 Component Hierarchy</h2>
                                    <TempComponentHierarchy setIsCheckActive={false} componentTreeWantByWhichComp={'JCD_Page'} />
                                </div>
                            </>
                        )}

                        {/* Component Tree (shown for Office users after selection OR for Ship users) */}
                        {(selectedShipID && (user.emp_type == 2 && shipName)) && (
                            <div className="tree-section">
                                <h2>🔧 Component Hierarchy</h2>
                                <TempComponentHierarchy />
                            </div>
                        )}
                    </div>

                    {/* Right Side - Forms and Functionalities */}
                    {shipName ? (
                        <div className="form-section">
                            {/* Functionalities shown after selecting a component */}
                            {selectedNode && (
                                <div id="After_Component_Selection_Functionalities" style={{ position: 'sticky', top: '0px', left: '0px', zIndex: '1' }}>
                                    <AfterComponentSelectionFunctionalities processIDs={userJCDAccessProcessIDs} />
                                </div>
                            )}

                            {/* New JCD Creation Form */}
                            {isNewJCDClicked && <JcdCreationForm selected_jcd_from_view_jcd_module={clicked_JCD_data} refreshClickedJcdData={setClicked_JCD_data} toggelVeiwJobsOnJCD={setToggelVeiwJobsOnJCD} />}

                            {/* View JCDs on Selected Component */}
                            {isViewJCDClicked && selectedNode && (
                                <div id="view-jcds-on-comp-main-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column' }}>
                                    <h2 id="active-jobs-header">View Jobs On Component :<br /> {selectedNode.data.label ? selectedNode.data.label : "Not Selected Any Component"} </h2>

                                    {renderViewJcdsTable()} {/* Use helper function for cleaner JSX */}

                                    <button onClick={(e) => {
                                        setIsActiveJobsClicked(true)
                                        setIsViewJCDClicked(false)
                                    }}>View Jobs</button>
                                </div>
                            )}

                            {/* Completed Jobs */}
                            {isCompletedJobsClicked && (
                                <div id="active-jobs-main-container">
                                    <h2 id="active-jobs-header">Completed Jobs On Component :<br /> {selectedNode.data.label ? selectedNode.data.label : "Not Selected Any Component"} </h2>

                                    {jcdsOnComponent && jcdsOnComponent.length > 0 ? (
                                        (() => {
                                            // Step 1: Get all JCD IDs that have at least one active job
                                            const completedJcdIds = new Set(
                                                plannedJobList
                                                    ?.filter(plJob => plJob.job_status == 4 && (plJob.SHA_ID == (selectedShipID ? selectedShipID : shipName.SHA_ID)))
                                                    .map(plJob => plJob.jcd_id)
                                                || []
                                            );

                                            // Step 2: Filter jcdsOnComponent to only those with active jobs
                                            const completedJcds = jcdsOnComponent.filter(jcd => {
                                                if (completedJcdIds.has(jcd.jcd_id)) {
                                                    return jcd
                                                }
                                            }
                                            );

                                            return completedJcds.length > 0 ? (
                                                <div id="active-jobs-table-container">
                                                    <table id="active-jobs-table">
                                                        <thead>
                                                            <tr>
                                                                <th scope="col">JCD ID</th>
                                                                <th scope="col">Job Type ID</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {completedJcds.map((jcd, index) => (
                                                                <tr key={jcd.jcd_id || index}>
                                                                    <td data-label="JCD ID">{jcd.jcd_id ?? 'N/A'}</td>
                                                                    <td data-label="Job Type ID">{jcd.JTH_ID ?? 'N/A'}</td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                    <h3 style={{ fontWeight: '400', marginTop: '20px', fontSize: 'medium' }}>Total Completed Jobs On This Component : {completedJcds.length}</h3>
                                                </div>
                                            ) : (
                                                <p style={{
                                                    textAlign: 'center',
                                                    color: '#94a3b8',
                                                    fontStyle: 'italic',
                                                    padding: '16px'
                                                }}>
                                                    No Completed jobs found for this component.
                                                </p>
                                            );
                                        })()
                                    ) : (
                                        <p style={{
                                            textAlign: 'center',
                                            color: '#94a3b8',
                                            fontStyle: 'italic',
                                            padding: '16px'
                                        }}>
                                            No JCDs configured for this component.
                                        </p>
                                    )}
                                </div>
                            )}

                            {/* Upcoming Jobs */}
                            {isUpcomingJobsClicked && (
                                <div id="active-jobs-main-container">
                                    <h2 id="active-jobs-header">Upcomming Jobs On Component :<br /> {selectedNode.data.label ? selectedNode.data.label : "Not Selected Any Component"} </h2>

                                    {jcdsOnComponent && jcdsOnComponent.length > 0 ? (
                                        (() => {
                                            // Step 1: Get all JCD IDs that have at least one active job
                                            const upcommingJCDIds = new Set(
                                                plannedJobList
                                                    ?.filter(plJob => plJob.job_status == 4 && (plJob.SHA_ID == (selectedShipID ? selectedShipID : shipName.SHA_ID)))
                                                    .map(plJob => plJob.jcd_id)
                                                || []
                                            );

                                            // Step 2: Filter jcdsOnComponent to only those with active jobs
                                            const upcommingJcds = jcdsOnComponent.filter(jcd => {
                                                if (upcommingJCDIds.has(jcd.jcd_id)) {
                                                    return jcd
                                                }
                                            }
                                            );

                                            return upcommingJcds.length > 0 ? (
                                                <div id="active-jobs-table-container">
                                                    <table id="active-jobs-table">
                                                        <thead>
                                                            <tr>
                                                                <th scope="col">JCD ID</th>
                                                                <th scope="col">Job Type ID</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {upcommingJcds.map((jcd, index) => (
                                                                <tr key={jcd.jcd_id || index}>
                                                                    <td data-label="JCD ID">{jcd.jcd_id ?? 'N/A'}</td>
                                                                    <td data-label="Job Type ID">{jcd.JTH_ID ?? 'N/A'}</td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            ) : (
                                                <p style={{
                                                    textAlign: 'center',
                                                    color: '#94a3b8',
                                                    fontStyle: 'italic',
                                                    padding: '16px'
                                                }}>
                                                    No Upcomming jobs found for this component.
                                                </p>
                                            );
                                        })()
                                    ) : (
                                        <p style={{
                                            textAlign: 'center',
                                            color: '#94a3b8',
                                            fontStyle: 'italic',
                                            padding: '16px'
                                        }}>
                                            No JCDs configured for this component.
                                        </p>
                                    )}
                                </div>
                            )}

                            {/* Active Jobs - Modern UI (Mirroring View JCDs) */}
                            {/* Active Jobs - Modern UI (Mirroring View JCDs) with Filtering */}
                            {isActiveJobsClicked && (
                                <div id="active-jobs-main-container">
                                    <h2 id="active-jobs-header">Active Jobs On Component :<br /> {selectedNode.data.label} </h2>

                                    {jcdsOnComponent && jcdsOnComponent.length > 0 ? (
                                        (() => {
                                            // Step 1: Get all JCD IDs that have at least one active job
                                            const activeJcdIds = new Set(
                                                plannedJobList
                                                    ?.filter(plJob => plJob.job_status != 4 && (plJob.SHA_ID == (selectedShipID ? selectedShipID : shipName.SHA_ID)))
                                                    .map(plJob => plJob.jcd_id)
                                                || []
                                            );

                                            // Step 2: Filter jcdsOnComponent to only those with active jobs
                                            const activeJcds = jcdsOnComponent.filter(jcd => {
                                                if (activeJcdIds.has(jcd.jcd_id)) {
                                                    return jcd
                                                }
                                            }
                                            );

                                            return activeJcds.length > 0 ? (
                                                <div id="active-jobs-table-container">
                                                    <table id="active-jobs-table">
                                                        <thead>
                                                            <tr>
                                                                <th scope="col">JCD ID</th>
                                                                <th scope="col">Job Type ID</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {activeJcds.map((jcd, index) => (
                                                                <tr key={jcd.jcd_id || index}>
                                                                    <td data-label="JCD ID">{jcd.jcd_id ?? 'N/A'}</td>
                                                                    <td data-label="Job Type ID">{jcd.JTH_ID ?? 'N/A'}</td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                    <h3 style={{ fontWeight: '400', marginTop: '20px', fontSize: 'medium' }}>Total Active Jobs On This Component : {activeJcds.length}</h3>
                                                    {/* {console.log('active Jobs on ', selectedNode.data.label, ' Jobs are : ', activeJcds)} */}
                                                </div>
                                            ) : (
                                                <p style={{
                                                    textAlign: 'center',
                                                    color: '#94a3b8',
                                                    fontStyle: 'italic',
                                                    padding: '16px'
                                                }}>
                                                    No active jobs found for this component.
                                                </p>
                                            );
                                        })()
                                    ) : (
                                        <p style={{
                                            textAlign: 'center',
                                            color: '#94a3b8',
                                            fontStyle: 'italic',
                                            padding: '16px'
                                        }}>
                                            No JCDs configured for this component.
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    ) : <h1>No SHip selected</h1>}
                </>
            ) : (
                // Fallback if no user profile data
                <h1>No valid user profile data found for: {user?.emp_name || 'Unknown User'}</h1>
            )}

            {clicked_JCD_data && (
                <div id='view-jobs-on-selected-jcd' style={{ display: toggelVeiwJobsOnJCD }}>
                    <h1>Jobs Infromation Of {clicked_JCD_data.jcd_id} JCD</h1>
                    <div id='main-content-of-view-jobs-on-selected-jcd'>
                        <table>
                            <thead>
                                <tr>
                                    <th>Active Jobs</th>
                                    <th>Completed Jobs</th>
                                    <th>Upcomming Jobs</th>
                                    <th>Faild Jobs</th>
                                    <th>Extended Jobs</th>
                                    <th>Overdue Jobs</th>
                                </tr>
                            </thead>

                            <tbody>
                                <tr>
                                    {/* from planning table */}
                                    <td style={{ color: 'black' }}>
                                        {
                                            plannedJobList.filter(pljob => (pljob.jcd_id == clicked_JCD_data.jcd_id && pljob.job_status != 4)).length
                                        }
                                    </td>

                                    {/* From completed table */}
                                    <td style={{ color: 'black' }}>
                                        {
                                            plannedJobList.filter(pljob => (pljob.jcd_id == clicked_JCD_data.jcd_id && pljob.job_status == 4)).length
                                        }
                                    </td>

                                    {/* not in planned list (if exist check status) */}
                                    <td style={{ color: 'black' }}>0</td>

                                    {/* From Failed table */}
                                    <td style={{ color: 'black' }}>0</td>

                                    {/* From extended table */}
                                    <td style={{ color: 'black' }}>0</td>

                                    {/* That jobs, which are exceed their deadlines */}
                                    <td style={{ color: 'black' }}>0</td>
                                </tr>
                            </tbody>
                        </table>

                        <button onClick={(e) => {
                            setToggelVeiwJobsOnJCD('none')
                        }}>Close</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default JCDPage;