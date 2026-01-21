import React, { useContext, useEffect, useState } from 'react'
import MovementLogComponent from '../../components/movement_Log_Component/MovementLogComponent'
import './MovementLogPage.css'
import '../JCD_Page/JCD_Page.css'
// emp_name
// Components 
import TempComponentHierarchy from '../temp_component_heirarchy/Temp_component_heirarchy';
import { ComponentTreeContext } from '../../contexts/ComponentTreeContext/ComponentTreeContext';
import { ShipHeaderContext } from '../../contexts/ship_header_context/ShipHeaderContext';
import { UserAuthContext } from '../../contexts/userAuth/UserAuthContext';
import { Profile_header_context } from '../../contexts/profile_header_context/Profile_header_context';
import axios from 'axios';
import { Movement_log_header_context } from '../../contexts/movementLogContext/Movement_log_header_context';
import ComponentTree from '../../components/ComponentTree/ComponentTree';

const tableCellStyles = {
    padding: '12px 10px',
    textAlign: 'center',
    borderBottom: '1px solid #34495e',
    color: '#d0d0d0',
    fontSize: '0.95rem',
    transition: 'background-color 0.2s ease',
};

const MovementLogPage = () => {
    const API_BASE_URL = import.meta.env.VITE_API_URL;

    const [errors, setErrors] = useState({});

    const { user } = useContext(UserAuthContext)
    const { selectedNode, checkedNodes, clearCheckedNodes, toggleCheckedNode, refreshTree } = useContext(ComponentTreeContext);
    const { shipsList } = useContext(ShipHeaderContext);
    const [selectedShipID, setSelectedShipID] = useState(null);

    const [isCofigureMovementLogClicked, setIsCofigureMovementLogClicked] = useState(false)
    const [isViewMovementLogsClicked, setIsViewMovementLogsClicked] = useState(isCofigureMovementLogClicked ? false : true)

    const { profiles, refreshProfiles } = useContext(Profile_header_context);
    const [userMLCAccessFormID, setUserMLCAccessFormID] = useState([]);
    const [userMLCAccessProcessIDs, setUserMLCAccessProcessIDs] = useState([]);
    const [userProfileData, setUserProfileData] = useState([]);

    const [shipDataByLoggedInUser, setShipDataByLoggedInUser] = useState(null);

    const [movement_log_header_data, setMovement_log_header_data] = useState({
        "ship_id": "",
        "mov_log_id": "",
        "display_name": "",
        "line_no": 1,
        "inserted_on": "",
        "valid_till": "",
        "will_be_entered_by": "",
        "impact_on_1": "",
        "details_1": "",
        "impact_on_2": "",
        "details_2": "",
        "impact_on_3": "",
        "details_3": "",
        "impact_on_4": "",
        "details_4": "",
        "impact_on_5": "",
        "details_5": "",
        "impact_on_6": "",
        "details_6": "",
        "impact_on_7": "",
        "details_7": "",
        "impact_on_8": "",
        "details_8": "",
        "impact_on_9": "",
        "details_9": "",
        "impact_on_10": "",
        "details_10": "",
        "impact_on_11": "",
        "details_11": "",
        "impact_on_12": "",
        "details_12": "",
        "impact_on_13": "",
        "details_13": "",
        "impact_on_14": "",
        "details_14": "",
        "impact_on_15": "",
        "details_15": "",
        "impact_on_16": "",
        "details_16": "",
        "impact_on_17": "",
        "details_17": "",
        "impact_on_18": "",
        "details_18": "",
        "impact_on_19": "",
        "details_19": "",
        "impact_on_20": "",
        "details_20": "",
        "impact_on_21": "",
        "details_21": "",
        "impact_on_22": "",
        "details_22": "",
        "impact_on_23": "",
        "details_23": "",
        "impact_on_24": "",
        "details_24": "",
        "impact_on_25": "",
        "details_25": "",
        "impact_on_26": "",
        "details_26": "",
        "impact_on_27": "",
        "details_27": "",
        "impact_on_28": "",
        "details_28": "",
        "impact_on_29": "",
        "details_29": "",
        "impact_on_30": "",
        "details_30": "",
        "impact_on_31": "",
        "details_31": "",
        "impact_on_32": "",
        "details_32": "",
        "impact_on_33": "",
        "details_33": "",
        "impact_on_34": "",
        "details_34": "",
        "impact_on_35": "",
        "details_35": "",
        "impact_on_36": "",
        "details_36": "",
        "impact_on_37": "",
        "details_37": "",
        "impact_on_38": "",
        "details_38": "",
        "impact_on_39": "",
        "details_39": "",
        "impact_on_40": "",
        "details_40": "",
        "impact_on_41": "",
        "details_41": "",
        "impact_on_42": "",
        "details_42": "",
        "impact_on_43": "",
        "details_43": "",
        "impact_on_44": "",
        "details_44": "",
        "impact_on_45": "",
        "details_45": "",
        "impact_on_46": "",
        "details_46": "",
        "impact_on_47": "",
        "details_47": "",
        "impact_on_48": "",
        "details_48": "",
        "impact_on_49": "",
        "details_49": "",
        "impact_on_50": "",
        "details_50": ""
    })

    const [resetMovementLogHeaderData, setResetMovementLogHeaderData] = useState({
        "ship_id": "",
        "mov_log_id": "",
        "display_name": "",
        "line_no": 1,
        "inserted_on": "",
        "valid_till": "",
        "will_be_entered_by": "",
        "impact_on_1": "",
        "details_1": "",
        "impact_on_2": "",
        "details_2": "",
        "impact_on_3": "",
        "details_3": "",
        "impact_on_4": "",
        "details_4": "",
        "impact_on_5": "",
        "details_5": "",
        "impact_on_6": "",
        "details_6": "",
        "impact_on_7": "",
        "details_7": "",
        "impact_on_8": "",
        "details_8": "",
        "impact_on_9": "",
        "details_9": "",
        "impact_on_10": "",
        "details_10": "",
        "impact_on_11": "",
        "details_11": "",
        "impact_on_12": "",
        "details_12": "",
        "impact_on_13": "",
        "details_13": "",
        "impact_on_14": "",
        "details_14": "",
        "impact_on_15": "",
        "details_15": "",
        "impact_on_16": "",
        "details_16": "",
        "impact_on_17": "",
        "details_17": "",
        "impact_on_18": "",
        "details_18": "",
        "impact_on_19": "",
        "details_19": "",
        "impact_on_20": "",
        "details_20": "",
        "impact_on_21": "",
        "details_21": "",
        "impact_on_22": "",
        "details_22": "",
        "impact_on_23": "",
        "details_23": "",
        "impact_on_24": "",
        "details_24": "",
        "impact_on_25": "",
        "details_25": "",
        "impact_on_26": "",
        "details_26": "",
        "impact_on_27": "",
        "details_27": "",
        "impact_on_28": "",
        "details_28": "",
        "impact_on_29": "",
        "details_29": "",
        "impact_on_30": "",
        "details_30": "",
        "impact_on_31": "",
        "details_31": "",
        "impact_on_32": "",
        "details_32": "",
        "impact_on_33": "",
        "details_33": "",
        "impact_on_34": "",
        "details_34": "",
        "impact_on_35": "",
        "details_35": "",
        "impact_on_36": "",
        "details_36": "",
        "impact_on_37": "",
        "details_37": "",
        "impact_on_38": "",
        "details_38": "",
        "impact_on_39": "",
        "details_39": "",
        "impact_on_40": "",
        "details_40": "",
        "impact_on_41": "",
        "details_41": "",
        "impact_on_42": "",
        "details_42": "",
        "impact_on_43": "",
        "details_43": "",
        "impact_on_44": "",
        "details_44": "",
        "impact_on_45": "",
        "details_45": "",
        "impact_on_46": "",
        "details_46": "",
        "impact_on_47": "",
        "details_47": "",
        "impact_on_48": "",
        "details_48": "",
        "impact_on_49": "",
        "details_49": "",
        "impact_on_50": "",
        "details_50": ""
    })

    const { movement_log_header_list, refreshMovement_log_header_list } = useContext(Movement_log_header_context)
    const [movement_log_header_list_by_ship, setMovement_log_header_list_by_ship] = useState([])

    const [movementLogAppliedCategory, setMovementLogAppliedCategory] = useState(null)

    const [selectedMovementLogHeaderData, setSelectedMovementLogHeaderData] = useState(null)
    const [wantToSeeAppliedComponentHeirarchyOnMovementLog, setWantToSeeAppliedComponentHeirarchyOnMovementLog] = useState(false)

    const [movement_log_wise_index, setMovement_log_wise_index] = useState(-1)

    useEffect(() => {
        refreshMovement_log_header_list()
        refreshTree()
        refreshProfiles()
    }, [])

    useEffect(() => {
        if (user.emp_type == 1) {
            setShipNameByID(user.ship_id)
        }
    }, [user])

    useEffect(() => {
        if (movement_log_header_list) {
            setMovement_log_header_list_by_ship(
                movement_log_header_list.filter(
                    (movement_log) => movement_log.ship_id == selectedShipID
                )
            );
        }
    }, [movement_log_header_list, selectedShipID]);


    useEffect(() => {
        if (movement_log_header_list_by_ship) {
            console.log('selectedShipID in movement : ', selectedShipID)
            console.log('movement_log_header_list_by_ship : ', movement_log_header_list_by_ship)
        }
    }, [movement_log_header_list_by_ship, selectedShipID])

    useEffect(() => {
        clearCheckedNodes()
    }, [])

    useEffect(() => {
        clearCheckedNodes()
    }, [selectedShipID, shipDataByLoggedInUser])

    useEffect(() => {
        // console.log('selected Node : ', selectedNode)
    }, [selectedNode])

    const handleOnSubmit = (e) => {
        e.preventDefault();

        const newErrors = {};

        // 1. Validate Movement Log Name
        const displayName = e.target.display_name.value.trim();
        if (!displayName) {
            newErrors.display_name = "Movement Log Name is required.";
        }

        // 2. Validate Valid Till Date (if provided)
        const validTill = e.target.valid_till.value;
        if (validTill) {
            const selectedDate = new Date(validTill);
            const today = new Date();
            today.setHours(0, 0, 0, 0); // Reset time to midnight
            if (selectedDate <= today) {
                newErrors.valid_till = "Date must be in the future.";
            }
        }

        // 3. Validate At Least One "Impact On" Checkbox
        const impactChecks = [
            e.target.category?.checked,
            e.target.sub_category?.checked,
            e.target.second_sub_category?.checked,
            e.target.third_sub_category?.checked,
        ].some(checked => checked);
        if (!impactChecks) {
            newErrors.impact_on = "At least one 'Impact On' option must be selected.";
        }

        // 4. Validate One "Details" Radio is Selected
        const detailsValue = e.target.details?.value;
        if (!detailsValue) {
            newErrors.details = "Please select a movement detail type (Hours, KM, or Both).";
        }

        // Set errors
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return; // Prevent form submission
        }

        // console.log('displayName : ', displayName)
        // console.log('validTill : ', validTill)
        // console.log('impactChecks : ', impactChecks)
        // console.log('detailsValue : ', detailsValue)

        // ✅ All validations passed — proceed with your existing submission logic
        setErrors({}); // Clear errors
        alert('building logic'); // ← Your existing placeholder
        console.log('movement_log_header_data : ', movement_log_header_data)
    };


    /**
       * Sets the full ship object in state based on its ID.
       * @param {string|number} shipID - The unique identifier of the ship.
       */
    const setShipNameByID = (shipID) => {
        const foundShip = shipsList.find(ship => ship.SHA_ID === shipID);
        if (foundShip) {
            // console.log('foundShip : ', foundShip)
            setShipDataByLoggedInUser(foundShip);
            setSelectedShipID(foundShip.SHA_ID)
        } else {
            // console.warn(`No ship found with ID: ${shipID}`);
        }
    };

    /**
       * Fetches the assigned ship ID for a given employee ID.
       * @param {string|number} empID - The employee's unique identifier.
       */
    const fetchShipIDByEmployeeID = async (empID) => {
        if (!empID) return;
        try {
            const response = await axios.get(`${API_BASE_URL}getShipIDbyEmployeeID/${empID}`);
            const shipData = response.data?.[0];
            if (shipData?.SHA_ID) {
                // console.log("Fetched Ship ID for Employee:", shipData.SHA_ID);
                setShipNameByID(shipData.SHA_ID);
            } else {
                // console.warn("No ship data found for employee ID:", empID);
            }
        } catch (err) {
            // console.error("Error fetching ship ID for employee:", empID, err.message);
        }
    };

    // Initial data fetching on component mount
    useEffect(() => {
        const fetchData = async () => {
            if (user?.UHA_ID) {
                await fetchShipIDByEmployeeID(user.UHA_ID);
            }
            if (user) {
                trackFormProcessAccessibility(user, 'MLC');
            }
        };

        fetchData();
    }, [user, profiles]); // Depend only on user


    const trackFormProcessAccessibility = (loggedInUser, prefix) => {
        const profileIDs = loggedInUser.profile_ids?.split(',') || [];
        // console.log('profiles : ', profiles)
        const matchedProfiles = profileIDs
            .map(id => profiles?.find(profile => profile.PROFILE_ID === id))
            .filter(Boolean); // Remove undefined entries

        // console.log('User Profile Data:', matchedProfiles);

        if (matchedProfiles.length > 0) {
            const firstProfile = matchedProfiles[0];
            const formIDs = firstProfile.form_ids?.split(',').filter(id => id.includes(prefix)) || [];
            const processIDs = firstProfile.process_ids?.split(',').filter(id => id.includes(prefix)) || [];

            setUserMLCAccessFormID(formIDs);
            setUserMLCAccessProcessIDs(processIDs);
            setUserProfileData(matchedProfiles);
        } else {
            // console.warn("No valid user profile data found for:", loggedInUser.emp_name);
            setUserProfileData([]); // Explicitly set empty array if no profiles
        }
    };

    useEffect(() => {
        // console.log(userMLCAccessProcessIDs)
    }, [userMLCAccessProcessIDs])

    useEffect(() => {
        if (selectedMovementLogHeaderData) {
            axios.get(`${API_BASE_URL}getAllMovementLogsWithOnlyAppliedCompHeirarchy`).then((res) => {
                // console.log('res.data getAllMovementLogsWithFullCompHeirarchy : ', res.data)
                setMovementLogAppliedCategory(res.data)
            }).catch((err) => {
                console.log('Error when fetching getAllMovementLogsWithFullCompHeirarchy in movement Log page')
            })
        }
    }, [selectedMovementLogHeaderData, wantToSeeAppliedComponentHeirarchyOnMovementLog])

    const handleOnEditMovementLogHeader = (movement_log_data) => {
        if (!movementLogAppliedCategory) {
            alert('Server Issue !!, Please Try Again');
            return;
        }

        clearCheckedNodes();
        console.log('movement_log_data :: ', movement_log_data)

        if (movementLogAppliedCategory[0]) {
            const impactedComponents = movementLogAppliedCategory[0].impacted_components;

            if (impactedComponents && impactedComponents.length === 0) {
                alert('This Movement Log Is Not Configured On Any Component');
            } else {
                for (let node of impactedComponents) {
                    const root = node.component_heirarchy;
                    traverseAndToggle(root);
                }
            }
        }

        // Format valid_till for input[type="date"]
        const formatDateForInput = (isoDate) => {
            if (!isoDate) return '';
            const date = new Date(isoDate);
            return date.toISOString().split('T')[0]; // → "2025-08-30"
        };

        setMovement_log_header_data({
            ...movement_log_data,
            valid_till: formatDateForInput(movement_log_data.valid_till)
        });

        setIsViewMovementLogsClicked(false)
        setIsCofigureMovementLogClicked(true)
    };

    function traverseAndToggle(node) {
        if (!node) return;

        if (node.isCheckBoxApplicable) {
            const tempNode = {
                id: node.id,
                type: node.type,
                data: node.data,
                children: node.children
            };
            toggleCheckedNode(tempNode);
        }

        if (node.children && node.children.length > 0) {
            for (let child of node.children) {
                traverseAndToggle(child);
            }
        }
    }

    const resetMovementLogConfigForm = () => {
        clearCheckedNodes()
        setMovement_log_header_data(resetMovementLogHeaderData)

    }

    return (
        <div id='movement-log-page-main-container'>
            {/* <h1>Movement Logs Page</h1> */}

            {user.emp_type == 2 || user.emp_type == 1 ?
                <>
                    <div id='movement-log-page-left-container'>
                        <div id='movement-log-page-left-container-content'>
                            <div id="select-ships-container" style={{ marginBottom: '20px' }}>
                                <select name="ships-selection" id="ship-selection"
                                    value={selectedShipID || ""} // Controlled component
                                    onChange={(e) => setSelectedShipID(e.target.value)}
                                    style={{
                                        visibility: (isCofigureMovementLogClicked && checkedNodes.length > 0) ? 'hidden' : 'visible',
                                        color: '#3f5165'
                                    }}
                                    disabled={(userMLCAccessProcessIDs.includes('P_MLC_0006') && user.emp_type == 1)}
                                >
                                    {(userMLCAccessProcessIDs.includes('P_MLC_0006') && user.emp_type == 1) ? <option value="">You are at : {selectedShipID ? selectedShipID : shipDataByLoggedInUser.ship_name}</option> : <option value="">Select Location</option>}
                                    {(user.emp_type === 2) && (
                                        <>
                                            {shipsList.map((ship, index) => (
                                                <option key={index} value={ship.SHA_ID}>
                                                    {ship.ship_name}
                                                </option>
                                            ))}
                                        </>
                                    )}
                                </select>
                            </div>
                            {selectedShipID && (
                                <div className="tree-section" style={{
                                    cursor: isViewMovementLogsClicked ? 'not-allowed' : 'pointer',
                                    pointerEvents: isViewMovementLogsClicked ? 'none' : 'all'
                                }}
                                >
                                    <h2>🔧 Component Hierarchy for {(shipsList.filter(ship => ship.SHA_ID == selectedShipID))[0].ship_name}</h2>
                                    <TempComponentHierarchy setIsCheckActive={true} componentTreeWantByWhichComp={'MovementLogComponent'} isReadOnlyView={false} selectedShipID={selectedShipID} />

                                    {/* <ComponentTree
                                node={movementLogAppliedCategory[0].impacted_components[0].component_heirarchy[0]}
                                isCheckBoxActive={false}
                                isReadOnlyView={true}
                                componentTreeWantByWhichComp={'MovementLogComponent'}
                            /> */}
                                </div>
                            )}
                        </div>
                    </div>



                    <div id='movement-log-page-right-container' style={{ flexDirection: (user.emp_type == 2) ? 'row' : 'column' }}>
                        <div id='movement-log-page-right-top-container'>
                            {
                                profiles?.filter(p => user?.profile_ids?.includes(p.PROFILE_ID))[0]?.process_ids.includes("P_MLC_0005") &&
                                <button
                                    onClick={(e) => {
                                        clearCheckedNodes()

                                        setIsCofigureMovementLogClicked(true);
                                        setIsViewMovementLogsClicked(false)
                                    }}
                                    className={`tab-button ${isCofigureMovementLogClicked ? 'active' : ''}`}
                                    style={{ display: (userMLCAccessProcessIDs.includes('P_MLC_0005') && user.emp_type == 2) ? 'inline' : 'none' }}
                                >Configure Movement Log</button>
                            }

                            {
                                profiles?.filter(p => user?.profile_ids?.includes(p.PROFILE_ID))[0]?.process_ids.includes("P_MLC_0006") &&
                                <button
                                    onClick={(e) => {
                                        clearCheckedNodes()

                                        setIsViewMovementLogsClicked(true)
                                        setIsCofigureMovementLogClicked(false);
                                    }}
                                    className={`tab-button ${isViewMovementLogsClicked ? 'active' : ''}`}
                                    style={{ display: userMLCAccessProcessIDs.includes('P_MLC_0006') ? 'inline' : 'none' }}
                                >Veiw Movement Logs</button>
                            }
                        </div>

                        {/* === CONFIGURE TAB === */}
                        {(isCofigureMovementLogClicked && userMLCAccessProcessIDs.includes('P_MLC_0005')) && (
                            <>
                                {checkedNodes.length > 0 ? (
                                    <>
                                        {profiles?.filter(p => user?.profile_ids?.includes(p.PROFILE_ID))[0]?.form_ids.includes("F_MLC_001") && (

                                            <form onSubmit={handleOnSubmit}>
                                                <h1>Movement Log Configuration On {shipsList.filter(ship => ship.SHA_ID == selectedShipID)[0].ship_name}</h1>

                                                {/* Selected Components */}
                                                <div id='movement-log-header-visualize-checked-node'>
                                                    <h3 className="section-title">Selected Components</h3>
                                                    <ul className="checked-nodes-list">
                                                        {checkedNodes.map((node) => (
                                                            <li key={node.id} className="checked-node-item">
                                                                <span className={`icon ${node.type}`}></span>
                                                                <span className="label">{node.data.label}</span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>

                                                {/* Movement Log Name */}
                                                <div id='movement-log-header-display-name-feild-container' style={{ marginTop: '20px' }}>
                                                    <label htmlFor="display-name">
                                                        <i className="fas fa-signature icon-prefix"></i>
                                                        Movement Log Name :
                                                        <input
                                                            type="text"
                                                            name='display_name'
                                                            id='display-name'
                                                            placeholder='Enter Movement Log Name..'
                                                            value={movement_log_header_data.display_name}
                                                            onChange={(e) => {
                                                                setMovement_log_header_data((prev) => ({
                                                                    ...prev,
                                                                    [e.target.name]: e.target.value,
                                                                }));
                                                            }}
                                                        />
                                                        {errors.display_name && <span className="error-msg">{errors.display_name}</span>}
                                                    </label>
                                                </div>

                                                {/* Valid Till */}
                                                <div id='movement-log-header-valid-till-feild-container'>
                                                    <label htmlFor="valid-till">
                                                        Log Valid Till :
                                                        <input
                                                            type="date"
                                                            name='valid_till'
                                                            id='valid-till'
                                                            value={movement_log_header_data.valid_till || ''}
                                                            min={new Date().toISOString().split("T")[0]}
                                                            onChange={(e) => {
                                                                const selectedDate = new Date(e.target.value);
                                                                const today = new Date();
                                                                today.setHours(0, 0, 0, 0);

                                                                if (selectedDate > today) {
                                                                    setMovement_log_header_data((prev) => ({
                                                                        ...prev,
                                                                        [e.target.name]: e.target.value,
                                                                    }));
                                                                    setErrors((prev) => ({ ...prev, valid_till: '' }));
                                                                } else {
                                                                    setErrors((prev) => ({ ...prev, valid_till: 'Please select a future date.' }));
                                                                }
                                                            }}
                                                        />
                                                    </label>

                                                    {errors.valid_till && <span className="error-msg">{errors.valid_till}</span>}
                                                    <p id='movement-log-header-valid-till-feild-note'>Date should be a future date.</p>
                                                    <p id='movement-log-header-valid-till-feild-note'>If left blank, this log will remain active indefinitely.</p>
                                                </div>


                                                {/* Impact On */}
                                                <div id='movement-log-header-impact-on-feilds-container'>
                                                    <fieldset className="modern-fieldset">
                                                        <legend className="modern-legend">The Selected Movement Log Will Impact On</legend>
                                                        <div className="checkbox-group">
                                                            <label className="checkbox-label">
                                                                <input type="checkbox" name="category" />
                                                                <span className="checkbox-custom"></span>
                                                                Category (It-self Only)
                                                            </label>
                                                            <label className="checkbox-label">
                                                                <input type="checkbox" name="sub_category" />
                                                                <span className="checkbox-custom"></span>
                                                                Its Sub Category
                                                            </label>
                                                            <label className="checkbox-label">
                                                                <input type="checkbox" name="second_sub_category" />
                                                                <span className="checkbox-custom"></span>
                                                                Its 2nd Sub Category
                                                            </label>
                                                            <label className="checkbox-label">
                                                                <input type="checkbox" name="third_sub_category" />
                                                                <span className="checkbox-custom"></span>
                                                                Its 3rd Sub Category
                                                            </label>
                                                            <label className="checkbox-label">
                                                                <input type="checkbox" name="all_hierarchy" />
                                                                <span className="checkbox-custom"></span>
                                                                All (Complete Hierarchy)
                                                            </label>
                                                        </div>
                                                    </fieldset>
                                                    {errors.impact_on && <p className="error-msg field-error-block">{errors.impact_on}</p>}
                                                </div>

                                                {/* Details Type */}
                                                <div id='movement-log-header-details-feilds-container'>
                                                    <fieldset className="modern-fieldset">
                                                        <legend className="modern-legend">Provide Details About Movement</legend>
                                                        <div className="radio-group">
                                                            <label className="radio-label">
                                                                <input type="radio" name="details" value="hours" />
                                                                <span className="radio-custom"></span>
                                                                Hours
                                                            </label>
                                                            <label className="radio-label">
                                                                <input type="radio" name="details" value="km" />
                                                                <span className="radio-custom"></span>
                                                                KM
                                                            </label>
                                                            <label className="radio-label">
                                                                <input type="radio" name="details" value="both" />
                                                                <span className="radio-custom"></span>
                                                                Both (KM & Hours)
                                                            </label>
                                                        </div>
                                                    </fieldset>
                                                    {errors.details && <p className="error-msg field-error-block">{errors.details}</p>}
                                                </div>

                                                {/* Buttons */}
                                                <div id='movement-log-header-btns-container'>
                                                    {profiles?.filter(p => user?.profile_ids?.includes(p.PROFILE_ID))[0]?.form_ids.includes("P_MLC_0002") && (
                                                        <button type="submit" className="btn" id='submit-btn'>Save Configuration</button>
                                                    )}

                                                    <button type='button' className='btn' id='reset-btn' onClick={() => { alert('In Progress') }}>Configure Movement Logs From Other Ships</button>

                                                    <button type='button' className='btn' id='reset-btn' onClick={() => { resetMovementLogConfigForm() }}>Reset From</button>
                                                </div>
                                            </form>
                                        )}
                                    </>
                                ) : (
                                    <p className="no-selection">No Component selected yet.</p>
                                )}
                            </>
                        )}

                        {/* === VIEW TAB === */}
                        {
                            (isViewMovementLogsClicked && userMLCAccessProcessIDs.includes('P_MLC_0006')) ? (
                                <table
                                    style={{
                                        width: '100%',
                                        borderCollapse: 'separate',
                                        borderSpacing: '0',
                                        marginTop: '20px',
                                        background: 'rgba(30, 30, 46, 0.4)',
                                        borderRadius: '12px',
                                        overflow: 'hidden',
                                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
                                    }}
                                >
                                    <thead>
                                        {/* <tr>
                                            {['Movement Name', 'Last Updated On', 'Counter', 'See Component Relay', 'Actions'].map((header) => (
                                                (header == 'See Component Relay') && userMLCAccessProcessIDs.includes('P_MLC_0007')
                                                ?
                                                    <th
                                                        key={header}
                                                        style={{
                                                            padding: '14px 12px',
                                                            textAlign: 'center',
                                                            backgroundColor: '#2c3e50',
                                                            color: '#ecf0f1',
                                                            fontSize: '1rem',
                                                            fontWeight: '600',
                                                            textShadow: '0 0 5px rgba(236, 240, 241, 0.3)',
                                                            border: 'none',
                                                        }}
                                                    >
                                                        {header}
                                                    </th>
                                                    : <th
                                                        key={header}
                                                        style={{
                                                            padding: '14px 12px',
                                                            textAlign: 'center',
                                                            backgroundColor: '#2c3e50',
                                                            color: '#ecf0f1',
                                                            fontSize: '1rem',
                                                            fontWeight: '600',
                                                            textShadow: '0 0 5px rgba(236, 240, 241, 0.3)',
                                                            border: 'none',
                                                        }}
                                                    >
                                                        {header}
                                                    </th>
                                            ))}
                                        </tr> */}

                                        <tr>
                                            {/* {['Movement Name', 'Last Updated On', 'Counter', 'See Component Relay', 'Actions'].map((header) => { */}
                                            {['Movement Name', 'Last Updated On', 'See Component Relay', 'Actions'].map((header) => {
                                                if (header === 'See Component Relay' && !userMLCAccessProcessIDs.includes('P_MLC_0007')) {
                                                    return null; // skip rendering this header if access is not allowed
                                                }
                                                if (header === 'Actions' && (!userMLCAccessProcessIDs.includes('P_MLC_0003') && !userMLCAccessProcessIDs.includes('P_MLC_0004'))) {
                                                    return null; // skip rendering this header if access is not allowed
                                                }
                                                return (
                                                    <th
                                                        key={header}
                                                        style={{
                                                            padding: '14px 12px',
                                                            textAlign: 'center',
                                                            backgroundColor: '#2c3e50',
                                                            color: '#ecf0f1',
                                                            fontSize: '1rem',
                                                            fontWeight: '600',
                                                            textShadow: '0 0 5px rgba(236, 240, 241, 0.3)',
                                                            border: 'none',
                                                        }}
                                                    >
                                                        {header}
                                                    </th>
                                                );
                                            })}
                                        </tr>

                                    </thead>
                                    <tbody>
                                        {movement_log_header_list_by_ship.length > 0 ? (
                                            // Show rows if logs exist
                                            movement_log_header_list_by_ship.map((movement_log_by_ship, index) => (
                                                <tr
                                                    key={movement_log_by_ship.mov_log_id}
                                                    style={{
                                                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                                    }}
                                                >
                                                    <td style={tableCellStyles}>{movement_log_by_ship.display_name}</td>
                                                    <td style={tableCellStyles}>
                                                        {new Date(movement_log_by_ship.inserted_on).toLocaleDateString('en-GB')}
                                                    </td>

                                                    {/* For Counters */}
                                                    {/* <td style={tableCellStyles}>[ Working.. ]</td> */}

                                                    {userMLCAccessProcessIDs.includes('P_MLC_0007') && <td style={tableCellStyles}>
                                                        <button
                                                            id="btn-see-component-relay-on-this-movement"
                                                            style={{
                                                                padding: '6px 12px',
                                                                backgroundColor: '#6c5ce7',
                                                                color: 'white',
                                                                border: 'none',
                                                                borderRadius: '6px',
                                                                fontSize: '0.9rem',
                                                                cursor: 'pointer',
                                                                transition: 'all 0.2s ease',
                                                                boxShadow: '0 2px 5px rgba(108, 92, 231, 0.3)',
                                                            }}
                                                            onMouseOver={(e) => (e.target.style.backgroundColor = '#5d40e0')}
                                                            onMouseOut={(e) => (e.target.style.backgroundColor = '#6c5ce7')}
                                                            onClick={() => {
                                                                setMovement_log_wise_index(index)
                                                                setWantToSeeAppliedComponentHeirarchyOnMovementLog(true);
                                                                setSelectedMovementLogHeaderData(movement_log_by_ship);
                                                            }}
                                                        >
                                                            See
                                                        </button>
                                                    </td>}
                                                    {userMLCAccessProcessIDs.includes('P_MLC_0003') && userMLCAccessProcessIDs.includes('P_MLC_0004') ?
                                                        <td style={{ ...tableCellStyles, textAlign: 'center' }}>
                                                            {userMLCAccessProcessIDs.includes('P_MLC_0003') &&
                                                                <button
                                                                    style={{
                                                                        padding: '6px 12px',
                                                                        backgroundColor: '#6c5ce7',
                                                                        color: 'white',
                                                                        border: 'none',
                                                                        borderRadius: '6px',
                                                                        fontSize: '0.9rem',
                                                                        cursor: 'pointer',
                                                                        transition: 'all 0.2s ease',
                                                                        boxShadow: '0 2px 5px rgba(108, 92, 231, 0.3)',
                                                                        marginRight: '8px',
                                                                    }}
                                                                    onMouseOver={(e) => (e.target.style.backgroundColor = '#5d40e0')}
                                                                    onMouseOut={(e) => (e.target.style.backgroundColor = '#6c5ce7')}
                                                                    onClick={() => {
                                                                        setSelectedMovementLogHeaderData(movement_log_by_ship);
                                                                        handleOnEditMovementLogHeader(movement_log_by_ship);
                                                                    }}
                                                                >
                                                                    Edit
                                                                </button>
                                                            }

                                                            {userMLCAccessProcessIDs.includes('P_MLC_0004') &&
                                                                <button
                                                                    style={{
                                                                        padding: '6px 12px',
                                                                        backgroundColor: '#db443eff',
                                                                        color: 'white',
                                                                        border: 'none',
                                                                        borderRadius: '6px',
                                                                        fontSize: '0.9rem',
                                                                        cursor: 'pointer',
                                                                        transition: 'all 0.2s ease',
                                                                        boxShadow: '0 2px 5px rgba(108, 92, 231, 0.3)',
                                                                    }}
                                                                    onMouseOver={(e) => (e.target.style.backgroundColor = '#c63a35ff')}
                                                                    onMouseOut={(e) => (e.target.style.backgroundColor = '#db443eff')}
                                                                >
                                                                    Suspend
                                                                </button>
                                                            }
                                                        </td>
                                                        : null}
                                                </tr>
                                            ))
                                        ) : (
                                            // Show "No logs" message if none exist
                                            <tr>
                                                <td colSpan="5" style={{
                                                    padding: '40px 20px',
                                                    textAlign: 'center',
                                                    color: '#888',
                                                    fontStyle: 'italic',
                                                    fontSize: '1.1rem',
                                                    backgroundColor: 'rgba(0, 0, 0, 0.1)',
                                                }}>
                                                    No movement logs configured for {
                                                        shipsList?.find(ship => ship.SHA_ID === selectedShipID)?.ship_name || 'N/A'
                                                    }

                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            ) : null
                        }

                        {/* {
                    // console.log('selectedMovementLogHeaderData : ', selectedMovementLogHeaderData)
                    console.log('wantToSeeAppliedComponentHeirarchyOnMovementLog : ', wantToSeeAppliedComponentHeirarchyOnMovementLog)
                } */}

                        {
                            wantToSeeAppliedComponentHeirarchyOnMovementLog && movementLogAppliedCategory && (
                                <div id='applied-component-heirarchy-on-perticulart-movement-log'>
                                    <div id='applied-component-heirarchy-on-perticulart-movement-log-content'>

                                        <div id='applied-component-heirarchy-on-perticulart-movement-log-content-container'>
                                            {
                                                <>
                                                    {/* <ComponentTree key={movementLogAppliedCategory[0].movement_log_id} node={movementLogAppliedCategory[0].impacted_components[0].component_heirarchy} isCheckBoxActive={true} componentTreeWantByWhichComp={'MovementLogComponent'} />
                                            <ComponentTree key={movementLogAppliedCategory[0].movement_log_id} node={movementLogAppliedCategory[0].impacted_components[1].component_heirarchy} isCheckBoxActive={true} componentTreeWantByWhichComp={'MovementLogComponent'} /> */}

                                                    {console.log('movementLogAppliedCategory[movement_log_wise_index].impacted_components :: ', movementLogAppliedCategory[movement_log_wise_index].impacted_components)}

                                                    {movementLogAppliedCategory[movement_log_wise_index].impacted_components.map(node => {
                                                        return (
                                                            <ComponentTree key={node.id} node={node.component_heirarchy} isCheckBoxActive={true} componentTreeWantByWhichComp={'MovementLogComponent'} selectedShipID={selectedShipID.SHA_ID} />
                                                        )
                                                    })}

                                                </>
                                            }
                                        </div>

                                        <button
                                            style={{
                                                padding: '10px 50px',
                                                backgroundColor: '#c63a35ff',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '6px',
                                                fontSize: '1rem',
                                                fontWeight: '500',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s ease',
                                                boxShadow: '0 2px 5px rgba(108, 92, 231, 0.3)',
                                            }}
                                            onClick={() => {
                                                setWantToSeeAppliedComponentHeirarchyOnMovementLog(false)
                                                setMovement_log_wise_index(-1)
                                            }}
                                        >Close</button>
                                    </div>
                                </div>
                            )
                        }
                    </div>
                </>
                :
                <p style={{
                    fontSize: '3rem',
                    fontWeight: '700',
                    color: 'black',
                    backgroundColor: 'white'
                }}>
                    You are not Authorized to see Content Of this module
                </p>
            }
        </div>
    )
}
export default MovementLogPage
// See