import React, { useContext, useEffect, useRef, useState, useCallback, useMemo, lazy, Suspense } from 'react';
import './MovementLogPage.css';
import '../JCD_Page/JCD_Page.css';
import { ComponentTreeContext } from '../../contexts/ComponentTreeContext/ComponentTreeContext';
import { ShipHeaderContext } from '../../contexts/ship_header_context/ShipHeaderContext';
import { UserAuthContext } from '../../contexts/userAuth/UserAuthContext';
import { Profile_header_context } from '../../contexts/profile_header_context/Profile_header_context';
import { Movement_log_header_context } from '../../contexts/movementLogContext/Movement_log_header_context';
import axios from 'axios';
import Loading from '../../components/LoadingCompo/Loading'; // Import your Loading component
import { DesignationContext } from '../../contexts/Designation_context/DesignationContext';
import { OfficeStaffCombination_Context } from '../../contexts/OfficeStaffCombinationContext/OfficeStaffCombination_Context';

// Lazy load heavy components
const ComponentTree = lazy(() => import('../../components/ComponentTree/ComponentTree'));
const TempComponentHierarchy = lazy(() => import('../temp_component_heirarchy/Temp_component_heirarchy'));

// Debounce utility function
const debounce = (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
};

// Enhanced TransactionCalendar component with month navigation
const TransactionCalendar = ({ transactions, movementLog }) => {
    const [currentMonthIndex, setCurrentMonthIndex] = useState(0);

    console.log('TransactionCalendar received:', {
        transactionsCount: transactions?.length,
        transactions: transactions,
        movementLog
    });

    if (!transactions || transactions.length === 0) {
        return (
            <div className="no-transaction-data">
                <p>No transaction data available</p>
            </div>
        );
    }

    // Sort transactions by month_year in descending order (newest first)
    const sortedTransactions = [...transactions].sort((a, b) => {
        const [aMonth, aYear] = a.month_year.split('_').map(Number);
        const [bMonth, bYear] = b.month_year.split('_').map(Number);

        if (aYear !== bYear) return bYear - aYear;
        return bMonth - aMonth;
    });

    const currentTransaction = sortedTransactions[currentMonthIndex];

    const handlePreviousMonth = () => {
        setCurrentMonthIndex(prev => Math.max(0, prev - 1));
    };

    const handleNextMonth = () => {
        setCurrentMonthIndex(prev => Math.min(sortedTransactions.length - 1, prev + 1));
    };

    const handleMonthSelect = (index) => {
        setCurrentMonthIndex(index);
    };

    return (
        <div className="transaction-calendar-container">
            {/* Month Navigation Header */}
            <div className="calendar-navigation">
                <button
                    className="nav-button prev"
                    onClick={handlePreviousMonth}
                    disabled={currentMonthIndex === 0}
                >
                    ◀ Previous
                </button>

                <div className="month-selector">
                    <select
                        value={currentMonthIndex}
                        onChange={(e) => handleMonthSelect(parseInt(e.target.value))}
                        className="month-dropdown"
                    >
                        {sortedTransactions.map((transaction, index) => {
                            const [month, year] = transaction.month_year.split('_').map(Number);
                            const monthNames = [
                                'January', 'February', 'March', 'April', 'May', 'June',
                                'July', 'August', 'September', 'October', 'November', 'December'
                            ];
                            return (
                                <option key={transaction.SMLTA_ID} value={index}>
                                    {monthNames[month - 1]} {year}
                                </option>
                            );
                        })}
                    </select>
                    <span className="month-counter">
                        ({currentMonthIndex + 1} of {sortedTransactions.length})
                    </span>
                </div>

                <button
                    className="nav-button next"
                    onClick={handleNextMonth}
                    disabled={currentMonthIndex === sortedTransactions.length - 1}
                >
                    Next ▶
                </button>
            </div>

            {/* Calendar for current month */}
            <SingleMonthCalendar
                transaction={currentTransaction}
                movementLog={movementLog}
                transactionIndex={currentMonthIndex}
                totalTransactions={sortedTransactions.length}
            />

            {/* Quick Month Overview */}
            <div className="months-overview">
                <h4>All Months with Data</h4>
                <div className="months-grid">
                    {sortedTransactions.map((transaction, index) => {
                        const [month, year] = transaction.month_year.split('_').map(Number);
                        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                        const daysWithData = Object.keys(transaction).filter(key =>
                            key.startsWith('Day_') && transaction[key]
                        ).length;

                        return (
                            <div
                                key={transaction.SMLTA_ID}
                                className={`month-chip ${index === currentMonthIndex ? 'active' : ''}`}
                                onClick={() => handleMonthSelect(index)}
                            >
                                <div className="month-name">{monthNames[month - 1]} {year}</div>
                                <div className="data-days">{daysWithData} days</div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

// Single Month Calendar Component
const SingleMonthCalendar = ({ transaction, movementLog, transactionIndex, totalTransactions }) => {
    if (!transaction || !transaction.month_year) {
        return <div className="no-transaction-data">No transaction data available for this month</div>;
    }

    const [month, year] = transaction.month_year.split('_').map(Number);

    // Validate month and year
    if (isNaN(month) || isNaN(year) || month < 1 || month > 12) {
        return (
            <div className="invalid-transaction-data">
                <p>Invalid transaction data format</p>
                <p>Month: {month}, Year: {year}</p>
            </div>
        );
    }

    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    // Get the first day of the month and number of days
    const firstDay = new Date(year, month - 1, 1).getDay();
    const daysInMonth = new Date(year, month, 0).getDate();
    const today = new Date();

    // Check if current day is in the viewed month
    const isCurrentMonth = today.getMonth() + 1 === month && today.getFullYear() === year;

    // Generate calendar days
    const calendarDays = [];

    // Add empty cells for days before the first day of month
    for (let i = 0; i < firstDay; i++) {
        calendarDays.push({ day: null, data: null });
    }

    // Add actual days of the month
    for (let day = 1; day <= daysInMonth; day++) {
        const dayKey = `Day_${day}`;
        const dayData = transaction[dayKey];

        calendarDays.push({
            day,
            data: dayData,
            isToday: isCurrentMonth && day === today.getDate()
        });
    }

    // Calculate summary statistics
    const daysWithData = Object.keys(transaction).filter(key =>
        key.startsWith('Day_') && transaction[key]
    ).length;

    const totalHours = transaction.increment_hr_value || 0;
    const totalNauticalMiles = transaction.increment_km_value || 0;

    return (
        <div className="single-month-calendar">
            <div className="calendar-header">
                <h3>{monthNames[month - 1]} {year}</h3>
                <p className="movement-log-name">Movement Log: {movementLog?.display_name}</p>
                <p className="transaction-meta">
                    Transaction {transactionIndex + 1} of {totalTransactions} •
                    ID: {transaction.SMLTA_ID} •
                    Updated: {new Date(transaction.Inserted_on).toLocaleDateString()}
                </p>
            </div>

            <div className="calendar-grid">
                {/* Day headers */}
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="calendar-day-header">{day}</div>
                ))}

                {/* Calendar days */}
                {calendarDays.map((calendarDay, index) => (
                    <div
                        key={index}
                        className={`calendar-day-cell ${calendarDay.day ? 'has-day' : 'empty'
                            } ${calendarDay.isToday ? 'today' : ''} ${calendarDay.data ? 'has-data' : 'no-data'
                            }`}
                    >
                        {calendarDay.day && (
                            <>
                                <div className="day-number">{calendarDay.day}</div>
                                {calendarDay.data && (
                                    <div className="day-data">
                                        {calendarDay.data.split('=').map((value, idx) => (
                                            <div key={idx} className="data-item">
                                                <span className="data-label">
                                                    {idx === 0 ? 'HR' : 'NM'}
                                                </span>
                                                <span className="data-value">{value}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {calendarDay.isToday && (
                                    <div className="today-indicator">Today</div>
                                )}
                            </>
                        )}
                    </div>
                ))}
            </div>

            {/* Legend */}
            {/* <div className="calendar-legend">
                    <div className="legend-item">
                        <div className="legend-color today"></div>
                        <span>Today</span>
                    </div>
                    <div className="legend-item">
                        <div className="legend-color has-data"></div>
                        <span>Has Data</span>
                    </div>
                    <div className="legend-item">
                        <div className="legend-color no-data"></div>
                        <span>No Data</span>
                    </div>
                </div> */}

            {/* Summary */}
            <div className="transaction-summary">
                <h4>Monthly Summary</h4>
                <div className="summary-grid">
                    <div className="summary-item">
                        <span className="summary-label">Total Hours:</span>
                        <span className="summary-value">{totalHours}</span>
                    </div>
                    <div className="summary-item">
                        <span className="summary-label">Total Nautical Miles:</span>
                        <span className="summary-value">{totalNauticalMiles}</span>
                    </div>
                    <div className="summary-item">
                        <span className="summary-label">Days with Data:</span>
                        <span className="summary-value">{daysWithData} / {daysInMonth}</span>
                    </div>
                    <div className="summary-item">
                        <span className="summary-label">Data Coverage:</span>
                        <span className="summary-value">{Math.round((daysWithData / daysInMonth) * 100)}%</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

const MovementLogPage = () => {
    const API_BASE_URL = import.meta.env.VITE_API_URL;
    const formContainerRef = useRef(null);
    const [errors, setErrors] = useState({});

    const { user } = useContext(UserAuthContext);
    const { selectedNode, checkedNodes, clearCheckedNodes, toggleCheckedNode, refreshTree, tree } = useContext(ComponentTreeContext);
    const { shipsList } = useContext(ShipHeaderContext);
    const { profiles, refreshProfiles } = useContext(Profile_header_context);
    const { movement_log_header_list, refreshMovement_log_header_list } = useContext(Movement_log_header_context);
    const { designationList, refreshDesignationList } = useContext(DesignationContext)
    const { officeStaffList, refreshOfficeStaffList } = useContext(OfficeStaffCombination_Context);

    const [selectedShipIDs, setSelectedShipIDs] = useState([]);
    const [isCofigureMovementLogClicked, setIsCofigureMovementLogClicked] = useState(false);
    const [isViewMovementLogsClicked, setIsViewMovementLogsClicked] = useState(true);

    const [isTreeReady, setIsTreeReady] = useState(false);

    // See Ship Wise Transaction States
    const [isWantToSeeTransactions, setIsWantToSeeTransactions] = useState(false);
    const [selectedMovementLogTransactions, setSelectedMovementLogTransactions] = useState(null);
    const [transactionData, setTransactionData] = useState([]);
    const [isLoadingTransactions, setIsLoadingTransactions] = useState(false);

    // User access control
    const [userMLCAccessProcessIDs, setUserMLCAccessProcessIDs] = useState([]);

    // Movement log data state
    const [movement_log_header_data, setMovement_log_header_data] = useState({
        display_name: "",
        ship_ids: "",
        transaction_frequency: 0,
        initial_hours: 0,  // Changed from initial_reading
        initial_nautical_miles: 0,  // Changed from total_reading
        impact_data: [],
        responsible_desg_for_transactions: ''
    });

    const [movement_log_header_list_by_ship, setMovement_log_header_list_by_ship] = useState([]);
    const [selectedMovementLogHeaderData, setSelectedMovementLogHeaderData] = useState(null);
    const [wantToSeeAppliedComponentHeirarchyOnMovementLog, setWantToSeeAppliedComponentHeirarchyOnMovementLog] = useState(false);
    const [movementLogHierarchyData, setMovementLogHierarchyData] = useState(null);

    // Multiple loading states for different operations
    const [isLoading, setIsLoading] = useState(false);
    const [isFormSubmitting, setIsFormSubmitting] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [isViewingComponents, setIsViewingComponents] = useState(false);
    const [isTreeLoading, setIsTreeLoading] = useState(false);

    const [isLinkMovementLogModalOpen, setIsLinkMovementLogModalOpen] = useState(false);
    const [movementLogToLink, setMovementLogToLink] = useState(null);
    const [linkShipSelection, setLinkShipSelection] = useState([]);
    const [linkInitialHours, setLinkInitialHours] = useState(0);
    const [linkInitialNauticalMiles, setLinkInitialNauticalMiles] = useState(0);
    const [isLinking, setIsLinking] = useState(false);

    // Memoized values
    const memoizedShipsList = useMemo(() => {
        return officeStaffList
            .filter(staff => staff.user_id === user.UHA_ID)
            .flatMap(staff =>
                shipsList.filter(ship =>
                    staff.allocated_ships?.includes(ship.SHA_ID)
                )
            );
    }, [officeStaffList, shipsList, user.UHA_ID]);

    const memoizedProfiles = useMemo(() => profiles, [profiles]);
    const memoizedMovementLogHeaderList = useMemo(() => movement_log_header_list, [movement_log_header_list]);

    // Debounced API calls
    const debouncedRefreshMovementLogHeaderList = useCallback(
        debounce(() => refreshMovement_log_header_list(), 300),
        []
    );

    const debouncedRefreshTree = useCallback(
        debounce(() => refreshTree(), 300),
        []
    );

    // Initial data loading
    useEffect(() => {
        const loadInitialData = async () => {
            setIsLoading(true);
            try {
                await Promise.all([
                    debouncedRefreshMovementLogHeaderList(),
                    debouncedRefreshTree(),
                    refreshProfiles(),
                    refreshDesignationList(),
                    refreshOfficeStaffList()
                ]);
            } catch (error) {
                console.error('Error loading initial data:', error);
            } finally {
                setIsLoading(false);
            }
        };

        loadInitialData();
    }, []);

    useEffect(() => {
        console.log('selectedShipIDs :::: ', selectedShipIDs)
    }, [selectedShipIDs])

    useEffect(() => {
        if (isViewMovementLogsClicked == true) {
            resetMovementLogConfigForm()
        }
    }, [isViewMovementLogsClicked])

    const resetMovementLogConfigForm = useCallback(() => {
        clearCheckedNodes();
        setMovement_log_header_data({
            display_name: "",
            ship_ids: user?.emp_type === 1 ? user.ship_id : "",
            transaction_frequency: 0,
            initial_hours: 0,  // Fixed field name
            initial_nautical_miles: 0,  // Fixed field name
            impact_data: []
        });
        // Set selected ship IDs as array with single item
        if (user?.emp_type === 1) {
            setSelectedShipIDs([user.ship_id]);
        } else {
            setSelectedShipIDs([]);
        }
        setErrors({});
    }, [user, clearCheckedNodes]);

    // User effect with proper dependencies
    useEffect(() => {
        if (user) {
            trackFormProcessAccessibility(user, 'MLC');
            if (user.emp_type === 1) {
                setSelectedShipIDs([user.ship_id]);
                setMovement_log_header_data(prev => ({
                    ...prev,
                    ship_ids: user.ship_id
                }));
            }
        }
    }, [user, memoizedProfiles]);

    // Filter movement logs by ship - optimized
    useEffect(() => {
        if (memoizedMovementLogHeaderList && selectedShipIDs.length > 0) {
            const filteredLogs = memoizedMovementLogHeaderList.filter(log => {
                const logShipIds = log.ship_ids?.split(',') || [];
                return selectedShipIDs.some(shipId => logShipIds.includes(shipId)) && log.mov_log_status == 0;
            });
            setMovement_log_header_list_by_ship(filteredLogs);
        } else {
            setMovement_log_header_list_by_ship([]);
        }
    }, [memoizedMovementLogHeaderList, selectedShipIDs]);

    useEffect(() => {
        console.log('movement_log_header_data.ship_ids :: ', movement_log_header_data.ship_ids)
    }, [movement_log_header_data])

    // Memoized trackFormProcessAccessibility
    const trackFormProcessAccessibility = useCallback((loggedInUser, prefix) => {
        const profileIDs = loggedInUser.profile_ids?.split(',') || [];
        const matchedProfiles = profileIDs
            .map(id => memoizedProfiles?.find(profile => profile.PROFILE_ID === id))
            .filter(Boolean);

        if (matchedProfiles.length > 0) {
            const firstProfile = matchedProfiles[0];
            const processIDs = firstProfile.process_ids?.split(',').filter(id => id.includes(prefix)) || [];
            setUserMLCAccessProcessIDs(processIDs);
        }
    }, [memoizedProfiles]);

    // Memoized event handlers
    const handleShipSelection = useCallback((e) => {
        const selectedShipId = e.target.value; // Get single value, not array

        // If user selects empty option, clear the selection
        if (selectedShipId === '') {
            setSelectedShipIDs([]);
            setMovement_log_header_data(prev => ({
                ...prev,
                ship_ids: ''
            }));
        } else {
            setSelectedShipIDs([selectedShipId]); // Store as array with single item
            setMovement_log_header_data(prev => ({
                ...prev,
                ship_ids: selectedShipId // Store as single string, not CSV
            }));
        }

        // Clear ship_ids error when selection is made
        if (selectedShipId && errors.ship_ids) {
            setErrors(prev => ({ ...prev, ship_ids: undefined }));
        }
    }, [errors.ship_ids]);

    const prepareImpactData = useCallback(() => {
        console.log('=== PREPARE IMPACT DATA DEBUG ===');
        console.log('All checked nodes:', checkedNodes);

        const impactData = checkedNodes.map(node => {
            console.log('Processing node - Type:', node.type, 'Data:', node.data);

            let hierarchy = {
                ship_id: selectedShipIDs[0] || '',
                cat_id: '',
                sub_cat_id: null,
                second_sub_cat_id: null,
                third_sub_cat_id: null,
                component_no: node.data?.component_no || ''
            };

            // Extract IDs based on node type - ALWAYS USE IDs, NOT COMPONENT NUMBERS
            switch (node.type) {
                case 'category':
                    hierarchy.cat_id = node.data?.CHA_ID || node.id || '';
                    break;

                case 'sub_category':
                    hierarchy.cat_id = node.data?.cat_id || node.data?.CHA_ID || '';
                    hierarchy.sub_cat_id = node.data?.SCHA_ID || node.id || '';
                    break;

                case 'second_sub_category':
                    hierarchy.cat_id = node.data?.cat_id || node.data?.CHA_ID || '';
                    hierarchy.sub_cat_id = node.data?.sub_cat_id || node.data?.SCHA_ID || '';
                    hierarchy.second_sub_cat_id = node.data?.SSCHA_ID || node.id || '';
                    break;

                case 'third_sub_category':
                    hierarchy.cat_id = node.data?.cat_id || node.data?.CHA_ID || '';
                    hierarchy.sub_cat_id = node.data?.sub_cat_id || node.data?.SCHA_ID || '';
                    hierarchy.second_sub_cat_id = node.data?.second_sub_cat_id || node.data?.SSCHA_ID || '';
                    hierarchy.third_sub_cat_id = node.data?.TSCHA_ID || node.id || '';
                    break;

                default:
                    hierarchy.cat_id = node.data?.CHA_ID || '';
                    hierarchy.sub_cat_id = node.data?.SCHA_ID || null;
                    hierarchy.second_sub_cat_id = node.data?.SSCHA_ID || null;
                    hierarchy.third_sub_cat_id = node.data?.TSCHA_ID || null;
            }

            console.log('Extracted hierarchy (IDs only):', hierarchy);
            return hierarchy;

        }).filter(item => item.cat_id && item.cat_id !== '');

        console.log('Final impact data to send (IDs only):', impactData);
        return impactData;
    }, [checkedNodes, selectedShipIDs]);

    const handleOnSubmit = useCallback(async (e) => {
        e.preventDefault();
        setIsFormSubmitting(true);

        const newErrors = {};
        const displayName = e.target.display_name.value.trim();

        // Validation
        if (!displayName) {
            newErrors.display_name = "Movement Log Name is required.";
        }

        if (!movement_log_header_data.ship_ids) {
            newErrors.ship_ids = "At least one ship must be selected.";
        }

        if (checkedNodes.length === 0) {
            newErrors.components = "At least one component must be selected.";
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            setIsFormSubmitting(false);
            return;
        }

        try {
            // Debug: Log what we're about to send
            console.log('=== FORM SUBMISSION DEBUG ===');
            console.log('Selected ship IDs:', selectedShipIDs);
            console.log('Checked nodes count:', checkedNodes.length);

            const impact_data = prepareImpactData();

            console.log('Prepared impact data:', impact_data);

            // Validate that we have proper category IDs
            const invalidComponents = impact_data.filter(item => !item.cat_id || item.cat_id === '');
            if (invalidComponents.length > 0) {
                console.error('Invalid components found:', invalidComponents);
                alert('Some selected components are missing category information. Please reselect them.');
                setIsFormSubmitting(false);
                return;
            }

            const excludeId = movement_log_header_data.impact_data.length > 0
                ? movement_log_header_data.mov_log_id
                : undefined;

            const duplicateCheck = await axios.get(`${API_BASE_URL}checkMovementLogName`, {
                params: {
                    ship_ids: selectedShipIDs[0],
                    display_name: displayName,
                    exclude_mov_log_id: excludeId
                }
            });

            if (duplicateCheck.data.exists) {
                setErrors({ display_name: 'This name is already taken for the selected ships.' });
                setIsFormSubmitting(false);
                return;
            }

            // Extract initial readings from form data
            const initialHours = parseFloat(movement_log_header_data.initial_hours) || 0;
            const initialNauticalMiles = parseFloat(movement_log_header_data.initial_nautical_miles) || 0;

            console.log('Initial readings to send:', {
                initialHours,
                initialNauticalMiles
            });

            // FIX: Format the readings in the expected JSON array format for the backend
            // This matches the format: [{"SHA_0001":"1400:11"},{"SHA_0002":"1300:85"}]
            const initial_reading = selectedShipIDs.map(shipId => ({
                [shipId]: `${initialHours}:${initialNauticalMiles}`
            }));

            const total_reading = selectedShipIDs.map(shipId => ({
                [shipId]: `${initialHours}:${initialNauticalMiles}`
            }));

            console.log('Formatted readings for backend:', {
                initial_reading,
                total_reading
            });

            const finalPayload = {
                ...movement_log_header_data,
                display_name: displayName,
                inserted_by: user.UHA_ID,
                impact_data: impact_data,
                // FIX: Send the readings in the correct format expected by backend
                initial_reading: JSON.stringify(initial_reading),
                total_reading: JSON.stringify(total_reading),
                // Also keep the separate fields for form state management
                initial_hours: initialHours,
                initial_nautical_miles: initialNauticalMiles
            };

            console.log('Final payload to send:', finalPayload);

            let response;
            const isEditMode = movement_log_header_data.impact_data.length > 0 && movement_log_header_data.mov_log_id;

            if (isEditMode) {
                response = await axios.put(
                    `${API_BASE_URL}updateMovementLogHeader/${movement_log_header_data.mov_log_id}`,
                    finalPayload
                );
            } else {
                response = await axios.post(
                    `${API_BASE_URL}createMovementLogHeader`,
                    finalPayload
                );
            }

            if (response.data.success) {
                console.log('Movement log created successfully:', response.data);
                resetMovementLogConfigForm();
                refreshMovement_log_header_list();
                setIsViewMovementLogsClicked(true);
                setIsCofigureMovementLogClicked(false);
            } else {
                throw new Error(response.data.message);
            }
        } catch (error) {
            console.error('Error processing movement log:', error);
            alert(`Error ${movement_log_header_data.impact_data.length > 0 ? 'updating' : 'creating'} movement log. Please try again.`);
        } finally {
            setIsFormSubmitting(false);
        }
    }, [movement_log_header_data, checkedNodes, user, prepareImpactData, API_BASE_URL]);

    // Optimized node selection functions
    const buildNodeIdFromComponent = useCallback((component) => {
        if (component.third_sub_cat_id) {
            return `${component.third_sub_cat_id}`;
        } else if (component.second_sub_cat_id) {
            return `${component.second_sub_cat_id}`;
        } else if (component.sub_cat_id) {
            return `${component.sub_cat_id}`;
        } else if (component.cat_id) {
            return `${component.cat_id}`;
        }
        return null;
    }, []);

    const findAndSelectNodeInTree = useCallback((nodes, targetNodeId) => {
        if (!Array.isArray(nodes) || !targetNodeId) return false;

        for (const node of nodes) {
            if (node.id === targetNodeId || node.data?.component_no === targetNodeId) {
                toggleCheckedNode(node);
                return true;
            }

            if (node.children && node.children.length > 0) {
                if (findAndSelectNodeInTree(node.children, targetNodeId)) {
                    return true;
                }
            }
        }
        return false;
    }, [toggleCheckedNode]);

    const preSelectNodesForEdit = useCallback((components) => {
        if (!components?.length || !tree) return;

        // Clear existing selections first
        clearCheckedNodes();

        // Use a small delay to ensure tree is rendered
        setTimeout(() => {
            let selectedCount = 0;
            components.forEach(component => {
                const nodeId = buildNodeIdFromComponent(component);
                if (nodeId && findAndSelectNodeInTree(tree, nodeId)) {
                    selectedCount++;
                }
            });

            console.log(`Pre-selected ${selectedCount} out of ${components.length} components`);

            if (selectedCount === 0) {
                console.warn('No components could be pre-selected. Tree might not be loaded yet.');
            }
        }, 1000);
    }, [buildNodeIdFromComponent, findAndSelectNodeInTree, tree, clearCheckedNodes]);

    const handleOnEditMovementLogHeader = useCallback(async (movement_log_data) => {
        try {
            clearCheckedNodes();
            setIsEditing(true);

            // Get the current ship ID from selection
            const currentShipId = selectedShipIDs[0];

            if (!currentShipId) {
                alert('Please select a ship first');
                setIsEditing(false);
                return;
            }

            // Pass the current ship ID to the API to get only components for this ship
            const response = await axios.get(
                `${API_BASE_URL}getMovementLogWithComponents/${movement_log_data.mov_log_id}?ship_id=${currentShipId}`
            );

            const fullData = response.data;

            console.log('Full movement log data:', fullData);

            // Parse the initial_reading JSON string to extract readings for the current ship
            let initialHours = 0;
            let initialNauticalMiles = 0;

            try {
                if (fullData.initial_reading) {
                    console.log('Raw initial_reading from API:', fullData.initial_reading);

                    let initialReadings;
                    // Handle both string and already-parsed JSON
                    if (typeof fullData.initial_reading === 'string') {
                        initialReadings = JSON.parse(fullData.initial_reading);
                    } else {
                        initialReadings = fullData.initial_reading;
                    }

                    console.log('Parsed initial readings:', initialReadings);

                    // Find the reading for the current ship
                    const currentShipReading = initialReadings.find(reading => {
                        const shipId = Object.keys(reading)[0];
                        return shipId === currentShipId;
                    });

                    if (currentShipReading) {
                        const readingValue = currentShipReading[currentShipId];
                        console.log('Reading value for current ship:', readingValue);

                        if (readingValue && typeof readingValue === 'string') {
                            const [hours, miles] = readingValue.split(':');
                            initialHours = parseFloat(hours) || 0;
                            initialNauticalMiles = parseFloat(miles) || 0;
                        }
                    } else {
                        console.warn('No reading found for current ship:', currentShipId);
                    }
                } else {
                    console.warn('No initial_reading found in response');
                }
            } catch (parseError) {
                console.error('Error parsing initial readings:', parseError);
                console.error('Problematic initial_reading:', fullData.initial_reading);
            }

            console.log('Extracted readings for ship', currentShipId, ':', {
                initialHours,
                initialNauticalMiles
            });

            // Set the movement log data with parsed readings
            setMovement_log_header_data({
                mov_log_id: fullData.mov_log_id,
                display_name: fullData.display_name,
                ship_ids: fullData.ship_ids,
                transaction_frequency: fullData.transaction_frequency || 0,
                initial_hours: initialHours,
                initial_nautical_miles: initialNauticalMiles,
                impact_data: fullData.components || []
            });

            setIsViewMovementLogsClicked(false);
            setIsCofigureMovementLogClicked(true);

            setTimeout(() => {
                if (fullData.components && fullData.components.length > 0) {
                    preSelectNodesForEdit(fullData.components);
                }
            }, 1000);

        } catch (error) {
            console.error('Error fetching movement log details:', error);
            alert('Error loading movement log data. Please try again.');
        } finally {
            setIsEditing(false);
        }
    }, [API_BASE_URL, clearCheckedNodes, preSelectNodesForEdit, selectedShipIDs]);

    const handleSuspendMovementLog = useCallback(async (mov_log_id, ship_id) => {
        if (!confirm('Are you sure you want to suspend this movement log?')) return;

        try {
            setIsLoading(true);
            // console.log('selectedShipIDs to suspend :: ', selectedShipIDs)
            const response = await axios.put(
                `${API_BASE_URL}suspendMovementLog/${mov_log_id}/${ship_id}`,
                { deactivated_by: user.UHA_ID }
            );

            if (response.data.success) {
                refreshMovement_log_header_list();
            } else {
                throw new Error(response.data.message);
            }
        } catch (error) {
            console.error('Error suspending movement log:', error);
            alert('Error suspending movement log. Please try again.');
        } finally {
            setIsLoading(false);
        }
    }, [API_BASE_URL, user, refreshMovement_log_header_list]);

    const handleViewComponents = useCallback(async (movement_log) => {
        try {
            setIsViewingComponents(true);
            setSelectedMovementLogHeaderData(movement_log);

            const shipId = selectedShipIDs[0];

            const response = await axios.get(
                `${API_BASE_URL}getMovementLogWithAppliedCompHeirarchy/${movement_log.mov_log_id}?ship_id=${shipId}`
            );

            setMovementLogHierarchyData(response.data);
            setWantToSeeAppliedComponentHeirarchyOnMovementLog(true);
        } catch (error) {
            console.error('Error fetching component hierarchy:', error);
            alert('Error loading component hierarchy. Please try again.');
        } finally {
            setIsViewingComponents(false);
        }
    }, [API_BASE_URL, selectedShipIDs]);

    const handleViewTransactions = useCallback(async (movement_log) => {
        try {
            setIsLoadingTransactions(true);
            console.log('Starting to fetch transactions for:', movement_log.mov_log_id);

            const response = await axios.get(
                `${API_BASE_URL}getLatestMovementTransactionByShip/${movement_log.mov_log_id}?ship_id=${selectedShipIDs[0]}`
            );

            console.log('Full API Response:', response);
            console.log('Response data:', response.data);

            // Handle both array and object responses
            let transactions = [];
            if (Array.isArray(response.data)) {
                transactions = response.data;
                console.log('Transactions received as array, count:', transactions.length);
            } else if (response.data) {
                transactions = [response.data];
                console.log('Transactions received as object, wrapped in array');
            } else {
                console.log('No transaction data in response');
            }

            console.log('Final transactions to set:', transactions);
            setTransactionData(transactions);
            setSelectedMovementLogTransactions(movement_log);
            setIsWantToSeeTransactions(true);

        } catch (error) {
            console.error('Error fetching transactions:', error);
            console.error('Error details:', error.response?.data || error.message);
            alert('Error loading transaction data. Please try again.');
        } finally {
            setIsLoadingTransactions(false);
        }
    }, [API_BASE_URL, selectedShipIDs]);

    const shipSelectionComponent = useMemo(() => (
        <div id="select-ships-container" style={{ marginBottom: '20px' }}>
            <select
                name="ships-selection"
                id="ship-selection"
                value={selectedShipIDs[0] || ''} // Use first item or empty string
                onChange={handleShipSelection}
                style={{
                    visibility: (isCofigureMovementLogClicked && checkedNodes.length > 0) ? 'hidden' : 'visible',
                    color: '#3f5165'
                }}
                disabled={user?.emp_type === 1}
            // REMOVED: multiple={user?.emp_type === 2} - No multiple selection
            >
                <option value="">Select Ship</option>
                {user?.emp_type === 2 ? (
                    memoizedShipsList.map((ship) => (
                        <option key={ship.SHA_ID} value={ship.SHA_ID}>
                            {ship.ship_name}
                        </option>
                    ))
                ) : (
                    <option value={user?.ship_id}>
                        {memoizedShipsList.find(ship => ship.SHA_ID === user?.ship_id)?.ship_name || 'Your Ship'}
                    </option>
                )}
            </select>
            {errors.ship_ids && <span className="error-msg">{errors.ship_ids}</span>}
        </div>
    ), [selectedShipIDs, handleShipSelection, isCofigureMovementLogClicked, checkedNodes.length, user, memoizedShipsList, errors.ship_ids]);

    const componentTreeSection = useMemo(() => (
        selectedShipIDs.length > 0 && selectedShipIDs[0] != '' && (
            <div className="tree-section" style={{
                cursor: isViewMovementLogsClicked ? 'not-allowed' : 'pointer',
                pointerEvents: isViewMovementLogsClicked ? 'none' : 'all'
            }}>
                <h2>🔧 Component Hierarchy</h2>
                <Suspense fallback={
                    <div className="loading-placeholder">
                        <div className="mini-loader"></div>
                        Loading component hierarchy...
                    </div>
                }>
                    <TempComponentHierarchy
                        setIsCheckActive={true}
                        componentTreeWantByWhichComp={'MovementLogComponent'}
                        isReadOnlyView={false}
                        selectedShipID={selectedShipIDs[0]}
                        preSelectedNodes={movement_log_header_data.impact_data}
                        editMode={!!movement_log_header_data.impact_data.length}
                        onTreeReady={() => setIsTreeReady(true)}
                    />
                </Suspense>
            </div>
        )
    ), [selectedShipIDs, isViewMovementLogsClicked, movement_log_header_data.impact_data]);


    // function to handle opening the link modal
    const handleOpenLinkMovementLog = useCallback((movement_log) => {
        setMovementLogToLink(movement_log);
        setLinkShipSelection([]);
        setLinkInitialHours(0);
        setLinkInitialNauticalMiles(0);
        setIsLinkMovementLogModalOpen(true);
    }, []);

    // function to handle linking movement log to new ship
    // function to handle linking movement log to new ship
    const handleLinkMovementLog = useCallback(async (selectedShipId, components, initialHours = 0, initialNauticalMiles = 0) => {
        if (!movementLogToLink || !selectedShipId) return;

        setIsLinking(true);
        try {
            const response = await axios.post(
                `${API_BASE_URL}linkMovementLogToShip`,
                {
                    mov_log_id: movementLogToLink.mov_log_id,
                    ship_id: selectedShipId,
                    components: components,
                    inserted_by: user.UHA_ID,
                    initial_hours: initialHours,
                    initial_nautical_miles: initialNauticalMiles
                }
            );

            if (response.data.success) {
                alert('Movement log linked successfully!');
                setIsLinkMovementLogModalOpen(false);
                setMovementLogToLink(null);
                setLinkShipSelection([]);
                setLinkInitialHours(0);
                setLinkInitialNauticalMiles(0);
                clearCheckedNodes();
                refreshMovement_log_header_list();
            } else {
                throw new Error(response.data.message);
            }
        } catch (error) {
            console.error('Error linking movement log:', error);
            alert('Error linking movement log. Please try again.');
        } finally {
            setIsLinking(false);
        }
    }, [movementLogToLink, user, API_BASE_URL]);

    // Show main loading when initial data is loading
    if (isLoading) {
        return <Loading isLoading={true} />;
    }

    return (
        <div id='movement-log-page-main-container'>
            {/* Show loading for form submission */}
            <Loading isLoading={isFormSubmitting} />

            {/* Show loading for edit operations */}
            <Loading isLoading={isEditing} />

            {/* Show loading for viewing components */}
            <Loading isLoading={isViewingComponents} />

            {(user?.emp_type === 2 || user?.emp_type === 1) ? (
                <>
                    <div id='movement-log-page-left-container'>
                        <div id='movement-log-page-left-container-content'>
                            {shipSelectionComponent}
                            {componentTreeSection}
                        </div>
                    </div>

                    <div id='movement-log-page-right-container'>
                        {/* Tab Buttons */}
                        <div id='movement-log-page-right-top-container'>
                            {userMLCAccessProcessIDs.includes('P_MLC_0005') && (
                                <button
                                    onClick={() => {
                                        clearCheckedNodes();
                                        setIsCofigureMovementLogClicked(true);
                                        setIsViewMovementLogsClicked(false);
                                    }}
                                    className={`tab-button ${isCofigureMovementLogClicked ? 'active' : ''}`}
                                    disabled={isFormSubmitting || isEditing}
                                >
                                    Configure Movement Log
                                </button>
                            )}

                            {userMLCAccessProcessIDs.includes('P_MLC_0006') && (
                                <button
                                    onClick={() => {
                                        clearCheckedNodes();
                                        setIsViewMovementLogsClicked(true);
                                        setIsCofigureMovementLogClicked(false);
                                    }}
                                    className={`tab-button ${isViewMovementLogsClicked ? 'active' : ''}`}
                                    disabled={isFormSubmitting || isEditing}
                                >
                                    View Movement Logs
                                </button>
                            )}
                        </div>

                        {/* Configure Tab */}
                        {isCofigureMovementLogClicked && userMLCAccessProcessIDs.includes('P_MLC_0005') && (
                            <div>
                                {checkedNodes.length > 0 || movement_log_header_data.impact_data.length > 0 ? (
                                    <form onSubmit={handleOnSubmit} ref={formContainerRef}>
                                        <h1>
                                            {movement_log_header_data.impact_data.length > 0
                                                ? `Edit Movement Log: ${movement_log_header_data.display_name}`
                                                : 'Create New Movement Log'
                                            }
                                        </h1>

                                        {/* Show existing components when in edit mode */}
                                        {checkedNodes?.length > 0 && (
                                            <div id='existing-components-info'>
                                                <h3 className="section-title">Attached Components</h3>
                                                <div className="existing-components-list">
                                                    {checkedNodes?.map(node => (
                                                        <div>{node?.data?.label}</div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Rest of the form remains the same */}
                                        <div id='movement-log-header-display-name-feild-container'>
                                            <label htmlFor="display-name">
                                                <i className="fas fa-signature icon-prefix"></i>
                                                Movement Log Name:
                                                <input
                                                    type="text"
                                                    name='display_name'
                                                    id='display-name'
                                                    placeholder='Enter Movement Log Name..'
                                                    value={movement_log_header_data.display_name}
                                                    onChange={(e) => {
                                                        setMovement_log_header_data(prev => ({
                                                            ...prev,
                                                            display_name: e.target.value
                                                        }));
                                                    }}
                                                    disabled={isFormSubmitting}
                                                />
                                                {errors.display_name && <span className="error-msg">{errors.display_name}</span>}
                                            </label>
                                        </div>

                                        {/* Transaction Frequency */}
                                        <div id='movement-log-header-frequency-container'>
                                            <label htmlFor="transaction-frequency">
                                                Transaction Frequency:
                                                <select
                                                    name="transaction_frequency"
                                                    id="transaction-frequency"
                                                    value={movement_log_header_data.transaction_frequency}
                                                    onChange={(e) => {
                                                        setMovement_log_header_data(prev => ({
                                                            ...prev,
                                                            transaction_frequency: parseInt(e.target.value)
                                                        }));
                                                    }}
                                                    disabled={isFormSubmitting}
                                                >
                                                    <option value={0}>Daily</option>
                                                    <option value={7}>Weekly</option>
                                                    <option value={15}>Fortnightly</option>
                                                    <option value={30}>Monthly</option>
                                                </select>
                                            </label>
                                        </div>

                                        {/* Eligible Designation To Insert Transaction */}
                                        <div id='movement-log-header-frequency-container'>
                                            <label htmlFor="transaction-frequency">
                                                Responsible Designation To Enter Running Hours:
                                                <select
                                                    name="responsible_desg_for_transactions"
                                                    id="responsible_desg_for_transactions"
                                                    value={movement_log_header_data.responsible_desg_for_transactions}
                                                    onChange={(e) => {
                                                        setMovement_log_header_data(prev => ({
                                                            ...prev,
                                                            responsible_desg_for_transactions: (e.target.value)
                                                        }));
                                                    }}
                                                    disabled={isFormSubmitting}
                                                >
                                                    {/* {} */}
                                                </select>
                                            </label>
                                        </div>

                                        <div id='movement-log-header-initial-readings-container'>
                                            <h3>Initial Readings</h3>
                                            <div className="reading-fields">
                                                <label htmlFor="initial-hours">
                                                    <i className="fas fa-clock icon-prefix"></i>
                                                    Initial Hours:
                                                    <input
                                                        type="number"
                                                        name='initial_hours'
                                                        id='initial-hours'
                                                        placeholder='Enter initial hours..'
                                                        value={movement_log_header_data.initial_hours || 0}
                                                        onChange={(e) => {
                                                            setMovement_log_header_data(prev => ({
                                                                ...prev,
                                                                initial_hours: parseFloat(e.target.value) || 0
                                                            }));
                                                        }}
                                                        step="0.1"
                                                        min="0"
                                                        disabled={isFormSubmitting}
                                                    />
                                                </label>

                                                {/* <label htmlFor="initial-nautical-miles">
                                                    <i className="fas fa-anchor icon-prefix"></i>
                                                    Initial Nautical Miles:
                                                    <input
                                                        type="number"
                                                        name='initial_nautical_miles'
                                                        id='initial-nautical-miles'
                                                        placeholder='Enter initial nautical miles..'
                                                        value={movement_log_header_data.initial_nautical_miles || 0}
                                                        onChange={(e) => {
                                                            setMovement_log_header_data(prev => ({
                                                                ...prev,
                                                                initial_nautical_miles: parseFloat(e.target.value) || 0
                                                            }));
                                                        }}
                                                        step="0.1"
                                                        min="0"
                                                        disabled={isFormSubmitting}
                                                    />
                                                </label> */}
                                            </div>
                                        </div>

                                        {/* Buttons */}
                                        <div id='movement-log-header-btns-container'>
                                            {userMLCAccessProcessIDs.includes('P_MLC_0002') && (
                                                <button
                                                    type="submit"
                                                    className="btn"
                                                    id='submit-btn'
                                                    disabled={isFormSubmitting}
                                                >
                                                    {isFormSubmitting ? 'Saving...' :
                                                        movement_log_header_data.impact_data.length > 0
                                                            ? 'Update Configuration'
                                                            : 'Save Configuration'
                                                    }
                                                </button>
                                            )}
                                            <button
                                                type='button'
                                                className='btn'
                                                id='reset-btn'
                                                onClick={resetMovementLogConfigForm}
                                                disabled={isFormSubmitting}
                                            >
                                                Reset Form
                                            </button>
                                            <button
                                                type='button'
                                                className='btn btn-cancel'
                                                onClick={() => {
                                                    setIsCofigureMovementLogClicked(false);
                                                    setIsViewMovementLogsClicked(true);
                                                    resetMovementLogConfigForm();
                                                }}
                                                disabled={isFormSubmitting}
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </form>
                                ) : (
                                    <p className="no-selection">No components selected yet.</p>
                                )}
                            </div>
                        )}

                        {/* View Tab */}
                        {isViewMovementLogsClicked && userMLCAccessProcessIDs.includes('P_MLC_0006') && (
                            <div>
                                <table className="movement-logs-table">
                                    <thead>
                                        <tr>
                                            <th>Movement Name</th>
                                            <th>Ships</th>
                                            <th>Frequency</th>
                                            <th>Last Updated</th>
                                            {userMLCAccessProcessIDs.includes('P_MLC_0007') && <th>Components</th>}
                                            {userMLCAccessProcessIDs.includes('P_MLC_0008') && <th>See Transaction</th>}
                                            {(userMLCAccessProcessIDs.includes('P_MLC_0003') || userMLCAccessProcessIDs.includes('P_MLC_0004')) && <th>Actions</th>}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {movement_log_header_list_by_ship.length > 0 ? (
                                            movement_log_header_list_by_ship.map((log, index) => (
                                                <tr key={log.mov_log_id}>
                                                    <td>{log.display_name}</td>
                                                    <td>
                                                        {log.ship_ids.split(',').map(shipId => (
                                                            <span key={shipId} className="ship-tag">
                                                                {shipsList.find(ship => ship.SHA_ID === shipId)?.ship_name || shipId}
                                                            </span>
                                                        ))}
                                                    </td>
                                                    <td>
                                                        {log.transaction_frequency === 0 ? 'Daily' :
                                                            `Every ${log.transaction_frequency} days`}
                                                    </td>
                                                    <td>
                                                        {new Date(log.inserted_on).toLocaleDateString('en-GB')}
                                                    </td>
                                                    {userMLCAccessProcessIDs.includes('P_MLC_0007') && (
                                                        <td>
                                                            <button
                                                                className="btn-see-components"
                                                                onClick={() => handleViewComponents(log)}
                                                                disabled={isViewingComponents}
                                                            >
                                                                {isViewingComponents ? 'Loading...' : 'View Components'}
                                                            </button>
                                                        </td>
                                                    )}
                                                    {userMLCAccessProcessIDs.includes('P_MLC_0008') && (
                                                        <td>
                                                            <button
                                                                className="btn-see-transactions"
                                                                onClick={() => handleViewTransactions(log)}
                                                                disabled={isLoadingTransactions}
                                                            >
                                                                {isLoadingTransactions ? 'Loading...' : '📊 See Transactions'}
                                                            </button>
                                                        </td>
                                                    )}
                                                    {(userMLCAccessProcessIDs.includes('P_MLC_0003') || userMLCAccessProcessIDs.includes('P_MLC_0004')) && (
                                                        <td>
                                                            {userMLCAccessProcessIDs.includes('P_MLC_0003') && (
                                                                <button
                                                                    className="btn-edit"
                                                                    onClick={() => handleOnEditMovementLogHeader(log)}
                                                                    disabled={isEditing}
                                                                >
                                                                    {isEditing ? 'Loading...' : 'Edit'}
                                                                </button>
                                                            )}


                                                            {userMLCAccessProcessIDs.includes('P_MLC_0004') && (
                                                                <button
                                                                    className="btn-suspend"
                                                                    onClick={() => handleSuspendMovementLog(log.mov_log_id, selectedShipIDs[0])}
                                                                    disabled={isLoading}
                                                                >
                                                                    Suspend
                                                                </button>
                                                            )}

                                                            {/* Link Button */}
                                                            {userMLCAccessProcessIDs.includes('P_MLC_0004') && user?.emp_type === 2 && (
                                                                <button
                                                                    className="btn-edit"
                                                                    onClick={() => handleOpenLinkMovementLog(log)}
                                                                    disabled={isLinking}
                                                                >
                                                                    {isLinking ? 'Linking...' : 'Link to Ship'}
                                                                </button>
                                                            )}
                                                        </td>
                                                    )}
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                {selectedShipIDs.length > 0 ? (
                                                    <td colSpan="6" className="no-data">
                                                        No Movement Log for {memoizedShipsList.filter(ship => ship.SHA_ID == selectedShipIDs[0])[0]?.ship_name}
                                                    </td>
                                                ) : (
                                                    <td colSpan="6" className="no-data">Please Select Ship</td>
                                                )}
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </>
            ) : (
                <p className="unauthorized-message">
                    You are not authorized to see content of this module.
                </p>
            )}

            {wantToSeeAppliedComponentHeirarchyOnMovementLog && movementLogHierarchyData && (
                <Suspense fallback={
                    <div className="modal-loading">
                        <div className="loading-spinner"></div>
                        Loading component details...
                    </div>
                }>
                    <div id='applied-component-heirarchy-modal'>
                        <div id='applied-component-heirarchy-modal-content'>
                            <h3>Components for: {movementLogHierarchyData.display_name || selectedMovementLogHeaderData?.display_name}</h3>

                            <div className="movement-log-info">
                                <p><strong>Movement Log:</strong> {movementLogHierarchyData.display_name}</p>
                                <p><strong>Last Updated:</strong> {new Date(movementLogHierarchyData.last_update || movementLogHierarchyData.inserted_on).toLocaleDateString()}</p>
                                <p><strong>Ship:</strong> {shipsList.find(ship => ship.SHA_ID === selectedShipIDs[0])?.ship_name || movementLogHierarchyData.ship_id}</p>
                                <p><strong>Total Components:</strong> {movementLogHierarchyData.impacted_components?.length || 0}</p>
                            </div>

                            <div className="component-list">
                                {movementLogHierarchyData.impacted_components && movementLogHierarchyData.impacted_components.length > 0 ? (
                                    movementLogHierarchyData.impacted_components.map((component, index) => (
                                        <div key={index} className="component-hierarchy">
                                            <div className="component-header">
                                                <h4>
                                                    {/* {console.log('component :::: ', component)} */}
                                                    {/* {component.component_heirarchy?.data?.label || `Component: ${component.component_no}`} */}
                                                    <strong>Affected Component :</strong> {component.component_no}
                                                </h4>
                                                <div className="component-meta">

                                                    {/* <p><strong>Levels:</strong> {component.applied_levels?.join(', ') || 'All'}</p> */}
                                                    <p><strong>Status:</strong>
                                                        <span className={component.combination_data?.status === 1 ? 'status-active' : 'status-inactive'}>
                                                            {component.combination_data?.status === 1 ? 'Active' : 'Inactive'}
                                                        </span>
                                                    </p>
                                                </div>
                                            </div>

                                            {component.component_heirarchy ? (
                                                <div className="hierarchy-container">
                                                    <ComponentTree
                                                        key={`${component.component_no}-${index}`}
                                                        node={component.component_heirarchy}
                                                        isCheckBoxActive={false}
                                                        componentTreeWantByWhichComp={'MovementLogView'}
                                                        isReadOnlyView={true}
                                                        selectedShipID={movementLogHierarchyData.ship_id}
                                                    />
                                                </div>
                                            ) : (
                                                <div className="no-hierarchy-info">
                                                    <p className="no-hierarchy">No hierarchy structure available.</p>
                                                    <div className="combination-details">
                                                        <p><strong>Stored Combination Data (IDs):</strong></p>
                                                        <ul>
                                                            <li><strong>Category ID:</strong> {component.combination_data?.cat_id || 'Not set'}</li>
                                                            {component.combination_data?.sub_cat_id && (
                                                                <li><strong>Sub Category ID:</strong> {component.combination_data.sub_cat_id}</li>
                                                            )}
                                                            {component.combination_data?.second_sub_cat_id && (
                                                                <li><strong>Second Sub Category ID:</strong> {component.combination_data.second_sub_cat_id}</li>
                                                            )}
                                                            {component.combination_data?.third_sub_cat_id && (
                                                                <li><strong>Third Sub Category ID:</strong> {component.combination_data.third_sub_cat_id}</li>
                                                            )}
                                                        </ul>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Show any errors */}
                                            {component.error && (
                                                <div className="component-error">
                                                    <p><strong>Error:</strong> {component.error}</p>
                                                </div>
                                            )}
                                        </div>
                                    ))
                                ) : (
                                    <div className="no-components">
                                        <p>No components attached to this movement log.</p>
                                        {movementLogHierarchyData.impacted_components &&
                                            <p className="debug-info">
                                                Debug: impacted_components exists but is empty
                                            </p>
                                        }
                                    </div>
                                )}
                            </div>

                            <button
                                className="btn-close"
                                onClick={() => {
                                    setWantToSeeAppliedComponentHeirarchyOnMovementLog(false);
                                    setSelectedMovementLogHeaderData(null);
                                    setMovementLogHierarchyData(null);
                                }}
                                disabled={isViewingComponents}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </Suspense>
            )}

            {/* Link Movement Log Modal */}
            {/* Link Movement Log Modal */}
            {isLinkMovementLogModalOpen && movementLogToLink && (
                <div id='link-movement-log-modal'>
                    <div id='link-movement-log-modal-content'>
                        <h3>Link Movement Log: {movementLogToLink.display_name}</h3>

                        <div className="modal-section">
                            <h4>Select Target Ship</h4>
                            <select
                                value={linkShipSelection[0] || ''}
                                onChange={(e) => {
                                    const shipId = e.target.value;
                                    if (shipId) {
                                        setLinkShipSelection([shipId]);
                                    } else {
                                        setLinkShipSelection([]);
                                    }
                                }}
                            >
                                <option value="">Select Ship</option>
                                {memoizedShipsList
                                    .filter(ship => !movementLogToLink.ship_ids.split(',').includes(ship.SHA_ID))
                                    .map((ship) => (
                                        <option key={ship.SHA_ID} value={ship.SHA_ID}>
                                            {ship.ship_name}
                                        </option>
                                    ))
                                }
                            </select>
                        </div>

                        {/* Add Initial Readings Section */}
                        {linkShipSelection.length > 0 && (
                            <div className="modal-section">
                                <h4>Initial Readings for {memoizedShipsList.find(s => s.SHA_ID === linkShipSelection[0])?.ship_name}</h4>
                                <div className="reading-fields">
                                    <label htmlFor="link-initial-hours">
                                        <i className="fas fa-clock icon-prefix"></i>
                                        Initial Hours:
                                        <input
                                            type="number"
                                            id='link-initial-hours'
                                            placeholder='Enter initial hours..'
                                            value={linkInitialHours || 0}
                                            onChange={(e) => {
                                                setLinkInitialHours(parseFloat(e.target.value) || 0);
                                            }}
                                            step="0.1"
                                            min="0"
                                            disabled={isLinking}
                                        />
                                    </label>

                                    <label htmlFor="link-initial-nautical-miles">
                                        <i className="fas fa-anchor icon-prefix"></i>
                                        Initial Nautical Miles:
                                        <input
                                            type="number"
                                            id='link-initial-nautical-miles'
                                            placeholder='Enter initial nautical miles..'
                                            value={linkInitialNauticalMiles || 0}
                                            onChange={(e) => {
                                                setLinkInitialNauticalMiles(parseFloat(e.target.value) || 0);
                                            }}
                                            step="0.1"
                                            min="0"
                                            disabled={isLinking}
                                        />
                                    </label>
                                </div>
                            </div>
                        )}

                        {linkShipSelection.length > 0 && (
                            <div className="modal-section">
                                <h4>Select Components for {memoizedShipsList.find(s => s.SHA_ID === linkShipSelection[0])?.ship_name}</h4>
                                <div className="tree-section">
                                    <Suspense fallback={<div>Loading component hierarchy...</div>}>
                                        <TempComponentHierarchy
                                            setIsCheckActive={true}
                                            componentTreeWantByWhichComp={'MovementLogComponent'}
                                            isReadOnlyView={false}
                                            selectedShipID={linkShipSelection[0]}
                                            preSelectedNodes={[]}
                                            editMode={false}
                                            onTreeReady={() => setIsTreeReady(true)}
                                        />
                                    </Suspense>
                                </div>
                            </div>
                        )}

                        <div className="modal-buttons">
                            <button
                                className="btn btn-primary"
                                onClick={() => {
                                    if (checkedNodes.length === 0) {
                                        alert('Please select at least one component');
                                        return;
                                    }
                                    const impact_data = prepareImpactData();
                                    handleLinkMovementLog(
                                        linkShipSelection[0],
                                        impact_data,
                                        linkInitialHours || 0,
                                        linkInitialNauticalMiles || 0
                                    );
                                }}
                                disabled={isLinking || linkShipSelection.length === 0 || checkedNodes.length === 0}
                            >
                                {isLinking ? 'Linking...' : 'Link Movement Log'}
                            </button>
                            <button
                                className="btn btn-cancel"
                                onClick={() => {
                                    setIsLinkMovementLogModalOpen(false);
                                    setMovementLogToLink(null);
                                    setLinkShipSelection([]);
                                    setLinkInitialHours(0);
                                    setLinkInitialNauticalMiles(0);
                                    clearCheckedNodes();
                                }}
                                disabled={isLinking}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {isWantToSeeTransactions && (
                <div className="modal-overlay">
                    <div className="modal-content transaction-modal">
                        <div className="modal-header">
                            <h2>Transaction Calendar - {selectedMovementLogTransactions?.display_name}</h2>
                            {/* <div className="modal-subtitle">
                                    {transactionData.length} month(s) of transaction data available
                                </div> */}
                            <button
                                className="close-button"
                                onClick={() => {
                                    setIsWantToSeeTransactions(false);
                                    setSelectedMovementLogTransactions(null);
                                    setTransactionData([]);
                                }}
                            >
                                ×
                            </button>
                        </div>

                        <div className="modal-body">
                            {isLoadingTransactions ? (
                                <div className="loading-transactions">
                                    <div className="loading-spinner"></div>
                                    <p>Loading transaction data...</p>
                                </div>
                            ) : transactionData && transactionData.length > 0 ? (
                                <div className="transactions-container">
                                    {/* <div className="transactions-overview">
                                            <div className="overview-stats">
                                                <div className="stat-item">
                                                    <span className="stat-value">{transactionData.length}</span>
                                                    <span className="stat-label">Months</span>
                                                </div>
                                                <div className="stat-item">
                                                    <span className="stat-value">
                                                        {transactionData.reduce((total, t) => total + (t.increment_hr_value || 0), 0)}
                                                    </span>
                                                    <span className="stat-label">Total Hours</span>
                                                </div>
                                                <div className="stat-item">
                                                    <span className="stat-value">
                                                        {transactionData.reduce((total, t) => total + (t.increment_km_value || 0), 0)}
                                                    </span>
                                                    <span className="stat-label">Total NM</span>
                                                </div>
                                            </div>
                                        </div> */}

                                    <TransactionCalendar
                                        transactions={transactionData}
                                        movementLog={selectedMovementLogTransactions}
                                    />
                                </div>
                            ) : (
                                <div className="no-transactions">
                                    <p>No transaction data found for this movement log.</p>
                                    <div className="debug-info-panel">
                                        <p><strong>Debug Information:</strong></p>
                                        <p>transactionData length: {transactionData?.length}</p>
                                        <p>selectedMovementLogTransactions: {JSON.stringify(selectedMovementLogTransactions?.mov_log_id)}</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="modal-footer">
                            <button
                                className="btn btn-secondary"
                                onClick={() => {
                                    setIsWantToSeeTransactions(false);
                                    setSelectedMovementLogTransactions(null);
                                    setTransactionData([]);
                                }}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default React.memo(MovementLogPage);
// localhost