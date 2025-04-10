/**
 * Notifications system for appointment reminders
 */

// Check if browser supports notifications
const notificationsSupported = 'Notification' in window;

// Notification permission states
let notificationPermission = notificationsSupported ? Notification.permission : 'denied';

// Store for scheduled notification timeouts
const scheduledNotifications = new Map();

/**
 * Request notification permission if not granted
 * @returns {Promise<boolean>} Whether permission is granted
 */
async function requestNotificationPermission() {
  if (!notificationsSupported) {
    console.warn('Notifications are not supported in this browser');
    return false;
  }

  // If permission is already granted
  if (notificationPermission === 'granted') {
    return true;
  }

  // If permission was denied earlier, we can't ask again
  if (notificationPermission === 'denied') {
    console.warn('Notification permission was denied previously');
    return false;
  }

  try {
    // Request permission
    const permission = await Notification.requestPermission();
    notificationPermission = permission;
    return permission === 'granted';
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return false;
  }
}

/**
 * Send a notification
 * @param {string} title - Notification title
 * @param {Object} options - Notification options
 * @returns {Notification|null} The notification object or null
 */
function sendNotification(title, options = {}) {
  if (notificationPermission !== 'granted') {
    console.warn('Cannot show notification: permission not granted');
    return null;
  }

  try {
    // Set default icon if not provided
    if (!options.icon) {
      options.icon = '/favicon.ico'; // Make sure this file exists
    }

    // Create and show notification
    const notification = new Notification(title, options);
    
    // Handle notification click
    notification.onclick = function() {
      window.focus();
      if (options.url) {
        if (window.router) {
          window.router.navigateTo(options.url);
        } else {
          window.location.href = options.url;
        }
      }
      notification.close();
    };

    return notification;
  } catch (error) {
    console.error('Error showing notification:', error);
    return null;
  }
}

/**
 * Notify about today's appointments
 * @param {Array} appointments - Today's appointments
 */
function notifyTodaysAppointments(appointments) {
  if (!appointments || appointments.length === 0) return;

  const pendingCount = appointments.filter(a => a.status === 'pending').length;
  const confirmedCount = appointments.filter(a => a.status === 'confirmed').length;
  const totalCount = appointments.length;

  // Create notification message
  const title = 'Записи на сьогодні';
  const message = `У вас ${totalCount} записів на сьогодні: ${confirmedCount} підтверджено, ${pendingCount} очікують підтвердження.`;

  sendNotification(title, {
    body: message,
    url: '/',
    tag: 'today-appointments', // Prevents duplicate notifications
    requireInteraction: true // Keep notification visible until user dismisses it
  });
}

/**
 * Schedule notification for a confirmed appointment
 * @param {Object} appointment - The appointment object
 */
function scheduleAppointmentReminder(appointment) {
  if (!appointment || appointment.status !== 'confirmed') return;

  // If already scheduled, clear previous timeout
  if (scheduledNotifications.has(appointment._id)) {
    clearTimeout(scheduledNotifications.get(appointment._id));
    scheduledNotifications.delete(appointment._id);
  }

  const now = new Date();
  const appointmentTime = new Date(appointment.time);
  
  // Calculate time until 30 minutes before appointment
  const reminderTime = new Date(appointmentTime);
  reminderTime.setMinutes(reminderTime.getMinutes() - 30);

  // Calculate milliseconds until reminder
  const timeUntilReminder = reminderTime.getTime() - now.getTime();

  // Only schedule if reminder is in the future
  if (timeUntilReminder > 0) {
    // Schedule notification
    const timeout = setTimeout(() => {
      const client = appointment.clientId && typeof appointment.clientId === 'object'
        ? `${appointment.clientId.name} ${appointment.clientId.surName}`
        : 'Клієнт';

      const procedure = appointment.procedureId && typeof appointment.procedureId === 'object'
        ? appointment.procedureId.name
        : 'Процедура';

      const time = formatTime(appointmentTime);

      sendNotification('Нагадування про запис', {
        body: `Запис для ${client} на процедуру "${procedure}" почнеться за 30 хвилин о ${time}.`,
        url: '/',
        tag: `appointment-${appointment._id}`,
        requireInteraction: true
      });

      // Remove from scheduled notifications
      scheduledNotifications.delete(appointment._id);
    }, timeUntilReminder);

    // Store timeout ID for potential cancellation
    scheduledNotifications.set(appointment._id, timeout);
  }
}

/**
 * Schedule reminders for all confirmed appointments
 * @param {Array} appointments - List of appointments
 */
function scheduleAllAppointmentReminders(appointments) {
  if (!appointments) return;

  // Cancel all previous scheduled notifications
  clearAllScheduledReminders();

  // Schedule new notifications for confirmed appointments
  const confirmedAppointments = appointments.filter(a => a.status === 'confirmed');
  confirmedAppointments.forEach(scheduleAppointmentReminder);
}

/**
 * Clear all scheduled reminders
 */
function clearAllScheduledReminders() {
  for (const timeoutId of scheduledNotifications.values()) {
    clearTimeout(timeoutId);
  }
  scheduledNotifications.clear();
}

/**
 * Initialize notifications system
 */
async function initNotifications() {
  const permissionGranted = await requestNotificationPermission();
  if (permissionGranted) {
    console.log('Notification permission granted.');
  } else {
    console.warn('Notification permission not granted. Reminders will not be shown.');
  }
}

/**
 * Helper function to format time (HH:MM)
 * @param {Date} date - Date object
 * @returns {string} Formatted time string
 */
function formatTime(date) {
  return date.toTimeString().substring(0, 5); // Format as HH:MM
}

// Export functions
window.notificationSystem = {
  init: initNotifications,
  requestPermission: requestNotificationPermission,
  notify: sendNotification,
  notifyTodaysAppointments,
  scheduleAppointmentReminder,
  scheduleAllReminders: scheduleAllAppointmentReminders,
  clearAllReminders: clearAllScheduledReminders
};
