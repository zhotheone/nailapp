document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const appointmentsList = document.getElementById('appointments-list');
  const appointmentsLoader = document.getElementById('appointments-loader');
  const newAppointmentBtn = document.getElementById('new-appointment-btn');
  const appointmentModal = document.getElementById('appointment-modal');
  const appointmentForm = document.getElementById('appointment-form');
  const modalTitle = document.getElementById('modal-title');
  const closeModal = document.querySelector('.close-modal');
  const closeBtn = document.querySelector('.close-btn');
  const statusFilter = document.getElementById('status-filter');
  const dateFilter = document.getElementById('date-filter');
  const clearFiltersBtn = document.getElementById('clear-filters');
  const clientSelect = document.getElementById('client');
  const procedureSelect = document.getElementById('procedure');
  const priceInput = document.getElementById('price');
  
  // Global variables
  let currentAppointments = [];
  let clients = [];
  let procedures = [];
  let currentAppointmentId = null;
  
  // API endpoints
  const API = {
    appointments: '/api/appointments',
    clients: '/api/clients',
    procedures: '/api/procedures'
  };
  
  // Initialize the page
  init();
  
  // Initialize function
  async function init() {
    try {
      // Check if we're on the appointments page
      if (!appointmentsList || !appointmentsLoader) {
        console.log('Not on appointments page, skipping appointments initialization');
        return;
      }
      
      await Promise.all([
        loadAppointments(),
        loadClients(),
        loadProcedures()
      ]);
      
      setupEventListeners();
    } catch (error) {
      console.error('Initialization error:', error);
      showMessage('error', 'Failed to initialize the application. Please try again later.');
    }
  }
  
  // Load appointments from API
  async function loadAppointments(filters = {}) {
    showLoader();
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
      renderAppointments(data);
    } catch (error) {
      console.error('Error loading appointments:', error);
      showMessage('error', 'Failed to load appointments. Please try again later.');
    } finally {
      hideLoader();
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
      console.error('Error loading clients:', error);
      showMessage('error', 'Failed to load clients. Please try again later.');
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
      console.error('Error loading procedures:', error);
      showMessage('error', 'Failed to load procedures. Please try again later.');
    }
  }
  
  // Populate client select options
  function populateClientSelect() {
    clientSelect.innerHTML = '<option value="">Select a client</option>';
    clients.forEach(client => {
      const option = document.createElement('option');
      option.value = client._id;
      option.textContent = `${client.name} ${client.surName}`;
      clientSelect.appendChild(option);
    });
  }
  
  // Populate procedure select options
  function populateProcedureSelect() {
    procedureSelect.innerHTML = '<option value="">Select a procedure</option>';
    procedures.forEach(procedure => {
      const option = document.createElement('option');
      option.value = procedure._id;
      option.textContent = `${procedure.name} - $${procedure.price}`;
      option.dataset.price = procedure.price;
      procedureSelect.appendChild(option);
    });
  }
  
  // Set up event listeners
  function setupEventListeners() {
    // New appointment button
    if (newAppointmentBtn) {
      newAppointmentBtn.addEventListener('click', () => {
        resetForm();
        modalTitle.textContent = 'New Appointment';
        currentAppointmentId = null;
        openModal();
      });
    }
    
    // Close modal
    if (closeModal) {
      closeModal.addEventListener('click', closeModalHandler);
    }
    
    if (closeBtn) {
      closeBtn.addEventListener('click', closeModalHandler);
    }
    
    // Close modal when clicking outside
    if (appointmentModal) {
      window.addEventListener('click', (e) => {
        if (e.target === appointmentModal) {
          closeModalHandler();
        }
      });
    }
    
    // Form submission
    if (appointmentForm) {
      appointmentForm.addEventListener('submit', handleFormSubmit);
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
  }
  
  // Render appointments to the DOM
  function renderAppointments(appointments) {
    if (appointments.length === 0) {
      appointmentsList.innerHTML = '<div class="no-data">No appointments found. Create a new appointment to get started.</div>';
      return;
    }
    
    appointmentsList.innerHTML = '';
    
    appointments.forEach(appointment => {
      const client = appointment.clientId && typeof appointment.clientId === 'object' 
        ? `${appointment.clientId.name} ${appointment.clientId.surName}`
        : 'Unknown Client';
        
      const procedure = appointment.procedureId && typeof appointment.procedureId === 'object'
        ? appointment.procedureId.name
        : 'Unknown Procedure';
      
      const appointmentDate = new Date(appointment.time);
      const formattedDate = appointmentDate.toLocaleDateString();
      const formattedTime = appointmentDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      
      const card = document.createElement('div');
      card.className = 'appointment-card';
      card.innerHTML = `
        <div class="appointment-header">
          <h3>${procedure}</h3>
          <span class="appointment-time">${formattedDate} at ${formattedTime}</span>
        </div>
        <div class="appointment-client">Client: ${client}</div>
        <div class="appointment-status">
          <span class="status-badge status-${appointment.status.toLowerCase()}">${appointment.status}</span>
        </div>
        <div class="appointment-price">
          ${appointment.status === 'completed' && appointment.finalPrice 
            ? `Final Price: $${appointment.finalPrice}`
            : `Price: $${appointment.price}`}
        </div>
        <div class="appointment-actions">
          <button class="btn btn-secondary btn-sm edit-btn" data-id="${appointment._id}">Edit</button>
          <button class="btn btn-danger btn-sm delete-btn" data-id="${appointment._id}">Delete</button>
        </div>
      `;
      
      // Add edit button event listener
      card.querySelector('.edit-btn').addEventListener('click', () => {
        editAppointment(appointment._id);
      });
      
      // Add delete button event listener
      card.querySelector('.delete-btn').addEventListener('click', () => {
        deleteAppointment(appointment._id);
      });
      
      appointmentsList.appendChild(card);
    });
  }
  
  // Show loader
  function showLoader() {
    appointmentsLoader.style.display = 'flex';
    appointmentsList.style.display = 'none';
  }
  
  // Hide loader
  function hideLoader() {
    appointmentsLoader.style.display = 'none';
    appointmentsList.style.display = 'block';
  }
  
  // Apply filters
  function applyFilters() {
    const filters = {
      status: statusFilter.value,
      date: dateFilter.value
    };
    
    loadAppointments(filters);
  }
  
  // Clear filters
  function clearFilters() {
    statusFilter.value = 'all';
    dateFilter.value = '';
    loadAppointments();
  }
  
  // Edit appointment
  async function editAppointment(id) {
    try {
      const response = await fetch(`${API.appointments}/${id}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const appointment = await response.json();
      
      modalTitle.textContent = 'Edit Appointment';
      currentAppointmentId = id;
      
      // Fill the form with appointment data
      clientSelect.value = appointment.clientId._id || appointment.clientId;
      procedureSelect.value = appointment.procedureId._id || appointment.procedureId;
      
      const appointmentDate = new Date(appointment.time);
      
      // Set date
      const dateString = appointmentDate.toISOString().split('T')[0];
      document.getElementById('appointment-date').value = dateString;
      
      // Set time
      const timeString = appointmentDate.toTimeString().slice(0, 5);
      document.getElementById('appointment-time').value = timeString;
      
      document.getElementById('price').value = appointment.price;
      document.getElementById('status').value = appointment.status;
      document.getElementById('final-price').value = appointment.finalPrice || '';
      document.getElementById('notes').value = appointment.notes || '';
      
      openModal();
    } catch (error) {
      console.error('Error editing appointment:', error);
      showMessage('error', 'Failed to edit appointment. Please try again later.');
    }
  }
  
  // Delete appointment
  async function deleteAppointment(id) {
    if (!confirm('Are you sure you want to delete this appointment?')) {
      return;
    }
    
    try {
      const response = await fetch(`${API.appointments}/${id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      showMessage('success', 'Appointment deleted successfully!');
      loadAppointments();
    } catch (error) {
      console.error('Error deleting appointment:', error);
      showMessage('error', 'Failed to delete appointment. Please try again later.');
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
      
      closeModalHandler();
      showMessage('success', `Appointment ${currentAppointmentId ? 'updated' : 'created'} successfully!`);
      loadAppointments();
    } catch (error) {
      console.error('Error saving appointment:', error);
      showMessage('error', 'Failed to save appointment. Please try again later.');
    }
  }
  
  // Reset form
  function resetForm() {
    appointmentForm.reset();
    
    // Set default date to today
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('appointment-date').value = today;
  }
  
  // Open modal
  function openModal() {
    appointmentModal.style.display = 'block';
    document.body.style.overflow = 'hidden';
  }
  
  // Close modal handler
  function closeModalHandler() {
    appointmentModal.style.display = 'none';
    document.body.style.overflow = 'auto';
    resetForm();
  }
  
  // Show message
  function showMessage(type, message) {
    // Check if message container exists
    let messageContainer = document.querySelector('.message-container');
    
    // Create if doesn't exist
    if (!messageContainer) {
      messageContainer = document.createElement('div');
      messageContainer.className = 'message-container';
      document.body.appendChild(messageContainer);
    }
    
    // Create message element
    const messageElement = document.createElement('div');
    messageElement.className = `message message-${type}`;
    messageElement.textContent = message;
    
    // Add close button
    const closeButton = document.createElement('span');
    closeButton.className = 'message-close';
    closeButton.innerHTML = '&times;';
    closeButton.addEventListener('click', () => {
      messageElement.remove();
    });
    
    messageElement.appendChild(closeButton);
    messageContainer.appendChild(messageElement);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (messageElement.parentNode) {
        messageElement.remove();
      }
    }, 5000);
  }
});
