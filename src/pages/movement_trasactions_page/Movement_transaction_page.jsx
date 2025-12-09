import React, { useContext, useEffect, useState } from 'react';
import './Movement_transaction_page.css';
import { Movement_log_header_context } from '../../contexts/movementLogContext/Movement_log_header_context';
import ComponentTree from '../../components/ComponentTree/ComponentTree';
import axios from 'axios';
import { Movement_log_transactions_context } from '../../contexts/movementLogContext/Movement_log_transactions_context';
import { UserAuthContext } from '../../contexts/userAuth/UserAuthContext';
import { Profile_header_context } from '../../contexts/profile_header_context/Profile_header_context';
import { ShipHeaderContext } from '../../contexts/ship_header_context/ShipHeaderContext';
import { toast } from 'react-toastify';

const Movement_transaction_page = () => {
    const API_BASE_URL = import.meta.env.VITE_API_URL;

    const { profiles } = useContext(Profile_header_context)
    const { user } = useContext(UserAuthContext)
    const { movement_log_header_list, refreshMovement_log_header_list, movement_log_header_impacted_comp_full_heirarchy, refreshMovementLogsWithHierarchy } = useContext(Movement_log_header_context);
    const { movement_log_transaction_list, refreshMovement_log_transactions_list } = useContext(Movement_log_transactions_context);
    const { shipsList, refreshShipsList } = useContext(ShipHeaderContext)

    const [selectedMovLogHeader, setSelectedMovLogHeader] = useState(null);
    const [fullMovementLogData, setFullMovementLogData] = useState([]);
    const [filteredComponents, setFilteredComponents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentMonthYear, setCurrentMonthYear] = useState(null)
    const [currentMonthYearTransaction, setCurrentMonthYearTransaction] = useState(null)
    const [newHours, setNewHours] = useState(0);
    const [newNauticalMiles, setNewNauticalMiles] = useState(0);
    const [wantToAddHourOrNM, setWantToAddHourOrNM] = useState(false)
    const [todaysDate, setTodaysDate] = useState(new Date().getDate())
    const [impactedComponentHeirarchyBySelectedMovmentLogID, setImpactedComponentHeirarchyBySelectedMovmentLogID] = useState(null)
    const [impactRules, setImpactRules] = useState([]);
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

    const [movement_log_header_list_by_ship, setMovement_log_header_list_by_ship] = useState([])
    const [userBordedShip, setUserBordedShip] = useState(null)

    // Calender States
    const [showCalendarConfirmation, setShowCalendarConfirmation] = useState(false);
    const [distributionResult, setDistributionResult] = useState(null);
    const [pendingTransactionData, setPendingTransactionData] = useState(null);
    // state for editable calendar data
    const [editableCalendarData, setEditableCalendarData] = useState(null);

    const monthNamesObject = {
        1: 'January', 2: 'February', 3: 'March', 4: 'April', 5: 'May', 6: 'June',
        7: 'July', 8: 'August', 9: 'September', 10: 'October', 11: 'November', 12: 'December'
    };

    // Fetch transaction for current month and year
    useEffect(() => {
        const now = new Date();
        const currentMonth = now.getMonth() + 1;
        const currentYear = now.getFullYear();
        setCurrentMonthYear(`${currentMonth}_${currentYear}`);
    }, []);

    // Set Movement Log Headers According to ship
    useEffect(() => {
        if (user?.ship_id && shipsList.length > 0) {
            console.log('movement_log_header_list ::: ', movement_log_header_list)
            const mov_log_header_list = movement_log_header_list.filter(
                mov => mov.ship_ids?.includes(user.ship_id)
            );
            const shipData = shipsList.find(ship => ship.SHA_ID == user.ship_id);
            setMovement_log_header_list_by_ship(mov_log_header_list);
            setUserBordedShip(shipData || null);
        }
    }, [user, shipsList, movement_log_header_list]);

    // Update currentMonthYear when selected month/year changes
    useEffect(() => {
        if (selectedMonth && selectedYear) {
            setCurrentMonthYear(`${selectedMonth}_${selectedYear}`);
        }
    }, [selectedMonth, selectedYear]);

    useEffect(() => {
        if (!selectedMovLogHeader) return;

        const rules = [];
        for (let i = 1; i <= 50; i++) {
            const impactKey = `impact_on_${i}`;
            const detailKey = `details_${i}`;
            const impactValue = selectedMovLogHeader[impactKey];
            const detailValue = selectedMovLogHeader[detailKey];

            if (impactValue && impactValue.includes('=')) {
                const [component_no, level] = impactValue.split('=');
                rules.push({
                    component_no,
                    level: parseInt(level, 10),
                    detail: parseInt(detailValue, 10) || 1,
                });
            }
        }
        setImpactRules(rules);
    }, [selectedMovLogHeader]);

    // Filter component hierarchies by selected movement log
    useEffect(() => {
        if (selectedMovLogHeader && selectedMovLogHeader != "") {
            const result = movement_log_header_impacted_comp_full_heirarchy.filter((mov_obj) => {
                return mov_obj.movement_log_id == selectedMovLogHeader.mov_log_id
            });
            setImpactedComponentHeirarchyBySelectedMovmentLogID(result[0])
        }
    }, [selectedMovLogHeader])

    // Fix this useEffect
    useEffect(() => {
        if (!selectedMovLogHeader || !currentMonthYear) {
            setCurrentMonthYearTransaction(null);
            return;
        }

        const transaction = movement_log_transaction_list.find((mt) =>
            mt.month_year === currentMonthYear &&
            mt.mov_log_id === selectedMovLogHeader.mov_log_id
        );

        setCurrentMonthYearTransaction(transaction || null);
    }, [movement_log_transaction_list, selectedMovLogHeader, currentMonthYear]);

    // Fetch all movement logs with applied hierarchies
    useEffect(() => {
        const fetchMovementLogData = async () => {
            if (!selectedMovLogHeader || !userBordedShip?.SHA_ID) {
                return;
            }

            setLoading(true);
            setError(null);
            try {
                // FIX: Pass both parameters correctly
                const data = await refreshMovementLogsWithHierarchy(
                    selectedMovLogHeader.mov_log_id,
                    userBordedShip.SHA_ID
                );

                console.log('Fetched movement log data:', data);

                // FIX: Handle the response properly
                if (data) {
                    // If it's a single movement log object, wrap it in an array
                    setFullMovementLogData(Array.isArray(data) ? data : [data]);
                } else {
                    setFullMovementLogData([]);
                }
            } catch (err) {
                console.error('Error fetching movement log hierarchy:', err);
                setError('Failed to load component hierarchy. Please try again later.');
                setFullMovementLogData([]);
            } finally {
                setLoading(false);
            }
        };

        fetchMovementLogData();
    }, [selectedMovLogHeader, userBordedShip?.SHA_ID]); // FIX: Added dependency

    // Refresh headers on mount
    useEffect(() => {
        refreshMovement_log_header_list();

        refreshMovement_log_transactions_list()
        refreshShipsList()
    }, []);

    // Update filtered components when selection changes
    useEffect(() => {
        if (!selectedMovLogHeader || fullMovementLogData.length === 0) {
            setFilteredComponents([]);
            return;
        }

        console.log('Full movement log data:', fullMovementLogData);

        // FIX: Handle both array and single object responses
        let logData;
        if (Array.isArray(fullMovementLogData)) {
            logData = fullMovementLogData.find(
                (log) => log.movement_log_id === selectedMovLogHeader.mov_log_id
            );
        } else {
            // If it's a single object, check if it matches
            logData = fullMovementLogData.movement_log_id === selectedMovLogHeader.mov_log_id
                ? fullMovementLogData
                : null;
        }

        const components = logData?.impacted_components || [];

        console.log('Found components for selected log:', components);

        setFilteredComponents(components);
    }, [selectedMovLogHeader, fullMovementLogData]);

    const handleSelectChange = async (e) => {
        const value = e.target.value;
        const header = value
            ? movement_log_header_list_by_ship.find((mov) => mov.mov_log_id === value)
            : null;
        setSelectedMovLogHeader(header);
    };

    const handleAddEntry = async (transactionData = null) => {
        if (!transactionData) {
            if (!newHours || !newNauticalMiles) {
                toast.error('Please fill in both fields.');
                return;
            }



            // Prepare the data in the format backend expects
            transactionData = {
                ship_id: userBordedShip?.SHA_ID,
                mov_log_id: selectedMovLogHeader?.mov_log_id,
                month_year: currentMonthYear,
                increment_hr_value: parseFloat(newHours), // Ensure number
                increment_km_value: parseFloat(newNauticalMiles), // Ensure number
                Inserted_on: new Date().toISOString().slice(0, 19).replace('T', ' '),
                [`Day_${todaysDate}`]: `${newHours}=${newNauticalMiles}`
            };

            // Initialize all other days as null for new transactions
            for (let i = 1; i <= 31; i++) {
                if (i !== todaysDate) {
                    transactionData[`Day_${i}`] = null;
                }
            }
        }

        try {
            let response;

            if (currentMonthYearTransaction) {
                // Update existing transaction
                if (currentMonthYearTransaction[`Day_${todaysDate}`]) {
                    toast.error('You have already filled the value for this day. To update it, please contact Office side Authority.');
                    return;
                }

                // For update, include the existing transaction ID and merge data
                response = await axios.put(`${API_BASE_URL}UpdateMovementTransactionLog`, {
                    ...transactionData,
                    SMLTA_ID: currentMonthYearTransaction.SMLTA_ID // Include transaction ID for update
                });
            } else {
                // Create new transaction
                response = await axios.post(`${API_BASE_URL}createMovementTransactionLog`, transactionData);
            }

            if (response.data.success) {
                await refreshMovement_log_transactions_list();
                setNewHours(0);
                setNewNauticalMiles(0);
                setWantToAddHourOrNM(false);

                // Show success message
                toast.success('Movement entry added successfully! 🎉');

                // Handle threshold checks and job creation results
                const { threshold_checks, components_processed } = response.data;

                // Show component processing info
                if (components_processed) {
                    console.log('Components processed:', components_processed);
                    if (components_processed.impacted_components > 0) {
                        toast.info(`Updated ${components_processed.impacted_components} component counters`);
                    }
                }

                if (threshold_checks) {
                    console.log('Threshold checks result:', threshold_checks);

                    // Show success messages for created jobs
                    if (threshold_checks.jobs_created > 0) {
                        toast.success(`✅ ${threshold_checks.jobs_created} job(s) created automatically!`, {
                            autoClose: 8000
                        });
                    }

                    // Handle danger alerts (thresholds crossed but jobs couldn't be created)
                    if (threshold_checks.danger_alerts && threshold_checks.danger_alerts.length > 0) {
                        threshold_checks.danger_alerts.forEach(alert => {
                            if (alert.reason === "Job already exists") {
                                toast.warning(
                                    `🚨 Threshold crossed for ${alert.jcd_name || alert.jcd_id}! Complete the existing job first.`,
                                    { autoClose: 8000 }
                                );
                            }
                        });
                    }

                    // Show summary
                    if (threshold_checks.total_jcds_checked > 0) {
                        console.log(`Checked ${threshold_checks.total_jcds_checked} JCDs, created ${threshold_checks.jobs_created} jobs`);
                    }
                }

            } else {
                // Handle backend error response
                const errorMessage = response.data.error || 'Failed to add entry';
                toast.error(`❌ ${errorMessage}`);
            }

        } catch (error) {
            console.error('Error adding entry:', error);

            // Enhanced error handling
            if (error.response?.data) {
                const { error: errorMsg, message } = error.response.data;

                if (errorMsg) {
                    toast.error(`❌ ${errorMsg}`);
                } else if (message) {
                    toast.error(`❌ ${message}`);
                } else {
                    toast.error('❌ Failed to add entry. Please try again.');
                }
            } else if (error.request) {
                toast.error('❌ Network error. Please check your connection.');
            } else {
                toast.error('❌ Failed to add entry. Please try again.');
            }
        }
    };

    // Add this helper function in your frontend component
    const calculateMissingDaysAndDistribute = (currentMonthYearTransaction, todaysDate, enteredHours, enteredNauticalMiles) => {
        if (!currentMonthYearTransaction) {
            // For new transactions, apply limit to current day too
            const currentDayHours = Math.min(24, enteredHours);
            const currentDayNM = Math.min(500, enteredNauticalMiles);

            return {
                isValid: true,
                distributedData: {
                    [`Day_${todaysDate}`]: `${currentDayHours}=${currentDayNM}`
                },
                totalHours: currentDayHours,
                totalNauticalMiles: currentDayNM,
                wasLimited: currentDayHours < enteredHours // Flag if values were limited
            };
        }

        // Find the last day with data
        let lastDayWithData = 0;
        for (let i = 1; i <= 31; i++) {
            const dayKey = `Day_${i}`;
            if (currentMonthYearTransaction[dayKey] && i < todaysDate) {
                lastDayWithData = i;
            }
        }

        const missingDaysCount = todaysDate - lastDayWithData - 1;

        if (missingDaysCount <= 0) {
            // No missing days, apply limit to current day
            const currentDayHours = Math.min(24, enteredHours);
            const currentDayNM = Math.min(500, enteredNauticalMiles);

            return {
                isValid: true,
                distributedData: {
                    [`Day_${todaysDate}`]: `${currentDayHours}=${currentDayNM}`
                },
                totalHours: currentDayHours,
                totalNauticalMiles: currentDayNM,
                wasLimited: currentDayHours < enteredHours
            };
        }

        // Calculate maximum allowed values (24 hours per missing day + current day)
        const maxAllowedHours = (missingDaysCount * 24) + 24;
        const maxAllowedNauticalMiles = (missingDaysCount * 500) + 500;

        // Validate if entered values exceed maximum allowed
        if (enteredHours > maxAllowedHours) {
            return {
                isValid: false,
                error: `Maximum allowed hours for ${missingDaysCount + 1} days is ${maxAllowedHours}. You entered ${enteredHours}.`
            };
        }

        if (enteredNauticalMiles > maxAllowedNauticalMiles) {
            return {
                isValid: false,
                error: `Maximum allowed nautical miles for ${missingDaysCount + 1} days is ${maxAllowedNauticalMiles}. You entered ${enteredNauticalMiles}.`
            };
        }

        // Distribute hours and nautical miles across ALL days with limits
        const distributedData = {};
        let remainingHours = enteredHours;
        let remainingNauticalMiles = enteredNauticalMiles;
        let wasLimited = false;

        // Distribute to missing days first (each gets max 24 hours)
        for (let day = lastDayWithData + 1; day < todaysDate; day++) {
            const dayHours = Math.min(24, remainingHours);
            const dayNauticalMiles = Math.min(500, remainingNauticalMiles);

            if (dayHours < remainingHours) wasLimited = true;

            distributedData[`Day_${day}`] = `${dayHours}=${dayNauticalMiles}`;

            remainingHours -= dayHours;
            remainingNauticalMiles -= dayNauticalMiles;
        }

        // Apply limit to current day as well
        const currentDayHours = Math.min(24, remainingHours);
        const currentDayNM = Math.min(500, remainingNauticalMiles);

        if (currentDayHours < remainingHours) wasLimited = true;

        distributedData[`Day_${todaysDate}`] = `${currentDayHours}=${currentDayNM}`;

        // Calculate actual totals after limits
        const actualTotalHours = enteredHours - (remainingHours - currentDayHours);
        const actualTotalNM = enteredNauticalMiles - (remainingNauticalMiles - currentDayNM);

        return {
            isValid: true,
            distributedData,
            totalHours: actualTotalHours,
            totalNauticalMiles: actualTotalNM,
            missingDaysCount,
            lastDayWithData,
            wasLimited,
            originalHours: enteredHours,
            originalNauticalMiles: enteredNauticalMiles
        };
    };

    // Add this helper function to calculate missing days for calendar display
    const calculateMissingDaysForCalendar = (currentMonthYearTransaction, todaysDate, enteredHours, enteredNauticalMiles) => {
        const distributedData = {};

        // Always set today's data with the entered values
        distributedData[`Day_${todaysDate}`] = `${enteredHours}=${enteredNauticalMiles}`;

        // Find missing days between last entry and today
        let lastDayWithData = 0;
        if (currentMonthYearTransaction) {
            for (let i = 1; i <= 31; i++) {
                const dayKey = `Day_${i}`;
                if (currentMonthYearTransaction[dayKey] && i < todaysDate) {
                    lastDayWithData = i;
                }
            }
        }

        const missingDaysCount = todaysDate - lastDayWithData - 1;
        let missingDays = [];

        // Pre-fill missing days with 24 hours and 0 nautical miles
        if (missingDaysCount > 0) {
            for (let day = lastDayWithData + 1; day < todaysDate; day++) {
                distributedData[`Day_${day}`] = `24=0`; // Pre-fill with 24 hours and 0 NM
                missingDays.push(day);
            }
        }

        return {
            isValid: true,
            distributedData,
            totalHours: enteredHours + (missingDaysCount * 24),
            totalNauticalMiles: enteredNauticalMiles,
            missingDaysCount,
            lastDayWithData,
            missingDays,
            todayData: {
                hours: enteredHours,
                nauticalMiles: enteredNauticalMiles
            },
            prefilledData: missingDays.map(day => ({
                day,
                hours: 24,
                nauticalMiles: 0
            }))
        };
    };

    return (
        <div className="movement-transaction-modern">
            {/* Header Section */}
            <div className="page-header-modern">
                <div className="header-content-modern">
                    <h1 className="page-title-modern">Movement Transactions</h1>
                    <p className="page-subtitle-modern">
                        Manage and track movement logs for {userBordedShip?.ship_name || 'your ship'}
                    </p>
                </div>
                <div className="user-info-modern">
                    {/* <span className="user-greeting-modern">Welcome, {user?.emp_name?.split(" ")[0]}</span> */}
                </div>
            </div>

            {/* Main Content */}
            <div className="movement-main-content">
                {/* Left Panel - Component Hierarchy */}
                <div className="component-panel-modern">
                    <div className="panel-header-modern">
                        <h3>Component Hierarchy</h3>
                        <div className="help-text-modern">
                            <span className="help-icon">ℹ️</span>
                            <span>Need help? Contact Ship Superintendent</span>
                        </div>
                    </div>

                    <div className="panel-body-modern">
                        {userBordedShip && selectedMovLogHeader && (
                            <div className="ship-info-modern">
                                <h4>Impacted Components for {selectedMovLogHeader.display_name}</h4>
                                <p className="ship-name-modern">{userBordedShip.ship_name}</p>
                            </div>
                        )}

                        {loading && (
                            <div className="loading-state-modern">
                                <div className="spinner"></div>
                                <p>Loading component hierarchy...</p>
                            </div>
                        )}

                        {error && (
                            <div className="error-state-modern">
                                <span className="error-icon">⚠️</span>
                                <p>{error}</p>
                            </div>
                        )}

                        {!loading && !selectedMovLogHeader && (
                            <div className="empty-state-modern">
                                <p>Select a movement log to view impacted components</p>
                            </div>
                        )}

                        {!loading && selectedMovLogHeader && filteredComponents.length === 0 && (
                            <div className="empty-state-modern">
                                <p>No components impacted by this movement log</p>
                            </div>
                        )}

                        {!loading && filteredComponents.length > 0 && (
                            <div className="components-list-modern">
                                {filteredComponents.map((item, index) => {
                                    const hierarchies = Array.isArray(item.component_heirarchy)
                                        ? item.component_heirarchy
                                        : [item.component_heirarchy];

                                    // Filter out null/undefined hierarchies
                                    const validHierarchies = hierarchies.filter(hierarchy =>
                                        hierarchy && hierarchy.id
                                    );

                                    return (
                                        <div key={`${item.component_no}-${index}`} className="component-item-modern">
                                            <p>Affected Component : {item?.component_no}</p>
                                            {validHierarchies.length > 0 ? (
                                                validHierarchies.map((rootNode) => (
                                                    <ComponentTree
                                                        key={rootNode.id}
                                                        node={rootNode}
                                                        isCheckBoxActive={false}
                                                        componentTreeWantByWhichComp="MovementLogComponent"
                                                    />
                                                ))
                                            ) : (
                                                <div className="empty-hierarchy-warning">
                                                    <p>No hierarchy data available for component: {item.component_no}</p>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Panel - Controls & Data */}
                <div className="content-panel-modern">
                    {/* Selection Card */}
                    <div className="control-card-modern">
                        <div className="card-header-modern">
                            <h3>Movement Log Selection</h3>
                        </div>
                        <div className="card-body-modern">
                            {movement_log_header_list_by_ship.length > 0 ? (
                                <div className="form-group-modern">
                                    <label htmlFor="mov_log_header">Select Movement Log</label>
                                    <select
                                        name="mov_log_header"
                                        id="mov_log_header"
                                        onChange={handleSelectChange}
                                        value={selectedMovLogHeader?.mov_log_id || ''}
                                        className="modern-select"
                                    >
                                        <option value="">-- Select Movement Log --</option>
                                        {movement_log_header_list_by_ship.map((mov) => (
                                            <option key={mov.mov_log_id} value={mov.mov_log_id}>
                                                {mov.display_name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            ) : (
                                <div className="empty-state-modern">
                                    <p>Sorry {user?.emp_name?.split(" ")[0]}, We don't have any Movement Logs on {userBordedShip?.ship_name}!</p>
                                </div>
                            )}

                            {selectedMovLogHeader && (
                                <div className="action-buttons-modern">
                                    {profiles.filter(profile => user.profile_ids.includes(profile.PROFILE_ID))[0]?.process_ids?.includes('P_rhnm_0002') && (
                                        <button
                                            className="modern-btn primary"
                                            onClick={() => setWantToAddHourOrNM(true)}
                                        >
                                            + Add New Entry
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Data Table Card */}
                    <div className="data-card-modern">
                        <div className="card-header-modern">
                            <h3>Monthly Transactions</h3>
                            <div className="date-controls-modern">
                                <select
                                    value={selectedMonth}
                                    onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                                    className="modern-select small"
                                >
                                    {Array.from({ length: 12 }, (_, i) => (
                                        <option key={i + 1} value={i + 1}>
                                            {new Date(2024, i).toLocaleString('default', { month: 'long' })}
                                        </option>
                                    ))}
                                </select>
                                <select
                                    value={selectedYear}
                                    onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                                    className="modern-select small"
                                >
                                    {Array.from({ length: 10 }, (_, i) => {
                                        const year = new Date().getFullYear() - 5 + i;
                                        return (
                                            <option key={year} value={year}>
                                                {year}
                                            </option>
                                        );
                                    })}
                                </select>
                            </div>
                        </div>

                        <div className="card-body-modern">
                            {currentMonthYear && (
                                <>
                                    <div className="table-header-modern">
                                        <h4>Entries for {monthNamesObject[currentMonthYear.split('_')[0]]} {currentMonthYear.split('_')[1]}</h4>
                                    </div>
                                    <div className="table-container-modern">
                                        <table className="modern-table">
                                            <thead>
                                                <tr>
                                                    <th className="log-name-header">Log Name</th>
                                                    {Array.from({ length: 31 }, (_, i) => (
                                                        <th key={i + 1} className="day-header-modern">Day {i + 1}</th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            {/* // In your table body, replace the entire tbody section with this: */}
                                            <tbody>
                                                {selectedMovLogHeader && currentMonthYearTransaction ? (
                                                    // Render based on the actual transaction data structure
                                                    <tr>
                                                        <td className="log-name-cell-modern">
                                                            {selectedMovLogHeader.display_name}
                                                        </td>
                                                        {Array.from({ length: 31 }, (_, i) => {
                                                            const dayKey = `Day_${i + 1}`;
                                                            const dayValue = currentMonthYearTransaction[dayKey];

                                                            if (dayValue) {
                                                                let hr, nm;
                                                                if (dayValue.includes('=')) {
                                                                    [hr, nm] = dayValue.split('=');
                                                                } else {
                                                                    hr = dayValue;
                                                                    nm = '0';
                                                                }

                                                                return (
                                                                    <td key={i + 1}>
                                                                        <div className="data-cell-modern">
                                                                            <span className="hr-value">HR-{hr}</span>
                                                                            {/* <span className="nm-value">NM-{nm}</span> */}
                                                                        </div>
                                                                    </td>
                                                                );
                                                            } else {
                                                                return (
                                                                    <td key={i + 1}>
                                                                        <span className="no-data-modern">-</span>
                                                                    </td>
                                                                );
                                                            }
                                                        })}
                                                    </tr>
                                                ) : !selectedMovLogHeader ? (
                                                    <tr>
                                                        <td colSpan="32" className="no-data-message-modern">
                                                            Select a movement log to view data
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    <tr>
                                                        <td colSpan="32" className="no-data-message-modern">
                                                            No transaction data found for {monthNamesObject[currentMonthYear.split('_')[0]]} {currentMonthYear.split('_')[1]}
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Add New Entry Modal */}
            {wantToAddHourOrNM && (
                <div className="modal-overlay">
                    <div className="allocate-duty-modal">
                        <div className="modern-user-modal">
                            <div className="modern-modal-header">
                                <div className="modern-header-content">
                                    <div className="modern-title-section">
                                        {/* <div className="modern-modal-icon allocate-icon">
                                            ⏰
                                        </div> */}
                                        <div className="modern-title-text">
                                            <h2 className="modern-modal-title">Add New Movement Entry</h2>
                                            <p className="modern-modal-subtitle" style={{ color: 'white' }}>
                                                Adding entry for <span className="user-highlight" style={{ color: 'white' }}>Day {todaysDate}</span> of{' '}
                                                <span className="user-highlight" style={{ color: 'white' }}>{monthNamesObject[currentMonthYear.split('_')[0]]} {currentMonthYear.split('_')[1]}</span>
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        className="modern-close-button"
                                        onClick={() => setWantToAddHourOrNM(false)}
                                    >
                                        ×
                                    </button>
                                </div>
                            </div>

                            <div className="modern-modal-content">
                                <div className="form-section-card">
                                    <div className="card-header">
                                        <div className="card-icon"></div>
                                        <h3 className="card-title">Entry Details</h3>
                                    </div>

                                    <div className="modern-form-grid">
                                        <div className="modern-form-group">
                                            <label className="modern-form-label required">
                                                {/* <span className="label-icon">⏰</span> */}
                                                Running Hours
                                            </label>
                                            <input
                                                type="number"
                                                placeholder="Enter hours (e.g., 8.5)"
                                                min="0"
                                                step="0.5"
                                                value={newHours}
                                                onChange={(e) => setNewHours(e.target.value)}
                                                className="modern-form-input"
                                            />
                                        </div>

                                        <div className="modern-form-group">
                                            {/* <label className="modern-form-label required">
                                                <span className="label-icon">🌊⚓</span>
                                                Nautical Miles
                                            </label>
                                            <input
                                                type="number"
                                                placeholder="Enter nautical miles"
                                                min="0"
                                                value={newNauticalMiles}
                                                onChange={(e) => setNewNauticalMiles(e.target.value)}
                                                className="modern-form-input"
                                            /> */}
                                        </div>
                                    </div>
                                </div>

                                <div className="form-section-card">
                                    <div className="card-header">
                                        <div className="card-icon"></div>
                                        <h3 className="card-title">Impacted Component Hierarchy</h3>
                                    </div>

                                    <div className="components-preview-modern">
                                        {loading ? (
                                            <div className="loading-state-modern">
                                                <div className="spinner"></div>
                                                <p>Loading components...</p>
                                            </div>
                                        ) : !selectedMovLogHeader ? (
                                            <p className="no-components-modern">No movement log selected</p>
                                        ) : filteredComponents.length === 0 ? (
                                            <p className="no-components-modern">No components impacted by this log</p>
                                        ) : (
                                            filteredComponents.map((item, index) => {
                                                const hierarchies = Array.isArray(item.component_heirarchy)
                                                    ? item.component_heirarchy
                                                    : [item.component_heirarchy];

                                                return (
                                                    <div key={`${item.component_no}-${index}`} className="component-preview-modern">
                                                        {hierarchies.map((rootNode) => (
                                                            <ComponentTree
                                                                key={rootNode.id}
                                                                node={rootNode}
                                                                isCheckBoxActive={true}
                                                                componentTreeWantByWhichComp="MovementLogComponent"
                                                            />
                                                        ))}
                                                    </div>
                                                );
                                            })
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="modern-modal-footer">
                                <div className="footer-left">
                                    <div className="users-count">
                                        Adding entry for: {selectedMovLogHeader?.display_name}
                                    </div>
                                </div>
                                <div className="footer-right">
                                    <button
                                        className="modern-btn secondary"
                                        onClick={() => setWantToAddHourOrNM(false)}
                                    >
                                        Cancel
                                    </button>

                                    <button
                                        className="modern-btn primary allocate-action-btn"
                                        onClick={async () => {
                                            if (!newHours) {
                                                toast.error('Hours Are Mandatory To Fill.');
                                                return;
                                            }

                                            if (!newNauticalMiles) {
                                                setNewNauticalMiles(0);
                                            }

                                            // Validate numeric values
                                            const hours = parseFloat(newHours);
                                            const nauticalMiles = parseFloat(newNauticalMiles);

                                            if (isNaN(hours) || isNaN(nauticalMiles)) {
                                                toast.error('Please enter valid numbers for hours and nautical miles.');
                                                return;
                                            }

                                            if (hours < 0 || nauticalMiles < 0) {
                                                toast.error('Hours and nautical miles cannot be negative.');
                                                return;
                                            }

                                            // Validate today's hours cannot exceed 24
                                            if (hours > 24) {
                                                toast.error('Hours cannot exceed 24 per day.');
                                                return;
                                            }

                                            // Check if user already filled today's entry
                                            if (currentMonthYearTransaction && currentMonthYearTransaction[`Day_${todaysDate}`]) {
                                                toast.error('You have already filled the value for this day. To update it, please contact Office side Authority.');
                                                return;
                                            }

                                            // Calculate missing days and prepare calendar data 
                                            const calendarData = calculateMissingDaysForCalendar(
                                                currentMonthYearTransaction,
                                                todaysDate,
                                                hours,
                                                nauticalMiles
                                            );

                                            // Prepare transaction data for calendar confirmation
                                            let transactionData;

                                            if (currentMonthYearTransaction) {
                                                // Update existing transaction
                                                transactionData = {
                                                    mov_log_id: selectedMovLogHeader?.mov_log_id,
                                                    ship_id: userBordedShip?.SHA_ID,
                                                    increment_hr_value: hours,
                                                    increment_km_value: nauticalMiles,
                                                    SMLTA_ID: currentMonthYearTransaction.SMLTA_ID,
                                                    ...calendarData.distributedData
                                                };
                                            } else {
                                                // Create new transaction
                                                transactionData = {
                                                    ship_id: userBordedShip?.SHA_ID,
                                                    mov_log_id: selectedMovLogHeader?.mov_log_id,
                                                    month_year: currentMonthYear,
                                                    increment_hr_value: hours,
                                                    increment_km_value: nauticalMiles,
                                                    Inserted_on: new Date().toISOString().slice(0, 19).replace('T', ' '),
                                                    ...calendarData.distributedData
                                                };

                                                // Initialize all other days as null
                                                for (let i = 1; i <= 31; i++) {
                                                    const dayKey = `Day_${i}`;
                                                    if (!transactionData[dayKey]) {
                                                        transactionData[dayKey] = null;
                                                    }
                                                }
                                            }

                                            // Store data and show calendar confirmation
                                            setDistributionResult(calendarData);
                                            setPendingTransactionData(transactionData);
                                            setShowCalendarConfirmation(true);
                                        }}
                                    >
                                        <span className="btn-icon">✓</span>
                                        Add Entry
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Calendar Confirmation Modal */}
            {showCalendarConfirmation && (
                <div className="modal-overlay">
                    <div className="allocate-duty-modal">
                        <div className="modern-user-modal calendar-confirmation-modal">
                            <div className="modern-modal-header">
                                <div className="modern-header-content">
                                    <div className="modern-title-section">
                                        <div className="modern-modal-icon calendar-icon">📅</div>
                                        <div className="modern-title-text">
                                            <h2 className="modern-modal-title">Review & Edit Movement Entries</h2>
                                            <p className="modern-modal-subtitle" style={{ color: 'white' }}>
                                                Edit pre-filled missing days (max 24 hours per day)
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        className="modern-close-button"
                                        onClick={() => setShowCalendarConfirmation(false)}
                                    >
                                        ×
                                    </button>
                                </div>
                            </div>

                            <div className="modern-modal-content">
                                {/* Editable Calendar Section */}
                                <div className="form-section-card calendar-card">
                                    <div className="card-header">
                                        <div className="card-icon">✏️</div>
                                        <h3 className="card-title">
                                            Edit Daily Entries - {monthNamesObject[currentMonthYear?.split('_')[0]]} {currentMonthYear?.split('_')[1]}
                                        </h3>
                                    </div>

                                    <div className="editable-calendar-container">
                                        {Object.keys(distributionResult.distributedData).map(dayKey => {
                                            const dayNumber = dayKey.replace('Day_', '');
                                            const [currentHours, currentNM] = distributionResult.distributedData[dayKey].split('=');
                                            const isToday = parseInt(dayNumber) === todaysDate;
                                            const isMissingDay = distributionResult.missingDays?.includes(parseInt(dayNumber));

                                            return (
                                                <div key={dayKey} className={`editable-day-card ${isToday ? 'today' : ''} ${isMissingDay ? 'missing-day' : ''}`}>
                                                    <div className="day-header">
                                                        <h4>Day {dayNumber}</h4>
                                                        {isToday && <span className="day-badge today-badge">Today</span>}
                                                        {isMissingDay && <span className="day-badge missing-badge">Auto-filled</span>}
                                                    </div>

                                                    <div className="day-inputs">
                                                        <div className="input-group">
                                                            <label>Hours (max 24)</label>
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                max="24"
                                                                step="0.5"
                                                                value={currentHours}
                                                                onChange={(e) => {
                                                                    const newHours = Math.min(24, Math.max(0, parseFloat(e.target.value) || 0));
                                                                    const updatedData = { ...distributionResult.distributedData };
                                                                    updatedData[dayKey] = `${newHours}=${currentNM}`;
                                                                    setDistributionResult({
                                                                        ...distributionResult,
                                                                        distributedData: updatedData
                                                                    });
                                                                }}
                                                                className="hours-input"
                                                                disabled={!isMissingDay && !isToday} // Only allow editing missing days and today
                                                            />
                                                        </div>

                                                        <div className="input-group">
                                                            <label>Nautical Miles</label>
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                value={currentNM}
                                                                onChange={(e) => {
                                                                    const newNM = Math.max(0, parseFloat(e.target.value) || 0);
                                                                    const updatedData = { ...distributionResult.distributedData };
                                                                    updatedData[dayKey] = `${currentHours}=${newNM}`;
                                                                    setDistributionResult({
                                                                        ...distributionResult,
                                                                        distributedData: updatedData
                                                                    });
                                                                }}
                                                                className="nm-input"
                                                                disabled={!isMissingDay && !isToday} // Only allow editing missing days and today
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                            <div className="modern-modal-footer">
                                <div className="footer-left">
                                    <div className="warning-text">
                                        ⚠️ Green bordered fields are editable. Today's entry and auto-filled missing days can be modified.
                                    </div>
                                </div>
                                <div className="footer-right">
                                    <button
                                        className="modern-btn secondary"
                                        onClick={() => setShowCalendarConfirmation(false)}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        className="modern-btn primary confirm-action-btn"
                                        onClick={async () => {
                                            try {
                                                // Update the transaction data with edited values
                                                const updatedTransactionData = {
                                                    ...pendingTransactionData,
                                                    ...distributionResult.distributedData
                                                };

                                                setShowCalendarConfirmation(false);
                                                await handleAddEntry(updatedTransactionData);
                                            } catch (error) {
                                                console.error('Error in calendar confirmation:', error);
                                            }
                                        }}
                                    >
                                        <span className="btn-icon">✅</span>
                                        Confirm & Add Entries
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Movement_transaction_page;
// localhost