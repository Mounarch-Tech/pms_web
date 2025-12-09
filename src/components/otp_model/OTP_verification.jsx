// src/components/otp_model/OTP_verification.jsx
import React, { useState, useEffect, useRef, useContext } from 'react';
import './OTP_verification.css';
import axios from 'axios';
import { UserAuthContext } from '../../contexts/userAuth/UserAuthContext';
// 
const OTP_verification = ({ onVerifySuccess, onCancel, to, messageType = "login", request_by, ship_name }) => {
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [isResending, setIsResending] = useState(false);
    const [timer, setTimer] = useState(0);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const inputRefs = useRef([]);

    const API_BASE_URL = import.meta.env.VITE_API_URL;

    const { user } = useContext(UserAuthContext);

    // Start countdown effect
    useEffect(() => {
        if (timer > 0) {
            const interval = setInterval(() => {
                setTimer((prev) => prev - 1);
            }, 1000);
            return () => clearInterval(interval);
        }
    }, [timer]);

    // Send OTP on mount
    useEffect(() => {
        handleResendOTP();
    }, []);

    const handleChange = (e, index) => {
        const value = e.target.value;
        if (/^[0-9]?$/.test(value)) {
            const newOtp = [...otp];
            newOtp[index] = value;
            setOtp(newOtp);

            if (value && index < 5) {
                inputRefs.current[index + 1]?.focus();
            }
        }
    };

    const handleKeyDown = (index, e) => {
        // Handle backspace
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handlePaste = (e) => {
        e.preventDefault();
        const clipboardData = e.clipboardData.getData('text').slice(0, 6);
        if (/^\d{6}$/.test(clipboardData)) {
            const newOtp = clipboardData.split('');
            setOtp(newOtp);
            newOtp.forEach((digit, index) => {
                if (index < 5) {
                    inputRefs.current[index + 1]?.focus();
                }
            });
        } else {
            setError('Invalid OTP format. Please paste a 6-digit number.');
        }
    };

    const handleVerify = async () => {
        const otpString = otp.join('');
        if (otpString.length !== 6) {
            setError('Please enter a valid 6-digit OTP');
            return;
        }

        try {
            const res = await axios.post(`${API_BASE_URL}verify-otp`, {
                contact: to,
                otp: otpString,
                messageType
            });

            if (res.data.success) {
                setSuccess(true);
                setError('');
                setTimeout(() => {
                    onVerifySuccess();
                }, 800);
            } else {
                setError(res.data.error || 'Invalid or expired OTP');
            }
        } catch (err) {
            setError('Verification failed. Check connection or retry.');
        }
    };

    const handleResendOTP = async () => {
        if (timer > 0 || isResending) return;

        setIsResending(true);
        setTimer(30);
        setOtp(['', '', '', '', '', '']);
        setError('');
        setSuccess(false);

        try {
            await axios.post(`${API_BASE_URL}send-otp`, {
                contact: to,
                messageType
            });
            console.log(`OTP sent to: ${to} | type: ${messageType}`);
        } catch (err) {
            console.error('Error sending OTP:', err.response?.data?.error || err.message);
            setError('Failed to send OTP. Try again later.');
        } finally {
            setIsResending(false);
        }
    };

    return (
        <div className="otp-corporate" onClick={onCancel}>
            <div className="otp-corporate__card" onClick={(e) => e.stopPropagation()}>
                <div className="otp-corporate__header">
                    <div className="otp-corporate__icon">🔐</div>
                    <h2 className="otp-corporate__title">Security Verification</h2>
                    <p className="otp-corporate__subtitle">We've sent a 6-digit code to your registered email address</p>
                </div>

                <div className="otp-corporate__content">
                    <div className="otp-corporate__inputs" onPaste={handlePaste}>
                        {otp.map((digit, index) => (
                            <input
                                key={index}
                                ref={(el) => (inputRefs.current[index] = el)}
                                type="text"
                                maxLength="1"
                                value={digit}
                                onChange={(e) => handleChange(e, index)}
                                onKeyDown={(e) => handleKeyDown(index, e)}
                                className={`otp-corporate__input ${digit ? 'otp-corporate__input--filled' : ''} ${error ? 'otp-corporate__input--error' : ''}`}
                                placeholder="•"
                            />
                        ))}
                    </div>

                    {error && <p className="otp-corporate__error">{error}</p>}
                    {success && <p className="otp-corporate__success">✓ Verification Successful!</p>}

                    <div className="otp-corporate__actions">
                        <button
                            type="button"
                            className="btn-corporate btn-corporate--primary"
                            onClick={handleVerify}
                        >
                            Verify OTP
                        </button>
                    </div>

                    <div className="otp-corporate__footer">
                        <p className="otp-corporate__resend-text">
                            Didn't receive the code?{' '}
                            <button
                                className="otp-corporate__resend-btn"
                                onClick={handleResendOTP}
                                disabled={isResending || timer > 0}
                            >
                                {isResending
                                    ? 'Sending...'
                                    : timer > 0
                                        ? `Resend in ${timer}s`
                                        : 'Resend OTP'}
                            </button>
                        </p>

                        <button
                            type="button"
                            className="btn-corporate btn-corporate--secondary"
                            onClick={onCancel}
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OTP_verification;
// localhost