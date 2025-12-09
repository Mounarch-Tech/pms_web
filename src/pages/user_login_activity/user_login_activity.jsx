import React, { useState, useEffect, useCallback, useContext } from 'react';
import axios from 'axios';
import './user_login_activity.css';
import { ShipHeaderContext } from '../../contexts/ship_header_context/ShipHeaderContext';
import { Profile_header_context } from '../../contexts/profile_header_context/Profile_header_context';
import { UserAuthContext } from '../../contexts/userAuth/UserAuthContext';
import { OfficeStaffCombination_Context } from '../../contexts/OfficeStaffCombinationContext/OfficeStaffCombination_Context';
import { useLocation } from 'react-router-dom';
import { ShipCrewCombinationContext } from '../../contexts/ShipCrewCombinationContext/ShipCrewCombinationContexts';

// Get the base URL from the environment variable
const API_BASE_URL = import.meta.env.VITE_API_URL;

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Utility function for debouncing
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};


const DEPARTMENT_FILTERS = {
  ALL: 'all',
  DECK: 'deck',
  ENGINE: 'engine',
  OFFICE: 'office' // NEW
};

const ActivityTracker = () => {

  // UseLocation 
  const location = useLocation()
  const [passedUser, setPassedUser] = useState(null)
  const [isAutoSelected, setIsAutoSelected] = useState(false); // NEW STATE to track auto-selection

  const { shipsList, loading: loadingShips, error: shipError } = useContext(ShipHeaderContext);

  const [activities, setActivities] = useState([]);
  const [filteredActivities, setFilteredActivities] = useState([]);
  const [filterDaysInput, setFilterDaysInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedShipId, setSelectedShipId] = useState('');
  const [selectedDepartmentId, setSelectedDepartmentId] = useState(DEPARTMENT_FILTERS.ALL);
  const [sortConfig, setSortConfig] = useState({ key: 'days_inactive', direction: 'desc' });
  const [exportLoading, setExportLoading] = useState(false);
  const { profiles } = useContext(Profile_header_context);
  const { user } = useContext(UserAuthContext);
  const { officeStaffList } = useContext(OfficeStaffCombination_Context);
  const { crewData, refreshCrewData } = useContext(ShipCrewCombinationContext)
  const [allocatedShipsIdsToOfficeStaff, setAllocatedShipsIdsToOfficeStaff] = useState(null);
  const [sendingReminders, setSendingReminders] = useState({});
  const [hasDepartmentSelected, setHasDepartmentSelected] = useState(false); // NEW STATE
  const debouncedFilterDays = useDebounce(filterDaysInput, 500);
  const [scrollLeft, setScrollLeft] = useState(0);

  // Add this scroll handler function
  const handleTableScroll = (e) => {
    setScrollLeft(e.target.scrollLeft);
  };

  useEffect(() => {
    if (user.emp_type == 2) {
      const allocated_shipIds = officeStaffList.find(os => os.user_id == user.UHA_ID)?.allocated_ships;
      setAllocatedShipsIdsToOfficeStaff(allocated_shipIds);
    }
  }, [user, officeStaffList]);

  useEffect(() => {
    if (location.state) {
      setPassedUser(location.state);
      console.log('Passed user received:', location.state);
      setIsAutoSelected(true); // Set flag when user is passed
    }
  }, [location.state]);

  // Auto-select ship and department when passedUser and crewData are available
  useEffect(() => {
    const autoSelectUserShipAndDept = async () => {
      if (passedUser && crewData.length > 0 && isAutoSelected) {
        await refreshCrewData();

        const userCrewInfo = crewData.find(
          crew => crew.user_id == passedUser.UHA_ID && crew.crew_status == 1
        );

        if (userCrewInfo) {
          const userDept = userCrewInfo.dept_id;
          const userShipId = userCrewInfo.ship_id;

          console.log('Auto-selecting:', { userDept, userShipId, passedUser });

          if (userShipId) {
            setSelectedShipId(userShipId);
          }
          if (userDept) {
            setSelectedDepartmentId(userDept);
            setHasDepartmentSelected(true);
          }

          // Reset the auto-selection flag after a short delay to allow user changes
          setTimeout(() => {
            setIsAutoSelected(false);
          }, 1000);
        }
      }
    };

    autoSelectUserShipAndDept();
  }, [passedUser, crewData, isAutoSelected]);

  // Sort activities to show passed user first
  useEffect(() => {
    if (passedUser && activities.length > 0) {
      const sortedActivities = [...activities].sort((a, b) => {
        // Put passed user first
        if (a.UHA_ID === passedUser.UHA_ID) return -1;
        if (b.UHA_ID === passedUser.UHA_ID) return 1;

        // Keep original sorting for others
        if (sortConfig.key) {
          const aValue = a[sortConfig.key];
          const bValue = b[sortConfig.key];

          if (typeof aValue === 'string') {
            const safeA = aValue || '';
            const safeB = bValue || '';
            if (sortConfig.direction === 'asc') {
              return safeA.localeCompare(safeB);
            }
            return safeB.localeCompare(safeA);
          }

          if (sortConfig.direction === 'asc') {
            return aValue - bValue;
          }
          return bValue - aValue;
        }

        return 0;
      });

      setFilteredActivities(sortedActivities);
    }
  }, [activities, passedUser, sortConfig]);

  useEffect(() => {
    if (shipsList.length > 0 && !isAutoSelected) {
      if (user.emp_type == 1 && user.ship_id && !selectedShipId) {
        // Crew: Set to their assigned ship
        setSelectedShipId(user.ship_id);
      } else if (user.emp_type == 2 && allocatedShipsIdsToOfficeStaff && allocatedShipsIdsToOfficeStaff.length > 0 && !selectedShipId) {
        // Office Staff: Set to the first allocated ship
        setSelectedShipId(allocatedShipsIdsToOfficeStaff[0]);
      } else if (user.emp_type == 2 && !selectedShipId) {
        // Fallback for Office Staff if no allocated ships found, set to the first ship in the list
        setSelectedShipId(shipsList[0].SHA_ID);
      }
    }
  }, [shipsList, user, allocatedShipsIdsToOfficeStaff, selectedShipId, isAutoSelected]);

  useEffect(() => {
    // Only fetch if a ship is selected AND a department has been selected (to prevent fetching on initial empty state)
    if (selectedShipId && hasDepartmentSelected) {
      fetchData(selectedShipId, selectedDepartmentId);
    }
  }, [selectedShipId, selectedDepartmentId, hasDepartmentSelected]); // Added hasDepartmentSelected to dependency

  // Apply filter and sort when activities, debouncedFilterDays, or sortConfig change
  useEffect(() => {
    applyFilterAndSort();
  }, [activities, debouncedFilterDays, sortConfig]);

  // =====================================================================email reminder function start==================================================
  const sendReminderEmail = async (user) => {
    if (sendingReminders[user.UHA_ID]) return; // Prevent multiple clicks

    setSendingReminders(prev => ({ ...prev, [user.UHA_ID]: true }));

    try {
      const response = await api.post('/send-reminder-email', {
        email: user.user_email,
        userName: `${user.first_name} ${user.last_name}`,
        inactiveDays: user.days_inactive,
        UHA_ID: user.UHA_ID
      });

      if (response.data.success) {
        alert(`Reminder sent successfully to ${user.first_name} ${user.last_name}`);
      } else {
        alert('Failed to send reminder. Please try again.');
      }
    } catch (error) {
      console.error('Error sending reminder email:', error);
      alert('Error sending reminder email. Please try again.');
    } finally {
      setSendingReminders(prev => ({ ...prev, [user.UHA_ID]: false }));
    }
  };
  //======================================================================email reminder function end==================================================

  const fetchData = async (shipId, departmentId) => {
    setLoading(true);
    setError('');
    try {
      const params = {};

      // Ship ID parameter
      if (shipId && shipId !== 'all') {
        params.shipId = shipId;
      }

      // Department ID parameter
      if (departmentId && departmentId !== DEPARTMENT_FILTERS.ALL) {
        params.department = departmentId;
      }

      const response = await api.get('/activity-summary', { params });
      const initialActivities = response.data.data || [];

      console.log('initialActivities :: ', initialActivities)

      setActivities(initialActivities);
    } catch (err) {
      console.error('API Error:', err);
      setError('Failed to fetch activity data. Check if backend is running and the /activity-summary route is defined.');
      setActivities([]);
    } finally {
      setLoading(false);
    }
  };

  // Modified applyFilterAndSort to handle passed user
  const applyFilterAndSort = useCallback(() => {
    const days = parseInt(debouncedFilterDays);
    let currentActivities = [...activities];

    // 1. Filtering Logic
    if (!isNaN(days) && days >= 0 && debouncedFilterDays !== '') {
      currentActivities = currentActivities.filter(activity =>
        activity.days_inactive >= days
      );
    }

    // 2. Sorting Logic - Passed user first, then normal sorting
    if (passedUser) {
      currentActivities.sort((a, b) => {
        // Put passed user first
        if (a.UHA_ID === passedUser.UHA_ID) return -1;
        if (b.UHA_ID === passedUser.UHA_ID) return 1;

        // Apply normal sorting for others
        if (sortConfig.key) {
          const aValue = a[sortConfig.key];
          const bValue = b[sortConfig.key];

          if (typeof aValue === 'string') {
            const safeA = aValue || '';
            const safeB = bValue || '';
            if (sortConfig.direction === 'asc') {
              return safeA.localeCompare(safeB);
            }
            return safeB.localeCompare(safeA);
          }

          if (sortConfig.direction === 'asc') {
            return aValue - bValue;
          }
          return bValue - aValue;
        }

        return 0;
      });
    } else {
      // Original sorting logic when no passed user
      if (sortConfig.key) {
        currentActivities.sort((a, b) => {
          const aValue = a[sortConfig.key];
          const bValue = b[sortConfig.key];

          if (typeof aValue === 'string') {
            const safeA = aValue || '';
            const safeB = bValue || '';
            if (sortConfig.direction === 'asc') {
              return safeA.localeCompare(safeB);
            }
            return safeB.localeCompare(safeA);
          }

          if (sortConfig.direction === 'asc') {
            return aValue - bValue;
          }
          return bValue - aValue;
        });
      }
    }

    setFilteredActivities(currentActivities);
  }, [activities, debouncedFilterDays, sortConfig, passedUser]);

  // Add highlight for passed user in the table
  const isPassedUser = (activity) => {
    if (passedUser?.UHA_ID) {
      return activity.UHA_ID == passedUser.UHA_ID;
    }
  };

  const formatDateTime = (datetime) => {
    if (!datetime) return 'N/A';

    const date = new Date(datetime);

    // Format to DD/MM/YYYY, HH:MM AM/PM
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();

    let hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';

    // Convert to 12-hour format
    hours = hours % 12;
    hours = hours ? hours : 12;
    hours = String(hours).padStart(2, '0');

    return `${day}/${month}/${year}, ${hours}:${minutes} ${ampm}`;
  };

  const formatDateForExport = (datetime) => {
    if (!datetime) return 'N/A';
    const date = new Date(datetime);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    let hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    hours = String(hours).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes} ${ampm}`;
  };

  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    } else if (sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = 'asc';
    }

    setSortConfig({ key, direction });
  };

  const getSortIndicator = (key) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === 'asc' ? ' ▲' : ' ▼';
  };

  const getSelectedShipName = () => {
    if (selectedShipId === 'all') return 'All Ships';
    const selectedShip = shipsList.find(ship => ship.SHA_ID === selectedShipId);
    return selectedShip ? selectedShip.ship_name : 'Selected Ship';
  };

  const getSelectedDepartmentName = () => {
    switch (selectedDepartmentId) {
      case DEPARTMENT_FILTERS.DECK: return 'Deck Department';
      case DEPARTMENT_FILTERS.ENGINE: return 'Engine Department';
      case DEPARTMENT_FILTERS.OFFICE: return 'Office Department'; // NEW
      case DEPARTMENT_FILTERS.ALL: return 'All Departments';
      default: return 'All Departments';
    }
  };

  // Add a reset button to clear the passed user selection
  const handleResetPassedUser = () => {
    setPassedUser(null);
    setIsAutoSelected(false);
    // Optionally reset to default selections
    if (shipsList.length > 0) {
      if (user.emp_type == 1 && user.ship_id) {
        setSelectedShipId(user.ship_id);
      } else if (user.emp_type == 2 && allocatedShipsIdsToOfficeStaff && allocatedShipsIdsToOfficeStaff.length > 0) {
        setSelectedShipId(allocatedShipsIdsToOfficeStaff[0]);
      } else {
        setSelectedShipId(shipsList[0]?.SHA_ID || '');
      }
    }
    setSelectedDepartmentId(DEPARTMENT_FILTERS.ALL);
    setHasDepartmentSelected(false);
  };

  // Reset auto-selection when user manually changes ship or department
  const handleShipChange = (e) => {
    setSelectedShipId(e.target.value);
    setIsAutoSelected(false); // Reset auto-selection flag
  };

  const handleDepartmentChange = (deptId) => {
    setSelectedDepartmentId(deptId);
    setHasDepartmentSelected(true);
    setIsAutoSelected(false); // Reset auto-selection flag
  };

  // Export functionality
  const generateReport = (action = 'download') => {
    if (filteredActivities.length === 0) {
      alert('No data available to export.');
      return;
    }

    setExportLoading(true);

    try {
      const shipName = getSelectedShipName();
      const departmentName = getSelectedDepartmentName();
      const currentDate = new Date().toLocaleDateString();
      const currentTime = new Date().toLocaleTimeString();

      // Create report HTML
      const reportHTML = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>User Login Activity Report - ${shipName}</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                .report-header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 10px; }
                .report-title { font-size: 24px; font-weight: bold; margin-bottom: 5px; }
                .report-subtitle { font-size: 16px; color: #666; margin-bottom: 10px; }
                .report-meta { font-size: 14px; color: #888; margin-bottom: 20px; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
                th { background-color: #f5f5f5; font-weight: bold; }
                tr:nth-child(even) { background-color: #f9f9f9; }
                .highlight-inactive { background-color: #ffebee; font-weight: bold; }
                .summary { margin: 20px 0; padding: 15px; background-color: #f0f8ff; border-radius: 5px; }
                @media print {
                    body { margin: 0; }
                    .no-print { display: none; }
                    table { font-size: 12px; }
                }
            </style>
        </head>
        <body>
            <div class="report-header">
                <div class="report-title">User Login Activity Report</div>
                <div class="report-subtitle">${shipName} - ${departmentName}</div>
                <div class="report-meta">Generated on: ${currentDate} at ${currentTime}</div>
            </div>

            <div class="summary">
                <strong>Report Summary:</strong><br/>
                - Total Users: ${filteredActivities.length}<br/>
                - Ship: ${shipName}<br/>
                - Department: ${departmentName}<br/>
                - Filter: Users inactive for ${filterDaysInput || '0'} days or more<br/>
                - Generated: ${currentDate} ${currentTime}
            </div>

            <table>
                <thead>
                    <tr>
                        <th>Crew Name</th>
                        <th>Designation</th>
                        <th>Last Login Time</th>
                        <th>Last Logout Time</th>
                        <th>Days Inactive</th>
                        <th>Overdue Jobs</th>
                        <th>Generated Jobs</th>
                        <th>Completed Jobs</th>
                        <th>Rejected Jobs</th>
                        <th>Extension Requested</th>
                        <th>Extension Rejected</th>
                        <th>Extension Given</th>
                        <th>Acknowledged Jobs</th>
                        <th>Not Acknowledged Jobs</th>
                        <th>Pending First Approvals</th>
                        <th>Pending Second Approvals</th>
                        <th>Re-initiated Jobs</th>
                        <th>Completed After Overdue</th>
                        <th>Completed On Time</th>
                        <th>Critical Ext. Approved</th>
                        <th>Non-Critical Ext. Approved</th>
                    </tr>
                </thead>
                <tbody>
                    ${filteredActivities.map(activity => `
                        <tr>
                            <td>${activity.first_name} ${activity.last_name}</td>
                            <td>${activity.designation || 'Not Assigned'}</td>
                            <td>${formatDateForExport(activity.last_login_at)}</td>
                            <td>${formatDateForExport(activity.last_logout_at)}</td>
                            <td class="${activity.days_inactive > 5 ? 'highlight-inactive' : ''}">
                                ${activity.days_inactive}
                            </td>
                            <td>${activity.overdue_jobs || 0}</td>
                            <td>${activity.generated_jobs || 0}</td>
                            <td>${activity.completed_jobs || 0}</td>
                            <td>${activity.rejected_jobs || 0}</td>
                            <td>${activity.extension_requested || 0}</td>
                            <td>${activity.extension_rejected || 0}</td>
                            <td>${activity.extension_given || 0}</td>
                            <td>${activity.acknowledged_jobs || 0}</td>
                            <td>${activity.not_acknowledged_jobs || 0}</td>
                            <td>${activity.approval_pending_jobs || 0}</td>
                            <td>${activity.pending_second_approval || 0}</td>
                            <td>${activity.reassignment_jobs || 0}</td>
                            <td>${activity.totalCompletedJobsAfterOverdue || 0}</td>
                            <td>${activity.totalCompletedJobsUnderPermittedPeriod || 0}</td>
                            <td>${activity.totalCriticalExtensionApproved || 0}</td>
                            <td>${activity.totalNonCriticalExtensionApproved || 0}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>

            <div style="margin-top: 30px; font-size: 12px; color: #888; text-align: center;">
                Report generated by cymsol marine services 
            </div>
        </body>
        </html>
      `;

      if (action === 'print') {
        const printWindow = window.open('', '_blank');
        printWindow.document.write(reportHTML);
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
        printWindow.close();
      } else {
        // Download as HTML file
        const blob = new Blob([reportHTML], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `User_Activity_Report_${shipName.replace(/\s+/g, '_')}_${currentDate.replace(/\//g, '-')}.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }

    } catch (err) {
      console.error('Error generating report:', err);
      alert('Error generating report. Please try again.');
    } finally {
      setExportLoading(false);
    }
  };

  const exportToCSV = () => {
    if (filteredActivities.length === 0) {
      alert('No data available to export.');
      return;
    }
    setExportLoading(true);
    try {
      const shipName = getSelectedShipName();
      const departmentName = getSelectedDepartmentName();
      const currentDate = new Date().toLocaleDateString();
      // CSV headers
      // const headers = ['Crew Name', 'Designation', 'Last Login Time', 'Last Logout Time', 'Days Inactive', 'Overdue Jobs', 'Generated Jobs', 'Completed Jobs', 'Rejected Jobs', 'Extension Requested', 'Extension Rejected', 'Extension Given', 'Acknowledged Jobs', 'Not Acknowledged Jobs', 'Pending First Approvals', 'Pending Second Approvals', 'Re-initiated Jobs'];
      const headers = ['Crew Name', 'Designation', 'Last Login Time', 'Last Logout Time', 'Days Inactive', 'Overdue Jobs', 'Generated Jobs', 'Completed Jobs', 'Rejected Jobs', 'Extension Requested', 'Extension Rejected', 'Extension Given', 'Acknowledged Jobs', 'Not Acknowledged Jobs', 'Pending First Approvals', 'Pending Second Approvals', 'Re-initiated Jobs', 'Completed After Overdue', 'Completed On Time', 'Critical Ext. Approved', 'Non-Critical Ext. Approved'];
      // CSV data rows
      const csvData = filteredActivities.map(activity => [
        `"${activity.first_name} ${activity.last_name}"`,
        `"${activity.designation || 'Not Assigned'}"`,
        `"${formatDateForExport(activity.last_login_at)}"`,
        `"${formatDateForExport(activity.last_logout_at)}"`,
        activity.days_inactive,
        activity.overdue_jobs || 0,
        activity.generated_jobs || 0,
        activity.completed_jobs || 0,
        activity.rejected_jobs || 0,
        activity.extension_requested || 0,
        activity.extension_rejected || 0,
        activity.extension_given || 0,
        activity.acknowledged_jobs || 0,
        activity.not_acknowledged_jobs || 0,
        activity.approval_pending_jobs || 0,
        activity.pending_second_approval || 0,
        activity.reassignment_jobs || 0,
        activity.totalCompletedJobsAfterOverdue || 0,
        activity.totalCompletedJobsUnderPermittedPeriod || 0,
        activity.totalCriticalExtensionApproved || 0,
        activity.totalNonCriticalExtensionApproved || 0
      ]);
      // Combine headers and data
      const csvContent = [
        `User Login Activity Report - ${shipName} - ${departmentName}`,
        `Generated on: ${currentDate}`,
        '',
        headers.join(','),
        ...csvData.map(row => row.join(','))
      ].join('\n');
      // Create and download CSV file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `User_Activity_Report_${shipName.replace(/\s+/g, '_')}_${currentDate.replace(/\//g, '-')}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error exporting to CSV:', err);
      alert('Error exporting to CSV. Please try again.');
    } finally {
      setExportLoading(false);
    }
  };

  const combinedError = error || shipError;

  return (
    <div className="activity-tracker-container">
      {/* <h2>User Login Activity</h2> */}

      {passedUser && (
        <div className="passed-user-banner">
          <div className="passed-user-info">
            <span className="user-icon">👤</span>
            <span className="user-name">
              Viewing: <strong>{passedUser.first_name} {passedUser.last_name}</strong>
            </span>
            <span className="user-email">{passedUser.user_email}</span>
          </div>
          <button
            className="reset-user-btn"
            onClick={handleResetPassedUser}
            title="Clear user selection and show all users"
          >
            ✕ Clear User Filter
          </button>
        </div>
      )}

      <div className="controls">
        {/* Ship Selector Dropdown */}
        <label htmlFor="ship-select">Select Ship:</label>
        <select
          id="ship-select"
          value={selectedShipId}
          onChange={(e) => { handleShipChange(e) }}
          disabled={loadingShips || loading}
        >
          {loadingShips ? (
            <option value="">Loading Ships...</option>
          ) : shipsList.length === 0 ? (
            <option value="">No Ships Found</option>
          ) : (
            shipsList
              .filter(ship => {
                // Logic for Crew (Type 1)
                if (user.emp_type == 1) {
                  return ship.SHA_ID === user.ship_id;
                }
                // Logic for Office Staff (Type 2)
                if (user.emp_type == 2 && allocatedShipsIdsToOfficeStaff) {
                  return allocatedShipsIdsToOfficeStaff.includes(ship.SHA_ID);
                }
                // Fallback for others or if no ship assigned, show none or handle as needed
                return false;
              })
              .map((ship) => (
                <option key={ship.SHA_ID} value={ship.SHA_ID}>
                  {ship.ship_name}
                </option>
              ))
          )}
        </select>

        {/* Department Filter Buttons */}
        <div className="department-filters">
          <label>Department:</label>
          {profiles?.filter(p => user?.profile_ids?.includes(p.PROFILE_ID))[0]?.process_ids?.includes("P_UAC_0002") && (
            <button
              className={`dept-btn ${selectedDepartmentId === DEPARTMENT_FILTERS.ALL ? 'active' : ''}`}
              onClick={() => handleDepartmentChange(DEPARTMENT_FILTERS.ALL)}
              disabled={loading}
            >
              All
            </button>
          )}

          {profiles?.filter(p => user?.profile_ids?.includes(p.PROFILE_ID))[0]?.process_ids?.includes("P_UAC_0003") && (
            <button
              className={`dept-btn ${selectedDepartmentId === DEPARTMENT_FILTERS.DECK ? 'active' : ''}`}
              onClick={() => handleDepartmentChange(DEPARTMENT_FILTERS.DECK)}
              disabled={loading || selectedShipId === 'all'}
            >
              Deck
            </button>
          )}

          {profiles?.filter(p => user?.profile_ids?.includes(p.PROFILE_ID))[0]?.process_ids?.includes("P_UAC_0004") && (
            <button
              className={`dept-btn ${selectedDepartmentId === DEPARTMENT_FILTERS.ENGINE ? 'active' : ''}`}
              onClick={() => handleDepartmentChange(DEPARTMENT_FILTERS.ENGINE)}
              disabled={loading || selectedShipId === 'all'}
            >
              Engine
            </button>
          )}
          {profiles?.filter(p => user?.profile_ids?.includes(p.PROFILE_ID))[0]?.process_ids?.includes("P_UAC_0009") && (
            <button
              className={`dept-btn ${selectedDepartmentId === DEPARTMENT_FILTERS.OFFICE ? 'active' : ''}`}
              onClick={() => handleDepartmentChange(DEPARTMENT_FILTERS.OFFICE)}
              disabled={loading}
            >
              Office
            </button>
          )}
        </div>

        <label htmlFor="filterDays">Days:</label>
        <input
          id="filterDays"
          type="number"
          value={filterDaysInput}
          onChange={(e) => setFilterDaysInput(e.target.value)}
          placeholder="e.g., 7"
          min="0"
        />
        <button
          onClick={() => fetchData(selectedShipId, selectedDepartmentId)}
          disabled={loading || !hasDepartmentSelected} // Disable if no department selected
          className="refresh-btn"
        >
          {loading ? 'Refreshing...' : 'Refresh Data'}
        </button>

        {profiles?.filter(p => user?.profile_ids?.includes(p.PROFILE_ID))[0]?.process_ids?.includes("P_UAC_0005") && (
          <button
            onClick={() => generateReport('download')}
            disabled={exportLoading || filteredActivities.length === 0 || !hasDepartmentSelected} // Disable if no department selected
            className="export-btn download-btn"
          >
            {exportLoading ? 'Generating...' : '📥'}
          </button>
        )}
        {profiles?.filter(p => user?.profile_ids?.includes(p.PROFILE_ID))[0]?.process_ids?.includes("P_UAC_0006") && (
          <button
            onClick={() => generateReport('print')}
            disabled={exportLoading || filteredActivities.length === 0 || !hasDepartmentSelected} // Disable if no department selected
            className="export-btn print-btn"
          >
            {exportLoading ? 'Generating...' : '🖨️ Print'}
          </button>
        )}
        {profiles?.filter(p => user?.profile_ids?.includes(p.PROFILE_ID))[0]?.process_ids?.includes("P_UAC_0007") && (
          <button
            onClick={exportToCSV}
            disabled={exportLoading || filteredActivities.length === 0 || !hasDepartmentSelected} // Disable if no department selected
            className="export-btn csv-btn"
          >
            {exportLoading ? 'Generating...' : '📊 Export CSV'}
          </button>
        )}
      </div>

      {/* NEW: Message to select department */}
      {!hasDepartmentSelected && (
        <div className="department-selection-message">
          <p>👆 Please select a department to view activity data</p>
        </div>
      )}

      {/* Warning message */}
      {selectedShipId === 'all' && selectedDepartmentId !== DEPARTMENT_FILTERS.ALL && (
        <p className="warning-message">
          ⚠️ Department filter is only applicable when a **specific ship** is selected. Showing **All** departments for now.
        </p>
      )}

      {combinedError && <p className="error-message">{combinedError}</p>}

      {/* Display current selection info - Only show when department is selected */}
      {hasDepartmentSelected && (
        <div className="selection-info">
          <p>
            Currently showing: <strong>{getSelectedShipName()}</strong>
            {selectedShipId !== 'all' && ` | ${getSelectedDepartmentName()}`}
            {` | ${filteredActivities.length} crew found`}
          </p>
        </div>
      )}

      {/* Only show table when department is selected */}
      {hasDepartmentSelected ? (
        loading && activities.length === 0 ? (
          <p>Loading activity data...</p>
        ) : (
          <div className="table-scroll-container" onScroll={handleTableScroll}>

            <table className="activity-table">
              <thead>
                <tr>
                  <th onClick={() => requestSort('first_name')} style={{ cursor: 'pointer' }}>
                    Crew Name{getSortIndicator('first_name')}
                  </th>
                  <th onClick={() => requestSort('designation')} style={{ cursor: 'pointer' }}>
                    Designation{getSortIndicator('designation')}
                  </th>
                  <th onClick={() => requestSort('last_login_at')} style={{ cursor: 'pointer' }}>
                    Last Login Time{getSortIndicator('last_login_at')}
                  </th>
                  <th onClick={() => requestSort('last_logout_at')} style={{ cursor: 'pointer' }}>
                    Last Logout Time{getSortIndicator('last_logout_at')}
                  </th>
                  <th onClick={() => requestSort('days_inactive')} style={{ cursor: 'pointer' }}>
                    Inactive since(days) {getSortIndicator('days_inactive')}
                  </th>

                  {selectedDepartmentId !== DEPARTMENT_FILTERS.OFFICE && (                // New columns only for office departments
                    <>
                      <th onClick={() => requestSort('overdue_jobs')} style={{ cursor: 'pointer' }}>
                        Overdue Jobs {getSortIndicator('overdue_jobs')}
                      </th>

                      {/* NEW COLUMNS ADDED AFTER OVERDUE JOBS */}
                      <th onClick={() => requestSort('generated_jobs')} style={{ cursor: 'pointer' }}>
                        Generated Jobs{getSortIndicator('generated_jobs')}
                      </th>
                      <th onClick={() => requestSort('completed_jobs')} style={{ cursor: 'pointer' }}>
                        Completed Jobs{getSortIndicator('completed_jobs')}
                      </th>
                      <th onClick={() => requestSort('rejected_jobs')} style={{ cursor: 'pointer' }}>
                        Rejected Jobs{getSortIndicator('rejected_jobs')}
                      </th>
                      <th onClick={() => requestSort('extension_requested')} style={{ cursor: 'pointer' }}>
                        Extension Requested{getSortIndicator('extension_requested')}
                      </th>
                      <th onClick={() => requestSort('extension_rejected')} style={{ cursor: 'pointer' }}>
                        Extension Rejected{getSortIndicator('extension_rejected')}
                      </th>
                      <th onClick={() => requestSort('extension_given')} style={{ cursor: 'pointer' }}>
                        Extension Approved{getSortIndicator('extension_given')}
                      </th>

                      <th onClick={() => requestSort('acknowledged_jobs')} style={{ cursor: 'pointer' }}>
                        Acknowledged Jobs{getSortIndicator('acknowledged_jobs')}
                      </th>
                      {/* NEW COLUMNS */}
                      <th onClick={() => requestSort('not_acknowledged_jobs')} style={{ cursor: 'pointer' }}>
                        Not Acknowledged Jobs{getSortIndicator('not_acknowledged_jobs')}
                      </th>
                    </>
                  )}

                  <th onClick={() => requestSort('approval_pending_jobs')} style={{ cursor: 'pointer' }}>
                    Pending First Approvals{getSortIndicator('approval_pending_jobs')}
                  </th>
                  <th onClick={() => requestSort('pending_second_approval')} style={{ cursor: 'pointer' }}>
                    Pending Second Approvals{getSortIndicator('pending_second_approval')}
                  </th>
                  <th onClick={() => requestSort('reassignment_jobs')} style={{ cursor: 'pointer' }}>
                    Re-initiated Jobs{getSortIndicator('reassignment_jobs')}
                  </th>
                  <th onClick={() => requestSort('totalCompletedJobsAfterOverdue')} style={{ cursor: 'pointer' }}>
                    Completed After Overdue{getSortIndicator('totalCompletedJobsAfterOverdue')}
                  </th>
                  <th onClick={() => requestSort('totalCompletedJobsUnderPermittedPeriod')} style={{ cursor: 'pointer' }}>
                    Completed On Time{getSortIndicator('totalCompletedJobsUnderPermittedPeriod')}
                  </th>
                  <th onClick={() => requestSort('totalCriticalExtensionApproved')} style={{ cursor: 'pointer' }}>
                    Critical Ext. Approved{getSortIndicator('totalCriticalExtensionApproved')}
                  </th>
                  <th onClick={() => requestSort('totalNonCriticalExtensionApproved')} style={{ cursor: 'pointer' }}>
                    Non-Critical Ext. Approved{getSortIndicator('totalNonCriticalExtensionApproved')}
                  </th>
                  {selectedDepartmentId !== DEPARTMENT_FILTERS.OFFICE && (
                    <th>Actions</th>
                  )}
                </tr>
              </thead>

              <tbody>
                {filteredActivities.length > 0 ? (
                  filteredActivities.map((activity) => (
                    <tr className={isPassedUser(activity) ? 'highlight-passed-user' : ''}
                      key={activity.UHA_ID}
                      style={{
                        backgroundColor: isPassedUser(activity) ? 'red' : 'transparent'
                      }}
                    >
                      <td>{`${activity.first_name} ${activity.last_name}`}</td>
                      <td>{activity.designation || 'Not Assigned'}</td>
                      <td>{formatDateTime(activity.last_login_at)}</td>
                      <td>{formatDateTime(activity.last_logout_at)}</td>
                      <td
                        className={
                          activity.days_inactive > 5
                            ? 'highlight-inactive-red'
                            : activity.days_inactive > 0 && activity.days_inactive <= 5
                              ? 'highlight-inactive-orange'
                              : 'highlight-inactive-green'
                        }
                      >
                        {activity.days_inactive}
                      </td>

                      {selectedDepartmentId !== DEPARTMENT_FILTERS.OFFICE && (                   // New columns only for non-office departments
                        <>
                          <td>{activity.overdue_jobs}</td>

                          {/* NEW COLUMNS DATA */}
                          <td>{activity.generated_jobs || 0}</td>
                          <td>{activity.completed_jobs || 0}</td>
                          <td>{activity.rejected_jobs || 0}</td>
                          <td>{activity.extension_requested || 0}</td>
                          <td>{activity.extension_rejected || 0}</td>
                          <td>{activity.extension_given || 0}</td>

                          <td>{activity.acknowledged_jobs}</td>
                          {/* NEW COLUMNS DATA */}
                          <td>{activity.not_acknowledged_jobs || 0}</td>
                        </>                                               // New columns only for non-office departments
                      )}
                      <td>{activity.approval_pending_jobs || 0}</td>
                      <td>{activity.pending_second_approval || 0}</td>
                      <td>{activity.reassignment_jobs || 0}</td>
                      <td>{activity.totalCompletedJobsAfterOverdue || 0}</td>
                      <td>{activity.totalCompletedJobsUnderPermittedPeriod || 0}</td>
                      <td>{activity.totalCriticalExtensionApproved || 0}</td>
                      <td>{activity.totalNonCriticalExtensionApproved || 0}</td>
                      {selectedDepartmentId !== DEPARTMENT_FILTERS.OFFICE && (
                        <td>
                          {profiles?.filter(p => user?.profile_ids?.includes(p.PROFILE_ID))[0]?.process_ids?.includes("P_UAC_0008") && (
                            <button
                              className="reminder-btn"
                              onClick={() => sendReminderEmail(activity)}
                              disabled={sendingReminders[activity.UHA_ID] || !activity.user_email}
                              title={!activity.user_email ? "User has no email address" : "Send reminder email"}
                            >
                              {sendingReminders[activity.UHA_ID] ? 'Sending...' : 'Reminder'}
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="22">
                      {activities.length === 0
                        ? 'No users found.'
                        : 'No users match the current filter.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )
      ) : null}
    </div>
  );
};

export default ActivityTracker;
// localhost