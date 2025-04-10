document.addEventListener('DOMContentLoaded', () => {
  // Only initialize if this page is being shown directly (not via router)
  if (!window.router) {
    initAppointments();
  }
});

// Initialize function for the appointments page
function initAppointments() {
  // DOM Elements
  const appointmentsLoader = document.getElementById('appointments-loader');
  const appointmentModal = document.getElementById('appointment-modal');
  const appointmentForm = document.getElementById('appointment-form');
  const modalTitle = document.getElementById('modal-title');
  const statusFilter = document.getElementById('status-filter');
  const dateFilter = document.getElementById('date-filter');
  const clearFiltersBtn = document.getElementById('clear-filters');
  const clientSelect = document.getElementById('client');
  const procedureSelect = document.getElementById('procedure');
  const priceInput = document.getElementById('price');
  const appointmentTimeInput = document.getElementById('appointment-time');
  const appointmentDateInput = document.getElementById('appointment-date');
  const availableTimesContainer = document.getElementById('available-times');
  const exportScheduleBtn = document.getElementById('export-schedule-btn');
  
  // Appointment detail modal elements
  const appointmentDetailModal = document.getElementById('appointment-detail-modal');
  const appointmentDetails = document.getElementById('appointment-details');
  const editAppointmentBtn = document.getElementById('edit-appointment-btn');
  const changeStatusBtn = document.getElementById('change-status-btn');
  const cancelAppointmentBtn = document.getElementById('cancel-appointment-btn');
  
  // View elements
  const weeklyViewBtn = document.getElementById('weekly-view-btn');
  const monthlyViewBtn = document.getElementById('monthly-view-btn');
  const manageScheduleBtn = document.getElementById('manage-schedule-btn');
  const weeklyViewContainer = document.getElementById('weekly-view-container');
  const monthlyViewContainer = document.getElementById('monthly-view-container');
  const prevWeekBtn = document.getElementById('prev-week-btn');
  const nextWeekBtn = document.getElementById('next-week-btn');
  const currentWeekRange = document.getElementById('current-week-range');
  const daysContainer = document.getElementById('days-container');
  const prevMonthBtn = document.getElementById('prev-month-btn');
  const nextMonthBtn = document.getElementById('next-month-btn');
  const currentMonthYear = document.getElementById('current-month-year');
  const calendarContainer = document.getElementById('calendar-container');
  
  // Schedule elements
  const scheduleModal = document.getElementById('schedule-modal');
  const scheduleForm = document.getElementById('schedule-form');
  const scheduleDaysContainer = document.getElementById('schedule-days-container');
  const scheduleDay = document.getElementById('schedule-day');
  const isWeekend = document.getElementById('is-weekend');
  const timeSlotsContainer = document.getElementById('time-slots-container');
  
  // Global variables
  let currentAppointments = [];
  let clients = [];
  let procedures = [];
  let schedules = [];
  let currentAppointmentId = null;
  let currentDate = new Date();
  let currentView = 'weekly'; // Default view
  let selectedDate = new Date();
  let selectedAppointment = null;
  
  // API endpoints
  const API = {
    appointments: '/api/appointments',
    clients: '/api/clients',
    procedures: '/api/procedures',
    schedules: '/api/schedules'
  };
  
  // Initialize the page
  init();
  
  // Initialize function
  async function init() {
    try {
      // Check if we're on the appointments page
      if (!appointmentsLoader) {
        console.log('Не на сторінці записів, пропускаємо ініціалізацію записів');
        return;
      }
      
      await Promise.all([
        loadAppointments(),
        loadClients(),
        loadProcedures(),
        loadSchedules()
      ]);
      
      setupEventListeners();
      renderWeeklyView(currentDate);
      updateMonthCalendar(currentDate);
      
      // Initialize notifications system
      if (window.notificationSystem) {
        window.notificationSystem.init();
        checkForTodaysAppointments();
      }
      
      // Check URL parameters for pre-selected client or procedure
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('client')) {
        const clientId = urlParams.get('client');
        if (clientSelect) clientSelect.value = clientId;
      }
      if (urlParams.get('procedure')) {
        const procedureId = urlParams.get('procedure');
        if (procedureSelect) {
          procedureSelect.value = procedureId;
          
          // Auto-fill price if procedure is selected
          const selectedOption = procedureSelect.options[procedureSelect.selectedIndex];
          if (selectedOption && selectedOption.dataset.price && priceInput) {
            priceInput.value = selectedOption.dataset.price;
          }
        }
      }
    } catch (error) {
      console.error('Помилка ініціалізації:', error);
      showMessage('error', 'Не вдалося ініціалізувати додаток. Будь ласка, спробуйте пізніше.');
    }
  }
  
  // Load appointments from API
  async function loadAppointments(filters = {}) {
    showLoader(appointmentsLoader);
    try {
      let url = API.appointments;
      
      // Add query parameters for filters
      if (Object.keys(filters).length > 0) {
        const params = new URLSearchParams();
        
        if (filters.status && filters.status !== 'all') {
          params.append('status', filters.status);
        }
        
        if (filters.date) {
          params.append('date', filters.date);
        }
        
        url += `?${params.toString()}`;
      }
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const data = await response.json();
      currentAppointments = data;
      
      // Schedule notification reminders for confirmed appointments
      if (window.notificationSystem) {
        window.notificationSystem.scheduleAllReminders(currentAppointments);
      }
      
      // Update views with the new data
      if (currentView === 'weekly') {
        renderWeeklyView(selectedDate);
      } else {
        updateMonthCalendar(selectedDate);
      }
    } catch (error) {
      console.error('Помилка завантаження записів:', error);
      showMessage('error', 'Не вдалося завантажити записи. Будь ласка, спробуйте пізніше.');
    } finally {
      hideLoader(appointmentsLoader);
    }
  }
  
  // Load schedules from API
  async function loadSchedules() {
    try {
      const response = await fetch(API.schedules);
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      schedules = await response.json();
      return schedules;
    } catch (error) {
      console.error('Помилка завантаження розкладу:', error);
      showMessage('error', 'Не вдалося завантажити розклад. Будь ласка, спробуйте пізніше.');
      return [];
    }
  }
  
  // Load clients from API
  async function loadClients() {
    try {
      const response = await fetch(API.clients);
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      clients = await response.json();
      populateClientSelect();
    } catch (error) {
      console.error('Помилка завантаження клієнтів:', error);
      showMessage('error', 'Не вдалося завантажити клієнтів. Будь ласка, спробуйте пізніше.');
    }
  }
  
  // Load procedures from API
  async function loadProcedures() {
    try {
      const response = await fetch(API.procedures);
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      procedures = await response.json();
      populateProcedureSelect();
    } catch (error) {
      console.error('Помилка завантаження процедур:', error);
      showMessage('error', 'Не вдалося завантажити процедури. Будь ласка, спробуйте пізніше.');
    }
  }
  
  // Populate client select options
  function populateClientSelect() {
    if (!clientSelect) return;
    
    clientSelect.innerHTML = '<option value="">Оберіть клієнта</option>';
    clients.forEach(client => {
      const option = document.createElement('option');
      option.value = client._id;
      option.textContent = `${client.name} ${client.surName}`;
      clientSelect.appendChild(option);
    });
  }
  
  // Populate procedure select options
  function populateProcedureSelect() {
    if (!procedureSelect) return;
    
    procedureSelect.innerHTML = '<option value="">Оберіть процедуру</option>';
    procedures.forEach(procedure => {
      const option = document.createElement('option');
      option.value = procedure._id;
      option.textContent = `${procedure.name} - ${procedure.price} грн`;
      option.dataset.price = procedure.price;
      procedureSelect.appendChild(option);
    });
  }
  
  // Set up event listeners
  function setupEventListeners() {
    // Form submission
    if (appointmentForm) {
      appointmentForm.addEventListener('submit', handleFormSubmit);
    }
    
    // Date input change to update available times
    if (appointmentDateInput) {
      appointmentDateInput.addEventListener('change', populateAvailableTimes);
    }
    
    // Filter changes
    if (statusFilter) {
      statusFilter.addEventListener('change', applyFilters);
    }
    
    if (dateFilter) {
      dateFilter.addEventListener('change', applyFilters);
    }
    
    if (clearFiltersBtn) {
      clearFiltersBtn.addEventListener('click', clearFilters);
    }
    
    // Auto-fill price when procedure changes
    if (procedureSelect && priceInput) {
      procedureSelect.addEventListener('change', () => {
        const selectedOption = procedureSelect.options[procedureSelect.selectedIndex];
        if (selectedOption && selectedOption.dataset.price) {
          priceInput.value = selectedOption.dataset.price;
        } else {
          priceInput.value = '';
        }
      });
    }
    
    // View switching
    if (weeklyViewBtn) {
      weeklyViewBtn.addEventListener('click', () => switchView('weekly'));
    }
    
    if (monthlyViewBtn) {
      monthlyViewBtn.addEventListener('click', () => switchView('monthly'));
    }
    
    // Weekly navigation
    if (prevWeekBtn) {
      prevWeekBtn.addEventListener('click', () => navigateWeek(-1));
    }
    
    if (nextWeekBtn) {
      nextWeekBtn.addEventListener('click', () => navigateWeek(1));
    }
    
    // Monthly navigation
    if (prevMonthBtn) {
      prevMonthBtn.addEventListener('click', () => navigateMonth(-1));
    }
    
    if (nextMonthBtn) {
      nextMonthBtn.addEventListener('click', () => navigateMonth(1));
    }
    
    // Schedule management
    if (manageScheduleBtn) {
      manageScheduleBtn.addEventListener('click', () => {
        populateScheduleForm();
        openModal(scheduleModal);
      });
    }
    
    if (scheduleForm) {
      scheduleForm.addEventListener('submit', saveSchedule);
    }
    
    if (isWeekend) {
      isWeekend.addEventListener('change', toggleTimeSlots);
    }
    
    // Detail view buttons
    if (editAppointmentBtn) {
      editAppointmentBtn.addEventListener('click', editSelectedAppointment);
    }
    
    if (changeStatusBtn) {
      changeStatusBtn.addEventListener('click', showStatusChangeOptions);
    }
    
    if (cancelAppointmentBtn) {
      cancelAppointmentBtn.addEventListener('click', cancelSelectedAppointment);
    }

    // Export schedule button
    if (exportScheduleBtn) {
      exportScheduleBtn.addEventListener('click', exportMonthlySchedule);
    }
  }
  
  // Populate available times based on selected date
  function populateAvailableTimes() {
    if (!appointmentDateInput || !availableTimesContainer) return;
    
    const selectedDate = new Date(appointmentDateInput.value);
    const dayOfWeek = selectedDate.getDay(); // 0 = Sunday, 1 = Monday, etc.
    
    // Clear container
    availableTimesContainer.innerHTML = '';
    
    // Find schedule for the selected day
    const daySchedule = schedules.find(s => s.dayOfWeek === dayOfWeek);
    
    if (!daySchedule || daySchedule.isWeekend || !daySchedule.timeTable) {
      availableTimesContainer.innerHTML = '<p>На цей день немає доступних часів</p>';
      return;
    }
    
    // Create buttons for each available time
    for (const slotKey in daySchedule.timeTable) {
      if (daySchedule.timeTable[slotKey]) {
        const timeSlot = daySchedule.timeTable[slotKey];
        
        // Check if there's an appointment for this time slot
        const slotDate = new Date(selectedDate);
        const [hours, minutes] = timeSlot.split(':');
        slotDate.setHours(parseInt(hours), parseInt(minutes));
        
        // Check if this slot is already booked
        const isBooked = currentAppointments.some(a => {
          const appTime = new Date(a.time);
          return isSameDay(appTime, selectedDate) && 
                appTime.getHours() === parseInt(hours) && 
                appTime.getMinutes() === parseInt(minutes);
        });
        
        if (!isBooked) {
          const timeButton = document.createElement('button');
          timeButton.type = 'button';
          timeButton.className = 'time-option';
          timeButton.textContent = timeSlot;
          timeButton.addEventListener('click', () => {
            appointmentTimeInput.value = timeSlot;
          });
          
          availableTimesContainer.appendChild(timeButton);
        }
      }
    }
    
    // If no available times were added
    if (availableTimesContainer.children.length === 0) {
      availableTimesContainer.innerHTML = '<p>На цей день немає доступних часів</p>';
    }
  }
  
  // Add 'Book' button functionality
  function handleBookButtonClick(date, time) {
    resetForm();
    modalTitle.textContent = 'Новий запис';
    currentAppointmentId = null;
    
    // Set the date and time in the form
    appointmentDateInput.value = formatISODate(date);
    appointmentTimeInput.value = time;
    
    // Populate available times
    populateAvailableTimes();
    
    openModal(appointmentModal);
  }
  
  // Show appointment details
  function showAppointmentDetails(appointmentId) {
    const appointment = currentAppointments.find(a => a._id === appointmentId);
    if (!appointment) return;
    
    selectedAppointment = appointment;
    
    // Find client and procedure details
    const client = appointment.clientId && typeof appointment.clientId === 'object' 
      ? appointment.clientId 
      : clients.find(c => c._id === appointment.clientId);
      
    const procedure = appointment.procedureId && typeof appointment.procedureId === 'object'
      ? appointment.procedureId
      : procedures.find(p => p._id === appointment.procedureId);
    
    // Format date and time
    const appTime = new Date(appointment.time);
    const dateFormatted = formatDate(appTime);
    const timeFormatted = formatTime(appTime);
    
    // Build the details HTML
    let detailsHTML = `
      <div class="detail-row">
        <div class="detail-label">Клієнт:</div>
        <div class="detail-value">${client ? `${client.name} ${client.surName}` : 'Невідомий клієнт'}</div>
      </div>
      <div class="detail-row">
        <div class="detail-label">Процедура:</div>
        <div class="detail-value">${procedure ? procedure.name : 'Невідома процедура'}</div>
      </div>
      <div class="detail-row">
        <div class="detail-label">Дата:</div>
        <div class="detail-value">📅 ${dateFormatted}</div>
      </div>
      <div class="detail-row">
        <div class="detail-label">Час:</div>
        <div class="detail-value">⏰ ${timeFormatted}</div>
      </div>
      <div class="detail-row">
        <div class="detail-label">Ціна:</div>
        <div class="detail-value">💰 ${appointment.price.toFixed(2)} грн</div>
      </div>
      <div class="detail-row">
        <div class="detail-label">Статус:</div>
        <div class="detail-value status-${appointment.status}">${getStatusEmoji(appointment.status)} ${getStatusText(appointment.status)}</div>
      </div>
    `;
    
    if (appointment.finalPrice) {
      detailsHTML += `
        <div class="detail-row">
          <div class="detail-label">Остаточна ціна:</div>
          <div class="detail-value">💰 ${appointment.finalPrice.toFixed(2)} грн</div>
        </div>
      `;
    }
    
    if (appointment.notes) {
      detailsHTML += `
        <div class="detail-row">
          <div class="detail-label">Нотатки:</div>
          <div class="detail-value">📝 ${appointment.notes}</div>
        </div>
      `;
    }
    
    appointmentDetails.innerHTML = detailsHTML;
    
    // Show different buttons based on status
    if (appointment.status === 'cancelled') {
      cancelAppointmentBtn.style.display = 'none';
    } else {
      cancelAppointmentBtn.style.display = 'block';
    }
    
    openModal(appointmentDetailModal);
  }
  
  // Edit selected appointment
  function editSelectedAppointment() {
    if (!selectedAppointment) return;
    
    currentAppointmentId = selectedAppointment._id;
    modalTitle.textContent = 'Редагувати запис';
    
    // Fill the form with appointment data
    clientSelect.value = selectedAppointment.clientId._id || selectedAppointment.clientId;
    procedureSelect.value = selectedAppointment.procedureId._id || selectedAppointment.procedureId;
    
    const appTime = new Date(selectedAppointment.time);
    appointmentDateInput.value = formatISODate(appTime);
    appointmentTimeInput.value = appTime.toTimeString().substring(0, 5); // Format as HH:MM
    
    priceInput.value = selectedAppointment.price;
    document.getElementById('status').value = selectedAppointment.status;
    
    if (selectedAppointment.finalPrice) {
      document.getElementById('final-price').value = selectedAppointment.finalPrice;
    }
    
    if (selectedAppointment.notes) {
      document.getElementById('notes').value = selectedAppointment.notes;
    }
    
    // Populate available times
    populateAvailableTimes();
    
    // Close detail modal and open edit modal
    closeModal(appointmentDetailModal);
    openModal(appointmentModal);
  }
  
  // Show status change options
  function showStatusChangeOptions() {
    if (!selectedAppointment) return;
    
    // Create a temporary status selection interface
    const statusOptions = ['pending', 'confirmed', 'completed', 'cancelled'];
    let statusHTML = '<div class="status-options">';
    
    statusOptions.forEach(status => {
      if (status !== selectedAppointment.status) {
        statusHTML += `
          <button class="status-option status-${status}" data-status="${status}">
            ${getStatusEmoji(status)} ${getStatusText(status)}
          </button>
        `;
      }
    });
    
    statusHTML += '</div>';
    
    // Add the status options to the details
    appointmentDetails.innerHTML += statusHTML;
    
    // Add event listeners to the status buttons
    const statusButtons = appointmentDetails.querySelectorAll('.status-option');
    statusButtons.forEach(button => {
      button.addEventListener('click', () => {
        changeAppointmentStatus(button.dataset.status);
      });
    });
    
    // Hide the change status button while options are displayed
    changeStatusBtn.style.display = 'none';
  }
  
  // Change appointment status
  async function changeAppointmentStatus(newStatus) {
    if (!selectedAppointment) return;
    
    try {
      const response = await fetch(`${API.appointments}/${selectedAppointment._id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      // Reload appointments and close the modal
      await loadAppointments();
      closeModal(appointmentDetailModal);
      showMessage('success', 'Статус запису успішно оновлено!');
      
      // If status changed to confirmed, schedule notification
      if (newStatus === 'confirmed' && window.notificationSystem) {
        const updatedAppointments = await (await fetch(API.appointments)).json();
        const updatedAppointment = updatedAppointments.find(a => a._id === selectedAppointment._id);
        if (updatedAppointment) {
          window.notificationSystem.scheduleAppointmentReminder(updatedAppointment);
        }
      }
    } catch (error) {
      console.error('Помилка зміни статусу запису:', error);
      showMessage('error', 'Не вдалося оновити статус запису. Будь ласка, спробуйте пізніше.');
    }
  }
  
  // Cancel selected appointment
  async function cancelSelectedAppointment() {
    if (!selectedAppointment) return;
    
    const confirm = window.confirm('Ви впевнені, що хочете скасувати цей запис?');
    if (!confirm) return;
    
    try {
      const response = await fetch(`${API.appointments}/${selectedAppointment._id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: 'cancelled' })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      // Reload appointments and close the modal
      await loadAppointments();
      closeModal(appointmentDetailModal);
      showMessage('success', 'Запис успішно скасовано!');
    } catch (error) {
      console.error('Помилка скасування запису:', error);
      showMessage('error', 'Не вдалося скасувати запис. Будь ласка, спробуйте пізніше.');
    }
  }
  
  // Switch between views
  function switchView(view) {
    currentView = view;
    
    if (view === 'weekly') {
      weeklyViewBtn.classList.add('active');
      monthlyViewBtn.classList.remove('active');
      weeklyViewContainer.classList.add('active');
      monthlyViewContainer.classList.remove('active');
      renderWeeklyView(selectedDate);
    } else if (view === 'monthly') {
      weeklyViewBtn.classList.remove('active');
      monthlyViewBtn.classList.add('active');
      weeklyViewContainer.classList.remove('active');
      monthlyViewContainer.classList.add('active');
      updateMonthCalendar(selectedDate);
    }
  }
  
  // Navigate week (prev/next)
  function navigateWeek(direction) {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + (direction * 7));
    selectedDate = newDate;
    renderWeeklyView(selectedDate);
  }
  
  // Navigate month (prev/next)
  function navigateMonth(direction) {
    const newDate = new Date(selectedDate);
    newDate.setMonth(newDate.getMonth() + direction);
    selectedDate = newDate;
    updateMonthCalendar(selectedDate);
  }
  
  // Render weekly view
  function renderWeeklyView(date) {
    const startOfWeek = new Date(date);
    const currentDay = startOfWeek.getDay();
    startOfWeek.setDate(startOfWeek.getDate() - currentDay + (currentDay === 0 ? -6 : 1)); // Start from Monday
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 6);
    
    const startFormatted = formatDate(startOfWeek);
    const endFormatted = formatDate(endOfWeek);
    if (currentWeekRange) currentWeekRange.textContent = `${startFormatted} - ${endFormatted}`;
    
    if (!daysContainer) return;
    
    daysContainer.innerHTML = '';
    
    for (let i = 0; i < 7; i++) {
      const dayDate = new Date(startOfWeek);
      dayDate.setDate(dayDate.getDate() + i);
      
      const isToday = isSameDay(dayDate, new Date());
      const dayOfWeek = dayDate.getDay(); // 0 = Sunday, 1 = Monday, etc.
      
      const dayElement = document.createElement('div');
      dayElement.className = `day-card ${isToday ? 'today' : ''}`;
      
      const dateFormatted = formatDate(dayDate);
      const dayName = getDayName(dayDate);
      
      // Check if it's a weekend based on schedule
      const daySchedule = schedules.find(s => s.dayOfWeek === dayOfWeek);
      const isWeekendDay = daySchedule ? daySchedule.isWeekend : (dayOfWeek === 0 || dayOfWeek === 6);
      
      if (isWeekendDay) {
        dayElement.innerHTML = `
          <div class="day-header">
            <h3>${dayName}</h3>
            <span class="day-date">${dateFormatted}</span>
          </div>
          <div class="weekend-message">
            <i class="fas fa-umbrella-beach"></i>
            <p>Сьогодні вихідний! Гарного відпочинку.</p>
          </div>
        `;
      } else {
        dayElement.innerHTML = `
          <div class="day-header">
            <h3>${dayName}</h3>
            <span class="day-date">${dateFormatted}</span>
          </div>
          <div class="time-slots">
            ${renderTimeSlots(dayOfWeek, dayDate)}
          </div>
        `;
      }
      
      daysContainer.appendChild(dayElement);
    }
    
    addTimeSlotEventListeners();
  }
  
  // Render time slots for a day
  function renderTimeSlots(dayOfWeek, date) {
    const daySchedule = schedules.find(s => s.dayOfWeek === dayOfWeek);
    
    if (!daySchedule || !daySchedule.timeTable) {
      return `<div class="no-slots">Немає доступних часових слотів</div>`;
    }
    
    let slotsHTML = '';
    for (const slotKey in daySchedule.timeTable) {
      if (daySchedule.timeTable[slotKey]) {
        const timeSlot = daySchedule.timeTable[slotKey];
        const slotDate = new Date(date);
        const [hours, minutes] = timeSlot.split(':');
        slotDate.setHours(parseInt(hours), parseInt(minutes));
        
        // Check if there's an appointment for this slot
        const appointment = currentAppointments.find(a => {
          const appTime = new Date(a.time);
          return isSameDay(appTime, date) && 
                 appTime.getHours() === parseInt(hours) && 
                 appTime.getMinutes() === parseInt(minutes);
        });
        
        if (appointment) {
          // Booked slot - display as a card
          const client = appointment.clientId && typeof appointment.clientId === 'object' 
            ? `${appointment.clientId.name} ${appointment.clientId.surName}`
            : 'Клієнт';
          const procedure = appointment.procedureId && typeof appointment.procedureId === 'object'
            ? appointment.procedureId.name
            : 'Процедура';
          
          slotsHTML += `
            <div class="time-slot booked">
              <div class="slot-time">⏰ ${timeSlot}</div>
              <div class="slot-appointment" data-id="${appointment._id}">
                <div class="slot-client"><i class="fas fa-user"></i> ${client}</div>
                <div class="slot-procedure"><i class="fas fa-spa"></i> ${procedure}</div>
                <div class="status-${appointment.status}">${getStatusEmoji(appointment.status)} ${getStatusText(appointment.status)}</div>
              </div>
            </div>
          `;
        } else {
          // Available slot - simpler display
          slotsHTML += `
            <div class="time-slot available">
              <span class="slot-time">⏰ ${timeSlot}</span>
              <button class="btn btn-book" data-date="${formatISODate(slotDate)}" data-time="${timeSlot}"><i class="fas fa-plus"></i> Записати</button>
            </div>
          `;
        }
      }
    }
    
    return slotsHTML || `<div class="no-slots">Немає доступних часових слотів</div>`;
  }
  
  // After rendering the weekly view, add event listeners to the slots
  function addTimeSlotEventListeners() {
    // Add click event to book buttons
    const bookButtons = document.querySelectorAll('.btn-book');
    bookButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        e.stopPropagation();
        const date = new Date(button.dataset.date);
        const time = button.dataset.time;
        handleBookButtonClick(date, time);
      });
    });
    
    // Add click event to booked slots
    const bookedSlots = document.querySelectorAll('.time-slot.booked');
    bookedSlots.forEach(slot => {
      slot.addEventListener('click', () => {
        const appointmentId = slot.querySelector('.slot-appointment').dataset.id;
        showAppointmentDetails(appointmentId);
      });
    });
  }
  
  // Update month calendar
  function updateMonthCalendar(date) {
    const year = date.getFullYear();
    const month = date.getMonth();
    
    if (currentMonthYear) {
      currentMonthYear.textContent = `${getMonthName(month)} ${year}`;
    }
    
    if (!calendarContainer) return;
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    
    let startingDay = firstDay.getDay();
    if (startingDay === 0) startingDay = 7; // Sunday becomes 7 for easier calculation
    
    let calendarHTML = `
      <div class="calendar-header">
        <div class="calendar-day">Пн</div>
        <div class="calendar-day">Вт</div>
        <div class="calendar-day">Ср</div>
        <div class="calendar-day">Чт</div>
        <div class="calendar-day">Пт</div>
        <div class="calendar-day">Сб</div>
        <div class="calendar-day">Нд</div>
      </div>
      <div class="calendar-body">
    `;
    
    // Add empty cells for days before the first day of the month
    for (let i = 1; i < startingDay; i++) {
      calendarHTML += `<div class="calendar-date empty"></div>`;
    }
    
    // Add cells for each day of the month
    for (let i = 1; i <= daysInMonth; i++) {
      const dayDate = new Date(year, month, i);
      const dayOfWeek = dayDate.getDay();
      const isToday = isSameDay(dayDate, new Date());
      const isSelected = isSameDay(dayDate, selectedDate);
      
      // Check appointments for this day
      const hasAppointments = currentAppointments.some(a => isSameDay(new Date(a.time), dayDate));
      
      // Check if it's a weekend based on schedule
      const daySchedule = schedules.find(s => s.dayOfWeek === dayOfWeek);
      const isWeekendDay = daySchedule ? daySchedule.isWeekend : (dayOfWeek === 0 || dayOfWeek === 6);
      
      calendarHTML += `
        <div class="calendar-date ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''} ${isWeekendDay ? 'weekend' : ''} ${hasAppointments ? 'has-appointments' : ''}" 
             data-date="${year}-${(month + 1).toString().padStart(2, '0')}-${i.toString().padStart(2, '0')}">
          ${i}
          ${hasAppointments ? '<div class="appointment-indicator"></div>' : ''}
          ${isWeekendDay ? '<div class="weekend-indicator"><i class="fas fa-umbrella-beach"></i></div>' : ''}
        </div>
      `;
    }
    
    calendarHTML += `</div>`;
    calendarContainer.innerHTML = calendarHTML;
    
    // Add event listeners for date selection
    const dateElements = calendarContainer.querySelectorAll('.calendar-date:not(.empty)');
    dateElements.forEach(dateElement => {
      dateElement.addEventListener('click', () => {
        const dateStr = dateElement.dataset.date;
        if (dateStr) {
          // Remove previous selection
          const prevSelected = calendarContainer.querySelector('.calendar-date.selected');
          if (prevSelected) prevSelected.classList.remove('selected');
          
          // Add new selection
          dateElement.classList.add('selected');
          
          selectedDate = new Date(dateStr);
          
          // Display appointments for the selected date in weekly view
          switchView('weekly');
        }
      });
    });
  }
  
  // Populate schedule form with existing data
  function populateScheduleForm() {
    if (!scheduleDay) return;
    
    scheduleDay.value = "1"; // Default to Monday
    if (isWeekend) isWeekend.checked = false;
    
    // Clear time slots
    document.getElementById('time-slot-1').value = '';
    document.getElementById('time-slot-2').value = '';
    document.getElementById('time-slot-3').value = '';
    document.getElementById('time-slot-4').value = '';
    
    // Display existing schedules
    renderScheduleDays();
    
    // Check if schedule exists for selected day
    updateScheduleFormForDay();
    
    // Add event listener for day selection
    scheduleDay.addEventListener('change', updateScheduleFormForDay);
  }
  
  // Update schedule form based on selected day
  function updateScheduleFormForDay() {
    if (!scheduleDay || !isWeekend) return;
    
    const selectedDayOfWeek = parseInt(scheduleDay.value);
    const daySchedule = schedules.find(s => s.dayOfWeek === selectedDayOfWeek);
    
    if (daySchedule) {
      isWeekend.checked = daySchedule.isWeekend;
      
      // Fill time slots
      if (daySchedule.timeTable) {
        for (const slotKey in daySchedule.timeTable) {
          const input = document.getElementById(`time-slot-${slotKey}`);
          if (input && daySchedule.timeTable[slotKey]) {
            input.value = daySchedule.timeTable[slotKey];
          }
        }
      }
    } else {
      // Reset form for new day
      isWeekend.checked = false;
      document.getElementById('time-slot-1').value = '';
      document.getElementById('time-slot-2').value = '';
      document.getElementById('time-slot-3').value = '';
      document.getElementById('time-slot-4').value = '';
    }
    
    toggleTimeSlots();
  }
  
  // Toggle time slots visibility based on weekend checkbox
  function toggleTimeSlots() {
    if (!isWeekend || !timeSlotsContainer) return;
    
    if (isWeekend.checked) {
      timeSlotsContainer.style.display = 'none';
    } else {
      timeSlotsContainer.style.display = 'block';
    }
  }
  
  // Render schedule days
  function renderScheduleDays() {
    if (!scheduleDaysContainer) return;
    
    scheduleDaysContainer.innerHTML = '';
    
    const daysOfWeek = [
      { value: 0, name: 'Неділя' },
      { value: 1, name: 'Понеділок' },
      { value: 2, name: 'Вівторок' },
      { value: 3, name: 'Середа' },
      { value: 4, name: 'Четвер' },
      { value: 5, name: 'П\'ятниця' },
      { value: 6, name: 'Субота' }
    ];
    
    daysOfWeek.forEach(day => {
      const daySchedule = schedules.find(s => s.dayOfWeek === day.value);
      
      const dayElement = document.createElement('div');
      dayElement.className = `schedule-day ${daySchedule && daySchedule.isWeekend ? 'weekend' : ''}`;
      dayElement.innerHTML = `
        <div class="day-name">${day.name}</div>
        <div class="day-status">
          ${daySchedule ? (daySchedule.isWeekend ? 'Вихідний' : 'Робочий день') : 'Не встановлено'}
        </div>
      `;
      
      dayElement.addEventListener('click', () => {
        scheduleDay.value = day.value;
        updateScheduleFormForDay();
      });
      
      scheduleDaysContainer.appendChild(dayElement);
    });
  }
  
  // Save schedule
  async function saveSchedule(e) {
    e.preventDefault();
    
    try {
      const dayOfWeek = parseInt(scheduleDay.value);
      const isWeekendDay = isWeekend.checked;
      
      const timeTable = {};
      
      if (!isWeekendDay) {
        for (let i = 1; i <= 4; i++) {
          const timeValue = document.getElementById(`time-slot-${i}`).value;
          if (timeValue) {
            timeTable[i] = timeValue;
          }
        }
      }
      
      const scheduleData = {
        dayOfWeek,
        isWeekend: isWeekendDay,
        timeTable
      };
      
      // Check if schedule exists for this day
      const existingSchedule = schedules.find(s => s.dayOfWeek === dayOfWeek);
      let url = API.schedules;
      let method = 'POST';
      
      if (existingSchedule) {
        url = `${API.schedules}/${existingSchedule._id}`;
        method = 'PUT';
      }
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(scheduleData)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      await loadSchedules();
      renderScheduleDays();
      renderWeeklyView(selectedDate);
      updateMonthCalendar(selectedDate);
      
      showMessage('success', 'Розклад успішно оновлено!');
    } catch (error) {
      console.error('Помилка збереження розкладу:', error);
      showMessage('error', 'Не вдалося зберегти розклад. Будь ласка, спробуйте пізніше.');
    }
  }
  
  // Handle form submission
  async function handleFormSubmit(e) {
    e.preventDefault();
    
    try {
      const formData = new FormData(appointmentForm);
      const appointmentData = {
        clientId: formData.get('clientId'),
        procedureId: formData.get('procedureId'),
        price: parseFloat(formData.get('price')),
        status: formData.get('status'),
        notes: formData.get('notes')
      };
      
      // Handle date and time
      const dateValue = formData.get('date');
      const timeValue = formData.get('time');
      const dateTime = new Date(`${dateValue}T${timeValue}`);
      appointmentData.time = dateTime.toISOString();
      
      // Add final price if provided
      const finalPrice = formData.get('finalPrice');
      if (finalPrice) {
        appointmentData.finalPrice = parseFloat(finalPrice);
      }
      
      let url = API.appointments;
      let method = 'POST';
      
      // If editing an existing appointment
      if (currentAppointmentId) {
        url = `${API.appointments}/${currentAppointmentId}`;
        method = 'PUT';
      }
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(appointmentData)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      closeModal(appointmentModal);
      showMessage('success', `Запис успішно ${currentAppointmentId ? 'оновлено' : 'створено'}!`);
      await loadAppointments();
      
      // If this was a new appointment or status changed to confirmed, schedule notification
      if (appointmentData.status === 'confirmed' && window.notificationSystem) {
        const updatedAppointments = await (await fetch(API.appointments)).json();
        const newAppointment = currentAppointmentId 
          ? updatedAppointments.find(a => a._id === currentAppointmentId)
          : updatedAppointments[updatedAppointments.length - 1]; // Assume last one is the new one
          
        if (newAppointment) {
          window.notificationSystem.scheduleAppointmentReminder(newAppointment);
        }
      }
    } catch (error) {
      console.error('Помилка збереження запису:', error);
      showMessage('error', 'Не вдалося зберегти запис. Будь ласка, спробуйте пізніше.');
    }
  }
  
  // Reset form
  function resetForm() {
    if (!appointmentForm) return;
    
    appointmentForm.reset();
    
    // Clear available times
    if (availableTimesContainer) {
      availableTimesContainer.innerHTML = '';
    }
    
    // Set default date to today
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('appointment-date').value = today;
    
    // Populate available times for today
    populateAvailableTimes();
  }
  
  // Apply filters
  function applyFilters() {
    if (!statusFilter || !dateFilter) return;
    
    const filters = {
      status: statusFilter.value,
      date: dateFilter.value
    };
    
    loadAppointments(filters);
  }
  
  // Clear filters
  function clearFilters() {
    if (!statusFilter || !dateFilter) return;
    
    statusFilter.value = 'all';
    dateFilter.value = '';
    loadAppointments();
  }
  
  // Helper function to get status emoji
  function getStatusEmoji(status) {
    switch (status) {
      case 'pending': return '⏳';
      case 'confirmed': return '✅';
      case 'completed': return '🎉';
      case 'cancelled': return '❌';
      default: return '❓';
    }
  }
  
  // Helper function to get status text in Ukrainian
  function getStatusText(status) {
    switch (status) {
      case 'pending': return 'Очікує';
      case 'confirmed': return 'Підтверджено';
      case 'completed': return 'Завершено';
      case 'cancelled': return 'Скасовано';
      default: return 'Невідомо';
    }
  }
  
  // Check for today's appointments and notify
  function checkForTodaysAppointments() {
    if (!window.notificationSystem || !currentAppointments || currentAppointments.length === 0) {
      return;
    }
    
    const today = new Date();
    const todaysAppointments = currentAppointments.filter(appointment => {
      const appointmentDate = new Date(appointment.time);
      return isSameDay(appointmentDate, today);
    });
    
    if (todaysAppointments.length > 0) {
      window.notificationSystem.notifyTodaysAppointments(todaysAppointments);
    }
  }

  /**
   * Export the monthly schedule as a PNG
   */
  function exportMonthlySchedule() {
    // Show a loading message
    showMessage('info', 'Генерація розкладу...');
    
    // Get current month and year
    const currentMonthDate = selectedDate || new Date();
    const year = currentMonthDate.getFullYear();
    const month = currentMonthDate.getMonth();
    const monthName = getMonthName(month);
    
    // Create a canvas element with wider dimensions
    const canvas = document.createElement('canvas');
    canvas.width = 1600;  // Wide format for a calendar layout
    canvas.height = 1200; // Taller to fit the entire month
    document.body.appendChild(canvas); // Temporarily add to DOM for rendering
    
    const ctx = canvas.getContext('2d');
    
    // Get rose-pine moon color scheme
    const rosePine = {
      base: '#232136',        // Dark background
      surface: '#2a273f',     // Slightly lighter background
      overlay: '#393552',     // For overlays and borders
      muted: '#6e6a86',       // Muted text
      subtle: '#908caa',      // Subtle elements
      text: '#e0def4',        // Main text color
      love: '#eb6f92',        // Accent pink/red (for booked)
      gold: '#f6c177',        // Gold for special elements
      rose: '#ea9a97',        // Softer pink
      pine: '#3e8fb0',        // Blue-green
      foam: '#9ccfd8',        // Teal (for available)
      iris: '#c4a7e7'         // Purple for highlights
    };
    
    // Update app colors with rose-pine moon theme
    const appColors = {
      background: rosePine.base,
      primary: rosePine.iris,      // Primary brand color
      secondary: rosePine.subtle,  // Secondary elements
      text: rosePine.text,         // Main text
      lightText: rosePine.muted,   // Secondary text
      border: rosePine.overlay,    // Borders
      weekend: rosePine.rose,      // Weekend highlighting
      available: rosePine.foam,    // Available slots
      booked: rosePine.love,       // Booked slots
      headerBg: rosePine.surface,  // Header backgrounds
      alternateRow: rosePine.overlay // Alternating rows
    };
    
    // Fill background
    ctx.fillStyle = appColors.background;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw app-like header bar
    ctx.fillStyle = appColors.primary;
    ctx.fillRect(0, 0, canvas.width, 60);
    
    // Set title
    ctx.fillStyle = appColors.text;
    ctx.font = 'bold 32px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`Розклад на ${monthName} ${year}`, canvas.width / 2, 40);
    
    // Draw legend with app-like styling
    ctx.fillStyle = appColors.headerBg;
    ctx.fillRect(0, 60, canvas.width, 40);
    
    ctx.fillStyle = appColors.text;
    ctx.font = '16px Arial, sans-serif';
    ctx.textAlign = 'left';
    
    // Draw legend with colored indicators
    const legendY = 85;
    const legendSpacing = 250;
    
    // Available indicator
    ctx.fillStyle = appColors.available;
    ctx.fillRect(50, legendY - 15, 20, 20);
    ctx.fillStyle = appColors.text;
    ctx.fillText('Доступно', 80, legendY);
    
    // Booked indicator
    ctx.fillStyle = appColors.booked;
    ctx.fillRect(50 + legendSpacing, legendY - 15, 20, 20);
    ctx.fillStyle = appColors.text;
    ctx.fillText('Заброньовано', 80 + legendSpacing, legendY);
    
    // Weekend indicator
    ctx.fillStyle = appColors.weekend;
    ctx.fillRect(50 + (legendSpacing * 2), legendY - 15, 20, 20);
    ctx.fillStyle = appColors.text;
    ctx.fillText('Вихідний', 80 + (legendSpacing * 2), legendY);
    
    // Calendar layout settings
    const startY = 120;
    const dayWidth = Math.floor((canvas.width - 60) / 7); // 7 days in a week
    const dayHeight = 150; // Height for each day cell
    const dayPadding = 10; // Padding inside each day cell
    const weekdayNames = ['Понеділок', 'Вівторок', 'Середа', 'Четвер', 'П\'ятниця', 'Субота', 'Неділя'];
    const weekdayHints = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'НД'];
    
    // Draw weekday headers
    for (let i = 0; i < 7; i++) {
      ctx.fillStyle = appColors.headerBg;
      ctx.fillRect(30 + (i * dayWidth), startY, dayWidth, 40);
      
      ctx.fillStyle = appColors.text;
      ctx.font = 'bold 16px Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(weekdayNames[i], 30 + (i * dayWidth) + (dayWidth / 2), startY + 25);
      
      // Add subtle border
      ctx.strokeStyle = appColors.border;
      ctx.lineWidth = 1;
      ctx.strokeRect(30 + (i * dayWidth), startY, dayWidth, 40);
    }
    
    // Get calendar data for the month
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    
    // Get the first day of week (0 = Sunday, 1 = Monday, etc.)
    let firstDayOfWeek = firstDay.getDay();
    if (firstDayOfWeek === 0) firstDayOfWeek = 7; // Adjust Sunday to be 7 instead of 0
    firstDayOfWeek--; // Adjust to 0-based for Monday (0 = Monday, 6 = Sunday)
    
    // Calculate the number of weeks needed
    const weeksInMonth = Math.ceil((daysInMonth + firstDayOfWeek) / 7);
    
    // Adjust the canvas height based on the number of weeks
    canvas.height = startY + 40 + (weeksInMonth * dayHeight) + 80; // Extra space for watermark
    
    // Draw calendar grid
    for (let week = 0; week < weeksInMonth; week++) {
      for (let day = 0; day < 7; day++) {
        const dayNum = (week * 7) + day + 1 - firstDayOfWeek;
        const x = 30 + (day * dayWidth);
        const y = startY + 40 + (week * dayHeight);
        
        // Draw day cell background
        if (dayNum > 0 && dayNum <= daysInMonth) {
          // Valid day in month
          const date = new Date(year, month, dayNum);
          const dayOfWeek = date.getDay();
          const isToday = isSameDay(date, new Date());
          
          // Check if it's a weekend
          const daySchedule = schedules.find(s => s.dayOfWeek === dayOfWeek);
          const isWeekendDay = daySchedule ? daySchedule.isWeekend : (dayOfWeek === 0 || dayOfWeek === 6);
          
          // Fill background based on weekend or day type
          if (isWeekendDay) {
            ctx.fillStyle = appColors.weekend;
          } else if (isToday) {
            ctx.fillStyle = appColors.primary;
          } else {
            ctx.fillStyle = appColors.headerBg;
          }
          
          ctx.fillRect(x, y, dayWidth, dayHeight);
          
          // Draw border
          ctx.strokeStyle = appColors.border;
          ctx.lineWidth = 1;
          ctx.strokeRect(x, y, dayWidth, dayHeight);
          
          // Draw day number with weekday hint
          ctx.fillStyle = appColors.text;
          ctx.font = 'bold 18px Arial, sans-serif';
          ctx.textAlign = 'left';
          ctx.fillText(dayNum.toString(), x + dayPadding, y + dayPadding + 18);
          
          // Add weekday hint
          ctx.font = 'bold 12px Arial, sans-serif';
          ctx.fillStyle = isWeekendDay ? rosePine.gold : rosePine.subtle;
          ctx.fillText(weekdayHints[dayOfWeek === 0 ? 6 : dayOfWeek - 1], x + dayPadding + 30, y + dayPadding + 18);
          
          // Render time slots for this day if not a weekend
          if (!isWeekendDay) {
            if (daySchedule && daySchedule.timeTable) {
              const timeSlots = Object.values(daySchedule.timeTable).filter(Boolean);
              timeSlots.sort(); // Sort chronologically
              
              // Max slots to display per day (to avoid overflow)
              const maxDisplaySlots = 6;
              const displaySlots = timeSlots.slice(0, maxDisplaySlots);
              
              if (displaySlots.length > 0) {
                // Draw time slots with availability
                displaySlots.forEach((timeSlot, i) => {
                  // Check if this slot is booked
                  const slotDate = new Date(date);
                  const [hours, minutes] = timeSlot.split(':');
                  slotDate.setHours(parseInt(hours), parseInt(minutes));
                  
                  const isBooked = currentAppointments.some(a => {
                    const appTime = new Date(a.time);
                    return isSameDay(appTime, date) && 
                          appTime.getHours() === parseInt(hours) && 
                          appTime.getMinutes() === parseInt(minutes);
                  });
                  
                  // Draw slot with pill-shaped background
                  const pillX = x + dayPadding;
                  const pillY = y + 50 + (i * 18);
                  const pillWidth = dayWidth - (dayPadding * 2);
                  const pillHeight = 16;
                  
                  // Draw rounded rectangle
                  ctx.fillStyle = isBooked ? appColors.booked : appColors.available;
                  roundedRect(ctx, pillX, pillY, pillWidth, pillHeight, 8);
                  
                  // Draw time text
                  ctx.fillStyle = appColors.text;
                  ctx.font = '12px Arial, sans-serif';
                  ctx.textAlign = 'left';
                  ctx.fillText(
                    `${timeSlot} - ${isBooked ? 'Заброньовано' : 'Доступно'}`,
                    pillX + 6,
                    pillY + 12
                  );
                });
                
                // Show indicator if there are more slots than we display
                if (timeSlots.length > maxDisplaySlots) {
                  ctx.fillStyle = appColors.lightText;
                  ctx.font = 'italic 12px Arial, sans-serif';
                  ctx.fillText(
                    `+ ще ${timeSlots.length - maxDisplaySlots} слотів...`,
                    x + dayPadding,
                    y + dayHeight - dayPadding
                  );
                }
              } else {
                // No time slots available
                ctx.fillStyle = appColors.lightText;
                ctx.font = 'italic 12px Arial, sans-serif';
                ctx.fillText(
                  'Немає доступних часів',
                  x + dayPadding,
                  y + 60
                );
              }
            } else {
              // No schedule defined
              ctx.fillStyle = appColors.lightText;
              ctx.font = 'italic 12px Arial, sans-serif';
              ctx.fillText(
                'Розклад не налаштовано',
                x + dayPadding,
                y + 60
              );
            }
          } else {
            // Weekend message
            ctx.fillStyle = appColors.text;
            ctx.font = 'italic 12px Arial, sans-serif';
            ctx.fillText(
              'Вихідний день',
              x + dayPadding,
              y + 60
            );
          }
        } else {
          // Empty day (not part of this month)
          ctx.fillStyle = rosePine.base;
          ctx.fillRect(x, y, dayWidth, dayHeight);
          
          // Draw border
          ctx.strokeStyle = appColors.border;
          ctx.lineWidth = 1;
          ctx.strokeRect(x, y, dayWidth, dayHeight);
        }
      }
    }
    
    // Add watermark
    ctx.font = 'italic 24px Arial, sans-serif';
    ctx.fillStyle = 'rgba(224, 222, 244, 0.2)'; // semi-transparent text
    ctx.textAlign = 'center';
    ctx.fillText('@savika_nail', canvas.width / 2, canvas.height - 30);
    
    // Draw decorative bottom border
    const gradient = ctx.createLinearGradient(0, canvas.height - 10, canvas.width, canvas.height - 10);
    gradient.addColorStop(0, rosePine.rose);
    gradient.addColorStop(0.5, rosePine.iris);
    gradient.addColorStop(1, rosePine.foam);
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, canvas.height - 10, canvas.width, 10);
    
    // Convert canvas to PNG data URL
    try {
      const dataUrl = canvas.toDataURL('image/png');
      
      // Create download link
      const downloadLink = document.createElement('a');
      downloadLink.href = dataUrl;
      downloadLink.download = `savika-calendar-${monthName}-${year}.png`;
      
      // Add to document, click to trigger download, then remove
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      
      // Clean up
      document.body.removeChild(canvas);
      
      showMessage('success', 'Календар успішно експортовано!');
    } catch (error) {
      console.error('Error exporting calendar:', error);
      showMessage('error', 'Помилка експорту календаря. Спробуйте ще раз.');
      
      // Make sure to clean up
      if (document.body.contains(canvas)) {
        document.body.removeChild(canvas);
      }
    }
  }
  
  /**
   * Helper function to draw a rounded rectangle
   */
  function roundedRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    ctx.fill();
  }
}