import axios from 'axios';
import React, { useContext, useEffect, useRef, useState } from 'react';
import './JTH_formModern.css';
import Pagination from '../../components/pagination_model/Pagination_model'; // Import the new component
import { JobTypeContext } from '../../contexts/job_type_context/JobTypeContext';
import { JCD_scheduleContext } from '../../contexts/JCD_schedule_context/JCD_scheduleContext';
import { UserAuthContext } from '../../contexts/userAuth/UserAuthContext';
import OTP_verification from '../../components/otp_model/OTP_verification';
import Terms_conditions_model from '../../components/terms_conditions_model/Terms_conditions_model';
import { Profile_header_context } from '../../contexts/profile_header_context/Profile_header_context';
// emp_name

const Jth_from = () => {
    const { user } = useContext(UserAuthContext);
    const { profiles } = useContext(Profile_header_context)

    const [pendingStatusChange, setPendingStatusChange] = useState(null);
    const [sortColumn, setSortColumn] = useState(null);
    const [jobTypeStatusToggling, setJobTypeStatusToggling] = useState('none');
    const [sortDirection, setSortDirection] = useState('asc'); // Default sort direction
    const [showOTPModal, setShowOTPModal] = useState(false);
    const [showTermsConditionsModel, setShowTermsConditionsModel] = useState(false);

    const theadRef = useRef(null);
    const stsActiveRef = useRef(null);
    const { JCD_schedule_List, refreshJCDSchedules } = useContext(JCD_scheduleContext);
    const { jobTypesList, refreshJobTypes } = useContext(JobTypeContext);

    const [JTH_form_data, setJTH_form_data] = useState({});

    // --- Pagination State ---
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5; // Adjust this number as needed

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (theadRef.current && !theadRef.current.contains(event.target)) {
                // Note: Setting sortColumn to jobTypesList doesn't make sense here.
                // It should probably be set to null or just leave it.
                // setSortColumn(jobTypesList); // This line seems incorrect
                // setSortDirection('') // Empty string for sort direction is also unusual

                setSortColumn(null);
                setSortDirection('asc');
            }
        };
        document.addEventListener('click', handleClickOutside, true);
        return () => {
            document.removeEventListener('click', handleClickOutside, true);
        };
    }, []);

    // --- Sorting Logic ---
    // This sorting is now applied *before* pagination slicing
    let sortedJobTypes = [...jobTypesList].sort((a, b) => {
        if (!sortColumn) return 0; // No sorting if no column is selected
        let aValue = a[sortColumn];
        let bValue = b[sortColumn];

        // Handle potential null/undefined values safely
        if (aValue == null && bValue == null) return 0;
        if (aValue == null) return sortDirection === 'asc' ? 1 : -1;
        if (bValue == null) return sortDirection === 'asc' ? -1 : 1;

        // Convert to string and lower case for safer comparison
        aValue = aValue?.toString().toLowerCase();
        bValue = bValue?.toString().toLowerCase();

        if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
        return 0;
    });

    // --- Handle Sorting ---
    const handleSort = (column) => {
        // If clicking the same column, toggle direction
        if (sortColumn === column) {
            setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            // Clicking a new column, set it and default to ascending
            setSortColumn(column);
            setSortDirection('asc');
        }
        // Reset to first page whenever sorting changes
        setCurrentPage(1);
    };

    const inputJobTypeRef = useRef(null);
    const popUpMessage = useRef(null);
    let [popUp, setPopUp] = useState('-120%');

    useEffect(() => {
        console.log("PopUp changed to:", popUp);
        if (popUp === '20%') {
            setTimeout(() => {
                setPopUp('-120%');
            }, 2000);
        }
    }, [popUp]);

    const handleOnChange = (e) => {
        let { name, value } = e.target;
        if (name === 'JTH_time_limit' && !validateDate(value)) {
            alert('Date should be future date only');
            setJTH_form_data((prev) => ({
                ...prev,
                [name]: ''
            }));
            return;
        }
        if (name === 'JTH_status') {
            const newStatus = parseInt(value);
            const oldStatus = JTH_form_data.JTH_status;
            if (newStatus !== oldStatus) {
                setShowTermsConditionsModel(true);
                setPendingStatusChange({
                    field: name,
                    value: newStatus,
                    oldValue: oldStatus
                });
                return;
            }
        }
        setJTH_form_data((prev) => ({
            ...prev,
            [name]: value
        }));
    };

    const validateDate = (jthDate) => {
        const selectedDate = new Date(jthDate);
        const currentDate = new Date();
        currentDate.setHours(0, 0, 0, 0);
        selectedDate.setHours(0, 0, 0, 0);
        if (selectedDate <= currentDate) {
            return false;
        }
        return true;
    };

    const handleOnSubmit = (e) => {
        e.preventDefault();
        // Ensure JTH_job_short_name is uppercase before submitting
        const formDataToSubmit = {
            ...JTH_form_data,
            JTH_job_short_name: JTH_form_data.JTH_job_short_name?.toUpperCase()
        };
        submitData(formDataToSubmit);
    };

    const popUpToggling = (msg, bgClr) => {
        if (popUpMessage.current) {
            popUpMessage.current.innerText = msg;
        }
        setPopUp(`20%`);
    };

    const handleOnEdit = (e, jobData) => {
        if (inputJobTypeRef.current) {
            inputJobTypeRef.current.scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            });
            setTimeout(() => {
                if (inputJobTypeRef.current) {
                    inputJobTypeRef.current.focus();
                }
            }, 600);
        }
        setJTH_form_data(jobData);
        setJobTypeStatusToggling('flex');
        console.log(jobData);
    };

    const submitData = async (data) => {
        const existingJob = jobTypesList.find((elem) => elem.JTH_ID === data.JTH_ID);
        if (existingJob) {
            const cleanedStatus = typeof data.JTH_status === 'object' && data.JTH_status?.data
                ? data.JTH_status.data[0]
                : data.JTH_status;
            const cleanedData = {
                ...data,
                JTH_status: cleanedStatus
            };
            if ((cleanedData.JTH_job_short_name?.length || 0) < 3) {
                alert('Code at least have 3 Characters..');
                setJTH_form_data((prev) => ({
                    ...prev,
                    'JTH_job_short_name': ''
                }));
                return;
            }
            try {
                const res = await axios.put('http://localhost:3000/api/updatejth', cleanedData);
                if (res.status === 200) {
                    setJTH_form_data({});
                    popUpToggling('Job updated successfully', 'limegreen');
                    setJobTypeStatusToggling('none');
                    refreshJobTypes(); // Refresh the list
                    console.log("Job updated successfully");
                }
            } catch (err) {
                console.log("Update Error:", err);
            }
        } else {
            try {
                const paddedNumber = String(jobTypesList.length + 1).padStart(4, '0');
                const newJobData = {
                    ...data,
                    JTH_ID: `JTH_${paddedNumber}`,
                    JTH_status: 1 // Default status for new jobs
                };
                const res = await axios.post('http://localhost:3000/api/addjth', newJobData);
                if (res.status === 200) {
                    setJTH_form_data({});
                    refreshJobTypes(); // Refresh the list
                    popUpToggling('New job added successfully', 'limegreen');
                    console.log("New job added successfully");
                } else {
                    alert('All Fields Are Required !!');
                }
            } catch (err) {
                alert('Cannot Insert Duplicate JobTypes..');
                console.log("Submit Error:", err);
            }
        }
    };

    const handleOnDelete = (e, jobData) => {
        if (confirm(`Do You really want to Delete this Job Type : ${jobData.JTH_job_type}`)) {
            // Note: The refresh() function is not defined in your component.
            // Assuming it should be refreshJobTypes().
            // axios.delete('http://localhost:3000/api/deletejth', { data: jobData }).then((res) => {
            // Fixed: Pass data correctly in the request body

            alert('Currently disable the deleting functionality, working on searching logic for any active job are there of this job type which you are going to delete')

            // axios.delete('http://localhost:3000/api/deletejth', { data: jobData }).then((res) => {
            //     if (res.status === 200) {
            //         popUpMessage.current?.scrollIntoView({
            //             behavior: 'smooth',
            //             block: 'center'
            //         });
            //         setTimeout(() => {
            //             popUpToggling('Deleted Successfully', 'crimson');
            //         }, 700);
            //         refreshJobTypes(); // Refresh the list after deletion
            //         setJTH_form_data({})
            //         setJobTypeStatusToggling('none')
            //     } else {
            //         alert('There is some issue.. Try again later..');
            //     }
            // }).catch(err => console.error(err));
        }
    };

    // --- Pagination Logic ---
    const totalItems = sortedJobTypes.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);

    // Ensure current page is valid
    useEffect(() => {
        if (currentPage > totalPages && totalPages > 0) {
            setCurrentPage(totalPages); // Go to last page if current is out of bounds
        } else if (currentPage < 1) {
            setCurrentPage(1); // Go to first page if current is less than 1
        }
    }, [currentPage, totalPages]);

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;

    // Slice the sorted data for the current page
    const currentItems = sortedJobTypes.slice(indexOfFirstItem, indexOfLastItem);

    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);
        // Optional: Scroll table into view on page change
        document.getElementById('JTH-show-table-container')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    };

    return (
        <div id='JTH-main-container'>
            {showTermsConditionsModel && (
                <Terms_conditions_model
                    onProceed={() => {
                        setShowTermsConditionsModel(false);
                        setShowOTPModal(true);
                    }}
                    onCancel={() => {
                        setShowTermsConditionsModel(false);
                    }}
                    jobTypeName={JTH_form_data.JTH_job_type}
                    jobTypeID={JTH_form_data.JTH_ID}
                />
            )}

            {showOTPModal && (
                <OTP_verification
                    to={user.emp_email}
                    onVerifySuccess={() => {
                        if (pendingStatusChange) {
                            const { field, value } = pendingStatusChange;
                            setJTH_form_data((prev) => ({
                                ...prev,
                                [field]: value
                            }));
                            submitData({ ...JTH_form_data, [field]: value, JTH_job_short_name: JTH_form_data.JTH_job_short_name?.toUpperCase() }); // Ensure uppercase on submit
                        }
                        setPendingStatusChange(null);
                        setShowOTPModal(false);
                    }}
                    onCancel={() => {
                        setPendingStatusChange(null);
                        setShowOTPModal(false);
                    }}
                />
            )}

            <div id='JTH-form-popup-container' style={{ transform: `translate(0%, ${popUp})` }}>
                <p ref={popUpMessage} id='JTH-form-popup-message'></p>
            </div>

            {profiles?.filter(p => user?.profile_ids?.includes(p.PROFILE_ID))[0]?.form_ids?.includes("F_JTH_001") && (
                <div id='JTH-add-from-container'>
                    <form id='JTH-form-container' onSubmit={handleOnSubmit}>
                        <div className='form-field-container'>
                            <label htmlFor="JobType">Job Type</label>
                            <input
                                required
                                ref={inputJobTypeRef}
                                onChange={handleOnChange}
                                type="text"
                                id='JobType'
                                name='JTH_job_type'
                                value={JTH_form_data.JTH_job_type || ''}
                                placeholder='Define the name'
                            />
                        </div>

                        <div className='form-field-container'>
                            <label htmlFor="JTH_job_short_name">Job Short Name</label>
                            <input
                                required
                                onChange={handleOnChange}
                                type="text"
                                id='JTH_job_short_name'
                                value={JTH_form_data.JTH_job_short_name || ''}
                                maxLength={3}
                                name='JTH_job_short_name'
                                placeholder='Enter 3 character'
                            />
                        </div>

                        <div className='form-field-container'>
                            <label htmlFor="JTH_time_limit">Job Time Limit</label>
                            <div style={{ display: 'flex', flexDirection: 'column', width: '50%' }}>
                                <input
                                    required
                                    onChange={handleOnChange}
                                    type="date"
                                    id='JTH_time_limit'
                                    name='JTH_time_limit'
                                    value={JTH_form_data.JTH_time_limit || ''}
                                    min={new Date().toISOString().split("T")[0]}
                                    style={{ width: '100%' }}
                                />
                                <small style={{ textAlign: 'left', color: 'white', fontSize: '11px' }}>
                                    Date should be future date only
                                </small>
                            </div>
                        </div>

                        <div className='form-field-container' style={{ display: jobTypeStatusToggling }}>
                            <label>Job Status</label>
                            <span id='JTH-form-radio-group-container'>
                                <label><input type="radio" name='JTH_status' value={1} checked={JTH_form_data.JTH_status == 1} onChange={handleOnChange} /> Active</label>
                                <label><input type="radio" name='JTH_status' value={0} checked={JTH_form_data.JTH_status == 0} onChange={handleOnChange} /> Inactive</label>
                            </span>
                            <small style={{ color: '#ffd700', fontSize: '12px' }}>
                                OTP verification required to change status.
                            </small>
                        </div>

                        {profiles?.filter(p => user?.profile_ids?.includes(p.PROFILE_ID))[0]?.process_ids.includes("P_JTH_0002") && (
                            <button type="submit" id='FTH-btn-submit'>Save</button>
                        )}

                        <button type="reset" id='FTH-btn-submit' style={{ backgroundColor: 'crimson', color: 'white' }} onClick={() => {
                            setJTH_form_data({})
                            setJobTypeStatusToggling('none')
                        }}>Clear</button>
                    </form>
                </div>
            )}

            <div id='JTH-show-table-container'>
                <table>
                    <thead ref={theadRef}>
                        <tr>
                            {/* <th>Sr. No</th> */}
                            <th onClick={() => handleSort('JCD_count')}>
                                JCD Count {sortColumn === 'JCD_count' && (sortDirection === 'asc' ? '▲' : '▼')}
                            </th>
                            <th onClick={() => handleSort('JTH_job_type')}>
                                Job Type {sortColumn === 'JTH_job_type' && (sortDirection === 'asc' ? '▲' : '▼')}
                            </th>
                            <th onClick={() => handleSort('JTH_job_short_name')}>
                                Job Code {sortColumn === 'JTH_job_short_name' && (sortDirection === 'asc' ? '▲' : '▼')}
                            </th>
                            <th onClick={() => handleSort('JTH_time_limit')}>
                                Last Date {sortColumn === 'JTH_time_limit' && (sortDirection === 'asc' ? '▲' : '▼')}
                            </th>
                            <th onClick={() => handleSort('JTH_status')}>
                                Job Status {sortColumn === 'JTH_status' && (sortDirection === 'asc' ? '▲' : '▼')}
                            </th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {
                            currentItems.length > 0
                                ? currentItems.map((jobData, index) => {
                                    // Calculate global index if needed for unique keys (though JTH_ID is better)
                                    const globalIndex = indexOfFirstItem + index;
                                    return (
                                        <tr key={jobData.JTH_ID || globalIndex}> {/* Prefer unique ID */}
                                            {/* <td>{index+1}</td> */}
                                            <td>{(JCD_schedule_List.filter((jcd) => jcd.JTH_ID == jobData.JTH_ID && jcd.SHA_ID != null)).length}</td>
                                            <td>{jobData.JTH_job_type}</td>
                                            <td>{jobData.JTH_job_short_name}</td>
                                            {/* Handle potential null/undefined date */}
                                            <td>
                                                {jobData.JTH_time_limit
                                                    ? new Date(jobData.JTH_time_limit).toLocaleDateString('en-GB') // More robust date formatting
                                                    : ''}
                                            </td>
                                            <td>{jobData.JTH_status == 1 ? 'Active' : 'Inactive'}</td>

                                            <td className='FTH-ED-btn-container'>
                                                {profiles?.filter(p => user?.profile_ids?.includes(p.PROFILE_ID))[0]?.process_ids.includes("P_JTH_0003") && (
                                                    <button
                                                        id='FTH-btn-edit'
                                                        onClick={(e) => { handleOnEdit(e, jobData); }}
                                                    >
                                                        Edit
                                                    </button>
                                                )}

                                                {profiles?.filter(p => user?.profile_ids?.includes(p.PROFILE_ID))[0]?.process_ids.includes("P_JTH_0005") && (
                                                    <button
                                                        id='FTH-btn-delete'
                                                        onClick={(e) => { handleOnDelete(e, jobData); }} // Fixed onClick handler
                                                    >
                                                        Suspend
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })
                                : <tr><td colSpan="6">{totalItems > 0 ? "No data for this page." : "Loading..."}</td></tr>
                        }
                    </tbody>
                </table>

                {/* Render the Pagination Component */}
                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                    maxVisiblePages={100} // Adjust the number of visible page buttons
                />
            </div>
        </div>
    );
};

export default Jth_from;