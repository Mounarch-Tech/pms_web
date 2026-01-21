// components/LogInPage/LogInPage.jsx
import React, { useState, useRef, useContext, useEffect } from 'react';
import './LogInPage.css'; // Import the CSS file
import { useNavigate } from 'react-router-dom';
import OTP_verification from '../../components/otp_model/OTP_verification';
import { UserContexts } from '../../contexts/UserContext/UserContexts';
import { ShipCrewCombinationContext } from '../../contexts/ShipCrewCombinationContext/ShipCrewCombinationContexts';
import { DesignationContext } from '../../contexts/Designation_context/DesignationContext';
import { UserAuthContext } from '../../contexts/userAuth/UserAuthContext';
import { OfficeStaffCombination_Context } from '../../contexts/OfficeStaffCombinationContext/OfficeStaffCombination_Context';
import { ShipsContext } from '../../contexts/ShipContext/ShipsContext';

const LogInPage = () => {
    // === Use Context ===
    const { officeStaffList, refreshOfficeStaffList } = useContext(OfficeStaffCombination_Context)
    const { usersList, refreshUsers } = useContext(UserContexts)
    const { shipsList } = useContext(ShipsContext)
    const { crewData, refreshCrewData } = useContext(ShipCrewCombinationContext)
    const { designationList, refreshDesignationList } = useContext(DesignationContext)
    const { user, setUser } = useContext(UserAuthContext)

    // === Use States ===
    const [email, setEmail] = useState('');
    const [pin, setPin] = useState(['', '', '', '', '', '']);
    const [newPin, setNewPin] = useState(['', '', '', '', '', '']);
    const [confirmPin, setConfirmPin] = useState(['', '', '', '', '', '']);
    const [rememberMe, setRememberMe] = useState(false);
    const [isShowOTPModel, setIsShowOTPModel] = useState(false);
    const [forgetOTPrequestBy, setForgetOTPrequestBy] = useState(null)
    const [isShowResetModel, setIsShowResetModel] = useState(false);
    const [loginError, setLoginError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const pinInputRefs = useRef([]);
    const newPinInputRefs = useRef([]);
    const confirmPinInputRefs = useRef([]);

    const navigate = useNavigate();

    // Use Effects
    useEffect(() => {
        refreshUsers()
        refreshCrewData()
        refreshDesignationList()
        refreshOfficeStaffList()
    }, [])

    useEffect(() => {
        console.log('crewData in login page : ', crewData)
    }, [crewData])

    // Clear error when user starts typing
    useEffect(() => {
        if (loginError) {
            setLoginError('');
        }
    }, [email, pin]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setLoginError('');

        // Email validation
        if (!/\S+@\S+\.\S+/.test(email)) {
            setLoginError("Please enter a valid email address");
            setIsLoading(false);
            return;
        }

        // PIN validation
        const pinString = pin.join('');
        if (pinString.length !== 6 || !/^\d+$/.test(pinString)) {
            setLoginError("Please enter a valid 6-digit PIN");
            setIsLoading(false);
            return;
        }

        console.log('Login attempt with : ', { email, pin: pinString, rememberMe });

        try {
            const tempUser = usersList.filter(u => u.user_email === email && u.current_pin === pinString);

            console.log('tempUser : ', tempUser);

            if (tempUser.length > 0) {
                const user = tempUser[0];

                // Check if user is active
                if (user.user_status !== 1) {
                    setLoginError("Your account is inactive. Please contact administrator.");
                    setIsLoading(false);
                    return;
                }

                // Call backend to auto-activate planned allocations
                const API_BASE = import.meta.env.VITE_API_URL;
                try {
                    const response = await fetch(`${API_BASE}activateSuccessor`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ successor_user_id: user.UHA_ID }),
                    });

                    const result = await response.json();
                    console.log("Auto-activation response:", result);
                } catch (activationError) {
                    console.error("Error auto-activating user allocations:", activationError);
                }

                const shipCrew = crewData.filter(sc => sc.user_id === user.UHA_ID && sc.crew_status === 1).length > 0
                    ? crewData.filter(sc => sc.user_id === user.UHA_ID && sc.crew_status === 1)[0]
                    : null;

                const officeStaff = officeStaffList.filter(os => os.user_id === user.UHA_ID).length > 0
                    ? officeStaffList.filter(os => os.user_id === user.UHA_ID)[0]
                    : null;

                // Check if user has either ship crew or office staff assignment
                if (!shipCrew && !officeStaff) {
                    setLoginError("No active assignment found. Please contact administrator.");
                    setIsLoading(false);
                    return;
                }

                const employeeData = {
                    UHA_ID: user.UHA_ID,
                    ship_id: shipCrew?.ship_id || null,
                    emp_name: `${user.first_name} ${user.last_name}`,
                    emp_email: user.user_email,
                    emp_mob1: user.mobile_no,
                    emp_sim_code: user.mobile_sim_country_code,
                    access_code: "LW0507",
                    emp_dob: "2002-07-05",
                    emp_doj: "2020-05-07",
                    emp_desg: shipCrew?.desg_id || officeStaff?.desg_id,
                    reporting_to: shipCrew?.reporting_to_desg || officeStaff?.reporting_to_desg,
                    reporting_to_user: shipCrew?.reporting_to_user || officeStaff?.reporting_to_user,
                    DEPT_ID: shipCrew?.dept_id || officeStaff?.dept_id,
                    inserted_on: new Date().toISOString().slice(0, 19).replace("T", " "),
                    emp_status: user.user_status,
                    emp_type: user.user_type,
                    profile_ids: designationList.filter(d => d.DSGH_ID === (shipCrew?.desg_id || officeStaff?.desg_id))[0]?.profile_ids || []
                };

                console.log("✅ Authenticated Employee:", employeeData);

                await setUser(employeeData);

                // Store login data if "Remember Me" is checked
                if (rememberMe) {
                    localStorage.setItem('rememberedEmail', email);
                } else {
                    localStorage.removeItem('rememberedEmail');
                }

                // reload ship_crew_combination_all and office_staff_combination_all
                await refreshCrewData()
                await refreshOfficeStaffList()

                navigate('/home');

            } else {
                // User not found - check if email exists but PIN is wrong
                const emailExists = usersList.some(u => u.user_email === email);

                if (emailExists) {
                    setLoginError("Invalid PIN. Please check your PIN and try again.");
                } else {
                    setLoginError("No account found with this email address. Please check your email or contact administrator.");
                }
            }
        } catch (error) {
            console.error('Login error:', error);
            setLoginError("An unexpected error occurred. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const goToSignUp = () => {
        navigate('/SignUp');
    };

    const handleEmailChange = (e) => {
        setEmail(e.target.value);
    };

    // Generic PIN handling function
    const handlePinChange = (pinArray, setPinArray, refs, index, value) => {
        // Allow only digits
        if (value && !/^\d$/.test(value)) {
            return;
        }

        const newPinArray = [...pinArray];
        newPinArray[index] = value;
        setPinArray(newPinArray);

        // Auto-focus to next input
        if (value && index < 5) {
            refs.current[index + 1]?.focus();
        }
    };

    const handlePinKeyDown = (pinArray, refs, index, e) => {
        // Handle backspace
        if (e.key === 'Backspace' && !pinArray[index] && index > 0) {
            refs.current[index - 1]?.focus();
        }
    };

    const handlePinPaste = (setPinArray, refs, e) => {
        e.preventDefault();
        const pasteData = e.clipboardData.getData('text');
        const digits = pasteData.replace(/\D/g, '').slice(0, 6).split('');

        if (digits.length === 6) {
            const newPinArray = ['', '', '', '', '', ''];
            digits.forEach((digit, index) => {
                newPinArray[index] = digit;
            });
            setPinArray(newPinArray);

            // Focus the last input
            refs.current[5]?.focus();
        }
    };

    const handleForgotPin = () => {
        // Email validation before proceeding
        if (!email || !/\S+@\S+\.\S+/.test(email)) {
            setLoginError("Please enter your email address first to receive a new PIN");
            return;
        }

        // Check if email exists in the system
        const emailExists = usersList.some(u => u.user_email === email);
        if (!emailExists) {
            setLoginError("No account found with this email address.");
            return;
        }

        const confirmation = confirm('We are sending email with OTP to generate new pin to Your Location Superintendent. Please connect with them for further procedure. Would you like to proceed?');
        if (confirmation) {
            const user = usersList.filter(u => u.user_email == email)
            setForgetOTPrequestBy(user)
            setIsShowOTPModel(true);
        }
    };

    const handleResetPin = () => {
        const newPinString = newPin.join('');
        const confirmPinString = confirmPin.join('');

        if (newPinString.length !== 6 || !/^\d+$/.test(newPinString)) {
            alert("Please enter a valid 6-digit new PIN");
            return;
        }

        if (confirmPinString.length !== 6 || !/^\d+$/.test(confirmPinString)) {
            alert("Please enter a valid 6-digit confirmation PIN");
            return;
        }

        if (newPinString !== confirmPinString) {
            alert("PINs do not match. Please make sure both PINs are identical.");
            return;
        }

        console.log('PIN reset requested for : ', email, 'New PIN:', newPinString);
        // API call to reset PIN would go here

        alert('PIN reset successfully!');
        setIsShowResetModel(false);
        setNewPin(['', '', '', '', '', '']);
        setConfirmPin(['', '', '', '', '', '']);
    };

    // Load remembered email on component mount
    useEffect(() => {
        const rememberedEmail = localStorage.getItem('rememberedEmail');
        if (rememberedEmail) {
            setEmail(rememberedEmail);
            setRememberMe(true);
        }
    }, []);

    return (
        <div className="login-corporate">
            {/* Bubble Elements */}
            <div className="bubble"></div>
            <div className="bubble"></div>
            <div className="bubble"></div>
            <div className="bubble"></div>
            <div className="bubble"></div>

            {/* Your existing animated elements */}
            <div className="submarine">🏭</div>
            <div className="island"></div>
            <div className="island"></div>
            <div className="sonar"></div>
            <div className="sonar"></div>
            <div className="sonar"></div>
            <div className="lighthouse">🗼</div>
            <div className="lighthouse-beam"></div>
            <div className="container-stack">
                <div className="container" style={{ '--delay': 0 }}></div>
                <div className="container" style={{ '--delay': 1 }}></div>
                <div className="container" style={{ '--delay': 2 }}></div>
            </div>

            <div className="login-corporate__container">
                <div className="login-corporate__header">
                    {/* <div className="login-corporate__icon">🚢👨‍💼</div> */}
                    <h1 className="login-corporate__title">Crew & Staff PMS Portal</h1>
                    <p className="login-corporate__subtitle">Sign in to your facility and office operations account</p>
                </div>

                <form className="login-corporate__form" onSubmit={handleSubmit}>
                    {/* Error Message */}
                    {loginError && (
                        <div className="login-error-message">
                            <span className="error-icon">⚠️</span>
                            {loginError}
                        </div>
                    )}

                    {/* Email Field */}
                    <div className="form-field-corporate">
                        <label className="form-field-corporate__label" style={{ color: 'white' }}>
                            Email <span className="form-field-corporate__required">*</span>
                        </label>
                        <input
                            type="email"
                            className={`form-field-corporate__input ${loginError ? 'input-error' : ''}`}
                            value={email}
                            onChange={handleEmailChange}
                            required
                            placeholder="e.g., user@example.com"
                            disabled={isLoading}
                        // style={{color:'white'}}
                        />
                    </div>

                    {/* 6-Digit PIN Field */}
                    <div className="form-field-corporate">
                        <label className="form-field-corporate__label" style={{ color: 'white' }}>
                            6-Digit PIN <span className="form-field-corporate__required">*</span>
                        </label>
                        <div className="pin-input-container">
                            {pin.map((digit, index) => (
                                <input
                                    key={index}
                                    ref={(el) => (pinInputRefs.current[index] = el)}
                                    type="text"
                                    className={`pin-input ${loginError ? 'pin-input-error' : ''}`}
                                    maxLength="1"
                                    value={digit}
                                    onChange={(e) => handlePinChange(pin, setPin, pinInputRefs, index, e.target.value)}
                                    onKeyDown={(e) => handlePinKeyDown(pin, pinInputRefs, index, e)}
                                    onPaste={(e) => handlePinPaste(setPin, pinInputRefs, e)}
                                    placeholder="•"
                                    required
                                    disabled={isLoading}
                                />
                            ))}
                        </div>
                        <div className="pin-hint">Enter your 6-digit security PIN</div>
                    </div>

                    {/* Options */}
                    <div className="login-corporate__options">
                        <div className="login-corporate__remember">
                            <input
                                type="checkbox"
                                id="remember"
                                checked={rememberMe}
                                onChange={(e) => setRememberMe(e.target.checked)}
                                className="login-corporate__checkbox"
                                disabled={isLoading}
                            />
                            <label htmlFor="remember" className="login-corporate__remember-label">
                                Remember me
                            </label>
                        </div>
                        <button
                            type="button"
                            className="login-corporate__forgot-link"
                            onClick={handleForgotPin}
                            disabled={isLoading}
                        >
                            Forgot PIN?
                        </button>
                    </div>

                    {/* Submit Button */}
                    <div className="login-corporate__actions">
                        <button
                            type="submit"
                            className={`btn-corporate btn-corporate--primary ${isLoading ? 'btn-loading' : ''}`}
                            disabled={isLoading}
                            style={{
                                color: 'white'
                            }}
                        >
                            {isLoading ? (
                                <>
                                    <span className="loading-spinner"></span>
                                    Signing In...
                                </>
                            ) : (
                                'Sign In'
                            )}
                        </button>
                    </div>
                </form>

                {/* <div className="login-corporate__footer">
                    <p className="login-corporate__footer-text">
                        Don't have an account?{' '}
                        <button type="button" onClick={goToSignUp} className="login-corporate__signup-link">
                            Sign Up
                        </button>
                    </p>
                </div> */}
            </div>

            {isShowOTPModel && (
                // if login user is from ship, then user.ship_id is found, but if its null means it is office side user
                <OTP_verification
                    onCancel={() => {
                        setIsShowOTPModel(false);
                        setIsShowResetModel(false);
                    }}
                    onVerifySuccess={() => {
                        setIsShowOTPModel(false);
                        setIsShowResetModel(true);
                    }}
                    to='lokeshwagh5072@gmail.com'
                    messageType='This is testing message'
                    request_by={forgetOTPrequestBy}
                    ship_name={shipsList.filter(s => s.SHA_ID == forgetOTPrequestBy.ship_id)[0]?.ship_name || null}
                />
            )}

            {isShowResetModel && (
                <div className="reset-pin-corporate" onClick={() => setIsShowResetModel(false)}>
                    <div className="reset-pin-corporate__card" onClick={(e) => e.stopPropagation()}>
                        <div className="reset-pin-corporate__header">
                            <div className="reset-pin-corporate__icon">🔄</div>
                            <h2 className="reset-pin-corporate__title">Set New PIN</h2>
                            <p className="reset-pin-corporate__subtitle">Create a new 6-digit security PIN</p>
                        </div>

                        <div className="reset-pin-corporate__content">
                            <div className="form-field-corporate">
                                <label className="form-field-corporate__label">
                                    New PIN <span className="form-field-corporate__required">*</span>
                                </label>
                                <div className="pin-input-container">
                                    {newPin.map((digit, index) => (
                                        <input
                                            key={index}
                                            ref={(el) => (newPinInputRefs.current[index] = el)}
                                            type="text"
                                            className="pin-input"
                                            maxLength="1"
                                            value={digit}
                                            onChange={(e) => handlePinChange(newPin, setNewPin, newPinInputRefs, index, e.target.value)}
                                            onKeyDown={(e) => handlePinKeyDown(newPin, newPinInputRefs, index, e)}
                                            onPaste={(e) => handlePinPaste(setNewPin, newPinInputRefs, e)}
                                            placeholder="•"
                                            required
                                        />
                                    ))}
                                </div>
                            </div>

                            <div className="form-field-corporate">
                                <label className="form-field-corporate__label">
                                    Confirm PIN <span className="form-field-corporate__required">*</span>
                                </label>
                                <div className="pin-input-container">
                                    {confirmPin.map((digit, index) => (
                                        <input
                                            key={index}
                                            ref={(el) => (confirmPinInputRefs.current[index] = el)}
                                            type="text"
                                            className="pin-input"
                                            maxLength="1"
                                            value={digit}
                                            onChange={(e) => handlePinChange(confirmPin, setConfirmPin, confirmPinInputRefs, index, e.target.value)}
                                            onKeyDown={(e) => handlePinKeyDown(confirmPin, confirmPinInputRefs, index, e)}
                                            onPaste={(e) => handlePinPaste(setConfirmPin, confirmPinInputRefs, e)}
                                            placeholder="•"
                                            required
                                        />
                                    ))}
                                </div>
                            </div>

                            <div className="reset-pin-corporate__actions">
                                <button
                                    type="button"
                                    className="btn-corporate btn-corporate--secondary"
                                    onClick={() => setIsShowResetModel(false)}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    className="btn-corporate btn-corporate--primary"
                                    onClick={handleResetPin}
                                >
                                    Set New PIN
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LogInPage;
// Crew & Staff Portal
