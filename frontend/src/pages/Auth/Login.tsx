import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { loginUser, clearError } from '../../store/slices/authSlice'
import { AppDispatch, RootState } from '../../store'

const Login: React.FC = () => {
  const navigate = useNavigate()
  const dispatch = useDispatch<AppDispatch>()
  const { loading, error, isAuthenticated } = useSelector((state: RootState) => state.auth)

  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })

  const [formErrors, setFormErrors] = useState({
    email: '',
    password: ''
  })

  useEffect(() => {
    // Clear any existing errors when component mounts
    dispatch(clearError())
  }, [dispatch])

  useEffect(() => {
    // Redirect if already authenticated
    if (isAuthenticated) {
      navigate('/dashboard')
    }
  }, [isAuthenticated, navigate])

  const validateForm = (): boolean => {
    const errors = { email: '', password: '' }
    let isValid = true

    // Email validation
    if (!formData.email) {
      errors.email = 'Email is required'
      isValid = false
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Invalid email format'
      isValid = false
    }

    // Password validation
    if (!formData.password) {
      errors.password = 'Password is required'
      isValid = false
    } else if (formData.password.length < 8) {
      errors.password = 'Password must be at least 8 characters'
      isValid = false
    }

    setFormErrors(errors)
    return isValid
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    try {
      await dispatch(loginUser(formData)).unwrap()
      // Navigation will be handled by useEffect when isAuthenticated changes
    } catch (err) {
      // Error is handled by Redux state
      console.error('Login failed:', err)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    
    // Clear field-specific error when user starts typing
    if (formErrors[name as keyof typeof formErrors]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
    
    // Clear general error when user modifies form
    if (error) {
      dispatch(clearError())
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="max-w-md w-full space-y-8 p-8">
        <div>
          <h1 className="text-center text-4xl font-bold text-white mb-2">
            GEO Platform
          </h1>
          <h2 className="text-center text-xl text-purple-300">
            AI Search Engine Optimization
          </h2>
          <p className="mt-4 text-center text-slate-400">
            Sign in to your account
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="bg-slate-800/50 backdrop-blur-lg rounded-xl p-8 border border-purple-500/20 shadow-2xl">
            {/* Email Field */}
            <div className="mb-6">
              <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-2">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={handleChange}
                className={`
                  appearance-none relative block w-full px-4 py-3 
                  bg-slate-700/50 border rounded-lg
                  text-white placeholder-slate-400
                  focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent
                  transition-all duration-200
                  ${formErrors.email ? 'border-red-500' : 'border-slate-600'}
                `}
                placeholder="you@example.com"
              />
              {formErrors.email && (
                <p className="mt-2 text-sm text-red-400">{formErrors.email}</p>
              )}
            </div>

            {/* Password Field */}
            <div className="mb-6">
              <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-2">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={formData.password}
                onChange={handleChange}
                className={`
                  appearance-none relative block w-full px-4 py-3
                  bg-slate-700/50 border rounded-lg
                  text-white placeholder-slate-400
                  focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent
                  transition-all duration-200
                  ${formErrors.password ? 'border-red-500' : 'border-slate-600'}
                `}
                placeholder="Enter your password"
              />
              {formErrors.password && (
                <p className="mt-2 text-sm text-red-400">{formErrors.password}</p>
              )}
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-slate-600 rounded bg-slate-700"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-slate-300">
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <a href="#" className="font-medium text-purple-400 hover:text-purple-300 transition-colors">
                  Forgot password?
                </a>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/50 rounded-lg">
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className={`
                w-full flex justify-center py-3 px-4
                border border-transparent text-sm font-medium rounded-lg
                text-white bg-gradient-to-r from-purple-600 to-pink-600
                hover:from-purple-700 hover:to-pink-700
                focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500
                transition-all duration-200
                ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-lg'}
              `}
            >
              {loading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Signing in...
                </span>
              ) : (
                'Sign In'
              )}
            </button>

            {/* Sign Up Link */}
            <div className="mt-6 text-center">
              <p className="text-sm text-slate-400">
                Don't have an account?{' '}
                <Link to="/register" className="font-medium text-purple-400 hover:text-purple-300 transition-colors">
                  Sign up now
                </Link>
              </p>
            </div>
          </div>
        </form>

        {/* Demo Account Info */}
        <div className="mt-6 p-4 bg-slate-800/30 rounded-lg border border-slate-700">
          <p className="text-xs text-slate-400 text-center">
            <span className="font-semibold">Demo Account:</span><br />
            Email: demo@example.com | Password: Demo123456
          </p>
        </div>
      </div>
    </div>
  )
}

export default Login