import React, { useContext, useEffect, useMemo, useState } from 'react';
import './JCD_ship_combination_page.css';

// Contexts
import { UserAuthContext } from '../../contexts/userAuth/UserAuthContext';
import { JcdShipCombinationContext } from '../../contexts/JcdShipCombinationContext/JcdShipCombinationContext';
import { JCD_scheduleContext } from '../../contexts/JCD_schedule_context/JCD_scheduleContext';
import { ShipHeaderContext } from '../../contexts/ship_header_context/ShipHeaderContext';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Temp_component_heirarchy from '../temp_component_heirarchy/Temp_component_heirarchy';
import { ComponentTreeContext } from '../../contexts/ComponentTreeContext/ComponentTreeContext';

// Icons
import { FiSearch, FiFilter, FiPlus, FiArrowRight, FiArrowLeft, FiList, FiCheckSquare } from 'react-icons/fi';
import { FaShip } from 'react-icons/fa';
import { Profile_header_context } from '../../contexts/profile_header_context/Profile_header_context';
import { DesignationContext } from '../../contexts/Designation_context/DesignationContext';
import { OfficeStaffCombination_Context } from '../../contexts/OfficeStaffCombinationContext/OfficeStaffCombination_Context';
// emp_name
const JCD_ship_combination_page = () => {
    const API_BASE_URL = import.meta.env.VITE_API_URL;

    const { user } = useContext(UserAuthContext);
    const { designationList } = useContext(DesignationContext)
    const { profiles } = useContext(Profile_header_context)
    const { clearSelection, selectedNode, refreshTree } = useContext(ComponentTreeContext)
    const { JCD_ship_wise_group_combinations_list, RefreshJCD_ship_wise_group_combinations } = useContext(JcdShipCombinationContext);
    const { JCD_schedule_List, refreshJCDSchedules } = useContext(JCD_scheduleContext);
    const { shipsList, refreshShipsList } = useContext(ShipHeaderContext);
    const { officeStaffList, refreshOfficeStaffList } = useContext(OfficeStaffCombination_Context)

    const [selectedShipID, setSelectedShipID] = useState('');
    const [assignedJCDs, setAssignedJCDs] = useState([]);
    const [activeTab, setActiveTab] = useState('unassigned');

    const navigator = useNavigate()

    useEffect(() => {
        RefreshJCD_ship_wise_group_combinations()
        refreshJCDSchedules()
        refreshShipsList()
        clearSelection()
        refreshOfficeStaffList()
    }, []);

    useEffect(() => {
        if (!selectedShipID) {
            clearSelection()
        }
    }, [selectedShipID])

    useEffect(() => {
        if (user.emp_type == 1) setSelectedShipID(user.ship_id)
    }, [user])

    const [criticalityFilter, setCriticalityFilter] = useState('');
    const [searchFilter, setSearchFilter] = useState('');
    const [unassignedJCDCheckList, setUnassignedJCDCheckList] = useState([])
    const [assignedJCDCheckList, setAssignedJCDCheckList] = useState([])

    const handleUnassignedCheck = (jcdId) => {
        setUnassignedJCDCheckList(prev =>
            prev.includes(jcdId) ? prev.filter(id => id !== jcdId) : [...prev, jcdId]
        );
    };

    const handleAssignedCheck = (jcdId) => {
        setAssignedJCDCheckList(prev =>
            prev.includes(jcdId) ? prev.filter(id => id !== jcdId) : [...prev, jcdId]
        );
    };

    const handleSelectAllUnassigned = () => {
        if (unassignedJCDCheckList.length === filteredUnassignedJCDs.length) {
            setUnassignedJCDCheckList([]);
        } else {
            setUnassignedJCDCheckList(filteredUnassignedJCDs.map(jcd => jcd.jcd_id));
        }
    };

    const handleSelectAllAssigned = () => {
        if (assignedJCDCheckList.length === assignedJCDs.length) {
            setAssignedJCDCheckList([]);
        } else {
            setAssignedJCDCheckList(assignedJCDs);
        }
    };

    useEffect(() => {
        if (selectedShipID) {
            console.log('jcd schedule list : ', JCD_schedule_List)
            const shipData = JCD_ship_wise_group_combinations_list.find(s => s.SHA_ID === selectedShipID);
            setAssignedJCDs(shipData ? shipData.jcds : []);
        } else {
            setAssignedJCDs([]);
        }
    }, [selectedShipID, JCD_ship_wise_group_combinations_list]);

    const [unassignedJCDs, setUnassignedJCDs] = useState([]);
    useEffect(() => {
        if (selectedShipID && JCD_schedule_List.length > 0) {
            const filtered = JCD_schedule_List.filter(jcd => !assignedJCDs.includes(jcd.jcd_id) && jcd.SHA_ID == null);
            setUnassignedJCDs(filtered);
        } else {
            setUnassignedJCDs([]);
        }
    }, [selectedShipID, assignedJCDs, JCD_schedule_List]);

    const filteredUnassignedJCDs = useMemo(() => {
        let list = unassignedJCDs;

        list = list.filter(jcd => {
            const matchCriticality = criticalityFilter ? jcd.criticality == criticalityFilter : true;
            const matchSearch = searchFilter
                ? jcd.jcd_name?.toLowerCase().includes(searchFilter.toLowerCase()) ||
                jcd.jcd_id?.toLowerCase().includes(searchFilter.toLowerCase())
                : true;
            return matchCriticality && matchSearch;
        });

        if (selectedNode) {
            const { CHA_ID, SCHA_ID, SSCHA_ID, TSCHA_ID, PHA_ID } = selectedNode.data;
            list = list.filter(jcd => {
                return (
                    (CHA_ID ? jcd.jcd_applied_cat === CHA_ID : true) &&
                    (SCHA_ID ? jcd.jcd_applied_sub_cat === SCHA_ID : true) &&
                    (SSCHA_ID ? jcd.jcd_applied_2nd_sub_cat === SSCHA_ID : true) &&
                    (TSCHA_ID ? jcd.jcd_applied_3rd_sub_cat === TSCHA_ID : true) &&
                    (PHA_ID ? jcd.jcd_applied_part === PHA_ID : true)
                );
            });
        }

        return list;
    }, [unassignedJCDs, criticalityFilter, searchFilter, selectedNode]);

    const linkJcdsToShip = async (jcdIdlist) => {
        const obj = {
            SHA_ID: selectedShipID,
            jcdIDs: jcdIdlist
        }

        if (jcdIdlist) {
            const result = await axios.post(`${API_BASE_URL}linkJcdWithShip`, obj)

            let filteredjcdDataList = []
            for (let jcdId of obj.jcdIDs) {
                JCD_schedule_List.filter(jcd => jcd.jcd_id == jcdId && jcd.SHA_ID == null).forEach(element => {
                    element.SHA_ID = obj.SHA_ID
                    filteredjcdDataList.push(element)
                });
            }

            try {
                for (let data of filteredjcdDataList) {
                    const res = await axios.put(`${API_BASE_URL}updateJCDScheduleById`, data);
                }
            } catch (err) {
                console.error(err);
                alert('Failed to insert JCD. in ship');
            }

            setUnassignedJCDCheckList([])
            setAssignedJCDCheckList([])
            RefreshJCD_ship_wise_group_combinations()
            refreshJCDSchedules()
            refreshShipsList()
        }
    }

    const unlinkJcdsFromShip = async (jcdIdlist) => {
        const confirmation = confirm("Are you sure you want to unlink the selected JCD(s)?");
        if (!confirmation) return;

        try {
            for (let jcdId of jcdIdlist) {
                const obj = { SHA_ID: selectedShipID, JCD_ID: jcdId };
                const result = await axios.post(`${API_BASE_URL}unlinkJCDFromShipAndSchedule`, obj);

                JCD_schedule_List.filter(jcd => jcd.jcd_id === jcdId && jcd.SHA_ID === selectedShipID)
                    .forEach(el => {
                        el.SHA_ID = null;
                        el.line_no = 0;
                    });
            }

            setUnassignedJCDCheckList([]);
            setAssignedJCDCheckList([]);
            RefreshJCD_ship_wise_group_combinations();
            refreshJCDSchedules();
            refreshShipsList();
            alert("JCD(s) unlinked successfully.");
        } catch (err) {
            console.error("❌ Error unlinking JCD(s):", err);
            alert("Failed to unlink JCD(s).");
        }
    };

    return (
        <div className="jcd-ship-combination-container">
            {/* Header */}
            <div className="pageHeader">
                <div className="headerContent">
                    <h1>JCD Ship Combination</h1>
                    <p>Manage JCD assignments to ships and configure generation rules</p>
                </div>
                <div className="headerActions">
                    {profiles?.filter(p => user?.profile_ids?.includes(p.PROFILE_ID))[0]?.process_ids.includes("P_JSCA_0004") && (
                        <button
                            className="primaryButton"
                            onClick={() => navigator('/JCD_form')}
                        >
                            <FiPlus size={14} />
                            Configure New JCD
                        </button>
                    )}
                </div>
            </div>

            {/* Controls */}
            <div className="controlsSection">
                <div className="shipSelector">
                    <div className="selectorLabel">
                        <FaShip size={16} />
                        <span>Select Ship</span>
                    </div>
                    {console.log('user :: ', officeStaffList)}
                    {user.emp_type == 2 ? (
                        <select
                            value={selectedShipID}
                            onChange={(e) => setSelectedShipID(e.target.value)}
                            className="formSelect"
                        >
                            <option value="">Choose a ship...</option>
                            {shipsList?.map(ship => (
                                <option key={ship.SHA_ID} value={ship.SHA_ID}>
                                    {ship.ship_name}
                                </option>
                            ))}
                        </select>
                    ) : (
                        <h4>You are on {shipsList?.filter(s => s.SHA_ID == user.ship_id)[0]?.ship_name}</h4>
                    )}
                </div>

                <div className="filtersContainer">
                    <div className="filterGroup">
                        <div className="filterLabel">
                            <FiFilter size={14} />
                            <span>Filters</span>
                        </div>
                        <select
                            value={criticalityFilter}
                            onChange={(e) => setCriticalityFilter(e.target.value)}
                            disabled={!selectedShipID}
                            className="formSelect"
                        >
                            <option value="">All Criticality</option>
                            <option value="1">Critical</option>
                            <option value="2">Non-Critical</option>
                        </select>
                    </div>

                    <div className="searchGroup">
                        <div className="searchLabel">
                            <FiSearch size={14} />
                            <span>Search</span>
                        </div>
                        <input
                            type="text"
                            placeholder="Search JCD by name or ID..."
                            value={searchFilter}
                            onChange={(e) => setSearchFilter(e.target.value)}
                            disabled={!selectedShipID}
                            className="formInput"
                        />
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="mainContent">
                {/* Component Hierarchy */}
                <div className="hierarchySection">
                    <div className="sectionHeader">
                        <FiList size={16} />
                        <span>Component Hierarchy</span>
                    </div>
                    <div className={`hierarchyContainer ${!selectedShipID ? 'disabled' : ''}`}>
                        <Temp_component_heirarchy />
                        {!selectedShipID && (
                            <div className="disabledOverlay">
                                <p>Select a ship to enable component filtering</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* JCD Management */}
                <div className="jcdManagementSection">
                    <div className="jcdTabs">
                        <button
                            className={`tabButton ${activeTab === 'unassigned' ? 'active' : ''}`}
                            onClick={() => setActiveTab('unassigned')}
                        >
                            <FiCheckSquare size={14} />
                            Unassigned JCDs
                            <span className="countBadge">{filteredUnassignedJCDs.length}</span>
                        </button>

                        <button
                            className={`tabButton ${activeTab === 'assigned' ? 'active' : ''}`}
                            onClick={() => setActiveTab('assigned')}
                        >
                            <FaShip size={14} />
                            Assigned JCDs
                            <span className="countBadge">{assignedJCDs.length}</span>
                        </button>
                    </div>

                    <div className="jcdContent">
                        {/* Unassigned JCDs Panel */}
                        <div className={`jcdPanel ${activeTab === 'unassigned' ? 'active' : ''}`}>
                            <div className="panelHeader">
                                <div className="selectionInfo">
                                    <label className="checkboxLabel">
                                        <input
                                            type="checkbox"
                                            checked={unassignedJCDCheckList.length === filteredUnassignedJCDs.length && filteredUnassignedJCDs.length > 0}
                                            onChange={handleSelectAllUnassigned}
                                            disabled={!selectedShipID || filteredUnassignedJCDs.length === 0}
                                        />
                                        <span>Select All ({unassignedJCDCheckList.length}/{filteredUnassignedJCDs.length})</span>
                                    </label>
                                </div>
                                {profiles?.filter(p => user?.profile_ids?.includes(p.PROFILE_ID))[0]?.process_ids.includes("P_JSCA_0002") && (

                                    <button
                                        className="actionButton"
                                        onClick={() => linkJcdsToShip(unassignedJCDCheckList)}
                                        disabled={!selectedShipID || unassignedJCDCheckList.length === 0}
                                    >
                                        <FiArrowRight size={14} />
                                        Assign to Ship
                                    </button>
                                )}
                            </div>

                            <div className="jcdList">
                                {filteredUnassignedJCDs.length > 0 ? (
                                    filteredUnassignedJCDs.filter(jcd => jcd.SHA_ID == null && jcd.line_no == 0).map((jcd) => (
                                        <div key={`unassigned-${jcd.jcd_id}`} className="jcdCard">
                                            <label className="checkboxLabel">
                                                <input
                                                    type="checkbox"
                                                    checked={unassignedJCDCheckList.includes(jcd.jcd_id)}
                                                    onChange={() => handleUnassignedCheck(jcd.jcd_id)}
                                                    disabled={!selectedShipID}
                                                />
                                                <div className="jcdInfo">
                                                    <div className="jcdName">
                                                        {JCD_schedule_List.filter(rawjcd => rawjcd.jcd_id == jcd.jcd_id && rawjcd.SHA_ID == null)[0]?.jcd_name || 'Unnamed JCD'}
                                                    </div>
                                                    <div className="jcdMeta">
                                                        <span className="jcdId">ID: {jcd.jcd_id}</span>
                                                        <span className={`criticalityBadge ${jcd.criticality == '1' ? 'critical' : 'nonCritical'}`}>
                                                            {jcd.criticality == '1' ? 'Critical' : 'Non-Critical'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </label>
                                        </div>
                                    ))
                                ) : (
                                    <div className="emptyState">
                                        <FiList size={32} />
                                        <p>No unassigned JCDs found</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Assigned JCDs Panel */}
                        <div className={`jcdPanel ${activeTab === 'assigned' ? 'active' : ''}`}>
                            <div className="panelHeader">
                                <div className="selectionInfo">
                                    <label className="checkboxLabel">
                                        <input
                                            type="checkbox"
                                            checked={assignedJCDCheckList.length === assignedJCDs.length && assignedJCDs.length > 0}
                                            onChange={handleSelectAllAssigned}
                                            disabled={!selectedShipID || assignedJCDs.length === 0}
                                        />
                                        <span>Select All ({assignedJCDCheckList.length}/{assignedJCDs.length})</span>
                                    </label>
                                </div>
                                {profiles?.filter(p => user?.profile_ids?.includes(p.PROFILE_ID))[0]?.process_ids.includes("P_JSCA_0003") && (
                                    <button
                                        className="actionButton dangerButton"
                                        onClick={() => unlinkJcdsFromShip(assignedJCDCheckList)}
                                        disabled={!selectedShipID || assignedJCDCheckList.length === 0}
                                    >
                                        <FiArrowLeft size={14} />
                                        Unlink from Ship
                                    </button>
                                )}
                            </div>

                            <div className="jcdList">
                                {assignedJCDs.length > 0 ? (
                                    (() => {
                                        const currentShipData = JCD_ship_wise_group_combinations_list.find(
                                            (group) => group.SHA_ID === selectedShipID
                                        );

                                        if (!currentShipData || !currentShipData.jcds.length) {
                                            return (
                                                <div className="emptyState">
                                                    <FaShip size={32} />
                                                    <p>No JCDs assigned to this ship</p>
                                                </div>
                                            );
                                        }

                                        return currentShipData.jcds.map((jcdId, index) => {
                                            const generationRule = currentShipData.generationRules?.[index] || "N/A";
                                            const jcdData = JCD_schedule_List.find(jcd => jcd.jcd_id === jcdId);

                                            return (
                                                <div key={`assigned-${jcdId}`} className="jcCdard assigned">
                                                    <label className="checkboxLabel">
                                                        <input
                                                            type="checkbox"
                                                            checked={assignedJCDCheckList.includes(jcdId)}
                                                            onChange={() => handleAssignedCheck(jcdId)}
                                                        />
                                                        <div className="jcdInfo">
                                                            <div className="jcdName">
                                                                {jcdData?.jcd_name || 'JCD Name'}
                                                            </div>
                                                            <div className="jcdMeta">
                                                                <span className="jcdId">ID: {jcdId}</span>
                                                                <span className="generationRule">Rule: {generationRule}</span>
                                                                <span className={`criticalityBadge ${jcdData?.criticality == '1' ? 'critical' : 'nonCritical'}`}>
                                                                    {jcdData?.criticality == '1' ? 'Critical' : 'Non-Critical'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </label>
                                                </div>
                                            );
                                        });
                                    })()
                                ) : (
                                    <div className="emptyState">
                                        <FaShip size={32} />
                                        <p>No JCDs assigned to this ship</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default JCD_ship_combination_page;
// Select Ship