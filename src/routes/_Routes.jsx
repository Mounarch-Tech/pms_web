// routes/_Routes.jsx
import React, { lazy, Suspense, useContext, useEffect, useState } from 'react';
import { Route, Routes, Navigate } from 'react-router-dom';
import axios from 'axios';
// emp_name
import LogInPage from '../pages/log_in_page/LogInPage';
import RegistrationPage from '../pages/registration_page/RegistrationPage';
import MovementLogPage from '../pages/MovementLogPage/MovementLogPage';
import ShipManagementPage from '../pages/ship_management_page/ShipManagementPage';
import Movement_transaction_page from '../pages/movement_trasactions_page/Movement_transaction_page';
import JCD_ship_combination_page from '../pages/jcd_ship_combination_page/JCD_ship_combination_page';
import JCD_Page2 from '../pages/JCD_Page2/JCD_Page2';
import UserAllocation from '../pages/UserAllotment/UserAllocation';
import UserLogin from '../pages/user_login_activity/user_login_activity';

import { UserAuthContext } from '../contexts/userAuth/UserAuthContext';
import { Profile_header_context } from '../contexts/profile_header_context/Profile_header_context';
import { ShipHeaderContext } from '../contexts/ship_header_context/ShipHeaderContext';
import Loading from '../components/LoadingCompo/Loading';

// Lazy imports
const Dashboard = lazy(() => import('../pages/dashboard/Dashboard'));
const NotFound = lazy(() => import('../pages/error404PageNotFound/NotFound'));
const JTH_form = lazy(() => import('../pages/jth_form/JTH_form'));
const JCD_creation_form = lazy(() => import('../components/JCD_components/JCD_creation_form'));
const Component_meter_reinitializ = lazy(() => import('../pages/Component_meter_reinitializer/Component_meter_reinitializ'));
const DepartmentDesignation = lazy(() => import('../pages/dept_dsgh/DepartmentDesignation'));

const _Routes = () => {
  const { user } = useContext(UserAuthContext);
  const { profiles } = useContext(Profile_header_context);
  const { shipsList } = useContext(ShipHeaderContext);

  const [shipName, setShipName] = useState(null);

  // Access control states
  const [userMLCAccessProcessIDs, setUserMLCAccessProcessIDs] = useState([]);
  const [userSHAAccessProcessIDs, setUserSHAAccessProcessIDs] = useState([]);
  const [userRHNMAccessProcessIDs, setUserRHNMAccessProcessIDs] = useState([]);
  const [userJTHAccessProcessIDs, setUserJTHAccessProcessIDs] = useState([]);
  const [userJSCAAccessProcessIDs, setUserJSCAAccessProcessIDs] = useState([]);
  const [userCMRAccessProcessIDs, setUserCMRAccessProcessIDs] = useState([]);

  // Set ship name based on ID
  const setShipNameByID = (shipID) => {
    const foundShip = shipsList.find(ship => ship.SHA_ID === shipID);
    if (foundShip) setShipName(foundShip);
  };

  // Track form/process access by profile
  const trackFormProcessAccessibility = (loggedInUser, prefix) => {
    const profileIDs = loggedInUser.profile_ids?.split(',') || [];
    const matchedProfiles = profileIDs
      .map(id => profiles?.find(profile => profile.PROFILE_ID === id))
      .filter(Boolean);

    if (!matchedProfiles.length) return;

    const firstProfile = matchedProfiles[0];
    const processIDs = firstProfile.process_ids?.split(',').filter(id => id.includes(prefix)) || [];

    switch (prefix) {
      case 'MLC': setUserMLCAccessProcessIDs(processIDs); break;
      case 'SHA': setUserSHAAccessProcessIDs(processIDs); break;
      case 'rhnm': setUserRHNMAccessProcessIDs(processIDs); break;
      case 'JTH': setUserJTHAccessProcessIDs(processIDs); break;
      case 'JSCA': setUserJSCAAccessProcessIDs(processIDs); break;
      case 'CMR': setUserCMRAccessProcessIDs(processIDs); break;
      default: break;
    }
  };

  // Initial fetch & access setup
  useEffect(() => {
    const fetchData = async () => {
      // if (user?.UHA_ID) {
      //   await fetchShipIDByEmployeeID(user.UHA_ID);
      // }
      if (user) {
        ['MLC', 'SHA', 'rhnm', 'JTH', 'JSCA', 'CMR'].forEach(prefix =>
          trackFormProcessAccessibility(user, prefix)
        );
      }
    };
    fetchData();
  }, [user, profiles]);

  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<LogInPage />} />
        <Route path="/SignUp" element={<RegistrationPage />} />

        {/* Protected Routes (only if logged in) */}
        {user ? (
          <>
            <Route path="/home" element={<Dashboard />} />

            {
              <Route path='/department-designation' element={<DepartmentDesignation />} />
            }

            {userJTHAccessProcessIDs.includes('P_JTH_0001') && (
              <Route path="/JTH_form" element={<JTH_form />} />
            )}

            <Route path="/JCD_form" element={<JCD_Page2 />}>
              <Route index element={<JCD_creation_form />} />
            </Route>

            {userMLCAccessProcessIDs.includes('P_MLC_0001') && (
              <Route path="/MovementLogPage" element={<MovementLogPage />} />
            )}

            {user.emp_type === 2 && userSHAAccessProcessIDs.includes('P_SHA_0001') && (
              <Route path="/ShipsManagement" element={<ShipManagementPage />} />
            )}

            {userRHNMAccessProcessIDs.includes('P_rhnm_0001') && (
              <Route path="/RH-NM" element={<Movement_transaction_page />} />
            )}

            {userJSCAAccessProcessIDs.includes('P_JSCA_0001') && (
              <Route path="/jcd-ship-combination" element={<JCD_ship_combination_page />} />
            )}

            {/* Always available for logged-in users */}
            <Route path="/comp-meter-reinitializer" element={<Component_meter_reinitializ />} />
            <Route path="/user-allotment" element={<UserAllocation />} />
            {
              <Route path='/user_login' element={<UserLogin />} />
            }
          </>
        ) : (
          // If not logged in, redirect protected paths back to login
          <>
            <Route path="/home" element={<Navigate to="/login" />} />
            <Route path="/JTH_form" element={<Navigate to="/login" />} />
            <Route path="/JCD_form" element={<Navigate to="/login" />} />
            <Route path="/MovementLogPage" element={<Navigate to="/login" />} />
            <Route path="/ShipsManagement" element={<Navigate to="/login" />} />
            <Route path="/RH-NM" element={<Navigate to="/login" />} />
            <Route path="/jcd-ship-combination" element={<Navigate to="/login" />} />
            <Route path="/comp-meter-reinitializer" element={<Navigate to="/login" />} />
            <Route path="/user-allotment" element={<Navigate to="/login" />} />
            <Route path='/department-designation' element={<Navigate to="/login" />} />
            <Route path='/user_login' element={<Navigate to="/login" />} />
          </>
        )}

        {/* Catch-all */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
};

export default _Routes;
// localhost