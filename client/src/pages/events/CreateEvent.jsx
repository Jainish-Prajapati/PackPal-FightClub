import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import axios from 'axios';

const CreateEvent = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const formik = useFormik({
    initialValues: {
      name: '',
      startDate: '',
      endDate: '',
      location: '',
      purpose: '',
    },
    validationSchema: Yup.object({
      name: Yup.string().required('Required'),
      startDate: Yup.date().required('Required'),
      endDate: Yup.date()
        .min(Yup.ref('startDate'), 'End date must be after start date')
        .required('Required'),
      location: Yup.string().required('Required'),
      purpose: Yup.string().required('Required'),
    }),
    onSubmit: async (values) => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await axios.post('/api/events', values, {
          withCredentials: true
        });
        
        if (response.data.success) {
          navigate(`/events/${response.data.data.id}`);
        }
      } catch (err) {
        console.error('Error creating event:', err);
        setError(err.response?.data?.message || 'Failed to create event. Please try again.');
      } finally {
        setIsLoading(false);
      }
    },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Create a New Travel Event</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      <div className="bg-white shadow rounded-lg p-6">
        <form onSubmit={formik.handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Event Name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              value={formik.values.name}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
            {formik.touched.name && formik.errors.name ? (
              <div className="text-red-500 text-sm mt-1">{formik.errors.name}</div>
            ) : null}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">
                Start Date
              </label>
              <input
                id="startDate"
                name="startDate"
                type="date"
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                value={formik.values.startDate}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
              {formik.touched.startDate && formik.errors.startDate ? (
                <div className="text-red-500 text-sm mt-1">{formik.errors.startDate}</div>
              ) : null}
            </div>
            
            <div>
              <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">
                End Date
              </label>
              <input
                id="endDate"
                name="endDate"
                type="date"
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                value={formik.values.endDate}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
              {formik.touched.endDate && formik.errors.endDate ? (
                <div className="text-red-500 text-sm mt-1">{formik.errors.endDate}</div>
              ) : null}
            </div>
          </div>
          
          <div>
            <label htmlFor="location" className="block text-sm font-medium text-gray-700">
              Location
            </label>
            <input
              id="location"
              name="location"
              type="text"
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              value={formik.values.location}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
            {formik.touched.location && formik.errors.location ? (
              <div className="text-red-500 text-sm mt-1">{formik.errors.location}</div>
            ) : null}
          </div>
          
          <div>
            <label htmlFor="purpose" className="block text-sm font-medium text-gray-700">
              Purpose
            </label>
            <textarea
              id="purpose"
              name="purpose"
              rows={4}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              value={formik.values.purpose}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
            {formik.touched.purpose && formik.errors.purpose ? (
              <div className="text-red-500 text-sm mt-1">{formik.errors.purpose}</div>
            ) : null}
          </div>
          
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="mr-3 px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              {isLoading ? 'Creating...' : 'Create Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateEvent; 