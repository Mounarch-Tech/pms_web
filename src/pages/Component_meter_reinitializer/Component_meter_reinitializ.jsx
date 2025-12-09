import React, { useContext, useState, useEffect } from 'react';
import './Component_meter_reinitializ.css';
import Temp_component_heirarchy from '../temp_component_heirarchy/Temp_component_heirarchy';
import { ShipHeaderContext } from '../../contexts/ship_header_context/ShipHeaderContext';
import { ComponentTreeContext } from '../../contexts/ComponentTreeContext/ComponentTreeContext';
import { FaTachometerAlt } from 'react-icons/fa';
import { UserAuthContext } from '../../contexts/userAuth/UserAuthContext';
import { Profile_header_context } from '../../contexts/profile_header_context/Profile_header_context';
// 
const Component_meter_reinitializ = () => {
  const { shipsList } = useContext(ShipHeaderContext);
  const { selectedNode, clearSelection, refreshTree } = useContext(ComponentTreeContext);
  const API_BASE_URL = import.meta.env.VITE_API_URL;
  const { user } = useContext(UserAuthContext)
  const { profiles } = useContext(Profile_header_context)

  const initialFormData = {
    shipId: '',
    rh: '',
    nm: '',
    idl: '',
    isMovementLogAffect: 0,
    impactOn: 0,
    selectedNodeId: '',
    component_type: '',
    childs: []
  };

  const [formData, setFormData] = useState(initialFormData);
  const [selectedShipID, setSelectedShipID] = useState(null);

  // Update form when selected node changes
  useEffect(() => {
    if (selectedNode) {
      setFormData(prev => ({
        ...prev,
        rh: Number(selectedNode?.data?.working_counter_hr || 0),
        nm: Number(selectedNode?.data?.km_counter || 0),
        idl: Number(selectedNode?.data?.replacement_day_counter || 0),
        isMovementLogAffect: 0,
        impactOn: 0,
        selectedNodeId: selectedNode.id || '',
        component_type: selectedNode.type || '',
        childs: selectedNode.children || []
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        rh: '',
        nm: '',
        idl: '',
        isMovementLogAffect: 0,
        impactOn: 0,
        selectedNodeId: '',
        component_type: '',
        childs: []
      }));
    }
  }, [selectedNode]);

  // Reset form on ship change, keep shipId
  useEffect(() => {
    setFormData({
      ...initialFormData,
      shipId: selectedShipID
    });
    clearSelection();
  }, [selectedShipID]);

  useEffect(() => {
    if (user.emp_type == 1) {
      setSelectedShipID(user.ship_id)
    }
  }, [user])

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value === '' ? '' : Number(value)
    }));
  };

  const handleCheckboxChange = e => {
    const checked = e.target.checked;
    setFormData(prev => ({
      ...prev,
      isMovementLogAffect: checked ? 1 : 0,
      impactOn: 0
    }));
  };

  const handleRadioChange = e => {
    setFormData(prev => ({
      ...prev,
      impactOn: Number(e.target.value)
    }));
  };

  const handleShipChange = e => {
    const shipId = e.target.value;
    setSelectedShipID(shipId);
    setFormData(prev => ({ ...prev, shipId }));
  };

  const handleNumberKeyDown = e => {
    if (["e", "E", "+", "-"].includes(e.key)) e.preventDefault();
  };

  const resetForm = () => {
    setFormData({ ...initialFormData, shipId: selectedShipID });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!formData.shipId) return alert("Please select a ship");
    if (formData.rh === '' || formData.nm === '' || formData.idl === '')
      return alert("Please fill all meter values");

    try {
      const res = await fetch(`${API_BASE_URL}reInitiateComponentMeters`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const result = await res.json();
      if (result.success) {
        alert("Configuration Saved!");
        refreshTree();
        resetForm();
      } else {
        alert("Failed to save configuration: " + result.message);
      }
    } catch (err) {
      console.error(err);
      alert("Network error. Please try again.");
    }
  };

  return (
    <div id='component-meter-reinitializer-main-container'>
      <div id='component-meter-reinitializer-component-heirarchy-container'>

        <Temp_component_heirarchy selectedShipID={selectedShipID} />
        <div
          id='component-meter-reinitializer-component-heirarchy-container-cover'
          style={{ cursor: selectedShipID ? 'pointer' : 'not-allowed', zIndex: selectedShipID ? -1 : 0 }}
        />
      </div>

      <div id='component-meter-reinitializer-form-main-container'>
        {profiles?.filter(p => user?.profile_ids?.includes(p.PROFILE_ID))[0]?.form_ids.includes("F_CMR_001") && (
          <form onSubmit={handleSubmit}>
            <div id='component-meter-reinitializer-form-header'>
              <h2>Component Meter Reinitialization</h2>
            </div>

            {user.emp_type == 2 ? (
              <div id='component-meter-reinitializer-form-main-container-select-ship-container'>
                <select value={formData.shipId || ''} onChange={handleShipChange}>
                  <option value=''>Select Ship</option>
                  {shipsList.map(ship => (
                    <option key={ship.SHA_ID} value={ship.SHA_ID}>{ship.ship_name}</option>
                  ))}
                </select>
              </div>
            ) : (
              <h2>You are on {user.ship_id}</h2>
            )}

            <div id='component-meter-reinitializer-form-main-container-selected-component-label'>
              <h3>Selected Component: {selectedNode?.data?.label || 'N/A'}</h3>
              {selectedNode && (
                <small>
                  Current Values: RH: {selectedNode?.data?.working_counter_hr || 0},
                  NM: {selectedNode?.data?.km_counter || 0},
                  IDL: {selectedNode?.data?.replacement_day_counter || 0}
                </small>
              )}
            </div>

            <div id='component-meter-reinitializer-form-main-container-main-form-content-container'>
              <div>
                <label><FaTachometerAlt /> Current R. H.</label>
                <input
                  type='number'
                  value={formData.rh}
                  onChange={e => handleInputChange('rh', e.target.value)}
                  onKeyDown={handleNumberKeyDown}
                  disabled={!selectedShipID}
                />
              </div>

              <div>
                <label>Current N. M.</label>
                <input
                  type='number'
                  value={formData.nm}
                  onChange={e => handleInputChange('nm', e.target.value)}
                  onKeyDown={handleNumberKeyDown}
                  disabled={!selectedShipID}
                />
              </div>

              <div>
                <label>Current Idle Counter</label>
                <input
                  type='number'
                  value={formData.idl}
                  onChange={e => handleInputChange('idl', e.target.value)}
                  onKeyDown={handleNumberKeyDown}
                  disabled={!selectedShipID}
                />
              </div>

              <div id='movement-logs-checks-container'>
                <label>
                  <input
                    type='checkbox'
                    checked={formData.isMovementLogAffect === 1}
                    onChange={handleCheckboxChange}
                    disabled={!selectedShipID}
                  />
                  is It Movement Log? and will It impact on Job Firing Process?
                </label>

                {formData.isMovementLogAffect === 1 && (
                  <div className='impact-options'>
                    <label>Impacted On</label>
                    <label>
                      <input
                        type='radio'
                        name='impact-on'
                        value='0'
                        checked={formData.impactOn === 0}
                        onChange={handleRadioChange}
                      /> Self Only
                    </label>
                    <label>
                      <input
                        type='radio'
                        name='impact-on'
                        value='1'
                        checked={formData.impactOn === 1}
                        onChange={handleRadioChange}
                      /> Children Hierarchy
                    </label>
                  </div>
                )}
              </div>
            </div>

            <div className='form-actions'>
              {profiles?.filter(p => user?.profile_ids?.includes(p.PROFILE_ID))[0]?.process_ids.includes("P_CMR_0002") && (
                <button type='submit' disabled={!selectedShipID || !selectedNode}>💾 Save Configuration</button>
              )}

              <button type='button' onClick={resetForm} className='secondary-button'>🗑️ Clear</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default Component_meter_reinitializ;