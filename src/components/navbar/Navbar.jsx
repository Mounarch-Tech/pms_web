import React, { useContext, useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import './Navbar.css';
import { UserAuthContext } from '../../contexts/userAuth/UserAuthContext';
import { Profile_header_context } from '../../contexts/profile_header_context/Profile_header_context';
import { ShipHeaderContext } from '../../contexts/ship_header_context/ShipHeaderContext';
import { DesignationContext } from '../../contexts/Designation_context/DesignationContext';
import axios from 'axios';
// emp_name
const Navbar = () => {
  const navigate = useNavigate();

  // Contexts
  const { user } = useContext(UserAuthContext);
  const { profiles } = useContext(Profile_header_context);
  const { shipsList } = useContext(ShipHeaderContext);
  const { designationList } = useContext(DesignationContext);

  // Local states
  const [shipName, setShipName] = useState(null);
  const [loggedUserDesignation, setLoggedUserDesignation] = useState(null);

  // Access states (grouped to avoid clutter)
  const [access, setAccess] = useState({
    MLC: { formIDs: [], processIDs: [] },
    SHA: { formIDs: [], processIDs: [] },
    JCD: { formIDs: [], processIDs: [] },
    RHNM: { formIDs: [], processIDs: [] },
    JSCA: { formIDs: [], processIDs: [] },
    JTH: { formIDs: [], processIDs: [] },
    CMR: { formIDs: [], processIDs: [] },
  });

  // useEffect(()=>{
  //   console.log('profiles :: ,', profiles)
  // }, [profiles])

  /**
   * Navigate back to dashboard
   */
  const goToDashboard = () => navigate('/home');

  /**
   * Finds ship by ID from global ships list and sets local state.
   */
  const setShipNameByID = (shipID) => {
    const foundShip = shipsList.find((ship) => ship.SHA_ID === shipID);
    if (foundShip) setShipName(foundShip);
  };

  /**
   * Fetch ship ID assigned to the employee.
   */
  const fetchShipIDByEmployeeID = async (empID) => {
    if (!empID) return;
    try {
      const response = await axios.get(`http://localhost:3000/api/getShipIDbyEmployeeID/${empID}`);
      const shipData = response.data?.[0];
      if (shipData?.SHA_ID) setShipNameByID(shipData.SHA_ID);
    } catch (err) {
      console.error("Error fetching ship ID:", err.message);
    }
  };

  /**
   * Track access (form/process IDs) dynamically based on prefix.
   */
  const trackFormProcessAccessibility = (loggedInUser, prefix) => {
    const profileIDs = loggedInUser.profile_ids?.split(',') || [];
    const matchedProfiles = profileIDs
      .map((id) => profiles?.find((p) => p.PROFILE_ID === id))
      .filter(Boolean);

    if (matchedProfiles.length > 0) {
      const firstProfile = matchedProfiles[0];
      const formIDs = firstProfile.form_ids?.split(',').filter((id) => id.includes(prefix)) || [];
      const processIDs = firstProfile.process_ids?.split(',').filter((id) => id.includes(prefix)) || [];

      setAccess((prev) => ({
        ...prev,
        [prefix.toUpperCase()]: { formIDs, processIDs },
      }));
    }
  };

  /**
   * On mount: fetch ship & user access data.
   */
  useEffect(() => {
    if (!user) return;

    // if (user?.UHA_ID) fetchShipIDByEmployeeID(user.UHA_ID);

    // ["MLC", "SHA", "JCD", "JSCA", "rhnm", "JTH", "CMR"].forEach((prefix) =>
    //   trackFormProcessAccessibility(user, prefix)
    // );

    if (designationList) {
      const desgData = designationList.find((desg) => desg.DSGH_ID == user.emp_desg);
      setLoggedUserDesignation(desgData?.desg_name || null);
    }
  }, [user, profiles]);

  return (
    <header className="navbar-corporate">
      <nav className="navbar-corporate__container">
        <div className="navbar-corporate__brand" onClick={goToDashboard}>
          <h2 className="navbar-corporate__title">
            {user?.emp_name}
            {loggedUserDesignation && (
              <span className="navbar-corporate__designation">({loggedUserDesignation})</span>
            )}
          </h2>
        </div>

        <div className="navbar-corporate__menu">
          <NavLink className="navbar-corporate__link" to="/home">
            <span className="navbar-corporate__link-icon">📊</span>
            Dashboard
          </NavLink>

          {profiles?.filter(p => user?.profile_ids?.includes(p.PROFILE_ID))[0]?.process_ids?.includes("P_JTH_0001") && (
            <NavLink className="navbar-corporate__link" to="/JTH_form">
              <span className="navbar-corporate__link-icon"></span>
              Job Types
            </NavLink>
          )}

          {profiles?.filter(p => user?.profile_ids?.includes(p.PROFILE_ID))[0]?.process_ids?.includes("P_JCD_0007") && (
            <NavLink className="navbar-corporate__link" to="/JCD_form">
              <span className="navbar-corporate__link-icon"></span>
              JCD
            </NavLink>
          )}

          {profiles?.filter(p => user?.profile_ids?.includes(p.PROFILE_ID))[0]?.process_ids?.includes("P_MLC_0001") && (
            <NavLink className="navbar-corporate__link" to="/MovementLogPage">
              <span className="navbar-corporate__link-icon"></span>
              Movement Log Config
            </NavLink>
          )}

          {profiles?.filter(p => user?.profile_ids?.includes(p.PROFILE_ID))[0]?.process_ids?.includes("P_SHA_0001") && (

            <NavLink className="navbar-corporate__link" to="/ShipsManagement">
              <span className="navbar-corporate__link-icon"></span>
              Location Management
            </NavLink>
          )}

          {console.log('access.RHNM.processIDs : ', access.RHNM.processIDs)}
          {profiles?.filter(p => user?.profile_ids?.includes(p.PROFILE_ID))[0]?.process_ids?.includes("P_rhnm_0001") && (
            <NavLink className="navbar-corporate__link" to="/RH-NM">
              <span className="navbar-corporate__link-icon"></span>
              R.H / N.M.
            </NavLink>
          )}

          {profiles?.filter(p => user?.profile_ids?.includes(p.PROFILE_ID))[0]?.process_ids?.includes("P_JSCA_0001") && (
            <NavLink className="navbar-corporate__link" to="/jcd-ship-combination">
              <span className="navbar-corporate__link-icon"></span>
              JCD-Location Link
            </NavLink>
          )}

          {profiles?.filter(p => user?.profile_ids?.includes(p.PROFILE_ID))[0]?.process_ids?.includes("P_CMR_0001") && (
            <NavLink className="navbar-corporate__link" to="/comp-meter-reinitializer">
              <span className="navbar-corporate__link-icon"></span>
              Comp. Meter Re-Initiate
            </NavLink>
          )}

          {profiles?.filter(p => user?.profile_ids?.includes(p.PROFILE_ID))[0]?.process_ids?.includes("P_UAT_0001") && (

            <NavLink className="navbar-corporate__link" to="/user-allotment">
              <span className="navbar-corporate__link-icon"></span>
              User Allotment
            </NavLink>
          )}

          <NavLink className="navbar-corporate__link" to="/department-designation">
            <span className="navbar-corporate__link-icon"></span>
            Department & Designation
          </NavLink>
        </div>
      </nav>
    </header>
  );
};

export default Navbar;
