import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import axios from 'axios';

const Profile = () => {
  const { currentUser, logout } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [activeTab, setActiveTab] = useState('profile');

  const profileFormik = useFormik({
    initialValues: {
      firstName: currentUser?.firstName || '',
      lastName: currentUser?.lastName || '',
      email: currentUser?.email || '',
    },
    validationSchema: Yup.object({
      firstName: Yup.string().required('Required'),
      lastName: Yup.string().required('Required'),
      email: Yup.string().email('Invalid email address').required('Required'),
    }),
    onSubmit: async (values) => {
      setIsLoading(true);
      setError(null);
      setSuccess(null);

      try {
        const response = await axios.put('/api/auth/profile', values, {
          withCredentials: true
        });
        
        if (response.data.success) {
          setSuccess('Profile updated successfully!');
        }
      } catch (err) {
        console.error('Error updating profile:', err);
        setError(err.response?.data?.message || 'Failed to update profile. Please try again.');
      } finally {
        setIsLoading(false);
      }
    },
  });

  const passwordFormik = useFormik({
    initialValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
    validationSchema: Yup.object({
      currentPassword: Yup.string().required('Required'),
      newPassword: Yup.string()
        .min(6, 'Must be at least 6 characters')
        .required('Required'),
      confirmPassword: Yup.string()
        .oneOf([Yup.ref('newPassword'), null], 'Passwords must match')
        .required('Required'),
    }),
    onSubmit: async (values) => {
      setIsLoading(true);
      setError(null);
      setSuccess(null);

      try {
        const response = await axios.put('/api/auth/password', {
          currentPassword: values.currentPassword,
          newPassword: values.newPassword
        }, {
          withCredentials: true
        });
        
        if (response.data.success) {
          setSuccess('Password updated successfully!');
          passwordFormik.resetForm();
        }
      } catch (err) {
        console.error('Error updating password:', err);
        setError(err.response?.data?.message || 'Failed to update password. Please try again.');
      } finally {
        setIsLoading(false);
      }
    },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Your Profile</h1>
      
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab('profile')}
              className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                activeTab === 'profile'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Profile Information
            </button>
            <button
              onClick={() => setActiveTab('password')}
              className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                activeTab === 'password'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Change Password
            </button>
          </nav>
        </div>
        
        <div className="p-6">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}
          
          {success && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
              {success}
            </div>
          )}
          
          {activeTab === 'profile' ? (
            <form onSubmit={profileFormik.handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                    First Name
                  </label>
                  <input
                    id="firstName"
                    name="firstName"
                    type="text"
                    onChange={profileFormik.handleChange}
                    onBlur={profileFormik.handleBlur}
                    value={profileFormik.values.firstName}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  {profileFormik.touched.firstName && profileFormik.errors.firstName ? (
                    <div className="text-red-500 text-sm mt-1">{profileFormik.errors.firstName}</div>
                  ) : null}
                </div>
                
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                    Last Name
                  </label>
                  <input
                    id="lastName"
                    name="lastName"
                    type="text"
                    onChange={profileFormik.handleChange}
                    onBlur={profileFormik.handleBlur}
                    value={profileFormik.values.lastName}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  {profileFormik.touched.lastName && profileFormik.errors.lastName ? (
                    <div className="text-red-500 text-sm mt-1">{profileFormik.errors.lastName}</div>
                  ) : null}
                </div>
              </div>
              
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  onChange={profileFormik.handleChange}
                  onBlur={profileFormik.handleBlur}
                  value={profileFormik.values.email}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
                {profileFormik.touched.email && profileFormik.errors.email ? (
                  <div className="text-red-500 text-sm mt-1">{profileFormik.errors.email}</div>
                ) : null}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Role
                </label>
                <div className="mt-1 block w-full py-2 px-3 bg-gray-50 border border-gray-300 rounded-md">
                  <span className="capitalize">{currentUser?.role || 'member'}</span>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  Your role determines what actions you can perform in events.
                </p>
              </div>
              
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  {isLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={passwordFormik.handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700">
                  Current Password
                </label>
                <input
                  id="currentPassword"
                  name="currentPassword"
                  type="password"
                  onChange={passwordFormik.handleChange}
                  onBlur={passwordFormik.handleBlur}
                  value={passwordFormik.values.currentPassword}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
                {passwordFormik.touched.currentPassword && passwordFormik.errors.currentPassword ? (
                  <div className="text-red-500 text-sm mt-1">{passwordFormik.errors.currentPassword}</div>
                ) : null}
              </div>
              
              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
                  New Password
                </label>
                <input
                  id="newPassword"
                  name="newPassword"
                  type="password"
                  onChange={passwordFormik.handleChange}
                  onBlur={passwordFormik.handleBlur}
                  value={passwordFormik.values.newPassword}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
                {passwordFormik.touched.newPassword && passwordFormik.errors.newPassword ? (
                  <div className="text-red-500 text-sm mt-1">{passwordFormik.errors.newPassword}</div>
                ) : null}
              </div>
              
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  onChange={passwordFormik.handleChange}
                  onBlur={passwordFormik.handleBlur}
                  value={passwordFormik.values.confirmPassword}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
                {passwordFormik.touched.confirmPassword && passwordFormik.errors.confirmPassword ? (
                  <div className="text-red-500 text-sm mt-1">{passwordFormik.errors.confirmPassword}</div>
                ) : null}
              </div>
              
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  {isLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile; 