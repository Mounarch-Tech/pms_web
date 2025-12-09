import React from 'react';
import { toast } from 'react-toastify';

const OldIssuedToListComp = ({
    oldDetailsDataOfPeviousEmployees = [],
    employeeList = [],
    designationList = [],
    departmentsList = [],
    shipsList = [],
    activeJobStatusMap = {},
    onClose
}) => {

    // If no data, show empty state
    if (!oldDetailsDataOfPeviousEmployees || oldDetailsDataOfPeviousEmployees.length === 0) {
        return (
            <div className="modern-old-details-overlay">
                <div className="modern-old-details-modal">
                    {/* Header */}
                    <div className="modal-header">
                        <div className="header-content">
                            <h2>Previous Employee Job History</h2>
                            <p>Detailed information about employees who previously worked on this job</p>
                        </div>
                        <button className="close-button" onClick={onClose}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" />
                            </svg>
                        </button>
                    </div>

                    {/* Empty State */}
                    <div className="modal-content">
                        <div className="empty-state">
                            <div className="empty-icon">📋</div>
                            <h3>No Previous Employee Data</h3>
                            <p>No previous employee information found for this job.</p>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="modal-footer">
                        <button className="btn-primary" onClick={onClose}>
                            Close
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="modern-old-details-overlay">
            <div className="modern-old-details-modal">
                {/* Header */}
                <div className="modal-header">
                    <div className="header-content">
                        <h2>Previous Employee Job History</h2>
                        <p>Detailed information about employees who previously worked on this job</p>
                    </div>
                    <button className="close-button" onClick={onClose}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                            <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" />
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div className="modal-content">
                    <div className="table-container">
                        <table className="modern-table">
                            <thead>
                                <tr>
                                    <th className="sr-col">#</th>
                                    <th>Employee</th>
                                    <th>Designation</th>
                                    <th>Department</th>
                                    <th>Ship</th>
                                    <th>Job Status</th>
                                    <th>Completed Till</th>
                                    <th>First Verification Auth</th>
                                    <th>Second Verification Auth</th>
                                    <th>Deboarded At</th>
                                    <th>Deboarded By</th>
                                </tr>
                            </thead>
                            <tbody>
                                {oldDetailsDataOfPeviousEmployees.map((oldData, index) => {
                                    const employee = employeeList.find(emp => emp.UHA_ID == oldData.user_id);
                                    const designation = designationList.find(desg => desg.DSGH_ID == oldData.desg_id);
                                    const department = departmentsList.find(dept => dept.DEPT_ID == oldData.dept_id);
                                    const ship = shipsList.find(s => s.SHA_ID == oldData.ship_id);
                                    const firstVerifier = employeeList.find(emp => emp.UHA_ID == oldData.first_verification_by);
                                    const secondVerifier = employeeList.find(emp => emp.UHA_ID == oldData.second_verification_by);
                                    const deboardingUser = employeeList.find(emp => emp.UHA_ID == oldData.deboarding_done_by);

                                    return (
                                        <tr key={index} className="table-row">
                                            <td className="sr-cell">{index + 1}</td>
                                            <td>
                                                <div className="employee-info">
                                                    <div className="employee-name">
                                                        {employee?.emp_name || 'N/A'}
                                                    </div>
                                                    <div className="employee-id">
                                                        {oldData.user_id}
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="designation-info">
                                                    {designation?.desg_name || 'N/A'}
                                                </div>
                                            </td>
                                            <td>
                                                <div className="department-info">
                                                    {department?.dept_name || 'N/A'}
                                                </div>
                                            </td>
                                            <td>
                                                <div className="ship-info">
                                                    {ship?.ship_name || 'N/A'}
                                                </div>
                                            </td>
                                            <td>
                                                <span className={`status-badge status-${oldData.job_status}`}>
                                                    {activeJobStatusMap[oldData.job_status] || `Status ${oldData.job_status}`}
                                                </span>
                                            </td>
                                            <td>
                                                {oldData.job_completed_till ?
                                                    new Date(oldData.job_completed_till).toLocaleDateString('en-GB')
                                                    : 'N/A'
                                                }
                                            </td>
                                            <td>
                                                <div className="verifier-info">
                                                    {firstVerifier?.emp_name || 'N/A'}
                                                </div>
                                            </td>
                                            <td>
                                                <div className="verifier-info">
                                                    {secondVerifier?.emp_name || 'N/A'}
                                                </div>
                                            </td>
                                            <td>
                                                {oldData.deboarded_at ?
                                                    new Date(oldData.deboarded_at).toLocaleDateString('en-GB')
                                                    : 'N/A'
                                                }
                                            </td>
                                            <td>
                                                <div className="verifier-info">
                                                    {deboardingUser?.emp_name || 'N/A'}
                                                    {oldData.deboarding_done_by && !deboardingUser && (
                                                        <div className="user-id-small">
                                                            ({oldData.deboarding_done_by})
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Footer */}
                <div className="modal-footer">
                    <div className="summary-info">
                        <span>Total Records: {oldDetailsDataOfPeviousEmployees.length}</span>
                    </div>
                    <button className="btn-primary" onClick={onClose}>
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default OldIssuedToListComp;
// localhost