// shipMmanagementPage.jsx 

import React, { useContext, useEffect, useState } from 'react';
import './ShipManagementPage.css';
import { ShipHeaderContext } from '../../contexts/ship_header_context/ShipHeaderContext';
import Temp_component_heirarchy from '../temp_component_heirarchy/Temp_component_heirarchy';
import { ComponentTreeContext } from '../../contexts/ComponentTreeContext/ComponentTreeContext';
import { UserAuthContext } from '../../contexts/userAuth/UserAuthContext';
import axios from 'axios';
import { Ship_health_details_context } from '../../contexts/ship_health_Context/Ship_health_details_context';
import OTP_verification from '../../components/otp_model/OTP_verification';
import { ShipCrewCombinationContext } from '../../contexts/ShipCrewCombinationContext/ShipCrewCombinationContexts';
import { OfficeStaffCombination_Context } from '../../contexts/OfficeStaffCombinationContext/OfficeStaffCombination_Context';
import { CrewContext } from '../../contexts/crew_context/CrewContext';
import { DepartmentsContext } from '../../contexts/DepartmentContext/DepartmentsContext';
import { DesignationContext } from '../../contexts/Designation_context/DesignationContext';
import * as XLSX from 'xlsx';
import { toast } from 'react-toastify';
const ShipManagementPage = () => {
    const API_BASE_URL = import.meta.env.VITE_API_URL;

    const [loading, setLoading] = useState(false);


    //    // cpoy component variables
    //     const [showCopyComponentModal, setShowCopyComponentModal] = useState(false);
    //     const [copySourceShip, setCopySourceShip] = useState('');
    //     const [availableComponents, setAvailableComponents] = useState([]);
    //     const [selectedComponentsToCopy, setSelectedComponentsToCopy] = useState([]);
    //     const [copyLoading, setCopyLoading] = useState(false);

    const { user } = useContext(UserAuthContext)
    const { employeeList } = useContext(CrewContext)
    const { shipsList, refreshShipsList, agencyList, refreshAgencyList } = useContext(ShipHeaderContext);
    const { needToInvokeAddNewComponentForm, setNeedToInvokeAddNewComponentForm, needToInvokeEditComponentForm, setNeedToInvokeEditComponentForm, selectedNode, refreshTree } = useContext(ComponentTreeContext)
    const { shipsHealthList, refreshShipsHealthList } = useContext(Ship_health_details_context)
    // for adding new componentn
    const [needToInvokeAddMainComponentForm, setNeedToInvokeAddMainComponentForm] = useState(false);

    const { departmentsList, refreshDepartmentsList } = useContext(DepartmentsContext);
    const { designationList, refreshDesignationList } = useContext(DesignationContext);

    const [isViewMode, setIsViewMode] = useState(false);

    //for crew  details tab
    const { crewData, refreshCrewData, error } = useContext(ShipCrewCombinationContext);
    const { officeStaffList, refreshOfficeStaffList } = useContext(OfficeStaffCombination_Context);

    const [showAddShipModal, setShowAddShipModal] = useState(false);
    const [newShipFormData, setNewShipFormData] = useState({
        agency_id: '',
        ship_name: '',
        ship_code: ''
    });
    const [saveLoading, setSaveLoading] = useState(false);


    const [newComponentName, setNewComponentName] = useState('');
    const [newCompHasDesignFile, setNewCompHasDesignFile] = useState(false);
    const [newCompCanJCDConfig, setNewCompCanJCDConfig] = useState(false);
    const [designFile, setDesignFile] = useState(null);

    const subTabOrder = ['vslOverview', 'vslParticular', 'vslAllocation', 'crewList'];
    // =======================================================================================================
    // Add this state variable with your other useState declarations
    const [importLoading, setImportLoading] = useState(false);
    const [showImportModal, setShowImportModal] = useState(false);
    const [excelFile, setExcelFile] = useState(null);

    // Add this function to handle Excel import
    const handleImportExcel = async () => {
        if (!selectedShip?.SHA_ID) {
            alert("Please select a ship first!");
            return;
        }
        setShowImportModal(true);
    };

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Check if file is Excel format
            const validExtensions = ['.xlsx', '.xls', '.csv'];
            const fileExtension = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();

            if (!validExtensions.includes(fileExtension)) {
                alert('Please upload only Excel files (.xlsx, .xls, .csv)');
                return;
            }

            setExcelFile(file);
        }
    };
    // In your ShipManagementPage.jsx, replace the current import modal and processExcelData function:
    // =====================================================================================================================================================
    // Replace your existing processExcelData with this updated version
    const processExcelData = async () => {
        if (!excelFile) {
            alert('Please select an Excel file first');
            return;
        }

        setImportLoading(true);

        try {
            const reader = new FileReader();

            reader.onload = async (e) => {
                try {
                    const data = new Uint8Array(e.target.result);
                    const workbook = XLSX.read(data, { type: 'array' });
                    const firstSheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[firstSheetName];

                    // CHANGED: Use sheet_to_json WITHOUT { header: 1 } to get objects directly
                    const jsonData = XLSX.utils.sheet_to_json(worksheet);

                    if (jsonData.length === 0) {
                        alert('The Excel file is empty');
                        setImportLoading(false);
                        return;
                    }

                    // Basic validation: ensure at least 'component_no' exists in the first row
                    if (!jsonData[0].hasOwnProperty('component_no')) {
                        toast.error('Excel file must have a "component_no" column.');
                        setImportLoading(false);
                        return;
                    }

                    // Prepare payload for API
                    const payload = {
                        ship_id: selectedShip.SHA_ID,
                        components_data: jsonData // Send the array of objects
                    };

                    // Send to backend API
                    const response = await axios.post(`${API_BASE_URL}import-components-excel`, payload, {
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    });

                    if (response.data.success) {
                        toast.success(response.data.message);
                        setShowImportModal(false);
                        setExcelFile(null);
                        refreshTree();
                        refreshShipsList();
                    } else {
                        toast.error('Failed to import: ' + response.data.message);
                    }

                } catch (error) {
                    console.error('Error processing Excel file:', error);
                    toast.error('Error processing Excel file: ' + error.message);
                } finally {
                    setImportLoading(false);
                }
            };

            reader.onerror = () => {
                toast.error('Error reading file');
                setImportLoading(false);
            };

            reader.readAsArrayBuffer(excelFile);

        } catch (error) {
            console.error('Error in processExcelData:', error);
            toast.error('Error importing Excel file');
            setImportLoading(false);
        }
    };
    // ===============================================================================================================
    ////////////////////////////////////////////////////////////////////////////////////////////
    const handleNextSubTab = () => {
        const currentIndex = subTabOrder.indexOf(detailsSubActiveTab);
        if (currentIndex < subTabOrder.length - 1) {
            setDetailsSubActiveTab(subTabOrder[currentIndex + 1]);
        } else {
            // Optional: Show a message or wrap around
            alert("You've reached the last section.");
        }
    };

    //===========back========button=========handler 

    const handlePreviousSubTab = () => {
        const currentIndex = subTabOrder.indexOf(detailsSubActiveTab);
        if (currentIndex > 0) {
            setDetailsSubActiveTab(subTabOrder[currentIndex - 1]);
        } else {
            // Optional: Show a message or wrap around to last tab
            alert("You're already on the first section.");
        }
    };
    //save button handler 

    const handleSaveSubTab = async () => {
        if (!selectedShip?.SHA_ID) {
            alert("Please select a ship first!");
            return;
        }

        setLoading(true);
        try {

            // Debug: Check the API URL
            console.log('API Base URL:', API_BASE_URL);
            console.log('Full endpoint URL:', `${API_BASE_URL}save-all-vessel-details`);
            console.log('Selected Ship ID:', selectedShip.SHA_ID);
            // Prepare data for all three sections
            const payload = {
                SHA_ID: selectedShip.SHA_ID,
                vesselOverviewData: {
                    vessel_name: shipDetailsFormData.ship_name,
                    vessel_type: shipDetailsFormData.vesselType,
                    flag: shipDetailsFormData.flag,
                    vessel_code: shipDetailsFormData.ship_code,
                    management_type: shipDetailsFormData.managementType,
                    owner: shipDetailsFormData.owner,
                    charterer: shipDetailsFormData.charterer,
                    ship_manager: shipDetailsFormData.shipManager,
                    p_and_i_club: shipDetailsFormData.pAndIClub,
                    life_boat_capacity: shipDetailsFormData.lifeBoatCapacity,
                    wage_scale: shipDetailsFormData.wageScale,
                    take_over_date: shipDetailsFormData.takeOverDate,
                    status: shipDetailsFormData.status,
                    image: shipDetailsFormData.image,
                    lr_mo: shipDetailsFormData.lrMo,
                    registered_port: shipDetailsFormData.registeredPort,
                    official_number: shipDetailsFormData.official,
                    mmsi: shipDetailsFormData.mmsi,
                    current_class: shipDetailsFormData.currentClass,
                    group_col: shipDetailsFormData.group,
                    group_email: shipDetailsFormData.groupEmail,
                    email: shipDetailsFormData.email,
                    year_built: shipDetailsFormData.yearBuilt,
                    age: shipDetailsFormData.age,
                    yard: shipDetailsFormData.yard,
                    grt_twd: shipDetailsFormData.grtTwd,
                    teu: shipDetailsFormData.teu,
                    nrt: shipDetailsFormData.nrt,
                    length: shipDetailsFormData.length,
                    breadth: shipDetailsFormData.breadth,
                    depth: shipDetailsFormData.depth
                },
                vesselParticularsData: {
                    vessel_name: shipDetailsFormData.ship_name,
                    flag: shipDetailsFormData.flag,
                    main_engine_maker: shipDetailsFormData.mainEngineMaker,
                    main_engine_model: shipDetailsFormData.mainEngineModel,
                    main_engine_stroke_type: shipDetailsFormData.mainEngineStrokeType,
                    main_engine_kw: shipDetailsFormData.mainEngineKW,
                    main_engine_bhp: shipDetailsFormData.mainEngineBHP,
                    main_engine_rpm: shipDetailsFormData.mainEngineRPM,
                    aux1_maker: shipDetailsFormData.aux1Maker,
                    aux1_model: shipDetailsFormData.aux1Model,
                    aux1_stroke_type: shipDetailsFormData.aux1StrokeType,
                    aux1_kw: shipDetailsFormData.aux1KW,
                    aux1_bhp: shipDetailsFormData.aux1BHP,
                    aux1_rpm: shipDetailsFormData.aux1RPM,
                    aux2_maker: shipDetailsFormData.aux2Maker,
                    aux2_model: shipDetailsFormData.aux2Model,
                    aux2_stroke_type: shipDetailsFormData.aux2StrokeType,
                    aux2_kw: shipDetailsFormData.aux2KW,
                    aux2_bhp: shipDetailsFormData.aux2BHP,
                    aux2_rpm: shipDetailsFormData.aux2RPM,
                    aux3_maker: shipDetailsFormData.aux3Maker,
                    aux3_model: shipDetailsFormData.aux3Model,
                    aux3_stroke_type: shipDetailsFormData.aux3StrokeType,
                    aux3_kw: shipDetailsFormData.aux3KW,
                    aux3_bhp: shipDetailsFormData.aux3BHP,
                    aux3_rpm: shipDetailsFormData.aux3RPM,
                    inm_terminal_type: shipDetailsFormData.inmTerminalType,
                    call_sign: shipDetailsFormData.callSign,
                    ins_valid_days: shipDetailsFormData.insValidDays,
                    tel1: shipDetailsFormData.tel1,
                    tel2: shipDetailsFormData.tel2,
                    mobile_number: shipDetailsFormData.mobileNumber,
                    fax: shipDetailsFormData.fax,
                    data: shipDetailsFormData.data,
                    hsd: shipDetailsFormData.hsd,
                    inm_c: shipDetailsFormData.inmC,
                    acc_code: shipDetailsFormData.accCode,
                    training_fees: shipDetailsFormData.trainingFees
                },
                vesselAllocationData: {
                    vessel_email: shipDetailsFormData.vesselEmail,
                    technical_group_email: shipDetailsFormData.technicalGroupEmail,
                    crew_group_email: shipDetailsFormData.crewGroupEmail,
                    owner_rep: shipDetailsFormData.ownerRep,
                    charter_email: shipDetailsFormData.charterEmail,
                    tech_supdt: shipDetailsFormData.techSupdt,
                    superintendent: shipDetailsFormData.superintendent,
                    fleet_manager: shipDetailsFormData.fleetManager,
                    tech_assistant: shipDetailsFormData.techAssistant,
                    marine_assistant: shipDetailsFormData.marineAssistant,
                    dpa: shipDetailsFormData.dpa,
                    acct_officer: shipDetailsFormData.acctOfficer,
                    performance_bonus: shipDetailsFormData.performanceBonus
                }
            };

            const response = await axios.post(`${API_BASE_URL}save-all-vessel-details`, payload, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (response.data.success) {
                alert('Ship details saved successfully!');
                // Optionally refresh any data if needed
            } else {
                alert('Failed to save ship details: ' + (response.data.message || 'Unknown error'));
            }
        } catch (err) {
            console.error('Error saving ship details:', err);
            if (err.response) {
                alert('Server error: ' + (err.response.data.message || err.response.statusText));
            } else if (err.request) {
                alert('No response from server. Check your connection.');
            } else {
                alert('Error: ' + err.message);
            }
        } finally {
            setLoading(false);
        }
    };


    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
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

    // crew  details ctab ////////////////////////////////////////////////
    const handleExportCrewData = () => {
        // Filter crew data for selected ship
        const shipCrewData = crewData.filter(crew => crew.ship_id === selectedShip?.SHA_ID);

        if (shipCrewData.length === 0) {
            alert('No crew data available to export.');
            return;
        }

        // Create PDF content
        const printContent = `
    <html>
        <head>
            <title>Crew Details - ${selectedShip?.ship_name}</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                table { width: 100%; border-collapse: collapse; font-size: 12px; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                th { background-color: #f2f2f2; font-weight: bold; }
                tr:nth-child(even) { background-color: #f9f9f9; }
                .header { text-align: center; margin-bottom: 20px; }
            </style>
        </head>
        <body>
            <div class="header">
                <h2>Crew Details - ${selectedShip?.ship_name}</h2>
                <p>Generated on: ${new Date().toLocaleDateString()}</p>
            </div>
            <table>
                <thead>
                    <tr>
                        <th>User Name</th>
                        <th>Dept Name</th>
                        <th>Desg Name</th>
                        <th>Date of Boarding</th>
                        <th>Expected Deboard</th>
                        <!-- Removed Actual Deboard column -->
                        <th>Ack Jobs</th>
                        <th>Not Ack Jobs</th>
                        <th>Executed Jobs</th>
                        <th>Failed Jobs</th>
                        <th>Overdue Jobs</th>
                        <th>Reporting To</th>
                        <th>Allocated By</th>
                        <th>Place of Boarding</th>
                        <th>Approvals Pending</th>
                    </tr>
                </thead>
                <tbody>
                    ${shipCrewData
                .filter(crew => crew.crew_status == 1)
                .map((crew, index) => `
                            <tr key="${crew.SCCA_ID}" style="background-color: ${index % 2 === 0 ? '#f8f9fa' : 'white'}">
                                <td style="padding: 10px 8px; border: 1px solid #e0e0e0;">
                                    ${employeeList.filter(e => e.UHA_ID === crew.user_id).map(e => e.emp_name) || 'N/A'}
                                </td>
                                <td style="padding: 10px 8px; border: 1px solid #e0e0e0;">
                                    ${departmentsList.filter(d => d.DEPT_ID === crew.dept_id).map(d => d.dept_name) || 'N/A'}
                                </td>
                                <td style="padding: 10px 8px; border: 1px solid #e0e0e0;">
                                    ${designationList.filter(d => d.DSGH_ID === crew.desg_id).map(d => d.desg_name) || 'N/A'}
                                </td>
                                <td style="padding: 10px 8px; border: 1px solid #e0e0e0;">
                                    ${crew.date_of_boarding ? new Date(crew.date_of_boarding).toLocaleDateString() : 'N/A'}
                                </td>
                                <td style="padding: 10px 8px; border: 1px solid #e0e0e0;">
                                    ${crew.expected_deboarding_date ? new Date(crew.expected_deboarding_date).toLocaleDateString() : 'N/A'}
                                </td>
                                <!-- Removed Actual Date of Deboard column -->
                                <td style="padding: 10px 8px; border: 1px solid #e0e0e0; text-align: center;">
                                    <span style="padding: 4px 8px; border-radius: 4px; background-color: #d4edda; color: #155724; font-weight: 500;">
                                        ${crew.no_of_acknowledged_job || 0}
                                    </span>
                                </td>
                                <td style="padding: 10px 8px; border: 1px solid #e0e0e0; text-align: center;">
                                    <span style="padding: 4px 8px; border-radius: 4px; background-color: #fff3cd; color: #856404; font-weight: 500;">
                                        ${crew.no_of_not_acknowledged_job || 0}
                                    </span>
                                </td>
                                <td style="padding: 10px 8px; border: 1px solid #e0e0e0; text-align: center;">
                                    <span style="padding: 4px 8px; border-radius: 4px; background-color: #d1ecf1; color: #0c5460; font-weight: 500;">
                                        ${crew.no_of_executed_job || 0}
                                    </span>
                                </td>
                                <td style="padding: 10px 8px; border: 1px solid #e0e0e0; text-align: center;">
                                    <span style="padding: 4px 8px; border-radius: 4px; background-color: #f8d7da; color: #721c24; font-weight: 500;">
                                        ${crew.no_of_failed_job || 0}
                                    </span>
                                </td>
                                <td style="padding: 10px 8px; border: 1px solid #e0e0e0; text-align: center;">
                                    <span style="padding: 4px 8px; border-radius: 4px; background-color: #f8d7da; color: #721c24; font-weight: 500;">
                                        ${crew.no_of_over_due_job || 0}
                                    </span>
                                </td>
                                <td style={{ padding: '10px 8px', border: '1px solid #e0e0e0' }}>
                                    ${designationList.filter(d => d.DSGH_ID === crew.reporting_to_desg).map(d => d.desg_name) || 'N/A'}
                               </td>

                                <td style="padding: 10px 8px; border: 1px solid #e0e0e0;">
                                    ${(() => {
                        const user = employeeList.find(e => e.UHA_ID === crew.allocate_by);

                        const crewDesgId = crewData.find(c => c.user_id === user.UHA_ID && c.crew_status == 1)?.desg_id;
                        const officeDesgId = officeStaffList.find(o => o.user_id === user.UHA_ID)?.desg_id;

                        const desgId = crewDesgId || officeDesgId;

                        const desg = designationList.find(d => d.DSGH_ID === desgId);

                        const userName = user?.emp_name || 'N/A';
                        const desgName = desg?.desg_name || 'N/A';

                        return `${userName} (${desgName})`;
                    })()}
                                </td>
                                <td style="padding: 10px 8px; border: 1px solid #e0e0e0;">
                                    ${crew.place_of_boarding || 'N/A'}
                                </td>
                                <td style="padding: 10px 8px; border: 1px solid #e0e0e0; text-align: center;">
                                    <span style="padding: 4px 8px; border-radius: 4px; background-color: #fff3cd; color: #856404; font-weight: 500;">
                                        ${crew.no_of_approval_pending || 0}
                                    </span>
                                </td>
                            </tr>
                        `).join('')
            }

                    ${shipCrewData.length === 0 ? `
                        <tr>
                            <td colSpan="14" style="padding: 40px; text-align: center; color: #6c757d; font-style: italic;">
                                No crew members found for this ship.
                            </td>
                        </tr>
                    ` : ''}
                </tbody>
            </table>
        </body>
    </html>
`;

        const printWindow = window.open('', '_blank');
        printWindow.document.write(printContent);
        printWindow.document.close();
        printWindow.print();
    };
    // for adding new component handler 
    const handleAddMainComponent = () => {

        if (!selectedShip?.SHA_ID) {
            alert("Please select a ship first!");
            return;
        }
        setNeedToInvokeAddMainComponentForm(true);
        setNewComponentName('');
        setDesignFile(null);
        setNewCompHasDesignFile(false);
        setNewCompCanJCDConfig(false);
    };


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
        // vesselCode: '',
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


    // In  ShipManagementPage to refresh tree when ship changes
    useEffect(() => {
        if (selectedShip?.SHA_ID) {
            // Refresh component tree for the selected ship
            refreshTree(selectedShip.SHA_ID);
        } else {
            // If no ship selected, clear the tree or load all components
            refreshTree();
        }
    }, [selectedShip?.SHA_ID]);



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
            // vesselCode: '',
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
            // vesselCode: '',
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
        setShowAddShipModal(true);
        setBtnSaveVisibility('visible');
        setBtnUpdateVisibility('hidden');
        setBtnDeleteVisibility('hidden');
    };



    const handleSaveNewShip = async () => {
        // Validate inputs
        if (!newShipFormData.ship_name.trim()) {
            alert("Ship name is required.");
            return;
        }

        if (!newShipFormData.ship_code.trim()) {
            alert("Ship code is required.");
            return;
        }

        setSaveLoading(true);
        try {
            const payload = {
                ship_name: newShipFormData.ship_name.trim(),
                ship_code: newShipFormData.ship_code.trim(),
                ship_status: 1, // Active by default
                inserted_on: new Date().toISOString(),
                inserted_by: user?.UHA_ID || null,
                // Add other default fields as required by your backend
                AHA_ID: newShipFormData.agency_id,  // Will be set by backend if needed
                ship_details: "",
                inactive_since: null,
                incorporated_since: null,
                under_repaired_since: null
            };

            const response = await axios.post(`${API_BASE_URL}addShip`, payload, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (response.data.success) {
                alert('Ship added successfully!');
                setShowAddShipModal(false);

                // Refresh the ships list
                refreshShipsList();

                // Reset form
                setNewShipFormData({
                    agency_id: '',
                    ship_name: '',
                    ship_code: ''
                });
            } else {
                alert('Failed to add ship: ' + (response.data.message || 'Unknown error'));
            }
        } catch (err) {
            console.error('Error adding new ship:', err);
            if (err.response) {
                alert('Server error: ' + (err.response.data.message || err.response.statusText));
            } else if (err.request) {
                alert('No response from server. Check your connection.');
            } else {
                alert('Error: ' + err.message);
            }
        } finally {
            setSaveLoading(false);
        }
    };




    const handleEdit = (ship) => {
        setSelectedShip(ship);
        setIsViewMode(false);
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
        setDetailsSubActiveTab('vslOverview');
        setBtnSaveVisibility('hidden');
        setBtnUpdateVisibility('visible');
        setBtnDeleteVisibility('visible');
    };




    const handleView = (ship) => {
        setSelectedShip(ship);
        setIsViewMode(true);

        // Set form data with ship details for view mode
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

            // Set all other fields to empty or fetch from your APIs if needed
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
        });

        setActiveTab('details');
        setDetailsSubActiveTab('vslOverview');
        setBtnSaveVisibility('hidden');
        setBtnUpdateVisibility('hidden');
        setBtnDeleteVisibility('hidden');


    };

    const handleAddNewComponent = async (parentComponent) => {
        try {

            // ✅ ADD VALIDATION - Check if ship is selected
            if (!selectedShip?.SHA_ID) {
                alert("Please select a ship first!");
                return;
            }
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
                            can_jcd_triggered: newCompCanJCDConfig ? 1 : 0, // 1 = Yes
                            ship_ids: selectedShip?.SHA_ID
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
                            can_jcd_triggered: newCompCanJCDConfig ? 1 : 0,
                            ship_ids: selectedShip?.SHA_ID   //for selecting ship while adding root category
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
                            can_jcd_triggered: newCompCanJCDConfig ? 1 : 0,
                            ship_ids: selectedShip?.SHA_ID
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
                    can_jcd_triggered: newCompCanJCDConfig ? 1 : 0,
                    ship_ids: selectedShip?.SHA_ID   //for selecting ship while adding root category
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
                    <h2 style={{ fontWeight: '400', fontSize: '2rem', textAlign: 'center' }}>Ship Management</h2>

                    <div id='ship-management-page-left-container-shipDetails-content'>
                        <table id='left-container-shipDetails-content-table'>
                            <thead>
                                <tr>
                                    <th></th>
                                    <th>Ship Name</th>
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
                                            No ships found
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>

                        <button id='left-container-shipDetails-content-table-btn-add-new' onClick={handleAddNewShip}>
                            <i className="fas fa-plus-circle"></i> Add New Ship
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
                        Ship Details
                    </h2>
                    <h2
                        className={activeTab === 'crew' ? 'active' : ''}
                        onClick={() => selectedShip?.SHA_ID && setActiveTab('crew')}
                        style={{ cursor: selectedShip?.SHA_ID ? 'pointer' : 'not-allowed', opacity: selectedShip?.SHA_ID ? 1 : 0.6 }}
                    >
                        Crew Details
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
                        Ship Health
                    </h2>
                </div>

                {/*/////////////////////////////////////////////ship details  Tab Content\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ */}
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

                                    {activeTab === 'details' && (
                                        <div style={{ animation: 'slideIn 0.4s ease-out', backgroundColor: 'transparent' }}>
                                            {/* Sub Tabs */}
                                            <div style={{ display: 'flex', flexWrap: 'wrap', position: 'sticky', top: 0, left: 0, zIndex: 2, backgroundColor: 'rgba(255, 255, 255, 0.1)', backdropFilter: 'blur(2px)', padding: '20px 0px', justifyContent: 'center', alignItems: 'center', borderRadius: '10px' }}>

                                                {isViewMode && (
                                                    <div style={{
                                                        position: 'absolute',
                                                        top: '10px',
                                                        right: '10px',
                                                        backgroundColor: '#17a2b8',
                                                        color: 'white',
                                                        padding: '4px 8px',
                                                        borderRadius: '4px',
                                                        fontSize: '12px',
                                                        fontWeight: 'bold'
                                                    }}>
                                                        View Mode
                                                    </div>
                                                )}
                                                {[
                                                    { key: 'vslOverview', label: 'Vessel Overview' },
                                                    { key: 'vslParticular', label: 'Vessel Particulars' },
                                                    { key: 'vslAllocation', label: 'Vessel Allocation' },
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
                                                            <h1 style={{ textAlign: 'center', color: '#6c757d', marginBottom: '30px' }}>Vessel Overview</h1>

                                                            <div style={grid2Col}>
                                                                {field("Vessel Name", <input type="text" name="ship_name" value={shipDetailsFormData.ship_name} onChange={handleChange} style={inputStyle} readOnly={isViewMode} required />, true)}
                                                                {field("Vessel Type", (
                                                                    <select name="vesselType" value={shipDetailsFormData.vesselType} onChange={handleChange} style={inputStyle} disabled={isViewMode} required>
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
                                                                {field("Vessel Code", <input type="text" name="vesselCode" value={shipDetailsFormData.ship_code} onChange={handleChange} style={inputStyle} />)}
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
                                                                {field("Ship Manager", <select name="shipManager" value={shipDetailsFormData.shipManager} onChange={handleChange} style={inputStyle} />)}
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
                                                                {!isViewMode && (
                                                                    <button type="button" style={{
                                                                        padding: '12px 30px',
                                                                        backgroundColor: '#13cbdfff',
                                                                        color: 'white',
                                                                        border: 'none',
                                                                        borderRadius: '6px',
                                                                        fontSize: '16px',
                                                                        cursor: 'pointer',
                                                                        marginRight: '15px'
                                                                    }}
                                                                        onClick={handleSaveSubTab}
                                                                        disabled={loading}
                                                                    >
                                                                        {loading ? 'Saving...' : 'Commit'}
                                                                    </button>

                                                                )}
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
                                                            <h1 style={{ textAlign: 'center', color: '#6c757d', marginBottom: '24px' }}>Vessel Particulars</h1>

                                                            <div style={grid2Col}>
                                                                {field("Vessel Name", <input type="text" value={shipDetailsFormData.ship_name} disabled style={{ ...inputStyle }} />)}
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
                                                                    backgroundColor: '#b7360aff',
                                                                    color: 'white',
                                                                    border: 'none',
                                                                    borderRadius: '6px',
                                                                    fontSize: '16px',
                                                                    cursor: 'pointer',
                                                                    marginRight: '15px'
                                                                }} onClick={handlePreviousSubTab}>
                                                                    Back
                                                                </button>

                                                                {!isViewMode && (
                                                                    <button type="button" style={{
                                                                        padding: '12px 30px',
                                                                        backgroundColor: '#13cbdfff',
                                                                        color: 'white',
                                                                        border: 'none',
                                                                        borderRadius: '6px',
                                                                        fontSize: '16px',
                                                                        cursor: 'pointer',
                                                                        marginRight: '15px'
                                                                    }}
                                                                        onClick={handleSaveSubTab}
                                                                        disabled={loading}
                                                                    >
                                                                        {loading ? 'Saving...' : 'commit'}
                                                                    </button>
                                                                )}

                                                                {/* next button */}
                                                                <button type="button" style={{
                                                                    padding: '12px 30px',
                                                                    backgroundColor: '#27ae60',
                                                                    color: 'white',
                                                                    border: 'none',
                                                                    borderRadius: '6px',
                                                                    fontSize: '16px',
                                                                    cursor: 'pointer',
                                                                    marginLeft: '15px'
                                                                }} onClick={handleNextSubTab}>
                                                                    Next
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )}



                                                    {/* === Vessel Allocation === */}
                                                    {detailsSubActiveTab === 'vslAllocation' && (
                                                        <div style={{ padding: '24px', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
                                                            <h1 style={{ textAlign: 'center', color: '#6c757d', marginBottom: '24px' }}>Vessel Allocation</h1>

                                                            <div style={grid2Col}>
                                                                {field("Vessel Email", <input type="email" name="vesselEmail" value={shipDetailsFormData.vesselEmail} onChange={handleChange} style={inputStyle} required />, true)}
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
                                                                        <option value="sp1">gaurav maithili</option>
                                                                    </select>
                                                                ), true)}
                                                                {field("Fleet Manager", (
                                                                    <select name="fleetManager" value={shipDetailsFormData.fleetManager} onChange={handleChange} style={inputStyle} required>
                                                                        <option value="">Select</option>
                                                                        <option value="fm1">Prince sadhotra</option>
                                                                    </select>
                                                                ), true)}
                                                                {field("Tech Assistant", (
                                                                    <select name="techAssistant" value={shipDetailsFormData.techAssistant} onChange={handleChange} style={inputStyle} required>
                                                                        <option value="">Select</option>
                                                                        <option value="ta1">Lokesh Wagh</option>
                                                                    </select>
                                                                ), true)}
                                                                {field("Marine Assistant", (
                                                                    <select name="marineAssistant" value={shipDetailsFormData.marineAssistant} onChange={handleChange} style={inputStyle} required>
                                                                        <option value="">Select</option>
                                                                        <option value="ma1">Roopam sir</option>
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
                                                                        <option value="ao1">Rushikesh Patil</option>
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
                                                                    backgroundColor: '#b7360aff',
                                                                    color: 'white',
                                                                    border: 'none',
                                                                    borderRadius: '6px',
                                                                    fontSize: '16px',
                                                                    cursor: 'pointer',
                                                                    marginRight: '15px'
                                                                }} onClick={handlePreviousSubTab}>
                                                                    Back
                                                                </button>
                                                                {!isViewMode && (
                                                                    <button type="button" style={{
                                                                        padding: '12px 30px',
                                                                        backgroundColor: '#13cbdfff',
                                                                        color: 'white',
                                                                        border: 'none',
                                                                        borderRadius: '6px',
                                                                        fontSize: '16px',
                                                                        cursor: 'pointer',
                                                                        marginRight: '15px'
                                                                    }}
                                                                        onClick={handleSaveSubTab}
                                                                        disabled={loading}
                                                                    >
                                                                        {loading ? 'Saving...' : 'Commit'}
                                                                    </button>
                                                                )}
                                                                <button type="button" style={{
                                                                    padding: '12px 30px',
                                                                    backgroundColor: '#27ae60',
                                                                    color: 'white',
                                                                    border: 'none',
                                                                    borderRadius: '6px',
                                                                    fontSize: '16px',
                                                                    cursor: 'pointer',
                                                                    marginLeft: '15px'
                                                                }} onClick={handleNextSubTab}>
                                                                    Next
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )}


                                                    {/* //  === Crew List === */}
                                                    {detailsSubActiveTab === 'crewList' && (
                                                        <div style={{
                                                            textAlign: 'center',
                                                            padding: '200px 20px',
                                                            // backgroundColor: '#fff',
                                                            borderRadius: '8px',
                                                            boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                                                            color: '#6c757d',
                                                            animation: 'fadeIn 0.5s ease'
                                                        }}>


                                                            {/* <button type="button" style={{
                                                                    padding: '12px 30px',
                                                                    backgroundColor: '#13cbdfff',
                                                                    color: 'white',
                                                                    border: 'none',
                                                                    borderRadius: '6px',
                                                                    fontSize: '16px',
                                                                    cursor: 'pointer',
                                                                    marginRight: '15px' 
                                                                }}
                                                                    // onClick={handlesaveSubTab}
                                                                >
                                                                    Save
                                                                </button> */}

                                                            <button type="button" style={{
                                                                padding: '12px 30px',
                                                                backgroundColor: '#b7360aff',
                                                                color: 'white',
                                                                border: 'none',
                                                                borderRadius: '6px',
                                                                fontSize: '16px',
                                                                cursor: 'pointer',
                                                                marginLeft: '15px'
                                                            }} onClick={handlePreviousSubTab}>
                                                                Back
                                                            </button>
                                                            {/* <h1 style={{ color: '#6c757d' }}>Crew List</h1>
                                                            <p>No crew data available yet.</p> */}
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

                            {/* Crew Details Tab */}
                            {/*//////////////////////////////// Crew Details /////////////////////// Tab */}
                            {activeTab === 'crew' && selectedShip?.SHA_ID ? (
                                <div className="tab-content">
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                        <h3>Crew Details for "{selectedShip?.ship_name}"</h3>
                                        <button
                                            onClick={() => handleExportCrewData()}
                                            style={{
                                                padding: '8px 16px',
                                                backgroundColor: '#28a745',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '6px',
                                                cursor: 'pointer',
                                                fontSize: '14px',
                                                fontWeight: '500',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '8px'
                                            }}
                                        >
                                            <i className="fas fa-download"></i>
                                            Export PDF
                                        </button>
                                    </div>

                                    {loading ? (
                                        <div style={{ textAlign: 'center', padding: '40px' }}>
                                            <p>Loading crew data...</p>
                                        </div>
                                    ) : error ? (
                                        <div style={{ textAlign: 'center', padding: '40px', color: '#dc3545' }}>
                                            <p>Error loading crew data: {error}</p>
                                        </div>
                                    ) : (
                                        <div style={{
                                            width: '100%',
                                            overflow: 'auto',
                                            borderRadius: '8px',
                                            border: '1px solid #e0e0e0',
                                            backgroundColor: 'white'
                                        }}>
                                            <table style={{
                                                width: '100%',
                                                borderCollapse: 'collapse',
                                                minWidth: '1200px', // Ensure horizontal scroll for many columns
                                                fontSize: '0.9rem'
                                            }}>
                                                <thead>
                                                    <tr class="crew-table-header">
                                                        {/* <tr style={{
                                                        backgroundColor: '#2c3e50',
                                                        color: 'white',
                                                        position: 'sticky',
                                                        top: 0,
                                                        zIndex: 10
                                                    }} > */}
                                                        <th style={{ padding: '12px 8px', textAlign: 'left', border: '1px solid #34495e', minWidth: '120px' }}>User Name</th>
                                                        <th style={{ padding: '12px 8px', textAlign: 'left', border: '1px solid #34495e', minWidth: '100px' }}>Dept Name</th>
                                                        <th style={{ padding: '12px 8px', textAlign: 'left', border: '1px solid #34495e', minWidth: '100px' }}>Desg Name</th>
                                                        <th style={{ padding: '12px 8px', textAlign: 'left', border: '1px solid #34495e', minWidth: '120px' }}>Date of Boarding</th>
                                                        <th style={{ padding: '12px 8px', textAlign: 'left', border: '1px solid #34495e', minWidth: '150px' }}>Expected Date of Deboard</th>
                                                        {/* <th style={{ padding: '12px 8px', textAlign: 'left', border: '1px solid #34495e', minWidth: '140px' }}>Actual Date of Deboard</th> */}
                                                        <th style={{ padding: '12px 8px', textAlign: 'left', border: '1px solid #34495e', minWidth: '100px' }}>Acknowledged Jobs</th>
                                                        <th style={{ padding: '12px 8px', textAlign: 'left', border: '1px solid #34495e', minWidth: '120px' }}>Not Acknowledged Job</th>
                                                        <th style={{ padding: '12px 8px', textAlign: 'left', border: '1px solid #34495e', minWidth: '100px' }}>Executed Jobs</th>
                                                        <th style={{ padding: '12px 8px', textAlign: 'left', border: '1px solid #34495e', minWidth: '80px' }}>Failed Job</th>
                                                        <th style={{ padding: '12px 8px', textAlign: 'left', border: '1px solid #34495e', minWidth: '100px' }}>Overdue Jobs</th>
                                                        <th style={{ padding: '12px 8px', textAlign: 'left', border: '1px solid #34495e', minWidth: '120px' }}>Approvals Pendings</th>
                                                        <th style={{ padding: '12px 8px', textAlign: 'left', border: '1px solid #34495e', minWidth: '120px' }}>Reporting To Desg</th>
                                                        <th style={{ padding: '12px 8px', textAlign: 'left', border: '1px solid #34495e', minWidth: '100px' }}>Allocated By</th>
                                                        <th style={{ padding: '12px 8px', textAlign: 'left', border: '1px solid #34495e', minWidth: '120px' }}>Place of Boarding</th>

                                                        {console.log('crewData ::: ', crewData)}
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {crewData
                                                        .filter(crew => crew.ship_id === selectedShip?.SHA_ID && crew.crew_status == 1)
                                                        .map((crew, index) => (
                                                            <tr key={crew.SCCA_ID} style={{
                                                                backgroundColor: index % 2 === 0 ? '#f8f9fa' : 'white',
                                                                transition: 'background-color 0.2s ease'
                                                            }}>
                                                                <td style={{ padding: '10px 8px', border: '1px solid #e0e0e0' }}>
                                                                    {employeeList.filter(e => e.UHA_ID === crew.user_id).map(e => e.emp_name) || 'N/A'}
                                                                </td>


                                                                <td style={{ padding: '10px 8px', border: '1px solid #e0e0e0' }}>
                                                                    {departmentsList.filter(d => d.DEPT_ID === crew.dept_id).map(d => d.dept_name) || 'N/A'}
                                                                </td>


                                                                <td style={{ padding: '10px 8px', border: '1px solid #e0e0e0' }}>
                                                                    {designationList.filter(d => d.DSGH_ID === crew.desg_id).map(d => d.desg_name) || 'N/A'}
                                                                </td>
                                                                <td style={{ padding: '10px 8px', border: '1px solid #e0e0e0' }}>
                                                                    {crew.date_of_boarding ? new Date(crew.date_of_boarding).toLocaleDateString() : 'N/A'}
                                                                </td>
                                                                <td style={{ padding: '10px 8px', border: '1px solid #e0e0e0' }}>
                                                                    {crew.expected_deboarding_date ? new Date(crew.expected_deboarding_date).toLocaleDateString() : 'N/A'}
                                                                </td>
                                                                {/* <td style={{ padding: '10px 8px', border: '1px solid #e0e0e0' }}>
                                                                    {crew.actual_deboarding_on ? new Date(crew.actual_deboarding_on).toLocaleDateString() : 'N/A'}
                                                                </td> */}
                                                                <td style={{ padding: '10px 8px', border: '1px solid #e0e0e0', textAlign: 'center' }}>
                                                                    <span style={{
                                                                        padding: '4px 8px',
                                                                        borderRadius: '4px',
                                                                        backgroundColor: '#d4edda',
                                                                        color: '#155724',
                                                                        fontWeight: '500'
                                                                    }}>
                                                                        {crew.no_of_acknowledged_job || 0}
                                                                    </span>
                                                                </td>
                                                                <td style={{ padding: '10px 8px', border: '1px solid #e0e0e0', textAlign: 'center' }}>
                                                                    <span style={{
                                                                        padding: '4px 8px',
                                                                        borderRadius: '4px',
                                                                        backgroundColor: '#fff3cd',
                                                                        color: '#856404',
                                                                        fontWeight: '500'
                                                                    }}>
                                                                        {crew.no_of_not_acknowledged_job || 0}
                                                                    </span>
                                                                </td>
                                                                <td style={{ padding: '10px 8px', border: '1px solid #e0e0e0', textAlign: 'center' }}>
                                                                    <span style={{
                                                                        padding: '4px 8px',
                                                                        borderRadius: '4px',
                                                                        backgroundColor: '#d1ecf1',
                                                                        color: '#0c5460',
                                                                        fontWeight: '500'
                                                                    }}>
                                                                        {crew.no_of_executed_job || 0}
                                                                    </span>
                                                                </td>
                                                                <td style={{ padding: '10px 8px', border: '1px solid #e0e0e0', textAlign: 'center' }}>
                                                                    <span style={{
                                                                        padding: '4px 8px',
                                                                        borderRadius: '4px',
                                                                        backgroundColor: '#f8d7da',
                                                                        color: '#721c24',
                                                                        fontWeight: '500'
                                                                    }}>
                                                                        {crew.no_of_failed_job || 0}
                                                                    </span>
                                                                </td>
                                                                <td style={{ padding: '10px 8px', border: '1px solid #e0e0e0', textAlign: 'center' }}>
                                                                    <span style={{
                                                                        padding: '4px 8px',
                                                                        borderRadius: '4px',
                                                                        backgroundColor: '#f8d7da',
                                                                        color: '#721c24',
                                                                        fontWeight: '500'
                                                                    }}>
                                                                        {crew.no_of_over_due_job || 0}
                                                                    </span>
                                                                </td>

                                                                {/* no_of_approval_pending */}
                                                                <td style={{ padding: '10px 8px', border: '1px solid #e0e0e0', textAlign: 'center' }}>
                                                                    <span style={{
                                                                        padding: '4px 8px',
                                                                        borderRadius: '4px',
                                                                        backgroundColor: '#fff3cd',
                                                                        color: '#856404',
                                                                        fontWeight: '500'
                                                                    }}>
                                                                        {crew.no_of_approval_pending || 0}
                                                                    </span>
                                                                </td>
                                                                {/* reporting_to_desg_name */}
                                                                <td style={{ padding: '10px 8px', border: '1px solid #e0e0e0' }}>
                                                                    {designationList.filter(d => d.DSGH_ID === crew.reporting_to_desg).map(d => d.desg_name) || 'N/A'}
                                                                </td>

                                                                {/* allocated_by_name */}
                                                                <td style={{ padding: '10px 8px', border: '1px solid #e0e0e0' }}>
                                                                    {(() => {
                                                                        const user = employeeList.find(e => e.UHA_ID === crew.allocate_by);

                                                                        const crewDesgId = crewData.find(c => c.user_id === user.UHA_ID && c.crew_status == 1)?.desg_id;
                                                                        const officeDesgId = officeStaffList.find(o => o.user_id === user.UHA_ID)?.desg_id;

                                                                        const desgId = crewDesgId || officeDesgId;

                                                                        const desg = designationList.find(d => d.DSGH_ID === desgId);

                                                                        const userName = user?.emp_name || 'N/A';
                                                                        const desgName = desg?.desg_name || 'N/A';

                                                                        return `${userName} (${desgName})`;
                                                                    })()}
                                                                </td>


                                                                {/* place_of_boarding */}
                                                                <td style={{ padding: '10px 8px', border: '1px solid #e0e0e0' }}>
                                                                    {crew.place_of_boarding || 'N/A'}
                                                                </td>

                                                            </tr>
                                                        ))
                                                    }

                                                    {crewData.filter(crew => crew.ship_id === selectedShip?.SHA_ID).length === 0 && (
                                                        <tr>
                                                            <td colSpan="15" style={{
                                                                padding: '40px',
                                                                textAlign: 'center',
                                                                color: '#6c757d',
                                                                fontStyle: 'italic'
                                                            }}>
                                                                No crew members found for this ship.
                                                            </td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}

                                    <div style={{
                                        marginTop: '15px',
                                        fontSize: '0.85rem',
                                        color: '#6c757d',
                                        textAlign: 'right'
                                    }}>
                                        Total Crew Members: <strong>{crewData.filter(crew => crew.ship_id === selectedShip?.SHA_ID).length}</strong>
                                    </div>
                                </div>
                            ) : activeTab === 'crew' && (
                                <div className='no-selection-placeholder'>
                                    <p>Select a ship to view Crew Details.</p>
                                </div>
                            )}
                            {/* Components Tab */}
                            {activeTab === 'components' && (
                                <div className="tab-content">
                                    {/* ✅ ADD THIS VALIDATION CHECK */}
                                    {!selectedShip?.SHA_ID ? (
                                        <div style={{
                                            padding: '40px',
                                            textAlign: 'center',
                                            color: '#6c757d',
                                            backgroundColor: '#f8f9fa',
                                            borderRadius: '8px',
                                            margin: '20px'
                                        }}>
                                            <h3>No Ship Selected</h3>
                                            <p>Please select a ship from the left panel to view and manage components.</p>
                                        </div>
                                    ) : (
                                        <>
                                            {/* Your existing components UI - KEEP ALL THIS CODE AS IS */}
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



                                            {/* ///////////////////////////////////////////Add Main Category Button - ADD THIS SECTION///////////////////////////////////////////// */}
                                            {isAddNewComponentChecked && (
                                                <div style={{
                                                    display: 'flex',
                                                    justifyContent: 'flex-end',
                                                    marginBottom: '15px',
                                                    padding: '0 10px'
                                                }}>


                                                    {/* //////////////////////Copy Component Button - //////////////////////////////////////////////////////////////////////////////ADD THIS */}
                                                    {/* <button
                                                        onClick={() => {
                                                            if (!selectedShip?.SHA_ID) {
                                                                alert("Please select a ship first!");
                                                                return;
                                                            }
                                                            setShowCopyComponentModal(true);
                                                            setCopySourceShip('');
                                                            setAvailableComponents([]);
                                                            setSelectedComponentsToCopy([]);
                                                        }}
                                                        style={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '8px',
                                                            padding: '8px 16px',
                                                            backgroundColor: '#17a2b8', // Different color for distinction
                                                            color: 'white',
                                                            border: 'none',
                                                            borderRadius: '6px',
                                                            cursor: 'pointer',
                                                            fontSize: '14px',
                                                            fontWeight: '500'
                                                        }}
                                                        title="Copy Components from Other Ship"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                                                        </svg>
                                                        Copy Components
                                                    </button> */}

                                                    <button
                                                        onClick={handleAddMainComponent} // Add this onClick handlerrrrrr

                                                        style={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '8px',
                                                            padding: '8px 16px',
                                                            backgroundColor: '#6c5ce7',
                                                            color: 'white',
                                                            border: 'none',
                                                            borderRadius: '6px',
                                                            cursor: 'pointer',
                                                            fontSize: '14px',
                                                            fontWeight: '500'
                                                        }}
                                                        title="Add Main Component"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                            <line x1="12" y1="5" x2="12" y2="19"></line>
                                                            <line x1="5" y1="12" x2="19" y2="12"></line>
                                                        </svg>
                                                        Add Main component
                                                    </button>
                                                    <button
                                                        onClick={handleImportExcel}
                                                        style={{
                                                            marginLeft: '16px',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '8px',
                                                            padding: '8px 16px',
                                                            backgroundColor: '#28a745',
                                                            color: 'white',
                                                            border: 'none',
                                                            borderRadius: '6px',
                                                            cursor: 'pointer',
                                                            fontSize: '14px',
                                                            fontWeight: '500'
                                                        }}
                                                        title="Import Components from Excel"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                                            <polyline points="7 10 12 15 17 10"></polyline>
                                                            <line x1="12" y1="15" x2="12" y2="3"></line>
                                                        </svg>
                                                        Import Excel
                                                    </button>
                                                </div>
                                            )}


                                            {/*============================= Import Excel Modal========================== */}
                                            {showImportModal && (
                                                <div id='ship-management-page-import-excel-modal-container' style={{
                                                    position: 'fixed',
                                                    top: 0,
                                                    left: 0,
                                                    width: '100%',
                                                    height: '100%',
                                                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                                                    display: 'flex',
                                                    justifyContent: 'center',
                                                    alignItems: 'center',
                                                    zIndex: 1000
                                                }}>
                                                    <div style={{
                                                        backgroundColor: 'white',
                                                        padding: '30px',
                                                        borderRadius: '8px',
                                                        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
                                                        width: '90%',
                                                        maxWidth: '500px',
                                                        animation: 'fadeIn 0.3s ease-out'
                                                    }}>
                                                        <h3 style={{
                                                            marginBottom: '20px',
                                                            color: '#2c3e50',
                                                            textAlign: 'center',
                                                            fontSize: '1.5rem'
                                                        }}>
                                                            Import Components from Excel
                                                        </h3>

                                                        <div style={{ marginBottom: '20px' }}>
                                                            <p style={{ marginBottom: '15px', color: '#666' }}>
                                                                Upload an Excel file.
                                                            </p>

                                                            <div style={{
                                                                border: '2px dashed #ddd',
                                                                borderRadius: '4px',
                                                                padding: '20px',
                                                                textAlign: 'center',
                                                                transition: 'border-color 0.3s'
                                                            }}>
                                                                <input
                                                                    type="file"
                                                                    accept=".xlsx,.xls,.csv"
                                                                    onChange={handleFileUpload}
                                                                    style={{ display: 'none' }}
                                                                    id="excel-file-input"
                                                                />
                                                                <label
                                                                    htmlFor="excel-file-input"
                                                                    style={{
                                                                        display: 'block',
                                                                        cursor: 'pointer',
                                                                        color: '#666'
                                                                    }}
                                                                >
                                                                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '10px', color: '#999' }}>
                                                                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                                                        <polyline points="14 2 14 8 20 8"></polyline>
                                                                        <line x1="16" y1="13" x2="8" y2="13"></line>
                                                                        <line x1="16" y1="17" x2="8" y2="17"></line>
                                                                        <polyline points="10 9 9 9 8 9"></polyline>
                                                                    </svg>
                                                                    <div>Click to upload Excel file</div>
                                                                    <div style={{ fontSize: '12px', marginTop: '5px' }}>
                                                                        Supported formats: .xlsx, .xls, .csv
                                                                    </div>
                                                                </label>
                                                            </div>

                                                            {excelFile && (
                                                                <div style={{
                                                                    marginTop: '10px',
                                                                    padding: '10px',
                                                                    backgroundColor: '#e8f5e8',
                                                                    borderRadius: '4px',
                                                                    textAlign: 'center'
                                                                }}>
                                                                    <strong>Selected file:</strong> {excelFile.name}
                                                                </div>
                                                            )}
                                                        </div>

                                                        <div style={{
                                                            display: 'flex',
                                                            gap: '12px',
                                                            justifyContent: 'flex-end'
                                                        }}>
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    setShowImportModal(false);
                                                                    setExcelFile(null);
                                                                }}
                                                                style={{
                                                                    padding: '10px 20px',
                                                                    border: '1px solid #dc3545',
                                                                    backgroundColor: 'white',
                                                                    color: '#dc3545',
                                                                    borderRadius: '4px',
                                                                    cursor: 'pointer',
                                                                    fontSize: '14px'
                                                                }}
                                                                disabled={importLoading}
                                                            >
                                                                Cancel
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={processExcelData}
                                                                style={{
                                                                    padding: '10px 20px',
                                                                    border: 'none',
                                                                    backgroundColor: '#28a745',
                                                                    color: 'white',
                                                                    borderRadius: '4px',
                                                                    cursor: importLoading ? 'not-allowed' : 'pointer',
                                                                    fontSize: '14px',
                                                                    opacity: importLoading ? 0.7 : 1
                                                                }}
                                                                disabled={importLoading || !excelFile}
                                                            >
                                                                {importLoading ? 'Importing...' : 'Import'}
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {/*//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////*/}



                                            {/* Add New sub  Component */}
                                            {isAddNewComponentChecked && (
                                                <div id='addNewFunctionalityForComponent-component-heirarchy-container' className="functionality-container">
                                                    <h3>Add New Component</h3>
                                                    <Temp_component_heirarchy componentTreeWantByWhichComp={'ShipManagementPage_add_new_comp'}
                                                        selectedShipID={selectedShip?.SHA_ID}
                                                    />
                                                </div>


                                            )}

                                            {/* Edit Existing Component */}
                                            {isEditComponentChecked && (
                                                <div id='editFunctionalityForComponent-component-heirarchy-container' className="functionality-container">
                                                    <h3>Edit Existing Component</h3>
                                                    <Temp_component_heirarchy componentTreeWantByWhichComp={'ShipManagementPage_edit_comp'} selectedShipID={selectedShip?.SHA_ID} />
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            )}

                            {/* Ship Health Tab */}
                            {activeTab === 'health' && (
                                selectedShip?.SHA_ID ? (
                                    <div className="tab-content">
                                        <h3>Ship : {selectedShip?.ship_name}</h3>

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
                                        <p>Select a ship to view its health status.</p>
                                    </div>
                                )
                            )}
                        </>
                    ) : activeTab == 'health' && (
                        <div className='no-selection-placeholder'>
                            <p>Select a ship to view details.</p>
                        </div>
                    )}
                </div>
            </div>
            {/*  ///////////////////////////////////   Below Are PopUp Forms    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\          */}


            {/* Add Main Component Form */}
            {needToInvokeAddMainComponentForm && (
                <div id='ship-management-page-right-container-content-add-component-form-container'>
                    <div id='ship-management-page-right-container-content-add-component-form'>
                        <form onSubmit={async (e) => {
                            e.preventDefault();
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
                                            resolve(reader.result.split(',')[1]);
                                        };
                                        reader.onerror = reject;
                                        reader.readAsDataURL(designFile);
                                    });
                                }

                                // 3. Prepare payload for root category (main component)
                                const payload = {
                                    // CHA_ID: "", // Will be generated on backend
                                    category_name: newComponentName,
                                    cat_type: 2, // 2 = Component
                                    inserted_on: new Date().toISOString(),
                                    cat_status: 1,
                                    inserted_by: user.UHA_ID,
                                    component_no: "",
                                    design_file: fileBase64,
                                    can_jcd_triggered: newCompCanJCDConfig ? 1 : 0,
                                    ship_ids: selectedShip?.SHA_ID
                                };

                                // 4. Send request to backend
                                const response = await axios.post(`${API_BASE_URL}add-root-category`, payload, {
                                    headers: {
                                        'Content-Type': 'application/json'
                                    }
                                });

                                // 5. Handle success
                                if (response.data.success) {
                                    alert('Main component added successfully!');
                                    // Refresh data to reflect changes
                                    refreshAgencyList?.();
                                    refreshShipsList?.();
                                    refreshTree?.(); // Refresh component tree
                                    refreshShipsHealthList?.()

                                    // Reset form and close popup
                                    setNeedToInvokeAddMainComponentForm(false);
                                    setNewComponentName('');
                                    setDesignFile(null);
                                    setNewCompHasDesignFile(false);
                                    setNewCompCanJCDConfig(false);
                                } else {
                                    alert('Failed: ' + (response.data.message || 'Unknown error'));
                                }

                            } catch (err) {
                                console.error('Error while adding main component:', err);
                                if (err.response) {
                                    alert('Server error: ' + (err.response.data.message || err.response.statusText));
                                } else if (err.request) {
                                    alert('No response from server. Check your connection or server status.');
                                } else {
                                    alert('Request error: ' + err.message);
                                }
                            }
                        }}>
                            {/* Header */}
                            <div id='ship-management-page-right-container-content-add-component-form-selected-node-container'>
                                <h3>Add New Main Component</h3>
                            </div>

                            {/* Component Name */}
                            <div id='ship-management-page-right-container-content-add-component-form-name-container'>
                                <label htmlFor="component-name">
                                    Main Component Name:
                                    <input
                                        id='new-comp-name'
                                        type="text"
                                        placeholder="Enter Main Component Name..."
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
                                </label>
                            </div>

                            {/* Buttons */}
                            <div id='add-component-form'>
                                <button type='submit' className="btn-submit">
                                    Save Main Component
                                </button>
                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={() => {
                                        setNeedToInvokeAddMainComponentForm(false)
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


            {/*/////////////////////////////////// Copy Components Modal //////////////////////////////////////////////////////////////////////////*/}
            {/* {showCopyComponentModal && (
                <div id='ship-management-page-copy-components-modal-container' style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    zIndex: 1000
                }}>
                    <div style={{
                        backgroundColor: 'white',
                        padding: '30px',
                        borderRadius: '8px',
                        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
                        width: '90%',
                        maxWidth: '600px',
                        maxHeight: '80vh',
                        overflow: 'auto',
                        animation: 'fadeIn 0.3s ease-out'
                    }}>
                        <h3 style={{
                            marginBottom: '20px',
                            color: '#2c3e50',
                            textAlign: 'center',
                            fontSize: '1.5rem'
                        }}>
                            Copy Components from Other Ship
                        </h3>

                        <form onSubmit={async (e) => {
                            e.preventDefault();

                            if (selectedComponentsToCopy.length === 0) {
                                alert('Please select at least one component to copy.');
                                return;
                            }

                            setCopyLoading(true);
                            try {
                                const payload = {
                                    sourceShipId: copySourceShip,
                                    targetShipId: selectedShip.SHA_ID,
                                    components: selectedComponentsToCopy,
                                    copiedBy: user?.UHA_ID || null
                                };

                                const response = await axios.post(`${API_BASE_URL}copyComponents`, payload, {
                                    headers: {
                                        'Content-Type': 'application/json'
                                    }
                                });

                                if (response.data.success) {
                                    alert('Components copied successfully!');
                                    setShowCopyComponentModal(false);

                                    // Refresh the component tree
                                    refreshTree(selectedShip.SHA_ID);

                                    // Reset form
                                    setCopySourceShip('');
                                    setAvailableComponents([]);
                                    setSelectedComponentsToCopy([]);
                                } else {
                                    alert('Failed to copy components: ' + (response.data.message || 'Unknown error'));
                                }
                            } catch (err) {
                                console.error('Error copying components:', err);
                                alert('Error copying components. Please try again.');
                            } finally {
                                setCopyLoading(false);
                            }
                        }}> */}

            {/* Source Ship Selection */}
            {/* <div style={{ marginBottom: '20px' }}>
                                <label style={{
                                    display: 'block',
                                    marginBottom: '8px',
                                    fontWeight: '500',
                                    color: '#34495e',
                                    fontSize: '14px'
                                }}>
                                    Select Source Ship <span style={{ color: 'red' }}>*</span>
                                </label>
                                <select
                                    value={copySourceShip}
                                    onChange={async (e) => {
                                        const shipId = e.target.value;
                                        setCopySourceShip(shipId);
                                        setSelectedComponentsToCopy([]);

                                        if (shipId) {
                                            await fetchComponentsFromShip(shipId);
                                        } else {
                                            setAvailableComponents([]);
                                        }
                                    }}
                                    style={{
                                        width: '100%',
                                        padding: '12px',
                                        border: '1px solid #ddd',
                                        borderRadius: '4px',
                                        fontSize: '14px',
                                        transition: 'border-color 0.3s'
                                    }}
                                    required
                                >
                                    <option value="">Select Source Ship</option>
                                    {shipsList
                                        .filter(ship => ship.SHA_ID !== selectedShip?.SHA_ID) // Exclude current selected ship
                                        .map(ship => (
                                            <option key={ship.SHA_ID} value={ship.SHA_ID}>
                                                {ship.ship_name} ({ship.ship_code})
                                            </option>
                                        ))
                                    }
                                </select>
                            </div> */}

            {/* Components List */}
            {/* {copySourceShip && (
                                <div style={{ marginBottom: '20px' }}>
                                    <label style={{
                                        display: 'block',
                                        marginBottom: '8px',
                                        fontWeight: '500',
                                        color: '#34495e',
                                        fontSize: '14px'
                                    }}>
                                        Select Components to Copy
                                    </label>

                                    {copyLoading ? (
                                        <div style={{ textAlign: 'center', padding: '20px' }}>
                                            <p>Loading components...</p>
                                        </div>
                                    ) : availableComponents.length > 0 ? (
                                        <div style={{
                                            maxHeight: '300px',
                                            overflow: 'auto',
                                            border: '1px solid #ddd',
                                            borderRadius: '4px',
                                            padding: '10px'
                                        }}> */}
            {/* Select All Checkbox */}
            {/* <div style={{ marginBottom: '10px', padding: '5px 0' }}>
                                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedComponentsToCopy.length === availableComponents.length}
                                                        onChange={(e) => {
                                                            if (e.target.checked) {
                                                                setSelectedComponentsToCopy(availableComponents.map(comp => comp.component_id));
                                                            } else {
                                                                setSelectedComponentsToCopy([]);
                                                            }
                                                        }}
                                                    />
                                                    <span style={{ fontWeight: 'bold' }}>Select All</span>
                                                </label>
                                            </div> */}

            {/* Components List */}
            {/* {availableComponents.map((component) => (
                                                <div key={component.component_id} style={{
                                                    padding: '8px',
                                                    borderBottom: '1px solid #f0f0f0',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '10px'
                                                }}>
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedComponentsToCopy.includes(component.component_id)}
                                                        onChange={(e) => {
                                                            if (e.target.checked) {
                                                                setSelectedComponentsToCopy(prev => [...prev, component.component_id]);
                                                            } else {
                                                                setSelectedComponentsToCopy(prev => prev.filter(id => id !== component.component_id));
                                                            }
                                                        }}
                                                    />
                                                    <div>
                                                        <div style={{ fontWeight: '500' }}>{component.component_name}</div>
                                                        {component.component_code && (
                                                            <div style={{ fontSize: '12px', color: '#666' }}>
                                                                Code: {component.component_code}
                                                            </div>
                                                        )}
                                                        {component.component_type && (
                                                            <div style={{ fontSize: '12px', color: '#666' }}>
                                                                Type: {component.component_type}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
                                            No components found in the selected ship.
                                        </div>
                                    )}
                                </div>
                            )} */}

            {/* Selected Count */}
            {/* {selectedComponentsToCopy.length > 0 && (
                                <div style={{
                                    marginBottom: '20px',
                                    padding: '10px',
                                    backgroundColor: '#e8f5e8',
                                    borderRadius: '4px',
                                    textAlign: 'center'
                                }}>
                                    <strong>{selectedComponentsToCopy.length}</strong> component(s) selected for copying
                                </div>
                            )} */}

            {/* Buttons */}
            {/* <div style={{
                                display: 'flex',
                                gap: '12px',
                                justifyContent: 'flex-end'
                            }}>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowCopyComponentModal(false);
                                        setCopySourceShip('');
                                        setAvailableComponents([]);
                                        setSelectedComponentsToCopy([]);
                                    }}
                                    style={{
                                        padding: '10px 20px',
                                        border: '1px solid #dc3545',
                                        backgroundColor: 'white',
                                        color: '#dc3545',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        fontSize: '14px',
                                        transition: 'all 0.3s'
                                    }}
                                    disabled={copyLoading}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    style={{
                                        padding: '10px 20px',
                                        border: 'none',
                                        backgroundColor: '#17a2b8',
                                        color: 'white',
                                        borderRadius: '4px',
                                        cursor: copyLoading ? 'not-allowed' : 'pointer',
                                        fontSize: '14px',
                                        transition: 'all 0.3s',
                                        opacity: copyLoading ? 0.7 : 1
                                    }}
                                    disabled={copyLoading || !copySourceShip || selectedComponentsToCopy.length === 0}
                                >
                                    {copyLoading ? 'Copying...' : 'Copy Selected Components'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
 */}

            {/* /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////// */}

            {/*//////////////////////////////////// Add New Ship Modal//////////////////////////////////////////// */}
            {showAddShipModal && (
                <div id='ship-management-page-add-ship-modal-container' style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    zIndex: 1000
                }}>
                    <div style={{
                        backgroundColor: 'white',
                        padding: '30px',
                        borderRadius: '8px',
                        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
                        width: '90%',
                        maxWidth: '500px',
                        animation: 'fadeIn 0.3s ease-out'
                    }}>
                        <h3 style={{
                            marginBottom: '20px',
                            color: '#2c3e50',
                            textAlign: 'center',
                            fontSize: '1.5rem'
                        }}>
                            Add New Ship
                        </h3>

                        <form onSubmit={(e) => {
                            e.preventDefault();
                            handleSaveNewShip();
                        }}>

                            {/* Agency Selection Field */}
                            <div style={{ marginBottom: '20px' }}>
                                <label style={{
                                    display: 'block',
                                    marginBottom: '8px',
                                    fontWeight: '500',
                                    color: '#34495e',
                                    fontSize: '14px'
                                }}>
                                    Agency Name <span style={{ color: 'red' }}>*</span>
                                </label>
                                <select
                                    value={newShipFormData.agency_id || ''}
                                    onChange={(e) => setNewShipFormData(prev => ({
                                        ...prev,
                                        agency_id: e.target.value
                                    }))}
                                    style={{
                                        width: '100%',
                                        padding: '12px',
                                        border: '1px solid #ddd',
                                        borderRadius: '4px',
                                        fontSize: '14px',
                                        transition: 'border-color 0.3s'
                                    }}
                                    required
                                >
                                    <option value="">Select Agency</option>
                                    {agencyList && agencyList.length > 0 ? (
                                        agencyList.map(agency => (
                                            <option key={agency.AHA_ID} value={agency.AHA_ID}>
                                                {agency.agency_name || agency.AHA_ID}
                                            </option>
                                        ))
                                    ) : (
                                        <option value="" disabled>No agencies available</option>
                                    )}
                                </select>
                                {(!agencyList || agencyList.length === 0) && (
                                    <p style={{ color: '#e74c3c', fontSize: '12px', marginTop: '5px' }}>
                                        No agencies found. Please add an agency first.
                                    </p>
                                )}
                            </div>


                            {/* Ship Name Field */}
                            <div style={{ marginBottom: '20px' }}>
                                <label style={{
                                    display: 'block',
                                    marginBottom: '8px',
                                    fontWeight: '500',
                                    color: '#34495e',
                                    fontSize: '14px'
                                }}>
                                    Ship Name / Vessel Name <span style={{ color: 'red' }}>*</span>
                                </label>
                                <input
                                    type="text"
                                    value={newShipFormData.ship_name}
                                    onChange={(e) => setNewShipFormData(prev => ({
                                        ...prev,
                                        ship_name: e.target.value
                                    }))}
                                    placeholder="Enter ship name..."
                                    style={{
                                        width: '100%',
                                        padding: '12px',
                                        border: '1px solid #ddd',
                                        borderRadius: '4px',
                                        fontSize: '14px',
                                        transition: 'border-color 0.3s'
                                    }}
                                    required
                                />
                            </div>

                            {/* Vessel Code Field */}
                            <div style={{ marginBottom: '30px' }}>
                                <label style={{
                                    display: 'block',
                                    marginBottom: '8px',
                                    fontWeight: '500',
                                    color: '#34495e',
                                    fontSize: '14px'
                                }}>
                                    Vessel Code <span style={{ color: 'red' }}>*</span>
                                </label>
                                <input
                                    type="text"
                                    value={newShipFormData.ship_code}
                                    onChange={(e) => setNewShipFormData(prev => ({
                                        ...prev,
                                        ship_code: e.target.value
                                    }))}
                                    placeholder="Enter vessel code..."
                                    style={{
                                        width: '100%',
                                        padding: '12px',
                                        border: '1px solid #ddd',
                                        borderRadius: '4px',
                                        fontSize: '14px',
                                        transition: 'border-color 0.3s'
                                    }}
                                    required
                                />
                            </div>

                            {/* Buttons */}
                            <div style={{
                                display: 'flex',
                                gap: '12px',
                                justifyContent: 'flex-end'
                            }}>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowAddShipModal(false);
                                        setNewShipFormData({
                                            ship_name: '',
                                            ship_code: ''
                                        });
                                    }}
                                    style={{
                                        padding: '10px 20px',
                                        border: '1px solid #dc3545',
                                        backgroundColor: 'white',
                                        color: '#dc3545',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        fontSize: '14px',
                                        transition: 'all 0.3s'
                                    }}
                                    disabled={saveLoading}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    style={{
                                        padding: '10px 20px',
                                        border: 'none',
                                        backgroundColor: '#28a745',
                                        color: 'white',
                                        borderRadius: '4px',
                                        cursor: saveLoading ? 'not-allowed' : 'pointer',
                                        fontSize: '14px',
                                        transition: 'all 0.3s',
                                        opacity: saveLoading ? 0.7 : 1
                                    }}
                                    disabled={saveLoading}
                                >
                                    {saveLoading ? 'Saving...' : 'Save'}
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
// localhost