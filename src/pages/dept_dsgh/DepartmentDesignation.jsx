import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './DepartmentDesignation.css';
import OTP_verification from '../../components/otp_model/OTP_verification';
import { ShipHeaderContext } from '../../contexts/ship_header_context/ShipHeaderContext';
import { useContext } from 'react';
import { use } from 'react';
import { DepartmentsContext } from '../../contexts/DepartmentContext/DepartmentsContext';
import { UserAuthContext } from '../../contexts/userAuth/UserAuthContext';

const API_BASE = import.meta.env.VITE_API_URL;

const DepartmentDesignation = () => {

  const { shipsList } = useContext(ShipHeaderContext);
  const { departmentsList } = useContext(DepartmentsContext);

  const { user } = useContext(UserAuthContext);
  const [operationalLocation, setOperationalLocation] = useState('');
  const [selectedShipId, setSelectedShipId] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [isAddDepartmentModalOpen, setIsAddDepartmentModalOpen] = useState(false);
  const [isAddDesignationModalOpen, setIsAddDesignationModalOpen] = useState(false);
  const [editDesignation, setEditDesignation] = useState(null);

  const [selectedDesignationId, setSelectedDesignationId] = useState(null);

  // Data from backend (FUNCTIONALITY UNCHANGED)
  const [ships, setShips] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [rawDesignations, setRawDesignations] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [isOpenOTPModel, setIsOpenOTPModel] = useState(false);

  // Functionality (UNCHANGED)
  function assignLevels(designations) {
    const idToDesignation = {};
    designations.forEach(d => {
      idToDesignation[d.DSGH_ID] = d;
    });

    function getLevel(d) {
      if (!d.reporting_to) return 1;
      const parent = idToDesignation[d.reporting_to];
      return parent ? getLevel(parent) + 1 : 1;
    }

    return designations.map(d => ({
      ...d,
      level: getLevel(d),
    }));
  }

  // Functionality (UNCHANGED)
  useEffect(() => {
    if (rawDesignations.length > 0) {
      const leveled = assignLevels(rawDesignations);
      setDesignations(leveled);
    } else {
      setDesignations([]);
    }
  }, [rawDesignations]);

  // Data fetching and Handlers (UNCHANGED)
  // useEffect(() => {
  //   const fetchShips = async () => {
  //     try {
  //       const response = await axios.get(`${API_BASE}/ships`);
  //       if (response.data.success) {
  //         setShips(response.data.data);
  //       }
  //     } catch (error) {
  //       console.error("❌ Failed to fetch ships:", error);
  //     }
  //   };
  //   fetchShips();
  // }, []);
  useEffect(() => {
    setShips(shipsList)
  }, shipsList)

  useEffect(() => {
    if (!operationalLocation) {
      setDepartments([]);
      setSelectedDepartment('');
      return;
    }

    const fetchDepartments = async () => {
      try {
        let response;
        if (operationalLocation === 'Ship') {
          if (!selectedShipId) {
            setDepartments([]);
            return;
          }
          response = await axios.get(`${API_BASE}/departments/${selectedShipId}`);
        } else if (operationalLocation === 'Office') {
          response = await axios.get(`${API_BASE}/office-departments`);
        }

        if (response?.data?.success) {
          setDepartments(response.data.data);
        }
      } catch (error) {
        console.error("❌ Failed to fetch departments:", error);
      }
    };
    fetchDepartments();
  }, [operationalLocation, selectedShipId]);

  const fetchDesignations = async () => {
    try {
      const response = await axios.get(`${API_BASE}/designations/${selectedDepartment}`);
      if (response.data.success) {
        setRawDesignations(response.data.data);
      }
    } catch (error) {
      console.error("❌ Failed to fetch designations:", error);
    }
  };

  useEffect(() => {
    if (!selectedDepartment) {
      setDesignations([]);
      return;
    }
    fetchDesignations();
  }, [selectedDepartment]);




  const handleShipSelect = (shipId) => {
    setSelectedShipId(shipId);
    setSelectedDepartment('');
  };

  const handleDepartmentSelect = (deptId) => {
    setSelectedDepartment(deptId);
  };

  const openAddDepartmentModal = () => {
    if (operationalLocation === 'Ship' && !selectedShipId) {
      alert('Please select a ship first.');
      return;
    }
    setIsAddDepartmentModalOpen(true);
  };

  const openAddDesignationModal = () => {
    if (!selectedDepartment) {
      alert('Please select a department first.');
      return;
    }
    setIsAddDesignationModalOpen(true);
    setEditDesignation(null);
  };

  const openEditDesignationModal = (designation) => {
    setEditDesignation(designation);
    setIsAddDesignationModalOpen(true);
  };

  const handleSuspendDesignation = async (id) => {
    try {
      const response = await axios.put(`${API_BASE}/designation/suspend/${id}`);
      if (response.data.success) {
        alert("✅ Designation suspended successfully.");
        fetchDesignations();
        setIsOpenOTPModel(false);
      }
    } catch (error) {
      console.error("❌ Error suspending designation:", error);
      alert("Failed to suspend designation.");
      setIsOpenOTPModel(false);
    }
  };

  const closeModals = () => {
    setIsAddDepartmentModalOpen(false);
    setIsAddDesignationModalOpen(false);
    setEditDesignation(null);
  };

  const handleSaveDepartment = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const deptName = formData.get('departmentName').trim();
    const deptCode = formData.get('departmentCode').trim() || null;

    if (!deptName) {
      alert('Department name is required.');
      return;
    }

    try {
      const payload = {
        dept_name: deptName,
        operational_location: operationalLocation,
        dept_code: deptCode,
      };

      if (operationalLocation === 'Ship') {
        payload.ship_id = selectedShipId;
      }

      const response = await axios.post(`${API_BASE}/department`, payload);

      if (response.data.success) {
        if (operationalLocation === 'Ship') {
          const res = await axios.get(`${API_BASE}/departments/${selectedShipId}`);
          setDepartments(res.data.data);
        } else {
          const res = await axios.get(`${API_BASE}/office-departments`);
          setDepartments(res.data.data);
        }
        closeModals();
        alert("✅ Department added successfully.");
      }
    } catch (error) {
      console.error("❌ Error adding department:", error);
      const errorMessage = error.response?.data?.message || "Failed to add department.";
      alert(errorMessage);
    }
  };

  const handleSaveDesignation = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const designationData = {
      desg_name: formData.get('designationName').trim(),
      reporting_to: formData.get('reportTo'),
      no_of_positions: parseInt(formData.get('posts')) || 1,
      operational_location: operationalLocation,
      desg_code: formData.get('designationCode').trim(),
    };

    if (!designationData.desg_name) {
      alert('Designation name is required.');
      return;
    }

    try {
      let response;
      if (editDesignation) {
        response = await axios.put(`${API_BASE}/designation/${editDesignation.DSGH_ID}`, designationData);
      } else {
        response = await axios.post(`${API_BASE}/designation`, {
          ...designationData,
          DEPT_ID: selectedDepartment,
        });
      }

      if (response.data.success) {
        alert(editDesignation ? "✅ Designation updated successfully." : "✅ Designation added successfully.");
        fetchDesignations();
        closeModals();
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Failed to save designation.";
      alert(errorMessage);
    }
  };

  const currentDepartmentName = departments.find(d => d.DEPT_ID === selectedDepartment)?.dept_name;

  return (
    <div className="slate-dd-container">
      <h1 className="slate-dd-title">Departments & Designations</h1>

      {/* Control Panel */}
      <div className="slate-dd-control-panel">
        <div className="slate-dd-select-card">
          <label className="slate-dd-label">Operational Location</label>
          <select
            value={operationalLocation}
            onChange={(e) => {
              setOperationalLocation(e.target.value);
              setSelectedShipId('');
              setSelectedDepartment('');
            }}
            className="slate-dd-select-input"
          >
            <option value="">-- Select Location --</option>
            <option value="Ship">Location 🏭</option>
            <option value="Office">Main Office 🏢</option>
          </select>
        </div>

        <div className="slate-dd-select-card">
          <label className="slate-dd-label">Location</label>
          <select
            disabled={operationalLocation !== 'Ship'}
            value={selectedShipId}
            onChange={(e) => handleShipSelect(e.target.value)}
            className={`slate-dd-select-input ${operationalLocation !== 'Ship' ? 'slate-dd-disabled' : ''}`}
          >
            <option value="">
              {operationalLocation === 'Ship' ? '-- Select Location --' : 'N/A for Office'}
            </option>
            {ships.map((ship) => (
              <option key={ship.SHA_ID} value={ship.SHA_ID}>
                {ship.ship_name} ({ship.ship_code})
              </option>
            ))}
          </select>
        </div>
      </div>



      {/* Main Content Area */}
      <div className="slate-dd-main-content">
        {/* Department Sidebar (Panel 1) */}
        <div className="slate-dd-department-sidebar">
          <div className="slate-dd-panel-header">
            <h3>Departments</h3>
            <button
              onClick={openAddDepartmentModal}
              className="slate-dd-btn slate-dd-btn-icon"
              disabled={!operationalLocation || (operationalLocation === 'Ship' && !selectedShipId)}
              title="Add New Department"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            </button>
          </div>

          {operationalLocation ? (
            <div className="slate-dd-list-container">
              {departments.length > 0 ? (
                departments.map((dept) => (
                  <button
                    key={dept.DEPT_ID}
                    onClick={() => handleDepartmentSelect(dept.DEPT_ID)}
                    className={`slate-dd-list-item ${selectedDepartment === dept.DEPT_ID ? 'slate-dd-list-item-active' : ''}`}
                  >
                    <span>{dept.dept_name}</span>
                    <span className="slate-dd-list-item-code">{dept.dept_code}</span>
                  </button>
                ))
              ) : (
                <p className="slate-dd-placeholder-small">No departments. Click + to add one.</p>
              )}
            </div>
          ) : (
            <p className="slate-dd-placeholder-small">Select Operational Location and specific Location first.</p>
          )}
        </div>

        {/* Designation Panel (Panel 2) */}
        <div className="slate-dd-designation-panel">
          <div className="slate-dd-panel-header">
            <h3>
              Designations for: <span className="slate-dd-highlight-text">{currentDepartmentName || '---'}</span>
            </h3>
            <button
              onClick={openAddDesignationModal}
              className="slate-dd-btn slate-dd-btn-accent"
              disabled={!selectedDepartment}
              title="Add New Designation"
            >
              + New Designation
            </button>
          </div>

          {!selectedDepartment ? (
            <div className="slate-dd-placeholder-large">
              <p>👈 Select a department to view and manage positions.</p>
            </div>
          ) : (
            <div className="slate-dd-table-wrapper">
              <table className="slate-dd-table">
                <thead>
                  <tr>
                    <th className="slate-dd-th-level">Level</th>
                    <th>Designation </th>
                    <th>Reports To</th>
                    <th className="slate-dd-th-post">Posts</th>
                    <th className="slate-dd-th-actions">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {designations.length > 0 ? (
                    designations.map((d) => (
                      <tr key={d.DSGH_ID}>
                        <td className="slate-dd-td-level">{d.level}</td>
                        <td>
                          <strong>{d.desg_name}</strong>
                          {/* niche wala code designation code ke liye hai if needed  */}
                          {/* <span className="slate-dd-designation-code">{d.desg_code || 'N/A'}</span>  */}
                        </td>
                        <td>
                          {designations.find(x => x.DSGH_ID == d.reporting_to)?.desg_name || (
                            <span className="slate-dd-top-authority">TOP AUTHORITY</span>
                          )}
                        </td>
                        <td className="slate-dd-td-post">{d.no_of_positions}</td>
                        <td className="slate-dd-td-actions">
                          <button
                            onClick={() => openEditDesignationModal(d)}
                            className="slate-dd-btn slate-dd-btn-sm slate-dd-btn-edit"
                            title="Edit Designation"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
                          </button>
                          <button
                            onClick={() => {
                              setSelectedDesignationId(d.DSGH_ID);
                              setIsOpenOTPModel(true);
                            }}
                            className="slate-dd-btn slate-dd-btn-sm slate-dd-btn-danger"
                            title="Suspend Designation"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr key="no-data">
                      <td colSpan="5" className="slate-dd-table-empty">
                        No designations found in {currentDepartmentName || 'this department'}.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* MODALS */}
      {isAddDepartmentModalOpen && (
        <div className="slate-dd-modal-overlay">
          <div className="slate-dd-modal">
            <h3>Add New Department</h3>
            <form onSubmit={handleSaveDepartment}>
              <div className="slate-dd-form-group">
                <label>Department Name</label>
                <input
                  type="text"
                  name="departmentName"
                  placeholder="e.g., Engine Department, HR"
                  required
                  className="slate-dd-input"
                />
              </div>
              <div className="slate-dd-form-group">
                <label>Department Code </label>
                <input
                  type="text"
                  name="departmentCode"
                  placeholder="e.g., ENG,DECK,NAV"
                  className="slate-dd-input"
                  required
                />
              </div>
              <div className="slate-dd-modal-actions">
                <button type="button" onClick={closeModals} className="slate-dd-btn slate-dd-btn-secondary">Cancel</button>
                <button type="submit" className="slate-dd-btn slate-dd-btn-primary">Save Department</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* OTP Model - FUNCTIONALITY UNCHANGED */}
      {/* {console.log('user :: ', user)} */}
      {isOpenOTPModel && (
        <OTP_verification
          onVerifySuccess={() => {
            if (window.confirm('Are you sure you want to suspend this designation?')) {
              handleSuspendDesignation(selectedDesignationId);
            } else {
              setIsOpenOTPModel(false);
            }
          }}
          onCancel={() => {
            setIsOpenOTPModel(false);
          }}
          to={user.emp_email}
        />
      )}

      {/* Add/Edit Designation Modal */}
      {isAddDesignationModalOpen && (
        <div className="slate-dd-modal-overlay">
          <div className="slate-dd-modal">
            <h3>{editDesignation ? 'Edit Designation' : 'Add New Designation'}</h3>
            <form onSubmit={handleSaveDesignation}>
              <div className="slate-dd-form-group">
                <label>Designation Name</label>
                <input
                  type="text"
                  name="designationName"
                  defaultValue={editDesignation?.desg_name || ''}
                  placeholder="e.g., Chief Engineer, Accountant"
                  required
                  className="slate-dd-input"
                />
              </div>
              <div className="slate-dd-form-group">
                <label>Designation Code </label>
                <input
                  type="text"
                  name="designationCode"
                  defaultValue={editDesignation?.desg_code || ''}
                  placeholder="e.g., C/E, ACCT"
                  className="slate-dd-input"
                  required
                />
              </div>
              <div className="slate-dd-form-group">
                <label>No of Positions / Posts</label>
                <input
                  type="number"
                  name="posts"
                  defaultValue={editDesignation?.no_of_positions || 1}
                  min="1"
                  className="slate-dd-input"
                />
              </div>

              <div className="slate-dd-form-group">
                <label>Reporting To (Select Superior)</label>
                <select
                  name="reportTo"
                  defaultValue={editDesignation?.reporting_to || ''}
                  className="slate-dd-select-input"
                >
                  <option value="">-- Top Authority  --</option>
                  {designations
                    .filter(d => {
                      if (editDesignation) {
                        return (
                          d.DSGH_ID !== editDesignation.DSGH_ID &&
                          d.level < (editDesignation.level || Infinity)
                        );
                      } else {
                        return true;
                      }
                    })
                    .map(d => (
                      <option key={d.DSGH_ID} value={d.DSGH_ID}>
                        L{d.level}: {d.desg_name}
                      </option>
                    ))}
                </select>
              </div>

              <div className="slate-dd-modal-actions">
                <button type="button" onClick={closeModals} className="slate-dd-btn slate-dd-btn-secondary">Cancel</button>
                <button type="submit" className={`slate-dd-btn ${editDesignation ? 'slate-dd-btn-edit' : 'slate-dd-btn-primary'}`}>
                  {editDesignation ? 'Update Designation' : 'Save Designation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DepartmentDesignation;
// Designation Code