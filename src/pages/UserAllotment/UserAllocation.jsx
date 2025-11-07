import React, { useState, useEffect, useContext, useCallback } from 'react';
import './UserAllocation.css';
import { DesignationsContext } from '../../contexts/DesignationContext/DesignationsContext';
import { UserContexts } from '../../contexts/UserContext/UserContexts';
import { ShipsContext } from '../../contexts/ShipContext/ShipsContext';
import { DepartmentsContext } from '../../contexts/DepartmentContext/DepartmentsContext';
import { OfficeStaffCombination_Context } from '../../contexts/OfficeStaffCombinationContext/OfficeStaffCombination_Context';
import { ShipCrewCombinationContext } from '../../contexts/ShipCrewCombinationContext/ShipCrewCombinationContexts';
import { UserAuthContext } from '../../contexts/userAuth/UserAuthContext';
import axios from 'axios';
import { Profile_header_context } from '../../contexts/profile_header_context/Profile_header_context';
import { CrewContext } from '../../contexts/crew_context/CrewContext';
import { PlannedJobsContext } from '../../contexts/planned_jobs_context/PlannedJobsContext';
import { JCD_scheduleContext } from '../../contexts/JCD_schedule_context/JCD_scheduleContext';
import { toast } from 'react-toastify';
// emp_type
const API_BASE = import.meta.env.VITE_API_URL;

const UserAllocation = () => {
    // === CONTEXT ===
    const { designationsList } = useContext(DesignationsContext);
    const { usersList, refreshUsers } = useContext(UserContexts);
    const { shipsList } = useContext(ShipsContext);
    const { departmentsList } = useContext(DepartmentsContext);
    const { officeStaffList, refreshOfficeStaffList } = useContext(OfficeStaffCombination_Context)
    const { crewData, refreshCrewData } = useContext(ShipCrewCombinationContext)
    const { user } = useContext(UserAuthContext)
    const { profiles } = useContext(Profile_header_context)
    const { employeeList } = useContext(CrewContext)
    const { plannedJobList, refreshPlannedJobs, activeJobStatusMap } = useContext(PlannedJobsContext)
    const { JCD_schedule_List, refreshJCDSchedules } = useContext(JCD_scheduleContext);

    // === STATE ===
    const [modalShip, setModalShip] = useState('office');
    const [modalDept, setModalDept] = useState('');
    const [modalDesg, setModalDesg] = useState('');
    const [modalReplaceUser, setModalReplaceUser] = useState('');
    const [modalExpectedDeboardingDate, setModalExpectedDeboardingDate] = useState('');
    const [selectedSuccessor, setSelectedSuccessor] = useState(null);

    // Replace your existing addNewUserPayload state with:
    // Update your newUsersList initial state to include country_code
    const [newUsersList, setNewUsersList] = useState([{
        id: 1,
        first_name: "",
        last_name: "",
        middle_name: "",
        gender: "",
        mobile_no: "",
        country_code: "+91", // Add this field
        user_type: "",
        user_email: "",
        user_status: 1,
        date_of_joining: ""
    }]);
    const [activeUserIndex, setActiveUserIndex] = useState(0);
    const [isExistingShipUser, setIsExistingShipUser] = useState(false);
    const [modalExistingBoardingDate, setModalExistingBoardingDate] = useState('');
    // Add this state for ship statistics
    const [shipStats, setShipStats] = useState({});

    const [crewAllocation, setCrewAllocation] = useState({
        SCCA_ID: '',
        ship_id: modalShip,
        desg_id: '',
        reporting_to_desg: '',
        dept_id: '',
        user_id: '',
        reporting_to_user: '',
        allocate_by: '',
        deboarding_done_by: '',       // Empty string
        date_of_allocation: '',
        date_of_boarding: '',
        place_of_boarding: '',
        expected_deboarding_date: '', // add this field in allocated form
        crew_status: '',
        actual_deboarding_on: null,    // Null value
        replacing_to_user: ''
    });

    const [addNewUserPayload, setAddNewUserPayload] = useState({
        "first_name": "",
        "last_name": "",
        "middle_name": "",
        "gender": null,
        "mobile_no": "",
        "user_type": null,
        "current_pin": "",
        "pin_refreshed_on": null,
        "old_pins": null,
        "otp_at": null,
        "mobile_sim_country_code": "",
        "pin_inactive_on": null,
        "pin_inactive_by": null,
        "user_status": 1,
        "user_email": ""
    })

    const [resetAddNewUserPayload, setResetAddNewUserPayload] = useState({
        "first_name": "",
        "last_name": "",
        "middle_name": "",
        "gender": null,
        "mobile_no": "",
        "user_type": null,
        "current_pin": "",
        "pin_refreshed_on": null,
        "old_pins": null,
        "otp_at": null,
        "mobile_sim_country_code": "",
        "pin_inactive_on": null,
        "pin_inactive_by": null,
        "user_status": 1,
        "user_email": ""
    })

    const [userDetailsErrors, setUserDetailsErrors] = useState({})
    const [allocateDutyErrors, setAllocateDutyErrors] = useState({})
    const [searchQuery, setSearchQuery] = useState('');

    // this is not ship wise this is complete data
    const [shipCrewCombinationListByShip, setShipCrewCombinationListByShip] = useState([])
    const [officeStaffCombinationListByShip, setOfficeStaffCombinationListByShip] = useState([])
    // const [isAddUserButtonClicked, setIsAddUserButtonClicked] = useState(false)
    const [selectedShipID, setSelectedShipID] = useState('office');
    const [departmentsByShip, setDepartmentsByShip] = useState([]);
    const [designationsByDept, setDesignationsByDept] = useState({});
    const [allocations, setAllocations] = useState({});
    const [users, setUsers] = useState({});
    const [availableUsers, setAvailableUsers] = useState([]);
    const [activeTab, setActiveTab] = useState('SELECT USER');
    const [expandedDesignations, setExpandedDesignations] = useState({});
    const [selectedUser, setSelectedUser] = useState(null);
    const [isAllocateDutyClicked, setIsAllocateDutyClicked] = useState(false);
    const [isEditDetails, setIsEditDetails] = useState(false)
    const [isDeboardNowClicked, setIsDeboardNowClicked] = useState(false)
    const [isWantToAddNewUserClicked, setIsWantToAddNewUserClicked] = useState(false)

    // Job Distrinbution states
    const [isWantToSeeActiveJobForThisDeboardUser, setIsWantToSeeActiveJobForThisDeboardUser] = useState(false)

    const [jobDistributionPlan, setJobDistributionPlan] = useState({
        assigned: [], // Array of { JPHA_ID, targetUser }
        paused: []    // Array of { JPHA_ID }
    });

    const [activeJobs, setActiveJobs] = useState([]);
    const [distributionStrategy, setDistributionStrategy] = useState('auto_priority_based');
    const [showManualAdjustment, setShowManualAdjustment] = useState(false);
    const [manualDistribution, setManualDistribution] = useState({});
    const [availableCrewMembers, setAvailableCrewMembers] = useState([]);


    const [deboardedUsersCombinationData, setDeboardedUsersCombinationData] = useState(null)

    const countryCodes = [
        { code: "+1", name: "United States / Canada" },
        { code: "+44", name: "United Kingdom" },
        { code: "+91", name: "India" },
        { code: "+61", name: "Australia" },
        { code: "+81", name: "Japan" },
        { code: "+86", name: "China" },
        { code: "+49", name: "Germany" },
        { code: "+33", name: "France" },
        { code: "+39", name: "Italy" },
        { code: "+7", name: "Russia" },
        { code: "+27", name: "South Africa" },
        { code: "+971", name: "UAE" },
        { code: "+966", name: "Saudi Arabia" },
        { code: "+92", name: "Pakistan" },
        { code: "+880", name: "Bangladesh" },
        { code: "+94", name: "Sri Lanka" },
        { code: "+977", name: "Nepal" },
        { code: "+93", name: "Afghanistan" },
        { code: "+55", name: "Brazil" },
        { code: "+34", name: "Spain" },
        { code: "+62", name: "Indonesia" },
        { code: "+63", name: "Philippines" },
        { code: "+60", name: "Malaysia" },
        { code: "+65", name: "Singapore" },
        { code: "+852", name: "Hong Kong" },
        { code: "+853", name: "Macau" },
        { code: "+82", name: "South Korea" },
        { code: "+90", name: "Turkey" },
        { code: "+98", name: "Iran" },
        // 👉 you can expand this to full ITU list
    ];

    // Add state for On Date, Location, Instruction
    const [modalOnDate, setModalOnDate] = useState('');
    const [modalLocation, setModalLocation] = useState('');
    const [modalInstruction, setModalInstruction] = useState('Kindly Confirm with MR. Gaurav Ship in charge');

    // Add to your existing state declarations
    const [modalExpectedOnboardingDate, setModalExpectedOnboardingDate] = useState('');

    useEffect(() => {
        const calculateShipStats = () => {
            const stats = {};

            shipsList.forEach(ship => {
                const shipCrew = crewData.filter(c => c.ship_id === ship.SHA_ID && c.crew_status === 1).length;
                const shipOffice = officeStaffList.filter(o => o.ship_id === ship.SHA_ID).length;
                const totalAllocated = shipCrew + shipOffice;

                stats[ship.SHA_ID] = {
                    totalAllocated,
                    shipCrew,
                    officeStaff: shipOffice,
                    departments: [...new Set([
                        ...crewData.filter(c => c.ship_id === ship.SHA_ID).map(c => c.dept_id),
                        ...officeStaffList.filter(o => o.ship_id === ship.SHA_ID).map(o => o.dept_id)
                    ])].length
                };
            });

            // Office stats
            const officeStaff = officeStaffList.filter(o => !o.ship_id).length;
            stats['office'] = {
                totalAllocated: officeStaff,
                shipCrew: 0,
                officeStaff: officeStaff,
                departments: [...new Set(officeStaffList.filter(o => !o.ship_id).map(o => o.dept_id))].length
            };

            setShipStats(stats);
        };

        calculateShipStats();
    }, [crewData, officeStaffList, shipsList]);

    // Enhanced Ship Selector Component
    const EnhancedShipSelector = () => (
        <div className="enhanced-ship-selector">

            <select value={selectedShipID} onChange={handleShipChange} className="ship-select">
                {shipsList.map(ship => {
                    const stats = shipStats[ship.SHA_ID] || { totalAllocated: 0, departments: 0 };
                    return (
                        <option key={ship.SHA_ID} value={ship.SHA_ID}>
                            {ship.ship_name} • {stats.departments} depts
                        </option>
                    );
                })}
                <option value="office">
                    Office {shipStats['office']?.totalAllocated || 0} staff • {shipStats['office']?.departments || 0} depts
                </option>
            </select>
        </div>
    );

    // Enhanced Department Tabs Component
    const EnhancedDepartmentTabs = () => {
        const getDepartmentStats = (deptId) => {
            if (!deptId) return { positions: 0, allocated: 0, vacant: 0 };

            const department = departmentsList.find(d => d.DEPT_ID === deptId);
            const designations = designationsByDept[deptId] || [];

            let totalPositions = 0;
            let totalAllocated = 0;

            designations.forEach(desg => {
                const positions = desg.no_of_positions || 0;
                const allocated = allocations[desg.DSGH_ID]?.length || 0;
                totalPositions += positions;
                totalAllocated += allocated;
            });

            return {
                positions: totalPositions,
                allocated: totalAllocated,
                vacant: totalPositions - totalAllocated
            };
        };

        return (
            <div className="dept-tabs">
                <button className={`tab-buttons ${activeTab === 'SELECT USER' ? 'active' : ''}`}>
                    <span
                        onClick={() => handleTabClick('SELECT USER')}
                        id="modal-close-btn"
                        style={{
                            color: 'red',
                            visibility: selectedUser ? 'visible' : 'hidden',
                            position: 'absolute',
                            top: 2,
                            right: 4,
                            fontSize: '10px'
                        }}
                    >
                        ✕
                    </span>
                    {selectedUser ? `${selectedUser.first_name} ${selectedUser.last_name}` : 'SELECT USER'}
                </button>

                {departmentsByShip.map(dept => {
                    const stats = getDepartmentStats(dept.DEPT_ID);
                    return (
                        <button
                            key={dept.DEPT_ID}
                            className={`tab-buttons ${activeTab === dept.dept_name ? 'active' : ''}`}
                            onClick={() => handleTabClick(dept.dept_name)}
                        >
                            <span className="dept-name">{dept.dept_name}</span>
                            <span className="dept-stats">
                                {stats.allocated}/{stats.positions} • {stats.vacant} vacant
                            </span>
                        </button>
                    );
                })}
            </div>
        );
    };

    // Enhanced Designation Cards
    const renderDesignationCards = (deptName) => {
        const dept = departmentsByShip.find(d => d.dept_name === deptName);
        if (!dept) return null;

        const desgs = designationsByDept[dept.DEPT_ID] || [];

        return desgs.map(desg => {
            const isExpanded = expandedDesignations[desg.DSGH_ID] || false;
            const allocatedList = allocations[desg.DSGH_ID] || [];
            const vacantCount = Math.max(0, (desg.no_of_positions || 0) - allocatedList.length);
            const utilizationRate = desg.no_of_positions ?
                Math.round((allocatedList.length / desg.no_of_positions) * 100) : 0;

            return (
                <div key={desg.DSGH_ID} className={`designation-card enhanced ${isExpanded ? 'expanded' : ''}`}>
                    <div className="designation-header" onClick={() => toggleDesignation(desg.DSGH_ID)}>
                        <div className="designation-info">
                            <div className="desg-title-section">
                                <strong className="desg-name">{desg.desg_name}</strong>
                                <span className="desg-code">{desg.desg_code}</span>
                            </div>
                            <div className="position-stats">
                                <div className="utilization-bar">
                                    <div
                                        className="utilization-fill"
                                        style={{ width: `${utilizationRate}%` }}
                                        title={`${utilizationRate}% utilized`}
                                    ></div>
                                </div>
                                <span className="post-count">
                                    {allocatedList.length} / {desg.no_of_positions || 0} positions
                                    {vacantCount > 0 && <span className="vacant-alert"> • {vacantCount} VACANT</span>}
                                </span>
                            </div>
                        </div>
                        <button className="expand-toggle">{isExpanded ? '▲' : '▼'}</button>
                    </div>

                    {isExpanded && (
                        <div className="designation-content">
                            {/* Current Allocations */}
                            {allocatedList.length > 0 && (
                                <div className="allocated-section">
                                    <h4> Currently Allocated ({allocatedList.length})</h4>
                                    {allocatedList.map(alloc => {
                                        const allocatedUser = users[alloc.user_id] || { first_name: 'Unknown', last_name: '' };
                                        const isOfficeAllocation = !!alloc.OSCA_ID;

                                        return (
                                            <div key={alloc.SCCA_ID || alloc.OSCA_ID} className="assigned-user enhanced">
                                                <div className="user-avatar-small">
                                                    {allocatedUser.first_name?.charAt(0)}{allocatedUser.last_name?.charAt(0)}
                                                </div>
                                                <div className="user-info">
                                                    <p className="user-name">
                                                        <strong>{allocatedUser.first_name} {allocatedUser.last_name}</strong>
                                                        <span className="allocation-type">
                                                            {isOfficeAllocation ? 'Office' : 'Ship Crew'}
                                                        </span>
                                                    </p>
                                                    <p className="allocation-dates">
                                                        <span className="date-item">
                                                            Allocated: {alloc.date_of_allocation?.split('T')[0]?.split('-')?.reverse()?.join('/')}
                                                        </span>
                                                        {alloc.expected_deboarding_date && (
                                                            <span className="date-item">
                                                                Expected Deboard: {alloc.expected_deboarding_date?.split('T')[0]?.split('-')?.reverse()?.join('/')}
                                                            </span>
                                                        )}
                                                    </p>
                                                    <p className="user-contact">
                                                        📧 {allocatedUser.email} • 📱 {allocatedUser.mobile_no}
                                                    </p>
                                                </div>

                                                <div className="action-buttons">
                                                    {alloc.SCCA_ID
                                                        ? profiles?.some(p => user?.profile_ids?.includes(p.PROFILE_ID) && p.process_ids.includes("P_UAT_0005")) && (
                                                            <button
                                                                className="deboard-btn"
                                                                onClick={() => {
                                                                    setIsDeboardNowClicked(true);
                                                                    setDeboardedUsersCombinationData(alloc);
                                                                }}
                                                            >
                                                                De-Board
                                                            </button>
                                                        )
                                                        : profiles?.some(p => user?.profile_ids?.includes(p.PROFILE_ID) && p.process_ids.includes("P_UAT_0004")) && (
                                                            <button
                                                                className="deboard-btn"
                                                                onClick={() => {
                                                                    setIsDeboardNowClicked(true);
                                                                    setDeboardedUsersCombinationData(alloc);
                                                                }}
                                                            >
                                                                Suspend
                                                            </button>
                                                        )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Vacant Positions */}
                            {vacantCount > 0 && (
                                <div className="vacant-section">
                                    <h4>🟡 Vacant Positions ({vacantCount})</h4>
                                    {Array.from({ length: vacantCount }).map((_, idx) => (
                                        <div key={idx} className="vacant-slot enhanced">
                                            <div className="vacant-info">
                                                <span className="vacant-icon"></span>
                                                <div>
                                                    <p className="vacant-title">Vacant Position #{idx + 1}</p>
                                                    <p className="vacant-description">Ready for immediate allocation</p>
                                                </div>
                                            </div>
                                            {profiles?.some(p => user?.profile_ids?.includes(p.PROFILE_ID) && p.process_ids.includes("P_UAT_0003")) && (
                                                <button
                                                    className="allocate-btn primary"
                                                    onClick={() => {
                                                        setModalShip(selectedShipID);
                                                        setModalDept(dept.DEPT_ID);
                                                        setModalDesg(desg.DSGH_ID);
                                                        setAllocateDutyErrors({});
                                                        setIsAllocateDutyClicked(true);
                                                    }}
                                                >
                                                    Allocate Now
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {allocatedList.length === 0 && vacantCount === 0 && (
                                <div className="no-positions">
                                    <p>No positions defined for this designation</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            );
        });
    };

    // Quick Stats Panel Component
    const QuickStatsPanel = () => {
        const stats = {
            totalUsers: usersList.length,
            allocatedUsers: availableUsers.filter(u => u.isAllocated).length,
            availableUsers: availableUsers.filter(u => !u.isAllocated && !u.hasPlannedAllocation).length,
            plannedAllocations: availableUsers.filter(u => u.hasPlannedAllocation).length,
            totalShips: shipsList.length,
            totalDepartments: departmentsList.length
        };

        return (
            <div className="quick-stats-panel">
                <div className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-icon"></div>
                        <div className="stat-content">
                            <div className="stat-number">{stats.totalUsers}</div>
                            <div className="stat-label">Total Users</div>
                        </div>
                    </div>

                    <div className="stat-card allocated">
                        <div className="stat-icon">✅</div>
                        <div className="stat-content">
                            <div className="stat-number">{stats.allocatedUsers}</div>
                            <div className="stat-label">Allocated</div>
                        </div>
                    </div>

                    <div className="stat-card available">
                        <div className="stat-icon">🟢</div>
                        <div className="stat-content">
                            <div className="stat-number">{stats.availableUsers}</div>
                            <div className="stat-label">Available</div>
                        </div>
                    </div>

                    <div className="stat-card planned">
                        <div className="stat-icon">📅</div>
                        <div className="stat-content">
                            <div className="stat-number">{stats.plannedAllocations}</div>
                            <div className="stat-label">Planned</div>
                        </div>
                    </div>
                </div>

                <div className="resource-stats">
                    <span className="resource-item">🚢 {stats.totalShips} Ships</span>
                    <span className="resource-item">🏢 {stats.totalDepartments} Departments</span>
                    <span className="resource-item">👔 {designationsList.length} Designations</span>
                </div>
            </div>
        );
    };

    // === FETCH DEPARTMENTS, DESIGNATIONS, ALLOCATIONS ON SHIP CHANGE ===
    useEffect(() => {
        if (!selectedShipID) return;

        const fetchData = () => {
            try {
                // --- 1. Filter Departments for the selected ship/office ---
                const deptData = selectedShipID === 'office'
                    ? departmentsList.filter(d => d.ship_id === null)
                    : departmentsList.filter(d => d.ship_id === selectedShipID);
                setDepartmentsByShip(deptData);
                setActiveTab('SELECT USER');
                setSelectedUser(null);

                // --- 2. Map Designations by Department ---
                const desgMap = {};
                deptData.forEach(dept => {
                    desgMap[dept.DEPT_ID] = designationsList.filter(d => d.DEPT_ID === dept.DEPT_ID) || [];
                });
                setDesignationsByDept(desgMap);

                // --- 3. Choose allocation source based on selectedShipID ---
                let allocData = [];

                if (selectedShipID === 'office') {
                    // Office: use officeStaffList (all are active)
                    allocData = officeStaffList.map(osc => ({
                        ...osc,
                        ship_id: null,
                        crew_status: 1, // all office staff are active
                        desg_id: osc.desg_id,
                        user_id: osc.user_id,
                        dept_id: osc.dept_id,
                    }));
                    setOfficeStaffCombinationListByShip(allocData);
                } else {
                    // Ship: filter crewData by ship_id and active status
                    allocData = crewData.filter(
                        scca => scca.ship_id === selectedShipID && scca.crew_status == 1
                    );
                    setShipCrewCombinationListByShip(allocData);
                }

                // --- 4. Build allocations map and userMap for CURRENT SHIP/OFFICE ---
                const allocMap = {};
                const userMap = {};

                allocData.forEach(alloc => {
                    if (!allocMap[alloc.desg_id]) allocMap[alloc.desg_id] = [];
                    allocMap[alloc.desg_id].push(alloc);

                    const tempUser = usersList.find(u => u.UHA_ID == alloc.user_id);
                    if (tempUser) {
                        userMap[tempUser.UHA_ID] = {
                            UHA_ID: tempUser.UHA_ID,
                            first_name: tempUser.first_name,
                            last_name: tempUser.last_name,
                            email: tempUser.email || '',
                            mobile_no: tempUser.mobile_no || '',
                            duty_level: tempUser.duty_level || 'Level-1',
                            ideal_since: tempUser.ideal_since || '',
                            allocated_profiles: tempUser.allocated_profiles || 'Master',
                        };
                    }
                });

                setAllocations(allocMap);
                setUsers(userMap);

                // --- 5. Compute isAllocated for ALL USERS (GLOBAL allocation status) ---
                // Combine ALL active AND planned allocations from both ships and office
                const allActiveAllocations = [
                    ...crewData.filter(a => a.crew_status === 1),
                    ...officeStaffList
                ];

                const allPlannedAllocations = [
                    ...crewData.filter(a => a.crew_status === 3),
                    ...officeStaffList.filter(a => a.staff_status === 3)
                ];

                const allocatedUserIds = new Set(allActiveAllocations.map(a => a.user_id));
                const plannedUserIds = new Set(allPlannedAllocations.map(a => a.user_id));

                const availableWithStatus = usersList.map(user => ({
                    ...user,
                    // Check if user is allocated to ANY ship/office (GLOBAL status)
                    isAllocated: allocatedUserIds.has(user.UHA_ID),
                    // Check if user has planned allocation
                    hasPlannedAllocation: plannedUserIds.has(user.UHA_ID),
                    // For search functionality - get the actual ship they're allocated to
                    ship_id: allActiveAllocations.find(a => a.user_id === user.UHA_ID)?.ship_id || null,
                }));

                setAvailableUsers(availableWithStatus);
            } catch (err) {
                console.error('Error processing allocation data:', err);
            }
        };

        fetchData();
    }, [selectedShipID, departmentsList, designationsList, usersList, crewData, officeStaffList]);

    useEffect(() => {
        // console.log('allocations :: ', allocations)
    }, [allocations])

    const filteredUsers = availableUsers.filter(user => {
        const fullName = `${user.first_name} ${user.last_name}`.toLowerCase();
        const shipName = shipsList.find(s => s.SHA_ID === user.ship_id)?.ship_name?.toLowerCase() || '';
        return fullName.includes(searchQuery.toLowerCase()) || shipName.includes(searchQuery.toLowerCase());
    });

    // === RESET MODAL FIELDS FUNCTION ===
    const resetModalFields = () => {
        setModalShip(selectedShipID);
        setModalDept('');
        setModalDesg('');
        setModalReplaceUser('');
        setModalExpectedDeboardingDate('');
        setModalOnDate('');
        setModalLocation('');
        setModalInstruction('Kindly Confirm with MR. Gaurav Ship in charge');

        // Reset the crew allocation state
        setCrewAllocation({
            SCCA_ID: '',
            ship_id: selectedShipID,
            desg_id: '',
            reporting_to_desg: '',
            dept_id: '',
            user_id: '',
            reporting_to_user: '',
            allocate_by: '',
            deboarding_done_by: '',
            date_of_allocation: '',
            date_of_boarding: '',
            place_of_boarding: '',
            expected_deboarding_date: '',
            crew_status: '',
            actual_deboarding_on: null,
            replacing_to_user: ''
        });

        // Clear errors
        setAllocateDutyErrors({});
    };

    // === MODIFIED CLOSE HANDLER ===
    const handleCloseAllocateModal = () => {
        setIsAllocateDutyClicked(false);
        resetModalFields();
    };

    // === USER HANDLERS ===
    const handleUserSelect = (user) => {
        setSelectedUser(user);
        setActiveTab(`SELECTED: ${user.first_name} ${user.last_name}`);
    };

    const handleShipChange = (e) => {
        setSelectedShipID(e.target.value);
        setModalShip(e.target.value);
        setModalDept('');
        setModalDesg('');
        setModalReplaceUser('');
    };

    const handleTabClick = (tabName) => {
        setActiveTab(tabName);
        if (tabName === 'SELECT USER') setSelectedUser(null);
    };

    const toggleDesignation = (desgId) => {
        setExpandedDesignations(prev => ({ ...prev, [desgId]: !prev[desgId] }));
    };

    // === RESET DEBOARDING MODAL ===
    const resetDeboardModal = () => {
        setSelectedSuccessor(null);
        setDeboardedUsersCombinationData(null);
        setModalExpectedOnboardingDate(''); // Reset onboarding date
    };

    const handleCloseDeboardModal = () => {
        setIsDeboardNowClicked(false);
        resetDeboardModal();
    };

    // === Handle Deboard ===
    const handleDeboard = async () => {
        const payload = {
            ship_id: deboardedUsersCombinationData?.ship_id || null,
            dept_id: deboardedUsersCombinationData.dept_id,
            desg_id: deboardedUsersCombinationData.desg_id,
            user_id: selectedSuccessor || null, // This determines if there's a successor
            replacing_to_user: deboardedUsersCombinationData.user_id,
            date_of_boarding: deboardedUsersCombinationData.date_of_boarding,
            date_of_deboarding: new Date().toISOString().split('T')[0],
            place_of_boarding: deboardedUsersCombinationData.place_of_boarding || 'Office',
            place_of_deboarding: deboardedUsersCombinationData.place_of_boarding || 'Office',
            expected_deboarding_date: modalExpectedDeboardingDate,
            expected_onboarding_date: modalExpectedOnboardingDate,
            allocate_by: user.UHA_ID,
        };

        console.log('Deboard Payload:', payload);

        try {
            const res = await axios.post(`${API_BASE}deboardUser`, payload);
            if (res.data.success) {
                // Show appropriate message based on deboarding type
                if (res.data.deboardingType === 'planned_with_successor') {
                    alert('Deboard successful! Successor allocation planned and will activate on first login.');
                } else {
                    alert('Deboard successful! User fully deboarded.');

                    // Only generate report for full deboarding (no successor)
                    if (res.data.reportData) {
                        generateCrewReport(res.data.reportData);
                    }
                }

                setIsDeboardNowClicked(false);
                setSelectedSuccessor('');
                setModalExpectedOnboardingDate('');

                // Refresh data
                refreshCrewData();
                refreshOfficeStaffList();

                // Refresh job data if available in your context
                if (refreshPlannedJobs) {
                    refreshPlannedJobs();
                }
            }
        } catch (err) {
            console.error('Deboard error:', err);
            alert('Something went wrong');
        }
    };

    // === Generate Crew Report ===
    const generateCrewReport = (reportData) => {
        const { crewOverview, completedJobs, activeJobs } = reportData;

        // Create modal popup
        const modal = document.createElement('div');
        modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.8);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10000;
    `;

        const modalContent = document.createElement('div');
        modalContent.style.cssText = `
        background: white;
        padding: 20px;
        border-radius: 8px;
        width: 90%;
        height: 90%;
        overflow: auto;
        position: relative;
    `;

        // Header with buttons
        const header = document.createElement('div');
        header.style.cssText = `
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
        padding-bottom: 10px;
        border-bottom: 2px solid #007bff;
    `;

        const title = document.createElement('h2');
        title.textContent = `Crew Deboarding Report - ${crewOverview.userName}`;
        title.style.margin = '0';

        const buttonGroup = document.createElement('div');
        buttonGroup.style.cssText = `
        display: flex;
        gap: 10px;
    `;

        // Print Button
        const printBtn = document.createElement('button');
        printBtn.textContent = '🖨️ Print Report';
        printBtn.style.cssText = `
        padding: 8px 16px;
        background: #007bff;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
    `;
        printBtn.onclick = () => window.print();

        // Download PDF Button
        const downloadBtn = document.createElement('button');
        downloadBtn.textContent = '📥 Download PDF';
        downloadBtn.style.cssText = `
        padding: 8px 16px;
        background: #28a745;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
    `;
        downloadBtn.onclick = () => generatePDF(reportData);

        // Close Button
        const closeBtn = document.createElement('button');
        closeBtn.textContent = '✕ Close';
        closeBtn.style.cssText = `
        padding: 8px 16px;
        background: #dc3545;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
    `;
        closeBtn.onclick = () => document.body.removeChild(modal);

        // Email Status
        const emailStatus = document.createElement('div');
        emailStatus.id = 'emailStatus';
        emailStatus.style.cssText = `
        padding: 10px;
        margin: 10px 0;
        border-radius: 4px;
        background: #d4edda;
        color: #155724;
        display: none;
    `;

        buttonGroup.appendChild(printBtn);
        buttonGroup.appendChild(downloadBtn);
        buttonGroup.appendChild(closeBtn);

        header.appendChild(title);
        header.appendChild(buttonGroup);

        modalContent.appendChild(header);
        modalContent.appendChild(emailStatus);

        // Report Content
        const reportContent = document.createElement('div');
        reportContent.id = 'reportContent';
        reportContent.innerHTML = generateReportHTML(crewOverview, completedJobs, activeJobs);

        modalContent.appendChild(reportContent);
        modal.appendChild(modalContent);
        document.body.appendChild(modal);

        // Auto-send email notification
        sendEmailNotification(reportData);
    };

    // Generate HTML for report
    const generateReportHTML = (crewOverview, completedJobs, activeJobs) => {
        return `
        <div class="report-content">
            <!-- Section 1: Crew Overview -->
            <div class="section">
                <h2>Crew Overview</h2>
                <table>
                    <tr><th>Field</th><th>Value</th></tr>
                    <tr><td>User Name</td><td>${crewOverview.userName || 'N/A'}</td></tr>
                    <tr><td>Ship Name</td><td>${crewOverview.shipName || 'N/A'}</td></tr>
                    <tr><td>Department</td><td>${crewOverview.department || 'N/A'}</td></tr>
                    <tr><td>Designation</td><td>${crewOverview.designation || 'N/A'}</td></tr>
                    <tr><td>Date of Boarding</td><td>${crewOverview.dateOfBoarding || 'N/A'}</td></tr>
                    <tr><td>Place of Boarding</td><td>${crewOverview.placeOfBoarding || 'N/A'}</td></tr>
                    <tr><td>Boarding Done By</td><td>${crewOverview.boardingDoneBy || 'N/A'}</td></tr>
                    <tr><td>Expected Deboarding Date</td><td>${crewOverview.expectedDeboardingDate || 'N/A'}</td></tr>
                    <tr><td>Actual Deboarding Date</td><td>${crewOverview.actualDeboardingDate || 'N/A'}</td></tr>
                    <tr><td>Deboarding Done By</td><td>${crewOverview.deboardingDoneBy || 'N/A'}</td></tr>
                    <tr><td>Reporting To</td><td>${crewOverview.reportingTo || 'N/A'}</td></tr>
                    <tr><td>No. of Approval Pending</td><td>${crewOverview.approvalPending || 0}</td></tr>
                    <tr><td>No. of Acknowledged Jobs</td><td>${crewOverview.acknowledgedJobs || 0}</td></tr>
                    <tr><td>No. of Not Acknowledged Jobs</td><td>${crewOverview.notAcknowledgedJobs || 0}</td></tr>
                    <tr><td>No. of Completed Jobs</td><td>${crewOverview.completedJobs || 0}</td></tr>
                    <tr><td>No. of Failed Jobs</td><td>${crewOverview.failedJobs || 0}</td></tr>
                    <tr><td>No. of Overdue Jobs</td><td>${crewOverview.overdueJobs || 0}</td></tr>
                </table>
            </div>
            
            <!-- Section 2: Completed Jobs -->
            <div class="section">
                <h2>Completed Jobs (${completedJobs.length})</h2>
                ${completedJobs.length > 0 ? `
                <table class="completed-jobs-table">
                    <tr>
                        <th>Job Name</th>
                        <th>Job No</th>
                        <th>Generated On</th>
                        <th>Completed On</th>
                        <th>Expected Days</th>
                        <th>Actual Days</th>
                        <th>Attempts</th>
                        <th>Extensions</th>
                        <th>First Verification</th>
                        <th>Second Verification</th>
                        <th>Extension Authority</th>
                    </tr>
                    ${completedJobs.map(job => `
                        <tr>
                            <td>${job.jobName || 'N/A'}</td>
                            <td>${job.jobNo || 'N/A'}</td>
                            <td>${job.generatedOn || 'N/A'}</td>
                            <td>${job.completedOn || 'N/A'}</td>
                            <td>${job.expectedDaysForCompletion || 'N/A'}</td>
                            <td>${job.daysNeedToComplete || 'N/A'}</td>
                            <td>${job.noOfAttempt || 0}</td>
                            <td>${job.noOfExtensions || 0}</td>
                            <td>
                                <strong>${job.firstVerificationAuthority || 'N/A'}</strong><br>
                                <small>Expected: ${job.expectedDaysOfVerification || 3} days</small><br>
                                <small>Actual: ${job.timeTakenForFirstVerification || 0} days</small>
                            </td>
                            <td>
                                <strong>${job.secondVerificationAuthority || 'N/A'}</strong><br>
                                <small>Expected: ${job.expectedDaysOfVerification || 3} days</small><br>
                                <small>Actual: ${job.timeTakenForSecondVerification || 0} days</small>
                            </td>
                            <td>${job.extensionAuthority || 'N/A'}</td>
                        </tr>
                    `).join('')}
                </table>
                ` : '<p>No completed jobs found.</p>'}
            </div>
            
            <!-- Section 3: Active Jobs -->
            <div class="section">
                <h2>Active Jobs (${activeJobs.length})</h2>
                ${activeJobs.length > 0 ? `
                <table class="active-jobs-table">
                    <tr>
                        <th>Job Name</th>
                        <th>Job No</th>
                        <th>Generated On</th>
                        <th>Expected Days</th>
                        <th>Current Attempts</th>
                        <th>Current Extensions</th>
                        <th>First Verification</th>
                        <th>Second Verification</th>
                        <th>Extension Authority</th>
                        <th>Verification Status</th>
                        <th>Job Status</th>
                        <th>Expected Completion</th>
                    </tr>
                    ${activeJobs.map(job => `
                        <tr>
                            <td>${job.jobName || 'N/A'}</td>
                            <td>${job.jobNo || 'N/A'}</td>
                            <td>${job.generatedOn || 'N/A'}</td>
                            <td>${job.expectedDaysForCompletion || 'N/A'}</td>
                            <td>${job.currentNoOfAttempt || 0}</td>
                            <td>${job.currentNoOfExtensions || 0}</td>
                            <td>
                                <strong>${job.firstVerificationAuthority || 'N/A'}</strong><br>
                                ${job.firstVerificationDate ? `
                                <small>Expected: ${job.expectedDaysOfVerification || 3} days</small><br>
                                <small>Actual: ${job.timeTakenForFirstVerification || 0} days</small>
                                ` : '<small>Pending</small>'}
                            </td>
                            <td>
                                <strong>${job.secondVerificationAuthority || 'N/A'}</strong><br>
                                ${job.secondVerificationDate ? `
                                <small>Expected: ${job.expectedDaysOfVerification || 3} days</small><br>
                                <small>Actual: ${job.timeTakenForSecondVerification || 0} days</small>
                                ` : '<small>Pending</small>'}
                            </td>
                            <td>${job.extensionAuthority || 'N/A'}</td>
                            <td>
                                ${job.verificationStatus || 'N/A'}<br>
                                ${job.firstIntimationDate ? `<small>First Intimation: ${job.firstIntimationDate}</small><br>` : ''}
                                ${job.firstVerificationDate ? `<small>First Done: ${job.firstVerificationDate}</small><br>` : ''}
                                ${job.secondIntimationDate ? `<small>Second Intimation: ${job.secondIntimationDate}</small><br>` : ''}
                                ${job.secondVerificationDate ? `<small>Second Done: ${job.secondVerificationDate}</small>` : ''}
                            </td>
                            <td>${job.jobStatusDescription || 'N/A'}</td>
                            <td>${job.expectedCompletionDate || 'N/A'}</td>
                        </tr>
                    `).join('')}
                </table>
                ` : '<p>No active jobs found.</p>'}
            </div>

            <!-- Section 4: Performance Summary -->
            <div class="section">
                <h2>Performance Summary</h2>
                <table>
                    <tr><th>Metric</th><th>Value</th></tr>
                    <tr><td>Total Jobs Handled</td><td>${(crewOverview.acknowledgedJobs || 0) + (crewOverview.completedJobs || 0) + (crewOverview.failedJobs || 0) + (activeJobs.length || 0)}</td></tr>
                    <tr><td>Completion Rate</td><td>${((crewOverview.completedJobs || 0) / ((crewOverview.acknowledgedJobs || 0) + (crewOverview.completedJobs || 0) + (crewOverview.failedJobs || 0)) * 100 || 0).toFixed(2)}%</td></tr>
                    <tr><td>Average Extensions per Job</td><td>${completedJobs.length > 0 ? (completedJobs.reduce((sum, job) => sum + (job.noOfExtensions || 0), 0) / completedJobs.length).toFixed(2) : '0'}</td></tr>
                    <tr><td>Average Attempts per Job</td><td>${completedJobs.length > 0 ? (completedJobs.reduce((sum, job) => sum + (job.noOfAttempt || 0), 0) / completedJobs.length).toFixed(2) : '0'}</td></tr>
                    ${activeJobs.length > 0 ? `
                    <tr><td>Average First Verification Time</td><td>${(activeJobs.filter(job => job.timeTakenForFirstVerification).reduce((sum, job) => sum + (job.timeTakenForFirstVerification || 0), 0) / activeJobs.filter(job => job.timeTakenForFirstVerification).length || 0).toFixed(2)} days</td></tr>
                    ` : ''}
                </table>
            </div>
        </div>
        
        <style>
            .section { margin-bottom: 30px; border: 1px solid #ddd; padding: 15px; }
            .section h2 { background: #f5f5f5; padding: 10px; margin: -15px -15px 15px -15px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            .completed-jobs-table th, .active-jobs-table th { font-size: 12px; }
            .completed-jobs-table td, .active-jobs-table td { font-size: 11px; }
            
            @media print {
                button { display: none !important; }
                .modal { background: white !important; }
                .modal-content { 
                    width: 100% !important; 
                    height: auto !important;
                    box-shadow: none !important;
                }
            }
        </style>
    `;
    };

    // Generate PDF function
    const generatePDF = async (reportData) => {
        try {
            const { crewOverview, completedJobs, activeJobs } = reportData;

            // You can use libraries like jsPDF or html2pdf.js
            // Example with html2pdf.js (you need to include the library)
            if (typeof html2pdf !== 'undefined') {
                const element = document.getElementById('reportContent');
                const opt = {
                    margin: 10,
                    filename: `Crew_Deboarding_Report_${crewOverview.userName}_${new Date().toISOString().split('T')[0]}.pdf`,
                    image: { type: 'jpeg', quality: 0.98 },
                    html2canvas: { scale: 2 },
                    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
                };

                await html2pdf().set(opt).from(element).save();
            } else {
                // Fallback to print if PDF library not available
                window.print();
            }
        } catch (error) {
            console.error('PDF generation failed:', error);
            alert('PDF generation failed. Using print instead.');
            window.print();
        }
    };

    // Send email notification  
    const sendEmailNotification = async (reportData) => {
        try {
            const emailStatus = document.getElementById('emailStatus');
            emailStatus.style.display = 'block';
            emailStatus.textContent = '📧 Sending email notifications to Fleet Manager and Superintendent...';
            emailStatus.style.background = '#fff3cd';
            emailStatus.style.color = '#856404';

            const response = await axios.post(`${API_BASE}sendCrewReportEmail`, {
                reportData: reportData,
                shipId: deboardedUsersCombinationData?.ship_id, // Use this from your deboarding data
                crewName: reportData.crewOverview.userName
            });

            if (response.data.success) {
                emailStatus.textContent = '✅ Report sent successfully to Fleet Manager and Superintendent';
                emailStatus.style.background = '#d4edda';
                emailStatus.style.color = '#155724';
            } else {
                emailStatus.textContent = '❌ Failed to send email notifications';
                emailStatus.style.background = '#f8d7da';
                emailStatus.style.color = '#721c24';
            }
        } catch (error) {
            console.error('Email notification failed:', error);
            const emailStatus = document.getElementById('emailStatus');
            emailStatus.style.display = 'block';
            emailStatus.textContent = '❌ Failed to send email notifications';
            emailStatus.style.background = '#f8d7da';
            emailStatus.style.color = '#721c24';
        }
    };

    const handleDutyAllocation = async () => {
        // Ensure selectedUser exists
        if (!selectedUser) {
            alert("No user selected for allocation.");
            return;
        }

        await refreshCrewData()

        // 🔍 Check if user is already allocated on another ship or office
        const existingShipAllocation = crewData.find(
            c => c.user_id === selectedUser.UHA_ID && (c.crew_status === 1 || c.crew_status === 3)
        );

        await refreshOfficeStaffList()

        const existingOfficeAllocation = officeStaffCombinationListByShip.find(
            c => c.user_id === selectedUser.UHA_ID
        );

        if (existingShipAllocation) {
            alert(
                `User is already allocated to ship "${shipsList.find(s => s.SHA_ID === existingShipAllocation.ship_id)?.ship_name || 'N/A'}". Cannot allocate again.`
            );
            return; // stop the allocation process
        }

        if (existingOfficeAllocation) {
            alert("User is already allocated as Office Staff. Cannot allocate again.");
            return; // stop the allocation process
        }

        // Build final payload
        const payload = {
            ship_id: modalShip === 'office' ? null : modalShip,
            dept_id: modalDept,
            desg_id: modalDesg,
            user_id: selectedUser.UHA_ID,
            replacing_to_user: (crewAllocation.replacing_to_user)?.startsWith('vacant') ? null : crewAllocation.replacing_to_user,
            date_of_boarding: modalOnDate,
            place_of_boarding: modalLocation,
            crew_status: 3,
            allocate_by: user.UHA_ID,
            date_of_allocation: new Date().toISOString().split('T')[0],
            expected_deboarding_date: modalExpectedDeboardingDate,
            // replaced_users_actual_deboarding_on: modalOnDate,
            replaced_users_deboarding_done_by: user.UHA_ID,
            SCCA_ID: null,
        };

        console.log('Allocation Payload:', payload);

        try {
            const response = await fetch(`${API_BASE}allocatedDuty`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            if (response.ok) {
                const result = await response.json();
                console.log('Allocation successful:', result);
                alert('Duty allocation Planned successfully!');

                // Refresh data
                refreshCrewData();
                refreshOfficeStaffList();

                // Reset modal
                setModalReplaceUser('');
                setModalOnDate('');
                setModalLocation('');
                setModalInstruction('Kindly Confirm with MR. Gaurav Ship in charge');
                // Reset modal using the new function
                resetModalFields();
                setIsAllocateDutyClicked(false);
            } else {
                const error = await response.json();
                console.error('Allocation failed:', error);
                toast.error('Position Is Occupied. Please try Try On different Position.');
            }
        } catch (err) {
            console.error('Network error during allocation:', err);
            alert('Network error. Please check your connection.');
        }
    };

    // === RENDER SELECTED USER FORM ===
    const renderSelectedUserForm = () => {
        if (!selectedUser) return null;

        // Ensure country code exists in dropdown
        const selectedCode = "+" + selectedUser.mobile_sim_country_code;
        const codesWithSelected = countryCodes.some(c => c.code === selectedCode)
            ? countryCodes
            : [{ code: selectedCode, name: "Selected User Country" }, ...countryCodes];

        // Default values
        let user_desg_code = 'Not Assigned Yet';
        let user_assigned_ship_code = 'Not Assigned Yet';
        let date_of_allocation = '';
        let date_of_boarding = '';
        let expected_deboarding_date = '';
        let place_of_boarding = '';
        let ideal_since = '';
        let isOfficeAllocation = false;
        let isPlannedAllocation = false;
        let plannedAllocationDetails = null;

        // 🔍 Find ALL allocation records (active, planned, past)
        const allAllocationRecords = [
            ...crewData.filter(a => a.user_id === selectedUser.UHA_ID),
            ...officeStaffList.filter(a => a.user_id === selectedUser.UHA_ID)
        ];

        // Find active allocation
        let activeAllocationRecord = allAllocationRecords.find(
            a => (a.crew_status === 1 || a.staff_status === 1)
        );

        // Find planned allocation
        let plannedAllocationRecord = allAllocationRecords.find(
            a => (a.crew_status === 3 || a.staff_status === 3)
        );

        if (activeAllocationRecord) {
            // User has ACTIVE allocation
            const allocationRecord = activeAllocationRecord;
            isOfficeAllocation = !!allocationRecord.OSCA_ID;

            // Get designation code
            user_desg_code = designationsList.find(d => d.DSGH_ID === allocationRecord.desg_id)?.desg_code || 'N/A';

            if (isOfficeAllocation) {
                user_assigned_ship_code = 'Office';
                date_of_allocation = allocationRecord.date_of_allocation?.split('T')[0] || 'N/A';
                date_of_boarding = allocationRecord.date_of_boarding?.split('T')[0] || 'N/A';
                expected_deboarding_date = allocationRecord.expected_deboarding_date?.split('T')[0] || 'N/A';
                place_of_boarding = 'Office';
            } else {
                user_assigned_ship_code = shipsList.find(s => s.SHA_ID === allocationRecord.ship_id)?.ship_name || 'N/A';
                date_of_allocation = allocationRecord.date_of_allocation?.split('T')[0] || '';
                date_of_boarding = allocationRecord.date_of_boarding?.split('T')[0] || '';
                expected_deboarding_date = allocationRecord.expected_deboarding_date?.split('T')[0] || '';
                place_of_boarding = allocationRecord.place_of_boarding || '';
            }
        } else if (plannedAllocationRecord) {
            // User has PLANNED allocation
            isPlannedAllocation = true;
            const allocationRecord = plannedAllocationRecord;
            isOfficeAllocation = !!allocationRecord.OSCA_ID;

            // Get designation code
            user_desg_code = designationsList.find(d => d.DSGH_ID === allocationRecord.desg_id)?.desg_code || 'N/A';

            if (isOfficeAllocation) {
                user_assigned_ship_code = 'Office (Planned)';
                date_of_allocation = allocationRecord.date_of_allocation?.split('T')[0] || 'N/A';
                date_of_boarding = allocationRecord.date_of_boarding?.split('T')[0] || 'N/A';
                expected_deboarding_date = allocationRecord.expected_deboarding_date?.split('T')[0] || 'N/A';
                place_of_boarding = 'Office';
            } else {
                user_assigned_ship_code = `${shipsList.find(s => s.SHA_ID === allocationRecord.ship_id)?.ship_name || 'N/A'} (Planned)`;
                date_of_allocation = allocationRecord.date_of_allocation?.split('T')[0] || '';
                date_of_boarding = allocationRecord.date_of_boarding?.split('T')[0] || '';
                expected_deboarding_date = allocationRecord.expected_deboarding_date?.split('T')[0] || '';
                place_of_boarding = allocationRecord.place_of_boarding || '';
            }

            // Store planned allocation details for display
            plannedAllocationDetails = {
                ship_name: shipsList.find(s => s.SHA_ID === allocationRecord.ship_id)?.ship_name || 'Office',
                dept_name: departmentsList.find(d => d.DEPT_ID === allocationRecord.dept_id)?.dept_name || 'N/A',
                desg_name: designationsList.find(d => d.DSGH_ID === allocationRecord.desg_id)?.desg_name || 'N/A',
                date_of_boarding: allocationRecord.date_of_boarding?.split('T')[0] || 'N/A',
                expected_deboarding_date: allocationRecord.expected_deboarding_date?.split('T')[0] || 'N/A'
            };
        } else {
            // ❌ User is NOT allocated → show ideal since logic (from past ship history)
            const pastAllocations = crewData.filter(
                scca => scca.user_id === selectedUser.UHA_ID && scca.crew_status === 2 && scca.actual_deboarding_on
            );

            let nearestDeboardingDate = null;
            if (pastAllocations.length > 0) {
                const today = new Date();
                const deboardingDates = pastAllocations
                    .map(scca => new Date(scca.actual_deboarding_on))
                    .filter(date => !isNaN(date));

                if (deboardingDates.length > 0) {
                    nearestDeboardingDate = deboardingDates.reduce((prev, curr) => {
                        const prevDiff = Math.abs(today - prev);
                        const currDiff = Math.abs(today - curr);
                        return currDiff < prevDiff ? curr : prev;
                    }, deboardingDates[0]);
                }
            }

            ideal_since = nearestDeboardingDate
                ? nearestDeboardingDate.toISOString().split('T')[0]
                : 'New Joiner (No Previous Data..)';
        }

        return (
            <div className="selected-user-form">
                <div className="user-info-grid" style={{ position: 'relative' }}>
                    {profiles?.filter(p => user?.profile_ids?.includes(p.PROFILE_ID))[0]?.process_ids.includes("P_UAT_0002") && (
                        <button
                            id="selected-user-form-edit-details-button"
                            onClick={() => setIsEditDetails(true)}
                        >
                            Edit Details
                        </button>
                    )}

                    {/* User Basic Information */}
                    <div className="form-section-header">
                        <h4>Basic Information</h4>
                    </div>

                    {/* First Name */}
                    <div className="form-group">
                        <label>First Name</label>
                        <input
                            type="text"
                            value={selectedUser.first_name}
                            placeholder="Enter First Name"
                            readOnly={!isEditDetails}
                            onChange={(e) => setSelectedUser({ ...selectedUser, first_name: e.target.value })}
                        />
                        {selectedUser.first_name === "" && userDetailsErrors.first_name && (
                            <p className="error-text">{userDetailsErrors.first_name}</p>
                        )}
                    </div>

                    {/* Last Name */}
                    <div className="form-group">
                        <label>Last Name</label>
                        <input
                            type="text"
                            value={selectedUser.last_name}
                            placeholder="Enter Last Name"
                            readOnly={!isEditDetails}
                            onChange={(e) => setSelectedUser({ ...selectedUser, last_name: e.target.value })}
                        />
                        {selectedUser.last_name === "" && userDetailsErrors.last_name && (
                            <p className="error-text">{userDetailsErrors.last_name}</p>
                        )}
                    </div>

                    {/* Email */}
                    <div className="form-group">
                        <label>Email</label>
                        <input
                            type="email"
                            value={selectedUser.user_email}
                            placeholder={selectedUser.user_email}
                            readOnly={!isEditDetails}
                            onChange={(e) => setSelectedUser({ ...selectedUser, user_email: e.target.value })}
                        />
                        {selectedUser.user_email === "" && userDetailsErrors.user_email && (
                            <p className="error-text">{userDetailsErrors.user_email}</p>
                        )}
                    </div>

                    {/* Mobile */}
                    <div className="form-group">
                        <label>Mobile No</label>
                        <div className="mobile-input">
                            <select
                                disabled={!isEditDetails}
                                value={"+" + selectedUser.mobile_sim_country_code}
                                onChange={(e) =>
                                    setSelectedUser({
                                        ...selectedUser,
                                        mobile_sim_country_code: e.target.value.replace("+", ""),
                                    })
                                }
                            >
                                {codesWithSelected.map((c) => (
                                    <option key={c.code} value={c.code} title={c.name}>
                                        {c.code}
                                    </option>
                                ))}
                            </select>
                            <input
                                type="number"
                                value={selectedUser.mobile_no}
                                placeholder={selectedUser.mobile_no}
                                readOnly={!isEditDetails}
                                onChange={(e) => setSelectedUser({ ...selectedUser, mobile_no: e.target.value })}
                            />
                        </div>
                        {selectedUser.mobile_no === "" && userDetailsErrors.mobile_no && (
                            <p className="error-text">{userDetailsErrors.mobile_no}</p>
                        )}
                    </div>

                    {/* Allocation Status Summary */}
                    <div className="form-section-header">
                        <h4>Allocation Status</h4>
                    </div>

                    {/* Allocation Status Badge */}
                    <div className="form-group full-width">
                        <label>Current Status</label>
                        <div className={`status-display-badge ${selectedUser.isAllocated ? 'status-active' :
                            selectedUser.hasPlannedAllocation ? 'status-planned' :
                                'status-available'
                            }`}>
                            {selectedUser.isAllocated ? 'ACTIVELY ALLOCATED' :
                                selectedUser.hasPlannedAllocation ? 'PLANNED ALLOCATION' :
                                    'AVAILABLE FOR ALLOCATION'}
                            {isPlannedAllocation && (
                                <span className="status-note">(Will activate on first login after boarding date)</span>
                            )}
                        </div>
                    </div>

                    {/* === NOT ALLOCATED: Show Ideal Since & Past Ship === */}
                    {!selectedUser.isAllocated && !selectedUser.hasPlannedAllocation && (
                        <>
                            {ideal_since === 'New Joiner (No Previous Data..)' ? (
                                <div className="form-group">
                                    <label>Ideal Since</label>
                                    <input type="text" readOnly value={ideal_since} />
                                </div>
                            ) : (
                                <>
                                    <div className="form-group">
                                        <label>Ideal Since</label>
                                        <input type="date" readOnly value={ideal_since} />
                                    </div>
                                    <div className="form-group">
                                        <label>Last Ship</label>
                                        <input
                                            type="text"
                                            readOnly
                                            value={
                                                shipsList.find(
                                                    s =>
                                                        s.SHA_ID ==
                                                        crewData.find(
                                                            scca =>
                                                                scca.user_id == selectedUser.UHA_ID &&
                                                                scca.crew_status == 2 &&
                                                                scca.actual_deboarding_on?.split('T')[0] == ideal_since
                                                        )?.ship_id
                                                )?.ship_name || 'N/A'
                                            }
                                        />
                                    </div>
                                </>
                            )}
                        </>
                    )}

                    {/* === PLANNED ALLOCATION DETAILS === */}
                    {isPlannedAllocation && plannedAllocationDetails && (
                        <>
                            <div className="form-section-header">
                                <h4>📅 Planned Allocation Details</h4>
                            </div>

                            <div className="form-group">
                                <label>Planned Location</label>
                                <input type="text" readOnly value={plannedAllocationDetails.ship_name}
                                    style={{ backgroundColor: '#fff3cd', color: '#856404' }} />
                            </div>

                            <div className="form-group">
                                <label>Planned Department</label>
                                <input type="text" readOnly value={plannedAllocationDetails.dept_name}
                                    style={{ backgroundColor: '#fff3cd', color: '#856404' }} />
                            </div>

                            <div className="form-group">
                                <label>Planned Designation</label>
                                <input type="text" readOnly value={plannedAllocationDetails.desg_name}
                                    style={{ backgroundColor: '#fff3cd', color: '#856404' }} />
                            </div>

                            <div className="form-group">
                                <label>Scheduled Boarding Date</label>
                                <input type="date" readOnly value={plannedAllocationDetails.date_of_boarding}
                                    style={{ backgroundColor: '#fff3cd', color: '#856404' }} />
                            </div>

                            <div className="form-group">
                                <label>Expected Deboarding Date</label>
                                <input type="date" readOnly value={plannedAllocationDetails.expected_deboarding_date}
                                    style={{ backgroundColor: '#fff3cd', color: '#856404' }} />
                            </div>
                        </>
                    )}

                    {/* === ACTIVE ALLOCATION DETAILS === */}
                    {selectedUser.isAllocated && !isOfficeAllocation && (
                        <>
                            <div className="form-section-header">
                                <h4>Current Allocation Details</h4>
                            </div>

                            <div className="form-group">
                                <label>Allocated Ship</label>
                                <input type="text" readOnly value={user_assigned_ship_code} />
                            </div>

                            {selectedUser.isAllocated && (
                                <div className="form-group">
                                    <label>Allocated Profile</label>
                                    <input type="text" readOnly value={user_desg_code} />
                                </div>
                            )}

                            <div className="form-group">
                                <label>Date Of Allocation</label>
                                <input type="date" disabled value={date_of_allocation} />
                            </div>
                            <div className="form-group">
                                <label>Date Of Boarding</label>
                                <input type="date" disabled value={date_of_boarding} />
                            </div>
                            <div className="form-group">
                                <label>Expected Date Of De-Boarding</label>
                                <input type="date" disabled value={expected_deboarding_date} />
                            </div>
                            <div className="form-group">
                                <label>Place Of Boarding</label>
                                <input type="text" disabled value={place_of_boarding} />
                            </div>
                        </>
                    )}

                    {selectedUser.isAllocated && isOfficeAllocation && (
                        <div className="form-group">
                            <label>Allocation Type</label>
                            <input type="text" readOnly value="Office Staff" />
                        </div>
                    )}
                </div>

                {/* Action Buttons */}
                <div className="action-buttons-container">
                    {isEditDetails ? (
                        <button
                            className="bulk-allocate-btn"
                            onClick={handleUpdateUserDetails}
                        >
                            Save Changes
                        </button>
                    ) : (
                        !selectedUser.isAllocated && !selectedUser.hasPlannedAllocation &&
                        profiles?.filter(p => user?.profile_ids?.includes(p.PROFILE_ID))[0]?.process_ids.includes("P_UAT_0003") && (
                            <button
                                className="bulk-allocate-btn"
                                onClick={() => {
                                    setModalShip(selectedShipID);
                                    setIsAllocateDutyClicked(true);
                                }}
                            >
                                Allocate Duty
                            </button>
                        )
                    )}

                    {profiles?.filter(p => user?.profile_ids?.includes(p.PROFILE_ID))[0]?.process_ids.includes("P_UAT_0002") && (
                        <button
                            className="btn-cancel"
                            disabled={!isEditDetails}
                            onClick={() => setIsEditDetails(false)}
                            style={{
                                cursor: isEditDetails ? 'pointer' : 'not-allowed',
                                opacity: isEditDetails ? 1 : 0.5,
                            }}
                        >
                            Cancel
                        </button>
                    )}
                </div>
            </div>
        );
    };

    // === Update User Details Handler ===
    const handleUpdateUserDetails = async () => {
        const { first_name, last_name, user_email, mobile_sim_country_code, mobile_no } = selectedUser;

        const newErrors = {};

        // --- Validations ---
        if (!first_name || first_name.trim() === "") {
            newErrors.first_name = "First name cannot be empty";
        }
        if (!last_name || last_name.trim() === "") {
            newErrors.last_name = "Last name cannot be empty";
        }
        if (!user_email || user_email.trim() === "") {
            newErrors.user_email = "Email cannot be empty";
        } else {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(user_email)) {
                newErrors.user_email = "Please enter a valid email";
            }
        }
        if (!mobile_no || mobile_no.trim() === "") {
            newErrors.mobile_no = "Mobile number cannot be empty";
        } else if (mobile_no.length < 10) {
            newErrors.mobile_no = "Mobile number must be at least 10 digits";
        }

        // --- If errors exist, update state and stop ---
        if (Object.keys(newErrors).length > 0) {
            setUserDetailsErrors(newErrors);
            return;
        }

        // --- Clear errors if validation passed ---
        setUserDetailsErrors({});

        // --- Build Payload ---
        const payload = {
            first_name: first_name.trim(),
            last_name: last_name.trim(),
            user_email: user_email.trim(),
            mobile_sim_country_code: mobile_sim_country_code,
            mobile_no: mobile_no.trim()
        };

        console.log("Update Payload:", payload);

        try {
            // Show loading state if you have one
            // setIsLoading(true); // Uncomment if you have loading state

            const response = await axios.put(`${API_BASE}updateUser/${selectedUser.UHA_ID}`, payload);

            console.log("User updated:", response.data);

            // ✅ SUCCESS: Show success message
            toast.success("User details updated successfully!");

            // ✅ Close edit mode
            setIsEditDetails(false);

            // ✅ Refresh user data
            await refreshUsers(); // Refresh the main users list

            // ✅ Refresh crew data if this user is allocated
            await refreshCrewData();

            // ✅ Refresh office staff list
            await refreshOfficeStaffList();

            // ✅ If this user is selected, update the local state with fresh data
            // You might want to fetch the updated user data or update locally
            const updatedUser = { ...selectedUser, ...payload };
            setSelectedUser(updatedUser);

        } catch (error) {
            console.error("Update failed:", error);

            // ✅ ERROR: Show appropriate error message
            if (error.response) {
                // Server responded with error status
                const errorMessage = error.response.data?.message || "Failed to update user details";
                toast.error(`Update failed: ${errorMessage}`);

                // Handle specific error cases
                if (error.response.status === 400) {
                    // Bad request - might be validation errors from server
                    if (error.response.data.errors) {
                        setUserDetailsErrors(error.response.data.errors);
                    }
                } else if (error.response.status === 404) {
                    toast.error("User not found");
                } else if (error.response.status === 500) {
                    toast.error("Server error. Please try again later.");
                }
            } else if (error.request) {
                // Network error
                toast.error("Network error. Please check your connection.");
            } else {
                // Other errors
                toast.error("An unexpected error occurred.");
            }
        } finally {
            // Hide loading state if you have one
            // setIsLoading(false); // Uncomment if you have loading state
        }
    };

    // === handle Add New User ===
    const handleAddNewUser = (e) => {
        e.preventDefault();

        const { first_name, middle_name, last_name, mobile_no, user_email } = addNewUserPayload;

        // Validate names (no spaces, not empty)
        if (!first_name || /\s/.test(first_name)) {
            alert("First Name is required and cannot contain spaces");
            return;
        }
        if (!middle_name || /\s/.test(middle_name)) {
            alert("Middle Name is required and cannot contain spaces");
            return;
        }
        if (!last_name || /\s/.test(last_name)) {
            alert("Last Name is required and cannot contain spaces");
            return;
        }

        // Validate mobile number
        if (!/^\d{10}$/.test(mobile_no)) {
            alert("Mobile number must be exactly 10 digits");
            return;
        }

        // Validate email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(user_email)) {
            alert("Please enter a valid email address");
            return;
        }

        // console.log("✅ addNewUserPayload : ", addNewUserPayload);
        alert("User data is valid and ready to be submitted!");
    };


    // === Helper For validation error for allocate duty ===
    const validateCrewAllocation = () => {
        const newErrors = {};

        if (!crewAllocation.ship_id) newErrors.ship_id = "Please select a ship";
        if (!crewAllocation.dept_id) newErrors.dept_id = "Please select a department";
        if (!crewAllocation.desg_id) newErrors.desg_id = "Please select a designation";
        if (!crewAllocation.replacing_to_user) newErrors.replacing_to_user = "Please select a person to replace";
        if (!crewAllocation.date_of_boarding) newErrors.date_of_boarding = "Please select a date";
        if (!crewAllocation.place_of_boarding) newErrors.place_of_boarding = "Please enter duty location";
        // if (!crewAllocation.crew_status) newErrors.crew_status = "Please enter joining instruction";

        setAllocateDutyErrors(newErrors);

        return Object.keys(newErrors).length === 0; // return true if no errors
    };

    // Add these functions to your component
    const addNewUserForm = () => {
        const newUser = {
            id: Date.now(),
            first_name: "",
            last_name: "",
            middle_name: "",
            gender: "",
            mobile_no: "",
            user_type: "",
            user_email: "",
            user_status: 1,
            date_of_joining: ""
        };
        setNewUsersList(prev => [...prev, newUser]);
        setActiveUserIndex(newUsersList.length); // Fixed: use newUsersList.length
    };

    const removeUser = (index) => {
        if (newUsersList.length === 1) return;

        setNewUsersList(prev => prev.filter((_, i) => i !== index));
        if (activeUserIndex >= index && activeUserIndex > 0) {
            setActiveUserIndex(prev => prev - 1);
        }
    };

    const updateUserField = (index, field, value) => {
        setNewUsersList(prev =>
            prev.map((user, i) =>
                i === index ? { ...user, [field]: value } : user
            )
        );
    };

    // validation function for mobile number
    const validateMobileNumber = (number) => {
        return /^\d{10}$/.test(number);
    };

    const handleAddMultipleUsers = async (e) => {
        e.preventDefault();

        let validUsersPayloadList = []

        // Validate all users
        const validUsers = newUsersList.filter(user =>
            user.first_name &&
            user.last_name &&
            user.mobile_no &&
            validateMobileNumber(user.mobile_no) &&
            user.user_email &&
            user.user_type
        );

        // Check for invalid mobile numbers
        const invalidMobileUsers = newUsersList.filter(user =>
            user.mobile_no && !validateMobileNumber(user.mobile_no)
        );

        if (invalidMobileUsers.length > 0) {
            alert('Please enter valid 10-digit mobile numbers for all users');
            return;
        }

        if (validUsers.length === 0) {
            alert('Please fill in all required fields for at least one user');
            return;
        }

        try {
            // Process each user
            for (const user of validUsers) {
                const payload = {
                    first_name: user.first_name.trim(),
                    last_name: user.last_name.trim(),
                    middle_name: user.middle_name?.trim() || '',
                    gender: user.gender ? (user.gender == 'Male' || user.gender == 'male' ? 1 : 2) : null,
                    mobile_no: user.mobile_no,
                    mobile_sim_country_code: user.country_code ? user.country_code.replace('+', '') : "91",
                    user_type: parseInt(user.user_type) || 1,
                    user_email: user.user_email.trim(),
                    user_status: user.user_status || 1,
                    date_of_joining: user.date_of_joining || null,
                    current_pin: "000000"
                };
                validUsersPayloadList.push(payload);
            }

            console.log('Sending users to backend:', validUsersPayloadList);

            // Using axios
            const response = await axios.post(`${API_BASE}add-multiple-users`, {
                users: validUsersPayloadList
            });

            if (response.data.success) {
                alert(`Successfully added ${validUsers.length} user${validUsers.length !== 1 ? 's' : ''}!`);
                console.log('Added users:', response.data.data);

                // If this is an existing ship user, automatically allocate them
                if (isExistingShipUser && modalShip && modalDept && modalDesg && modalExistingBoardingDate) {
                    await allocateExistingShipUsers(response.data.data);
                }

                setIsWantToAddNewUserClicked(false);
                setIsExistingShipUser(false);
                setModalExistingBoardingDate('');

                // Reset form
                setNewUsersList([{
                    id: 1,
                    first_name: "",
                    last_name: "",
                    middle_name: "",
                    gender: "",
                    mobile_no: "",
                    country_code: "+91",
                    user_type: "",
                    user_email: "",
                    user_status: 1,
                    date_of_joining: ""
                }]);
                setActiveUserIndex(0);

                // Refresh the users list
                if (refreshUsers) {
                    refreshUsers();
                }
            } else {
                alert(`Error: ${response.data.message}`);
            }

        } catch (error) {
            console.error('Error adding users:', error);
            alert(`Error adding users: ${error.response?.data?.message || error.message}`);
        }
    };

    // New function to allocate existing ship users
    const allocateExistingShipUsers = async (newUsers) => {
        try {
            const allocationPromises = newUsers.map(async (user) => {
                const payload = {
                    ship_id: modalShip === 'office' ? null : modalShip,
                    dept_id: modalDept,
                    desg_id: modalDesg,
                    user_id: user.UHA_ID,
                    replacing_to_user: null, // No replacement for existing ship users
                    date_of_boarding: modalExistingBoardingDate,
                    place_of_boarding: modalLocation || 'Ship',
                    crew_status: 1, // Active status for existing users
                    allocate_by: user.UHA_ID,
                    date_of_allocation: new Date().toISOString().split('T')[0],
                    expected_deboarding_date: modalExpectedDeboardingDate || null,
                    replaced_users_deboarding_done_by: user.UHA_ID,
                    SCCA_ID: null,
                };

                console.log('Allocating existing ship user:', payload);

                const response = await axios.post(`${API_BASE}allocatedDuty`, payload);
                return response.data;
            });

            const results = await Promise.all(allocationPromises);
            console.log('Allocation results for existing ship users:', results);

            alert(`Successfully allocated ${newUsers.length} user${newUsers.length !== 1 ? 's' : ''} to the ship!`);

            // Refresh data
            refreshCrewData();
            refreshOfficeStaffList();

        } catch (error) {
            console.error('Error allocating existing ship users:', error);
            alert('Users were added but allocation failed. Please allocate them manually.');
        }
    };

    // ==========================
    // Job Distribution and Deboarding Flow
    // ==========================
    const handleConfirmDeboardingWithJobDistribution = async () => {
        try {
            console.log('🚀 Starting deboarding process with job redistribution...');

            // === STEP 1: Validate essential data ===
            if (!deboardedUsersCombinationData?.user_id || !deboardedUsersCombinationData?.ship_id) {
                alert('Missing deboarded user or ship details.');
                return;
            }

            // === STEP 2: Prepare redistribution data ===
            const redistributionData = {
                deboardedUserId: deboardedUsersCombinationData.user_id,
                successorId: selectedSuccessor || null,
                shipId: deboardedUsersCombinationData.ship_id,
                jobDistributionPlan: jobDistributionPlan, // structure: { assigned: [...], paused: [...] }
            };

            console.log('🧩 Redistribution Payload:', redistributionData);

            // === STEP 3: Call Job Redistribution API ===
            console.log('📡 Calling job redistribution API...');
            const redistributionResponse = await axios.post(
                `${API_BASE}redistributeJobsAfterDeboarding`,
                redistributionData
            );

            if (!redistributionResponse.data.success) {
                throw new Error(`Job redistribution failed: ${redistributionResponse.data.message}`);
            }

            console.log('✅ Job redistribution completed successfully.');

            // === STEP 4: Deboard user (with handled jobs flag) ===
            const deboardPayload = {
                ship_id: deboardedUsersCombinationData.ship_id,
                dept_id: deboardedUsersCombinationData.dept_id,
                desg_id: deboardedUsersCombinationData.desg_id,
                user_id: selectedSuccessor || null,
                replacing_to_user: deboardedUsersCombinationData.user_id,
                date_of_boarding: deboardedUsersCombinationData.date_of_boarding,
                date_of_deboarding: new Date().toISOString().split('T')[0],
                place_of_boarding: deboardedUsersCombinationData.place_of_boarding || 'Office',
                place_of_deboarding: deboardedUsersCombinationData.place_of_boarding || 'Office',
                expected_deboarding_date: modalExpectedDeboardingDate,
                expected_onboarding_date: modalExpectedOnboardingDate,
                allocate_by: user?.UHA_ID,
                jobs_already_redistributed: true, // ✅ tells backend not to redistribute again
            };

            console.log('📦 Deboard Payload:', deboardPayload);
            console.log('📡 Calling deboard API...');

            const deboardResponse = await axios.post(`${API_BASE}deboardUser`, deboardPayload);

            if (!deboardResponse.data.success) {
                throw new Error(`Deboard failed: ${deboardResponse.data.message}`);
            }

            // === STEP 5: Handle response & feedback ===
            if (deboardResponse.data.deboardingType === 'planned_with_successor') {
                alert('✅ Deboard successful! Successor allocation planned and will activate on first login.');
            } else {
                alert('✅ Deboard successful! User fully deboarded and jobs redistributed.');

                if (deboardResponse.data.reportData) {
                    generateCrewReport(deboardResponse.data.reportData);
                }
            }

            // === STEP 6: Cleanup and refresh ===
            setIsWantToSeeActiveJobForThisDeboardUser(false);
            setIsDeboardNowClicked(false);
            setSelectedSuccessor('');
            setModalExpectedOnboardingDate('');
            setJobDistributionPlan({ assigned: [], paused: [] });

            // Refresh necessary data
            refreshCrewData?.();
            refreshOfficeStaffList?.();
            refreshPlannedJobs?.();

            console.log('🎯 Deboarding and job redistribution flow completed.');

        } catch (error) {
            console.error('❌ Error during deboarding with job distribution:', error);
            alert(`Error during deboarding process: ${error.message}`);
        }
    };


    const getAvailableCrewForDistribution = useCallback(() => {
        if (!deboardedUsersCombinationData?.ship_id || !deboardedUsersCombinationData?.desg_id)
            return [];

        const { ship_id, dept_id, desg_id, user_id } = deboardedUsersCombinationData;

        // Step 1️⃣: Find number of positions for this designation
        const currentDesg = designationsList.find(
            d => d.DSGH_ID === desg_id && d.DEPT_ID === dept_id && d.SHA_ID === ship_id
        );
        const noOfPositions = currentDesg ? parseInt(currentDesg.no_of_positions || 1) : 1;

        // Step 2️⃣: Get all active crew on same ship except deboarded one
        const activeCrew = crewData.filter(
            c => c.ship_id === ship_id && c.crew_status === 1 && c.user_id !== user_id
        );

        let filteredCrew = [];

        if (noOfPositions > 1) {
            // 🧩 Case 1: Multiple positions — show siblings
            filteredCrew = activeCrew.filter(c => c.desg_id === desg_id);
        } else {
            // 🧩 Case 2: Single position — show secondaries (based on secondary_issued_to users)
            const secondaryUserIds = [
                ...new Set(
                    activeJobs
                        .filter(job => job.issued_to === user_id && job.secondary_issued_to)
                        .map(job => job.secondary_issued_to)
                        .filter(Boolean)
                )
            ];

            // Find their designations from crewData
            const secondaryDesgIds = [
                ...new Set(
                    crewData
                        .filter(
                            c =>
                                secondaryUserIds.includes(c.user_id) &&
                                c.ship_id === ship_id &&
                                c.crew_status === 1
                        )
                        .map(c => c.desg_id)
                )
            ];

            // Now get all crew on same ship with those secondary designations
            filteredCrew = activeCrew.filter(c => secondaryDesgIds.includes(c.desg_id));
        }

        // Step 3️⃣: Map details for display
        return filteredCrew.map(c => ({
            ...c,
            userDetails: users[c.user_id],
            designation: designationsList.find(d => d.DSGH_ID === c.desg_id)
        }));
    }, [deboardedUsersCombinationData, crewData, users, designationsList, activeJobs]);

    const handleDistributionStrategyChange = (strategy) => {
        setDistributionStrategy(strategy);
        const newPlan = generateDistributionPlan(activeJobs, strategy);
        setJobDistributionPlan(newPlan);
    };

    const handleManualAdjustment = async () => {
        const temp = await getAvailableCrewForDistribution()
        setAvailableCrewMembers(temp);
        setManualDistribution(jobDistributionPlan);
        setShowManualAdjustment(true);
    };

    // Add the missing helper functions that renderDistributionPlanning depends on
    const calculateDistributionStats = (plan) => {
        const successorJobs = plan.successor?.length || 0;
        const otherCrewJobs = plan.otherCrew ? Object.values(plan.otherCrew).reduce((total, jobs) => total + jobs.length, 0) : 0;
        const pausedJobs = plan.paused?.length || 0;
        const totalJobs = successorJobs + otherCrewJobs + pausedJobs;

        // Calculate distribution per crew member
        const crewDistribution = plan.otherCrew ? Object.entries(plan.otherCrew).map(([userId, jobs]) => ({
            userId,
            userName: users[userId]?.first_name || 'Unknown',
            jobCount: jobs.length
        })) : [];

        return {
            successorJobs,
            otherCrewJobs,
            pausedJobs,
            totalJobs,
            crewDistribution
        };
    };

    // Add this useEffect to refresh JCD schedules when the modal opens
    useEffect(() => {
        const refreshData = async () => {
            if (isWantToSeeActiveJobForThisDeboardUser) {
                await refreshJCDSchedules();
            }
        };

        refreshData();
    }, [isWantToSeeActiveJobForThisDeboardUser]);

    const updateJobAssignment = (job, assignment) => {
        // assignment is either:
        // - a user ID (e.g., "UHA_0002") → assign
        // - "paused" → pause

        setJobDistributionPlan(prev => {
            const { assigned = [], paused = [] } = prev;
            const jobId = job.JPHA_ID;

            // Remove from both lists first
            const newAssigned = assigned.filter(j => j.JPHA_ID !== jobId);
            const newPaused = paused.filter(j => j.JPHA_ID !== jobId);

            // Add to correct list
            if (assignment === 'paused') {
                newPaused.push({ JPHA_ID: jobId });
            } else {
                newAssigned.push({ JPHA_ID: jobId, targetUser: assignment });
            }

            return { assigned: newAssigned, paused: newPaused };
        });
    };

    const findJobAssignment = useCallback(
        (job) => {
            if (!jobDistributionPlan) return null;

            const { assigned = [], paused = [] } = jobDistributionPlan;
            const jobId = job.JPHA_ID;

            // Check assigned jobs
            const assignedJob = assigned.find((j) => j.JPHA_ID === jobId);
            if (assignedJob) {
                return { assignedTo: 'other_crew', targetUser: assignedJob.targetUser };
            }

            // Check paused jobs
            const pausedJob = paused.find((j) => j.JPHA_ID === jobId);
            if (pausedJob) {
                return { assignedTo: 'paused' };
            }

            return null;
        },
        [jobDistributionPlan]
    );

    const renderActiveJobsWithControls = useCallback(async () => {
        if (!activeJobs.length) {
            return (
                <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '40px' }}>
                        No active jobs found for this user
                    </td>
                </tr>
            );
        }

        const availableCrew = await getAvailableCrewForDistribution();

        return activeJobs.map((job, index) => {
            // Get current assignment from distribution plan
            const jobAssignment = findJobAssignment(job);
            const assignedTo = jobAssignment?.assignedTo || 'paused';
            const targetUser = jobAssignment?.targetUser || null;

            const jcd = JCD_schedule_List.find(j => j.JCDSHA_ID == job.jcd_id);
            const priority = jcd?.criticality == 1 ? 'high' : 'low';

            return (
                <tr key={job.JPHA_ID || index}>
                    <td>{job.JPHA_ID || `N/A`}</td>
                    <td>{jcd?.jcd_name || 'Unnamed Job'}</td>
                    <td>
                        <span className={`priority-badge priority-${(priority || 'medium').toLowerCase()}`}>
                            {jcd?.criticality == 1 ? 'Critical' : 'Not-Critical'}
                        </span>
                    </td>
                    <td>{(job?.job_completed_till) ? (job?.job_completed_till).split('T')[0].split('-').reverse().join('/') : 'N/A'}</td>
                    <td>
                        <span className={`status-badge status-${(job.status || 'pending').toLowerCase().replace(' ', '-')}`}>
                            {activeJobStatusMap[job.job_status] || 'Pending'}
                        </span>
                    </td>
                    <td>
                        {assignedTo === 'successor' && selectedSuccessor ? (
                            <span style={{ color: '#4299e1' }}>
                                {users[selectedSuccessor]?.first_name}
                            </span>
                        ) : assignedTo === 'other_crew' && targetUser ? (
                            <span style={{ color: '#48bb78' }}>
                                {users[targetUser]?.first_name}
                            </span>
                        ) : (
                            <span style={{ color: '#ed8936' }}>Paused</span>
                        )}
                    </td>
                    <td>
                        <div className="job-assignment-controls">
                            <select
                                className={`assignment-select ${assignedTo === 'successor'
                                    ? 'successor'
                                    : assignedTo === 'other_crew'
                                        ? 'other-crew'
                                        : 'paused'
                                    }`}
                                value={targetUser || assignedTo}
                                onChange={(e) => updateJobAssignment(job, e.target.value)}
                            >
                                <option value="paused">Suspend Job</option>
                                {availableCrew.map(crew => (
                                    <option key={crew.user_id} value={crew.user_id}>
                                        Assign to {crew.userDetails?.first_name} ({crew.designation?.desg_name})
                                    </option>
                                ))}
                            </select>

                        </div>
                    </td>
                </tr>
            );
        });
    }, [activeJobs, JCD_schedule_List, selectedSuccessor, users, activeJobStatusMap, getAvailableCrewForDistribution, findJobAssignment, updateJobAssignment]);

    // the useEffect that generates the distribution plan
    useEffect(() => {
        const fetchActiveJobs = async () => {
            if (isWantToSeeActiveJobForThisDeboardUser && deboardedUsersCombinationData) {
                try {
                    await refreshPlannedJobs();

                    // Filter active jobs for the deboarded user
                    const userActiveJobs = plannedJobList.filter(pl =>
                        pl.job_status != 6 &&
                        pl.issued_to === deboardedUsersCombinationData.user_id
                    );

                    setActiveJobs(userActiveJobs);

                    // Generate initial distribution plan with the new structure
                    const initialPlan = generateDistributionPlan(userActiveJobs, distributionStrategy);
                    setJobDistributionPlan(initialPlan);

                } catch (error) {
                    console.error('Error fetching active jobs:', error);
                    setActiveJobs([]);
                }
            }
        };

        fetchActiveJobs();
    }, [isWantToSeeActiveJobForThisDeboardUser, deboardedUsersCombinationData, distributionStrategy]);

    // Add these helper functions to your component
    const getActiveJobsCount = () => {
        return activeJobs.length || 0;
    };

    const generateDistributionPlan = async (jobs, strategy = 'auto_priority_based') => {
        const availableCrew = await getAvailableCrewForDistribution();
        const plan = {
            successor: [],
            otherCrew: {},
            paused: []
        };

        // If there's a successor, assign all jobs to successor by default
        if (selectedSuccessor) {
            jobs.forEach(job => {
                plan.successor.push({
                    ...job,
                    assignedTo: 'successor',
                    targetUser: selectedSuccessor,
                    reason: 'Auto-assigned to successor'
                });
            });
        } else {
            // No successor - distribute among available crew based on strategy
            if (strategy === 'auto_priority_based' && availableCrew.length > 0) {
                // Distribute critical jobs first, then non-critical
                const criticalJobs = jobs.filter(job => {
                    const jcd = JCD_schedule_List.find(j => j.JCDSHA_ID == job.jcd_id);
                    return jcd?.criticality == 1;
                });

                const nonCriticalJobs = jobs.filter(job => {
                    const jcd = JCD_schedule_List.find(j => j.JCDSHA_ID == job.jcd_id);
                    return jcd?.criticality != 1;
                });

                // Distribute critical jobs first
                criticalJobs.forEach((job, index) => {
                    const crewIndex = index % availableCrew.length;
                    const assignedCrew = availableCrew[crewIndex];

                    if (!plan.otherCrew[assignedCrew.user_id]) {
                        plan.otherCrew[assignedCrew.user_id] = [];
                    }

                    plan.otherCrew[assignedCrew.user_id].push({
                        ...job,
                        assignedTo: 'other_crew',
                        targetUser: assignedCrew.user_id,
                        reason: 'Critical job - auto-assigned'
                    });
                });

                // Distribute non-critical jobs
                nonCriticalJobs.forEach((job, index) => {
                    const crewIndex = index % availableCrew.length;
                    const assignedCrew = availableCrew[crewIndex];

                    if (!plan.otherCrew[assignedCrew.user_id]) {
                        plan.otherCrew[assignedCrew.user_id] = [];
                    }

                    plan.otherCrew[assignedCrew.user_id].push({
                        ...job,
                        assignedTo: 'other_crew',
                        targetUser: assignedCrew.user_id,
                        reason: 'Non-critical job - auto-assigned'
                    });
                });
            } else if (strategy === 'equal_distribution' && availableCrew.length > 0) {
                // Equal distribution strategy
                jobs.forEach((job, index) => {
                    const crewIndex = index % availableCrew.length;
                    const assignedCrew = availableCrew[crewIndex];

                    if (!plan.otherCrew[assignedCrew.user_id]) {
                        plan.otherCrew[assignedCrew.user_id] = [];
                    }

                    plan.otherCrew[assignedCrew.user_id].push({
                        ...job,
                        assignedTo: 'other_crew',
                        targetUser: assignedCrew.user_id,
                        reason: 'Equal distribution'
                    });
                });
            } else {
                // No strategy or no crew available - pause all jobs
                jobs.forEach(job => {
                    plan.paused.push({
                        ...job,
                        assignedTo: 'paused',
                        targetUser: null,
                        reason: 'No distribution strategy or available crew'
                    });
                });
            }
        }

        return plan;
    };

    const renderDistributionPlanning = () => {
        const stats = calculateDistributionStats(jobDistributionPlan);

        return (
            <div className="distribution-planning-section">
                <h3>Job Distribution Planning</h3>

                <div className="distribution-controls">
                    <div className="distribution-strategy">
                        <label>Distribution Strategy:</label>
                        <select
                            className="strategy-select"
                            value={distributionStrategy}
                            onChange={(e) => handleDistributionStrategyChange(e.target.value)}
                        >
                            <option value="auto_priority_based">Auto - Priority Based</option>
                            <option value="equal_distribution">Auto - Equal Distribution</option>
                            <option value="manual">Manual Assignment</option>
                        </select>
                    </div>

                    <button
                        className="manual-adjust-btn"
                        onClick={handleManualAdjustment}
                    >
                        📊 Manual Adjustment
                    </button>
                </div>

                <div className="distribution-stats">
                    <div className="stat-card">
                        <div className="stat-value" style={{ color: '#4299e1' }}>
                            {stats.successorJobs}
                        </div>
                        <div className="stat-label">To Successor</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-value" style={{ color: '#48bb78' }}>
                            {stats.otherCrewJobs}
                        </div>
                        <div className="stat-label">To Other Crew</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-value" style={{ color: '#ed8936' }}>
                            {stats.pausedJobs}
                        </div>
                        <div className="stat-label">To Be Paused</div>
                    </div>
                </div>

                {/* Show detailed crew distribution */}
                {stats.crewDistribution.length > 0 && (
                    <div className="crew-distribution-details">
                        <h4>Crew Distribution Details:</h4>
                        {stats.crewDistribution.map(crew => (
                            <div key={crew.userId} className="crew-distribution-item">
                                <span className="crew-name">{crew.userName}</span>
                                <span className="crew-job-count">{crew.jobCount} job(s)</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    };

    // Enhanced User Card Component
    const UserCard = ({ user, onClick }) => {
        const getUserAllocationInfo = () => {
            if (user.isAllocated) {
                console.log('user :: ', user);

                // Check both ship crew & office staff data
                const allocation = [...crewData, ...officeStaffList].find(
                    a => a.user_id === user.UHA_ID && (a.crew_status === 1 || !a.staff_status)
                );

                if (allocation) {
                    console.log('allocation :: ', allocation);
                    const isShipCrew = !!allocation.ship_id; // ✅ Corrected
                    const ship = isShipCrew
                        ? shipsList.find(s => s.SHA_ID === allocation.ship_id)
                        : null;

                    const designation = designationsList.find(d => d.DSGH_ID === allocation.desg_id);
                    const department = departmentsList.find(d => d.DEPT_ID === allocation.dept_id);

                    // Handle office staff → allocated_ships field
                    const allocatedShipIds = !isShipCrew
                        ? officeStaffList.find(os => os.user_id === user.UHA_ID)?.allocated_ships
                        : null;

                    const allocatedShipsNames = allocatedShipIds
                        ? allocatedShipIds
                            .split(',')
                            .map(shipId => shipsList.find(s => s.SHA_ID === shipId)?.ship_name)
                            .filter(Boolean)
                            .join(', ')
                        : null;

                    return {
                        type: isShipCrew ? 'Ship Crew' : 'Office Staff',
                        location: isShipCrew
                            ? ship?.ship_name || 'Ship Unavailable'
                            : allocatedShipsNames || 'Head Office',
                        designation: designation?.desg_name || 'N/A',
                        department: department?.dept_name || 'N/A',
                        since: allocation.date_of_boarding?.split('T')[0] || 'N/A',
                        expectedDeboarding: allocation.expected_deboarding_date?.split('T')[0] || 'Not set'
                    };
                }
            }
            else if (user.hasPlannedAllocation) {
                return {
                    type: '📅 Planned Allocation',
                    location: 'Pending',
                    designation: 'Pending',
                    department: 'Pending',
                    since: 'Future',
                    expectedDeboarding: 'Not set'
                };
            }

            return {
                type: '🟢 Available',
                location: 'Not Allocated',
                designation: 'N/A',
                department: 'N/A',
                since: 'N/A',
                expectedDeboarding: 'N/A'
            };
        };

        const info = getUserAllocationInfo();
        const statusClass = user.isAllocated ? 'allocated' : user.hasPlannedAllocation ? 'planned' : 'available';

        return (
            <li className={`user-card ${statusClass}`} onClick={() => onClick(user)}>
                <div className="user-card-header">
                    <div className="user-avatar">
                        {user.first_name?.charAt(0)}{user.last_name?.charAt(0)}
                    </div>
                    <div className="user-basic-info">
                        <span className="user-name">{user.first_name} {user.last_name}</span>
                        {/* <span className="user-level">{user.duty_level || 'LEVEL-1'}</span> */}
                        <span className="user-email">{user.user_email}</span>
                    </div>
                    <div className={`status-badge status-${statusClass}`}>
                        {user.isAllocated ? 'ALLOCATED' :
                            user.hasPlannedAllocation ? 'PLANNED' : 'AVAILABLE'}
                    </div>
                </div>

                {/* <div className="user-card-details">
                    <div className="detail-row">
                        <span className="detail-label">Type:</span>
                        <span className="detail-value">{info.type}</span>
                    </div>
                    <div className="detail-row">
                        <span className="detail-label">Location:</span>
                        <span className="detail-value">{info.location}</span>
                    </div>
                    <div className="detail-row">
                        <span className="detail-label">Designation:</span>
                        <span className="detail-value">{info.designation}</span>
                    </div>
                    {info.department !== 'N/A' && (
                        <div className="detail-row">
                            <span className="detail-label">Department:</span>
                            <span className="detail-value">{info.department}</span>
                        </div>
                    )}
                    {info.since !== 'N/A' && info.since !== 'Future' && (
                        <div className="detail-row">
                            <span className="detail-label">Boarded Since:</span>
                            <span className="detail-value">{info.since}</span>
                        </div>
                    )}
                    {info.expectedDeboarding !== 'Not set' && info.expectedDeboarding !== 'N/A' && (
                        <div className="detail-row">
                            <span className="detail-label">Expected Deboard:</span>
                            <span className="detail-value">{info.expectedDeboarding}</span>
                        </div>
                    )}
                </div> */}

                <div className="user-card-footer">
                    <span className="mobile-info">📱 {user.mobile_no}</span>

                    {/* 🧭 Ship crew → show ship name directly
        🏢 Office staff → show tooltip with allocated ships */}
                    {info.type === 'Office Staff' ? (
                        <span
                            className="mobile-info"
                            title={
                                info.location !== 'Head Office'
                                    ? `Allocated Ships: ${info.location}`
                                    : 'Head Office'
                            }
                            style={{ cursor: info.location !== 'Head Office' ? 'help' : 'default' }}
                        >
                            🏢 {info.location !== 'Head Office'
                                ? `${info.location.split(', ').length} Ship${info.location.split(', ').length > 1 ? 's' : ''}`
                                : info.location}
                        </span>
                    ) : (
                        <span className="mobile-info">🚢 {info.location}</span>
                    )}

                    <span className="view-details">Click for details →</span>
                </div>

            </li>
        );
    };


    // === RENDER ===
    return (
        <div className="user-allocation-main">
            {/* LEFT PANEL */}
            <div className="user-list-container">
                <header className="user-list-header">
                    <h2> User / Staff / Crew Management</h2>
                </header>

                <div className="search-box">
                    <div className="search-wrapper">
                        <input
                            type="text"
                            placeholder="🔍 SEARCH CREW NAME / SHIP NAME / EMAIL"
                            className="search-input"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{ marginTop: '15px' }}
                        />
                    </div>
                </div>

                <div className="user-table-header">
                    <span className="name-col">USER DETAILS</span>
                    <span className="status-col">STATUS</span>
                </div>

                <ul className="user-list">
                    {filteredUsers.map(user => (
                        <UserCard
                            key={user.UHA_ID}
                            user={user}
                            onClick={handleUserSelect}
                        />
                    ))}
                </ul>

                <div className="action-footer">
                    <button
                        title='Add User'
                        onClick={() => { setIsWantToAddNewUserClicked(true) }}
                        className="add-user-btn"
                    >
                        + Add New User
                    </button>
                </div>
            </div>


            {/* RIGHT PANEL */}
            <div className="dept-desg-container">
                {/* Enhanced Ship Selector */}
                <EnhancedShipSelector />

                {/* Enhanced Department Tabs */}
                <EnhancedDepartmentTabs />

                <div className="designation-section">
                    {activeTab === 'SELECT USER' && !selectedUser ? (
                        <div className="select-user-placeholder">
                            <div className="placeholder-content">
                                <div className="placeholder-icon">👆</div>
                                <h3>Select a User</h3>
                                <p>Choose a user from the left panel to view details, edit information, or allocate duty</p>
                                <div className="placeholder-stats">
                                    <span>{filteredUsers.length} users found</span>
                                    <span>•</span>
                                    <span>{availableUsers.filter(u => u.isAllocated).length} currently allocated</span>
                                    <span>•</span>
                                    <span>{availableUsers.filter(u => !u.isAllocated && !u.hasPlannedAllocation).length} available</span>
                                </div>
                            </div>
                        </div>
                    ) : activeTab.startsWith('SELECTED:') ? (
                        renderSelectedUserForm()
                    ) : (
                        renderDesignationCards(activeTab)
                    )}
                </div>
            </div>


            {/* Allocate Now */}
            {/* validation */}
            {(isAllocateDutyClicked && selectedUser) && (
                <div className="modern-modal-overlay allocate-duty-modal">
                    <div className="modern-user-modal allocate-duty-modal-content">
                        {/* Header */}
                        <div className="modern-modal-header">
                            <div className="modern-header-content">
                                <div className="modern-title-section">
                                    <div className="modern-modal-icon allocate-icon">
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke="currentColor" strokeWidth="2" />
                                            <path d="M19 4H5C3.89543 4 3 4.89543 3 6V18C3 19.1046 3.89543 20 5 20H19C20.1046 20 21 19.1046 21 18V6C21 4.89543 20.1046 4 19 4Z" stroke="currentColor" strokeWidth="2" />
                                            <path d="M16 2V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                            <path d="M8 2V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                        </svg>
                                    </div>
                                    <div className="modern-title-text">
                                        <h2 className="modern-modal-title">Allocate Duty Position</h2>
                                        <p className="modern-modal-subtitle">
                                            Assigning duty to <span className="user-highlight">{selectedUser.first_name} {selectedUser.last_name}</span>
                                        </p>
                                    </div>
                                </div>
                                <button
                                    className="modern-close-button"
                                    onClick={handleCloseAllocateModal}
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        {/* User Summary Card */}
                        <div className="user-summary-card">
                            <div className="user-avatar-large">
                                {selectedUser.first_name?.charAt(0)}{selectedUser.last_name?.charAt(0)}
                            </div>
                            <div className="user-summary-info">
                                <h3>{selectedUser.first_name} {selectedUser.last_name}</h3>
                                <div className="user-details-grid">
                                    <div className="user-detail">
                                        <span className="detail-label">Email</span>
                                        <span className="detail-value">{selectedUser.user_email}</span>
                                    </div>
                                    <div className="user-detail">
                                        <span className="detail-label">Mobile</span>
                                        <span className="detail-value">{selectedUser.mobile_no}</span>
                                    </div>
                                    <div className="user-detail">
                                        <span className="detail-label">Status</span>
                                        <span className={`status-badge ${selectedUser.isAllocated ? 'allocated' : selectedUser.hasPlannedAllocation ? 'planned' : 'available'}`}>
                                            {selectedUser.isAllocated ? 'Allocated' : selectedUser.hasPlannedAllocation ? 'Planned' : 'Available'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Form Content */}
                        <div className="modern-modal-content">
                            <div className="allocation-form-section">
                                <div className="form-section-card">
                                    <div className="card-header">
                                        <div className="card-icon">📍</div>
                                        <h4 className="card-title">Duty Location & Position</h4>
                                    </div>

                                    <div className="modern-form-grid">
                                        {/* Ship Selection */}
                                        <div className="modern-form-group">
                                            <label className="modern-form-label required">
                                                <span className="label-icon">🚢</span>
                                                Selected Location
                                            </label>
                                            <div className="select-wrapper">
                                                <select
                                                    value={modalShip}
                                                    onChange={(e) => {
                                                        setModalShip(e.target.value);
                                                        setModalDept('');
                                                        setModalDesg('');
                                                        setModalReplaceUser('');
                                                        setCrewAllocation(prev => ({
                                                            ...prev,
                                                            ship_id: e.target.value
                                                        }));
                                                    }}
                                                    className="modern-form-input"
                                                >
                                                    <option value="">Choose a location...</option>
                                                    {shipsList.map(ship => (
                                                        <option key={ship.SHA_ID} value={ship.SHA_ID}>
                                                            {ship.ship_name}
                                                        </option>
                                                    ))}
                                                </select>
                                                <div className="select-arrow">▼</div>
                                            </div>
                                            {allocateDutyErrors.ship_id && (
                                                <div className="validation-message error">
                                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                        <path d="M12 8V12M12 16H12.01M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                    </svg>
                                                    {allocateDutyErrors.ship_id}
                                                </div>
                                            )}
                                        </div>

                                        {/* Department Selection */}
                                        <div className="modern-form-group">
                                            <label className="modern-form-label required">
                                                <span className="label-icon">🏢</span>
                                                Department
                                            </label>
                                            <div className="select-wrapper">
                                                <select
                                                    value={modalDept}
                                                    onChange={(e) => {
                                                        setModalDept(e.target.value);
                                                        setModalDesg('');
                                                        setModalReplaceUser('');
                                                        setCrewAllocation(prev => ({
                                                            ...prev,
                                                            dept_id: e.target.value
                                                        }));
                                                    }}
                                                    disabled={!modalShip}
                                                    className="modern-form-input"
                                                >
                                                    <option value="">Select Department</option>
                                                    {departmentsList
                                                        .filter(d => modalShip === 'office' ? d.ship_id === null : d.ship_id === modalShip)
                                                        .map(dept => (
                                                            <option key={dept.DEPT_ID} value={dept.DEPT_ID}>
                                                                {dept.dept_name}
                                                            </option>
                                                        ))}
                                                </select>
                                                <div className="select-arrow">▼</div>
                                            </div>
                                            {allocateDutyErrors.dept_id && (
                                                <div className="validation-message error">
                                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                        <path d="M12 8V12M12 16H12.01M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                    </svg>
                                                    {allocateDutyErrors.dept_id}
                                                </div>
                                            )}
                                        </div>

                                        {/* Designation Selection */}
                                        <div className="modern-form-group">
                                            <label className="modern-form-label required">
                                                <span className="label-icon">💼</span>
                                                Designation
                                            </label>
                                            <div className="select-wrapper">
                                                <select
                                                    value={modalDesg}
                                                    onChange={(e) => {
                                                        setModalDesg(e.target.value);
                                                        setModalReplaceUser('');
                                                        setCrewAllocation(prev => ({
                                                            ...prev,
                                                            desg_id: e.target.value
                                                        }));
                                                    }}
                                                    disabled={!modalDept}
                                                    className="modern-form-input"
                                                >
                                                    <option value="">Select Designation</option>
                                                    {designationsList
                                                        .filter(d => d.DEPT_ID === modalDept)
                                                        .map(desg => (
                                                            <option key={desg.DSGH_ID} value={desg.DSGH_ID}>
                                                                {desg.desg_name} ({desg.desg_code})
                                                            </option>
                                                        ))}
                                                </select>
                                                <div className="select-arrow">▼</div>
                                            </div>
                                            {allocateDutyErrors.desg_id && (
                                                <div className="validation-message error">
                                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                        <path d="M12 8V12M12 16H12.01M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                    </svg>
                                                    {allocateDutyErrors.desg_id}
                                                </div>
                                            )}
                                        </div>

                                        {/* Replacing To */}
                                        <div className="modern-form-group">
                                            <label className="modern-form-label required">
                                                <span className="label-icon">🔄</span>
                                                Replacing Position
                                            </label>
                                            <div className="select-wrapper">
                                                <select
                                                    value={modalReplaceUser}
                                                    onChange={(e) => {
                                                        const selectedValue = e.target.value;
                                                        setModalReplaceUser(selectedValue);
                                                        setCrewAllocation(prev => ({
                                                            ...prev,
                                                            replacing_to_user: selectedValue || null
                                                        }));
                                                    }}
                                                    disabled={!modalDesg}
                                                    className="modern-form-input"
                                                >
                                                    <option value="">Select Position</option>
                                                    {modalDesg &&
                                                        (() => {
                                                            const designationPositions = designationsList.find(d => d.DSGH_ID == modalDesg)?.no_of_positions || 0;
                                                            const currentAllocations = allocations[modalDesg] || [];
                                                            const options = [];

                                                            // Add allocated users first
                                                            currentAllocations.forEach((alloc) => {
                                                                if (alloc?.user_id) {
                                                                    const user = users[alloc.user_id];
                                                                    if (user) {
                                                                        options.push(
                                                                            <option key={`user-${alloc.user_id}`} value={alloc.user_id}>
                                                                                👤 {user.first_name} {user.last_name}
                                                                            </option>
                                                                        );
                                                                    }
                                                                }
                                                            });

                                                            // Add vacant positions
                                                            const vacantCount = designationPositions - currentAllocations.length;
                                                            for (let i = 0; i < vacantCount; i++) {
                                                                options.push(
                                                                    <option key={`vacant-${i}`} value={`vacant-${i}`}>
                                                                        🟡 Vacant Position #{i + 1}
                                                                    </option>
                                                                );
                                                            }

                                                            return options;
                                                        })()
                                                    }
                                                </select>
                                                <div className="select-arrow">▼</div>
                                            </div>
                                            {allocateDutyErrors.replacing_to_user && (
                                                <div className="validation-message error">
                                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                        <path d="M12 8V12M12 16H12.01M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                    </svg>
                                                    {allocateDutyErrors.replacing_to_user}
                                                </div>
                                            )}
                                        </div>

                                        {/* Boarding Date */}
                                        <div className="modern-form-group">
                                            <label className="modern-form-label required">
                                                <span className="label-icon">📅</span>
                                                Boarding Date
                                            </label>
                                            <input
                                                type="date"
                                                value={modalOnDate}
                                                min={new Date().toISOString().split('T')[0]}
                                                onChange={(e) => {
                                                    setModalOnDate(e.target.value);
                                                    setCrewAllocation(prev => ({
                                                        ...prev,
                                                        date_of_boarding: e.target.value
                                                    }));
                                                }}
                                                className="modern-form-input"
                                            />
                                            {allocateDutyErrors.date_of_boarding && (
                                                <div className="validation-message error">
                                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                        <path d="M12 8V12M12 16H12.01M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                    </svg>
                                                    {allocateDutyErrors.date_of_boarding}
                                                </div>
                                            )}
                                        </div>

                                        {/* Expected Deboarding Date */}
                                        <div className="modern-form-group">
                                            <label className="modern-form-label">
                                                <span className="label-icon">⏰</span>
                                                Expected Deboarding
                                            </label>
                                            <input
                                                type="date"
                                                value={modalExpectedDeboardingDate}
                                                min={modalOnDate || new Date().toISOString().split('T')[0]}
                                                onChange={(e) => {
                                                    setModalExpectedDeboardingDate(e.target.value);
                                                    setCrewAllocation(prev => ({
                                                        ...prev,
                                                        expected_deboarding_date: e.target.value
                                                    }));
                                                }}
                                                className="modern-form-input"
                                            />
                                        </div>

                                        {/* Duty Location */}
                                        <div className="modern-form-group full-width">
                                            <label className="modern-form-label required">
                                                <span className="label-icon">📍</span>
                                                Duty Location / Port
                                            </label>
                                            <input
                                                type="text"
                                                value={modalLocation}
                                                placeholder="Enter duty location or exchange port..."
                                                onChange={(e) => {
                                                    setModalLocation(e.target.value);
                                                    setCrewAllocation(prev => ({
                                                        ...prev,
                                                        place_of_boarding: e.target.value
                                                    }));
                                                }}
                                                className="modern-form-input"
                                            />
                                            {allocateDutyErrors.place_of_boarding && (
                                                <div className="validation-message error">
                                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                        <path d="M12 8V12M12 16H12.01M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                    </svg>
                                                    {allocateDutyErrors.place_of_boarding}
                                                </div>
                                            )}
                                        </div>

                                        {/* Joining Instructions */}
                                        <div className="modern-form-group full-width">
                                            <label className="modern-form-label">
                                                <span className="label-icon">📝</span>
                                                Joining Instructions
                                            </label>
                                            <textarea
                                                value={modalInstruction}
                                                onChange={(e) => {
                                                    setModalInstruction(e.target.value);
                                                    setCrewAllocation(prev => ({
                                                        ...prev,
                                                        crew_status: e.target.value
                                                    }));
                                                }}
                                                placeholder="Enter any special instructions or notes for this allocation..."
                                                className="modern-form-input textarea"
                                                rows="3"
                                            />
                                            <div className="helper-text">
                                                This information will be shared with the user and relevant authorities
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer Actions */}
                        <div className="modern-modal-footer">
                            <div className="footer-left">
                                <div className="allocation-summary">
                                    <span className="summary-text">
                                        Ready to allocate <strong>{selectedUser.first_name} {selectedUser.last_name}</strong> to position
                                    </span>
                                </div>
                            </div>
                            <div className="footer-right">
                                <button
                                    type="button"
                                    className="modern-btn secondary"
                                    onClick={handleCloseAllocateModal}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    className="modern-btn primary allocate-action-btn"
                                    onClick={async () => {
                                        if (!validateCrewAllocation()) {
                                            return;
                                        }
                                        await handleDutyAllocation();
                                    }}
                                >
                                    <span className="btn-icon">✅</span>
                                    Confirm Allocation
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {isAllocateDutyClicked == true && !selectedUser && (
                <div id='warning-popup'>
                    <div id='warning-popup-content'>
                        <button
                            className="popup-closee"
                            onClick={() => { handleCloseAllocateModal() }}
                        // aria-label="Close warning"
                        >
                            ×
                        </button>
                        <div className="warning-icon"></div>
                        <p>Please select a user first to allocate duty</p>
                        <div className="warning-popup-actions">
                            <button
                                className="warning-popup-ok-btn"
                                onClick={() => { handleCloseAllocateModal() }}
                            >
                                Got It
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {isDeboardNowClicked && (
                <div className="modal-overlay">
                    <div className="deboard-modal">
                        {/* Header */}
                        <div className="modal-header">
                            <div className="header-content">
                                <h2 className="modal-title">Initiate Deboarding Process</h2>
                            </div>
                            <button
                                className="close-button"
                                onClick={() => { handleCloseDeboardModal() }}
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </button>
                        </div>

                        {/* Content */}
                        <div className="modal-content">
                            <p className="instruction-text">
                                Select upcoming successor from available unallocated users:
                            </p>

                            <div className="successor-selection-group">
                                <div className="form-group">
                                    <label className="input-label">Successor Selection</label>
                                    <div className="successor-dropdown-wrapper">
                                        <select
                                            className="successor-dropdown"
                                            value={selectedSuccessor}
                                            onChange={(e) => {
                                                console.log('e.target.value : ', e.target.value)
                                                setSelectedSuccessor(e.target.value)
                                            }}
                                        >
                                            <option value="">Choose a successor...</option>
                                            {availableUsers
                                                .filter((av) => {
                                                    console.log('av ::: ', av)

                                                    // Check if user is not currently allocated
                                                    if (av.isAllocated || av.hasPlannedAllocation) {
                                                        return false;
                                                    }

                                                    // Check user type matching
                                                    const expectedUserType = deboardedUsersCombinationData?.OSCA_ID ? 2 : 1;
                                                    if (av.user_type !== expectedUserType) {
                                                        return false;
                                                    }

                                                    // successor should be not allocated yet
                                                    let userAllocationHistory = []
                                                    if (av.isAllocated || av.hasPlannedAllocation) return false
                                                    userAllocationHistory.push(av)

                                                    // Only show users who have been deboarded before (crew_status == 2)
                                                    return userAllocationHistory.length > 0;
                                                })
                                                .map((user) => (
                                                    <option key={user.UHA_ID} value={user.UHA_ID}>
                                                        {user.first_name} {user.last_name} • {user.duty_level || 'Level-1'} • Ex-Crew
                                                    </option>
                                                ))}
                                        </select>
                                        <div className="dropdown-arrow">
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>

                                {/* Show Expected Deboarding Date and Successor Onboarding Date when successor is selected */}
                                {selectedSuccessor && (
                                    <div className="date-selection-group">
                                        <div className="date-row">
                                            <div className="form-group">
                                                <label className="date-label">Expected Date of Deboarding</label>
                                                <input
                                                    type="date"
                                                    className="date-input"
                                                    value={modalExpectedDeboardingDate}
                                                    min={new Date().toISOString().split('T')[0]}
                                                    onChange={(e) => {
                                                        setModalExpectedDeboardingDate(e.target.value);
                                                    }}
                                                />
                                            </div>

                                            <div className="form-group">
                                                <label className="date-label">Successor's Expected Onboarding</label>
                                                <input
                                                    type="date"
                                                    className="date-input"
                                                    value={modalExpectedOnboardingDate}
                                                    min={new Date().toISOString().split('T')[0]}
                                                    onChange={(e) => {
                                                        setModalExpectedOnboardingDate(e.target.value);
                                                    }}
                                                />
                                            </div>
                                        </div>

                                        {/* Validation message if onboarding is before deboarding */}
                                        {modalExpectedOnboardingDate && modalExpectedDeboardingDate &&
                                            new Date(modalExpectedOnboardingDate) < new Date(modalExpectedDeboardingDate) && (
                                                <div className="validation-warning">
                                                    ⚠️ Successor onboarding should typically be on or after deboarding date
                                                </div>
                                            )}
                                    </div>
                                )}
                            </div>

                            {/* Info Box */}
                            <div className="deboarding-info-box">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    <path d="M12 16V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    <path d="M12 8H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                                <span>Only previously deboarded crew members (crew_status = 2) matching the position requirements are shown</span>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="modal-footer">
                            <button
                                className="secondary-button"
                                onClick={() => setIsDeboardNowClicked(false)}
                            >
                                Cancel Process
                            </button>
                            <button
                                className="primary-button"
                                onClick={() => {
                                    if (selectedSuccessor) {
                                        // If successor is selected, proceed directly to deboarding
                                        handleDeboard();
                                    } else {
                                        // If no successor, show job distribution popup
                                        setIsDeboardNowClicked(false);
                                        setIsWantToSeeActiveJobForThisDeboardUser(true);
                                    }
                                }}
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                                {selectedSuccessor ? 'Confirm Deboarding' : 'Plan Job Distribution'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {isWantToAddNewUserClicked && (
                <div className="modern-modal-overlay">
                    <div className="modern-user-modal">
                        {/* Header */}
                        <div className="modern-modal-header">
                            <div className="modern-header-content">
                                <div className="modern-title-section">
                                    <div className="modern-modal-icon">
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M16 7C16 9.20914 14.2091 11 12 11C9.79086 11 8 9.20914 8 7C8 4.79086 9.79086 3 12 3C14.2091 3 16 4.79086 16 7Z" stroke="currentColor" strokeWidth="2" />
                                            <path d="M12 14C8.13401 14 5 17.134 5 21H19C19 17.134 15.866 14 12 14Z" stroke="currentColor" strokeWidth="2" />
                                        </svg>
                                    </div>
                                    <div className="modern-title-text">
                                        <h2 className="modern-modal-title">Add Team Members</h2>
                                        <p className="modern-modal-subtitle">Add one or multiple users to your organization</p>
                                    </div>
                                </div>
                                <button
                                    className="modern-close-button"
                                    onClick={() => {
                                        setIsWantToAddNewUserClicked(false);
                                        setIsExistingShipUser(false);
                                        setModalExistingBoardingDate('');
                                    }}
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </button>
                            </div>

                            {/* User Tabs */}
                            <div className="user-tabs-container">
                                <div className="user-tabs-scroll">
                                    {newUsersList.map((user, index) => (
                                        <button
                                            key={user.id}
                                            className={`user-tab ${activeUserIndex === index ? 'active' : ''}`}
                                            onClick={() => setActiveUserIndex(index)}
                                        >
                                            <span className="tab-avatar">
                                                {user.first_name ? user.first_name.charAt(0).toUpperCase() : 'U'}
                                            </span>
                                            <span className="tab-name">
                                                {user.first_name && user.last_name
                                                    ? `${user.first_name} ${user.last_name}`
                                                    : `User ${index + 1}`
                                                }
                                            </span>
                                            {newUsersList.length > 1 && (
                                                <button
                                                    className="tab-remove"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        removeUser(index);
                                                    }}
                                                >
                                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                        <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                    </svg>
                                                </button>
                                            )}
                                        </button>
                                    ))}
                                    <button
                                        className="user-tab add-tab"
                                        onClick={addNewUserForm}
                                    >
                                        <span className="tab-avatar">+</span>
                                        <span className="tab-name">Add New</span>
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Form Content */}
                        <div className="modern-modal-content">
                            {/* User Type Selection */}
                            <div className="user-type-section">
                                <div className="form-section-card">
                                    <div className="card-header">
                                        <div className="card-icon"></div>
                                        <h4 className="card-title">User Type & Allocation</h4>
                                    </div>

                                    <div className="user-type-options">
                                        <div className="user-type-option">
                                            <label className="user-type-label">
                                                <input
                                                    type="radio"
                                                    name="userType"
                                                    value="fresh"
                                                    checked={!isExistingShipUser}
                                                    onChange={() => setIsExistingShipUser(false)}
                                                    className="radio-input"
                                                />
                                                <div className="option-content">
                                                    <span className="option-title">Fresh User</span>
                                                    <span className="option-description">
                                                        User is new and not currently allocated to any ship/office
                                                    </span>
                                                    <div className="option-details">
                                                        <span className="detail-item">✓ Added to system only</span>
                                                        <span className="detail-item">✓ Can be allocated later</span>
                                                        <span className="detail-item">✓ Shows in "Available Users" list</span>
                                                    </div>
                                                </div>
                                            </label>
                                        </div>

                                        <div className="user-type-option">
                                            <label className="user-type-label">
                                                <input
                                                    type="radio"
                                                    name="userType"
                                                    value="existing"
                                                    checked={isExistingShipUser}
                                                    onChange={() => setIsExistingShipUser(true)}
                                                    className="radio-input"
                                                />
                                                <div className="option-content">
                                                    <span className="option-title">Existing Ship User</span>
                                                    <span className="option-description">
                                                        User is already working on a ship but not in the system
                                                    </span>
                                                    <div className="option-details">
                                                        <span className="detail-item">✓ Added to system</span>
                                                        <span className="detail-item">✓ Automatically allocated to ship</span>
                                                        <span className="detail-item">✓ Past boarding dates allowed</span>
                                                    </div>
                                                </div>
                                            </label>
                                        </div>
                                    </div>

                                    {/* Existing Ship User Allocation Form - Only shows when selected */}
                                    {isExistingShipUser && (
                                        <div className="allocation-form">
                                            <div className="form-divider">
                                                <span>Ship Allocation Details</span>
                                            </div>
                                            <div className="modern-form-grid">
                                                <div className="modern-form-group">
                                                    <label className="modern-form-label required">Ship</label>
                                                    <select
                                                        className="modern-form-input"
                                                        value={modalShip}
                                                        onChange={(e) => setModalShip(e.target.value)}
                                                        required
                                                    >
                                                        <option value="">Select Ship</option>
                                                        {shipsList.map(ship => (
                                                            <option key={ship.SHA_ID} value={ship.SHA_ID}>
                                                                {ship.ship_name}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>

                                                <div className="modern-form-group">
                                                    <label className="modern-form-label required">Department</label>
                                                    <select
                                                        className="modern-form-input"
                                                        value={modalDept}
                                                        onChange={(e) => setModalDept(e.target.value)}
                                                        disabled={!modalShip}
                                                        required
                                                    >
                                                        <option value="">Select Department</option>
                                                        {departmentsList
                                                            .filter(d => modalShip === 'office' ? d.ship_id === null : d.ship_id === modalShip)
                                                            .map(dept => (
                                                                <option key={dept.DEPT_ID} value={dept.DEPT_ID}>
                                                                    {dept.dept_name}
                                                                </option>
                                                            ))}
                                                    </select>
                                                </div>

                                                <div className="modern-form-group">
                                                    <label className="modern-form-label required">Designation</label>
                                                    <select
                                                        className="modern-form-input"
                                                        value={modalDesg}
                                                        onChange={(e) => setModalDesg(e.target.value)}
                                                        disabled={!modalDept}
                                                        required
                                                    >
                                                        <option value="">Select Designation</option>
                                                        {designationsList
                                                            .filter(d => d.DEPT_ID === modalDept)
                                                            .map(desg => (
                                                                <option key={desg.DSGH_ID} value={desg.DSGH_ID}>
                                                                    {desg.desg_name}
                                                                </option>
                                                            ))}
                                                    </select>
                                                </div>

                                                <div className="modern-form-group">
                                                    <label className="modern-form-label required">Actual Boarding Date</label>
                                                    <input
                                                        type="date"
                                                        className="modern-form-input"
                                                        value={modalExistingBoardingDate}
                                                        onChange={(e) => setModalExistingBoardingDate(e.target.value)}
                                                        max={new Date().toISOString().split('T')[0]}
                                                        required
                                                    />
                                                    <p className="helper-text">
                                                        Enter the actual date when the user joined the ship (past dates allowed)
                                                    </p>
                                                </div>

                                                <div className="modern-form-group full-width">
                                                    <label className="modern-form-label">Duty Location</label>
                                                    <input
                                                        type="text"
                                                        className="modern-form-input"
                                                        value={modalLocation}
                                                        onChange={(e) => setModalLocation(e.target.value)}
                                                        placeholder="Enter duty location or port"
                                                    />
                                                </div>

                                                <div className="modern-form-group">
                                                    <label className="modern-form-label">Expected Deboarding Date</label>
                                                    <input
                                                        type="date"
                                                        className="modern-form-input"
                                                        value={modalExpectedDeboardingDate}
                                                        onChange={(e) => setModalExpectedDeboardingDate(e.target.value)}
                                                        min={modalExistingBoardingDate || new Date().toISOString().split('T')[0]}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* User Details Form */}
                            <form className="modern-user-form" onSubmit={handleAddMultipleUsers}>
                                <div className="user-form-section">
                                    <div className="section-header">
                                        <h3 className="modern-section-title">
                                            User {activeUserIndex + 1} Details
                                            {newUsersList[activeUserIndex].first_name && newUsersList[activeUserIndex].last_name && (
                                                <span className="user-name-badge">
                                                    {newUsersList[activeUserIndex].first_name} {newUsersList[activeUserIndex].last_name}
                                                </span>
                                            )}
                                        </h3>
                                        <div className="form-progress">
                                            <span className="progress-text">
                                                {activeUserIndex + 1} of {newUsersList.length}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Personal Information */}
                                    <div className="form-section-card">
                                        <div className="card-header">
                                            <div className="card-icon">👤</div>
                                            <h4 className="card-title">Personal Information</h4>
                                        </div>
                                        <div className="modern-form-grid">
                                            <div className="modern-form-group">
                                                <label className="modern-form-label required">First Name</label>
                                                <input
                                                    type="text"
                                                    className="modern-form-input"
                                                    value={newUsersList[activeUserIndex].first_name}
                                                    onChange={(e) => updateUserField(activeUserIndex, 'first_name', e.target.value)}
                                                    placeholder="Enter first name"
                                                    required
                                                />
                                            </div>

                                            <div className="modern-form-group">
                                                <label className="modern-form-label required">Last Name</label>
                                                <input
                                                    type="text"
                                                    className="modern-form-input"
                                                    value={newUsersList[activeUserIndex].last_name}
                                                    onChange={(e) => updateUserField(activeUserIndex, 'last_name', e.target.value)}
                                                    placeholder="Enter last name"
                                                    required
                                                />
                                            </div>

                                            <div className="modern-form-group">
                                                <label className="modern-form-label">Middle Name</label>
                                                <input
                                                    type="text"
                                                    className="modern-form-input"
                                                    value={newUsersList[activeUserIndex].middle_name}
                                                    onChange={(e) => updateUserField(activeUserIndex, 'middle_name', e.target.value)}
                                                    placeholder="Enter middle name"
                                                />
                                            </div>

                                            <div className="modern-form-group">
                                                <label className="modern-form-label">Gender</label>
                                                <div className="modern-select-wrapper">
                                                    <select
                                                        className="modern-form-input"
                                                        value={newUsersList[activeUserIndex].gender}
                                                        onChange={(e) => updateUserField(activeUserIndex, 'gender', e.target.value)}
                                                    >
                                                        <option value="">Select gender</option>
                                                        <option value="male">Male</option>
                                                        <option value="female">Female</option>
                                                        <option value="other">Other</option>
                                                    </select>
                                                    <div className="select-arrow">▼</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Contact Information */}
                                    <div className="form-section-card">
                                        <div className="card-header">
                                            <div className="card-icon">📱</div>
                                            <h4 className="card-title">Contact Information</h4>
                                        </div>
                                        <div className="modern-form-grid">
                                            <div className="modern-form-group">
                                                <label className="modern-form-label required">Mobile Number</label>
                                                <div className="modern-phone-input">
                                                    <select
                                                        className="country-code-select"
                                                        value={newUsersList[activeUserIndex].country_code || '+91'}
                                                        onChange={(e) => updateUserField(activeUserIndex, 'country_code', e.target.value)}
                                                    >
                                                        <option value="+91">🇮🇳 +91</option>
                                                        <option value="+1">🇺🇸 +1</option>
                                                        <option value="+44">🇬🇧 +44</option>
                                                        <option value="+61">🇦🇺 +61</option>
                                                        <option value="+971">🇦🇪 +971</option>
                                                        <option value="+81">🇯🇵 +81</option>
                                                        <option value="+49">🇩🇪 +49</option>
                                                    </select>

                                                    <input
                                                        type="tel"
                                                        className={`modern-form-input ${newUsersList[activeUserIndex].mobile_no &&
                                                            !validateMobileNumber(newUsersList[activeUserIndex].mobile_no)
                                                            ? 'invalid'
                                                            : ''
                                                            }`}
                                                        value={newUsersList[activeUserIndex].mobile_no}
                                                        onChange={(e) =>
                                                            updateUserField(
                                                                activeUserIndex,
                                                                'mobile_no',
                                                                e.target.value.replace(/\D/g, '').slice(0, 10)
                                                            )
                                                        }
                                                        placeholder="10-digit mobile number"
                                                        maxLength="10"
                                                        required
                                                    />
                                                </div>
                                                {newUsersList[activeUserIndex].mobile_no &&
                                                    !validateMobileNumber(newUsersList[activeUserIndex].mobile_no) && (
                                                        <div className="validation-message">
                                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                                <path d="M12 8V12M12 16H12.01M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                            </svg>
                                                            Please enter a valid 10-digit mobile number
                                                        </div>
                                                    )}
                                            </div>

                                            <div className="modern-form-group">
                                                <label className="modern-form-label required">User Type</label>
                                                <div className="modern-select-wrapper">
                                                    <select
                                                        className="modern-form-input"
                                                        value={newUsersList[activeUserIndex].user_type}
                                                        onChange={(e) => updateUserField(activeUserIndex, 'user_type', e.target.value)}
                                                        required
                                                    >
                                                        <option value="">Select type</option>
                                                        <option value="1">🚢 Crew Member</option>
                                                        <option value="2">🏢 Office Staff</option>
                                                    </select>
                                                    <div className="select-arrow">▼</div>
                                                </div>
                                            </div>

                                            <div className="modern-form-group full-width">
                                                <label className="modern-form-label required">Email Address</label>
                                                <input
                                                    type="email"
                                                    className="modern-form-input"
                                                    value={newUsersList[activeUserIndex].user_email}
                                                    onChange={(e) => updateUserField(activeUserIndex, 'user_email', e.target.value)}
                                                    placeholder="Enter email address"
                                                    required
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Employment Details */}
                                    <div className="form-section-card">
                                        <div className="card-header">
                                            <div className="card-icon">💼</div>
                                            <h4 className="card-title">Employment Details</h4>
                                        </div>
                                        <div className="modern-form-grid">
                                            <div className="modern-form-group">
                                                <label className="modern-form-label">Account Status</label>
                                                <div className="status-toggle-modern">
                                                    <button
                                                        type="button"
                                                        className={`status-option ${newUsersList[activeUserIndex].user_status === 1 ? 'active' : ''}`}
                                                        onClick={() => updateUserField(activeUserIndex, 'user_status', 1)}
                                                    >
                                                        <span className="status-indicator active"></span>
                                                        Active
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className={`status-option ${newUsersList[activeUserIndex].user_status === 0 ? 'active' : ''}`}
                                                        onClick={() => updateUserField(activeUserIndex, 'user_status', 0)}
                                                    >
                                                        <span className="status-indicator inactive"></span>
                                                        Inactive
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="modern-form-group">
                                                <label className="modern-form-label">Date of Joining</label>
                                                <input
                                                    type="date"
                                                    className="modern-form-input"
                                                    value={newUsersList[activeUserIndex].date_of_joining}
                                                    onChange={(e) => updateUserField(activeUserIndex, 'date_of_joining', e.target.value)}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </form>
                        </div>

                        {/* Footer Actions */}
                        <div className="modern-modal-footer">
                            <div className="footer-left">
                                <span className="users-count">
                                    {newUsersList.length} user{newUsersList.length !== 1 ? 's' : ''} ready to add
                                    {isExistingShipUser && ' and allocate to ship'}
                                </span>
                            </div>
                            <div className="footer-right">
                                <button
                                    type="button"
                                    className="modern-btn secondary"
                                    onClick={() => {
                                        setIsWantToAddNewUserClicked(false);
                                        setIsExistingShipUser(false);
                                        setModalExistingBoardingDate('');
                                    }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    className="modern-btn primary"
                                    onClick={handleAddMultipleUsers}
                                    disabled={isExistingShipUser && (!modalShip || !modalDept || !modalDesg || !modalExistingBoardingDate)}
                                >
                                    <span className="btn-icon">✓</span>
                                    {isExistingShipUser ? 'Add & Allocate' : 'Add'} {newUsersList.length} User{newUsersList.length !== 1 ? 's' : ''}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {isWantToSeeActiveJobForThisDeboardUser && (
                <div id='show-deaboarding-users-active-jobs-with-job-assign-to-different-users-main-container'>
                    <div id='show-deaboarding-users-active-jobs-with-job-assign-to-different-users-content-container'>
                        <div className="active-jobs-distribution-modal">
                            {/* Header - Fixed */}
                            <div className="distribution-modal-header">
                                <h2>Job Distribution Plan - No Successor</h2>
                                <p>
                                    {selectedSuccessor
                                        ? `Distributing jobs from ${users[deboardedUsersCombinationData?.user_id]?.first_name} to ${users[selectedSuccessor]?.first_name}`
                                        : `Distributing ${getActiveJobsCount()} active jobs from ${users[deboardedUsersCombinationData?.user_id]?.first_name} to available crew members`
                                    }
                                </p>
                                <button
                                    className="close-modal-btn"
                                    onClick={() => setIsWantToSeeActiveJobForThisDeboardUser(false)}
                                >
                                    ✕
                                </button>
                            </div>

                            {/* Scrollable Content Area */}
                            <div className="scrollable-content">
                                {/* User Information */}
                                <div className="user-info-section">
                                    <div className="user-info-card">
                                        <h3>User Being Deboarded</h3>
                                        <div className="user-details-grid">
                                            <div className="user-detail">
                                                <span className="label">Name:</span>
                                                <span className="value">
                                                    {users[deboardedUsersCombinationData?.user_id]?.first_name || 'N/A'}
                                                    {users[deboardedUsersCombinationData?.user_id]?.last_name || ''}
                                                </span>
                                            </div>
                                            <div className="user-detail">
                                                <span className="label">Designation:</span>
                                                <span className="value">
                                                    {designationsList.find(d => d.DSGH_ID === deboardedUsersCombinationData?.desg_id)?.desg_name || 'N/A'}
                                                </span>
                                            </div>
                                            <div className="user-detail">
                                                <span className="label">Department:</span>
                                                <span className="value">
                                                    {departmentsList.find(d => d.DEPT_ID === deboardedUsersCombinationData?.dept_id)?.dept_name || 'N/A'}
                                                </span>
                                            </div>
                                            <div className="user-detail">
                                                <span className="label">Total Active Jobs:</span>
                                                <span className="value badge">{getActiveJobsCount()}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {!selectedSuccessor && (
                                        <div className="user-info-card warning-info">
                                            <h3>⚠️ No Successor Selected</h3>
                                            <div className="user-details-grid">
                                                <div className="user-detail full-width">
                                                    <span className="label">Distribution Mode:</span>
                                                    <span className="value">Jobs will be distributed to available crew members</span>
                                                </div>
                                                <div className="user-detail full-width">
                                                    <span className="label">Note:</span>
                                                    <span className="value">Some jobs may be paused if no suitable crew members are available</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <p className="info-note">
                                    📝 <strong>Note:</strong> If you do not select any crew member for one or more jobs,
                                    those jobs will be automatically handed over to the <strong>secondary person</strong>.
                                </p>

                                {/* Active Jobs List with Assignment Controls */}
                                <div className="active-jobs-list-section">
                                    <h3>Active Jobs Assignment</h3>
                                    <div className="jobs-table-container">
                                        <table className="jobs-distribution-table">
                                            <thead>
                                                <tr>
                                                    <th>Job ID</th>
                                                    <th>Job Name</th>
                                                    <th>Priority</th>
                                                    <th>Due Date</th>
                                                    <th>Status</th>
                                                    <th>Assigned To</th>
                                                    <th>Assignment Control</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {renderActiveJobsWithControls()}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons - Fixed */}
                            <div className="distribution-actions">
                                <div className="action-buttons">
                                    <button
                                        className="btn-secondary"
                                        onClick={() => {
                                            setIsWantToSeeActiveJobForThisDeboardUser(false);
                                            // Go back to successor selection if needed
                                            if (!selectedSuccessor) {
                                                setIsDeboardNowClicked(true);
                                            }
                                        }}
                                    >
                                        {selectedSuccessor ? 'Cancel' : 'Back to Successor Selection'}
                                    </button>
                                    <button
                                        className="btn-primary"
                                        onClick={handleConfirmDeboardingWithJobDistribution}
                                    >
                                        {selectedSuccessor
                                            ? 'Confirm Deboarding & Distribute Jobs'
                                            : 'Confirm Deboarding & Execute Distribution'
                                        }
                                    </button>
                                </div>
                                <div className="action-note">
                                    <p>
                                        {selectedSuccessor
                                            ? '✅ Job distribution will be executed automatically upon confirmation'
                                            : '✅ Jobs will be distributed to selected crew members upon confirmation'
                                        }
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default UserAllocation;
// Save Changes