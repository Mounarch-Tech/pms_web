import React, { useContext, useEffect, useState } from 'react';
import './Movement_transaction_page.css';
import { Movement_log_header_context } from '../../contexts/movementLogContext/Movement_log_header_context';
import ComponentTree from '../../components/ComponentTree/ComponentTree';
import axios from 'axios';
import { Movement_log_transactions_context } from '../../contexts/movementLogContext/Movement_log_transactions_context';
import { UserAuthContext } from '../../contexts/userAuth/UserAuthContext';
import { Profile_header_context } from '../../contexts/profile_header_context/Profile_header_context';
import { ShipHeaderContext } from '../../contexts/ship_header_context/ShipHeaderContext';

const Movement_transaction_page = () => {
    const API_BASE_URL = import.meta.env.VITE_API_URL;

    const { profiles } = useContext(Profile_header_context)
    const { user } = useContext(UserAuthContext)
    const { movement_log_header_list, refreshMovement_log_header_list, movement_log_header_impacted_comp_full_heirarchy, refreshMovement_log_header_impacted_comp_full_heirarchy } = useContext(Movement_log_header_context);
    const { movement_log_transaction_list, refreshMovement_log_transactions_list } = useContext(Movement_log_transactions_context);
    const { shipsList, refreshShipsList } = useContext(ShipHeaderContext)

    const [selectedMovLogHeader, setSelectedMovLogHeader] = useState(null);
    const [fullMovementLogData, setFullMovementLogData] = useState([]);
    const [filteredComponents, setFilteredComponents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentMonthYear, setCurrentMonthYear] = useState(null)
    const [currentMonthYearTransaction, setCurrentMonthYearTransaction] = useState(null)
    const [newHours, setNewHours] = useState('');
    const [newNauticalMiles, setNewNauticalMiles] = useState('');
    const [wantToAddHourOrNM, setWantToAddHourOrNM] = useState(false)
    const [todaysDate, setTodaysDate] = useState(new Date().getDate())
    const [impactedComponentHeirarchyBySelectedMovmentLogID, setImpactedComponentHeirarchyBySelectedMovmentLogID] = useState(null)
    const [impactRules, setImpactRules] = useState([]);
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

    const [movement_log_header_list_by_ship, setMovement_log_header_list_by_ship] = useState([])
    const [userBordedShip, setUserBordedShip] = useState(null)

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
            const mov_log_header_list = movement_log_header_list.filter(
                mov => mov.ship_id == user.ship_id
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

    useEffect(() => {
        const transaction = movement_log_transaction_list.filter((mt) => 
            mt.month_year == currentMonthYear && mt.mov_log_id == selectedMovLogHeader?.mov_log_id
        );
        setCurrentMonthYearTransaction(transaction)
    }, [movement_log_transaction_list, selectedMovLogHeader, currentMonthYear])

    // Fetch all movement logs with applied hierarchies
    useEffect(() => {
        const fetchMovementLogData = async () => {
            setLoading(true);
            setError(null);
            try {
                const res = await axios.get(`${API_BASE_URL}getAllMovementLogsWithOnlyAppliedCompHeirarchy`);
                setFullMovementLogData(Array.isArray(res.data) ? res.data : []);
            } catch (err) {
                console.error('Error fetching movement log hierarchy:', err);
                setError('Failed to load component hierarchy. Please try again later.');
                setFullMovementLogData([]);
            } finally {
                setLoading(false);
            }
        };
        fetchMovementLogData();
    }, [API_BASE_URL]);

    // Refresh headers on mount
    useEffect(() => {
        refreshMovement_log_header_list();
        refreshMovement_log_header_impacted_comp_full_heirarchy()
        refreshMovement_log_transactions_list()
        refreshShipsList()
    }, []);

    // Update filtered components when selection changes
    useEffect(() => {
        if (!selectedMovLogHeader || fullMovementLogData.length === 0) {
            setFilteredComponents([]);
            return;
        }
        const logData = fullMovementLogData.find(
            (log) => log.movement_log_id === selectedMovLogHeader.mov_log_id
        );
        setFilteredComponents(logData?.impacted_components || []);
    }, [selectedMovLogHeader, fullMovementLogData]);

    const handleSelectChange = (e) => {
        const value = e.target.value;
        const header = value
            ? movement_log_header_list_by_ship.find((mov) => mov.mov_log_id === value)
            : null;
        setSelectedMovLogHeader(header);
    };

    const handleUpdateTransaction = async (data) => {
        if (!selectedMovLogHeader || !currentMonthYear || !currentMonthYearTransaction || !todaysDate || !newHours || !newNauticalMiles) {
            alert('We Dont Have Enough Data to proceed !!')
            return
        }

        try {
            const res = await axios.put(`${API_BASE_URL}UpdateMovementTransactionLog`, data);
            await refreshMovement_log_transactions_list();
        } catch (err) {
            console.error("❌ Error updating transaction:", err);
            alert("Failed to update transaction");
        }
    }

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
                    <span className="user-greeting-modern">Welcome, {user?.emp_name?.split(" ")[0]}</span>
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

                                    return (
                                        <div key={`${item.component_no}-${index}`} className="component-item-modern">
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
                                            <tbody>
                                                {selectedMovLogHeader && impactedComponentHeirarchyBySelectedMovmentLogID && 
                                                 impactedComponentHeirarchyBySelectedMovmentLogID.impacted_components.map((imp_obj, index) => {
                                                    const componentNo = imp_obj.component_no;
                                                    const rule = impactRules.find(r => r.component_no === componentNo);

                                                    return (
                                                        <tr key={index}>
                                                            <td className="log-name-cell-modern">
                                                                {imp_obj?.component_heirarchy?.data?.label || componentNo}
                                                            </td>
                                                            {Array.from({ length: 31 }, (_, i) => {
                                                                const dayKey = `Day_${i + 1}`;
                                                                const dayValue = currentMonthYearTransaction?.[0]?.[dayKey];
                                                                let hr = null, nm = null;

                                                                if (dayValue) {
                                                                    let rawHr, rawNm;
                                                                    if (dayValue.includes('=')) {
                                                                        [rawHr, rawNm] = dayValue.split('=', 2);
                                                                    } else if (dayValue.includes('|')) {
                                                                        [rawHr, rawNm] = dayValue.split('|', 2);
                                                                    } else {
                                                                        rawHr = dayValue;
                                                                        rawNm = '0';
                                                                    }

                                                                    if (rule) {
                                                                        if (rule.detail === 1) hr = rawHr;
                                                                        else if (rule.detail === 2) nm = rawNm;
                                                                        else if (rule.detail === 3) {
                                                                            hr = rawHr;
                                                                            nm = rawNm;
                                                                        }
                                                                    } else {
                                                                        hr = rawHr;
                                                                    }
                                                                }

                                                                const display = hr !== null && nm !== null ? (
                                                                    <div className="data-cell-modern">
                                                                        <span className="hr-value">HR-{hr}</span>
                                                                        <span className="nm-value">NM-{nm}</span>
                                                                    </div>
                                                                ) : hr !== null ? (
                                                                    <span className="hr-value">HR-{hr}</span>
                                                                ) : nm !== null ? (
                                                                    <span className="nm-value">NM-{nm}</span>
                                                                ) : (
                                                                    <span className="no-data-modern">-</span>
                                                                );

                                                                return <td key={i + 1}>{display}</td>;
                                                            })}
                                                        </tr>
                                                    );
                                                })}

                                                {!selectedMovLogHeader ? (
                                                    <tr>
                                                        <td colSpan="32" className="no-data-message-modern">
                                                            Select a movement log to view data
                                                        </td>
                                                    </tr>
                                                ) : !impactedComponentHeirarchyBySelectedMovmentLogID ? (
                                                    <tr>
                                                        <td colSpan="32" className="no-data-message-modern">
                                                            No component hierarchy found
                                                        </td>
                                                    </tr>
                                                ) : impactedComponentHeirarchyBySelectedMovmentLogID.impacted_components.length === 0 ? (
                                                    <tr>
                                                        <td colSpan="32" className="no-data-message-modern">
                                                            No components impacted
                                                        </td>
                                                    </tr>
                                                ) : null}
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
                                        <div className="modern-modal-icon allocate-icon">
                                            ⏰
                                        </div>
                                        <div className="modern-title-text">
                                            <h2 className="modern-modal-title">Add New Movement Entry</h2>
                                            <p className="modern-modal-subtitle">
                                                Adding entry for <span className="user-highlight">Day {todaysDate}</span> of{' '}
                                                <span className="user-highlight">{monthNamesObject[currentMonthYear.split('_')[0]]} {currentMonthYear.split('_')[1]}</span>
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
                                        <div className="card-icon">📊</div>
                                        <h3 className="card-title">Entry Details</h3>
                                    </div>
                                    
                                    <div className="modern-form-grid">
                                        <div className="modern-form-group">
                                            <label className="modern-form-label required">
                                                <span className="label-icon">⏰</span>
                                                Hours
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
                                            <label className="modern-form-label required">
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
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="form-section-card">
                                    <div className="card-header">
                                        <div className="card-icon">🔧</div>
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
                                        onClick={() => {
                                            if (!newHours || !newNauticalMiles) {
                                                alert('Please fill in both fields.');
                                                return;
                                            }

                                            const confirmAdd = window.confirm('Are you sure you want to add this entry?');
                                            if (confirmAdd) {
                                                if (currentMonthYearTransaction[0]) {
                                                    if (!currentMonthYearTransaction[0][`Day_${todaysDate}`]) {
                                                        currentMonthYearTransaction[0].increment_hr_value = newHours;
                                                        currentMonthYearTransaction[0].increment_km_value = newNauticalMiles;
                                                        currentMonthYearTransaction[0].Inserted_on = currentMonthYearTransaction[0].Inserted_on.split('T')[0];
                                                        currentMonthYearTransaction[0][`Day_${todaysDate}`] = `${newHours}=${newNauticalMiles}`;
                                                        handleUpdateTransaction(currentMonthYearTransaction[0]);
                                                    } else {
                                                        alert('You have already filled the value for this day. To update it, please contact Office side Authority.');
                                                    }
                                                } else {
                                                    alert('We need to begin first transaction..');
                                                }

                                                setNewHours('');
                                                setNewNauticalMiles('');
                                                setWantToAddHourOrNM(false);
                                            }
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
        </div>
    );
};

export default Movement_transaction_page;