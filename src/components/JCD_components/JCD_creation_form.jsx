import React, { useContext, useEffect, useState } from 'react';
import './JCD_creation_form_modern.css';
import { JobTypeContext } from '../../contexts/job_type_context/JobTypeContext';
import axios from 'axios';
import { UserAuthContext } from '../../contexts/userAuth/UserAuthContext';
import { ComponentTreeContext } from '../../contexts/ComponentTreeContext/ComponentTreeContext';
import { DesignationContext } from '../../contexts/Designation_context/DesignationContext';

const JCD_creation_form = ({ selected_jcd_from_view_jcd_module, toggelVeiwJobsOnJCD, refreshClickedJcdData }) => {
    const apiUrl = import.meta.env.VITE_API_URL;
    const { user } = useContext(UserAuthContext);
    const { designationList, refreshDesignationList } = useContext(DesignationContext);
    const { selectedNode } = useContext(ComponentTreeContext);

    // ✅ NEW: Determine if form should be read-only (only ship users are restricted)
    const isReadOnly = selected_jcd_from_view_jcd_module && user.emp_type === 1;

    const { jobTypesIDandNameList, refreshJobTypesIDandName } = useContext(JobTypeContext);
    const [isChecklistEnabled, setIsChecklistEnabled] = useState(false);
    const [checklistItems, setChecklistItems] = useState([]);
    const [isSparesEnabled, setIsSparesEnabled] = useState(false);
    const [consumableSpares, setConsumableSpares] = useState(['']);

    const [JCD_form_data, setFormData] = useState({
        JTH_ID: '',
        SHA_ID: '',
        criticality: '',
        job_generation_type: [],
        operational_interval: '',
        time_scale: '',
        km_interval: '',
        periodic_interval: '',
        jcd_category: '',
        jcd_instruction_manual: null,
        jcd_check_list: [],
        status: '1',
        deactivated_by: '',
        deactivated_on: '',
        job_will_generate_on: [],
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
        image_required: '',
        video_required: '',
        extension_authority: '',
        jcd_applied_cat: '',
        jcd_applied_sub_cat: '',
        jcd_applied_2nd_sub_cat: '',
        jcd_applied_3rd_sub_cat: '',
        jcd_applied_part: '',
    });

    useEffect(() => {
        if (selected_jcd_from_view_jcd_module) {
            const sanitized = { ...selected_jcd_from_view_jcd_module };

            // Fix common string-to-array fields
            if (typeof sanitized.job_generation_type === 'string') {
                sanitized.job_generation_type = sanitized.job_generation_type.split(',').map(v => v.trim());
            }
            if (typeof sanitized.job_will_generate_on === 'string') {
                sanitized.job_will_generate_on = sanitized.job_will_generate_on.split(',').map(v => v.trim());
            }
            if (typeof sanitized.jcd_check_list === 'string') {
                sanitized.jcd_check_list = sanitized.jcd_check_list.split(',').map(v => v.trim());
            }

            setFormData(prev => copySharedFields(sanitized, prev));
        }
    }, [selected_jcd_from_view_jcd_module]);

    function copySharedFields(source, target) {
        const result = { ...target };
        for (const key in source) {
            if (!(key in target)) continue;

            const value = source[key];

            // Convert comma-separated strings to arrays for known array fields
            if (['job_generation_type', 'job_will_generate_on', 'jcd_check_list'].includes(key)) {
                if (typeof value === 'string') {
                    result[key] = value.split(',').map(item => item.trim()).filter(Boolean);
                } else if (Array.isArray(value)) {
                    result[key] = value;
                } else {
                    result[key] = [];
                }
            } else {
                result[key] = value;
            }
        }
        return result;
    }

    useEffect(() => {
        if (selectedNode) {
            // resetForm()
        }
    }, [selectedNode]);

    useEffect(() => {
        refreshJobTypesIDandName();
        refreshDesignationList();
    }, []);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        if (isReadOnly) return; // ✅ Block all changes if read-only

        if (type === 'checkbox' && name === 'job_generation_type') {
            setFormData((prev) => {
                const list = [...prev.job_generation_type];
                if (checked) {
                    list.push(value);
                } else {
                    const index = list.indexOf(value);
                    if (index > -1) list.splice(index, 1);
                }
                return { ...prev, job_generation_type: list };
            });
        } else if (type === 'checkbox') {
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

    const handleJobGenTypeChange = (e) => {
        if (isReadOnly) return;
        const value = e.target.value;
        const isChecked = e.target.checked;

        setFormData((prev) => {
            const current = Array.isArray(prev.job_generation_type) ? prev.job_generation_type : [];
            // Ensure it's an array

            const updated = isChecked
                ? [...current, value]
                : current.filter((v) => v !== value);

            return {
                ...prev,
                job_generation_type: updated,
            };
        });
    };

    const handleFileChange = (e) => {
        if (isReadOnly) return;
        const file = e.target.files[0];
        setFormData((prev) => ({ ...prev, jcd_instruction_manual: file }));
    };

    const handleChecklistChange = (idx, value) => {
        if (isReadOnly) return;
        const updated = [...checklistItems];
        updated[idx] = value;
        setChecklistItems(updated);
    };

    const addChecklistItem = () => {
        if (isReadOnly) return;
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

    // const handleSubmit = async (e) => {
    //     e.preventDefault();
    //     if (isReadOnly) {
    //         // alert("You cannot edit this JCD. You are in view-only mode.");
    //         toggelVeiwJobsOnJCD('flex')

    //         return;
    //     }

    //     if (JCD_form_data.job_generation_type.length === 0) {
    //         alert("Please select at least one Job Generation Type.");
    //         return;
    //     }

    //     let updatedData = { ...JCD_form_data };
    //     if (JCD_form_data.status === '2') {
    //         updatedData.deactivated_by = user.EHA_ID;
    //         updatedData.deactivated_on = new Date().toISOString().split('T')[0];
    //     }

    //     updatedData.jcd_check_list = isChecklistEnabled ? checklistItems : [];

    //     consumableSpares.forEach((_, idx) => {
    //         const field = `consumable_spare${idx + 1}`;
    //         updatedData[field] = JCD_form_data[field] || '';
    //     });
    //     for (let i = consumableSpares.length; i < 10; i++) {
    //         updatedData[`consumable_spare${i + 1}`] = '';
    //     }

    //     updatedData.jcd_applied_cat = selectedNode.data.CHA_ID ?? null;
    //     updatedData.jcd_applied_sub_cat = selectedNode.data.SCHA_ID ?? null;
    //     updatedData.jcd_applied_2nd_sub_cat = selectedNode.data.SSCHA_ID ?? null;
    //     updatedData.jcd_applied_3rd_sub_cat = selectedNode.data.TSCHA_ID ?? null;

    //     updatedData.inserted_by = user.EHA_ID;
    //     updatedData.inserted_on = new Date().toISOString().split('T')[0];

    //     console.log(updatedData);

    //     try {
    //         const res = await axios.post(`${apiUrl}addJcd`, updatedData);
    //         alert(res.status === 200 ? "JCD saved successfully!" : "Unexpected response");
    //         console.log(res.data);
    //     } catch (err) {
    //         console.error(err);
    //         alert("Error creating JCD.");
    //     }
    // };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isReadOnly) {
            toggelVeiwJobsOnJCD('flex');
            return;
        }

        if (JCD_form_data.job_generation_type.length === 0) {
            alert("Please select at least one Job Generation Type.");
            return;
        }

        let updatedData = { ...JCD_form_data };

        if (JCD_form_data.status === '2') {
            updatedData.deactivated_by = user.EHA_ID;
            updatedData.deactivated_on = new Date().toISOString().split('T')[0];
        }

        updatedData.jcd_check_list = isChecklistEnabled ? checklistItems : [];

        // Fill consumable spares properly
        consumableSpares.forEach((_, idx) => {
            const field = `consumable_spare${idx + 1}`;
            updatedData[field] = JCD_form_data[field] || '';
        });
        for (let i = consumableSpares.length; i < 10; i++) {
            updatedData[`consumable_spare${i + 1}`] = '';
        }

        updatedData.jcd_applied_cat = selectedNode.data.CHA_ID ?? null;
        updatedData.jcd_applied_sub_cat = selectedNode.data.SCHA_ID ?? null;
        updatedData.jcd_applied_2nd_sub_cat = selectedNode.data.SSCHA_ID ?? null;
        updatedData.jcd_applied_3rd_sub_cat = selectedNode.data.TSCHA_ID ?? null;

        updatedData.inserted_by = user.EHA_ID;
        updatedData.inserted_on = new Date().toISOString().split('T')[0];

        // ✅ Include shipIds array here (you can set this via multi-select dropdown)
        // updatedData.shipIds = selected_jcd_from_view_jcd_module?.shipIds || [];

        try {
            if (selected_jcd_from_view_jcd_module) {
                // UPDATE mode
                updatedData.JCDSHA_ID = selected_jcd_from_view_jcd_module.JCDSHA_ID;  // ✅ add this
                const res = await axios.put(`${apiUrl}updateJCDScheduleById`, updatedData);
                alert(res.status === 200 ? "JCD updated successfully!" : "Unexpected response");
            } else {
                // CREATE mode
                const res = await axios.post(`${apiUrl}addJcd`, updatedData);
                alert(res.status === 200 ? "JCD saved successfully!" : "Unexpected response");
            }

        } catch (err) {
            console.error(err);
            alert("Error saving JCD.");
        }
    };


    const resetForm = () => {
        // Reset main form data
        setFormData({
            JTH_ID: '',
            SHA_ID: '',
            criticality: '',
            job_generation_type: [],
            operational_interval: '',
            time_scale: '',
            km_interval: '',
            periodic_interval: '',
            jcd_category: '',
            jcd_instruction_manual: null,
            jcd_check_list: [],
            status: '1',
            deactivated_by: '',
            deactivated_on: '',
            job_will_generate_on: [],
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
            image_required: '',
            video_required: '',
            extension_authority: '',
            jcd_applied_cat: '',
            jcd_applied_sub_cat: '',
            jcd_applied_2nd_sub_cat: '',
            jcd_applied_3rd_sub_cat: '',
            jcd_applied_part: '',
        });

        // Reset dynamic fields
        setIsChecklistEnabled(false);
        setChecklistItems(['']); // or [] if you prefer
        setIsSparesEnabled(false);
        setConsumableSpares(['']);

        // refreshClickedJcdData(null)

        // Note: jcd_applied_* fields will be re-filled on submit with selectedNode
    };

    return (
        <div className="jcd-main-container">
            <h2>Configure Job On {(selectedNode.data.label).split(':')[0]}</h2>

            {/* View-only mode banner */}
            {isReadOnly && (
                <div className="view-only-banner">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="8" x2="12" y2="12"></line>
                        <line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                    View-only mode: You are a location-side user and cannot edit this JCD.
                </div>
            )}

            <form onSubmit={handleSubmit} className="jcd-form">
                {/* Selected Component */}
                <div className="form-group">
                    <label>Selected Component:</label>
                    <big>
                        <i style={{ color: '#94a3b8' }}>{selectedNode.data.label}</i>
                    </big>
                </div>

                {/* Job Type */}
                <div className="form-group">
                    <select
                        name="JTH_ID"
                        onChange={handleChange}
                        value={JCD_form_data.JTH_ID}
                        required
                        disabled={isReadOnly}
                        className="form-control"
                    >
                        <option value="">Select Job Type</option>
                        {jobTypesIDandNameList.map((type) => (
                            <option key={type.JTH_ID} value={type.JTH_ID}>
                                {type.JTH_job_type}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Criticality */}
                <div className="form-group">
                    <label>Criticality</label>
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
                        </label>
                    ))}
                </div>

                {/* Job Generation Type */}
                <div className="form-group">
                    <label>Job Generation Type</label>
                    <div className="checkbox-group">
                        {[
                            { value: '1', label: 'Operational Time' },
                            { value: '2', label: 'KM' },
                            { value: '3', label: 'Periodic Days' }
                        ].map(({ value, label }) => (
                            <label key={value}>
                                <input
                                    type="checkbox"
                                    value={value}
                                    checked={JCD_form_data.job_generation_type.includes(value)}
                                    onChange={handleJobGenTypeChange}
                                    disabled={isReadOnly}
                                />
                                {label}
                            </label>
                        ))}
                    </div>
                </div>

                {/* Operational Interval */}
                {JCD_form_data.job_generation_type.includes('1') && (
                    <>
                        <div className="form-group">
                            <label htmlFor="operational_interval">Operational Interval</label>
                            <input
                                type="number"
                                id="operational_interval"
                                name="operational_interval"
                                value={JCD_form_data.operational_interval}
                                onChange={handleChange}
                                className="form-control"
                                disabled={isReadOnly}
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="time_scale">Time Scale</label>
                            <select
                                id="time_scale"
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

                {/* KM Interval */}
                {JCD_form_data.job_generation_type.includes('2') && (
                    <div className="form-group">
                        <label htmlFor="km_interval">KM Interval</label>
                        <input
                            type="number"
                            id="km_interval"
                            name="km_interval"
                            value={JCD_form_data.km_interval}
                            onChange={handleChange}
                            className="form-control"
                            disabled={isReadOnly}
                        />
                    </div>
                )}

                {/* Periodic Interval */}
                {JCD_form_data.job_generation_type.includes('3') && (
                    <div className="form-group">
                        <label htmlFor="periodic_interval">Periodic Interval (Days)</label>
                        <input
                            type="number"
                            id="periodic_interval"
                            name="periodic_interval"
                            value={JCD_form_data.periodic_interval}
                            onChange={handleChange}
                            className="form-control"
                            disabled={isReadOnly}
                        />
                    </div>
                )}

                {/* Category */}
                <div className="form-group">
                    <label>Servicable Or Replacable</label>
                    <select
                        name="jcd_category"
                        onChange={handleChange}
                        value={JCD_form_data.jcd_category}
                        required
                        disabled={isReadOnly}
                        className="form-control"
                    >
                        <option value="">Select</option>
                        {[{ value: '1', label: 'Servicable' }, { value: '2', label: 'Replacable' }].map((cat, index) => (
                            <option key={index} value={cat.value}>{cat.label}</option>
                        ))}
                    </select>
                </div>

                {/* Instruction Manual */}
                <div className="form-group">
                    <label>Instruction Manual</label>
                    <input
                        type="file"
                        name="jcd_instruction_manual"
                        accept=".pdf, .doc"
                        onChange={handleFileChange}
                        disabled={isReadOnly}
                    />
                </div>

                {/* Checklist Toggle */}
                <div className="form-group">
                    <label>
                        <input
                            type="checkbox"
                            checked={isChecklistEnabled}
                            onChange={(e) => !isReadOnly && setIsChecklistEnabled(e.target.checked)}
                            disabled={isReadOnly}
                        />
                        Do you want to add checklist to ensure quality work?
                    </label>
                </div>

                {/* Checklist Items */}
                {isChecklistEnabled && (
                    <div className="form-group">
                        <label>Checklist Items</label>
                        <div className="checklist-container">
                            {checklistItems.map((item, idx) => (
                                <div key={idx} className="checklist-item">
                                    <input
                                        type="text"
                                        value={item}
                                        onChange={(e) => handleChecklistChange(idx, e.target.value)}
                                        disabled={isReadOnly}
                                        placeholder={`Checklist ${idx + 1}`}
                                        className="form-control"
                                        required
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
                        <button
                            type="button"
                            onClick={addChecklistItem}
                            className="add-button"
                            disabled={isReadOnly}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="12" y1="5" x2="12" y2="19"></line>
                                <line x1="5" y1="12" x2="19" y2="12"></line>
                            </svg>
                            Add Checklist Item
                        </button>
                    </div>
                )}



                {/* Designation Dropdowns */}
                {[
                    'executed_by',
                    'secondary_desg',
                    'first_verified_by',
                    'second_verified_by',
                    'extension_authority'
                ].map(field => (
                    <div key={field} className="form-group">
                        <label htmlFor={field}>
                            {field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </label>
                        <select
                            id={field}
                            name={field}
                            onChange={handleChange}
                            value={JCD_form_data[field]}
                            className="form-control"
                            required={field !== 'extension_authority'}
                            style={{ color: '#666464' }}
                            disabled={isReadOnly}
                        >
                            <option value="">Select {field.replace(/_/g, ' ')}</option>
                            {designationList.map((d, idx) => (
                                <option key={idx} value={d.DSGH_ID}>
                                    {d.desg_name}
                                </option>
                            ))}
                        </select>
                    </div>
                ))}

                {/* Image Required */}
                <div className="form-group">
                    <label>Image Required</label>
                    {[1, 0].map(val => (
                        <label key={val}>
                            <input
                                type="radio"
                                name="image_required"
                                value={val}
                                checked={JCD_form_data.image_required == val}
                                onChange={handleChange}
                                disabled={isReadOnly}
                                required
                            />
                            {val === 1 ? 'Yes' : 'No'}
                        </label>
                    ))}
                </div>

                {/* Video Required */}
                <div className="form-group">
                    <label>Video Required</label>
                    {[1, 0].map(val => (
                        <label key={val}>
                            <input
                                type="radio"
                                name="video_required"
                                value={val}
                                checked={JCD_form_data.video_required == val}
                                onChange={handleChange}
                                disabled={isReadOnly}
                                required
                            />
                            {val === 1 ? 'Yes' : 'No'}
                        </label>
                    ))}
                </div>

                {/* Consumable Spares Section */}
                {JCD_form_data.jcd_category === 'Replaceable' && (
                    <>
                        <div className="form-group">
                            <label>
                                <input
                                    type="checkbox"
                                    checked={isSparesEnabled}
                                    onChange={(e) => !isReadOnly && setIsSparesEnabled(e.target.checked)}
                                    disabled={isReadOnly}
                                />
                                Do you need any consumable spares to complete this job?
                            </label>
                        </div>

                        {isSparesEnabled && (
                            <div className="form-group">
                                <label style={{ fontWeight: 'bold', marginBottom: '8px', display: 'block' }}>
                                    Consumable Spares
                                </label>
                                <div className="checklist-container">
                                    {consumableSpares.map((_, idx) => {
                                        const fieldName = `consumable_spare${idx + 1}`;
                                        return (
                                            <div key={fieldName} className="checklist-item">
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    placeholder={`Consumable Spare ${idx + 1}`}
                                                    value={JCD_form_data[fieldName]}
                                                    onChange={(e) => !isReadOnly && setFormData(prev => ({
                                                        ...prev,
                                                        [fieldName]: e.target.value
                                                    }))}
                                                    disabled={isReadOnly}
                                                    required={isSparesEnabled}
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
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <line x1="12" y1="5" x2="12" y2="19"></line>
                                            <line x1="5" y1="12" x2="19" y2="12"></line>
                                        </svg>
                                        Add More
                                    </button>
                                )}
                            </div>
                        )}
                    </>
                )}

                {/* Action Buttons */}
                <div className="form-actions">
                    <button
                        type="submit"
                        disabled={isReadOnly}
                    // className='add-button'
                    >
                        {isReadOnly ? 'View Only' : selected_jcd_from_view_jcd_module ? 'Update' : 'Create'}
                    </button>

                    <button
                        type="button"
                        onClick={resetForm}
                        disabled={isReadOnly}
                    >
                        Reset
                    </button>

                    <button
                        type="button"
                        // className="view-jobs-button"
                        onClick={() => toggelVeiwJobsOnJCD('flex')}
                        disabled={isReadOnly}
                    >
                        View jobs Count On this JCD
                    </button>
                </div>
            </form>
        </div>
    );
};

export default JCD_creation_form;