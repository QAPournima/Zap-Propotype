import axios from 'axios';

/**
 * Helper function to log activities in the system
 * @param {Object} activity - The activity to log
 * @param {string} activity.title - Title of the activity
 * @param {string} activity.description - Description of the activity
 * @param {string} activity['Request Type'] - Type of request (e.g., 'Jira id', 'Web Link', 'PDF document')
 * @param {string} activity.status - Status of the activity ('Passed', 'Failed', 'In Progress')
 * @param {string} activity['Output Type'] - Type of output (e.g., 'jira ticket', 'PDF', 'Automation Script')
 * @returns {Promise<Object>} The logged activity object
 */
export const logActivity = async (activity) => {
  try {
    // Add current date if not provided
    if (!activity.createdDate) {
      activity.createdDate = new Date().toISOString().split('T')[0];
    }

    // Make POST request to activity logs API
    const response = await axios.post('/api/activity-logs', activity);
    return response.data;
  } catch (error) {
    console.error('Failed to log activity:', error);
    throw error;
  }
};

/**
 * Predefined activity types for consistent logging
 */
export const ActivityTypes = {
  TEST_CASE: {
    'Request Type': 'Jira id',
    'Output Type': 'jira ticket'
  },
  AUTOMATION_SCRIPT: {
    'Request Type': 'Jira id',
    'Output Type': 'Automation Script'
  },
  USER_STORY: {
    'Request Type': 'Web Link',
    'Output Type': 'user storyPDF'
  },
  BUG: {
    'Request Type': 'Jira id',
    'Output Type': 'jira ticket'
  },
  PDF_DOCUMENT: {
    'Request Type': 'PDF document',
    'Output Type': 'jira ticket'
  }
};

/**
 * Helper function to create a standardized activity object
 * @param {string} title - Title of the activity
 * @param {string} description - Description of the activity
 * @param {Object} type - Activity type from ActivityTypes
 * @param {string} status - Status of the activity
 * @returns {Object} Standardized activity object
 */
export const createActivityObject = (title, description, type, status = 'new') => {
  return {
    title,
    description,
    'Request Type': type['Request Type'],
    status,
    'Output Type': type['Output Type']
  };
};

/**
 * Helper function to update an activity log by id
 * @param {number} id - The id of the activity log to update
 * @param {Object} updates - The fields to update
 * @returns {Promise<Object>} The updated activity log object
 */
export const updateActivityLog = async (id, updates) => {
  try {
    const response = await axios.put(`http://localhost:4000/api/activity-logs/${id}`, updates);
    return response.data;
  } catch (error) {
    console.error('Failed to update activity log:', error);
    throw error;
  }
}; 