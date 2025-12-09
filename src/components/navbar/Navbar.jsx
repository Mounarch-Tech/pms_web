import React, { useContext, useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import './Navbar.css';
import { UserAuthContext } from '../../contexts/userAuth/UserAuthContext';
import { Profile_header_context } from '../../contexts/profile_header_context/Profile_header_context';
import { ShipHeaderContext } from '../../contexts/ship_header_context/ShipHeaderContext';
import { DesignationContext } from '../../contexts/Designation_context/DesignationContext';
import axios from 'axios';

const Navbar = () => {
  const navigate = useNavigate();

  // Contexts
  const { user, setUser } = useContext(UserAuthContext);
  const { profiles } = useContext(Profile_header_context);
  const { shipsList } = useContext(ShipHeaderContext);
  const { designationList } = useContext(DesignationContext);

  // Local states
  const [shipName, setShipName] = useState(null);
  const [loggedUserDesignation, setLoggedUserDesignation] = useState(null);

  // Access states
  const [access, setAccess] = useState({
    MLC: { formIDs: [], processIDs: [] },
    SHA: { formIDs: [], processIDs: [] },
    JCD: { formIDs: [], processIDs: [] },
    RHNM: { formIDs: [], processIDs: [] },
    JSCA: { formIDs: [], processIDs: [] },
    JTH: { formIDs: [], processIDs: [] },
    CMR: { formIDs: [], processIDs: [] },
  });

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
   * On mount: fetch ship & user access data.
   */
  useEffect(() => {
    if (!user) return;

    if (designationList) {
      const desgData = designationList.find((desg) => desg.DSGH_ID == user.emp_desg);
      setLoggedUserDesignation(desgData?.desg_name || null);
    }
  }, [user, profiles]);

  // --- START: LOGOUT FUNCTION ---
  const handleLogout = async () => {
    if (!user || !user.UHA_ID || !user.activity_session_id) {
      console.warn("User or session ID missing, logging out locally.");
      await setUser(null);
      localStorage.removeItem('rememberedEmail'); // Clear remembered email
      navigate('/'); // Navigate to the login page (root or /)
      return;
    }

    const API_BASE = import.meta.env.VITE_API_URL;

    try {
      // Call Backend /logout API to record last_logout_at
      const response = await fetch(`${API_BASE}logout`, { // Assuming path is /api/user/logout
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          activity_session_id: user.activity_session_id,
          UHA_ID: user.UHA_ID
        }),
      });

      // Handle response (even if it fails, we clear the client session for security)
      const result = await response.json();
      if (result.success) {
        console.log("Logout recorded successfully:", result.message);
      } else {
        console.error("Logout recording failed:", result.message);
      }

    } catch (error) {
      console.error('Logout API call error:', error);
    } finally {
      // Clear client-side state and navigate regardless of API success/failure
      await setUser(null);
      localStorage.removeItem('rememberedEmail');
      navigate('/');
    }
  };
  // --- END: LOGOUT FUNCTION ---

  return (
    <header className="navbar-corporate">
      <nav className="navbar-corporate__container">
        {/* Brand Section */}
        <div className="navbar-corporate__brand" onClick={goToDashboard}>
          <div className="navbar-corporate__user-info">
            <h2 className="navbar-corporate__name">{user?.emp_name}</h2>
            {loggedUserDesignation && (
              <span className="navbar-corporate__designation">{loggedUserDesignation}</span>
            )}
          </div>
        </div>

        {/* Navigation Menu */}
        <div className="navbar-corporate__menu">
          <NavLink className="navbar-corporate__link" to="/home">
            {/* <span className="navbar-corporate__link-icon">📊</span> */}
            Dashboard
          </NavLink>

          {profiles?.filter(p => user?.profile_ids?.includes(p.PROFILE_ID))[0]?.process_ids?.includes("P_UAC_0001") && (
            <NavLink className="navbar-corporate__link" to="/user_login">
              {/* <span className="navbar-corporate__link-icon">👤</span> Added an icon for clarity */}
              USER ACTIVITY
            </NavLink>
          )}

          {profiles?.filter(p => user?.profile_ids?.includes(p.PROFILE_ID))[0]?.process_ids?.includes("P_JTH_0001") && (
            <NavLink className="navbar-corporate__link" to="/JTH_form">
              {/* <span className="navbar-corporate__link-icon">⚙️</span> */}
              Job Types
            </NavLink>
          )}

          {profiles?.filter(p => user?.profile_ids?.includes(p.PROFILE_ID))[0]?.process_ids?.includes("P_JCD_0007") && (
            <NavLink className="navbar-corporate__link" to="/JCD_form">
              {/* <span className="navbar-corporate__link-icon">📝</span> */}
              JCD
            </NavLink>
          )}

          {profiles?.filter(p => user?.profile_ids?.includes(p.PROFILE_ID))[0]?.process_ids?.includes("P_MLC_0001") && (
            <NavLink className="navbar-corporate__link" to="/MovementLogPage">
              {/* <span className="navbar-corporate__link-icon">🚢</span> */}
              Movement Log
            </NavLink>
          )}

          {profiles?.filter(p => user?.profile_ids?.includes(p.PROFILE_ID))[0]?.process_ids?.includes("P_SHA_0001") && (
            <NavLink className="navbar-corporate__link" to="/ShipsManagement">
              {/* <span className="navbar-corporate__link-icon">⛴️</span> */}
              Ships
            </NavLink>
          )}

          {profiles?.filter(p => user?.profile_ids?.includes(p.PROFILE_ID))[0]?.process_ids?.includes("P_rhnm_0001") && (
            <NavLink className="navbar-corporate__link" to="/RH-NM">
              {/* <span className="navbar-corporate__link-icon">👥</span> */}
              R.H / N.M.
            </NavLink>
          )}

          {profiles?.filter(p => user?.profile_ids?.includes(p.PROFILE_ID))[0]?.process_ids?.includes("P_JSCA_0001") && (
            <NavLink className="navbar-corporate__link" to="/jcd-ship-combination">
              {/* <span className="navbar-corporate__link-icon">🔗</span> */}
              JCD-SHIP
            </NavLink>
          )}

          {profiles?.filter(p => user?.profile_ids?.includes(p.PROFILE_ID))[0]?.process_ids?.includes("P_CMR_0001") && (
            <NavLink className="navbar-corporate__link" to="/comp-meter-reinitializer">
              {/* <span className="navbar-corporate__link-icon">🔄</span> */}
              Comp. Meter
            </NavLink>
          )}

          {profiles?.filter(p => user?.profile_ids?.includes(p.PROFILE_ID))[0]?.process_ids?.includes("P_UAT_0001") && (
            <NavLink className="navbar-corporate__link" to="/user-allotment">
              {/* <span className="navbar-corporate__link-icon">👤</span> */}
              User Allotment
            </NavLink>
          )}

          <NavLink className="navbar-corporate__link" to="/department-designation">
            {/* <span className="navbar-corporate__link-icon">🏢</span> */}
            Dept & Designation
          </NavLink>

          {/* --- START: LOGOUT BUTTON --- */}
          <button
            className="navbar-corporate_link navbar-corporate_logout-btn"
            onClick={handleLogout}
            title="Sign Out"
          >

          </button>
          {/* --- END: LOGOUT BUTTON --- */}
        </div>
      </nav>
    </header>
  );
};

export default Navbar;
// localhost