import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  HiOutlineMail, 
  HiOutlineLockClosed, 
  HiOutlineUser,
  HiOutlineEye, 
  HiOutlineEyeOff,
  HiOutlineShieldCheck,
  HiOutlineArrowRight,
  HiOutlineCheckCircle,
  HiOutlineXCircle
} from 'react-icons/hi';

const Register = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    hasUpper: false,
    hasLower: false,
    hasNumber: false,
    hasSpecial: false,
    minLength: false
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Clear error for this field
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }

    // Check password strength if password field changes
    if (name === 'password') {
      checkPasswordStrength(value);
    }
  };

  const checkPasswordStrength = (password) => {
    setPasswordStrength({
      score: calculatePasswordScore(password),
      hasUpper: /[A-Z]/.test(password),
      hasLower: /[a-z]/.test(password),
      hasNumber: /\d/.test(password),
      hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(password),
      minLength: password.length >= 8
    });
  };

  const calculatePasswordScore = (password) => {
    let score = 0;
    if (password.length >= 8) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[a-z]/.test(password)) score += 1;
    if (/\d/.test(password)) score += 1;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 1;
    return score;
  };

  const getPasswordStrengthColor = () => {
    const score = passwordStrength.score;
    if (score <= 2) return 'bg-error';
    if (score <= 3) return 'bg-warning';
    if (score <= 4) return 'bg-primestone-400';
    return 'bg-success';
  };

  const getPasswordStrengthText = () => {
    const score = passwordStrength.score;
    if (score <= 2) return 'Weak';
    if (score <= 3) return 'Fair';
    if (score <= 4) return 'Good';
    return 'Strong';
  };

  const validateForm = () => {
    const newErrors = {};
    
    // Username validation
    if (!formData.username) {
      newErrors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      newErrors.username = 'Username can only contain letters, numbers, and underscores';
    }

    // Email validation
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else {
      const strength = passwordStrength;
      if (!strength.minLength) {
        newErrors.password = 'Password must be at least 8 characters';
      } else if (!strength.hasUpper) {
        newErrors.password = 'Password must contain at least one uppercase letter';
      } else if (!strength.hasLower) {
        newErrors.password = 'Password must contain at least one lowercase letter';
      } else if (!strength.hasNumber) {
        newErrors.password = 'Password must contain at least one number';
      } else if (!strength.hasSpecial) {
        newErrors.password = 'Password must contain at least one special character';
      }
    }

    // Confirm password validation
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = validateForm();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    const result = await register({
      username: formData.username,
      email: formData.email,
      password: formData.password
    });
    setLoading(false);

    if (result.success) {
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primestone-50 to-white flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header with Logo */}
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-20 h-20 bg-gradient-to-br from-[#FFD700] to-[#FFA500] rounded-full flex items-center justify-center shadow-lg border-2 border-[#FFD700] relative overflow-hidden animate-float">
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white to-transparent opacity-30 transform rotate-45 animate-shine"></div>
              <span className="text-primestone-800 font-bold text-3xl relative z-10">P</span>
            </div>
          </div>
          <h2 className="text-3xl font-display font-bold text-primestone-900">
            Create Account
          </h2>
          <p className="mt-2 text-primestone-400 font-medium">
            Secure • Transparent • Profitable
          </p>
        </div>

        {/* Registration Form */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            {/* Username Field */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-neutral-700 mb-2">
                Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <HiOutlineUser className="h-5 w-5 text-neutral-400" />
                </div>
                <input
                  id="username"
                  name="username"
                  type="text"
                  value={formData.username}
                  onChange={handleChange}
                  className={`block w-full pl-10 pr-3 py-3 border ${
                    errors.username ? 'border-error' : 'border-neutral-300'
                  } rounded-lg focus:outline-none focus:ring-2 focus:ring-primestone-500 focus:border-transparent transition-colors duration-200`}
                  placeholder="johndoe"
                />
              </div>
              {errors.username && (
                <p className="mt-1 text-sm text-error">{errors.username}</p>
              )}
            </div>

            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-neutral-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <HiOutlineMail className="h-5 w-5 text-neutral-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`block w-full pl-10 pr-3 py-3 border ${
                    errors.email ? 'border-error' : 'border-neutral-300'
                  } rounded-lg focus:outline-none focus:ring-2 focus:ring-primestone-500 focus:border-transparent transition-colors duration-200`}
                  placeholder="you@example.com"
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-error">{errors.email}</p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-neutral-700 mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <HiOutlineLockClosed className="h-5 w-5 text-neutral-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleChange}
                  className={`block w-full pl-10 pr-10 py-3 border ${
                    errors.password ? 'border-error' : 'border-neutral-300'
                  } rounded-lg focus:outline-none focus:ring-2 focus:ring-primestone-500 focus:border-transparent transition-colors duration-200`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? (
                    <HiOutlineEyeOff className="h-5 w-5 text-neutral-400 hover:text-primestone-600 transition-colors" />
                  ) : (
                    <HiOutlineEye className="h-5 w-5 text-neutral-400 hover:text-primestone-600 transition-colors" />
                  )}
                </button>
              </div>

              {/* Password Strength Indicator */}
              {formData.password && (
                <div className="mt-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-neutral-500">Password strength:</span>
                    <span className={`text-xs font-medium ${
                      passwordStrength.score <= 2 ? 'text-error' :
                      passwordStrength.score <= 3 ? 'text-warning' :
                      passwordStrength.score <= 4 ? 'text-primestone-400' :
                      'text-success'
                    }`}>
                      {getPasswordStrengthText()}
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-neutral-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${getPasswordStrengthColor()} transition-all duration-300`}
                      style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                    ></div>
                  </div>
                  
                  {/* Password Requirements */}
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <div className="flex items-center space-x-1">
                      {passwordStrength.minLength ? (
                        <HiOutlineCheckCircle className="h-3 w-3 text-success" />
                      ) : (
                        <HiOutlineXCircle className="h-3 w-3 text-error" />
                      )}
                      <span className="text-xs text-neutral-500">8+ characters</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      {passwordStrength.hasUpper ? (
                        <HiOutlineCheckCircle className="h-3 w-3 text-success" />
                      ) : (
                        <HiOutlineXCircle className="h-3 w-3 text-error" />
                      )}
                      <span className="text-xs text-neutral-500">Uppercase</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      {passwordStrength.hasLower ? (
                        <HiOutlineCheckCircle className="h-3 w-3 text-success" />
                      ) : (
                        <HiOutlineXCircle className="h-3 w-3 text-error" />
                      )}
                      <span className="text-xs text-neutral-500">Lowercase</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      {passwordStrength.hasNumber ? (
                        <HiOutlineCheckCircle className="h-3 w-3 text-success" />
                      ) : (
                        <HiOutlineXCircle className="h-3 w-3 text-error" />
                      )}
                      <span className="text-xs text-neutral-500">Number</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      {passwordStrength.hasSpecial ? (
                        <HiOutlineCheckCircle className="h-3 w-3 text-success" />
                      ) : (
                        <HiOutlineXCircle className="h-3 w-3 text-error" />
                      )}
                      <span className="text-xs text-neutral-500">Special char</span>
                    </div>
                  </div>
                </div>
              )}
              {errors.password && (
                <p className="mt-1 text-sm text-error">{errors.password}</p>
              )}
            </div>

            {/* Confirm Password Field */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-neutral-700 mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <HiOutlineLockClosed className="h-5 w-5 text-neutral-400" />
                </div>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={`block w-full pl-10 pr-10 py-3 border ${
                    errors.confirmPassword ? 'border-error' : 'border-neutral-300'
                  } rounded-lg focus:outline-none focus:ring-2 focus:ring-primestone-500 focus:border-transparent transition-colors duration-200`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showConfirmPassword ? (
                    <HiOutlineEyeOff className="h-5 w-5 text-neutral-400 hover:text-primestone-600 transition-colors" />
                  ) : (
                    <HiOutlineEye className="h-5 w-5 text-neutral-400 hover:text-primestone-600 transition-colors" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-error">{errors.confirmPassword}</p>
              )}
            </div>
          </div>

          {/* Terms and Conditions */}
          <div className="flex items-start">
            <div className="flex items-center h-5">
              <input
                id="terms"
                name="terms"
                type="checkbox"
                required
                className="h-4 w-4 text-primestone-600 focus:ring-primestone-500 border-neutral-300 rounded transition-colors"
              />
            </div>
            <div className="ml-3 text-sm">
              <label htmlFor="terms" className="text-neutral-600">
                I agree to the{' '}
                <a href="#" className="font-medium text-primestone-600 hover:text-primestone-500 transition-colors">
                  Terms of Service
                </a>{' '}
                and{' '}
                <a href="#" className="font-medium text-primestone-600 hover:text-primestone-500 transition-colors">
                  Privacy Policy
                </a>
              </label>
            </div>
          </div>

          {/* Submit Button */}
          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-primestone-600 to-primestone-700 hover:from-primestone-700 hover:to-primestone-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primestone-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-[1.02]"
            >
              {loading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating account...
                </span>
              ) : (
                <span className="flex items-center justify-center">
                  Create Account <HiOutlineArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </span>
              )}
            </button>
          </div>

          {/* Login Link */}
          <div className="text-center">
            <p className="text-sm text-neutral-600">
              Already have an account?{' '}
              <Link to="/login" className="font-medium text-primestone-600 hover:text-primestone-500 transition-colors">
                Sign in
              </Link>
            </p>
          </div>

          {/* Security Note */}
          <div className="flex items-center justify-center space-x-2 text-xs text-neutral-500 pt-4">
            <HiOutlineShieldCheck className="h-4 w-4 text-primestone-400" />
            <span>Your information is protected by 256-bit encryption</span>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;
