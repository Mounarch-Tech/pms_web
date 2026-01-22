// components/RegistrationPage/RegistrationPage.jsx
import React, { useState } from 'react';
import './RegistrationPage.css'; // Import your CSS file
import { useNavigate } from 'react-router-dom';

const RegistrationPage = () => {
    const navigate = useNavigate();

    const goToLogInPage = () => {
        navigate('/SignIn'); // Navigate to login
    };

    const resetFormData = {
        first_name: '',
        middle_name: '',
        last_name: '',
        mobile_no: '',
        mobile_sim_country_code: '+91',
        user_type: '',
        gender: '',
        user_email: '',
    };

    const [formData, setFormData] = useState(resetFormData);

    const handleSubmit = (e) => {
        e.preventDefault();

        // Add validations
        if (!formData.first_name || !formData.last_name || !formData.user_email) {
            alert("Please fill all required fields");
            return;
        }

        if (!/^[a-zA-Z]+$/.test(formData.first_name)) {
            alert("First Name can only contain letters and no spaces");
            return;
        }

        if (formData.middle_name && !/^[a-zA-Z]+$/.test(formData.middle_name)) {
            alert("Middle Name can only contain letters and no spaces");
            return;
        }

        if (!/^[a-zA-Z]+$/.test(formData.last_name)) {
            alert("Last Name can only contain letters and no spaces");
            return;
        }

        if (!/^\d{10}$/.test(formData.mobile_no)) {
            alert("Mobile No must be exactly 10 digits");
            return;
        }

        if (!/\S+@\S+\.\S+/.test(formData.user_email)) {
            alert("Invalid email address");
            return;
        }

        console.log('Registration attempt with:', formData);
        // Here you would call your API / registration service
    };

    return (
        <div className="registration-corporate">
            <div className="registration-corporate__container">

                <div className="registration-corporate__header">
                    <div className="registration-corporate__icon">🚢👨‍💼</div>
                    <h1 className="registration-corporate__title">Factory Staff & Staff Registration</h1>
                    <p className="registration-corporate__subtitle">Register for facility and office operations access</p>
                </div>

                <form className="registration-corporate__form" onSubmit={handleSubmit}>

                    <div className="registration-corporate__grid">
                        {/* First Name */}
                        <div className="form-field-corporate">
                            <label className="form-field-corporate__label">
                                First Name <span className="form-field-corporate__required">*</span>
                            </label>
                            <input
                                type="text"
                                className="form-field-corporate__input"
                                placeholder="Enter first name"
                                required
                                value={formData.first_name}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    if (/\s/.test(val)) {
                                        alert("Spaces are not allowed in First Name");
                                        return;
                                    }
                                    if (/[^a-zA-Z]/.test(val)) {
                                        alert("Only letters are allowed");
                                        return;
                                    }
                                    setFormData({ ...formData, first_name: val });
                                }}
                            />
                        </div>

                        {/* Middle Name */}
                        <div className="form-field-corporate">
                            <label className="form-field-corporate__label">Middle Name</label>
                            <input
                                type="text"
                                className="form-field-corporate__input"
                                placeholder="Enter middle name"
                                value={formData.middle_name}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    if (/\s/.test(val)) {
                                        alert("Spaces are not allowed in Middle Name");
                                        return;
                                    }
                                    if (/[^a-zA-Z]/.test(val)) {
                                        alert("Only letters are allowed");
                                        return;
                                    }
                                    setFormData({ ...formData, middle_name: val });
                                }}
                            />
                        </div>

                        {/* Last Name */}
                        <div className="form-field-corporate">
                            <label className="form-field-corporate__label">
                                Last Name <span className="form-field-corporate__required">*</span>
                            </label>
                            <input
                                type="text"
                                className="form-field-corporate__input"
                                placeholder="Enter last name"
                                required
                                value={formData.last_name}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    if (/\s/.test(val)) {
                                        alert("Spaces are not allowed in Last Name");
                                        return;
                                    }
                                    if (/[^a-zA-Z]/.test(val)) {
                                        alert("Only letters are allowed");
                                        return;
                                    }
                                    setFormData({ ...formData, last_name: val });
                                }}
                            />
                        </div>
                    </div>

                    {/* Mobile Number */}
                    <div className="form-field-corporate-group">
                        <div className="form-field-corporate-group__inline">
                            <div className="form-field-corporate form-field-corporate--country-code">
                                <label className="form-field-corporate__label">
                                    Country Code <span className="form-field-corporate__required">*</span>
                                </label>
                                <select
                                    className="form-field-corporate__select"
                                    required
                                    value={formData.mobile_sim_country_code}
                                    onChange={(e) => setFormData({ ...formData, mobile_sim_country_code: e.target.value })}
                                >
                                    <option value="+91">🇮🇳 +91</option>
                                    <option value="+1">🇺🇸 +1</option>
                                    <option value="+44">🇬🇧 +44</option>
                                </select>
                            </div>
                            <div className="form-field-corporate">
                                <label className="form-field-corporate__label">
                                    Mobile No <span className="form-field-corporate__required">*</span>
                                </label>
                                <input
                                    type="tel"
                                    className="form-field-corporate__input"
                                    placeholder="10-digit number"
                                    maxLength="10"
                                    required
                                    value={formData.mobile_no}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        if (!/^\d*$/.test(val)) {
                                            alert("Only digits are allowed in Mobile No");
                                            return;
                                        }
                                        setFormData({ ...formData, mobile_no: val });
                                    }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* User Type */}
                    <div className="form-field-corporate">
                        <label className="form-field-corporate__label">
                            Assignment Type <span className="form-field-corporate__required">*</span>
                        </label>
                        <select
                            className="form-field-corporate__select"
                            required
                            value={formData.user_type}
                            onChange={(e) => setFormData({ ...formData, user_type: e.target.value })}
                        >
                            <option value="">Select assignment type</option>
                            <option value="1">Location Factory Staff Member</option>
                            <option value="2">Office Staff</option>
                        </select>
                    </div>

                    {/* Gender */}
                    <div className="form-field-corporate">
                        <label className="form-field-corporate__label">
                            Gender <span className="form-field-corporate__required">*</span>
                        </label>
                        <select
                            className="form-field-corporate__select"
                            required
                            value={formData.gender}
                            onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                        >
                            <option value="">Select gender</option>
                            <option value="1">Male</option>
                            <option value="2">Female</option>
                            <option value="3">Other</option>
                        </select>
                    </div>

                    {/* Email */}
                    <div className="form-field-corporate">
                        <label className="form-field-corporate__label">
                            Email <span className="form-field-corporate__required">*</span>
                        </label>
                        <input
                            type="email"
                            className="form-field-corporate__input"
                            placeholder="Enter email address"
                            value={formData.user_email}
                            onChange={(e) => setFormData({ ...formData, user_email: e.target.value })}
                            required
                        />
                    </div>

                    {/* Actions */}
                    <div className="registration-corporate__actions">
                        <button type="button" className="btn-corporate btn-corporate--secondary" onClick={() => setFormData(resetFormData)}>
                            Clear Form
                        </button>
                        <button type="submit" className="btn-corporate btn-corporate--primary">Register User</button>
                    </div>
                </form>

                <div className="registration-corporate__footer">
                    <p className="registration-corporate__footer-text">
                        Already have an account?{' '}
                        <button type="button" onClick={goToLogInPage} className="registration-corporate__login-link">
                            Sign In
                        </button>
                    </p>
                </div>

            </div>
        </div>
    );
};

export default RegistrationPage;