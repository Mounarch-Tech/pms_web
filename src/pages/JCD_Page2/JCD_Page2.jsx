// image_required
import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import './JCD_Page2.css';
import Temp_component_heirarchy from '../temp_component_heirarchy/Temp_component_heirarchy';
import { ComponentTreeContext } from '../../contexts/ComponentTreeContext/ComponentTreeContext';
import { JCD_scheduleContext } from '../../contexts/JCD_schedule_context/JCD_scheduleContext';
import { JobTypeContext } from '../../contexts/job_type_context/JobTypeContext';
import { DesignationContext } from '../../contexts/Designation_context/DesignationContext';
import { UserAuthContext } from '../../contexts/userAuth/UserAuthContext';
import axios from 'axios';
import { ShipHeaderContext } from '../../contexts/ship_header_context/ShipHeaderContext';
import { Main_category_cotext } from '../../contexts/CategoriesContext/Main_category_cotext';
import { Sub_category_context } from '../../contexts/CategoriesContext/Sub_category_context';
import { Second_sub_category_context } from '../../contexts/CategoriesContext/Second_sub_category_context';
import { Third_sub_category_context } from '../../contexts/CategoriesContext/Third_sub_category_context';
import { CrewContext } from '../../contexts/crew_context/CrewContext';
import { PlannedJobsContext } from '../../contexts/planned_jobs_context/PlannedJobsContext';
import { JcdShipCombinationContext } from '../../contexts/JcdShipCombinationContext/JcdShipCombinationContext';
import Communication_Comp from '../../components/communication_component/Communication_Comp';
import { Job_extended_details_context } from '../../contexts/job_extended_details_context/Job_extended_details_context';
import { Profile_header_context } from '../../contexts/profile_header_context/Profile_header_context';
import { toast } from 'react-toastify';
import { OfficeStaffCombination_Context } from '../../contexts/OfficeStaffCombinationContext/OfficeStaffCombination_Context';
import { DepartmentsContext } from '../../contexts/DepartmentContext/DepartmentsContext';
import OldIssuedToListComp from '../../components/old_issued_to_list_component/OldIssuedToListComp';
import { useUpcomingJobs } from '../../contexts/UpcomingJobsContext/UpcomingJobsContext';
import * as XLSX from 'xlsx';
// import { toast } from 'react-toast';
// EHA_ID
const JCD_Page2 = () => {
    const apiUrl = import.meta.env.VITE_API_URL;
    const [selectedActiveJobIdForExtention, setSelectedActiveJobIdForExtention] = useState(null)

    // Contexts
    // Contexts - ADD ComponentTreeContext
    const {
        selectedNode,
        refreshTree,
        selectNode,
        clearSelection,           // NEW: Get from context
        updateExecutionStatus,     // NEW: Get from context
        clearExecutionStatus       // NEW: Get from context
    } = useContext(ComponentTreeContext);
    const { JCD_schedule_List, refreshJCDSchedules } = useContext(JCD_scheduleContext);
    const { jobTypesList, refreshJobTypes } = useContext(JobTypeContext);
    const { user } = useContext(UserAuthContext);
    const { profiles } = useContext(Profile_header_context)
    const { shipsList, refreshShipsList, setShipsList } = useContext(ShipHeaderContext)
    const { mainCategoryList, refreshMainCategoryList } = useContext(Main_category_cotext)
    const { subCategoryList, refreshSubCategoryList } = useContext(Sub_category_context)
    const { secondSubCategoryList, refreshSecondSubCategoryList } = useContext(Second_sub_category_context)
    const { thirdSubCategoryList, refreshThirdSubCategoryList } = useContext(Third_sub_category_context)
    const { employeeList, refreshEmployeeList } = useContext(CrewContext)
    const { designationList, refreshDesignationList } = useContext(DesignationContext)
    const { departmentsList, refreshDepartments } = useContext(DepartmentsContext)
    const { plannedJobList, refreshPlannedJobs, activeJobStatusMap } = useContext(PlannedJobsContext)
    const { JCD_ship_wise_group_combinations_list, RefreshJCD_ship_wise_group_combinations } = useContext(JcdShipCombinationContext);
    const { refreshExtendedJobsList, extendedJobsList } = useContext(Job_extended_details_context);
    const { officeStaffList, refreshOfficeStaffList } = useContext(OfficeStaffCombination_Context);
    // Add this near your other context declarations
    const {
        upcomingJobs,
        isLoading: isLoadingUpcomingJobs,
        getUpcomingJobsByComponent,
        renderIntervalCell,
        calculateNextGeneration,
        getComponentCurrentReading
    } = useUpcomingJobs();

    const [isRefreshing, setIsRefreshing] = useState(false);

    // Tabs
    const [activeTab, setActiveTab] = useState('view_jcd');


    // refresh whole component when component mount 
    useEffect(() => {
        // Reset all UI states
        // setActiveTab('new_jcd');
        clearSelection()
        setActiveTab('view_jcd');
        selectNode(null);
        setIsUpdateJCDActive(true);
        setIsSaveJCDActive(false);
        setShow_ship_jcd_linckage_popup(false);
        setLinkedJCD_SHIP_Data(null);
        setCheckedShipsForJCDUpdation([]);
        setIsConfirmShipsForJCDUpdation(false); // if you still use this
        // Reset form and dynamic lists
        resetForm(); // This should reset JCD_form_data, checklistItems, etc.

        // Refresh all context data if needed
        refreshDesignationList();
        refreshEmployeeList();
        refreshJCDSchedules();
        refreshMainCategoryList();
        refreshSubCategoryList();
        refreshSecondSubCategoryList();
        refreshThirdSubCategoryList();
        refreshShipsList();
        refreshTree();
        refreshJobTypes();
        refreshExtendedJobsList()


        // Optional: scroll to top
        window.scrollTo(0, 0);

    }, []); // Empty dependency array = runs only on component mount

    // rough useEffect to logs only
    useEffect(() => {
        console.log('JCD_ship_wise_group_combinations_list : ', JCD_ship_wise_group_combinations_list)
    }, [JCD_ship_wise_group_combinations_list])


    // Form Data
    const [JCD_form_data, setFormData] = useState({
        jcd_name: '',
        JTH_ID: '',
        SHA_ID: '',
        criticality: '',
        job_generation_type: [],
        operational_interval: '',
        time_scale: '',
        km_interval: '',
        periodic_interval: '',
        jcd_category: '3', // Default to "Both" (3)
        jcd_instruction_manual: null,
        jcd_check_list: [],
        status: '1',
        deactivated_by: '',
        deactivated_on: '',
        job_will_generate_on: ['1', '2', '4'], // Default to "All" (5)
        lest_executed_status: '',
        consumable_spare1: '',
        consumable_spare2: '',
        consumable_spare3: '',
        consumable_spare4: '',
        consumable_spare5: '',
        consumable_spare6: '',
        consumable_spare7: '',
        consumable_spare8: '',
        consumable_spare9: '',
        consumable_spare10: '',
        executed_by: '',
        secondary_desg: '',
        first_verified_by: '',
        second_verified_by: '',
        pre_execution_image_required: '0',
        post_execution_image_required: '0',
        video_of_execution_required: '0',
        pdf_file_for_execution_required: '0',
        extension_authority: '',
        jcd_applied_cat: '',
        jcd_applied_sub_cat: '',
        jcd_applied_2nd_sub_cat: '',
        jcd_applied_3rd_sub_cat: '',
        jcd_applied_part: '',
    });

    // Dynamic States
    const [isChecklistEnabled, setIsChecklistEnabled] = useState(false);
    const [checklistItems, setChecklistItems] = useState(['']);
    const [isSparesEnabled, setIsSparesEnabled] = useState(false);
    const [consumableSpares, setConsumableSpares] = useState(['']);
    const [isUpdateJCDActive, setIsUpdateJCDActive] = useState(true)
    const [isSaveJCDActive, setIsSaveJCDActive] = useState(false)
    const [selectedJCDForUpdation, setSelectedJCDForUpdation] = useState(null)
    const [selectedJCDForViewShips, setSelectedJCDForViewShips] = useState(null)
    const [selectedJCDForCommunication, setSelectedJCDForCommunication] = useState(null)
    const [show_ship_jcd_linckage_popup, setShow_ship_jcd_linckage_popup] = useState(false)
    const [linkedJCD_SHIP_Data, setLinkedJCD_SHIP_Data] = useState(null)
    const [checkedShipsForJCDUpdation, setCheckedShipsForJCDUpdation] = useState([])
    const [checkedShipsForNewJcdLinking, setCheckedShipsForNewJcdLinking] = useState([])
    const [checkedShipsToAllocatedSelectedJCD, setCheckedShipsToAllocatedSelectedJCD] = useState([])
    const [isConfirmShipsForJCDUpdation, setIsConfirmShipsForJCDUpdation] = useState(false)
    const [linkJCDToShipAtConfigTime, setLinkJCDToShipAtConfigTime] = useState(false)
    const [isWantToViewShipsLinkedOnSelectedJCD, setIsWantToViewShipsLinkedOnSelectedJCD] = useState(false)
    const [isShowCheckedShipsDetailsToAllocatedSelectedJCD, setIsShowCheckedShipsDetailsToAllocatedSelectedJCD] = useState(false)
    const [appliedFromDates, setAppliedFromDates] = useState({});
    const [confirmedShips, setConfirmedShips] = useState({});
    const [selectedShipFilterForActiveJobTab, setSelectedShipFilterForActiveJobTab] = useState("");
    const [isOpenCommunicationModel, setIsOpenCommunicationModel] = useState(false)
    const [isOpenByExtention, setIsOpenByExtention] = useState(false)

    const [isWantToSeeOldDetailsOfPeviousEmployee, setIsWantToSeeOldDetailsOfPeviousEmployee] = useState(false)
    const [oldDetailsDataOfPeviousEmployees, setOldDetailsDataOfPeviousEmployees] = useState([])

    const [isWantToSuspendJCDFromShips, setIsWantToSuspendJCDFromShips] = useState(false);
    const [checkedShipsToSuspend, setCheckedShipsToSuspend] = useState([]);

    const [isWantToShowExtentionDetailsPerJob, setIsWantToShowExtentionDetailsPerJob] = useState(false)

    // Updated Data
    const [updatedDataForNewJcd, setUpdatedDataForNewJcd] = useState(null)

    const [currentShipIndex, setCurrentShipIndex] = useState(0);

    // variables required for when ship side or responsible crew acknowledge and want to start execution
    const [isShowJcdRequirements, setIsShowJcdRequirements] = useState(false)
    const [selectedJCDForExecution, setSelectedJCDForExecution] = useState(null)
    // const [isExecutionStarted, setIsExecutionStarted] = useState(false)
    const [isAskForRequirementsAfterJobCompleted, setIsAskForRequirementsAfterJobCompleted] = useState(false)

    const [isAcknowledgePopupOpen, setIsAcknowledgePopupOpen] = useState(false);
    const [selectedJobForAcknowledgment, setSelectedJobForAcknowledgment] = useState(null);
    const [acknowledgmentType, setAcknowledgmentType] = useState(''); // 'primary' or 'secondary'
    // Update the executionStatus state to track per job
    const [jobStates, setJobStates] = useState({});

    // useStates related in upcomming job tab
    // const [shipWiseFilteredUpcomingJobs, setShipWiseFilteredUpcomingJobs] = useState([]);
    const [selectedShipIdForUpcoming, setSelectedShipIdForUpcoming] = useState("");
    const [searchTermUpcoming, setSearchTermUpcoming] = useState('');
    const [daysFilterForUpcommingJobs, setDaysFilterForUpcommingJobs] = useState('');

    // these state variables for Check Job Lock
    const [jobLockStatus, setJobLockStatus] = useState({});
    const [executionStatus, setExecutionStatus] = useState({});
    const [jobInProgress, setJobInProgress] = useState(null);
    // Add this state variable near your other state declarations
    const [selectedJobForExecution, setSelectedJobForExecution] = useState(null);

    // Media Preview State
    const [isMediaPreviewOpen, setIsMediaPreviewOpen] = useState(false);
    const [previewMedia, setPreviewMedia] = useState(null);
    const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
    const [isZoomed, setIsZoomed] = useState(false);
    const [zoomLevel, setZoomLevel] = useState(1);
    const [isLoading, setIsLoading] = useState(true);
    const [mediaError, setMediaError] = useState(false);

    // Job Completion Confirmation State
    const [showCompletionConfirmation, setShowCompletionConfirmation] = useState(false);

    // Enhanced Media Preview States
    const [isMediaMaximized, setIsMediaMaximized] = useState(false);
    const [imageZoom, setImageZoom] = useState(1);
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });
    const [isDraggingImage, setIsDraggingImage] = useState(false);

    // Video control states
    const [isVideoPlaying, setIsVideoPlaying] = useState(false);
    const [videoProgress, setVideoProgress] = useState(0);
    const [videoCurrentTime, setVideoCurrentTime] = useState(0);
    const [videoDuration, setVideoDuration] = useState(0);
    const [isVideoMuted, setIsVideoMuted] = useState(false);
    const [videoVolume, setVideoVolume] = useState(100);
    const videoRef = useRef(null);

    // States for upcomming jobs :
    // const [componentReadings, setComponentReadings] = useState({});
    // const [isLoadingReadings, setIsLoadingReadings] = useState(false);
    // const [upcomingJobs, setUpcomingJobs] = useState([]);

    // ==============================emport excel =====================================================
    // necessary excel import states 
    const [importExcelModalOpen, setImportExcelModalOpen] = useState(false);
    const [selectedExcelFile, setSelectedExcelFile] = useState(null);
    const [isImporting, setIsImporting] = useState(false);

    const handleImportExcel = () => {
        if (!selectedShipFilterForActiveJobTab) {
            toast.warning('Please select a ship first');
            return;
        }
        setImportExcelModalOpen(true);
    };

    const handleExcelImport = async () => {
        if (!selectedExcelFile || !selectedShipFilterForActiveJobTab) {
            toast.error('Please select a file and ship');
            return;
        }

        setIsImporting(true);

        try {
            // Read Excel file directly in browser
            const readExcelFile = (file) => {
                return new Promise((resolve, reject) => {
                    const reader = new FileReader();

                    reader.onload = (e) => {
                        try {
                            const data = new Uint8Array(e.target.result);
                            const workbook = XLSX.read(data, { type: 'array' });
                            const sheetName = workbook.SheetNames[0];
                            const worksheet = workbook.Sheets[sheetName];
                            const jsonData = XLSX.utils.sheet_to_json(worksheet);
                            resolve(jsonData);
                        } catch (error) {
                            reject(error);
                        }
                    };

                    reader.onerror = (error) => reject(error);
                    reader.readAsArrayBuffer(file);
                });
            };

            // Read Excel file
            const excelData = await readExcelFile(selectedExcelFile);

            console.log('Excel data read:', {
                rowCount: excelData.length,
                firstRow: excelData[0],
                columns: Object.keys(excelData[0] || {})
            });

            if (excelData.length === 0) {
                toast.error('Excel file is empty');
                return;
            }

            // Send data to backend
            const response = await axios.post(`${apiUrl}importExcelToActiveJobs`, {
                excelData,
                shipId: selectedShipFilterForActiveJobTab,
                importedBy: user.UHA_ID
            });

            if (response.status === 200) {
                const result = response.data;

                if (result.errorCount > 0) {
                    toast.warning(`Imported ${result.successCount} JCDs with ${result.errorCount} errors`);
                    if (result.errors) {
                        console.error('Import errors:', result.errors);
                        alert(`Import completed with ${result.errorCount} errors:\n\n${result.errors.slice(0, 5).join('\n')}${result.errors.length > 5 ? '\n...and more' : ''}`);
                    }
                } else {
                    toast.success(`Successfully imported ${result.successCount} JCDs!`);
                }

                // Refresh the data
                await refreshPlannedJobs();
                await refreshTree();
                await refreshJCDSchedules();

                // Close modal and reset
                setImportExcelModalOpen(false);
                setSelectedExcelFile(null);
            }
        } catch (error) {
            console.error('Error importing Excel:', error);

            let errorMessage = 'Failed to import Excel data. ';

            if (error.response) {
                errorMessage += error.response.data.error || error.response.data.details || `Server error: ${error.response.status}`;
            } else if (error.request) {
                errorMessage += 'No response from server. Please check your connection.';
            } else {
                errorMessage += error.message;
            }

            toast.error(errorMessage);
        } finally {
            setIsImporting(false);
        }
    };
    // ==========end =============================================================================

    const [uploadedFiles, setUploadedFiles] = useState({
        preImage: null,
        postImage: null,
        video: null,
        document: null
    });

    useEffect(() => {
        if (selectedNode) {
            const componentId = selectedNode.data.TSCHA_ID ||
                selectedNode.data.SSCHA_ID ||
                selectedNode.data.SCHA_ID ||
                selectedNode.data.CHA_ID;

            if (componentId) {
                getUpcomingJobsByComponent(componentId, selectedShipIdForUpcoming);
            }
        }
    }, [selectedNode, selectedShipIdForUpcoming, getUpcomingJobsByComponent]);

    // to track current ship index, when we click on next in view jcd tab -> click on no of ships -> select ships -> link -> next button
    useEffect(() => {
        if (isShowCheckedShipsDetailsToAllocatedSelectedJCD) {
            setCurrentShipIndex(0);
        }
    }, [isShowCheckedShipsDetailsToAllocatedSelectedJCD]);

    useEffect(() => {
        (async () => {
            await refreshPlannedJobs()
        })()
    }, [isWantToViewShipsLinkedOnSelectedJCD])

    useEffect(() => {
        (async () => {
            await refreshOfficeStaffList()
        })()

        if (user.emp_type == 1) {
            setSelectedShipFilterForActiveJobTab(user.ship_id)
        } else {
            const allocated_ships = officeStaffList.filter(os => os.user_id == user.UHA_ID)[0].allocated_ships
            const ships = shipsList.filter(s => allocated_ships.includes(s.SHA_ID))
            console.log('ships ::::: ', ships)
            setShipsList(ships)
        }
    }, [user])

    // useEffect to check lock status for active jobs
    // Add these useEffect hooks for lock management
    useEffect(() => {
        // Check lock status for all active jobs when component mounts or active tab changes
        const checkAllJobLocks = async () => {
            if (activeTab === 'active_jobs' && selectedNode?.data?.activeJobCount) {
                const activeJobs = selectedNode.data.activeJobCount.filter(job =>
                    job.activeJobs?.job_status === 1 || job.activeJobs?.job_status === 2 || job.activeJobs?.job_status === 3
                );

                for (const job of activeJobs) {
                    await checkJobLockStatus(job.activeJobs);
                }
            }
        };

        checkAllJobLocks();
    }, [activeTab, selectedNode]);


    // Read-only mode (ship users)
    const isReadOnly = user?.emp_type === 1;

    // Handlers
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        if (isReadOnly) return;

        if (type === 'checkbox' && name === 'job_generation_type') {
            setFormData((prev) => {
                let list = [...prev.job_generation_type];

                // If value is a comma-separated string (like '1,2'), split it safely
                const values = value.includes(',')
                    ? value.split(',').map(v => v.trim())
                    : [value];

                if (checked) {
                    // Add each value only if not already present
                    values.forEach(v => {
                        if (!list.includes(v)) {
                            list.push(v);
                        }
                    });
                } else {
                    // Remove each value
                    list = list.filter(item => !values.includes(item));
                }

                return { ...prev, job_generation_type: list };
            });
        } else if (type === 'checkbox' && name === 'job_will_generate_on') {
            setFormData((prev) => {
                const list = [...prev.job_will_generate_on];
                if (checked) {
                    list.push(value);
                } else {
                    const index = list.indexOf(value);
                    if (index > -1) list.splice(index, 1);
                }
                return { ...prev, job_will_generate_on: list };
            });
        } else {
            setFormData((prev) => ({ ...prev, [name]: value }));
        }
    };

    const handleFileChange = (e) => {
        if (isReadOnly) return;
        const file = e.target.files[0];
        console.log('file in jcd page 2 : ', file)
        setFormData((prev) => ({ ...prev, jcd_instruction_manual: file }));
    };

    const handleChecklistChange = (idx, value) => {
        if (isReadOnly) return;
        const updated = [...checklistItems];
        updated[idx] = value;
        setChecklistItems(updated);
    };

    const addChecklistItem = () => {
        if (isReadOnly || checklistItems.length >= 10) return;
        setChecklistItems([...checklistItems, '']);
    };

    const removeChecklistItem = (idx) => {
        if (isReadOnly || checklistItems.length <= 1) return;
        const updated = checklistItems.filter((_, i) => i !== idx);
        setChecklistItems(updated);
    };

    const addSpare = () => {
        if (isReadOnly || consumableSpares.length >= 10) return;
        setConsumableSpares([...consumableSpares, '']);
    };

    const removeSpare = (idx) => {
        if (isReadOnly || consumableSpares.length <= 1) return;
        const updated = consumableSpares.filter((_, i) => i !== idx);
        setConsumableSpares(updated);
        const spareName = `consumable_spare${idx + 1}`;
        setFormData((prev) => ({ ...prev, [spareName]: '' }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (isReadOnly) {
            toast.warning("You are in view-only mode and cannot edit.");
            return;
        }

        // Validate required fields
        if (JCD_form_data.job_generation_type.length === 0) {
            toast.warning("Please select at least one Job Generation Type.");
            return;
        }

        if (!JCD_form_data.jcd_category) {
            toast.warning("Please select JCD Category.");
            return;
        }

        if (JCD_form_data.job_will_generate_on.length === 0) {
            toast.warning("Please select at least one condition for job generation.");
            return;
        }

        // Create FormData to handle file upload
        const formData = new FormData();

        // Add the instruction manual file if exists
        if (JCD_form_data.jcd_instruction_manual) {
            formData.append('jcd_instruction_manual', JCD_form_data.jcd_instruction_manual);
        }

        // Prepare form data
        let updatedData = { ...JCD_form_data };

        // ✅ FIXED: Properly handle empty numeric fields
        const sanitizeNumericField = (value) => {
            if (value === '' || value === null || value === undefined) {
                return null;
            }
            return value;
        };

        // Sanitize numeric fields
        updatedData.km_interval = sanitizeNumericField(updatedData.km_interval);
        updatedData.operational_interval = sanitizeNumericField(updatedData.operational_interval);
        updatedData.periodic_interval = sanitizeNumericField(updatedData.periodic_interval);
        updatedData.time_scale = sanitizeNumericField(updatedData.time_scale);

        // Normalize job_generation_type
        if (Array.isArray(updatedData.job_generation_type)) {
            const flatList = updatedData.job_generation_type
                .flatMap(v => v.includes(',') ? v.split(',').map(s => s.trim()) : [v])
                .filter(v => ['1', '2', '3'].includes(v));
            updatedData.job_generation_type = [...new Set(flatList)].join(',');
        } else {
            updatedData.job_generation_type = '';
        }

        // Set deactivation fields
        if (JCD_form_data.status === '2') {
            updatedData.deactivated_by = user.UHA_ID;
            updatedData.deactivated_on = new Date().toISOString().split('T')[0];
        }

        // Add checklist
        updatedData.jcd_check_list = isChecklistEnabled ? checklistItems : [];

        // Fill consumable spares
        consumableSpares.forEach((_, idx) => {
            const field = `consumable_spare${idx + 1}`;
            updatedData[field] = JCD_form_data[field] || '';
        });
        for (let i = consumableSpares.length; i < 10; i++) {
            updatedData[`consumable_spare${i + 1}`] = '';
        }

        // Apply component hierarchy
        updatedData.jcd_applied_cat = selectedNode?.data?.CHA_ID ?? null;
        updatedData.jcd_applied_sub_cat = selectedNode?.data?.SCHA_ID ?? null;
        updatedData.jcd_applied_2nd_sub_cat = selectedNode?.data?.SSCHA_ID ?? null;
        updatedData.jcd_applied_3rd_sub_cat = selectedNode?.data?.TSCHA_ID ?? null;
        updatedData.inserted_by = user.UHA_ID;
        updatedData.inserted_on = new Date().toISOString().split('T')[0];

        // Append all form data to FormData
        Object.keys(updatedData).forEach(key => {
            if (key !== 'jcd_instruction_manual') { // Skip file as it's already appended
                formData.append(key, updatedData[key]);
            }
        });

        try {
            if (!isUpdateJCDActive) {
                // UPDATE MODE - Use FormData with file
                const response = await axios.put(`${apiUrl}updateJCDScheduleById`, formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                });

                if (response.status === 200) {
                    toast.success('JCD updated successfully!');
                    resetForm();
                    await refreshAllData()
                }
            } else {
                // CREATE MODE - Use FormData with file
                setUpdatedDataForNewJcd(updatedData);
                setLinkJCDToShipAtConfigTime(true);
            }
        } catch (err) {
            console.error(err);
            toast.error("Error saving JCD. Check console for details.");
        }
    };

    const resetForm = () => {
        setFormData({
            jcd_name: '',
            JTH_ID: '',
            SHA_ID: '',
            criticality: '',
            job_generation_type: [],
            operational_interval: '',
            time_scale: '',
            km_interval: '',
            periodic_interval: '',
            jcd_category: '3', // Reset to "Both"
            jcd_instruction_manual: null,
            jcd_check_list: [],
            status: '1',
            deactivated_by: '',
            deactivated_on: '',
            job_will_generate_on: ['1', '2', '4'], // Reset to "All"
            lest_executed_status: '',
            consumable_spare1: '',
            consumable_spare2: '',
            consumable_spare3: '',
            consumable_spare4: '',
            consumable_spare5: '',
            consumable_spare6: '',
            consumable_spare7: '',
            consumable_spare8: '',
            consumable_spare9: '',
            consumable_spare10: '',
            executed_by: '',
            secondary_desg: '',
            first_verified_by: '',
            second_verified_by: '',
            pre_execution_image_required: '0',
            post_execution_image_required: '0',
            video_of_execution_required: '0',
            pdf_file_for_execution_required: '0',
            extension_authority: '',
            jcd_applied_cat: '',
            jcd_applied_sub_cat: '',
            jcd_applied_2nd_sub_cat: '',
            jcd_applied_3rd_sub_cat: '',
            jcd_applied_part: '',
        });
        setIsChecklistEnabled(false);
        setChecklistItems(['']);
        setIsSparesEnabled(false);
        setConsumableSpares(['']);
        setIsUpdateJCDActive(true)
        setIsSaveJCDActive(false)
    };

    const handleJcdEdit = (selectedJcdData) => {
        const updatedJcdFormData = mapBackendToFormData(selectedJcdData)
        // console.log('jcd in handle JCD Edit : ', updatedJcdFormData)
        // console.log('selectedJcdData : ', selectedJcdData)

        setSelectedJCDForUpdation(selectedJcdData)
        // setSelectedJCDForUpdation(updatedJcdFormData)
        setActiveTab('new_jcd')
        setFormData(updatedJcdFormData)
        setIsUpdateJCDActive(false)
        setIsSaveJCDActive(true)
    }

    // Helper for handleJcdEdit Function
    const mapBackendToFormData = (data) => {
        // Convert job_generation_type to clean array of individual values
        let jobGenType = [];
        if (data.job_generation_type) {
            if (Array.isArray(data.job_generation_type)) {
                jobGenType = data.job_generation_type;
            } else if (typeof data.job_generation_type === 'string') {
                jobGenType = data.job_generation_type.split(',').map(v => v.trim());
            }
        }
        // Remove any empty or malformed entries
        jobGenType = jobGenType.filter(v => v === '1' || v === '2' || v === '3');

        // Handle job_will_generate_on with default to "All"
        let jobWillGenerateOn = [5]; // Default to "All"
        if (data.job_will_generate_on) {
            if (Array.isArray(data.job_will_generate_on)) {
                jobWillGenerateOn = data.job_will_generate_on;
            } else if (typeof data.job_will_generate_on === 'string') {
                jobWillGenerateOn = data.job_will_generate_on.split(',').map(v => v.trim());
            }
        }

        return {
            jcd_name: data.jcd_name || null,
            jcd_id: data.jcd_id || null,
            JTH_ID: data.JTH_ID || null,
            SHA_ID: data.SHA_ID || null,
            criticality: data.criticality ?? null,
            job_generation_type: jobGenType,
            operational_interval: data.operational_interval ?? null,
            time_scale: data.time_scale ?? null,
            km_interval: data.km_interval ?? null,
            periodic_interval: data.periodic_interval ?? null,
            jcd_category: data.jcd_category ?? '3', // Default to "Both"
            jcd_instruction_manual: data.jcd_instruction_manual ?? null,
            jcd_check_list: data.jcd_check_list ?? null,

            status: data.status ?? '1',
            deactivated_by: data.deactivated_by ?? null,
            deactivated_on: data.deactivated_on ?? null,
            job_will_generate_on: jobWillGenerateOn, // Use processed value
            lest_executed_status: data.lest_executed_status ?? null,

            consumable_spare1: data.consumable_spare1 ?? null,
            consumable_spare2: data.consumable_spare2 ?? null,
            consumable_spare3: data.consumable_spare3 ?? null,
            consumable_spare4: data.consumable_spare4 ?? null,
            consumable_spare5: data.consumable_spare5 ?? null,
            consumable_spare6: data.consumable_spare6 ?? null,
            consumable_spare7: data.consumable_spare7 ?? null,
            consumable_spare8: data.consumable_spare8 ?? null,
            consumable_spare9: data.consumable_spare9 ?? null,
            consumable_spare10: data.consumable_spare10 ?? null,

            executed_by: data.executed_by ?? null,
            secondary_desg: data.secondary_desg ?? null,
            first_verified_by: data.first_verified_by ?? null,
            second_verified_by: data.second_verified_by ?? null,
            extension_authority: data.extension_authority ?? null,

            pre_execution_image_required: data?.pre_execution_image_required ?? 0,
            post_execution_image_required: data?.post_execution_image_required ?? 0,
            video_of_execution_required: data?.video_of_execution_required ?? 0,
            pdf_file_for_execution_required: data?.pdf_file_for_execution_required ?? 0,

            jcd_applied_cat: data.jcd_applied_cat ?? null,
            jcd_applied_sub_cat: data.jcd_applied_sub_cat ?? null,
            jcd_applied_2nd_sub_cat: data.jcd_applied_2nd_sub_cat ?? null,
            jcd_applied_3rd_sub_cat: data.jcd_applied_3rd_sub_cat ?? null,
            jcd_applied_part: data.jcd_applied_part ?? null,
        };
    };

    const filter_jcd_data_linked_on_ships = () => {
        // console.log('Selected JCD Data : ', selectedJCDForUpdation)
        const result = JCD_schedule_List.filter((jcd) => {
            if (jcd.jcd_id == selectedJCDForUpdation.jcd_id && jcd.SHA_ID != null) {
                // console.log('jcd : ', jcd)
                return jcd
            }
        })

        // if (result.length > 0) {
        setShow_ship_jcd_linckage_popup(true)
        // }
        setLinkedJCD_SHIP_Data(result)
        // console.log('filter_jcd_data_linked_on_ships result : ',result)
    }

    const handleConfirmShipsForJCDUpdation = async () => {
        if ((checkedShipsForJCDUpdation.length === 0 || isConfirmShipsForJCDUpdation == false) && linkedJCD_SHIP_Data.length > 0) {
            toast.warning('Please select at least one ship to update.');
            return;
        }

        const updatedFormData = { ...JCD_form_data };

        // Prepare payload
        const payload = {
            ...updatedFormData,
            jcd_id: selectedJCDForUpdation.jcd_id,
            SHA_ID: checkedShipsForJCDUpdation.map(s => s.SHA_ID).join(','), // comma-separated
            // JCDSHA_ID not needed if backend uses jcd_id + SHA_ID
        };

        // console.log('payload : ', payload)

        try {
            const res = await axios.put(`${apiUrl}updateJCDScheduleById`, payload);
            if (res.status === 200) {
                toast.success('JCD updated successfully across selected ships!');
                resetForm()
                refreshJCDSchedules(); // sync context
                setShow_ship_jcd_linckage_popup(false);
                setCheckedShipsForJCDUpdation([]); // reset
            }
        } catch (err) {
            console.error(err);
            toast.error('Failed to update JCD. 463');
        }
    };

    // Job Status Mapping
    const firedJobStatusMap = {
        1: "Generated - Awaiting Acknowledgment",
        2: "Not Acknowledged",
        3: "Acknowledged - Ready for Execution",
        4: "Executed - Completed",
        5: "First Verification Done",
        6: "Second Verification Done",
        7: "Extension Requested",
        8: "Extension Accepted"
    };

    // // rough use Effect for testing
    // useEffect(() => {

    //     console.log('oldDetailsDataOfPeviousEmployees : ', oldDetailsDataOfPeviousEmployees)
    // }, [oldDetailsDataOfPeviousEmployees])

    useEffect(() => {
        (async () => {
            await refreshJCDSchedules();
            await refreshDesignationList()
            await refreshEmployeeList()
            await refreshPlannedJobs()

            // console.log('hiiii')
        })();
    }, [activeTab]);


    const shipsLinkedWithSelectedJCD = useMemo(() => {
        if (!selectedJCDForViewShips) return [];

        return shipsList?.filter((ship) =>
            JCD_ship_wise_group_combinations_list.some(
                (obj) =>
                    obj.SHA_ID === ship.SHA_ID &&
                    obj.jcds?.toString().includes(selectedJCDForViewShips.jcd_id)
            )
        ) || [];
    }, [selectedJCDForViewShips, shipsList, JCD_ship_wise_group_combinations_list]);

    useEffect(() => {
        setSelectedShipFilterForActiveJobTab("");
    }, [selectedNode]);



    const refreshAllData = async () => {
        try {
            setIsRefreshing(true)
            await Promise.all([
                refreshDesignationList(),
                refreshEmployeeList(),
                refreshJCDSchedules(),
                refreshMainCategoryList(),
                refreshSubCategoryList(),
                refreshSecondSubCategoryList(),
                refreshThirdSubCategoryList(),
                refreshShipsList(),
                refreshTree(),
                refreshJobTypes(),
                refreshExtendedJobsList(),
                refreshPlannedJobs(),
                RefreshJCD_ship_wise_group_combinations(),
                refreshOfficeStaffList()
            ]);
            console.log('All data refreshed successfully');
        } catch (error) {
            console.error('Error refreshing data:', error);
            toast.error('Failed to refresh some data');
        } finally {
            setIsRefreshing(false)
        }
    };

    const unlinkJcdsFromShip = async (jcdId, ship_id) => {
        // Validate input
        if (!jcdId) {
            toast.warning("No JCD provided for unlinking");
            return;
        }

        if (!ship_id) {
            toast.warning("No Ship provided for unlinking");
            return;
        }

        const shipName = shipsList.find(s => s.SHA_ID == ship_id)?.ship_name;

        // Refresh data to get latest job status
        await refreshPlannedJobs();
        await refreshJCDSchedules();

        // Find the JCDSHA_ID for this specific jcd-ship combination
        const jcdSchedule = JCD_schedule_List.find(j => j.jcd_id == jcdId && j.SHA_ID == ship_id);

        if (!jcdSchedule?.JCDSHA_ID) {
            toast.error('JCD not found for this ship or JCDSHA_ID is missing');
            return;
        }

        const jcdshaID = jcdSchedule.JCDSHA_ID;

        // Check for active jobs - FIXED: Add null check and proper filtering
        const activeJobs = plannedJobList.filter(pl => {
            // Add null checks to prevent the "Cannot read properties of undefined" error
            if (!pl || !pl.jcd_id) return false;

            return pl.jcd_id == jcdshaID &&
                pl.job_status != 6; // Active job statuses (not completed)
        });

        console.log('Active jobs check:', {
            jcdId,
            ship_id,
            jcdshaID,
            activeJobsCount: activeJobs.length,
            activeJobs: activeJobs,
            jcdSchedule: jcdSchedule
        });

        if (activeJobs.length > 0) {
            const jobStatusText = activeJobs.map(job =>
                firedJobStatusMap[job.job_status] || `Status ${job.job_status}`
            ).join(', ');

            toast.error(`Active job(s) found for this JCD on ${shipName}. Job status: ${jobStatusText}. Please complete the active job(s) first before unlinking.`);
            return;
        }

        const confirmation = confirm(`Are you sure you want to unlink this JCD (${jcdId}) from the ${shipName}?`);
        if (!confirmation) return;

        try {
            // Use regular object instead of FormData
            const payload = {
                SHA_ID: ship_id,
                JCD_ID: jcdId
            };

            console.log('Unlink payload:', payload);

            const response = await axios.post(`${apiUrl}unlinkJCDFromShipAndSchedule`, payload);

            if (response.status === 200 || response.status === 201) {
                toast.success(`Successfully unlinked JCD: ${jcdId} from ${shipName}`);

                // Refresh all relevant data
                await refreshJCDSchedules();
                await RefreshJCD_ship_wise_group_combinations();
                await refreshTree();
                await refreshPlannedJobs();

                // If you're currently viewing ships linked to this JCD, refresh that view
                if (isWantToViewShipsLinkedOnSelectedJCD && selectedJCDForViewShips) {
                    setIsWantToViewShipsLinkedOnSelectedJCD(false);
                    setTimeout(() => setIsWantToViewShipsLinkedOnSelectedJCD(true), 100);
                }

            } else {
                throw new Error("Unlink failed with status: " + response.status);
            }
        } catch (err) {
            console.error("❌ Error during unlinking:", err);
            if (err.response?.data?.error) {
                toast.error(`Failed to unlink JCD: ${err.response.data.error}`);
            } else {
                toast.error("Failed to unlink JCD. Please try again.");
            }
        }
    };

    // write logic if unlink successfull then suspend it 
    const suspendJCdFromShips = async () => {
        if (!selectedJCDForViewShips?.jcd_id) {
            toast.error('No JCD selected for suspension');
            return;
        }

        if (!checkedShipsToSuspend || checkedShipsToSuspend.length === 0) {
            toast.error('No ships selected for suspension');
            return;
        }

        try {
            const response = await axios.put(`${apiUrl}suspendJCDFromShips`, {
                JCD_ID: selectedJCDForViewShips.jcd_id,
                SHA_IDs: checkedShipsToSuspend,
                suspended_by: user.UHA_ID,
                suspended_on: new Date().toISOString().split('T')[0],
            });

            if (response.status === 200 || response.status === 201) {
                toast.success('JCD suspended successfully from selected ships!');

                // Refresh data
                await refreshJCDSchedules();
                await refreshPlannedJobs();
                await RefreshJCD_ship_wise_group_combinations();
                await refreshTree();

                // Reset state
                setIsWantToSuspendJCDFromShips(false);
                setCheckedShipsToSuspend([]);
            } else {
                throw new Error("Suspend failed with status: " + response.status);
            }
        } catch (err) {
            console.error("❌ Error during suspension:", err);
            toast.error('Failed to suspend JCD. Please try again.');
        }
    };

    // Add these helper functions
    const handleFileUpload = (fileType, file) => {
        setUploadedFiles(prev => ({
            ...prev,
            [fileType]: file
        }));
    };

    const removeUploadedFile = (fileType) => {
        setUploadedFiles(prev => ({
            ...prev,
            [fileType]: null
        }));
    };

    const areAllRequirementsFilled = () => {
        const requirements = [];

        if (selectedJCDForExecution?.pre_execution_image_required == 1) {
            requirements.push(uploadedFiles.preImage);
        }

        if (selectedJCDForExecution?.post_execution_image_required == 1) {
            requirements.push(uploadedFiles.postImage);
        }

        if (selectedJCDForExecution?.video_of_execution_required == 1) {
            requirements.push(uploadedFiles.video);
        }

        if (selectedJCDForExecution?.pdf_file_for_execution_required == 1) {
            requirements.push(uploadedFiles.document);
        }

        return requirements.every(req => req !== null);
    };

    // handleJobCompletion function to match your backend
    const handleJobCompletion = async () => {
        if (!areAllRequirementsFilled()) {
            toast.error('Please complete all required fields');
            return;
        }

        try {
            // Create FormData for file uploads
            const formData = new FormData();

            // Append files with proper field names
            if (uploadedFiles.preImage) formData.append('pre_execution_image', uploadedFiles.preImage);
            if (uploadedFiles.postImage) formData.append('post_execution_image', uploadedFiles.postImage);
            if (uploadedFiles.video) formData.append('execution_video', uploadedFiles.video);
            if (uploadedFiles.document) formData.append('pdf_document', uploadedFiles.document);

            // Append job data - use selectedJobForExecution instead of selectedJCDForExecution
            formData.append('jobId', selectedJobForExecution?.JPHA_ID); // Changed from selectedJCDForExecution?.job_id
            formData.append('jcdId', selectedJobForExecution?.jcd_id); // Changed from selectedJCDForExecution?.jcd_id
            formData.append('completedBy', user.UHA_ID);
            formData.append('shipId', selectedJobForExecution?.SHA_ID); // Changed from selectedJCDForExecution?.SHA_ID
            formData.append('ship_name', shipsList.find(s => s.SHA_ID === selectedJobForExecution?.SHA_ID)?.ship_name || 'Unknown Ship');

            // Call your API to complete the job
            const response = await axios.post(`${apiUrl}completeJobWithRequirements`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            if (response.status === 200) {
                toast.success('Job completed successfully!');

                // Clear execution status for this job using context
                if (clearExecutionStatus) {
                    clearExecutionStatus(selectedJobForExecution?.JPHA_ID);
                }

                // Reset states
                setIsAskForRequirementsAfterJobCompleted(false);
                setUploadedFiles({
                    preImage: null,
                    postImage: null,
                    video: null,
                    document: null
                });

                setJobStates((prev) => ({
                    ...prev,
                    [selectedJobForExecution?.JPHA_ID]: {
                        started: false,
                        completed: true
                    }
                }));

                // Clear the job in progress
                setJobInProgress(null);
                setExecutionStatus(prev => ({
                    ...prev,
                    [selectedJobForExecution?.JPHA_ID]: null
                }));

                // Refresh data
                await refreshAllData();
            }
        } catch (error) {
            console.error('Error completing job:', error);
            toast.error('Failed to complete job. Please try again.');
        }
    };

    // Enhanced acknowledge function with lock
    const handleAcknowledgeJob = async (job) => {
        try {
            const API_BASE_URL = import.meta.env.VITE_API_URL;

            // First check if job is already locked
            const currentLockStatus = await checkJobLockStatus(job);

            if (currentLockStatus?.isLocked && currentLockStatus.lockedBy !== user.UHA_ID) {
                alert('This job is already locked by another user. Please try again later.');
                return;
            }

            const response = await fetch(`${API_BASE_URL}acknowledgeJobWithLock`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    job_id: job.JPHA_ID,
                    jcd_id: job.jcd_id,
                    ship_id: job.SHA_ID,
                    user_id: user.UHA_ID
                })
            });

            const result = await response.json();

            if (result.success) {
                alert('Job acknowledged successfully! You now have the lock.');

                // Refresh job data and lock status
                await refreshPlannedJobs();
                await checkJobLockStatus(job);
                await refreshTree();

                // Update job status locally for immediate UI update
                setJobStates(prev => ({
                    ...prev,
                    [job.JPHA_ID]: { ...prev[job.JPHA_ID], acknowledged: true }
                }));

            } else {
                throw new Error(result.message || 'Failed to acknowledge job');
            }

        } catch (error) {
            console.error('Error acknowledging job:', error);
            alert('Error acknowledging job: ' + error.message);
        }
    };

    // Function to release job lock
    const handleReleaseJobLock = async (job) => {
        try {
            const API_BASE_URL = import.meta.env.VITE_API_URL;

            // Verify current user owns the lock
            const currentLock = jobLockStatus[job.JPHA_ID];
            if (!currentLock?.currentUserHasLock) {
                alert('You do not have the lock on this job.');
                return;
            }

            const response = await fetch(`${API_BASE_URL}releaseJobLock`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    job_id: job.JPHA_ID,
                    jcd_id: job.jcd_id,
                    user_id: user.UHA_ID,
                    ship_id: job.SHA_ID,
                    job_name: JCD_schedule_List.find(j => j.JCDSHA_ID == job.jcd_id)?.jcd_name || 'Unknown Job',
                    released_by: user.emp_name,
                    released_by_designation: designationList.find(d => d.DSGH_ID === user.emp_desg)?.desg_name || 'N/A'
                })
            });

            const result = await response.json();

            if (result.success) {
                alert('Job lock released successfully! Email notification has been sent to the Ship Superintendent.');

                // Update local state immediately
                setJobLockStatus(prev => ({
                    ...prev,
                    [job.JPHA_ID]: {
                        isLocked: false,
                        lockedBy: null,
                        lockedByUser: null,
                        currentUserHasLock: false,
                        lockedAt: null
                    }
                }));

                // Refresh job data
                await refreshPlannedJobs();
                await refreshTree();

            } else {
                throw new Error(result.message || 'Failed to release job lock');
            }

        } catch (error) {
            console.error('Error releasing job lock:', error);
            alert('Error releasing job lock: ' + error.message);
        }
    };

    // Fix the startJobExecution function
    const startJobExecution = async (job) => {
        try {
            setJobInProgress(job.JPHA_ID);

            // Update execution status
            setExecutionStatus(prev => ({
                ...prev,
                [job.JPHA_ID]: 'in_progress'
            }));

            // Update job states
            setJobStates(prev => ({
                ...prev,
                [job.JPHA_ID]: {
                    ...prev[job.JPHA_ID],
                    started: true,
                    startedAt: new Date().toISOString()
                }
            }));

            // Show JCD requirements popup
            const jcd = JCD_schedule_List.find(j => j.JCDSHA_ID == job.jcd_id && j.SHA_ID == job.SHA_ID);

            if (jcd) {
                setSelectedJCDForExecution(jcd);
                setSelectedJobForExecution(job); // This line was causing the error
                setIsShowJcdRequirements(true);
            }

            toast.info('Job execution started. Review requirements before proceeding.');

        } catch (error) {
            console.error('Error starting job execution:', error);
            toast.error('Failed to start execution');

            // Reset state on error
            setJobInProgress(null);
            setExecutionStatus(prev => ({
                ...prev,
                [job.JPHA_ID]: null
            }));
        }
    };

    // Also fix the completeJobExecution function to use the same pattern
    const completeJobExecution = (job) => {
        const jcd = JCD_schedule_List.find(j => j.JCDSHA_ID == job.jcd_id && j.SHA_ID == job.SHA_ID);
        if (jcd) {
            setSelectedJCDForExecution(jcd);
            setSelectedJobForExecution(job); // Add this line here too
            setIsAskForRequirementsAfterJobCompleted(true);
        }
    };

    // Cancel job execution function
    const cancelJobExecution = (jobId) => {
        setJobInProgress(null);
        setExecutionStatus(prev => ({
            ...prev,
            [jobId]: null
        }));

        setJobStates(prev => ({
            ...prev,
            [jobId]: {
                ...prev[jobId],
                started: false
            }
        }));
    };

    // Filter upcoming jobs based on ship selection and search
    const filteredUpcomingJobs = useMemo(() => {
        let filtered = upcomingJobs; // Use from context

        // Apply ship filter
        if (selectedShipIdForUpcoming) {
            filtered = filtered.filter(job => job.ship_id == selectedShipIdForUpcoming);
        }

        // Apply search filter
        if (searchTermUpcoming) {
            filtered = filtered.filter(job =>
                job.jcd_name?.toLowerCase().includes(searchTermUpcoming.toLowerCase()) ||
                job.jcd_code?.toLowerCase().includes(searchTermUpcoming.toLowerCase()) ||
                job.component?.name?.toLowerCase().includes(searchTermUpcoming.toLowerCase())
            );
        }

        // Apply days filter
        if (daysFilterForUpcommingJobs && daysFilterForUpcommingJobs > 0) {
            filtered = filtered.filter(job => {
                if (job.days_until) {
                    return job.days_until <= parseInt(daysFilterForUpcommingJobs);
                }
                return false;
            });
        }

        return filtered;
    }, [upcomingJobs, selectedShipIdForUpcoming, searchTermUpcoming, daysFilterForUpcommingJobs]);

    const renderUpcomingJobsRows = () => {
        if (isLoadingUpcomingJobs) {
            return (
                <tr>
                    <td colSpan={11} style={{ textAlign: 'center', padding: '20px' }}>
                        <div className="loading-spinner">
                            Loading upcoming jobs...
                        </div>
                    </td>
                </tr>
            );
        }

        if (filteredUpcomingJobs.length === 0) {
            return (
                <tr>
                    <td colSpan={11} style={{ textAlign: 'center', padding: '20px' }}>
                        No upcoming jobs found for the selected criteria
                    </td>
                </tr>
            );
        }

        return filteredUpcomingJobs.map((job, index) => {
            // job already has next_generation data from the API
            const getUpcomingComponentString = () => {
                return (
                    <>
                        {job.component?.name || 'Unknown Component'}
                        <br />
                        <span style={{ fontSize: '0.8rem', fontStyle: 'italic', color: 'green' }}>
                            {job.jcd_name || 'Loading Job Name'}
                        </span>
                        <br />
                        <span style={{ fontSize: '0.7rem', color: '#666' }}>
                            No: {job.component?.number || 'N/A'}
                        </span>
                    </>
                );
            };

            const getUpcomingCrewString = () => {
                if (!job.last_execution_date) {
                    return 'No previous assignment';
                }

                return (
                    <>
                        <span style={{ fontSize: '0.8rem' }}>
                            Last Executed On:<br />
                            {new Date(job.last_execution_date).toLocaleDateString()}
                        </span>
                    </>
                );
            };

            const getPriorityString = () => {
                let priority = 'Normal';
                let className = 'success';

                if (job.is_overdue) {
                    priority = 'Overdue';
                    className = 'overdue';
                } else if (job.criticality === 'Critical') {
                    priority = 'High';
                    className = 'warning';
                }

                return (
                    <span className={`status-badge ${className}`}>
                        {priority}
                    </span>
                );
            };

            console.log('job in upcomming jcd :: ', job)

            return (
                <tr key={job.jcd_id}>
                    <td><input type="checkbox" /></td>
                    <td>{job.jcd_code}</td>
                    <td>{getUpcomingComponentString()}</td>
                    <td>
                        {renderIntervalCell(job.next_generation?.runningHours, 'running_hours')}
                    </td>
                    <td>
                        {job.ship_name || 'Unknown Ship'}
                    </td>
                    <td>
                        {job.current_reading || '0.0'} hours
                        <br />
                        <small style={{ fontSize: '0.7rem', color: '#666' }}>
                            {parseFloat(job.last_generated_reading || 0) > 0
                                ? `Last gen: ${parseFloat(job.last_generated_reading || 0).toFixed(1)}h`
                                : 'First job pending'
                            }
                        </small>
                    </td>
                    <td>
                        {job.percentage_complete !== undefined ? (
                            <div style={{ width: '100%' }}>
                                <div style={{
                                    width: '100%',
                                    background: '#e5e7eb',
                                    height: '8px',
                                    borderRadius: '4px',
                                    marginBottom: '4px'
                                }}>
                                    <div style={{
                                        width: `${job.percentage_complete}%`,
                                        background: job.is_overdue ? '#ef4444' : '#059669',
                                        height: '8px',
                                        borderRadius: '4px'
                                    }}></div>
                                </div>
                                <div style={{
                                    fontSize: '0.8rem',
                                    textAlign: 'center',
                                    color: job.is_overdue ? '#ef4444' : '#059669'
                                }}>
                                    {job.percentage_complete}%
                                </div>
                            </div>
                        ) : (
                            <span className="text-muted">-</span>
                        )}
                    </td>
                    <td>
                        {job.next_generation?.runningHours ? (
                            <div style={{ textAlign: 'left' }}>
                                <div style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>
                                    {job.next_generation.runningHours.value}
                                </div>
                                {job.days_until && (
                                    <div style={{ fontSize: '0.7rem', color: '#8b5cf6' }}>
                                        (~{job.days_until} days)
                                    </div>
                                )}
                                {job.estimated_date && (
                                    <div style={{ fontSize: '0.7rem', color: '#059669' }}>
                                        Est: {new Date(job.estimated_date).toLocaleDateString()}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <span className="text-muted">-</span>
                        )}
                    </td>
                    <td>
                        {job.last_execution_date ? (
                            <>
                                Last executed on:<br />
                                {new Date(job.last_execution_date).toLocaleDateString()}
                            </>
                        ) : 'No previous execution'}
                    </td>
                    <td>{getPriorityString()}</td>
                    <td>
                        <div className="action-buttons">
                            <button
                                className="btn-primary"
                                onClick={() => {
                                    // You can add a details view here
                                    toast.info(`JCD Details: ${job.jcd_name}`);
                                }}
                            >
                                Details
                            </button>
                        </div>
                    </td>
                </tr>
            );
        });
    };

    // Function to check job lock status
    const checkJobLockStatus = async (job) => {
        try {
            const API_BASE_URL = import.meta.env.VITE_API_URL;

            const response = await fetch(
                `${API_BASE_URL}checkJobLock/${job.JPHA_ID}/${job.jcd_id}/${user.UHA_ID}`
            );

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();

            if (result.success) {
                setJobLockStatus(prev => ({
                    ...prev,
                    [job.JPHA_ID]: {
                        ...result.data,
                        lockedByUser: employeeList.find(emp => emp.UHA_ID == result.data.lockedBy)?.emp_name || 'Unknown'
                    }
                }));
                return result.data;
            }
        } catch (error) {
            console.error('Error checking job lock status:', error);
            setJobLockStatus(prev => ({
                ...prev,
                [job.JPHA_ID]: {
                    isLocked: false,
                    lockedBy: null,
                    currentUserHasLock: false,
                    lockedAt: null
                }
            }));
        }
    };

    // Function to check if current user is assigned to the job
    const isCurrentUserAssignedToJob = (job) => {
        return job.issued_to === user.UHA_ID || job.secondary_issued_to === user.UHA_ID;
    };

    // Update the active jobs table rendering to include lock and execution status
    const renderActiveJobsActions = (jcd) => {
        const job = jcd.activeJobs;
        const isJobInProgress = jobInProgress === job.JPHA_ID;
        const isAssignedToCurrentUser = isCurrentUserAssignedToJob(job);
        const lockInfo = jobLockStatus[job.JPHA_ID] || {};
        const currentUserHasLock = lockInfo.currentUserHasLock;
        const isJobLocked = lockInfo.isLocked;
        const jobStatus = job.job_status;

        return (
            <div className="action-buttons-container">
                {/* RELEASE LOCK BUTTON - Available whenever user has lock */}
                {isAssignedToCurrentUser && currentUserHasLock && (
                    <button
                        className="btn-warning"
                        onClick={() => handleReleaseJobLock(job)}
                        style={{ fontSize: '0.8rem', padding: '4px 8px', margin: '2px' }}
                    >
                        Release Lock
                    </button>
                )}

                {/* Acknowledge Button - Show for generated/not acknowledged jobs */}
                {(jobStatus === 1 || jobStatus === 2) && isAssignedToCurrentUser && !isJobLocked && (
                    <button
                        className="btn-acknowledge"
                        onClick={() => handleAcknowledgeJob(job)}
                        style={{
                            backgroundColor: '#007bff',
                            color: 'white',
                            borderRadius: '4px',
                            padding: '6px 12px',
                            margin: '2px'
                        }}
                    >
                        Acknowledge
                    </button>
                )}

                {/* Execution Buttons - Only show if user has lock and job is acknowledged */}
                {isAssignedToCurrentUser && jobStatus === 3 && currentUserHasLock && (
                    <>
                        {!isJobInProgress ? (
                            <button
                                className="btn-start"
                                onClick={() => startJobExecution(job)}
                                style={{
                                    backgroundColor: '#28a745',
                                    color: 'white',
                                    borderRadius: '4px',
                                    padding: '6px 12px',
                                    margin: '2px'
                                }}
                            >
                                Start Execution
                            </button>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                <button
                                    className="btn-complete"
                                    onClick={() => completeJobExecution(job)}
                                    style={{
                                        backgroundColor: '#ffc107',
                                        color: 'black',
                                        borderRadius: '4px',
                                        padding: '6px 12px',
                                        margin: '2px'
                                    }}
                                >
                                    Complete Execution
                                </button>
                                <button
                                    className="btn-danger"
                                    onClick={() => cancelJobExecution(job.JPHA_ID)}
                                    style={{ fontSize: '0.8rem', padding: '2px 5px' }}
                                >
                                    Cancel
                                </button>
                            </div>
                        )}
                    </>
                )}

                {/* Message for acknowledged but locked by others */}
                {isAssignedToCurrentUser && jobStatus === 3 && !currentUserHasLock && isJobLocked && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <span className="text-muted" style={{ fontSize: '0.7rem' }}>
                            🔒 Locked by:
                        </span>
                        <span className="text-muted" style={{ fontSize: '0.7rem' }}>
                            {lockInfo.lockedByUser || 'Another user'}
                        </span>
                    </div>
                )}
            </div>
        );
    };

    // Update the job status display in the table to show lock status
    const renderJobStatusWithLock = (job) => {
        const lockInfo = jobLockStatus[job.JPHA_ID] || {};
        const jobStatus = job.job_status;
        const isJobInProgress = jobInProgress === job.JPHA_ID;

        return (
            <span className={`status-badge status-${jobStatus}`}>
                {firedJobStatusMap[jobStatus] || "In Progress"}
                {lockInfo.isLocked && ' 🔒'}
                {isJobInProgress && ' (In Progress)'}
                {jobStatus === 1 && !job.acknowledged_by && (
                    <span style={{ color: 'red', fontSize: '10px', display: 'block' }}>
                        (Awaiting Acknowledgment)
                    </span>
                )}
            </span>
        );
    };

    // Function to check if user can request extension
    const canUserRequestExtension = (job) => {
        const lockInfo = jobLockStatus[job.JPHA_ID] || {};

        // User can only request extension if they have the lock
        return lockInfo.currentUserHasLock === true;
    };

    // Enhanced function to get comprehensive permission status
    // Enhanced function to get comprehensive permission status
    const getUserJobPermissions = (job) => {
        const lockInfo = jobLockStatus[job.activeJobs?.JPHA_ID] || {};
        const isAssigned = isCurrentUserAssignedToJob(job.activeJobs);
        const jobStatus = job.activeJobs?.job_status;

        return {
            canAcknowledge: isAssigned && (jobStatus === 1 || jobStatus === 2) && !lockInfo.isLocked,
            canExecute: isAssigned && jobStatus === 3 && lockInfo.currentUserHasLock,
            canRequestExtension: isAssigned && lockInfo.currentUserHasLock && jobStatus !== 4 && jobStatus !== 5 && jobStatus !== 6,
            hasLock: lockInfo.currentUserHasLock,
            isLocked: lockInfo.isLocked,
            lockedByUser: lockInfo.lockedByUser,
            isAssigned: isAssigned,
            jobStatus: jobStatus
        };
    };

    // Function to acquire lock for extension request
    const acquireLockForExtension = async (job) => {
        try {
            const API_BASE_URL = import.meta.env.VITE_API_URL;

            const response = await fetch(`${API_BASE_URL}acquireJobLockForExtension`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    job_id: job.activeJobs.JPHA_ID,
                    jcd_id: job.activeJobs.jcd_id,
                    ship_id: job.activeJobs.SHA_ID,
                    user_id: user.UHA_ID
                })
            });

            const result = await response.json();

            if (result.success) {
                toast.success('Job lock acquired! You can now request an extension.');
                await checkJobLockStatus(job.activeJobs);
                return true;
            } else {
                throw new Error(result.message || 'Failed to acquire lock');
            }
        } catch (error) {
            console.error('Error acquiring lock:', error);
            toast.error('Error acquiring job lock: ' + error.message);
            return false;
        }
    };

    // Enhanced extension request handler with lock validation
    // Enhanced extension request handler with lock validation and status check
    const handleExtensionRequest = async (jcd) => {
        try {
            const permissions = getUserJobPermissions(jcd);
            const jobStatus = jcd.activeJobs?.job_status;

            // Check if job is under verification (status 4, 5, 6)
            if (jobStatus === 4 || jobStatus === 5 || jobStatus === 6) {
                toast.info('Cannot request extension - job is under verification process');
                return;
            }

            if (!permissions.isAssigned) {
                toast.error('You are not assigned to this job.');
                return;
            }

            console.log('permissions :: ', permissions)

            // Check if current user has the lock
            if (!permissions.hasLock) {
                if (permissions.isLocked) {
                    // Job is locked by someone else - show message instead of allowing extension
                    toast.info(`This job is currently locked by ${permissions.lockedByUser || 'another user'}. Only the person who locked the job can request extensions.`);
                    return;
                } else {
                    // Job is not locked - offer to acquire lock
                    const acquireLock = window.confirm('You need to acquire the job lock to request an extension. Would you like to acquire the lock now?');

                    if (acquireLock) {
                        const success = await acquireLockForExtension(jcd);
                        if (success) {
                            // Now proceed with extension request
                            const criticality = jcd?.relatedJCD?.criticality;
                            const shipName = shipsList.filter(s => s.SHA_ID == jcd?.activeJobs?.SHA_ID)[0]?.ship_name;
                            const username = employeeList.filter(e => e.UHA_ID == user.UHA_ID)[0]?.emp_name;

                            const confirmation = window.confirm(`Hey ${username} This is a ${criticality == 1 ? 'CRITICAL' : 'Non-Critical'} Job on '${shipName}', So Do you really want to request extension, Because They may reject it..`);

                            if (confirmation) {
                                setIsOpenByExtention(true);
                                setSelectedJCDForCommunication(jcd);
                                setIsOpenCommunicationModel(true);
                            }
                        }
                    }
                    return;
                }
            }

            // User has lock - proceed with extension request
            const criticality = jcd?.relatedJCD?.criticality;
            const shipName = shipsList.filter(s => s.SHA_ID == jcd?.activeJobs?.SHA_ID)[0]?.ship_name;
            const username = employeeList.filter(e => e.UHA_ID == user.UHA_ID)[0]?.emp_name;

            const confirmation = window.confirm(`Hey ${username} This is a ${criticality == 1 ? 'CRITICAL' : 'Non-Critical'} Job on '${shipName}', So Do you really want to request extension, Because They may reject it..`);

            if (confirmation) {
                setIsOpenByExtention(true);
                setSelectedJCDForCommunication(jcd);
                setIsOpenCommunicationModel(true);
            }

        } catch (error) {
            console.error('Error checking extension permissions:', error);
            toast.error('Error checking job permissions');
        }
    };

    // ==============================================================================================

    // Media Preview Functions
    const openMediaPreview = (file, fileType, index) => {
        if (!file) return;

        let mediaGroup = [];
        let groupType = '';

        if (fileType === 'preImage') {
            mediaGroup = uploadedFiles.preImage;
            groupType = 'Pre-Execution Images';
        } else if (fileType === 'postImage') {
            mediaGroup = uploadedFiles.postImage;
            groupType = 'Post-Execution Images';
        } else {
            const fileURL = file.previewUrl || URL.createObjectURL(file);
            const fileExtension = file.name?.split('.').pop().toLowerCase();
            let mediaType = 'image';

            if (fileExtension?.includes('video') || file.type?.includes('video')) mediaType = 'video';
            else if (fileExtension?.includes('pdf') || file.type?.includes('pdf')) mediaType = 'pdf';
            else if (fileExtension?.includes('image') || file.type?.includes('image')) mediaType = 'image';

            setPreviewMedia({
                type: mediaType,
                url: fileURL,
                name: file.name || 'Preview File'
            });
            setIsMediaPreviewOpen(true);
            setCurrentMediaIndex(0);
            return;
        }

        const mediaFiles = mediaGroup.map((fileObj, idx) => {
            const fileExtension = fileObj.name?.split('.').pop().toLowerCase();
            let mediaType = 'image';

            if (fileExtension?.includes('video') || fileObj.type?.includes('video')) mediaType = 'video';
            else if (fileExtension?.includes('pdf') || fileObj.type?.includes('pdf')) mediaType = 'pdf';
            else if (fileExtension?.includes('image') || fileObj.type?.includes('image')) mediaType = 'image';

            return {
                type: mediaType,
                url: fileObj.previewUrl || URL.createObjectURL(fileObj.file),
                name: `${groupType} - ${idx + 1}`,
                originalFile: fileObj
            };
        });

        setPreviewMedia({
            type: 'group',
            mediaList: mediaFiles,
            groupName: groupType
        });
        setIsMediaPreviewOpen(true);
        setCurrentMediaIndex(index);
    };

    const closeMediaPreview = () => {
        setIsMediaPreviewOpen(false);
        setPreviewMedia(null);
    };

    const navigateMedia = (direction) => {
        setCurrentMediaIndex(prev => {
            let mediaList = [];

            if (previewMedia?.type === 'group' && previewMedia.mediaList) {
                mediaList = previewMedia.mediaList;
            } else {
                mediaList = mediaFiles;
            }

            const newIndex = direction === 'next'
                ? Math.min(prev + 1, mediaList.length - 1)
                : Math.max(prev - 1, 0);
            resetMediaState();
            return newIndex;
        });
    };

    const resetMediaState = () => {
        setIsZoomed(false);
        setZoomLevel(1);
        setIsLoading(true);
        setMediaError(false);
    };

    const handleZoom = (action) => {
        if (action === 'in') {
            setZoomLevel(prev => Math.min(prev + 0.25, 3));
        } else if (action === 'out') {
            setZoomLevel(prev => Math.max(prev - 0.25, 0.5));
        } else {
            setZoomLevel(1);
            setIsZoomed(false);
        }
    };

    const toggleZoom = () => {
        if (currentMedia.type === 'image') {
            setIsZoomed(!isZoomed);
            setZoomLevel(isZoomed ? 1 : 2);
        }
    };

    const handleDownload = () => {
        let currentMediaToDownload = null;

        if (previewMedia?.type === 'group' && previewMedia.mediaList) {
            currentMediaToDownload = previewMedia.mediaList[currentMediaIndex];
        } else {
            currentMediaToDownload = previewMedia;
        }

        if (currentMediaToDownload?.url) {
            const link = document.createElement('a');
            link.href = currentMediaToDownload.url;
            link.download = currentMediaToDownload.name || 'download';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    const handleMediaLoad = () => {
        setIsLoading(false);
        setMediaError(false);
    };

    const handleMediaError = () => {
        setIsLoading(false);
        setMediaError(true);
    };

    const handleImageDragMove = (e) => {
        if (!isDraggingImage || imageZoom <= 1) return;

        const newX = e.clientX - dragStart.x;
        const newY = e.clientY - dragStart.y;

        const container = document.querySelector('.image-container');
        if (container) {
            const containerRect = container.getBoundingClientRect();
            const maxX = (imageZoom - 1) * containerRect.width / 2;
            const maxY = (imageZoom - 1) * containerRect.height / 2;

            setImagePosition({
                x: Math.max(Math.min(newX, maxX), -maxX),
                y: Math.max(Math.min(newY, maxY), -maxY)
            });
        }
    };

    const handleImageDragEnd = () => {
        setIsDraggingImage(false);
    };

    // Add these useEffect hooks for drag functionality
    useEffect(() => {
        const handleMouseMove = (e) => {
            handleImageDragMove(e);
        };

        const handleMouseUp = () => {
            handleImageDragEnd();
        };

        if (isDraggingImage) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
        }

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDraggingImage, dragStart, imageZoom]);

    useEffect(() => {
        if (imageZoom <= 1) {
            setImagePosition({ x: 0, y: 0 });
        }
    }, [imageZoom]);

    // Video event listeners
    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        const handleTimeUpdate = () => {
            setVideoCurrentTime(video.currentTime);
            setVideoProgress((video.currentTime / video.duration) * 100);
        };

        const handleLoadedMetadata = () => {
            setVideoDuration(video.duration);
        };

        const handleEnded = () => {
            setIsVideoPlaying(false);
        };

        video.addEventListener('timeupdate', handleTimeUpdate);
        video.addEventListener('loadedmetadata', handleLoadedMetadata);
        video.addEventListener('ended', handleEnded);

        return () => {
            video.removeEventListener('timeupdate', handleTimeUpdate);
            video.removeEventListener('loadedmetadata', handleLoadedMetadata);
            video.removeEventListener('ended', handleEnded);
        };
    }, [currentMediaIndex]);

    // Add this media files array
    const mediaFiles = useMemo(() => [
        uploadedFiles.preImage ?
            { type: 'image', url: uploadedFiles.preImage.previewUrl, name: 'Pre-Execution Image' } : null,
        uploadedFiles.postImage ?
            { type: 'image', url: uploadedFiles.postImage.previewUrl, name: 'Post-Execution Image' } : null,
        uploadedFiles.video ?
            { type: 'video', url: uploadedFiles.video.previewUrl, name: 'Execution Video' } : null,
        uploadedFiles.document ?
            { type: 'pdf', url: uploadedFiles.document.previewUrl, name: 'PDF Document' } : null
    ].filter(Boolean), [uploadedFiles]);

    const currentMedia = mediaFiles[currentMediaIndex] || null;

    // In the "Confirm & Save" button onClick handler:
    const handleConfirmAndSave = async () => {
        const ship_appliedFromCombination = checkedShipsForNewJcdLinking.map((ship) => ({
            ship_id: ship.SHA_ID,
            applied_from: document.querySelector(`.applied-from-date[data-ship-id="${ship.SHA_ID}"]`)?.value || null,
        }));

        const payload = {
            updatedDataNewJcd: updatedDataForNewJcd,
            ship_appliedFromCombination: ship_appliedFromCombination,
        };

        try {
            const response = await axios.post(`${apiUrl}addJcdWithShip_AppliedFrom`, payload);

            if (response.status === 201) {
                toast.success('JCD created and linked successfully! 🎉');

                // Reset form and states
                resetForm();
                setChecklistItems(['']);
                setIsChecklistEnabled(false);
                setIsSparesEnabled(false);
                setLinkJCDToShipAtConfigTime(false);
                setCheckedShipsForNewJcdLinking([]);

                // Refresh all data
                await refreshAllData();
                clearSelection();
                setActiveTab('view_jcd');
            }
        } catch (err) {
            console.error('Error in addJcdWithShip_AppliedFrom:', err);
            if (err.response?.data?.error) {
                toast.error(`Failed to create JCD: ${err.response.data.error}`);
            } else {
                toast.error('Failed to create JCD. Please try again.');
            }
        }
    };

    // In the "Submit All" button onClick handler:
    const handleSubmitAllShips = async () => {
        const allConfirmed = checkedShipsToAllocatedSelectedJCD.every(
            (ship) => confirmedShips[ship.SHA_ID]
        );

        if (!allConfirmed) {
            toast.warning('Please confirm for all ships before submission.');
            return;
        }

        const ship_appliedFromCombination = checkedShipsToAllocatedSelectedJCD.map((ship) => ({
            ship_id: ship.SHA_ID,
            applied_from: appliedFromDates[ship.SHA_ID] || null,
        }));

        const completeJCDData = JCD_schedule_List.find(
            jcd => jcd.jcd_id === selectedJCDForViewShips.jcd_id && jcd.line_no === 0
        );

        if (!completeJCDData) {
            toast.error('Could not find complete JCD data');
            return;
        }

        const payload = {
            updatedDataNewJcd: {
                ...completeJCDData,
                jcd_id: selectedJCDForViewShips.jcd_id,
                jcd_name: selectedJCDForViewShips.jcd_name,
                operational_interval: completeJCDData.operational_interval,
                km_interval: completeJCDData.km_interval,
                periodic_interval: completeJCDData.periodic_interval,
                inserted_by: user.UHA_ID,
                inserted_on: new Date().toISOString().split('T')[0]
            },
            ship_appliedFromCombination: ship_appliedFromCombination,
        };

        try {
            const response = await axios.post(`${apiUrl}linkExistingJCDWithShips`, payload);

            // Handle backend response with proper toast messages
            console.log('response ::: ', response)
            if (response.data.result.success || response.data.result.totalShipsLinked > 0) {
                const successMessage = response.data.result.totalShipsLinked > 0
                    ? `JCD successfully linked to ${response.data.result.totalShipsLinked} ship(s)!`
                    : 'JCD linking completed with warnings.';

                toast.success(successMessage);

                if (response.data.duplicatesSkipped > 0) {
                    toast.info(`${response.data.result.duplicatesSkipped} ships were already linked`);
                }

                if (response.data.errors && response.data.errors.length > 0) {
                    toast.warning(`Some ships had issues: ${response.data.errors.map(e => e.error).join('; ')}`);
                }

                // Refresh data
                await refreshJCDSchedules();
                await RefreshJCD_ship_wise_group_combinations();
                await refreshTree();
                await refreshPlannedJobs();

                // Reset states
                setIsShowCheckedShipsDetailsToAllocatedSelectedJCD(false);
                setCheckedShipsToAllocatedSelectedJCD([]);
                setConfirmedShips({});
                setAppliedFromDates({});

                // Close the main popup
                setIsWantToViewShipsLinkedOnSelectedJCD(false);
                setSelectedJCDForViewShips(null);
            } else {
                // If no ships were linked at all
                toast.error(response.data.message || 'Failed to link JCD to any ships');
            }

        } catch (err) {
            console.error('Error linking JCD:', err);

            // Improved error handling
            if (err.response?.data?.error) {
                if (err.response.data.error.includes('Raw JCD')) {
                    toast.error(`JCD not found: ${err.response.data.error}`);
                } else if (err.response.data.error.includes('Duplicate')) {
                    toast.error(`Duplicate found: ${err.response.data.error}`);
                } else {
                    toast.error(`Failed to link JCD: ${err.response.data.error}`);
                }
            } else if (err.response?.data?.errors) {
                // Handle multiple errors
                const errorMessages = err.response.data.errors.map(e => e.error).join('; ');
                toast.error(`Partial failure: ${errorMessages}`);
            } else if (err.message) {
                toast.error(err.message);
            } else {
                toast.error('Failed to link JCD to ships. Please try again.');
            }
        }
    };

    return (
        <div id="JCD_Page_main_root_container">
            {/* Left Side: Component Tree */}
            <div id="JCD_Page_main_root_container_left_side_container">
                <p id="note_about_component_heirarchy">
                    Change in background color indicates component selection
                </p>
                <Temp_component_heirarchy />
            </div>

            {/* Right Side: Tabs & Forms */}
            <div id="JCD_Page_main_root_container_right_side_container">
                {/* Tabs */}
                <div id="JCD_Page_main_root_container_right_side_container_top_section">
                    {[
                        { key: 'new_jcd', label: 'New JCD' },
                        { key: 'view_jcd', label: 'View JCDs' },
                        { key: 'active_jobs', label: 'Active Jobs' },
                        { key: 'completed_jobs', label: 'Completed Jobs' },
                        { key: 'upcoming_jobs', label: 'Upcoming Jobs' }
                    ].map(({ key, label }, index) => {
                        const profile = profiles?.find(p => user?.profile_ids?.includes(p.PROFILE_ID));
                        return profile?.process_ids.includes(`P_JCD_000${index + 1}`) ? (
                            <button
                                key={key}
                                className="JCD_Page_main_root_container_right_side_container_top_section_btns"
                                onClick={() => setActiveTab(key)}
                                style={{
                                    backgroundColor: activeTab === key ? 'royalblue' : 'white',
                                    color: activeTab === key ? 'white' : 'black',
                                }}
                            >
                                {label}
                            </button>
                        ) : null;
                    })}

                </div>

                {/* Tab Content */}
                <div id="JCD_Page_main_root_container_right_side_container_bottom_section">

                    {/* new jcd form */}
                    {/* {activeTab === 'new_jcd' && ( */}
                    {activeTab === 'new_jcd' && (
                        selectedNode ? (
                            <div className="active_tab_main_container">
                                <h1>New JCD Form</h1>
                                <div id="JCD_configuration_form_container_in_jcd_page">

                                    {/* New JCD Form */}
                                    {profiles?.filter(p => user?.profile_ids?.includes(p.PROFILE_ID))[0]?.form_ids.includes("F_JCD_001") && (
                                        <form onSubmit={handleSubmit} className="jcd-form">
                                            {/* Selected Component */}
                                            {/* Selected Component */}
                                            <div className="form-group">
                                                <label>Selected Component:</label>
                                                <div className="selected-component">
                                                    <i style={{ color: '#94a3b8' }}>{selectedNode.data.label}</i>
                                                </div>
                                            </div>

                                            {/* JCD Name Field */}
                                            <div className="form-group">
                                                <label>JCD Name <span style={{ color: 'red' }}>*</span></label>
                                                <input
                                                    type="text"
                                                    name="jcd_name"
                                                    value={JCD_form_data.jcd_name || ''}
                                                    onChange={handleChange}
                                                    placeholder="Enter JCD Name"
                                                    disabled={isReadOnly}
                                                    required
                                                />
                                            </div>

                                            {/* Job Type */}
                                            <div className="form-group">
                                                <label>Choose Universaly Active Job Type <span style={{ color: 'red' }}>*</span></label>
                                                <select
                                                    name="JTH_ID"
                                                    value={JCD_form_data.JTH_ID}
                                                    onChange={handleChange}
                                                    required
                                                    disabled={isReadOnly}
                                                    className="form-control"
                                                >
                                                    <option value="">Select Job Type</option>
                                                    {jobTypesList.filter(type => type.JTH_status != 0).map((type) => (
                                                        <option key={type.JTH_ID} value={type.JTH_ID}>
                                                            {type.JTH_job_type}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>

                                            {/* Criticality */}
                                            <div className="form-group">
                                                <label>Criticality <span style={{ color: 'red' }}>*</span></label>
                                                <div className="radio-group">
                                                    {['Critical', 'Non-critical'].map((level, index) => (
                                                        <label key={level}>
                                                            <input
                                                                type="radio"
                                                                name="criticality"
                                                                value={index + 1}
                                                                checked={JCD_form_data.criticality == index + 1}
                                                                onChange={handleChange}
                                                                disabled={isReadOnly}
                                                                required
                                                            />
                                                            {level}
                                                            {level == 'Non-critical' && (
                                                                <small style={{ color: 'crimson', marginLeft: '8px' }}>
                                                                    (Max Allowed Extensions - 3)
                                                                </small>
                                                            )}
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Job Generation Type */}
                                            <div className="form-group">
                                                <label>
                                                    Job Will Generate On Which Thresholds <span style={{ color: 'red' }}>*</span>
                                                </label>
                                                <div className="checkbox-group">
                                                    {[
                                                        { value: '1', label: 'Operational Time' },
                                                        { value: '2', label: 'KM' },
                                                        { value: '3', label: 'Periodic Days' }
                                                    ].map(({ value, label }) => (
                                                        <div key={value} className="checkbox-with-fields">
                                                            <label>
                                                                <input
                                                                    type="checkbox"
                                                                    value={value}
                                                                    checked={JCD_form_data.job_generation_type.includes(value)}
                                                                    onChange={handleChange}
                                                                    name="job_generation_type"
                                                                    disabled={isReadOnly}
                                                                />
                                                                {label}
                                                            </label>

                                                            {/* Conditional fields per checkbox */}
                                                            {value === '1' && JCD_form_data.job_generation_type.includes('1') && (
                                                                <>
                                                                    <div className="form-group">
                                                                        <label>Operational Interval</label>
                                                                        <input
                                                                            type="number"
                                                                            name="operational_interval"
                                                                            value={JCD_form_data.operational_interval}
                                                                            onChange={handleChange}
                                                                            className="form-control"
                                                                            disabled={isReadOnly}
                                                                        />
                                                                    </div>
                                                                    <div className="form-group">
                                                                        <label>Time Scale</label>
                                                                        <select
                                                                            name="time_scale"
                                                                            value={JCD_form_data.time_scale}
                                                                            onChange={handleChange}
                                                                            className="form-control"
                                                                            disabled={isReadOnly}
                                                                        >
                                                                            <option value="">Select Scale</option>
                                                                            <option value="1">Hours</option>
                                                                            <option value="2">Days</option>
                                                                            <option value="3">Weeks</option>
                                                                        </select>
                                                                    </div>
                                                                </>
                                                            )}

                                                            {value === '2' && JCD_form_data.job_generation_type.includes('2') && (
                                                                <div className="form-group">
                                                                    <label>KM Interval</label>
                                                                    <input
                                                                        type="number"
                                                                        name="km_interval"
                                                                        value={JCD_form_data.km_interval}
                                                                        onChange={handleChange}
                                                                        className="form-control"
                                                                        disabled={isReadOnly}
                                                                    />
                                                                </div>
                                                            )}

                                                            {value === '3' && JCD_form_data.job_generation_type.includes('3') && (
                                                                <div className="form-group">
                                                                    <label>Periodic Interval (Days)</label>
                                                                    <input
                                                                        type="number"
                                                                        name="periodic_interval"
                                                                        value={JCD_form_data.periodic_interval}
                                                                        onChange={handleChange}
                                                                        className="form-control"
                                                                        disabled={isReadOnly}
                                                                    />
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>


                                            {/* Category */}
                                            <div className="form-group">
                                                <label>Servicable Or Replaceable Or Both <span style={{
                                                    color: 'red'
                                                }}>*</span></label>
                                                <select
                                                    name="jcd_category"
                                                    value={JCD_form_data.jcd_category}
                                                    onChange={handleChange}
                                                    required
                                                    disabled={isReadOnly}
                                                    className="form-control"
                                                >
                                                    <option value="">Select</option>
                                                    <option value="1">Servicable</option>
                                                    <option value="2">Replaceable</option>
                                                    <option value="3" selected>Both (Servicable AND Replaceable)</option>
                                                </select>
                                            </div>

                                            {/* Instruction Manual */}
                                            <div className="form-group">
                                                <label>Instruction Manual For Execution Of This Job</label>
                                                <div className="file-input-container">
                                                    <input
                                                        type="file"
                                                        name="jcd_instruction_manual"
                                                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                                        onChange={handleFileChange}
                                                        disabled={isReadOnly}
                                                        style={{ display: 'none' }}
                                                        id="instruction-manual-input"
                                                    />
                                                    <label
                                                        htmlFor="instruction-manual-input"
                                                        className="file-input-label"
                                                        style={{
                                                            display: 'inline-block',
                                                            padding: '10px 15px',
                                                            backgroundColor: '#007bff',
                                                            color: 'white',
                                                            borderRadius: '4px',
                                                            cursor: isReadOnly ? 'not-allowed' : 'pointer',
                                                            opacity: isReadOnly ? 0.6 : 1
                                                        }}
                                                    >
                                                        Choose file
                                                    </label>
                                                </div>

                                                {/* Show filename if selected */}
                                                {JCD_form_data.jcd_instruction_manual && (
                                                    <div className="file-name" style={{ marginTop: '8px', fontSize: '14px', color: '#666' }}>
                                                        📎 {JCD_form_data.jcd_instruction_manual.name}
                                                        {!isReadOnly && (
                                                            <button
                                                                type="button"
                                                                onClick={() => setFormData(prev => ({ ...prev, jcd_instruction_manual: null }))}
                                                                style={{
                                                                    marginLeft: '10px',
                                                                    color: 'red',
                                                                    background: 'none',
                                                                    border: 'none',
                                                                    cursor: 'pointer'
                                                                }}
                                                            >
                                                                ✕
                                                            </button>
                                                        )}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Checklist */}
                                            <div className="form-group checkbox-group" >
                                                <label style={{
                                                    display: 'flex',
                                                    justifyContent: 'flex-start',
                                                    alignItems: 'center'
                                                }}>
                                                    <input
                                                        type="checkbox"
                                                        checked={isChecklistEnabled}
                                                        onChange={(e) => {
                                                            setIsChecklistEnabled(e.target.checked)
                                                            setChecklistItems([])
                                                        }}
                                                        disabled={isReadOnly}
                                                        style={{
                                                            width: '18px',
                                                            height: '18px',

                                                            margin: '5px'
                                                        }}
                                                    />
                                                    Want To Add checklist to ensure quality work?
                                                </label>
                                            </div>

                                            {isChecklistEnabled && (
                                                <>
                                                    <div className="form-group">
                                                        <label>
                                                            Checklist Items <span style={{ color: 'red' }}>*</span>
                                                        </label>
                                                        <div className="checklist-container">
                                                            {(checklistItems.length > 0 ? checklistItems : ['']).map((item, idx) => (
                                                                <div key={idx} className="checklist-item">
                                                                    <input
                                                                        type="text"
                                                                        value={item}
                                                                        onChange={(e) => handleChecklistChange(idx, e.target.value)}
                                                                        placeholder={`Checklist ${idx + 1}`}
                                                                        className="form-control"
                                                                        disabled={isReadOnly}
                                                                        required={isChecklistEnabled}
                                                                    />
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => removeChecklistItem(idx)}
                                                                        disabled={isReadOnly}
                                                                    >
                                                                        Remove
                                                                    </button>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={addChecklistItem}
                                                        className="add-button"
                                                        disabled={isReadOnly}
                                                    >
                                                        + Add Checklist Item
                                                    </button>
                                                </>
                                            )}

                                            {/* Job Will Generate On */}
                                            <div className="form-group">
                                                <label>Check Ship Status for Job Generation <span style={{ color: 'red' }}>*</span></label>
                                                <div className="checkbox-group">
                                                    {[
                                                        { value: '1', label: 'Sealing' },
                                                        { value: '2', label: 'On Dock' },
                                                        // { value: '3', label: 'Inactive' },
                                                        { value: '4', label: 'Under Repair' },
                                                    ].map(({ value, label }) => (
                                                        <label key={value}>
                                                            <input
                                                                type="checkbox"
                                                                value={value}
                                                                checked={JCD_form_data.job_will_generate_on?.includes(value)}
                                                                onChange={handleChange}
                                                                name="job_will_generate_on"
                                                                disabled={isReadOnly}
                                                            />
                                                            {label}
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Designation Dropdowns */}
                                            {[
                                                { key: 'executed_by', label: 'Select Primary Responsible Designation To Do This Job' },
                                                { key: 'secondary_desg', label: 'Select Secondary Responsible Designation To Do This Job' },
                                                { key: 'first_verified_by', label: 'This Job Will Primary Verified By Which Designation' },
                                                { key: 'second_verified_by', label: 'This Job Will Secondary Verified By Which Designation' },
                                                { key: 'extension_authority', label: 'Which Designation will going to Approve Extension Request' }
                                            ].map(({ key, label }) => {

                                                // Filter logic for each field
                                                let filteredList = designationList;

                                                if (key === 'executed_by') {
                                                    filteredList = designationList.filter(d => d.DEPT_ID !== 'DEPT_003');
                                                }

                                                if (key === 'secondary_desg') {
                                                    filteredList = designationList.filter(
                                                        d => d.DEPT_ID !== 'DEPT_003' && d.DSGH_ID !== JCD_form_data.executed_by
                                                    );
                                                }

                                                if (key === 'first_verified_by') {
                                                    filteredList = designationList.filter(
                                                        d =>
                                                            d.DEPT_ID !== 'DEPT_003' &&
                                                            d.DSGH_ID !== JCD_form_data.executed_by &&
                                                            d.DSGH_ID !== JCD_form_data.secondary_desg
                                                    );
                                                }

                                                if (key === 'second_verified_by') {
                                                    filteredList = designationList.filter(
                                                        d =>
                                                            d.DSGH_ID !== JCD_form_data.executed_by &&
                                                            d.DSGH_ID !== JCD_form_data.secondary_desg &&
                                                            d.DSGH_ID !== JCD_form_data.first_verified_by
                                                    );
                                                }

                                                if (key === 'extension_authority') {
                                                    filteredList = designationList.filter(
                                                        d =>
                                                            d.DSGH_ID !== JCD_form_data.executed_by &&
                                                            d.DSGH_ID !== JCD_form_data.secondary_desg
                                                    );
                                                }

                                                return (
                                                    <div key={key} className="form-group">
                                                        <label>
                                                            {label} <span style={{ color: 'red' }}>*</span>
                                                        </label>

                                                        <select
                                                            name={key}
                                                            value={JCD_form_data[key] || ''}
                                                            onChange={handleChange}
                                                            disabled={isReadOnly}
                                                            className="form-control"
                                                            required
                                                        >
                                                            <option value="">Select</option>

                                                            {filteredList.map(d => (
                                                                <option key={d.DSGH_ID} value={d.DSGH_ID}>
                                                                    {d.desg_name}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                );
                                            })}


                                            {/* Pre-Execution Image Required */}
                                            <div className="form-group">
                                                <label>Pre Job Execution Image Required ? <span style={{ color: 'red' }}>*</span></label>
                                                {[1, 0].map((val) => (
                                                    <label key={val}>
                                                        <input
                                                            type="radio"
                                                            name="pre_execution_image_required"
                                                            value={val}
                                                            checked={JCD_form_data.pre_execution_image_required == val}
                                                            onChange={handleChange}
                                                            disabled={isReadOnly}
                                                        />
                                                        {val ? 'Yes' : 'No'}
                                                    </label>
                                                ))}
                                            </div>

                                            {/* Post-Execution Image Required */}
                                            <div className="form-group">
                                                <label>Post Job Execution Image Required ? <span style={{ color: 'red' }}>*</span></label>
                                                {[1, 0].map((val) => (
                                                    <label key={val}>
                                                        <input
                                                            type="radio"
                                                            name="post_execution_image_required"
                                                            value={val}
                                                            checked={JCD_form_data.post_execution_image_required == val}
                                                            onChange={handleChange}
                                                            disabled={isReadOnly}
                                                        />
                                                        {val ? 'Yes' : 'No'}
                                                    </label>
                                                ))}
                                            </div>

                                            {/* Consumable Spares */}
                                            {JCD_form_data.jcd_category === '2' && (
                                                <>
                                                    <div className="form-group">
                                                        <label>
                                                            <input
                                                                type="checkbox"
                                                                checked={isSparesEnabled}
                                                                onChange={(e) => setIsSparesEnabled(e.target.checked)}
                                                                disabled={isReadOnly}
                                                            />
                                                            Need consumable spares?
                                                        </label>
                                                    </div>

                                                    {isSparesEnabled && (
                                                        <div className="form-group">
                                                            <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>
                                                                Consumable Spares <span style={{
                                                                    color: 'red'
                                                                }}>*</span>
                                                            </label>
                                                            <div className="checklist-container">
                                                                {consumableSpares.map((_, idx) => {
                                                                    const fieldName = `consumable_spare${idx + 1}`;
                                                                    return (
                                                                        <div key={fieldName} className="checklist-item">
                                                                            <input
                                                                                type="text"
                                                                                placeholder={`Spare ${idx + 1}`}
                                                                                value={JCD_form_data[fieldName]}
                                                                                onChange={(e) => setFormData(prev => ({
                                                                                    ...prev,
                                                                                    [fieldName]: e.target.value
                                                                                }))}
                                                                                disabled={isReadOnly}
                                                                                className="form-control"
                                                                                required={isSparesEnabled == true ? true : false}
                                                                            />
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => removeSpare(idx)}
                                                                                disabled={isReadOnly}
                                                                            >
                                                                                Remove
                                                                            </button>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                            {consumableSpares.length < 10 && (
                                                                <button
                                                                    type="button"
                                                                    onClick={addSpare}
                                                                    className="add-button"
                                                                    disabled={isReadOnly}
                                                                >
                                                                    + Add More
                                                                </button>
                                                            )}
                                                        </div>
                                                    )}
                                                </>
                                            )}

                                            {/* PDF File Required */}
                                            {/* <div className="form-group">
                                                <label>PDF Document Required ? <span style={{ color: 'red' }}>*</span></label>
                                                {[1, 0].map((val) => (
                                                    <label key={val}>
                                                        <input
                                                            type="radio"
                                                            name="pdf_file_for_execution_required"
                                                            value={val}
                                                            checked={JCD_form_data.pdf_file_for_execution_required == val}
                                                            onChange={handleChange}
                                                            disabled={isReadOnly}
                                                        />
                                                        {val ? 'Yes' : 'No'}
                                                    </label>
                                                ))}
                                            </div> */}

                                            {/* Video Required */}
                                            <div className="form-group">
                                                <label>Execution Video Required ? <span style={{ color: 'red' }}>*</span></label>
                                                {[1, 0].map((val) => (
                                                    <label key={val}>
                                                        <input
                                                            type="radio"
                                                            name="video_of_execution_required"
                                                            value={val}
                                                            checked={JCD_form_data.video_of_execution_required == val}
                                                            onChange={handleChange}
                                                            disabled={isReadOnly}
                                                        />
                                                        {val ? 'Yes' : 'No'}
                                                    </label>
                                                ))}
                                            </div>

                                            {/* Action Buttons */}
                                            <div className="form-actions">
                                                {profiles?.filter(p => user?.profile_ids?.includes(p.PROFILE_ID))[0]?.process_ids.includes("P_JCD_0008") && (
                                                    <button type="submit" disabled={isSaveJCDActive}>
                                                        {isReadOnly ? 'View Only' : 'Create'}
                                                    </button>
                                                )}

                                                {profiles?.filter(p => user?.profile_ids?.includes(p.PROFILE_ID))[0]?.process_ids.includes("P_JCD_0009") && (
                                                    <button type="submit" disabled={isUpdateJCDActive}>
                                                        {isReadOnly ? 'View Only' : 'Update'}
                                                    </button>
                                                )}

                                                {profiles?.filter(p => user?.profile_ids?.includes(p.PROFILE_ID))[0]?.process_ids.includes("P_JCD_0010") && (
                                                    <button type="button" onClick={resetForm} disabled={isReadOnly}>
                                                        Reset
                                                    </button>
                                                )}
                                            </div>

                                        </form>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <p>No Component Selected Yet !!</p>
                        )
                    )}

                    {/* view JCDs on Components */}
                    {activeTab == 'view_jcd' && (
                        selectedNode ? (
                            <div className='active_tab_main_container'>
                                <h1>{activeTab.replace('_', ' ').toUpperCase()}</h1>
                                <p style={{ color: 'grey', fontStyle: 'italic', fontFamily: 'cursive' }}>Selected Component - <h2 style={{ color: 'grey', fontStyle: 'italic', display: 'inline-block', fontFamily: 'cursive' }}>{selectedNode.data.label}</h2></p>

                                <div id='view_jcd_on_component_main_table_container'>
                                    <table>
                                        <thead>
                                            <tr>
                                                <th>Sr.</th>
                                                <th>JCD NAME</th>
                                                <th>GEN. RULE</th>
                                                {user.emp_type == 2 && (
                                                    <>
                                                        <th>OPERATIONS</th>
                                                        <th>No Of Ships Attached</th>
                                                    </>
                                                )}
                                            </tr>
                                        </thead>

                                        <tbody>
                                            {selectedNode ? (
                                                <>
                                                    {selectedNode.data.jcdCount?.length > 0 && (
                                                        <>
                                                            {selectedNode.data.jcdCount.filter(jcd => jcd.SHA_ID == null).map((jcd, index) => {
                                                                return (
                                                                    <tr>
                                                                        <td>{index + 1}</td>
                                                                        <td>{jcd.jcd_name}</td>
                                                                        <td>KM={jcd.km_interval || '--'}, HR={jcd.operational_interval || '--'}, IDEAL={jcd.periodic_interval || '--'}</td>
                                                                        <td className='btn-container'>

                                                                            {profiles?.filter(p => user?.profile_ids?.includes(p.PROFILE_ID))[0]?.process_ids.includes("P_JCD_0011") && (
                                                                                <button className='btn-edit' onClick={() => {
                                                                                    handleJcdEdit(jcd)
                                                                                }}>Edit</button>
                                                                            )}

                                                                            {profiles?.filter(p => user?.profile_ids?.includes(p.PROFILE_ID))[0]?.process_ids.includes("P_JCD_0012") && (

                                                                                <button
                                                                                    className='btn-suspend'
                                                                                    onClick={() => {
                                                                                        setIsWantToSuspendJCDFromShips(true);
                                                                                        setSelectedJCDForViewShips(jcd)
                                                                                        setCheckedShipsToSuspend([]);
                                                                                    }}
                                                                                >
                                                                                    Suspend
                                                                                </button>
                                                                            )}
                                                                        </td>
                                                                        {user.emp_type == 2 && (
                                                                            <td id='affected_ships_count_by_jcd_td' style={{
                                                                                cursor: 'pointer',
                                                                                fontWeight: '800'
                                                                            }} onClick={async () => {
                                                                                // toast('clicked')
                                                                                console.log('selectedJCDForViewShips : ', jcd)
                                                                                setSelectedJCDForViewShips(jcd)
                                                                                setIsWantToViewShipsLinkedOnSelectedJCD(true)
                                                                            }}>

                                                                                {/* <> */}
                                                                                {
                                                                                    JCD_schedule_List.filter(jsl => {
                                                                                        if (jsl.jcd_id == jcd.jcd_id && jsl.SHA_ID != null && jsl.status == 1) {
                                                                                            return jsl
                                                                                        }
                                                                                    }).length
                                                                                }
                                                                                {/* </> */}
                                                                            </td>
                                                                        )}
                                                                    </tr>
                                                                )
                                                            })}
                                                        </>
                                                    )}
                                                </>
                                            ) : <p>NO JCDs Configure for Component</p>}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        ) : <p>No Component Selected Yet !!</p>
                    )}

                    {/* active Jobs On Components */}
                    {activeTab === "active_jobs" && (
                        <>
                            {selectedNode ? (
                                <div className="active_tab_main_container">
                                    <h1>{activeTab.replace("_", " ").toUpperCase()}</h1>
                                    <p style={{ color: "grey", fontStyle: "italic", fontFamily: "cursive" }}>
                                        Selected Component -{" "}
                                        <h2 style={{
                                            color: "grey",
                                            fontStyle: "italic",
                                            display: "inline-block",
                                            fontFamily: "cursive"
                                        }}>
                                            {selectedNode.data.label}
                                        </h2>
                                    </p>

                                    {/* Ship Filter Dropdown */}
                                    {/* Ship Filter Dropdown */}
                                    {user.emp_type == 2 && (
                                        <div id="select-ship-active-jobs-tab">

                                            {/* ======================= SHIP SELECT DROPDOWN ======================= */}
                                            <select
                                                style={{
                                                    backgroundColor: "white",
                                                    border: "1px solid black",
                                                    borderRadius: "10px",
                                                    color: "gray",
                                                    width: "fit-content",
                                                    marginTop: "20px"
                                                }}
                                                value={selectedShipFilterForActiveJobTab}
                                                onChange={(e) => setSelectedShipFilterForActiveJobTab(e.target.value)}
                                            >
                                                <option value="">All Ships</option>

                                                {officeStaffList
                                                    .filter(staff => staff.user_id === user.UHA_ID)
                                                    .flatMap(staff =>
                                                        shipsList.filter(ship => staff.allocated_ships.includes(ship.SHA_ID))
                                                    )
                                                    .map((ship) => (
                                                        <option key={ship.SHA_ID} value={ship.SHA_ID}>
                                                            {ship.ship_name}
                                                        </option>
                                                    ))
                                                }
                                            </select>

                                            {/* ======================= IMPORT EXCEL BUTTON ======================= */}
                                            {selectedShipFilterForActiveJobTab && (
                                                <button
                                                    onClick={handleImportExcel}
                                                    style={{
                                                        backgroundColor: '#10b981',
                                                        color: 'white',
                                                        border: 'none',
                                                        borderRadius: '8px',
                                                        padding: '8px 16px',
                                                        cursor: 'pointer',
                                                        fontSize: '14px',
                                                        fontWeight: '500',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '8px',
                                                        transition: 'all 0.3s ease'
                                                    }}
                                                    onMouseEnter={(e) => e.target.style.backgroundColor = '#059669'}
                                                    onMouseLeave={(e) => e.target.style.backgroundColor = '#10b981'}
                                                >
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                                        <polyline points="7 10 12 15 17 10" />
                                                        <line x1="12" y1="15" x2="12" y2="3" />
                                                    </svg>
                                                    Import Excel
                                                </button>
                                            )}

                                        </div>
                                    )}


                                    {/* Table Container */}
                                    <div id="view_jcd_on_component_main_table_container">
                                        <table>
                                            <thead>
                                                <tr>
                                                    <th ></th>
                                                    <th >
                                                        {profiles?.filter(p => user?.profile_ids?.includes(p.PROFILE_ID))[0]?.process_ids.includes("P_JCD_0016") && (
                                                            <>Raise Ext.</>
                                                        )}
                                                    </th>
                                                    <th >Sr.</th>
                                                    <th >Ship Name</th>
                                                    <th >Active Job NAME</th>
                                                    <th >Job Category</th>
                                                    <th >Assign TO</th>
                                                    <th >Criticality</th>
                                                    <th >Triggered By (GEN. RULE)</th>
                                                    <th >1St Verification Authority</th>
                                                    <th >2nd Verification Authority</th>
                                                    <th >Current Job Status</th>
                                                    <th >Completed Till</th>
                                                    <th >Old Assigned To</th>
                                                    <th >Primary Assign Desgnation</th>
                                                    <th >Secondary Assign Desgnation</th>
                                                    <th >OVERDUE STATUS</th>
                                                    <th >Generated On</th>
                                                    <th >Extention Authority</th>
                                                    <th >Extention Authority Designation</th>
                                                    <th >Current Extention Count</th>
                                                    <th>Actions</th>
                                                </tr>
                                            </thead>

                                            <tbody>
                                                {Array.isArray(selectedNode.data.activeJobCount) &&
                                                    selectedNode.data.activeJobCount.length > 0 ? (
                                                    selectedNode.data.activeJobCount
                                                        .filter((jcd) => {
                                                            // If no ship selected, show all
                                                            if (!selectedShipFilterForActiveJobTab) return true;
                                                            // Match SHA_ID (handle string/number)
                                                            return jcd.activeJobs.SHA_ID == selectedShipFilterForActiveJobTab;
                                                        })
                                                        .map((jcd, index) => {
                                                            // Safely find related data
                                                            console.log('employeeList ::: ', employeeList)
                                                            const ship = shipsList?.find(s => s.SHA_ID === jcd.activeJobs.SHA_ID);
                                                            const issuedTo = employeeList?.find(e => e.UHA_ID === jcd.activeJobs.issued_to);
                                                            console.log('issuedTo ::: , ', issuedTo)
                                                            const firstVerif = employeeList?.find(e => e.UHA_ID === jcd.activeJobs.first_verification_by);
                                                            const secondVerif = employeeList?.find(e => e.UHA_ID === jcd.activeJobs.second_verification_by);

                                                            const job_status = plannedJobList.filter(pl => pl.JPTA_ID == jcd.activeJobs.JPTA_ID)[0]?.job_status
                                                            console.log('job_status ::: ', job_status)

                                                            // Determine if "Raise Extension" should be disabled
                                                            const extIds = [jcd.activeJobs.ext1, jcd.activeJobs.ext2, jcd.activeJobs.ext3].filter(Boolean);

                                                            // Check if any active extension exists (pending)
                                                            const hasActiveExtension = extIds.some(extId => {
                                                                const extRecord = extendedJobsList.find(e => e.JEDA_ID === extId); // assume extensionList fetched from backend
                                                                return extRecord?.ext_request_status === 1;
                                                            });

                                                            // Check if max attempts reached
                                                            const maxAttempts = 3;
                                                            const attemptsReached = extIds.length >= maxAttempts;

                                                            const disableRaiseExtension = hasActiveExtension || attemptsReached;


                                                            return (
                                                                <tr key={jcd.activeJobs.job_id || index}>

                                                                    <td>
                                                                        {profiles?.filter(p => user?.profile_ids?.includes(p.PROFILE_ID))[0]?.process_ids.includes("P_JCD_0015") && (
                                                                            <button
                                                                                type="button"
                                                                                aria-label="Contact"
                                                                                title="Contact"
                                                                                onClick={() => {
                                                                                    // open CommunicationModel : Communication_Comp.jsx (parmas jcd)
                                                                                    setIsOpenByExtention(false)
                                                                                    setSelectedJCDForCommunication(jcd)
                                                                                    setIsOpenCommunicationModel(true)
                                                                                }}
                                                                                style={{
                                                                                    display: "inline-flex",
                                                                                    alignItems: "center",
                                                                                    justifyContent: "center",
                                                                                    width: "40px",
                                                                                    height: "40px",
                                                                                    borderRadius: "50%",
                                                                                    border: "none",
                                                                                    cursor: "pointer",
                                                                                    background: "linear-gradient(135deg,#2563eb,#22c55e)",
                                                                                    color: "#fff",
                                                                                    outline: "none"
                                                                                }}
                                                                            >
                                                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                                                                    <path
                                                                                        d="M20 14.5c0 1.657-1.79 3-4 3H9l-5 4V6.5C4 4.843 5.79 3.5 8 3.5h8c2.21 0 4 1.343 4 3v8z"
                                                                                        stroke="currentColor"
                                                                                        strokeWidth="1.6"
                                                                                        fill="currentColor"
                                                                                        fillOpacity=".14"
                                                                                    />
                                                                                    <circle cx="9" cy="11" r="1.2" fill="currentColor" />
                                                                                    <circle cx="12" cy="11" r="1.2" fill="currentColor" />
                                                                                    <circle cx="15" cy="11" r="1.2" fill="currentColor" />
                                                                                </svg>
                                                                            </button>
                                                                        )}
                                                                    </td>

                                                                    <td>
                                                                        {profiles?.filter(p => user?.profile_ids?.includes(p.PROFILE_ID))[0]?.process_ids.includes("P_JCD_0015") && (
                                                                            <div className="extension-request-container">
                                                                                {(() => {
                                                                                    const permissions = getUserJobPermissions(jcd);
                                                                                    const jobStatus = jcd.activeJobs?.job_status;
                                                                                    const extIds = [jcd.activeJobs.ext1, jcd.activeJobs.ext2, jcd.activeJobs.ext3].filter(Boolean);
                                                                                    const hasActiveExtension = extIds.some(extId => {
                                                                                        const extRecord = extendedJobsList.find(e => e.JEDA_ID === extId);
                                                                                        return extRecord?.ext_request_status === 1;
                                                                                    });
                                                                                    const maxAttempts = 3;
                                                                                    const attemptsReached = extIds.length >= maxAttempts;

                                                                                    // Hide extension button if job is under verification (status 4, 5, 6)
                                                                                    if (jobStatus === 4 || jobStatus === 5 || jobStatus === 6) {
                                                                                        return (
                                                                                            <div className="verification-status-message" style={{
                                                                                                padding: '8px',
                                                                                                backgroundColor: '#fff3cd',
                                                                                                border: '1px solid #ffeaa7',
                                                                                                borderRadius: '4px',
                                                                                                textAlign: 'center'
                                                                                            }}>
                                                                                                <div style={{ color: '#856404', fontSize: '12px', fontWeight: '500' }}>
                                                                                                    Under Verification
                                                                                                </div>
                                                                                                <div style={{ color: '#856404', fontSize: '11px', marginTop: '2px' }}>
                                                                                                    Extensions not allowed
                                                                                                </div>
                                                                                            </div>
                                                                                        );
                                                                                    }

                                                                                    // If job is locked by someone else
                                                                                    if (permissions.isLocked && !permissions.hasLock) {
                                                                                        return (
                                                                                            <div className="lock-status-message" style={{
                                                                                                padding: '8px',
                                                                                                backgroundColor: '#f8f9fa',
                                                                                                border: '1px solid #dee2e6',
                                                                                                borderRadius: '4px',
                                                                                                textAlign: 'center'
                                                                                            }}>
                                                                                                <div style={{ color: '#6c757d', fontSize: '12px' }}>
                                                                                                    🔒 Locked by:
                                                                                                </div>
                                                                                                <div style={{ fontWeight: 'bold', color: '#495057' }}>
                                                                                                    {permissions.lockedByUser || 'Another user'}
                                                                                                </div>
                                                                                                <div style={{ color: '#6c757d', fontSize: '11px', marginTop: '4px' }}>
                                                                                                    Only this person can request extensions
                                                                                                </div>
                                                                                            </div>
                                                                                        );
                                                                                    }

                                                                                    // If user has lock, show extension button
                                                                                    if (permissions.hasLock) {
                                                                                        return (
                                                                                            <button
                                                                                                onClick={() => handleExtensionRequest(jcd)}
                                                                                                disabled={hasActiveExtension || attemptsReached}
                                                                                                style={{
                                                                                                    cursor: hasActiveExtension || attemptsReached ? 'not-allowed' : 'pointer',
                                                                                                    opacity: hasActiveExtension || attemptsReached ? 0.5 : 1,
                                                                                                    padding: '6px 12px',
                                                                                                    border: 'none',
                                                                                                    borderRadius: '6px',
                                                                                                    fontSize: '13px',
                                                                                                    fontWeight: 500,
                                                                                                    backgroundColor: hasActiveExtension || attemptsReached ? '#6c757d' : '#007bff',
                                                                                                    color: 'white',
                                                                                                    transition: 'all 0.3s ease'
                                                                                                }}
                                                                                                title={hasActiveExtension ? 'Active extension request pending' : attemptsReached ? 'Maximum extension attempts reached' : 'Request extension'}
                                                                                            >
                                                                                                {hasActiveExtension ? 'Extension Pending' : attemptsReached ? 'Max Extensions' : 'Raise Extension'}
                                                                                            </button>
                                                                                        );
                                                                                    }

                                                                                    // If job is not locked, show acquire lock button
                                                                                    return (
                                                                                        <button
                                                                                            onClick={() => handleExtensionRequest(jcd)}
                                                                                            style={{
                                                                                                padding: '6px 12px',
                                                                                                border: 'none',
                                                                                                borderRadius: '6px',
                                                                                                fontSize: '13px',
                                                                                                fontWeight: 500,
                                                                                                backgroundColor: '#28a745',
                                                                                                color: 'white',
                                                                                                cursor: 'pointer'
                                                                                            }}
                                                                                            title="Acquire lock to request extension"
                                                                                        >
                                                                                            Acquire Lock
                                                                                        </button>
                                                                                    );
                                                                                })()}
                                                                            </div>
                                                                        )}
                                                                    </td>

                                                                    <td>{index + 1}</td>
                                                                    <td>{ship?.ship_name || "Unknown Ship"}</td>
                                                                    <td>{jcd.relatedJCD?.jcd_name || "N/A"}</td>
                                                                    <td>
                                                                        {jcd.relatedJCD?.jcd_category == 1 ? "Servicable" : "Replacable"}
                                                                    </td>
                                                                    <td>{issuedTo?.emp_name || "N/A"}</td>
                                                                    <td>
                                                                        {jcd.relatedJCD?.criticality == 1 ? "Critical" : "Not Critical"}
                                                                    </td>
                                                                    <td>GEN. RULE</td>
                                                                    <td>{firstVerif?.emp_name || "N/A"}</td>
                                                                    <td>{secondVerif?.emp_name || "N/A"}</td>
                                                                    <td>
                                                                        {renderJobStatusWithLock(jcd.activeJobs)}
                                                                    </td>
                                                                    <td>
                                                                        {jcd.activeJobs.job_completed_till
                                                                            ? jcd.activeJobs.job_completed_till.split("T")[0].split("-").reverse().join("-")
                                                                            : "N/A"
                                                                        }
                                                                    </td>
                                                                    <td>
                                                                        {jcd?.activeJobs?.old_issued_to?.length > 0 ? (
                                                                            <button
                                                                                className="btn-info"
                                                                                onClick={() => {
                                                                                    let temp = [];

                                                                                    try {
                                                                                        // Parse the old_issued_to JSON data
                                                                                        if (typeof jcd.activeJobs.old_issued_to === 'string') {
                                                                                            temp = JSON.parse(jcd.activeJobs.old_issued_to);
                                                                                        } else if (Array.isArray(jcd.activeJobs.old_issued_to)) {
                                                                                            temp = jcd.activeJobs.old_issued_to;
                                                                                        }

                                                                                        // Ensure it's an array
                                                                                        if (!Array.isArray(temp)) {
                                                                                            temp = [temp];
                                                                                        }
                                                                                    } catch (error) {
                                                                                        console.error("❌ Error parsing old_issued_to JSON:", error);
                                                                                        temp = [];
                                                                                    }

                                                                                    setOldDetailsDataOfPeviousEmployees(temp);
                                                                                    setIsWantToSeeOldDetailsOfPeviousEmployee(true);
                                                                                }}
                                                                                title="View previous employee details"
                                                                            >
                                                                                👥 See Details ({jcd.activeJobs.old_issued_to.length})
                                                                            </button>
                                                                        ) : (
                                                                            <span className="text-muted">No History</span>
                                                                        )}
                                                                    </td>

                                                                    <td>{designationList.filter(desg => desg.DSGH_ID == jcd.relatedJCD?.executed_by)[0]?.desg_name || 'N/A'}</td>
                                                                    <td>{designationList.filter(desg => desg.DSGH_ID == jcd.relatedJCD?.secondary_desg)[0]?.desg_name || 'N/A'}</td>

                                                                    {/* current date - jcd.relatedJCD?.job_completed_till */}
                                                                    <td>
                                                                        {(() => {
                                                                            const dueDate = new Date(jcd.activeJobs?.job_completed_till);
                                                                            const now = new Date();

                                                                            if (now <= dueDate) {
                                                                                return <>Not Overdue Yet</>;
                                                                            } else {
                                                                                // calculate overdue days
                                                                                const diffTime = now - dueDate;
                                                                                const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
                                                                                return <p style={{ color: 'crimson' }}>{diffDays} days overdue</p>;
                                                                            }
                                                                        })()}
                                                                    </td>

                                                                    <td>{(jcd?.activeJobs?.generated_on)?.split('T')[0]?.split('-')?.reverse()?.join('-') || 'N/A'}</td>

                                                                    <td>{employeeList.filter(emp => emp.UHA_ID == jcd?.activeJobs?.extensions_authority)[0]?.emp_name || 'N/A'}</td>

                                                                    <td>{designationList.filter(desg => desg.DSGH_ID == jcd?.relatedJCD?.extension_authority)[0]?.desg_name || 'N/A'}</td>
                                                                    <td style={{
                                                                        cursor: 'pointer'
                                                                    }} onClick={() => { setIsWantToShowExtentionDetailsPerJob(true); setSelectedActiveJobIdForExtention(jcd.activeJobs) }}>
                                                                        {
                                                                            [jcd.activeJobs?.ext1, jcd.activeJobs?.ext2, jcd.activeJobs?.ext3]
                                                                                .filter(val => val !== null && val !== undefined && val !== "")
                                                                                .length
                                                                        }
                                                                    </td>

                                                                    <td>
                                                                        {/* {renderActiveJobsActions(jcd)} */}
                                                                        Details
                                                                    </td>


                                                                </tr>
                                                            );
                                                        })
                                                ) : (
                                                    <tr>
                                                        <td colSpan={11} style={{ textAlign: "left" }}>
                                                            NO Active Jobs for Component
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            ) : (
                                <p>No Component Selected Yet !!</p>
                            )}
                        </>
                    )}

                    {/* Import Excel Modal */}
                    {importExcelModalOpen && (
                        <div className="modern-popup-overlay">
                            <div className="modern-popup" style={{ maxWidth: '500px' }}>
                                <div className="popup-header">
                                    <h2>Import Excel Data</h2>
                                    <button
                                        className="close-button"
                                        onClick={() => {
                                            setImportExcelModalOpen(false);
                                            setSelectedExcelFile(null);
                                        }}
                                        disabled={isImporting}
                                    >
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                            <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" />
                                        </svg>
                                    </button>
                                </div>

                                <div className="popup-content">
                                    <div style={{ marginBottom: '20px' }}>
                                        <p><strong>Selected Ship:</strong> {shipsList.find(s => s.SHA_ID === selectedShipFilterForActiveJobTab)?.ship_name}</p>
                                        <p style={{ fontSize: '14px', color: '#666', marginTop: '8px' }}>
                                            Upload an Excel file containing job data for this ship.
                                        </p>
                                    </div>

                                    <div className="file-upload-area">
                                        <input
                                            type="file"
                                            id="excel-file"
                                            accept=".xlsx, .xls"
                                            className="file-input"
                                            onChange={(e) => setSelectedExcelFile(e.target.files[0])}
                                            disabled={isImporting}
                                        />
                                        <label htmlFor="excel-file" className="file-upload-label">
                                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" style={{ marginRight: '8px' }}>
                                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
                                                    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                <polyline points="14,2 14,8 20,8"
                                                    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                <path d="M16 13H8"
                                                    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                <path d="M16 17H8"
                                                    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                <path d="M10 9H8"
                                                    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                            {selectedExcelFile ? selectedExcelFile.name : 'Choose Excel File'}
                                        </label>
                                    </div>

                                    {selectedExcelFile && (
                                        <div style={{
                                            marginTop: '15px',
                                            padding: '12px',
                                            backgroundColor: '#f8f9fa',
                                            borderRadius: '6px',
                                            border: '1px solid #e9ecef'
                                        }}>
                                            <p style={{ margin: '0', fontSize: '14px', color: '#495057' }}>
                                                <strong>File selected:</strong> {selectedExcelFile.name}
                                            </p>
                                            <p style={{ margin: '5px 0 0 0', fontSize: '12px', color: '#6c757d' }}>
                                                Size: {(selectedExcelFile.size / 1024).toFixed(2)} KB
                                            </p>
                                        </div>
                                    )}

                                    <div style={{ marginTop: '20px', padding: '12px', backgroundColor: '#fff3cd', borderRadius: '6px', border: '1px solid #ffeaa7' }}>
                                        <p style={{ margin: '0', fontSize: '12px', color: '#856404' }}>
                                            <strong>Note:</strong> Ensure the Excel file follows the required format for job data import.
                                        </p>
                                    </div>
                                </div>

                                <div className="popup-footer">
                                    <button
                                        className="btn-secondary"
                                        onClick={() => {
                                            setImportExcelModalOpen(false);
                                            setSelectedExcelFile(null);
                                        }}
                                        disabled={isImporting}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        className="btn-primary"
                                        onClick={handleExcelImport}
                                        disabled={!selectedExcelFile || isImporting}
                                        style={{
                                            opacity: (!selectedExcelFile || isImporting) ? 0.6 : 1,
                                            cursor: (!selectedExcelFile || isImporting) ? 'not-allowed' : 'pointer'
                                        }}
                                    >
                                        {isImporting ? (
                                            <>
                                                <svg className="spinner" width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ marginRight: '8px' }}>
                                                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" strokeDasharray="32" strokeDashoffset="32">
                                                        <animate attributeName="stroke-dashoffset" dur="1s" values="32;0" repeatCount="indefinite" />
                                                    </circle>
                                                </svg>
                                                Importing...
                                            </>
                                        ) : (
                                            'Import Data'
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                    {/* ================================================================================================================= */}

                    {/* Completed Jobs On Components */}
                    {activeTab == 'completed_jobs' && (
                        <>
                            {selectedNode ? (
                                <div className='active_tab_main_container'>
                                    <h1>{activeTab.replace('_', ' ').toUpperCase()}</h1>
                                    <p style={{ color: 'grey', fontStyle: 'italic', fontFamily: 'cursive' }}>Selected Component - <h2 style={{ color: 'grey', fontStyle: 'italic', display: 'inline-block', fontFamily: 'cursive' }}>{selectedNode.data.label}</h2></p>

                                    <div id='view_jcd_on_component_main_table_container'>
                                        <table>
                                            <thead>
                                                <tr>
                                                    <th>Sr.</th>
                                                    <th>Ship Name</th>
                                                    <th>Completed Job NAME</th>
                                                    <th>Exicuted By</th>
                                                    <th>Completed On</th>
                                                    <th>1St Verification Done By</th>
                                                    <th>2nd Verification Done By</th>
                                                    <th>Extension Authority</th>
                                                    <th>Triggered By (GEN. RULE)</th>
                                                    <th>Criticality</th>
                                                    <th>Job Category</th>
                                                    {profiles?.filter(p => user?.profile_ids?.includes(p.PROFILE_ID))[0]?.process_ids.includes("P_JCD_0017") && (
                                                        <th>GEN. Report</th>
                                                    )}
                                                </tr>
                                            </thead>

                                            <tbody>
                                                {selectedNode.data.executedJobs.length > 0 && employeeList.length > 0 ? (
                                                    <>
                                                        {selectedNode.data.executedJobs.map((jcd, index) => {
                                                            return (
                                                                <tr>
                                                                    <td>{index + 1}</td>
                                                                    <td>
                                                                        {
                                                                            shipsList.filter(ship => ship.SHA_ID == (plannedJobList.filter(pl => pl.JPHA_ID == jcd.executedJobs.JPHA_ID)[0].SHA_ID))[0].ship_name
                                                                        }
                                                                    </td>
                                                                    <td>{jcd.relatedJCD.jcd_name}</td>
                                                                    <td>
                                                                        {
                                                                            employeeList.filter((emp) => {
                                                                                const issuedTo = plannedJobList.filter(pl => pl.JPHA_ID == jcd.executedJobs.JPHA_ID)[0].issued_to
                                                                                if (emp.UHA_ID == issuedTo) {
                                                                                    return emp
                                                                                }
                                                                            })[0]?.emp_name
                                                                        }
                                                                    </td>
                                                                    <td>
                                                                        {
                                                                            (plannedJobList.filter(pl => pl.JPHA_ID == jcd.executedJobs.JPHA_ID)[0]?.executed_dt)?.split('T')[0]?.split('-')?.reverse()?.join('-') || 'N/A'
                                                                        }
                                                                    </td>
                                                                    <td>
                                                                        {
                                                                            employeeList.filter(emp => emp.UHA_ID == (plannedJobList.filter(pl => pl.JPHA_ID == jcd.executedJobs.JPHA_ID)[0].first_verification_by))[0]?.emp_name
                                                                        }
                                                                    </td>
                                                                    <td>
                                                                        {
                                                                            employeeList.filter(emp => emp.UHA_ID == (plannedJobList.filter(pl => pl.JPHA_ID == jcd.executedJobs.JPHA_ID)[0].second_verification_by))[0]?.emp_name
                                                                        }
                                                                    </td>
                                                                    <td>Extension Authority</td>
                                                                    <td>Triggered By (GEN. RULE)</td>
                                                                    <td>
                                                                        {
                                                                            JCD_schedule_List.filter(jcdd => jcdd.JCDSHA_ID == jcd.executedJobs.jcd_id)[0].criticality == 1 ? 'Critical' :
                                                                                'Not Critical'
                                                                        }
                                                                    </td>
                                                                    <td>
                                                                        {
                                                                            JCD_schedule_List.filter(jcdd => jcdd.JCDSHA_ID == jcd.executedJobs.jcd_id)[0].job_category == 1 ? 'Servicable' : 'Replacable'
                                                                        }
                                                                    </td>
                                                                    {profiles?.filter(p => user?.profile_ids?.includes(p.PROFILE_ID))[0]?.process_ids.includes("P_JCD_0017") && (
                                                                        <td>
                                                                            <button onClick={() => { toast.info('Working On this') }}>💾</button>
                                                                        </td>
                                                                    )}
                                                                </tr>
                                                            )
                                                        })}
                                                    </>
                                                ) : <td colSpan={12} style={{ textAlign: 'left' }}>NO Completed Jobs for Component</td>}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            ) : <p>No Component Selected Yet !!</p>}
                        </>
                    )}

                    {/* Upcoming Jobs Tab */}
                    {activeTab === "upcoming_jobs" && (
                        <div className="active_tab_main_container">
                            <h1>{activeTab.replace("_", " ").toUpperCase()}</h1>

                            {/* Ship Filter Dropdown */}
                            <div className="ship-filter-container" style={{ marginBottom: '20px' }}>
                                <div style={{
                                    display: 'flex',
                                    flexDirection: 'column'
                                }}>
                                    <label htmlFor="upcoming-ship-select" style={{ marginRight: '10px', fontWeight: 'bold' }}>
                                        Select Ship:
                                    </label>
                                    <select
                                        id="upcoming-ship-select"
                                        value={selectedShipIdForUpcoming}
                                        onChange={(e) => setSelectedShipIdForUpcoming(e.target.value)}
                                        style={{
                                            padding: '8px 12px',
                                            borderRadius: '6px',
                                            border: '1px solid #ddd',
                                            minWidth: '200px'
                                        }}
                                    >
                                        <option value="">All Ships</option>
                                        {
                                            officeStaffList
                                                .filter(staff => staff.user_id === user.UHA_ID)
                                                .flatMap(staff =>
                                                    shipsList.filter(ship => staff.allocated_ships.includes(ship.SHA_ID))
                                                )
                                                .map(ship => (
                                                    <option key={ship.SHA_ID} value={ship.SHA_ID}>
                                                        {ship.ship_name}
                                                    </option>
                                                ))
                                        }
                                    </select>
                                </div>

                                {/* Search Box */}
                                <div className="search-box" >
                                    <input
                                        type="text"
                                        placeholder="Search JCD..."
                                        value={searchTermUpcoming}
                                        onChange={(e) => setSearchTermUpcoming(e.target.value)}
                                    />
                                </div>

                                {/* Days Filter */}
                                <div className='days-filter-container-for-upcomming-jobs'>
                                    <label htmlFor='days-filter-for-upcomming-jobs'>Filter By Days</label>
                                    <input type="number"
                                        min={1}
                                        id='days-filter-for-upcomming-jobs'
                                        placeholder='Filter By Days'
                                        value={daysFilterForUpcommingJobs}
                                        onChange={(e) => { setDaysFilterForUpcommingJobs(e.target.value) }}
                                    />
                                </div>
                            </div>

                            {/* Upcoming Jobs Table */}
                            <div id="view_jcd_on_component_main_table_container">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Select</th>
                                            <th>JCD ID</th>
                                            <th>Component</th>
                                            <th>Operational Hours Interval</th>
                                            <th>Ship</th>
                                            <th>Current Reading</th>
                                            <th>Progress</th>
                                            <th>Next Generation</th>
                                            <th>Responsible Crew</th>
                                            <th>Priority</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {isLoadingUpcomingJobs ? (
                                            <tr>
                                                <td colSpan={11} style={{ textAlign: 'center', padding: '20px' }}>
                                                    <div className="loading-spinner">
                                                        Loading upcoming jobs...
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : (
                                            renderUpcomingJobsRows()
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {
                show_ship_jcd_linckage_popup && (
                    <div id='display-linked-ships-with-jcd-main-container-wrapper'>
                        <div id='display-linked-ships-with-jcd-main-container'>
                            <table>
                                <thead>
                                    <tr>
                                        <th></th>
                                        <th>SHIP CODE</th>
                                        <th>JCD NAME</th>
                                        <th>GEN. ON. CAT</th>
                                        <th>GEN. ON. SUB-CAT</th>
                                        <th>GEN. ON. 2ND-SUB-CAT</th>
                                        <th>GEN. ON. 3RD-SUB-CAT</th>
                                        <th>GEN. RULE</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {linkedJCD_SHIP_Data.length > 0 && employeeList.length > 0 ? (
                                        linkedJCD_SHIP_Data.map(linkedData => (
                                            <tr>
                                                <td>
                                                    <input
                                                        type="checkbox"
                                                        name="affectedShipsInJcdUpdation"
                                                        checked={checkedShipsForJCDUpdation.some(ship => ship.SHA_ID === linkedData.SHA_ID)}
                                                        onChange={(e) => {
                                                            if (e.target.checked) {
                                                                // Add ship to selection
                                                                setCheckedShipsForJCDUpdation(prev => [...prev, linkedData]);
                                                            } else {
                                                                // Remove ship from selection
                                                                setCheckedShipsForJCDUpdation(prev =>
                                                                    prev.filter(ship => ship.SHA_ID !== linkedData.SHA_ID)
                                                                );
                                                            }
                                                        }}
                                                    />
                                                </td>
                                                <td>{shipsList.filter(shipData => shipData.SHA_ID == linkedData.SHA_ID)[0]?.ship_name}</td>
                                                <td>{linkedData.jcd_name || 'Name Not Mention'}</td>
                                                <td>{mainCategoryList?.filter(catData => catData.CHA_ID == linkedData.jcd_applied_cat)[0]?.category_name || 'N/A'}</td>
                                                <td>{subCategoryList?.filter(catData => catData.SCHA_ID == linkedData.jcd_applied_sub_cat)[0]?.sub_category_name || 'N/A'}</td>
                                                <td>{secondSubCategoryList?.filter(catData => catData.SSCHA_ID == linkedData.jcd_applied_2nd_sub_cat)[0]?.second_sub_cat_name || 'N/A'}</td>
                                                <td>{thirdSubCategoryList?.filter(catData => catData.TSCHA_ID == linkedData.jcd_applied_3rd_sub_cat)[0]?.third_sub_cat_name || 'N/A'}</td>

                                                <td> KM={linkedData.km_interval || "?"}, HR={linkedData.operational_interval || '?'}, IDEAL={linkedData.periodic_interval || '?'} </td>
                                            </tr>
                                        ))
                                    ) : <tr><td></td><td>No Linkage With Any Ship</td></tr>}
                                </tbody>
                            </table>
                        </div>
                        <p><input type="checkbox" name="agreementForChanges" id="" onChange={(e) => {
                            if (e.target.checked) {
                                setIsConfirmShipsForJCDUpdation(true)
                            } else {
                                setIsConfirmShipsForJCDUpdation(false)
                            }
                        }} /> I have Confirm, I read all documents and I am reponsible For any thing happen after this change</p>
                        <div>
                            <button onClick={() => { setShow_ship_jcd_linckage_popup(false) }}>Close</button>
                            <button onClick={() => { handleConfirmShipsForJCDUpdation() }}>Confirm</button>
                        </div>
                    </div>
                )
            }

            {/* Asking for ship jcd linking At the time of new jcd configure */}
            {
                linkJCDToShipAtConfigTime && (
                    <div id='link-JCD-To-Ship-At-Config-Time-main-container'>
                        <div id='link-JCD-To-Ship-At-Config-Time-content-container'>
                            <div className="modal-header">
                                <h2>Link JCD to Ships</h2>
                                <p>Select ships and set the start date for this JCD</p>
                            </div>

                            <div className="table-container">
                                <table>
                                    <thead>
                                        <tr>
                                            <th style={{ alignContent: 'center', justifyItems: 'center', justifyContent: 'center', textAlign: 'center' }}>Check All <input type="checkbox" id="select-all-ships"
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        // Add ship to selection
                                                        shipsList?.forEach(element => {
                                                            setCheckedShipsForNewJcdLinking(prev => [...prev, element]);
                                                        })
                                                    } else {
                                                        // Remove ship from selection
                                                        shipsList?.forEach(element => {
                                                            setCheckedShipsForNewJcdLinking(prev =>
                                                                prev.filter(sh => sh.SHA_ID !== element.SHA_ID)
                                                            );
                                                        })
                                                    }
                                                }}
                                            /></th>
                                            <th style={{ textAlign: 'center' }}>Ship Name</th>
                                            <th style={{ textAlign: 'center' }}>Applied From</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {shipsList.map((ship) => (
                                            <tr key={ship.SHA_ID}>
                                                <td><input type="checkbox" className="ship-checkbox" data-ship-id={ship.SHA_ID}
                                                    checked={checkedShipsForNewJcdLinking.some(sh => sh.SHA_ID === ship.SHA_ID)}
                                                    onChange={(e) => {
                                                        if (e.target.checked) {
                                                            // Add ship to selection
                                                            setCheckedShipsForNewJcdLinking(prev => [...prev, ship]);
                                                        } else {
                                                            // Remove ship from selection
                                                            setCheckedShipsForNewJcdLinking(prev =>
                                                                prev.filter(sh => sh.SHA_ID !== ship.SHA_ID)
                                                            );
                                                        }
                                                        // toast(checkedShipsForJCDUpdation.toString())
                                                    }} /></td>
                                                <td>{ship.ship_name}</td>
                                                <td><input type="date" className="applied-from-date" data-ship-id={ship.SHA_ID} /></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <div className="modal-footer">
                                <button type="button" className="btn-cancel" onClick={() => {
                                    setCheckedShipsForNewJcdLinking([])
                                    setLinkJCDToShipAtConfigTime(false)
                                }}>Cancel</button>

                                <button
                                    type="button"
                                    className="btn-confirm"
                                    onClick={handleConfirmAndSave}
                                >
                                    Confirm & Save
                                </button>

                            </div>
                        </div>
                    </div>
                )
            }

            {
                (isWantToViewShipsLinkedOnSelectedJCD && selectedJCDForViewShips) && (
                    <div id='link-JCD-To-Ship-At-Config-Time-main-container'>
                        <div id='link-JCD-To-Ship-At-view-jcd-content-container'>

                            {/* Container for Those ships who has this jcd */}
                            <div id='link-JCD-To-Ship-At-view-jcd-content-top-container'>
                                <h3>Selected JCD Name : {selectedJCDForViewShips.jcd_name}</h3>
                                <h3>Assigned Ships</h3>
                                <div className="table-scroll-container">
                                    <table>
                                        <thead>
                                            <tr>
                                                <th>SR.</th>
                                                <th>SHIP NAME</th>
                                                <th>ACTIVE FROM</th>
                                                <th>Active Job No</th>
                                                <th>Job Status</th>
                                                {profiles?.filter(p => user?.profile_ids?.includes(p.PROFILE_ID))[0]?.process_ids.includes("P_JCD_0014") && (
                                                    <th>OPERATION</th>
                                                )}
                                            </tr>
                                        </thead>

                                        <tbody>
                                            {shipsList?.filter(ship =>
                                                JCD_ship_wise_group_combinations_list.some(
                                                    obj =>
                                                        obj.SHA_ID === ship.SHA_ID &&
                                                        obj.jcds?.toString().includes(selectedJCDForViewShips.jcd_id)
                                                )
                                            ).length > 0 ? (
                                                shipsList
                                                    .filter(ship =>
                                                        JCD_ship_wise_group_combinations_list.some(
                                                            obj =>
                                                                obj.SHA_ID === ship.SHA_ID &&
                                                                obj.jcds?.toString().includes(selectedJCDForViewShips.jcd_id)
                                                        )
                                                    )
                                                    .map((ship, index) => {
                                                        const jcd = JCD_schedule_List.find(
                                                            j =>
                                                                j.jcd_id === selectedJCDForViewShips.jcd_id &&
                                                                j.SHA_ID === ship.SHA_ID
                                                        );

                                                        return (
                                                            <tr key={index + '' + ship.JSCA_ID}>
                                                                <td>{index + 1}</td>
                                                                <td>{ship.ship_name}</td>
                                                                <td>{
                                                                    jcd ? (jcd.jcd_applied_from)?.split('T')[0].split('-').reverse().join('-') || (jcd.inserted_on)?.split('T')[0].split('-').reverse().join('-') : 'N/A'
                                                                }</td>

                                                                <td>
                                                                    {/* {console.log('plannedJobList.filter(pl => pl.jcd_id == jcd.JCDSHA_ID)[0]?.JPHA_ID ::', jcd)} */}
                                                                    {plannedJobList.filter(pl => {
                                                                        console.log(`${pl.jcd_id} == ${jcd?.JCDSHA_ID}`)
                                                                        if (pl.jcd_id == jcd?.JCDSHA_ID) {
                                                                            return pl
                                                                        }
                                                                    })[0]?.JPHA_ID || 'No Active Job'}
                                                                </td>
                                                                <td>
                                                                    {activeJobStatusMap[plannedJobList.filter(pl => {
                                                                        // console.log(`${pl.jcd_id} == ${jcd?.JCDSHA_ID}`)
                                                                        if (pl.jcd_id == jcd?.JCDSHA_ID) {
                                                                            return pl
                                                                        }
                                                                    })[0]?.job_status] || '--'}
                                                                </td>
                                                                {profiles?.filter(p => user?.profile_ids?.includes(p.PROFILE_ID))[0]?.process_ids.includes("P_JCD_0014") && (

                                                                    <td><button onClick={() => { unlinkJcdsFromShip(selectedJCDForViewShips.jcd_id, ship.SHA_ID) }} className="action-btn delete">🗑️</button></td>
                                                                )}
                                                            </tr>
                                                        );
                                                    })
                                            ) : (
                                                <tr>
                                                    <td colSpan="4" style={{ textAlign: "center" }}>
                                                        Not Linked With Any Ship
                                                    </td>
                                                </tr>
                                            )}

                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Container for Those ships who not have this jcd */}
                            <div id='link-JCD-To-Ship-At-view-jcd-content-bottom-container'>
                                <h3>Un-Assigned Ships</h3>
                                <div className="table-scroll-container">
                                    <table>
                                        <thead>
                                            <tr>
                                                <th></th>
                                                <th>SR.</th>
                                                <th>SHIP NAME</th>
                                                <th>SHIP CODE</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {shipsList?.filter(ship =>
                                                !JCD_ship_wise_group_combinations_list.some(
                                                    obj =>
                                                        obj.SHA_ID === ship.SHA_ID &&
                                                        obj.jcds?.toString().includes(selectedJCDForViewShips.jcd_id)
                                                )
                                            ).length > 0 ? (
                                                shipsList
                                                    .filter(ship =>
                                                        !JCD_ship_wise_group_combinations_list.some(
                                                            obj =>
                                                                obj.SHA_ID === ship.SHA_ID &&
                                                                obj.jcds?.toString().includes(selectedJCDForViewShips.jcd_id)
                                                        )
                                                    )
                                                    .map((ship, index) => (
                                                        <tr key={index + '' + ship.JSCA_ID}>
                                                            <td>
                                                                <input
                                                                    type="checkbox"
                                                                    style={{
                                                                        width: 'fit-content',
                                                                        cursor: 'pointer'
                                                                    }}
                                                                    onChange={(e) => {
                                                                        if (e.target.checked) {
                                                                            // Add ship
                                                                            setCheckedShipsToAllocatedSelectedJCD(prev => [...prev, ship]);
                                                                        } else {
                                                                            // Remove ship
                                                                            setCheckedShipsToAllocatedSelectedJCD(prev =>
                                                                                prev.filter(s => s.SHA_ID !== ship.SHA_ID)
                                                                            );
                                                                        }
                                                                    }}
                                                                    checked={checkedShipsToAllocatedSelectedJCD.includes(ship)}
                                                                />
                                                            </td>
                                                            <td>{index + 1}</td>
                                                            <td>{ship.ship_name}</td>
                                                            <td>{ship.ship_code}</td>
                                                        </tr>
                                                    ))
                                            ) : (
                                                <tr>
                                                    <td colSpan="4" style={{ textAlign: "center" }}>
                                                        All Ships Are Already Linked
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>

                                    </table>
                                </div>
                            </div>

                            <div className="modal-footer" style={{
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                gap: '20px'
                            }}>
                                {profiles?.filter(p => user?.profile_ids?.includes(p.PROFILE_ID))[0]?.process_ids.includes("P_JCD_0013") && (
                                    <button
                                        type="button"
                                        className="btn-primary"
                                        disabled={checkedShipsToAllocatedSelectedJCD.length === 0}
                                        style={{
                                            cursor: checkedShipsToAllocatedSelectedJCD.length === 0 ? 'not-allowed' : 'pointer',
                                            opacity: checkedShipsToAllocatedSelectedJCD.length === 0 ? '.5' : '1',
                                            // pointerEvents: checkedShipsToAllocatedSelectedJCD.length === 0 ? 'none' : 'all',
                                        }}
                                        onClick={() => {
                                            // showCheckedShipsDetailsToAllocatedSelectedJCD()
                                            setIsShowCheckedShipsDetailsToAllocatedSelectedJCD(true)
                                        }}
                                    >
                                        Link Selected JCDs
                                    </button>
                                )}


                                <button type="button" className="btn-primary" onClick={() => {
                                    setIsWantToViewShipsLinkedOnSelectedJCD(false)
                                    setSelectedJCDForViewShips(null)
                                    setCheckedShipsToAllocatedSelectedJCD([])

                                    setIsShowCheckedShipsDetailsToAllocatedSelectedJCD(false);
                                    setConfirmedShips({});
                                    setCurrentShipIndex(0);
                                }}>Close</button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Step-by-Step Ship Configuration Popup */}
            {
                isShowCheckedShipsDetailsToAllocatedSelectedJCD && checkedShipsToAllocatedSelectedJCD.length > 0 && (
                    <div
                        style={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            width: '100vw',
                            height: '100vh',
                            backgroundColor: 'rgba(0, 0, 0, 0.6)',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            zIndex: 99999,
                            overflowY: 'auto',
                            padding: '20px',
                        }}
                        onClick={(e) => {
                            if (e.target === e.currentTarget) {
                                setIsShowCheckedShipsDetailsToAllocatedSelectedJCD(false);
                            }
                        }}
                    >
                        {/* Modal Card */}
                        <div
                            style={{
                                background: 'white',
                                borderRadius: '12px',
                                width: '90%',
                                maxWidth: '640px',
                                maxHeight: '90vh',
                                overflowY: 'auto',
                                boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
                                border: '1px solid #e0e0e0',
                            }}
                        >
                            {/* Header */}
                            <div
                                style={{
                                    padding: '20px',
                                    borderBottom: '1px solid #eee',
                                    textAlign: 'center',
                                    backgroundColor: '#f8f9fa',
                                    borderRadius: '12px 12px 0 0',
                                }}
                            >
                                <h2 style={{ margin: 0, color: '#333', fontSize: '1.5rem' }}>
                                    Link JCD to Ships
                                </h2>
                                <p style={{ margin: '8px 0 0', color: '#666', fontSize: '0.9rem' }}>
                                    Step {currentShipIndex + 1} of {checkedShipsToAllocatedSelectedJCD.length}
                                </p>
                            </div>

                            {/* Body */}
                            <div style={{ padding: '30px' }}>
                                {(() => {
                                    const checkedShip = checkedShipsToAllocatedSelectedJCD[currentShipIndex];

                                    // Track confirmation per ship
                                    const isConfirmed = confirmedShips[checkedShip.SHA_ID] || false;

                                    return (
                                        <div>
                                            {/* Ship Info */}
                                            <h3 style={{ color: '#1a1a1a', marginBottom: '10px' }}>{checkedShip.ship_name}</h3>
                                            <p style={{ color: '#555', marginBottom: '20px' }}>
                                                <strong>Ship Code:</strong> {checkedShip.ship_code}
                                            </p>

                                            {/* Applied From Date */}
                                            <div style={{ marginBottom: '24px' }}>
                                                <label
                                                    htmlFor={`applied-from-${checkedShip.SHA_ID}`}
                                                    style={{
                                                        display: 'block',
                                                        marginBottom: '6px',
                                                        fontWeight: '500',
                                                        color: '#333',
                                                    }}
                                                >
                                                    Applied From
                                                </label>
                                                <input
                                                    type="date"
                                                    value={appliedFromDates[checkedShip.SHA_ID] || ''}
                                                    onChange={(e) => {
                                                        setAppliedFromDates((prev) => ({
                                                            ...prev,
                                                            [checkedShip.SHA_ID]: e.target.value,
                                                        }));
                                                    }}
                                                    style={{
                                                        width: '100%',
                                                        padding: '10px',
                                                        borderRadius: '6px',
                                                        border: '1px solid #ccc',
                                                        fontSize: '1rem',
                                                        color: 'gray',
                                                    }}
                                                    required
                                                />
                                            </div>

                                            {/* Confirmation Checkbox */}
                                            <div
                                                style={{
                                                    marginBottom: '24px',
                                                    padding: '14px',
                                                    border: `1px solid ${isConfirmed ? '#28a745' : '#ddd'}`,
                                                    borderRadius: '8px',
                                                    backgroundColor: '#f9f9f9',
                                                    transition: 'border 0.2s',
                                                }}
                                            >
                                                <label
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'flex-start',
                                                        gap: '10px',
                                                        cursor: 'pointer',
                                                        userSelect: 'none',
                                                    }}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={isConfirmed}
                                                        onChange={(e) => {
                                                            setConfirmedShips((prev) => ({
                                                                ...prev,
                                                                [checkedShip.SHA_ID]: e.target.checked,
                                                            }));
                                                        }}
                                                        style={{ marginTop: '4px', width: 'fit-content' }}
                                                    />
                                                    <span style={{ fontSize: '0.95rem', color: '#444' }}>
                                                        <i>I confirm I have reviewed this ship and am responsible for linking this JCD.</i>
                                                    </span>
                                                </label>
                                                {!isConfirmed && (
                                                    <small style={{ color: '#d9534f', display: 'block', marginTop: '6px' }}>
                                                        * This is required
                                                    </small>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })()}
                            </div>

                            {/* Footer */}
                            <div
                                style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    padding: '20px 30px',
                                    borderTop: '1px solid #eee',
                                    backgroundColor: '#f8f9fa',
                                    borderRadius: '0 0 12px 12px',
                                    gap: '12px',
                                    flexWrap: 'wrap',
                                }}
                            >
                                {/* Back Button */}
                                <button
                                    type="button"
                                    onClick={() => setCurrentShipIndex((prev) => Math.max(prev - 1, 0))}
                                    disabled={currentShipIndex === 0}
                                    style={{
                                        padding: '10px 16px',
                                        backgroundColor: currentShipIndex === 0 ? '#e9ecef' : '#007bff',
                                        color: currentShipIndex === 0 ? '#6c757d' : 'white',
                                        border: 'none',
                                        borderRadius: '6px',
                                        cursor: currentShipIndex === 0 ? 'not-allowed' : 'pointer',
                                        fontSize: '14px',
                                        fontWeight: '500',
                                    }}
                                >
                                    ← Back
                                </button>

                                {/* Close Button */}
                                <button
                                    onClick={() => {
                                        setIsShowCheckedShipsDetailsToAllocatedSelectedJCD(false)
                                        setConfirmedShips({})
                                        setAppliedFromDates({})
                                    }}
                                    style={{
                                        marginLeft: 'auto',
                                        padding: '10px 20px',
                                        backgroundColor: '#d00b0bff',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '6px',
                                        cursor: 'pointer',
                                        fontSize: '14px',
                                        fontWeight: '600',
                                        minWidth: '120px',
                                    }}
                                >
                                    Close
                                </button>

                                {/* Next or Submit All */}
                                {currentShipIndex < checkedShipsToAllocatedSelectedJCD.length - 1 ? (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const checkedShip = checkedShipsToAllocatedSelectedJCD[currentShipIndex];
                                            const isConfirmed = confirmedShips[checkedShip.SHA_ID];

                                            if (!isConfirmed) {
                                                toast.warning('Please confirm for this ship before proceeding.');
                                                return;
                                            }
                                            setCurrentShipIndex((prev) => prev + 1);
                                        }}
                                        style={{
                                            marginLeft: 'auto',
                                            padding: '10px 16px',
                                            backgroundColor: '#28a745',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '6px',
                                            cursor: 'pointer',
                                            fontSize: '14px',
                                            fontWeight: '500',
                                        }}
                                    >
                                        Next →
                                    </button>
                                ) : (
                                    // In your "Submit All" button onClick handler, replace this:
                                    <button
                                        type="button"
                                        onClick={handleSubmitAllShips}
                                        style={{
                                            marginLeft: 'auto',
                                            padding: '10px 20px',
                                            backgroundColor: '#007bff',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '6px',
                                            cursor: 'pointer',
                                            fontSize: '14px',
                                            fontWeight: '600',
                                            minWidth: '120px',
                                        }}
                                    >
                                        Submit All
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                )
            }

            {/* this below pop up opens when user click on suspend button in view jcds tab
            {/* This popup opens when user clicks on Suspend button in view jcds tab */}
            {
                isWantToSuspendJCDFromShips && selectedJCDForViewShips && (
                    <div
                        style={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            width: '100vw',
                            height: '100vh',
                            backgroundColor: 'rgba(0, 0, 0, 0.6)',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            zIndex: 99999,
                            overflowY: 'auto',
                            padding: '20px',
                            backdropFilter: 'blur(5px)',
                        }}
                        onClick={(e) => {
                            if (e.target === e.currentTarget) {
                                setIsWantToSuspendJCDFromShips(false);
                            }
                        }}
                    >
                        <div
                            style={{
                                background: 'white',
                                borderRadius: '12px',
                                width: '90%',
                                maxWidth: '720px',
                                maxHeight: '90vh',
                                overflowY: 'auto',
                                boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
                                border: '1px solid #e0e0e0',
                            }}
                        >
                            {/* Header */}
                            <div
                                style={{
                                    padding: '20px',
                                    borderBottom: '1px solid #eee',
                                    backgroundColor: '#f8f9fa',
                                    borderRadius: '12px 12px 0 0',
                                }}
                            >
                                <h2 style={{ margin: '0', color: '#333', fontSize: '1.5rem' }}>
                                    Suspend JCD from Ships
                                </h2>
                                <p style={{ margin: '8px 0 0', color: '#666', fontSize: '0.9rem' }}>
                                    Selected JCD: <strong>{selectedJCDForViewShips.jcd_name}</strong>
                                </p>
                            </div>

                            {/* Body */}
                            <div style={{ padding: '20px' }}>
                                <p style={{ marginBottom: '15px', color: '#555' }}>
                                    Select ships to suspend this JCD from:
                                </p>

                                <div
                                    className="table-scroll-container"
                                    style={{
                                        maxHeight: '400px',
                                        overflowY: 'auto',
                                        border: '1px solid #ddd',
                                        borderRadius: '8px',
                                        marginBottom: '20px',
                                    }}
                                >
                                    <table
                                        style={{
                                            width: '100%',
                                            borderCollapse: 'collapse',
                                            fontSize: '0.95rem',
                                        }}
                                    >
                                        <thead>
                                            <tr
                                                style={{
                                                    backgroundColor: '#f1f1f1',
                                                    position: 'sticky',
                                                    top: 0,
                                                    zIndex: 1,
                                                    textAlign: 'center'
                                                }}
                                            >
                                                <th
                                                    style={{
                                                        padding: '12px',
                                                        textAlign: 'left',
                                                        width: '60px',
                                                    }}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={
                                                            checkedShipsToSuspend.length ===
                                                            shipsLinkedWithSelectedJCD.length
                                                        }
                                                        onChange={(e) => {
                                                            if (e.target.checked) {
                                                                setCheckedShipsToSuspend(
                                                                    shipsLinkedWithSelectedJCD.map((s) => s.SHA_ID)
                                                                );
                                                            } else {
                                                                setCheckedShipsToSuspend([]);
                                                            }
                                                        }}
                                                    />
                                                </th>
                                                <th style={{ padding: '12px', textAlign: 'left' }}>SHIP NAME</th>
                                                <th style={{ padding: '12px', textAlign: 'left' }}>
                                                    Active JOB NO.
                                                </th>
                                                <th style={{ padding: '12px', textAlign: 'left' }}>
                                                    Active JOB
                                                </th>
                                                {/* <th style={{ padding: '12px', textAlign: 'left' }}>
                                                    LAST JOB NO.
                                                </th>
                                                <th style={{ padding: '12px', textAlign: 'left' }}>
                                                    LAST JOB STATUS
                                                </th> */}
                                            </tr>
                                        </thead>

                                        <tbody>
                                            {shipsLinkedWithSelectedJCD.length > 0 ? (
                                                shipsLinkedWithSelectedJCD.map((ship) => {
                                                    // 🔍 Step 1: Get common_jcd_id
                                                    const common_jcd_id = JCD_schedule_List?.find(
                                                        (j) => j.line_no === 0 && j.JCDSHA_ID === selectedJCDForViewShips?.JCDSHA_ID
                                                    )?.jcd_id;

                                                    // 🔍 Step 2: Resolve correct JCDSHA_ID for this ship
                                                    const jcdShaForShip = JCD_schedule_List?.find(
                                                        (j) => j.jcd_id === common_jcd_id && j.SHA_ID === ship.SHA_ID
                                                    )?.JCDSHA_ID;

                                                    // 🔍 Step 3: Active Job for this ship
                                                    const activeJob = plannedJobList.find(
                                                        (pl) => pl.jcd_id === jcdShaForShip && pl.SHA_ID === ship.SHA_ID
                                                    );

                                                    return (
                                                        <tr
                                                            key={ship.SHA_ID}
                                                            style={{
                                                                borderBottom: '1px solid #eee',
                                                                backgroundColor: checkedShipsToSuspend.includes(ship.SHA_ID)
                                                                    ? '#f0f8ff'
                                                                    : 'white',
                                                            }}
                                                        >
                                                            {/* Checkbox */}
                                                            <td style={{ padding: '10px', textAlign: 'center' }}>
                                                                <input
                                                                    type="checkbox"
                                                                    checked={checkedShipsToSuspend.includes(ship.SHA_ID)}
                                                                    onChange={(e) => {
                                                                        if (e.target.checked) {
                                                                            setCheckedShipsToSuspend((prev) => [...prev, ship.SHA_ID]);
                                                                        } else {
                                                                            setCheckedShipsToSuspend((prev) =>
                                                                                prev.filter((id) => id !== ship.SHA_ID)
                                                                            );
                                                                        }
                                                                    }}
                                                                />
                                                            </td>

                                                            {/* Ship name */}
                                                            <td style={{ padding: '10px' }}>{ship.ship_name}</td>

                                                            {/* Active Job No. */}
                                                            <td style={{ padding: '10px' }}>
                                                                {activeJob?.JPHA_ID || 'No Active Job'}
                                                            </td>

                                                            {/* Active Job Status */}
                                                            <td style={{ padding: '10px' }}>
                                                                {activeJob ? activeJobStatusMap[activeJob.job_status] : '--'}
                                                            </td>
                                                        </tr>
                                                    );
                                                })
                                            ) : (
                                                <tr>
                                                    <td
                                                        colSpan="4"
                                                        style={{
                                                            textAlign: 'center',
                                                            padding: '20px',
                                                            color: '#999',
                                                            fontStyle: 'italic',
                                                        }}
                                                    >
                                                        No ships are currently linked with this JCD.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>

                                    </table>
                                </div>
                            </div>

                            {/* Footer */}
                            <div
                                style={{
                                    display: 'flex',
                                    justifyContent: 'flex-end',
                                    gap: '12px',
                                    padding: '20px',
                                    borderTop: '1px solid #eee',
                                    backgroundColor: '#f8f9fa',
                                    borderRadius: '0 0 12px 12px',
                                }}
                            >
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsWantToSuspendJCDFromShips(false);
                                        setCheckedShipsToSuspend([]);
                                    }}
                                    style={{
                                        padding: '10px 20px',
                                        backgroundColor: '#6c757d',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '6px',
                                        cursor: 'pointer',
                                        fontSize: '14px',
                                        fontWeight: '500',
                                    }}
                                >
                                    Cancel
                                </button>

                                <button
                                    type="button"
                                    disabled={checkedShipsToSuspend.length === 0}
                                    onClick={async () => {
                                        if (checkedShipsToSuspend.length === 0) return;

                                        // 🚨 Validate active jobs for all selected ships
                                        const blockedShips = checkedShipsToSuspend.filter((shipId) => {
                                            const common_jcd_id = JCD_schedule_List?.find(
                                                (j) => j.line_no === 0 && j.JCDSHA_ID === selectedJCDForViewShips?.JCDSHA_ID
                                            )?.jcd_id;

                                            const jcdShaForShip = JCD_schedule_List?.find(
                                                (j) => j.jcd_id === common_jcd_id && j.SHA_ID === shipId
                                            )?.JCDSHA_ID;

                                            const activeJob = plannedJobList.find(
                                                (pl) => pl.jcd_id === jcdShaForShip && pl.SHA_ID === shipId
                                            );

                                            return activeJob?.JPHA_ID; // means active job exists
                                        });

                                        if (blockedShips.length > 0) {
                                            toast.error(
                                                `Cannot suspend. ${blockedShips.length} selected ship(s) still have an active job. Complete it first.`
                                            );
                                            return;
                                        }

                                        const confirm = window.confirm(
                                            `Are you sure you want to suspend this JCD from ${checkedShipsToSuspend.length} ship(s)?`
                                        );
                                        if (!confirm) return;

                                        await suspendJCdFromShips(); // Fixed: No parameters needed
                                    }}
                                    style={{
                                        padding: '10px 20px',
                                        backgroundColor: checkedShipsToSuspend.length > 0 ? '#d9534f' : '#e9ecef',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '6px',
                                        cursor: checkedShipsToSuspend.length > 0 ? 'pointer' : 'not-allowed',
                                        fontSize: '14px',
                                        fontWeight: '600',
                                    }}
                                >
                                    Suspend ({checkedShipsToSuspend.length})
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {isWantToSeeOldDetailsOfPeviousEmployee && (
                <OldIssuedToListComp
                    oldDetailsDataOfPeviousEmployees={oldDetailsDataOfPeviousEmployees}
                    employeeList={employeeList}
                    designationList={designationList}
                    departmentsList={departmentsList}
                    shipsList={shipsList}
                    activeJobStatusMap={activeJobStatusMap}
                    onClose={() => {
                        setOldDetailsDataOfPeviousEmployees([]);
                        setIsWantToSeeOldDetailsOfPeviousEmployee(false);
                    }}
                />
            )}

            {/* PopUp For Extention Details Per Job */}
            {
                isWantToShowExtentionDetailsPerJob && (
                    <div className="modern-extension-modal-overlay">
                        <div className="modern-extension-modal">
                            {/* Header */}
                            <div className="modal-header">
                                <div className="header-content">
                                    <h2>Extension Request Details</h2>
                                    <p>Job: {selectedActiveJobIdForExtention?.JPHA_ID || 'N/A'}</p>
                                </div>
                                <button
                                    className="close-button"
                                    onClick={() => setIsWantToShowExtentionDetailsPerJob(false)}
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                        <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" />
                                    </svg>
                                </button>
                            </div>

                            {/* Content */}
                            <div className="modal-content">
                                {selectedActiveJobIdForExtention && extendedJobsList.length > 0 ? (
                                    <div className="table-container">
                                        <table className="modern-table">
                                            <thead>
                                                <tr>
                                                    <th className="action-col">Actions</th>
                                                    <th className="sr-col">#</th>
                                                    <th>Extension Authority</th>
                                                    <th>Authority Designation</th>
                                                    <th>Requested By</th>
                                                    <th>Requester Designation</th>
                                                    <th>Request Date</th>
                                                    <th className="status-col">Status</th>
                                                    <th>Job Generated</th>
                                                    <th>Job Status at Approval</th>
                                                    <th>Overdue Count</th>
                                                    <th>New Deadline</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {extendedJobsList
                                                    .filter(ext => ext.JPTA_ID == selectedActiveJobIdForExtention.JPHA_ID)
                                                    ?.map((ext, index) => (
                                                        <tr key={ext.JEDA_ID} className="table-row">
                                                            <td className="action-cell">
                                                                <button
                                                                    className="icon-button chat-button"
                                                                    onClick={() => toast.info("Open communication panel...")}
                                                                    title="Open Communication"
                                                                >
                                                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                                                                        <path
                                                                            d="M20 14.5c0 1.657-1.79 3-4 3H9l-5 4V6.5C4 4.843 5.79 3.5 8 3.5h8c2.21 0 4 1.343 4 3v8z"
                                                                            stroke="currentColor"
                                                                            strokeWidth="1.6"
                                                                            fill="currentColor"
                                                                            fillOpacity=".14"
                                                                        />
                                                                        <circle cx="9" cy="11" r="1.2" fill="currentColor" />
                                                                        <circle cx="12" cy="11" r="1.2" fill="currentColor" />
                                                                        <circle cx="15" cy="11" r="1.2" fill="currentColor" />
                                                                    </svg>
                                                                </button>
                                                            </td>
                                                            <td className="sr-cell">{index + 1}</td>
                                                            <td>
                                                                {employeeList.find(emp => emp.UHA_ID == ext?.approve_authority_id)?.emp_name || 'N/A'}
                                                            </td>
                                                            <td>
                                                                {designationList.find(d => d.DSGH_ID == ext?.approve_authority_desg)?.desg_name || 'N/A'}
                                                            </td>
                                                            <td>
                                                                {employeeList.find(emp => emp.UHA_ID == ext?.requested_by)?.emp_name || 'N/A'}
                                                            </td>
                                                            <td>
                                                                {designationList.find(d => d.DSGH_ID == employeeList.find(emp => emp.UHA_ID == ext?.requested_by)?.DSGH_ID)?.desg_name || 'N/A'}
                                                            </td>
                                                            <td>
                                                                {ext.requested_on.split('T')[0].split('-').reverse().join('-')}
                                                            </td>
                                                            <td className="status-cell">
                                                                <span className={`status-badge status-${ext.ext_request_status}`}>
                                                                    {ext.ext_request_status === 1 ? "Requested" :
                                                                        ext.ext_request_status === 2 ? "Approved" :
                                                                            ext.ext_request_status === 3 ? "Rejected" : "—"}
                                                                </span>
                                                            </td>
                                                            <td>
                                                                {selectedActiveJobIdForExtention.generated_on.split('T')[0].split('-').reverse().join('-')}
                                                            </td>
                                                            <td>
                                                                {activeJobStatusMap[selectedActiveJobIdForExtention.job_status] || 'N/A'}
                                                            </td>
                                                            <td>
                                                                {/* Overdue count logic here */}
                                                                {(() => {
                                                                    const dueDate = new Date(selectedActiveJobIdForExtention.job_completed_till);
                                                                    const requestDate = new Date(ext.requested_on);
                                                                    const diffTime = requestDate - dueDate;
                                                                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                                                                    return diffDays > 0 ? `${diffDays} days` : 'Not Overdue';
                                                                })()}
                                                            </td>
                                                            <td>
                                                                {ext.new_execution_deadline?.split('T')[0].split('-').reverse().join('-') || 'N/A'}
                                                            </td>
                                                        </tr>
                                                    ))
                                                }
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div className="empty-state">
                                        <div className="empty-icon">📋</div>
                                        <h3>No Extension Requests</h3>
                                        <p>No extension requests found for this job.</p>
                                    </div>
                                )}
                            </div>

                            {/* Footer */}
                            <div className="modal-footer">
                                <button
                                    className="btn-secondary"
                                    onClick={() => setIsWantToShowExtentionDetailsPerJob(false)}
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Open Communication Model */}
            {
                isOpenCommunicationModel && (
                    <div id='Communication_model_wrapper'>
                        <div className="communication-modal-inner">
                            <Communication_Comp
                                jcd={selectedJCDForCommunication}
                                isOpenByExtention={isOpenByExtention}
                                onClose={() => setIsOpenCommunicationModel(false)} // ✅ Pass onClose
                                refreshJCDPage={refreshJCDSchedules} // ✅ Pass refresh function
                                refreshTree={refreshTree} // ✅ Pass refresh function
                                refreshPlannedJobs={refreshPlannedJobs} // ✅ Ensure this is passed too
                            />

                            <button
                                style={{
                                    // padding: "5px 20px",
                                    borderRadius: "50%",
                                    border: "none",
                                    backgroundColor: "rgba(232, 65, 65, 1)",
                                    color: "white",
                                    fontSize: "1.1rem",
                                    fontWeight: 400,
                                    cursor: "pointer",
                                    marginTop: "10px",
                                    alignSelf: "stretch",
                                    margin: "10px 20px",
                                    padding: '5px 10px',

                                    position: 'absolute',
                                    top: '11px',
                                    right: '-2px'
                                }}
                                onClick={() => {
                                    setIsOpenCommunicationModel(false)
                                    refreshExtendedJobsList()
                                    console.log('selectedNode before refresh tree.. : ', selectedNode)
                                    refreshTree()
                                    refreshPlannedJobs()
                                    console.log('selectedNode after refresh tree.. : ', selectedNode)
                                }}
                            >
                                ✕
                            </button>
                        </div>
                    </div>
                )
            }

            {/* Showing JCD Image Video and other files requirements when we complete it */}
            {isShowJcdRequirements && (
                <div className="modern-jcd-requirements-overlay">
                    {console.log('selectedJCDForExecution :: ', selectedJCDForExecution)}
                    <div className="modern-jcd-requirements-modal">
                        {/* Header */}
                        <div className="requirements-header">
                            <div className="header-content">
                                <h2>Job Execution Requirements</h2>
                                <p>Review requirements before starting execution</p>
                            </div>
                            <button
                                className="close-button"
                                onClick={() => setIsShowJcdRequirements(false)}
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                    <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" />
                                </svg>
                            </button>
                        </div>

                        {/* Content */}
                        <div className="requirements-content">
                            <div className="requirements-grid">
                                <div className="requirement-card">
                                    <div className="requirement-icon">
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                            <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </div>
                                    <div className="requirement-info">
                                        <h3>Pre-Execution Image</h3>
                                        <p>Capture image before starting the job</p>
                                    </div>
                                    <div className={`requirement-status ${selectedJCDForExecution?.pre_execution_image_required == 1 ? 'required' : 'not-required'}`}>
                                        {selectedJCDForExecution?.pre_execution_image_required == 1 ? 'Required' : 'Not Required'}
                                    </div>
                                </div>

                                <div className="requirement-card">
                                    <div className="requirement-icon">
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                            <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </div>
                                    <div className="requirement-info">
                                        <h3>Post-Execution Image</h3>
                                        <p>Capture image after completing the job</p>
                                    </div>
                                    <div className={`requirement-status ${selectedJCDForExecution?.post_execution_image_required == 1 ? 'required' : 'not-required'}`}>
                                        {selectedJCDForExecution?.post_execution_image_required == 1 ? 'Required' : 'Not Required'}
                                    </div>
                                </div>

                                <div className="requirement-card">
                                    <div className="requirement-icon">
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                            <path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14v-4zM5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                                                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </div>
                                    <div className="requirement-info">
                                        <h3>Execution Video</h3>
                                        <p>Record video of the execution process</p>
                                    </div>
                                    <div className={`requirement-status ${selectedJCDForExecution?.video_of_execution_required == 1 ? 'required' : 'not-required'}`}>
                                        {selectedJCDForExecution?.video_of_execution_required == 1 ? 'Required' : 'Not Required'}
                                    </div>
                                </div>
                            </div>

                            {/* Additional Info */}
                            <div className="additional-info">
                                <div className="info-item">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                        <path d="M12 16v-4m0-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                    <span>Ensure all required media is captured for verification</span>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="requirements-footer">
                            <button
                                className="btn-secondary"
                                onClick={() => setIsShowJcdRequirements(false)}
                            >
                                Cancel
                            </button>
                            <button
                                className="btn-primary"
                                onClick={() => {
                                    // Handle start execution logic
                                    console.log('Starting execution...');
                                    setIsShowJcdRequirements(false);
                                }}
                            >
                                Start Execution
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add this popup component after the existing popups in your JCD_Page2 component */}
            {
                isAskForRequirementsAfterJobCompleted && (
                    <div className="modern-requirements-popup-overlay">
                        <div className="modern-requirements-popup">
                            {/* Header */}
                            <div className="requirements-popup-header">
                                <div className="header-content">
                                    <h2>Job Completion Requirements</h2>
                                    <p>Please provide all required media and files to complete this job</p>
                                </div>
                                <button
                                    className="close-button"
                                    onClick={() => setIsAskForRequirementsAfterJobCompleted(false)}
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                        <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" />
                                    </svg>
                                </button>
                            </div>

                            {/* Content */}
                            <div className="requirements-popup-content">
                                {/* Pre-Execution Image */}
                                {selectedJCDForExecution?.pre_execution_image_required == 1 && (
                                    <div className="requirement-section">
                                        <div className="requirement-header">
                                            <div className="requirement-title">
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={{ marginRight: '8px' }}>
                                                    <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                                        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                                <h3>Pre-Execution Image <span className="required-star">*</span></h3>
                                            </div>
                                            <span className="requirement-badge required">Required</span>
                                        </div>
                                        <p className="requirement-description">Capture image before starting the job execution</p>
                                        <div className="file-upload-area">
                                            <input
                                                type="file"
                                                id="pre-execution-image"
                                                accept="image/*"
                                                className="file-input"
                                                onChange={(e) => handleFileUpload('preImage', e.target.files[0])}
                                            />
                                            <label htmlFor="pre-execution-image" className="file-upload-label">
                                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" style={{ marginRight: '8px' }}>
                                                    <path d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                                        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                                Upload Pre-Execution Image
                                            </label>
                                            {uploadedFiles.preImage && (
                                                <div className="uploaded-file">
                                                    <span>✓ {uploadedFiles.preImage.name}</span>
                                                    <button onClick={() => removeUploadedFile('preImage')}>Remove</button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Post-Execution Image */}
                                {selectedJCDForExecution?.post_execution_image_required == 1 && (
                                    <div className="requirement-section">
                                        <div className="requirement-header">
                                            <div className="requirement-title">
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={{ marginRight: '8px' }}>
                                                    <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                                        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                                <h3>Post-Execution Image <span className="required-star">*</span></h3>
                                            </div>
                                            <span className="requirement-badge required">Required</span>
                                        </div>
                                        <p className="requirement-description">Capture image after completing the job execution</p>
                                        <div className="file-upload-area">
                                            <input
                                                type="file"
                                                id="post-execution-image"
                                                accept="image/*"
                                                className="file-input"
                                                onChange={(e) => handleFileUpload('postImage', e.target.files[0])}
                                            />
                                            <label htmlFor="post-execution-image" className="file-upload-label">
                                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" style={{ marginRight: '8px' }}>
                                                    <path d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                                        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                                Upload Post-Execution Image
                                            </label>
                                            {uploadedFiles.postImage && (
                                                <div className="uploaded-file">
                                                    <span>✓ {uploadedFiles.postImage.name}</span>
                                                    <button onClick={() => removeUploadedFile('postImage')}>Remove</button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Execution Video */}
                                {selectedJCDForExecution?.video_of_execution_required == 1 && (
                                    <div className="requirement-section">
                                        <div className="requirement-header">
                                            <div className="requirement-title">
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={{ marginRight: '8px' }}>
                                                    <path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14v-4zM5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                                                        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                                <h3>Execution Video <span className="required-star">*</span></h3>
                                            </div>
                                            <span className="requirement-badge required">Required</span>
                                        </div>
                                        <p className="requirement-description">Record video of the complete execution process</p>
                                        <div className="file-upload-area">
                                            <input
                                                type="file"
                                                id="execution-video"
                                                accept="video/*"
                                                className="file-input"
                                                onChange={(e) => handleFileUpload('video', e.target.files[0])}
                                            />
                                            <label htmlFor="execution-video" className="file-upload-label">
                                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" style={{ marginRight: '8px' }}>
                                                    <path d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                                        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                                Upload Execution Video
                                            </label>
                                            {uploadedFiles.video && (
                                                <div className="uploaded-file">
                                                    <span>✓ {uploadedFiles.video.name}</span>
                                                    <button onClick={() => removeUploadedFile('video')}>Remove</button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* PDF File */}
                                {selectedJCDForExecution?.pdf_file_for_execution_required == 1 && (
                                    <div className="requirement-section">
                                        <div className="requirement-header">
                                            <div className="requirement-title">
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={{ marginRight: '8px' }}>
                                                    <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                                        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                                <h3>PDF Document <span className="required-star">*</span></h3>
                                            </div>
                                            <span className="requirement-badge required">Required</span>
                                        </div>
                                        <p className="requirement-description">Upload PDF document related to this job</p>
                                        <div className="file-upload-area">
                                            <input
                                                type="file"
                                                id="pdf-file"
                                                accept=".pdf"
                                                className="file-input"
                                                onChange={(e) => handleFileUpload('document', e.target.files[0])}
                                            />
                                            <label htmlFor="pdf-file" className="file-upload-label">
                                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" style={{ marginRight: '8px' }}>
                                                    <path d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                                        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                                Upload PDF Document
                                            </label>
                                            {uploadedFiles.document && (
                                                <div className="uploaded-file">
                                                    <span>✓ {uploadedFiles.document.name}</span>
                                                    <button onClick={() => removeUploadedFile('document')}>Remove</button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Validation Message */}
                                {!areAllRequirementsFilled() && (
                                    <div className="validation-message">
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ marginRight: '8px' }}>
                                            <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                        Please complete all required fields marked with <span className="required-star">*</span>
                                    </div>
                                )}
                            </div>

                            {/* Footer */}
                            <div className="requirements-popup-footer">
                                <button
                                    className="btn-secondary"
                                    onClick={() => {
                                        setIsAskForRequirementsAfterJobCompleted(false);
                                        setUploadedFiles({
                                            preImage: null,
                                            postImage: null,
                                            video: null,
                                            document: null
                                        });
                                    }}
                                >
                                    Cancel
                                </button>
                                <button
                                    className="btn-primary"
                                    onClick={async () => {
                                        await handleJobCompletion()
                                    }}
                                    disabled={!areAllRequirementsFilled()}
                                >
                                    Complete Job
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Acknowledgment Popup */}
            {isAcknowledgePopupOpen && selectedJobForAcknowledgment && (
                <div className="modern-popup-overlay">
                    <div className="modern-popup">
                        <div className="popup-header">
                            <h2>Confirm Acknowledgment</h2>
                            <button
                                className="close-button"
                                onClick={() => {
                                    setIsAcknowledgePopupOpen(false);
                                    setSelectedJobForAcknowledgment(null);
                                }}
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                    <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" />
                                </svg>
                            </button>
                        </div>

                        <div className="popup-content">
                            <p>Are you sure you want to acknowledge this job?</p>
                            <div className="job-details">
                                <p><strong>Job:</strong> {selectedJCDForExecution?.jcd_name}</p>
                                <p><strong>Ship:</strong> {shipsList.find(s => s.SHA_ID === selectedJobForAcknowledgment.SHA_ID)?.ship_name}</p>
                                <p><strong>Role:</strong> {acknowledgmentType === 'primary' ? 'Primary' : 'Secondary'} Assignee</p>
                            </div>
                        </div>

                        <div className="popup-footer">
                            <button
                                className="btn-secondary"
                                onClick={() => {
                                    setIsAcknowledgePopupOpen(false);
                                    setSelectedJobForAcknowledgment(null);
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                className="btn-primary"
                                onClick={() => handleAcknowledgeJob(selectedJobForAcknowledgment, acknowledgmentType)}
                            >
                                Confirm Acknowledgment
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Media Preview Popup */}
            {isMediaPreviewOpen && previewMedia && (
                <div className="media-preview-overlay" onClick={closeMediaPreview}>
                    <div className="media-preview-container" onClick={(e) => e.stopPropagation()}>
                        {/* Header */}
                        <div className="media-preview-header">
                            <div className="media-info">
                                {previewMedia?.groupName ? (
                                    <>
                                        <div className="media-icon">🖼️</div>
                                        <span className="media-name">{previewMedia.groupName}</span>
                                    </>
                                ) : (
                                    <>
                                        <div className="media-icon">
                                            {previewMedia?.type === 'image' && '🖼️'}
                                            {previewMedia?.type === 'video' && '🎥'}
                                            {previewMedia?.type === 'pdf' && '📄'}
                                        </div>
                                        <span className="media-name">{previewMedia?.name}</span>
                                    </>
                                )}
                            </div>
                            <div className="media-controls">
                                <button className="download-btn" onClick={handleDownload} title="Download">
                                    ⬇️
                                </button>
                                <button className="close-preview-btn" onClick={closeMediaPreview} title="Close">
                                    ×
                                </button>
                            </div>
                        </div>

                        {/* Media Content */}
                        <div className="media-content">
                            {isLoading && (
                                <div className="media-loading">
                                    <div className="loading-spinner"></div>
                                    <span>Loading media...</span>
                                </div>
                            )}

                            {mediaError && (
                                <div className="media-error">
                                    <div className="error-icon">⚠️</div>
                                    <span>Failed to load media</span>
                                </div>
                            )}

                            {!mediaError && (
                                <>
                                    {/* For grouped images */}
                                    {previewMedia?.type === 'group' && previewMedia.mediaList && (
                                        <img
                                            src={previewMedia.mediaList[currentMediaIndex]?.url}
                                            alt={`${previewMedia.groupName} - ${currentMediaIndex + 1}`}
                                            className={`preview-image ${isZoomed ? 'zoomed' : ''}`}
                                            style={{ transform: `scale(${zoomLevel})` }}
                                            onClick={toggleZoom}
                                            onLoad={handleMediaLoad}
                                            onError={handleMediaError}
                                        />
                                    )}

                                    {/* For single files */}
                                    {previewMedia?.type !== 'group' && (
                                        <>
                                            {previewMedia?.type === 'image' && (
                                                <img
                                                    src={previewMedia.url}
                                                    alt="Preview"
                                                    className={`preview-image ${isZoomed ? 'zoomed' : ''}`}
                                                    style={{ transform: `scale(${zoomLevel})` }}
                                                    onClick={toggleZoom}
                                                    onLoad={handleMediaLoad}
                                                    onError={handleMediaError}
                                                />
                                            )}

                                            {previewMedia?.type === 'video' && (
                                                <video
                                                    src={previewMedia.url}
                                                    controls
                                                    className="preview-video"
                                                    onLoadStart={handleMediaLoad}
                                                    onError={handleMediaError}
                                                />
                                            )}

                                            {previewMedia?.type === 'pdf' && (
                                                <iframe
                                                    src={previewMedia.url}
                                                    className="preview-pdf"
                                                    onLoad={handleMediaLoad}
                                                    onError={handleMediaError}
                                                    title="PDF Preview"
                                                />
                                            )}
                                        </>
                                    )}
                                </>
                            )}

                            {/* Zoom Controls (only for images) */}
                            {(previewMedia?.type === 'image' || previewMedia?.type === 'group') && !isLoading && !mediaError && (
                                <div className="zoom-controls">
                                    <button
                                        className="zoom-btn"
                                        onClick={() => handleZoom('out')}
                                        disabled={zoomLevel <= 0.5}
                                    >
                                        −
                                    </button>
                                    <div className="zoom-level">{Math.round(zoomLevel * 100)}%</div>
                                    <button
                                        className="zoom-btn"
                                        onClick={() => handleZoom('in')}
                                        disabled={zoomLevel >= 3}
                                    >
                                        +
                                    </button>
                                    <button
                                        className="zoom-btn"
                                        onClick={() => handleZoom('reset')}
                                    >
                                        ↺
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Navigation - Show only for grouped images */}
                        {previewMedia?.type === 'group' && previewMedia.mediaList && previewMedia.mediaList.length > 1 && (
                            <div className="media-navigation">
                                <button
                                    className="nav-btn"
                                    onClick={() => navigateMedia('prev')}
                                    disabled={currentMediaIndex === 0}
                                >
                                    ←
                                </button>

                                <div className="media-counter">
                                    {currentMediaIndex + 1} / {previewMedia.mediaList.length}
                                </div>

                                <button
                                    className="nav-btn"
                                    onClick={() => navigateMedia('next')}
                                    disabled={currentMediaIndex === previewMedia.mediaList.length - 1}
                                >
                                    →
                                </button>
                            </div>
                        )}

                        {/* Thumbnails - Show only for grouped images */}
                        {previewMedia?.type === 'group' && previewMedia.mediaList && previewMedia.mediaList.length > 1 && (
                            <div className="media-thumbnails">
                                {previewMedia.mediaList.map((media, index) => (
                                    <img
                                        key={index}
                                        src={media.url}
                                        alt={`Thumbnail ${index + 1}`}
                                        className={`thumbnail ${index === currentMediaIndex ? 'active' : ''}`}
                                        onClick={() => {
                                            setCurrentMediaIndex(index);
                                            resetMediaState();
                                        }}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Job Completion Confirmation Popup */}
            {showCompletionConfirmation && (
                <div className="modern-requirements-popup-overlay" style={{ zIndex: '999999999999' }}>
                    <div className="modern-requirements-popup" style={{ maxWidth: '1000px', maxHeight: '90vh' }}>
                        <div className="requirements-popup-header">
                            <div className="header-content">
                                <h2>Confirm Job Completion</h2>
                                <p>Please review all details before completing the job</p>
                            </div>
                            <button
                                className="close-button"
                                onClick={() => setShowCompletionConfirmation(false)}
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                    <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" />
                                </svg>
                            </button>
                        </div>

                        <div className="confirmation-content">
                            {/* Enhanced Job Information */}
                            <div className="confirmation-section">
                                <h3 className="section-title">Job Information</h3>
                                <div className="info-grid-enhanced">
                                    <div className="info-row">
                                        <div className="info-item">
                                            <span className="info-label">Job ID:</span>
                                            <span className="info-value">{selectedJobForExecution?.JPHA_ID || 'N/A'}</span>
                                        </div>
                                        <div className="info-item">
                                            <span className="info-label">JCD Name:</span>
                                            <span className="info-value">{selectedJCDForExecution?.jcd_name || 'N/A'}</span>
                                        </div>
                                    </div>
                                    <div className="info-row">
                                        <div className="info-item">
                                            <span className="info-label">Generated On:</span>
                                            <span className="info-value">
                                                {selectedJobForExecution?.generated_on
                                                    ? new Date(selectedJobForExecution.generated_on).toLocaleDateString()
                                                    : 'N/A'}
                                            </span>
                                        </div>
                                        <div className="info-item">
                                            <span className="info-label">Executed By:</span>
                                            <span className="info-value">{user?.emp_name || 'N/A'}</span>
                                        </div>
                                    </div>
                                    <div className="info-row">
                                        <div className="info-item">
                                            <span className="info-label">Component:</span>
                                            <span className="info-value">
                                                {(() => {
                                                    const info = getComponentHierarchyForJCD(selectedJCDForExecution);
                                                    return info ? `${info.component_name || 'No#'}` : 'N/A';
                                                })()}
                                            </span>
                                        </div>
                                        <div className="info-item">
                                            <span className="info-label">Criticality:</span>
                                            <span className={`info-value ${selectedJCDForExecution?.criticality == 1 ? 'critical' : 'normal'}`}>
                                                {selectedJCDForExecution?.criticality == 1 ? 'Critical' : 'Normal'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Enhanced Uploaded Files Section with Previews */}
                            <div className="confirmation-section">
                                <h3 className="section-title">Uploaded Files</h3>
                                <div className="uploads-preview-grid">
                                    {/* Pre-Execution Image */}
                                    {selectedJCDForExecution?.pre_execution_image_required === 1 && (
                                        <div className="upload-preview-item">
                                            <div className="preview-header">
                                                <span className="upload-label">Pre-Execution Images</span>
                                                <span className={`upload-status ${uploadedFiles.preImage.length > 0 ? 'uploaded' : 'missing'}`}>
                                                    {uploadedFiles.preImage.length > 0 ? `✅ Uploaded (${uploadedFiles.preImage.length})` : '❌ Missing'}
                                                </span>
                                            </div>
                                            {uploadedFiles.preImage.length > 0 ? (
                                                <div className="multiple-file-preview-container">
                                                    {uploadedFiles.preImage.map((file, index) => (
                                                        <div key={index} className="file-preview-wrapper">
                                                            <div className="preview-wrapper">
                                                                <img
                                                                    src={file.previewUrl}
                                                                    alt={`Pre-Execution ${index + 1}`}
                                                                    className="file-preview"
                                                                    onClick={() => openMediaPreview(file, 'preImage', index)}
                                                                />
                                                                <div className="preview-overlay">
                                                                    <button
                                                                        className="preview-btn"
                                                                        onClick={() => openMediaPreview(file, 'preImage', index)}
                                                                    >
                                                                        👁️ View
                                                                    </button>
                                                                </div>
                                                            </div>
                                                            <div className="file-info">
                                                                <span className="file-name">Image {index + 1}</span>
                                                                <span className="file-size">
                                                                    {(file.file.size / 1024 / 1024).toFixed(2)} MB
                                                                </span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="file-missing">
                                                    <span>No files uploaded</span>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Post-Execution Image */}
                                    {selectedJCDForExecution?.post_execution_image_required === 1 && (
                                        <div className="upload-preview-item">
                                            <div className="preview-header">
                                                <span className="upload-label">Post-Execution Images</span>
                                                <span className={`upload-status ${uploadedFiles.postImage.length > 0 ? 'uploaded' : 'missing'}`}>
                                                    {uploadedFiles.postImage.length > 0 ? `✅ Uploaded (${uploadedFiles.postImage.length})` : '❌ Missing'}
                                                </span>
                                            </div>
                                            {uploadedFiles.postImage.length > 0 ? (
                                                <div className="multiple-file-preview-container">
                                                    {uploadedFiles.postImage.map((file, index) => (
                                                        <div key={index} className="file-preview-wrapper">
                                                            <div className="preview-wrapper">
                                                                <img
                                                                    src={file.previewUrl}
                                                                    alt={`Post-Execution ${index + 1}`}
                                                                    className="file-preview"
                                                                    onClick={() => openMediaPreview(file, 'postImage', index)}
                                                                />
                                                                <div className="preview-overlay">
                                                                    <button
                                                                        className="preview-btn"
                                                                        onClick={() => openMediaPreview(file, 'postImage', index)}
                                                                    >
                                                                        👁️ View
                                                                    </button>
                                                                </div>
                                                            </div>
                                                            <div className="file-info">
                                                                <span className="file-name">Image {index + 1}</span>
                                                                <span className="file-size">
                                                                    {(file.file.size / 1024 / 1024).toFixed(2)} MB
                                                                </span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="file-missing">
                                                    <span>No files uploaded</span>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Execution Video */}
                                    {selectedJCDForExecution?.video_of_execution_required === 1 && (
                                        <div className="upload-preview-item">
                                            <div className="preview-header">
                                                <span className="upload-label">Execution Video</span>
                                                <span className={`upload-status ${uploadedFiles.video ? 'uploaded' : 'missing'}`}>
                                                    {uploadedFiles.video ? '✅ Uploaded' : '❌ Missing'}
                                                </span>
                                            </div>
                                            {uploadedFiles.video ? (
                                                <div className="file-preview-container">
                                                    <div className="preview-wrapper">
                                                        <video
                                                            src={uploadedFiles.video.previewUrl}
                                                            className="file-preview video-preview"
                                                            onClick={() => openMediaPreview(uploadedFiles.video)}
                                                        />
                                                        <div className="preview-overlay">
                                                            <button
                                                                className="preview-btn"
                                                                onClick={() => openMediaPreview(uploadedFiles.video)}
                                                            >
                                                                ▶️ Play
                                                            </button>
                                                        </div>
                                                    </div>
                                                    <div className="file-info">
                                                        <span className="file-name">{uploadedFiles.video.name}</span>
                                                        <span className="file-size">
                                                            {(uploadedFiles.video.file.size / 1024 / 1024).toFixed(2)} MB
                                                        </span>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="file-missing">
                                                    <span>No file uploaded</span>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* PDF Document */}
                                    {selectedJCDForExecution?.pdf_file_for_execution_required === 1 && (
                                        <div className="upload-preview-item">
                                            <div className="preview-header">
                                                <span className="upload-label">PDF Document</span>
                                                <span className={`upload-status ${uploadedFiles.document ? 'uploaded' : 'missing'}`}>
                                                    {uploadedFiles.document ? '✅ Uploaded' : '❌ Missing'}
                                                </span>
                                            </div>
                                            {uploadedFiles.document ? (
                                                <div className="file-preview-container">
                                                    <div className="preview-wrapper pdf-preview">
                                                        <div
                                                            className="pdf-preview-content"
                                                            onClick={() => openMediaPreview(uploadedFiles.document)}
                                                        >
                                                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                                                                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="currentColor" strokeWidth="2" />
                                                                <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke="currentColor" strokeWidth="2" />
                                                            </svg>
                                                            <span>PDF Document</span>
                                                        </div>
                                                        <div className="preview-overlay">
                                                            <button
                                                                className="preview-btn"
                                                                onClick={() => openMediaPreview(uploadedFiles.document)}
                                                            >
                                                                📄 View
                                                            </button>
                                                        </div>
                                                    </div>
                                                    <div className="file-info">
                                                        <span className="file-name">{uploadedFiles.document.name}</span>
                                                        <span className="file-size">
                                                            {(uploadedFiles.document.file.size / 1024 / 1024).toFixed(2)} MB
                                                        </span>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="file-missing">
                                                    <span>No file uploaded</span>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Consumable Spares Summary */}
                            <div className="confirmation-section">
                                <h3 className="section-title">Consumable Spares Used</h3>
                                <div className="spares-summary">
                                    {consumableSpares.filter(spare => spare.name && spare.quantity > 0).length > 0 ? (
                                        <div className="spares-list-enhanced">
                                            <div className="spares-header">
                                                <span>Spare Name</span>
                                                <span>Quantity</span>
                                            </div>
                                            {consumableSpares
                                                .filter(spare => spare.name && spare.quantity > 0)
                                                .map((spare, index) => (
                                                    <div key={index} className="spare-item-enhanced">
                                                        <span className="spare-name">{spare.name}</span>
                                                        <span className="spare-quantity">{spare.quantity} units</span>
                                                    </div>
                                                ))}
                                            <div className="spares-total-enhanced">
                                                <span>Total Spares: {consumableSpares.filter(spare => spare.name && spare.quantity > 0).length}</span>
                                                <span>Total Quantity: {consumableSpares.reduce((sum, spare) => sum + (spare.quantity || 0), 0)} units</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="no-spares-enhanced">
                                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                                <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                                    stroke="currentColor" strokeWidth="2" />
                                            </svg>
                                            <span>No consumable spares recorded</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Notes Summary */}
                            <div className="confirmation-section">
                                <h3 className="section-title">Documentation</h3>
                                <div className="notes-summary-enhanced">
                                    <div className="note-item-enhanced">
                                        <div className="note-header">
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                                <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                                                    stroke="currentColor" strokeWidth="2" />
                                            </svg>
                                            <span className="note-label">Service Notes</span>
                                            <span className={`word-count-badge ${isServiceNoteValid() ? 'valid' : 'invalid'}`}>
                                                {serviceNote.split(/\s+/).filter(word => word.length > 0).length}/100 words
                                            </span>
                                        </div>
                                        <div className="note-content-enhanced">
                                            <p>{serviceNote || 'No service notes provided'}</p>
                                        </div>
                                    </div>

                                    {user.emp_type == 2 && (
                                        <div className="note-item-enhanced">
                                            <div className="note-header">
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                                    <path d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
                                                        stroke="currentColor" strokeWidth="2" />
                                                </svg>
                                                <span className="note-label">Remarks</span>
                                                <span className={`word-count-badge ${isRemarksValid() ? 'valid' : 'invalid'}`}>
                                                    {remarks.split(/\s+/).filter(word => word.length > 0).length}/100 words
                                                </span>
                                            </div>
                                            <div className="note-content-enhanced">
                                                <p>{remarks || 'No remarks provided'}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="requirements-popup-footer">
                            <div className="footer-actions">
                                <button
                                    className="btn-secondary"
                                    onClick={() => setShowCompletionConfirmation(false)}
                                >
                                    Back to Edit
                                </button>

                                <button
                                    className="btn-primary"
                                    onClick={async () => {
                                        setShowCompletionConfirmation(false);
                                        await handleJobCompletion();
                                    }}
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ marginRight: '8px' }}>
                                        <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                    Confirm & Complete Job
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div >
    );
};

export default JCD_Page2;
// localhost