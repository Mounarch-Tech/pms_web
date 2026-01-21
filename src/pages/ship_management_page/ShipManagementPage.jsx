import React, { useContext, useEffect, useState } from 'react';
import './ShipManagementPage.css';
import { ShipHeaderContext } from '../../contexts/ship_header_context/ShipHeaderContext';
import Temp_component_heirarchy from '../temp_component_heirarchy/Temp_component_heirarchy';
import { ComponentTreeContext } from '../../contexts/ComponentTreeContext/ComponentTreeContext';
import { UserAuthContext } from '../../contexts/userAuth/UserAuthContext';
import axios from 'axios';
import { Ship_health_details_context } from '../../contexts/ship_health_Context/Ship_health_details_context';
import OTP_verification from '../../components/otp_model/OTP_verification';

const ShipManagementPage = () => {
    const API_BASE_URL = import.meta.env.VITE_API_URL;

    const [loading, setLoading] = useState(false);

    const { user } = useContext(UserAuthContext)
    const { shipsList, refreshShipsList, agencyList, refreshAgencyList } = useContext(ShipHeaderContext);
    const { needToInvokeAddNewComponentForm, setNeedToInvokeAddNewComponentForm, needToInvokeEditComponentForm, setNeedToInvokeEditComponentForm, selectedNode, refreshTree } = useContext(ComponentTreeContext)
    const { shipsHealthList, refreshShipsHealthList } = useContext(Ship_health_details_context)


    const [newComponentName, setNewComponentName] = useState('');
    const [newCompHasDesignFile, setNewCompHasDesignFile] = useState(false);
    const [newCompCanJCDConfig, setNewCompCanJCDConfig] = useState(false);
    const [designFile, setDesignFile] = useState(null);

    const subTabOrder = ['vslOverview', 'vslParticular', 'vslAllocation', 'crewList'];
    const API_URL = import.meta.env.VITE_API_URL;

    const handleNextSubTab = () => {
        const currentIndex = subTabOrder.indexOf(detailsSubActiveTab);
        if (currentIndex < subTabOrder.length - 1) {
            setDetailsSubActiveTab(subTabOrder[currentIndex + 1]);
        } else {
            // Optional: Show a message or wrap around
            alert("You've reached the last section.");
        }
    };

    const [needToInvokeShipHealthStatusChangeForm, setNeedToInvokeShipHealthStatusChangeForm] = useState(false)
    const [shipHealthNewStatus, setShipHealthNewStatus] = useState(0)

    // Prev Approach Ship Data
    const [shipData, setShipData] = useState({
        "AHA_ID": "",
        "SHA_ID": "",
        "inactive_since": null,
        "incorporated_since": null,
        "inserted_on": null,
        "ship_code": "",
        "ship_details": "",
        "ship_name": "",
        "ship_status": "",
        "under_repaired_since": null
    })

    // Unified form state for ALL tabs
    const [shipDetailsFormData, setShipDetailsFormData] = useState({
        AHA_ID: "",
        SHA_ID: "",
        // === Vessel Overview ===
        inactive_since: null,
        incorporated_since: null,
        inserted_on: null,
        ship_code: "",
        ship_details: "",
        ship_name: "",
        ship_status: "",
        under_repaired_since: null,
        vesselType: '',
        flag: '',
        vesselCode: '',
        managementType: '',
        owner: '',
        charterer: '',
        shipManager: '',
        pAndIClub: '',
        lifeBoatCapacity: '',
        wageScale: '',
        takeOverDate: '',
        status: '',
        image: null,
        lrMo: '',
        registeredPort: '',
        official: '',
        mmsi: '',
        currentClass: '',
        groupEmail: '',
        group: '',
        email: '',
        yearBuilt: '',
        age: '',
        yard: '',
        grtTwd: '',
        teu: '',
        nrt: '',
        length: '',
        breadth: '',
        depth: '',

        // === Vessel Particulars ===
        mainEngineMaker: '',
        mainEngineModel: '',
        mainEngineStrokeType: '',
        mainEngineKW: '',
        mainEngineBHP: '',
        mainEngineRPM: '',
        aux1Maker: '',
        aux1Model: '',
        aux1StrokeType: '',
        aux1KW: '',
        aux1BHP: '',
        aux1RPM: '',
        aux2Maker: '',
        aux2Model: '',
        aux2StrokeType: '',
        aux2KW: '',
        aux2BHP: '',
        aux2RPM: '',
        aux3Maker: '',
        aux3Model: '',
        aux3StrokeType: '',
        aux3KW: '',
        aux3BHP: '',
        aux3RPM: '',
        inmTerminalType: '',
        callSign: '',
        insValidDays: '0',
        tel1: '',
        tel2: '',
        mobileNumber: '',
        fax: '',
        data: '',
        hsd: '',
        inmC: '',
        accCode: '',
        trainingFees: '0',

        // === Vessel Allocation ===
        vesselEmail: '',
        technicalGroupEmail: '',
        crewGroupEmail: '',
        ownerRep: '',
        charterEmail: '',
        techSupdt: '',
        superintendent: '',
        fleetManager: '',
        techAssistant: '',
        marineAssistant: '',
        dpa: '',
        acctOfficer: '',
        performanceBonus: '',
    });

    const [selectedShip, setSelectedShip] = useState({});
    const [activeTab, setActiveTab] = useState('details'); // 'details', 'crew', 'components', 'health'
    const [detailsSubActiveTab, setDetailsSubActiveTab] = useState('vslOverview'); // 'vslOverview', 'vslAllocation', 'vslParticular', 'crewList'
    const [btnSaveVisibility, setBtnSaveVisibility] = useState('hidden') // visible or hidden
    const [btnUpdateVisibility, setBtnUpdateVisibility] = useState('hidden') // visible or hidden
    const [btnDeleteVisibility, setBtnDeleteVisibility] = useState('hidden') // visible or hidden
    const [isAddNewComponentChecked, setIsAddNewComponentChecked] = useState(true)
    const [isEditComponentChecked, setIsEditComponentChecked] = useState(false)
    const [authRequired, setAuthRequired] = useState(false)

    // useEffect(() => { console.log(needToInvokeAddNewComponentForm) }, [needToInvokeAddNewComponentForm])
    useEffect(() => { console.log(selectedShip) }, [selectedShip?.SHA_ID])

    useEffect(() => {
        refreshShipsHealthList()
        refreshAgencyList()
        refreshShipsList()
        refreshTree()
        setNeedToInvokeAddNewComponentForm(false);
        setNewComponentName('');
        setDesignFile(null);
        setNewCompHasDesignFile(false);
        setShipHealthNewStatus(0)
    }, [])

    useEffect(() => {
        setShipDetailsFormData({
            AHA_ID: "",
            SHA_ID: "",
            // === Vessel Overview ===
            inactive_since: null,
            incorporated_since: null,
            inserted_on: null,
            ship_code: "",
            ship_details: "",
            ship_name: "",
            ship_status: "",
            under_repaired_since: null,
            vesselType: '',
            flag: '',
            vesselCode: '',
            managementType: '',
            owner: '',
            charterer: '',
            shipManager: '',
            pAndIClub: '',
            lifeBoatCapacity: '',
            wageScale: '',
            takeOverDate: '',
            status: '',
            image: null,
            lrMo: '',
            registeredPort: '',
            official: '',
            mmsi: '',
            currentClass: '',
            groupEmail: '',
            group: '',
            email: '',
            yearBuilt: '',
            age: '',
            yard: '',
            grtTwd: '',
            teu: '',
            nrt: '',
            length: '',
            breadth: '',
            depth: '',

            // === Vessel Particulars ===
            mainEngineMaker: '',
            mainEngineModel: '',
            mainEngineStrokeType: '',
            mainEngineKW: '',
            mainEngineBHP: '',
            mainEngineRPM: '',
            aux1Maker: '',
            aux1Model: '',
            aux1StrokeType: '',
            aux1KW: '',
            aux1BHP: '',
            aux1RPM: '',
            aux2Maker: '',
            aux2Model: '',
            aux2StrokeType: '',
            aux2KW: '',
            aux2BHP: '',
            aux2RPM: '',
            aux3Maker: '',
            aux3Model: '',
            aux3StrokeType: '',
            aux3KW: '',
            aux3BHP: '',
            aux3RPM: '',
            inmTerminalType: '',
            callSign: '',
            insValidDays: '0',
            tel1: '',
            tel2: '',
            mobileNumber: '',
            fax: '',
            data: '',
            hsd: '',
            inmC: '',
            accCode: '',
            trainingFees: '0',

            // === Vessel Allocation ===
            vesselEmail: '',
            technicalGroupEmail: '',
            crewGroupEmail: '',
            ownerRep: '',
            charterEmail: '',
            techSupdt: '',
            superintendent: '',
            fleetManager: '',
            techAssistant: '',
            marineAssistant: '',
            dpa: '',
            acctOfficer: '',
            performanceBonus: '',
        })
    }, [activeTab])

    const handleAddNewShip = () => {
        setSelectedShip(null);
        setShipDetailsFormData({
            AHA_ID: "",
            SHA_ID: "",
            // === Vessel Overview ===
            inactive_since: null,
            incorporated_since: null,
            inserted_on: null,
            ship_code: "",
            ship_details: "",
            ship_name: "",
            ship_status: "",
            under_repaired_since: null,
            vesselType: '',
            flag: '',
            vesselCode: '',
            managementType: '',
            owner: '',
            charterer: '',
            shipManager: '',
            pAndIClub: '',
            lifeBoatCapacity: '',
            wageScale: '',
            takeOverDate: '',
            status: '',
            image: null,
            lrMo: '',
            registeredPort: '',
            official: '',
            mmsi: '',
            currentClass: '',
            groupEmail: '',
            group: '',
            email: '',
            yearBuilt: '',
            age: '',
            yard: '',
            grtTwd: '',
            teu: '',
            nrt: '',
            length: '',
            breadth: '',
            depth: '',

            // === Vessel Particulars ===
            mainEngineMaker: '',
            mainEngineModel: '',
            mainEngineStrokeType: '',
            mainEngineKW: '',
            mainEngineBHP: '',
            mainEngineRPM: '',
            aux1Maker: '',
            aux1Model: '',
            aux1StrokeType: '',
            aux1KW: '',
            aux1BHP: '',
            aux1RPM: '',
            aux2Maker: '',
            aux2Model: '',
            aux2StrokeType: '',
            aux2KW: '',
            aux2BHP: '',
            aux2RPM: '',
            aux3Maker: '',
            aux3Model: '',
            aux3StrokeType: '',
            aux3KW: '',
            aux3BHP: '',
            aux3RPM: '',
            inmTerminalType: '',
            callSign: '',
            insValidDays: '0',
            tel1: '',
            tel2: '',
            mobileNumber: '',
            fax: '',
            data: '',
            hsd: '',
            inmC: '',
            accCode: '',
            trainingFees: '0',

            // === Vessel Allocation ===
            vesselEmail: '',
            technicalGroupEmail: '',
            crewGroupEmail: '',
            ownerRep: '',
            charterEmail: '',
            techSupdt: '',
            superintendent: '',
            fleetManager: '',
            techAssistant: '',
            marineAssistant: '',
            dpa: '',
            acctOfficer: '',
            performanceBonus: '',
        })

        setActiveTab('details');
        setBtnSaveVisibility('visible');
        setBtnUpdateVisibility('hidden');
        setBtnDeleteVisibility('hidden');
    };


    const handleEdit = (ship) => {
        setSelectedShip(ship);
        setShipDetailsFormData({
            AHA_ID: ship.AHA_ID || null,
            SHA_ID: ship.SHA_ID || null,
            // === Vessel Overview ===
            inactive_since: ship.inactive_since || null,
            incorporated_since: ship.incorporated_since || null,
            inserted_on: ship.inserted_on || null,
            ship_code: ship.ship_code || '',
            ship_details: ship.ship_details || '',
            ship_name: ship.ship_name || '',
            ship_status: ship.ship_status || null,
            under_repaired_since: ship.under_repaired_since || null,

            vesselType: '',
            flag: '',
            managementType: '',
            owner: '',
            charterer: '',
            shipManager: '',
            pAndIClub: '',
            lifeBoatCapacity: '',
            wageScale: '',
            takeOverDate: '',
            status: '',
            image: null,
            lrMo: '',
            registeredPort: '',
            official: '',
            mmsi: '',
            currentClass: '',
            groupEmail: '',
            group: '',
            email: '',
            yearBuilt: '',
            age: '',
            yard: '',
            grtTwd: '',
            teu: '',
            nrt: '',
            length: '',
            breadth: '',
            depth: '',

            // === Vessel Particulars ===
            mainEngineMaker: '',
            mainEngineModel: '',
            mainEngineStrokeType: '',
            mainEngineKW: '',
            mainEngineBHP: '',
            mainEngineRPM: '',
            aux1Maker: '',
            aux1Model: '',
            aux1StrokeType: '',
            aux1KW: '',
            aux1BHP: '',
            aux1RPM: '',
            aux2Maker: '',
            aux2Model: '',
            aux2StrokeType: '',
            aux2KW: '',
            aux2BHP: '',
            aux2RPM: '',
            aux3Maker: '',
            aux3Model: '',
            aux3StrokeType: '',
            aux3KW: '',
            aux3BHP: '',
            aux3RPM: '',
            inmTerminalType: '',
            callSign: '',
            insValidDays: '0',
            tel1: '',
            tel2: '',
            mobileNumber: '',
            fax: '',
            data: '',
            hsd: '',
            inmC: '',
            accCode: '',
            trainingFees: '0',

            // === Vessel Allocation ===
            vesselEmail: '',
            technicalGroupEmail: '',
            crewGroupEmail: '',
            ownerRep: '',
            charterEmail: '',
            techSupdt: '',
            superintendent: '',
            fleetManager: '',
            techAssistant: '',
            marineAssistant: '',
            dpa: '',
            acctOfficer: '',
            performanceBonus: '',
        })

        setActiveTab('details');
        setBtnSaveVisibility('hidden');
        setBtnUpdateVisibility('visible');
        setBtnDeleteVisibility('visible');
    };


    const handleView = (ship) => {
        setShipData(ship);
        setActiveTab('details');
        console.log('View:', ship);

        setBtnSaveVisibility('hidden')
        setBtnUpdateVisibility('hidden')
        setBtnDeleteVisibility('hidden')
    };

    const handleAddNewComponent = async (parentComponent) => {
        try {
            // 1. Validate component name
            if (!newComponentName.trim()) {
                alert("Component name is required.");
                return;
            }

            // 2. Convert file to Base64 if present
            let fileBase64 = null;
            if (newCompHasDesignFile && designFile) {
                const reader = new FileReader();
                fileBase64 = await new Promise((resolve, reject) => {
                    reader.onload = () => {
                        // Extract Base64 part (remove data URL prefix)
                        resolve(reader.result.split(',')[1]);
                    };
                    reader.onerror = reject;
                    reader.readAsDataURL(designFile);
                });
            }

            // 3. Prepare payload and API endpoint based on parent type
            let payload = null;
            let apiEndpoint = '';

            if (parentComponent?.type) {
                // Parent exists → adding a child component
                switch (parentComponent.type) {
                    case 'category':
                        // Add a sub-category under a category
                        payload = {
                            CHA_ID: parentComponent.data.CHA_ID,
                            sub_category_name: newComponentName,
                            sub_cat_type: 2, // 2 = Component
                            inserted_on: new Date().toISOString(),
                            sub_cat_status: 1, // 1 = Active
                            inserted_by: user.UHA_ID,
                            component_no: '', // Will be generated on backend
                            design_file: fileBase64, // Send as Base64 string
                            can_jcd_triggered: newCompCanJCDConfig ? 1 : 0 // 1 = Yes
                        };
                        apiEndpoint = `${API_URL}add-sub-category`;
                        break;

                    case 'sub_category':
                        // Add a second sub-category under a sub-category
                        payload = {
                            CHA_ID: parentComponent.data.CHA_ID,
                            SCHA_ID: parentComponent.data.SCHA_ID,
                            second_sub_cat_name: newComponentName,
                            second_sub_cat_type: 2,
                            inserted_on: new Date().toISOString(),
                            second_sub_cat_status: 1,
                            inserted_by: user.UHA_ID,
                            component_no: '',
                            design_file: null, // No file for now
                            can_jcd_triggered: newCompCanJCDConfig ? 1 : 0
                        };
                        apiEndpoint = `${API_URL}add-second-sub-category`;
                        break;

                    case 'second_sub_category':
                        // Add a third sub-category under a second sub-category
                        payload = {
                            CHA_ID: parentComponent.data.CHA_ID,
                            SCHA_ID: parentComponent.data.SCHA_ID,
                            SSCHA_ID: parentComponent.data.SSCHA_ID,
                            third_sub_cat_name: newComponentName,
                            third_sub_cat_type: 2,
                            inserted_on: new Date().toISOString().split('T')[0], // YYYY-MM-DD
                            third_sub_cat_status: 1,
                            inserted_by: user.UHA_ID,
                            component_no: '',
                            design_file: null,
                            can_jcd_triggered: newCompCanJCDConfig ? 1 : 0
                        };

                        console.log('payload :: ', payload)
                        apiEndpoint = `${API_URL}add-third-sub-category`;
                        break;

                    case 'third_sub_category':
                        // Cannot add under third sub-category
                        alert('Cannot add component under third sub-category.');
                        return;

                    default:
                        console.warn('Unsupported parent component type:', parentComponent.type);
                        alert('Unsupported component type.');
                        return;
                }
            } else {
                // No parent → adding a new root category
                payload = {
                    CHA_ID: "", // Will be generated on backend
                    category_name: newComponentName,
                    cat_type: 2, // 2 = Component
                    inserted_on: new Date().toISOString(),
                    cat_status: 1,
                    inserted_by: user.UHA_ID,
                    component_no: "",
                    design_file: fileBase64,
                    can_jcd_triggered: newCompCanJCDConfig ? 1 : 0
                };
                apiEndpoint = `${API_URL}add-root-category`;
            }

            // 4. Send request to backend
            const response = await axios.post(apiEndpoint, payload, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            // 5. Handle success
            if (response.data.success) {
                alert('Component added successfully!');
                // Refresh data to reflect changes
                refreshAgencyList?.();
                refreshShipsList?.();
                refreshTree?.(); // Refresh component tree
                refreshShipsHealthList?.()

                // Reset form
                setNeedToInvokeAddNewComponentForm(false);
                setNewComponentName('');
                setDesignFile(null);
                setNewCompHasDesignFile(false);
                setNewCompCanJCDConfig(false);
            } else {
                // Handle backend error message
                alert('Failed: ' + (response.data.message || 'Unknown error'));
            }

        } catch (err) {
            // 6. Handle any error during the process
            console.error('Error while adding new component:', err);

            // Provide user-friendly error message
            if (err.response) {
                // Server responded with error status
                alert('Server error: ' + (err.response.data.message || err.response.statusText));
            } else if (err.request) {
                // Request was made but no response
                alert('No response from server. Check your connection or server status.');
            } else {
                // Something else happened
                alert('Request error: ' + err.message);
            }
        }
    };

    const handleEditExistingComponent = async (currentSelectedNode) => {
        if (!currentSelectedNode) {
            alert('No component selected to edit.');
            return;
        }

        if (!newComponentName.trim()) {
            alert('Component name is required.');
            return;
        }

        setLoading(true);
        try {
            let fileBase64 = null;
            if (newCompHasDesignFile && designFile) {
                const reader = new FileReader();
                fileBase64 = await new Promise((resolve, reject) => {
                    reader.onload = () => resolve(reader.result.split(',')[1]);
                    reader.onerror = reject;
                    reader.readAsDataURL(designFile);
                });
            }

            let payload = {};
            let endpoint = '';

            switch (currentSelectedNode.type) {
                case 'category':
                    payload = {
                        CHA_ID: currentSelectedNode.data.CHA_ID,
                        category_name: newComponentName,
                        design_file: fileBase64,
                        can_jcd_triggered: newCompCanJCDConfig ? 1 : 0
                    };
                    endpoint = `${API_BASE_URL}updateRootCategory`;
                    break;

                case 'sub_category':
                    payload = {
                        SCHA_ID: currentSelectedNode.data.SCHA_ID,
                        sub_category_name: newComponentName,
                        design_file: fileBase64,
                        can_jcd_triggered: newCompCanJCDConfig ? 1 : 0
                    };
                    endpoint = `${API_BASE_URL}updateSubCategory`;
                    break;

                case 'second_sub_category':
                    payload = {
                        SSCHA_ID: currentSelectedNode.data.SSCHA_ID,
                        second_sub_cat_name: newComponentName,
                        can_jcd_triggered: newCompCanJCDConfig ? 1 : 0
                    };
                    endpoint = `${API_BASE_URL}updateSecondSubCategory`;
                    break;

                case 'third_sub_category':
                    payload = {
                        TSCHA_ID: currentSelectedNode.data.TSCHA_ID,
                        third_sub_cat_name: newComponentName,
                        can_jcd_triggered: newCompCanJCDConfig ? 1 : 0
                    };
                    endpoint = `${API_BASE_URL}updateThirdSubCategory`;
                    break;

                case 'part':
                    payload = {
                        PHA_ID: currentSelectedNode.data.PHA_ID,
                        part_name: newComponentName,
                        can_jcd_triggered: newCompCanJCDConfig ? 1 : 0
                    };
                    endpoint = `${API_BASE_URL}updatePart`;
                    break;

                default:
                    alert('Unsupported component type');
                    return;
            }

            const response = await axios.put(endpoint, { newComponentName, newCompHasDesignFile, newCompCanJCDConfig, designFile, currentSelectedNode });
            alert(response.data.message || 'Component updated successfully!');

            // Reset
            setNeedToInvokeEditComponentForm(false);
            refreshTree();
            refreshShipsList();
            refreshAgencyList();
            refreshShipsHealthList();

            setNewComponentName('');
            setDesignFile(null);
            setNewCompHasDesignFile(false);
            setShipHealthNewStatus(0)

        } catch (err) {
            console.error('Error updating component:', err);
            alert('Failed to update component: ' + (err.response?.data?.message || err.message));
        } finally {
            setLoading(false);
        }
    };


    const handleShipHealthStatusChange = () => {
        setNeedToInvokeShipHealthStatusChangeForm(true)
    }

    const handleConfirmShipHealthStatusChange = async (shipHealthStatusNumericValue) => {

        if (shipHealthStatusNumericValue == 0 || !shipHealthStatusNumericValue) {
            alert('Invalid Selection')
            return
        }

        // if all is correct then Authentication will take care of next
        setAuthRequired(true)
    }

    // Reusable inline styles
    const fieldStyle = {
        marginBottom: '18px',
    };

    const inputStyle = {
        width: '100%',
        padding: '10px',
        marginTop: '5px',
        border: '1px solid #ccc',
        borderRadius: '4px',
        fontSize: '14px',
    };

    const requiredStar = {
        color: 'red',
    };

    // ====================================================================================================
    // ====================================================================================================
    // ====================================================================================================

    // Handle all input changes
    const handleChange = (e) => {
        const { name, value, type, files } = e.target;

        if (type === 'file') {
            setShipDetailsFormData((prev) => ({ ...prev, [name]: files[0] }));
        } else if (name === 'yearBuilt') {
            const year = parseInt(value);
            const currentYear = new Date().getFullYear();
            const age = !isNaN(year) && year > 0 ? currentYear - year : '';
            setShipDetailsFormData((prev) => ({ ...prev, [name]: value, age }));
        } else {
            setShipDetailsFormData((prev) => ({ ...prev, [name]: value }));
        }
    };

    const subTabBtnStyle = (isActive) => ({
        padding: '10px 16px',
        margin: '0 8px',
        border: '1px solid #ddd',
        background: isActive ? '#6c5ce7' : 'white',
        color: isActive ? 'white' : '#333',
        borderRadius: '6px',
        fontWeight: '500',
        cursor: 'not-allowed',
        transition: 'all 0.3s ease',
    });

    const labelStyle = {
        display: 'block',
        marginBottom: '5px',
        fontWeight: '500',
        fontSize: '14px',
    };

    const fieldContainer = {
        marginBottom: '18px',
        animation: 'fadeIn 0.4s ease-out forwards',
    };

    const grid2Col = {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '16px',
        marginBottom: '16px',
    };

    const grid3Col = {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr 1fr',
        gap: '16px',
        marginBottom: '16px',
    };

    const field = (label, input, required = false) => (
        <div style={fieldContainer}>
            <label style={labelStyle}>
                {label} {required && <span style={requiredStar}>*</span>}
            </label>
            {input}
        </div>
    );

    return (
        <div id='ship-management-page-main-container'>
            {/* LEFT PANEL - SHIP LIST */}
            <div id='ship-management-page-main-container-left-container' className='ship-management-page-main-sub-containers'>
                <div id='ship-management-page-left-container-shipDetails-container'>
                    <h2 style={{ fontWeight: '400', fontSize: '2rem', textAlign: 'center' }}>Location Management</h2>

                    <div id='ship-management-page-left-container-shipDetails-content'>
                        <table id='left-container-shipDetails-content-table'>
                            <thead>
                                <tr style={{ backgroundColor: 'royalblue' }}>
                                    <th></th>
                                    <th>Location Name</th>
                                    <th>Code</th>
                                    <th>Operations</th>
                                </tr>
                            </thead>

                            <tbody>
                                {shipsList.length > 0 ? (
                                    shipsList.map((ship) => (
                                        <tr key={ship.SHA_ID}>
                                            <td>
                                                <input
                                                    type="radio"
                                                    name="ship"
                                                    id={ship.SHA_ID}
                                                    checked={selectedShip?.SHA_ID == ship.SHA_ID}
                                                    onChange={() => setSelectedShip(ship)}
                                                />
                                            </td>
                                            <td>{ship.ship_name}</td>
                                            <td>{ship.ship_code}</td>
                                            <td>
                                                <button onClick={() => handleEdit(ship)}>Edit</button>
                                                <button onClick={() => handleView(ship)}>View</button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="4" className="no-ships">
                                            No locations found
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>

                        <button id='left-container-shipDetails-content-table-btn-add-new' onClick={handleAddNewShip}>
                            <i className="fas fa-plus-circle"></i> Add New Location
                        </button>
                    </div>
                </div>
            </div>

            {/* RIGHT PANEL - TABS & CONTENT */}
            <div id='ship-management-page-main-container-right-container' className='ship-management-page-main-sub-containers'>
                {/* Tabs */}
                <div id='ship-management-page-main-container-right-container-tabs-container'>
                    <h2
                        className={activeTab === 'details' ? 'active' : ''}
                        onClick={() => selectedShip?.SHA_ID && setActiveTab('details')}
                        style={{ cursor: selectedShip?.SHA_ID ? 'pointer' : 'not-allowed', opacity: selectedShip?.SHA_ID ? 1 : 0.6 }}
                    >
                        Location Details
                    </h2>
                    <h2
                        className={activeTab === 'crew' ? 'active' : ''}
                        onClick={() => selectedShip?.SHA_ID && setActiveTab('crew')}
                        style={{ cursor: selectedShip?.SHA_ID ? 'pointer' : 'not-allowed', opacity: selectedShip?.SHA_ID ? 1 : 0.6 }}
                    >
                        Crew List
                    </h2>
                    <h2
                        className={activeTab === 'components' ? 'active' : ''}
                        onClick={() => selectedShip?.SHA_ID && setActiveTab('components')}
                        style={{ cursor: selectedShip?.SHA_ID ? 'pointer' : 'not-allowed', opacity: selectedShip?.SHA_ID ? 1 : 0.6 }}
                    >
                        Components
                    </h2>
                    <h2
                        className={activeTab === 'health' ? 'active' : ''}
                        onClick={() => selectedShip?.SHA_ID && setActiveTab('health')}
                        style={{ cursor: selectedShip?.SHA_ID ? 'pointer' : 'not-allowed', opacity: selectedShip?.SHA_ID ? 1 : 0.6 }}
                    >
                        Location Health
                    </h2>
                </div>

                {/* Tab Content */}
                <div id='ship-management-page-right-container-content'>
                    {selectedShip?.SHA_ID || !selectedShip?.SHA_ID ? (
                        <>
                            {/* Ship Details Tab */}
                            {activeTab === 'details' && (
                                <div style={{
                                    fontFamily: 'Arial, sans-serif',
                                    padding: '20px',
                                    // backgroundColor: '#f8f9fa',
                                    minHeight: '100vh',
                                }}>
                                    {/* Main Tabs */}
                                    {/* <div style={{ marginBottom: '20px', borderBottom: '2px solid #dee2e6' }}>
                                        {['details', 'crew', 'components', 'health'].map((tab) => (
                                            <button
                                                key={tab}
                                                onClick={() => setActiveTab(tab)}
                                                style={tabBtnStyle(activeTab === tab)}
                                            >
                                                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                                            </button>
                                        ))}
                                    </div> */}

                                    {activeTab === 'details' && (
                                        <div style={{ animation: 'slideIn 0.4s ease-out', backgroundColor: 'transparent' }}>
                                            {/* Sub Tabs */}
                                            <div style={{ display: 'flex', flexWrap: 'wrap', position: 'sticky', top: 0, left: 0, zIndex: 2, backgroundColor: 'rgba(255, 255, 255, 0.1)', backdropFilter: 'blur(2px)', padding: '20px 0px', justifyContent: 'center', alignItems: 'center', borderRadius: '10px' }}>
                                                {[
                                                    { key: 'vslOverview', label: 'Location Overview' },
                                                    { key: 'vslParticular', label: 'Location Particulars' },
                                                    { key: 'vslAllocation', label: 'Location Allocation' },
                                                    { key: 'crewList', label: 'Crew List' },
                                                ].map(({ key, label }) => (
                                                    <button
                                                        key={key}
                                                        // onClick={() => selectedShip?.SHA_ID && setDetailsSubActiveTab(key)}
                                                        style={subTabBtnStyle(detailsSubActiveTab === key)}
                                                    >
                                                        {label}
                                                    </button>
                                                ))}
                                            </div>

                                            {/* Sub Tab Content */}
                                            {selectedShip?.SHA_ID && (
                                                <>
                                                    {detailsSubActiveTab === 'vslOverview' && (
                                                        <div style={{ padding: '24px', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
                                                            <h1 style={{ textAlign: 'center', color: '#6c757d', marginBottom: '30px' }}>Location Overview</h1>

                                                            <div style={grid2Col}>
                                                                {field("Location Name", <input type="text" name="ship_name" value={shipDetailsFormData.ship_name} onChange={handleChange} style={inputStyle} required />, true)}
                                                                {field("Location Type", (
                                                                    <select name="vesselType" value={shipDetailsFormData.vesselType} onChange={handleChange} style={inputStyle} required>
                                                                        <option value="">Select Type</option>
                                                                        <option value="BULK_CARRIER">BULK CARRIER</option>
                                                                        <option value="Container">Container</option>
                                                                        <option value="GENERAL_CARGO">GENERAL CARGO</option>
                                                                    </select>
                                                                ), true)}
                                                                {field("Flag", (
                                                                    <select name="flag" value={shipDetailsFormData.flag} onChange={handleChange} style={inputStyle} required>
                                                                        <option value="">Select Flag</option>
                                                                        <option value="India">India</option>
                                                                        <option value="USA">USA</option>
                                                                        <option value="UK">UK</option>
                                                                        <option value="Singapore">Singapore</option>
                                                                    </select>
                                                                ), true)}
                                                                {field("Location Code", <input type="text" name="vesselCode" value={shipDetailsFormData.vesselCode} onChange={handleChange} style={inputStyle} />)}
                                                            </div>

                                                            <div style={grid3Col}>
                                                                {field("Management Type", (
                                                                    <select name="managementType" value={shipDetailsFormData.managementType} onChange={handleChange} style={inputStyle}>
                                                                        <option value="">Select</option>
                                                                        <option value="Self">Self</option>
                                                                    </select>
                                                                ))}
                                                                {field("Owner", <select name="owner" value={shipDetailsFormData.owner} onChange={handleChange} style={inputStyle} />)}
                                                                {field("Charterer", <select name="charterer" value={shipDetailsFormData.charterer} onChange={handleChange} style={inputStyle} />)}
                                                                {field("Location Manager", <select name="shipManager" value={shipDetailsFormData.shipManager} onChange={handleChange} style={inputStyle} />)}
                                                                {field("P & I Club", <select name="pAndIClub" value={shipDetailsFormData.pAndIClub} onChange={handleChange} style={inputStyle} />)}
                                                                {field("Life Boat Capacity", <input type="text" name="lifeBoatCapacity" value={shipDetailsFormData.lifeBoatCapacity} onChange={handleChange} style={inputStyle} />)}
                                                                {field("Wage Scale", <input type="text" name="wageScale" value={shipDetailsFormData.wageScale} onChange={handleChange} style={inputStyle} />)}
                                                                {field("Take Over Date", <input type="date" name="takeOverDate" value={shipDetailsFormData.takeOverDate} onChange={handleChange} style={inputStyle} />)}
                                                                {field("Status", (
                                                                    <select name="status" value={shipDetailsFormData.ship_status} onChange={handleChange} style={inputStyle}>
                                                                        <option value="">Select Status</option>
                                                                        <option value="1">Active</option>
                                                                        <option value="2">Inactive</option>
                                                                    </select>
                                                                ))}
                                                                {field("Image", <input type="file" name="image" onChange={handleChange} style={inputStyle} />)}
                                                            </div>

                                                            <div style={grid3Col}>
                                                                {field("LR / MO", <input type="text" name="lrMo" value={shipDetailsFormData.lrMo} onChange={handleChange} style={inputStyle} />)}
                                                                {field("Registered Port", <select name="registeredPort" value={shipDetailsFormData.registeredPort} onChange={handleChange} style={inputStyle} />)}
                                                                {field("Official Number", <input type="text" name="official" value={shipDetailsFormData.official} onChange={handleChange} style={inputStyle} />)}
                                                                {field("MMSI", <input type="text" name="mmsi" value={shipDetailsFormData.mmsi} onChange={handleChange} style={inputStyle} />)}
                                                                {field("Current Class", <select name="currentClass" value={shipDetailsFormData.currentClass} onChange={handleChange} style={inputStyle} />)}
                                                                {field("Group", <select name="group" value={shipDetailsFormData.group} onChange={handleChange} style={inputStyle} />)}
                                                                {field("Group Email", <input type="email" name="groupEmail" value={shipDetailsFormData.groupEmail} onChange={handleChange} style={inputStyle} />)}
                                                                {field("Email", <input type="email" name="email" value={shipDetailsFormData.email} onChange={handleChange} style={inputStyle} />)}
                                                                {field("Year Built", <input type="number" name="yearBuilt" value={shipDetailsFormData.yearBuilt} onChange={handleChange} style={inputStyle} />)}
                                                                {field("Age", <input type="text" value={shipDetailsFormData.age} readOnly style={{ ...inputStyle }} />)}
                                                                {field("Yard", <input type="text" name="yard" value={shipDetailsFormData.yard} onChange={handleChange} style={inputStyle} />)}
                                                                {field("GRT / TWD", <input type="text" name="grtTwd" value={shipDetailsFormData.grtTwd} onChange={handleChange} style={inputStyle} />)}
                                                                {field("TEU", <input type="text" name="teu" value={shipDetailsFormData.teu} onChange={handleChange} style={inputStyle} />)}
                                                                {field("NRT", <input type="text" name="nrt" value={shipDetailsFormData.nrt} onChange={handleChange} style={inputStyle} />)}
                                                                {field("Length", <input type="text" name="length" value={shipDetailsFormData.length} onChange={handleChange} style={inputStyle} />)}
                                                                {field("Breadth", <input type="text" name="breadth" value={shipDetailsFormData.breadth} onChange={handleChange} style={inputStyle} />)}
                                                                {field("Depth", <input type="text" name="depth" value={shipDetailsFormData.depth} onChange={handleChange} style={inputStyle} />)}
                                                            </div>

                                                            <div style={{ textAlign: 'center', marginTop: '30px' }}>
                                                                <button type="button" style={{
                                                                    padding: '12px 30px',
                                                                    backgroundColor: '#27ae60',
                                                                    color: 'white',
                                                                    border: 'none',
                                                                    borderRadius: '6px',
                                                                    fontSize: '16px',
                                                                    cursor: 'pointer'
                                                                }}
                                                                    onClick={handleNextSubTab}
                                                                >
                                                                    Next
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* === Vessel Particulars === */}
                                                    {detailsSubActiveTab === 'vslParticular' && (
                                                        <div style={{ padding: '24px', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
                                                            <h1 style={{ textAlign: 'center', color: '#6c757d', marginBottom: '24px' }}>Location Particulars</h1>

                                                            <div style={grid2Col}>
                                                                {field("Location Name", <input type="text" value={shipDetailsFormData.ship_name} disabled style={{ ...inputStyle }} />)}
                                                                {field("Flag", <input type="text" value={shipDetailsFormData.flag} disabled style={{ ...inputStyle }} />)}
                                                            </div>

                                                            {['Main', 'AUX 1', 'AUX 2', 'AUX 3'].map((engine, idx) => {
                                                                const prefix = idx === 0 ? 'mainEngine' : `aux${idx}Engine`;
                                                                return (
                                                                    <fieldset key={idx} style={{
                                                                        marginBottom: '24px',
                                                                        padding: '18px',
                                                                        border: '1px solid #ccc',
                                                                        borderRadius: '8px',

                                                                    }}>
                                                                        <legend style={{ fontWeight: 'bold', fontSize: '16px', padding: '0 10px' }}>
                                                                            {engine} Engine
                                                                        </legend>
                                                                        <div style={grid3Col}>
                                                                            {field("Maker", (
                                                                                <select name={`${prefix}Maker`} value={shipDetailsFormData[`${prefix}Maker`]} onChange={handleChange} style={inputStyle}>
                                                                                    <option value="">Select Maker</option>
                                                                                    <option value="MAN">MAN</option>
                                                                                    <option value="Wärtsilä">Wärtsilä</option>
                                                                                    <option value="HSD">HSD</option>
                                                                                </select>
                                                                            ))}
                                                                            {field("Model", <input type="text" name={`${prefix}Model`} value={shipDetailsFormData[`${prefix}Model`]} onChange={handleChange} style={inputStyle} />)}
                                                                            {field("Stroke Type", (
                                                                                <select name={`${prefix}StrokeType`} value={shipDetailsFormData[`${prefix}StrokeType`]} onChange={handleChange} style={inputStyle}>
                                                                                    <option value="">Select Type</option>
                                                                                    <option value="2-Stroke">2-Stroke</option>
                                                                                    <option value="4-Stroke">4-Stroke</option>
                                                                                </select>
                                                                            ))}
                                                                            {field("KW", <input type="text" name={`${prefix}KW`} value={shipDetailsFormData[`${prefix}KW`]} onChange={handleChange} style={inputStyle} />)}
                                                                            {field("BHP", <input type="text" name={`${prefix}BHP`} value={shipDetailsFormData[`${prefix}BHP`]} onChange={handleChange} style={inputStyle} />)}
                                                                            {field("RPM", <input type="text" name={`${prefix}RPM`} value={shipDetailsFormData[`${prefix}RPM`]} onChange={handleChange} style={inputStyle} />)}
                                                                        </div>
                                                                    </fieldset>
                                                                );
                                                            })}

                                                            <div style={grid3Col}>
                                                                {field("INM Terminal Type", <input type="text" name="inmTerminalType" value={shipDetailsFormData.inmTerminalType} onChange={handleChange} style={inputStyle} />)}
                                                                {field("Call Sign", <input type="text" name="callSign" value={shipDetailsFormData.callSign} onChange={handleChange} style={inputStyle} />)}
                                                                {field("Ins. Valid Days", <input type="number" name="insValidDays" value={shipDetailsFormData.insValidDays} onChange={handleChange} style={inputStyle} />)}
                                                                {field("Tel1", <input type="text" name="tel1" value={shipDetailsFormData.tel1} onChange={handleChange} style={inputStyle} />)}
                                                                {field("Tel2", <input type="text" name="tel2" value={shipDetailsFormData.tel2} onChange={handleChange} style={inputStyle} />)}
                                                                {field("Mobile Number", <input type="text" name="mobileNumber" value={shipDetailsFormData.mobileNumber} onChange={handleChange} style={inputStyle} />)}
                                                                {field("Fax", <input type="text" name="fax" value={shipDetailsFormData.fax} onChange={handleChange} style={inputStyle} />)}
                                                                {field("Data", <input type="text" name="data" value={shipDetailsFormData.data} onChange={handleChange} style={inputStyle} />)}
                                                                {field("HSD", <input type="text" name="hsd" value={shipDetailsFormData.hsd} onChange={handleChange} style={inputStyle} />)}
                                                                {field("Inm C", <input type="text" name="inmC" value={shipDetailsFormData.inmC} onChange={handleChange} style={inputStyle} />)}
                                                                {field("Acc. Code", <input type="text" name="accCode" value={shipDetailsFormData.accCode} onChange={handleChange} style={inputStyle} />)}
                                                                {field("Training Fees", <input type="number" name="trainingFees" value={shipDetailsFormData.trainingFees} onChange={handleChange} style={inputStyle} />)}
                                                            </div>

                                                            <div style={{ textAlign: 'center', marginTop: '30px' }}>
                                                                <button type="button" style={{
                                                                    padding: '12px 30px',
                                                                    backgroundColor: '#27ae60',
                                                                    color: 'white',
                                                                    border: 'none',
                                                                    borderRadius: '6px',
                                                                    fontSize: '16px',
                                                                    cursor: 'pointer'
                                                                }} onClick={handleNextSubTab}>
                                                                    Next
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* === Vessel Allocation === */}
                                                    {detailsSubActiveTab === 'vslAllocation' && (
                                                        <div style={{ padding: '24px', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
                                                            <h1 style={{ textAlign: 'center', color: '#6c757d', marginBottom: '24px' }}>Location Allocation</h1>

                                                            <div style={grid2Col}>
                                                                {field("Location Email", <input type="email" name="vesselEmail" value={shipDetailsFormData.vesselEmail} onChange={handleChange} style={inputStyle} required />, true)}
                                                                {field("Technical Group Email", <input type="email" name="technicalGroupEmail" value={shipDetailsFormData.technicalGroupEmail} onChange={handleChange} style={inputStyle} required />, true)}
                                                                {field("Crew Group Email", <input type="email" name="crewGroupEmail" value={shipDetailsFormData.crewGroupEmail} onChange={handleChange} style={inputStyle} required />, true)}
                                                                {field("Owner Rep", <input type="text" name="ownerRep" value={shipDetailsFormData.ownerRep} onChange={handleChange} style={inputStyle} required />, true)}
                                                                {field("Charter Email", <input type="email" name="charterEmail" value={shipDetailsFormData.charterEmail} onChange={handleChange} style={inputStyle} required />, true)}
                                                            </div>

                                                            <div style={grid3Col}>
                                                                {field("Tech Supdt", (
                                                                    <select name="techSupdt" value={shipDetailsFormData.techSupdt} onChange={handleChange} style={inputStyle} required>
                                                                        <option value="">Select</option>
                                                                        <option value="supdt1">John Smith</option>
                                                                        <option value="supdt2">Anna Lee</option>
                                                                    </select>
                                                                ), true)}
                                                                {field("Superintendent", (
                                                                    <select name="superintendent" value={shipDetailsFormData.superintendent} onChange={handleChange} style={inputStyle} required>
                                                                        <option value="">Select</option>
                                                                        <option value="sp1">David Kim</option>
                                                                    </select>
                                                                ), true)}
                                                                {field("Fleet Manager", (
                                                                    <select name="fleetManager" value={shipDetailsFormData.fleetManager} onChange={handleChange} style={inputStyle} required>
                                                                        <option value="">Select</option>
                                                                        <option value="fm1">Robert Green</option>
                                                                    </select>
                                                                ), true)}
                                                                {field("Tech Assistant", (
                                                                    <select name="techAssistant" value={shipDetailsFormData.techAssistant} onChange={handleChange} style={inputStyle} required>
                                                                        <option value="">Select</option>
                                                                        <option value="ta1">Chris Evans</option>
                                                                    </select>
                                                                ), true)}
                                                                {field("Marine Assistant", (
                                                                    <select name="marineAssistant" value={shipDetailsFormData.marineAssistant} onChange={handleChange} style={inputStyle} required>
                                                                        <option value="">Select</option>
                                                                        <option value="ma1">Daniel Craig</option>
                                                                    </select>
                                                                ), true)}
                                                                {field("DPA", (
                                                                    <select name="dpa" value={shipDetailsFormData.dpa} onChange={handleChange} style={inputStyle} required>
                                                                        <option value="">Select</option>
                                                                        <option value="dpa1">Alice Johnson</option>
                                                                    </select>
                                                                ), true)}
                                                                {field("Acct Officer", (
                                                                    <select name="acctOfficer" value={shipDetailsFormData.acctOfficer} onChange={handleChange} style={inputStyle} required>
                                                                        <option value="">Select</option>
                                                                        <option value="ao1">Kevin Hart</option>
                                                                    </select>
                                                                ), true)}
                                                            </div>

                                                            <div style={fieldContainer}>
                                                                <label style={labelStyle}>Applicable for Performance Bonus <span style={requiredStar}>*</span></label>
                                                                <div style={{ display: 'flex', gap: '30px', marginTop: '8px' }}>
                                                                    <label><input type="radio" name="performanceBonus" value="yes" checked={shipDetailsFormData.performanceBonus === 'yes'} onChange={handleChange} required /> Yes</label>
                                                                    <label><input type="radio" name="performanceBonus" value="no" checked={shipDetailsFormData.performanceBonus === 'no'} onChange={handleChange} required /> No</label>
                                                                </div>
                                                            </div>

                                                            <div style={{ textAlign: 'center', marginTop: '30px' }}>
                                                                <button type="button" style={{
                                                                    padding: '12px 30px',
                                                                    backgroundColor: '#27ae60',
                                                                    color: 'white',
                                                                    border: 'none',
                                                                    borderRadius: '6px',
                                                                    fontSize: '16px',
                                                                    cursor: 'pointer'
                                                                }} onClick={handleNextSubTab}>
                                                                    Next
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* === Crew List === */}
                                                    {detailsSubActiveTab === 'crewList' && (
                                                        <div style={{
                                                            textAlign: 'center',
                                                            padding: '60px 20px',
                                                            // backgroundColor: '#fff',
                                                            borderRadius: '8px',
                                                            boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                                                            color: '#6c757d',
                                                            animation: 'fadeIn 0.5s ease'
                                                        }}>
                                                            <h1 style={{ color: '#6c757d' }}>Crew List</h1>
                                                            <p>No crew data available yet.</p>
                                                        </div>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    )}

                                    {/* Animations */}
                                    <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideIn { from { transform: translateY(10px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
      `}</style>
                                </div>
                            )}

                            {/* Crew List Tab */}
                            {(activeTab === 'crew' && selectedShip?.SHA_ID) ? (
                                <div className="tab-content">
                                    <h3>Crew List for "{selectedShip?.SHA_ID}"</h3>
                                    <p>Number of crew members: <strong>24</strong></p>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
                                        <thead>
                                            <tr style={{ background: '#2c3e50', color: 'white' }}>
                                                <th style={{ padding: '8px', textAlign: 'left' }}>Name</th>
                                                <th style={{ padding: '8px', textAlign: 'left' }}>Role</th>
                                                <th style={{ padding: '8px', textAlign: 'left' }}>Rank</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr><td>John Doe</td><td>Captain</td><td>Master</td></tr>
                                            <tr><td>Jane Smith</td><td>Chief Engineer</td><td>Engineer</td></tr>
                                        </tbody>
                                    </table>
                                </div>
                            ) : activeTab == 'crew' && (
                                <div className='no-selection-placeholder'>
                                    <p>Select a location to view Crew Details.</p>
                                </div>
                            )}

                            {/* Components Tab */}
                            {activeTab === 'components' && (
                                <div className="tab-content">
                                    <div id='component-add-new-or-edit-funtionality-tab-container'>
                                        {/* Add New */}
                                        <div className="toggle-option-wrapper">
                                            <input
                                                type="radio"
                                                name="addNewOrEditFunctionalityForComponent"
                                                id="addNewForComponent"
                                                checked={isAddNewComponentChecked}
                                                onChange={() => {
                                                    setIsEditComponentChecked(false);
                                                    setIsAddNewComponentChecked(true);
                                                }}
                                            />
                                            <label htmlFor="addNewForComponent" className="toggle-option">
                                                Add New
                                            </label>
                                        </div>

                                        {/* Edit Existing */}
                                        <div className="toggle-option-wrapper">
                                            <input
                                                type="radio"
                                                name="addNewOrEditFunctionalityForComponent"
                                                id="editForComponent"
                                                checked={isEditComponentChecked}
                                                onChange={() => {
                                                    setIsEditComponentChecked(true);
                                                    setIsAddNewComponentChecked(false);
                                                }}
                                            />
                                            <label htmlFor="editForComponent" className="toggle-option">
                                                Edit Existing
                                            </label>
                                        </div>
                                    </div>

                                    {/* Add New Component */}
                                    {isAddNewComponentChecked && (
                                        <div id='addNewFunctionalityForComponent-component-heirarchy-container' className="functionality-container">
                                            <h3>Add New Component</h3>
                                            <Temp_component_heirarchy componentTreeWantByWhichComp={'ShipManagementPage_add_new_comp'} selectedShipID={selectedShip.SHA_ID} />
                                        </div>
                                    )}

                                    {/* Edit Existing Component */}
                                    {isEditComponentChecked && (
                                        <div id='editFunctionalityForComponent-component-heirarchy-container' className="functionality-container">
                                            <h3>Edit Existing Component</h3>
                                            <Temp_component_heirarchy componentTreeWantByWhichComp={'ShipManagementPage_edit_comp'} selectedShipID={selectedShip.SHA_ID} />
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Ship Health Tab */}
                            {activeTab === 'health' && (
                                selectedShip?.SHA_ID ? (
                                    <div className="tab-content">
                                        <h3>Location : {selectedShip?.ship_name}</h3>

                                        <table className="data-table">
                                            <thead>
                                                <tr>
                                                    <th>Sr.</th>
                                                    <th>Prev Status</th>
                                                    <th>Current Status</th>
                                                    <th>From DT</th>
                                                    <th>To DT</th>
                                                    <th>Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {/* <tr>
                                                    <td>1</td>
                                                    <td><span className="status-badge active">SEALING</span></td>
                                                    <td>25-07-2025</td>
                                                    <td>28-07-2025</td>
                                                    <td>
                                                        <button type="button" className="btn btn-preset">Preset</button>
                                                    </td>
                                                </tr> */}

                                                {shipsHealthList.filter(shipHealth => shipHealth.SHA_ID === selectedShip?.SHA_ID).length > 0 ? (
                                                    // If records exist, map through them
                                                    shipsHealthList
                                                        .filter(shipHealth => shipHealth.SHA_ID === selectedShip?.SHA_ID)
                                                        .map((shipHealth, index) => (
                                                            <tr key={shipHealth.SHH_ID || index}>
                                                                <td>{index + 1}</td>
                                                                <td>
                                                                    <span className="status-badge active">
                                                                        {shipHealth.previous_status}
                                                                    </span>
                                                                </td>
                                                                <td>
                                                                    <span className="status-badge active">
                                                                        {shipHealth.present_status}
                                                                    </span>
                                                                </td>
                                                                <td>{(shipHealth.inserted_on).split('T')[0].split('-').reverse().join('-')}</td>
                                                                <td>28-08-2025</td>
                                                                <td>
                                                                    <button type="button" className="btn btn-preset">Preset</button>
                                                                </td>
                                                            </tr>
                                                        ))
                                                ) : (
                                                    // If no records found, show placeholder row
                                                    <tr>
                                                        <td colSpan="6" className="no-records">
                                                            No health records found for {selectedShip?.SHA_ID.ship_name}.
                                                        </td>
                                                    </tr>
                                                )}

                                            </tbody>
                                        </table>

                                        <div className="health-actions">
                                            <button type="button" className="btn btn-primary" onClick={handleShipHealthStatusChange}>Change Status</button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="no-selection-placeholder">
                                        <p>Select a location to view its health status.</p>
                                    </div>
                                )
                            )}
                        </>
                    ) : activeTab == 'health' && (
                        <div className='no-selection-placeholder'>
                            <p>Select a location to view details.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Below Are PopUp Forms */}

            {/* Add Component Form */}
            {needToInvokeAddNewComponentForm && (
                <div id='ship-management-page-right-container-content-add-component-form-container'>
                    <div id='ship-management-page-right-container-content-add-component-form'>
                        <form onSubmit={(e) => {
                            e.preventDefault();
                            handleAddNewComponent(selectedNode);
                        }}>
                            {/* Header */}
                            <div id='ship-management-page-right-container-content-add-component-form-selected-node-container'>
                                <h3>Type of Selected Node: <strong>{selectedNode?.type}</strong></h3>
                            </div>

                            {/* Component Name */}
                            <div id='ship-management-page-right-container-content-add-component-form-name-container'>
                                <label htmlFor="component-name">
                                    New Component Name:
                                    <input
                                        id='new-comp-name'
                                        type="text"
                                        placeholder="Enter Component Name..."
                                        value={newComponentName}
                                        onChange={(e) => setNewComponentName(e.target.value)}
                                        required
                                    />
                                </label>
                            </div>

                            {/* Has Design File */}
                            <div id='ship-management-page-right-container-content-add-component-form-has-designFile-container'>
                                <label htmlFor="designFile" className="checkbox-label">
                                    Has Design File?
                                    <input
                                        id="new-comp-has-design-file"
                                        type="checkbox"
                                        checked={newCompHasDesignFile}
                                        onChange={() => {
                                            setNewCompHasDesignFile(!newCompHasDesignFile);
                                            setDesignFile(null);
                                        }}
                                    />
                                    {/* <span className="checkbox-custom"></span> */}
                                </label>
                            </div>

                            {/* File Upload */}
                            {newCompHasDesignFile && (
                                <div id='ship-management-page-right-container-content-add-component-form-designFile-upload-container'>
                                    <label htmlFor="designFileUpload">
                                        Upload Design File:
                                        <input
                                            id="designFileUpload"
                                            type="file"
                                            accept=".pdf,.dwg,.dxf,.doc,.docx"
                                            required={newCompHasDesignFile}
                                            onChange={(e) => {
                                                const file = e.target.files[0];
                                                if (file && !['.pdf', '.dwg', '.dxf', '.doc', '.docx'].some(ext => file.name.endsWith(ext))) {
                                                    alert('Only PDF, DWG, DXF, DOC, DOCX files are allowed.');
                                                    return;
                                                }
                                                setDesignFile(file);
                                            }}
                                        />
                                    </label>
                                    {designFile && (
                                        <p className="file-selected-info">
                                            Selected: <strong>{designFile.name}</strong>
                                        </p>
                                    )}
                                </div>
                            )}

                            {/* Can JCD Configure */}
                            <div id='ship-management-page-right-container-content-add-component-form-can-jcd-configure-container'>
                                <label htmlFor="canJCD_configure" className="checkbox-label">
                                    Can Job Configure on It?
                                    <input
                                        id='new-com-can-jcd-triggers'
                                        type="checkbox"
                                        checked={newCompCanJCDConfig}
                                        onChange={() => setNewCompCanJCDConfig(!newCompCanJCDConfig)}
                                    />
                                    {/* <span className="checkbox-custom"></span> */}
                                </label>
                            </div>

                            {/* Buttons */}
                            <div id='add-component-form'>
                                <button type='submit' className="btn-submit">
                                    Save
                                </button>
                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={() => {
                                        setNeedToInvokeAddNewComponentForm(false)
                                        setDesignFile(null)
                                        setNewCompHasDesignFile(false)
                                        setNewCompCanJCDConfig(false)
                                        setNewComponentName('')
                                    }}
                                >
                                    Close
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Component Form */}
            {needToInvokeEditComponentForm && (
                <div id='ship-management-page-right-container-content-add-component-form-container'>
                    <div id='ship-management-page-right-container-content-add-component-form'>
                        <form onSubmit={(e) => {
                            e.preventDefault();
                            handleEditExistingComponent(selectedNode); // Pass selected node
                        }}>
                            <div id='ship-management-page-right-container-content-add-component-form-selected-node-container'>
                                <h3>Editing: <strong>{selectedNode?.data?.label}</strong></h3>
                            </div>

                            <div id='ship-management-page-right-container-content-add-component-form-name-container'>
                                <label htmlFor="component-name">Component Name:</label>
                                <input
                                    type="text"
                                    value={newComponentName}
                                    onChange={(e) => setNewComponentName(e.target.value)}
                                    required
                                />
                            </div>

                            {/* Has Design File */}
                            <div id='ship-management-page-right-container-content-add-component-form-has-designFile-container'>
                                <label htmlFor="designFile" className="checkbox-label">
                                    Has Design File?
                                    <input
                                        type="checkbox"
                                        checked={newCompHasDesignFile}
                                        onChange={() => {
                                            setNewCompHasDesignFile(!newCompHasDesignFile);
                                            if (!newCompHasDesignFile) setDesignFile(null);
                                        }}
                                    />
                                    <span className="checkbox-custom"></span>
                                </label>
                            </div>

                            {/* File Upload */}
                            {newCompHasDesignFile && (
                                <div id='ship-management-page-right-container-content-add-component-form-designFile-upload-container'>
                                    <label htmlFor="designFileUpload">Upload New Design File:</label>
                                    <input
                                        type="file"
                                        onChange={(e) => setDesignFile(e.target.files[0])}
                                    />
                                </div>
                            )}

                            {/* Can JCD Configure */}
                            <div id='ship-management-page-right-container-content-add-component-form-can-jcd-configure-container'>
                                <label htmlFor="canJCD_configure" className="checkbox-label">
                                    Can Job Configure on It?
                                    <input
                                        type="checkbox"
                                        checked={newCompCanJCDConfig}
                                        onChange={() => setNewCompCanJCDConfig(!newCompCanJCDConfig)}
                                    />
                                    <span className="checkbox-custom"></span>
                                </label>
                            </div>

                            {/* Buttons */}
                            <div id='add-component-form'>
                                <button type='submit' className="btn-submit" disabled={loading}>
                                    {loading ? 'Updating...' : 'Update'}
                                </button>
                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={() => {
                                        setNeedToInvokeEditComponentForm(false);
                                        setNewComponentName('');
                                        setDesignFile(null);
                                        setNewCompHasDesignFile(false);
                                        setNewCompCanJCDConfig(false);
                                    }}
                                >
                                    Close
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Ship Status Change Container */}
            {needToInvokeShipHealthStatusChangeForm && (
                <div id='ship-management-page-right-container-content-ship-health-status-change-form-container'>
                    <div id='ship-management-page-right-container-content-ship-health-status-change-form'>
                        <form onSubmit={(e) => {
                            e.preventDefault();
                            // Call your actual handler here
                            console.log('New Status:', shipHealthNewStatus);

                            handleConfirmShipHealthStatusChange(shipHealthNewStatus);
                        }}>
                            <div id='ship-management-page-right-container-content-ship-health-status-change-form-status-container'>
                                <label htmlFor='shipHealthStatus'>Set New Status</label>
                                <select
                                    name="shipHealthStatus"
                                    id="shipHealthStatus"
                                    value={shipHealthNewStatus} // ✅ Controlled component
                                    onChange={(e) => {
                                        setShipHealthNewStatus(e.target.value)
                                    }}
                                >
                                    <option value={0}>Select Status</option>
                                    <option value="1">Sealing</option>
                                    <option value="2">On Dock</option>
                                    <option value="3">In-Active</option>
                                    <option value="4">Under Repair</option>
                                </select>
                            </div>

                            <div id='ship-health-status-change-form-actions'>
                                <button type='submit' className="btn-submit">Confirm</button>
                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={() => {
                                        setShipHealthNewStatus(0)
                                        setNeedToInvokeShipHealthStatusChangeForm(false)
                                    }}
                                >
                                    Close
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Ship Health Status Authentication when update ship health */}
            {authRequired && (
                <div id='ship-management-page-right-container-content-ship-health-status-change-auth-container'>
                    <OTP_verification
                        onVerifySuccess={async () => {

                            try {
                                await axios.post(`${API_BASE_URL}addShipHealthData`, { shipHealthStatusNumericValue, shipID: selectedShip?.SHA_ID, changeBy: user.EHA_ID, changeFrom: user.emp_type })
                            } catch (err) {
                                console.log('Error while updating status of ship health')
                                alert('Error Occured..')
                            }
                            // alert("Updated Successfully : " + shipHealthStatusNumericValue)

                            setAuthRequired(false);
                            setNeedToInvokeShipHealthStatusChangeForm(false)
                            refreshShipsHealthList()
                            setShipHealthNewStatus(0)
                        }}
                        onCancel={() => {
                            setAuthRequired(false);
                            setNeedToInvokeShipHealthStatusChangeForm(false)
                        }}
                    />
                </div>
            )}

        </div>
    );
};

export default ShipManagementPage;
// Components