import React, { useContext, useEffect, useState } from 'react';
import './Terms_conditions_model_modern.css'; // Make sure the CSS file name matches
import { PlannedJobsContext } from '../../contexts/planned_jobs_context/PlannedJobsContext';
import { ShipHeaderContext } from '../../contexts/ship_header_context/ShipHeaderContext';
import { ExecutedJobsContext } from '../../contexts/executed_jobs_context/executedJobsContext';
import { JcdShipCombinationContext } from '../../contexts/JcdShipCombinationContext/JcdShipCombinationContext';
import { JCD_scheduleContext } from '../../contexts/JCD_schedule_context/JCD_scheduleContext';
// 
const Terms_conditions_model = ({ onProceed, onCancel, jobTypeName, jobTypeID }) => {

    const [isConfirmTerms, setIsConfirmTerms] = useState(false);

    const { plannedJobList, refreshPlannedJobs } = useContext(PlannedJobsContext);
    const { executedJobList, refreshExecutedJobs } = useContext(ExecutedJobsContext);
    const { shipsList, refreshShipsList } = useContext(ShipHeaderContext);
    // JCD master list is below, not filtered by Job type
    const { JCD_schedule_List, refreshJCDSchedules } = useContext(JCD_scheduleContext);
    const { JCD_ship_combinations_list, refreshJCD_ship_combinations_list } = useContext(JcdShipCombinationContext);

    // Optional: State for selected ships if you plan to use it later
    // const [selectedShips, setSelectedShips] = useState(new Set());

    // Example useEffect (currently empty)
    useEffect(() => {
        // Potential initialization logic if needed
    }, []);

    return (
        <div className="terms-conditions-overlay">
            <div className="terms-conditions-modal">
                <div className="terms-conditions-header">
                    <h1 className="terms-conditions-title">
                        Selected Job Type: <span className="job-type-name">{jobTypeName}</span>
                    </h1>
                </div>

                <div className="terms-conditions-content">
                    <div className="table-container">
                        <table className="terms-conditions-table">
                            <thead>
                                <tr>
                                    {/* Use <th> for header cells, added scope for accessibility */}
                                    <th scope="col">Check Locations</th>
                                    <th scope="col">No. of Active Jobs</th>
                                    <th scope="col">No. of Completed Jobs</th>
                                    <th scope="col">Upcoming Jobs</th>
                                </tr>
                            </thead>
                            <tbody>
                                {shipsList && shipsList.length > 0 ? (
                                    shipsList.map((ship) => {

                                        const activeJobsCount = plannedJobList?.filter((pljob) => pljob.SHA_ID == ship.SHA_ID && pljob.JTH_ID == jobTypeID)?.length || 0;

                                        // Calculate completed jobs for this specific ship correctly
                                        const completedJobsCount = executedJobList?.filter((exeJob) => {
                                            // Check if the executed job's related planned job belongs to this ship
                                            return plannedJobList?.some((plJob) =>
                                                exeJob.JPHA_ID === plJob.JPHA_ID && plJob.SHA_ID === ship.SHA_ID && plJob.JTH_ID == jobTypeID
                                            );
                                        })?.length || 0;

                                        // Assuming Upcoming Jobs is the same as Active Jobs based on your original logic
                                        const upcomingJobsCount = JCD_ship_combinations_list
                                            .filter((row) => row.SHA_ID === ship.SHA_ID)
                                            .reduce((count, row) => {
                                                let jobCount = 0;

                                                for (let i = 1; i <= 100; i++) {
                                                    const key = `jcd_id${i}`;
                                                    const jcdID = row[key];

                                                    if (!jcdID) continue;

                                                    // Find this JCD's job type
                                                    const jcdSchedule = JCD_schedule_List?.find(jcd => jcd.JCD_ID === jcdID);
                                                    if (!jcdSchedule || jcdSchedule.JTH_ID !== jobTypeID) continue;

                                                    // Skip if this JCD is already planned
                                                    const isPlanned = plannedJobList?.some(pl => pl.JCD_ID === jcdID && pl.SHA_ID === ship.SHA_ID && pl.job_status != 4);
                                                    if (!isPlanned) {
                                                        jobCount++;
                                                    }
                                                }

                                                return count + jobCount;
                                            }, 0);


                                        return (
                                            <tr key={ship.SHA_ID}> {/* Use key for list items */}
                                                <td>
                                                    <label className="ship-checkbox-label"> {/* Label for better UX/accessibility */}
                                                        <input
                                                            type="checkbox"
                                                            className="ship-checkbox" // Added class
                                                            id={`ship-${ship.SHA_ID}`} // Unique ID
                                                        // onChange={(e) => {
                                                        //     if (e.target.checked) {
                                                        //         setSelectedShips(prev => new Set(prev).add(ship.SHA_ID));
                                                        //     } else {
                                                        //         setSelectedShips(prev => {
                                                        //             const newSet = new Set(prev);
                                                        //             newSet.delete(ship.SHA_ID);
                                                        //             return newSet;
                                                        //         });
                                                        //     }
                                                        // }}
                                                        />
                                                        <span className="ship-name">{ship.ship_code}</span> {/* Display ship name */}
                                                    </label>
                                                </td>
                                                <td className="job-count-cell">{activeJobsCount}</td>
                                                <td className="job-count-cell">{completedJobsCount}</td>
                                                <td className="job-count-cell">{upcomingJobsCount}</td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan="4" className="no-data-cell"> {/* Colspan and class for styling */}
                                            No locations available.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="terms-conditions-footer"> {/* Wrapper for footer elements */}
                        <label htmlFor="read_terms_conditions_chkbox" className="terms-checkbox-label"> {/* Added class */}
                            <input
                                type="checkbox"
                                id="read_terms_conditions_chkbox"
                                className="terms-checkbox" // Added class
                                required
                                onChange={(e) => { setIsConfirmTerms(e.target.checked); }} // More direct way
                            />
                            <span className="terms-text"> {/* Span for styling the text */}
                                I confirm that I have read and understood the terms and conditions.
                            </span>
                        </label>
                        <div className="terms-conditions-buttons"> {/* Changed ID to className */}
                            <button
                                className={`action-button proceed-button ${isConfirmTerms ? '' : 'disabled'}`} // Conditional class
                                onClick={() => {
                                    if (isConfirmTerms) {
                                        onProceed();
                                    } else {
                                        // Consider using a toast or inline message instead of alert
                                        alert('Please confirm the terms and conditions.');
                                    }
                                }}
                            >
                                Proceed
                            </button>
                            <button
                                className="action-button cancel-button" // Added class
                                onClick={onCancel}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Terms_conditions_model;
