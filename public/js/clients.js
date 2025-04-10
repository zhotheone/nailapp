// Initialize function for the clients page
function initClients() {
  // DOM Elements
  const clientsList = document.getElementById('clients-list');
  const clientsLoader = document.getElementById('clients-loader');
  const clientModal = document.getElementById('client-modal');
  const clientForm = document.getElementById('client-form');
  const clientDetailModal = document.getElementById('client-detail-modal');
  const clientDetails = document.getElementById('client-details');
  const clientAppointments = document.getElementById('client-appointments');
  const modalTitle = document.getElementById('client-modal-title');
  const clientSearch = document.getElementById('client-search');
  const ratingFilter = document.getElementById('rating-filter');
  const clearFiltersBtn = document.getElementById('clear-client-filters');
  
  // Action buttons for client detail
  const editClientBtn = document.getElementById('edit-client-btn');
  const newAppointmentForClientBtn = document.getElementById('new-appointment-for-client-btn');
  const deleteClientBtn = document.getElementById('delete-client-btn');
  
  // Global variables
  let currentClients = [];
  let currentClientId = null;
  let selectedClient = null;
  
  // API endpoint
  const API = {
    clients: '/api/clients',
    appointments: '/api/appointments'
  };
  
  // Initialize the page
  init();
  
  // Initialize function
  async function init() {
    try {
      await loadClients();
      setupEventListeners();
    } catch (error) {
      console.error('Помилка ініціалізації:', error);
      showMessage('error', 'Не вдалося ініціалізувати додаток. Будь ласка, спробуйте пізніше.');
    }
  }
  
  // Load clients from API
  async function loadClients(filters = {}) {
    showLoader(clientsLoader, clientsList);
    try {
      let url = API.clients;
      
      // Add query parameters for filters if implemented on backend
      if (Object.keys(filters).length > 0) {
        const params = new URLSearchParams();
        
        if (filters.search) {
          params.append('search', filters.search);
        }
        
        if (filters.rating && filters.rating !== 'all') {
          params.append('minRating', filters.rating);
        }
        
        url += `?${params.toString()}`;
      }
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const data = await response.json();
      currentClients = data;
      
      // Sort clients alphabetically by name, then by surname
      currentClients.sort((a, b) => {
        const nameA = a.name.toLowerCase();
        const nameB = b.name.toLowerCase();
        
        if (nameA < nameB) return -1;
        if (nameA > nameB) return 1;
        
        // If names are the same, sort by surname
        const surnameA = a.surName.toLowerCase();
        const surnameB = b.surName.toLowerCase();
        
        if (surnameA < surnameB) return -1;
        if (surnameA > surnameB) return 1;
        
        return 0;
      });
      
      // If we have filters but API doesn't support them, filter locally
      if (filters.search || (filters.rating && filters.rating !== 'all')) {
        filterClients(filters);
      } else {
        renderClients(currentClients);
      }
    } catch (error) {
      console.error('Помилка завантаження клієнтів:', error);
      showMessage('error', 'Не вдалося завантажити клієнтів. Будь ласка, спробуйте пізніше.');
    } finally {
      hideLoader(clientsLoader, clientsList);
    }
  }
  
  // Filter clients locally
  function filterClients(filters) {
    let filteredClients = [...currentClients];
    
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filteredClients = filteredClients.filter(client => 
        client.name.toLowerCase().includes(searchTerm) || 
        client.surName.toLowerCase().includes(searchTerm) || 
        client.phoneNum.includes(searchTerm)
      );
    }
    
    if (filters.rating && filters.rating !== 'all') {
      const minRating = parseInt(filters.rating);
      filteredClients = filteredClients.filter(client => 
        client.trustRating >= minRating
      );
    }
    
    renderClients(filteredClients);
  }
  
  // Render clients to the DOM
  function renderClients(clients) {
    if (clients.length === 0) {
      clientsList.innerHTML = '<div class="no-data">Клієнтів не знайдено. Створіть нового клієнта, щоб почати.</div>';
      return;
    }
    
    clientsList.innerHTML = '';
    
    clients.forEach(client => {
      const card = document.createElement('div');
      card.className = 'data-card client-card';
      
      // Generate star rating HTML
      let starsHtml = '';
      for (let i = 1; i <= 5; i++) {
        if (i <= client.trustRating) {
          starsHtml += '<i class="fas fa-star"></i> ';
        } else {
          starsHtml += '<i class="far fa-star"></i> ';
        }
      }
      
      card.innerHTML = `
        <div class="data-info">
          <div class="client-name">
            <h3>${client.name} ${client.surName}</h3>
            <div class="client-rating">${starsHtml}</div>
          </div>
          <div class="client-contact">
            <div><i class="fas fa-phone"></i> ${client.phoneNum}</div>
            ${client.instagram ? `<div><i class="fab fa-instagram"></i> ${client.instagram}</div>` : ''}
          </div>
        </div>
        <div class="data-actions">
          <button class="btn btn-secondary btn-sm view-btn" data-id="${client._id}"><i class="fas fa-eye"></i></button>
          <button class="btn btn-secondary btn-sm edit-btn" data-id="${client._id}"><i class="fas fa-edit"></i></button>
          <button class="btn btn-danger btn-sm delete-btn" data-id="${client._id}"><i class="fas fa-trash"></i></button>
        </div>
      `;
      
      // Add event listeners
      card.querySelector('.view-btn').addEventListener('click', () => {
        viewClientDetails(client._id);
      });
      
      card.querySelector('.edit-btn').addEventListener('click', () => {
        editClient(client._id);
      });
      
      card.querySelector('.delete-btn').addEventListener('click', () => {
        deleteClient(client._id);
      });
      
      clientsList.appendChild(card);
    });
  }
  
  // Set up event listeners
  function setupEventListeners() {
    // Form submission - only add if form exists
    if (clientForm) {
      clientForm.addEventListener('submit', handleFormSubmit);
    } else {
      console.warn('Client form not found in DOM');
    }
    
    // Filter changes - only add if elements exist
    if (clientSearch) {
      clientSearch.addEventListener('input', debounce(() => {
        applyFilters();
      }, 300));
    }
    
    if (ratingFilter) {
      ratingFilter.addEventListener('change', applyFilters);
    }
    
    if (clearFiltersBtn) {
      clearFiltersBtn.addEventListener('click', clearFilters);
    }
    
    // Client detail action buttons
    if (editClientBtn) {
      editClientBtn.addEventListener('click', () => {
        if (selectedClient) {
          editClient(selectedClient._id);
          closeModal(clientDetailModal);
        }
      });
    }
    
    if (newAppointmentForClientBtn) {
      newAppointmentForClientBtn.addEventListener('click', () => {
        if (selectedClient) {
          // Use router for SPA navigation if available
          if (window.router) {
            window.router.navigateTo('/');
            // Store client ID in sessionStorage to use after navigation
            sessionStorage.setItem('selectedClientId', selectedClient._id);
            sessionStorage.setItem('createNewAppointment', 'true');
          } else {
            // Fall back to traditional navigation
            window.location.href = `/?new=true&client=${selectedClient._id}`;
          }
        }
      });
    }
    
    if (deleteClientBtn) {
      deleteClientBtn.addEventListener('click', () => {
        if (selectedClient) {
          deleteClient(selectedClient._id);
          closeModal(clientDetailModal);
        }
      });
    }
  }
  
  // Apply filters
  function applyFilters() {
    const filters = {
      search: clientSearch.value,
      rating: ratingFilter.value
    };
    
    loadClients(filters);
  }
  
  // Clear filters
  function clearFilters() {
    clientSearch.value = '';
    ratingFilter.value = 'all';
    loadClients();
  }
  
  // View client details
  async function viewClientDetails(id) {
    try {
      const [clientResponse, appointmentsResponse] = await Promise.all([
        fetch(`${API.clients}/${id}`),
        fetch(`${API.appointments}?clientId=${id}`)
      ]);
      
      if (!clientResponse.ok || !appointmentsResponse.ok) {
        throw new Error(`HTTP error! Status: ${clientResponse.status || appointmentsResponse.status}`);
      }
      
      const client = await clientResponse.json();
      const appointments = await appointmentsResponse.json();
      
      selectedClient = client;
      
      // Generate star rating HTML
      let starsHtml = '';
      for (let i = 1; i <= 5; i++) {
        if (i <= client.trustRating) {
          starsHtml += '<i class="fas fa-star"></i> ';
        } else {
          starsHtml += '<i class="far fa-star"></i> ';
        }
      }
      
      // Populate client details
      clientDetails.innerHTML = `
        <div class="detail-row">
          <div class="detail-label">Ім'я:</div>
          <div class="detail-value">${client.name} ${client.surName}</div>
        </div>
        <div class="detail-row">
          <div class="detail-label">Телефон:</div>
          <div class="detail-value"><i class="fas fa-phone"></i> ${client.phoneNum}</div>
        </div>
        ${client.instagram ? `
        <div class="detail-row">
          <div class="detail-label">Instagram:</div>
          <div class="detail-value"><i class="fab fa-instagram"></i> ${client.instagram}</div>
        </div>
        ` : ''}
        <div class="detail-row">
          <div class="detail-label">Рейтинг довіри:</div>
          <div class="detail-value">${starsHtml}</div>
        </div>
      `;
      
      // Populate appointment history
      if (appointments.length === 0) {
        clientAppointments.innerHTML = '<div class="no-data">Історії відвідувань ще немає.</div>';
      } else {
        clientAppointments.innerHTML = '';
        
        // Sort appointments by date (newest first)
        appointments.sort((a, b) => new Date(b.time) - new Date(a.time));
        
        appointments.forEach(appointment => {
          const procedure = appointment.procedureId && typeof appointment.procedureId === 'object'
            ? appointment.procedureId.name
            : 'Процедура';
          
          const appDate = new Date(appointment.time);
          
          const appointmentItem = document.createElement('div');
          appointmentItem.className = 'appointment-item';
          appointmentItem.innerHTML = `
            <div class="appointment-date">${formatDate(appDate)} - ${formatTime(appDate)}</div>
            <div class="appointment-procedure">${procedure}</div>
            <div class="appointment-price">💰 ${appointment.finalPrice || appointment.price} грн</div>
            <div class="appointment-status status-${appointment.status}">
              ${getStatusEmoji(appointment.status)} ${getStatusText(appointment.status)}
            </div>
          `;
          
          clientAppointments.appendChild(appointmentItem);
        });
      }
      
      openModal(clientDetailModal);
    } catch (error) {
      console.error('Помилка перегляду деталей клієнта:', error);
      showMessage('error', 'Не вдалося завантажити деталі клієнта. Будь ласка, спробуйте пізніше.');
    }
  }
  
  // Edit client
  async function editClient(id) {
    try {
      const response = await fetch(`${API.clients}/${id}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const client = await response.json();
      
      modalTitle.textContent = 'Редагувати клієнта';
      currentClientId = id;
      
      // Fill form with client data
      document.getElementById('client-name').value = client.name;
      document.getElementById('client-surname').value = client.surName;
      document.getElementById('client-phone').value = client.phoneNum;
      document.getElementById('client-instagram').value = client.instagram || '';
      document.getElementById('client-trust-rating').value = client.trustRating;
      
      openModal(clientModal);
    } catch (error) {
      console.error('Помилка редагування клієнта:', error);
      showMessage('error', 'Не вдалося редагувати клієнта. Будь ласка, спробуйте пізніше.');
    }
  }
  
  // Delete client
  async function deleteClient(id) {
    if (!confirm('Ви впевнені, що хочете видалити цього клієнта? Це також видалить усі пов\'язані записи.')) {
      return;
    }
    
    try {
      const response = await fetch(`${API.clients}/${id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      showMessage('success', 'Клієнта успішно видалено!');
      loadClients();
    } catch (error) {
      console.error('Помилка видалення клієнта:', error);
      showMessage('error', 'Не вдалося видалити клієнта. Будь ласка, спробуйте пізніше.');
    }
  }
  
  // Handle form submission
  async function handleFormSubmit(e) {
    e.preventDefault();
    
    try {
      const formData = new FormData(clientForm);
      const clientData = {
        name: formData.get('name'),
        surName: formData.get('surName'),
        phoneNum: formData.get('phoneNum'),
        instagram: formData.get('instagram'),
        trustRating: parseInt(formData.get('trustRating'))
      };
      
      let url = API.clients;
      let method = 'POST';
      
      // If editing an existing client
      if (currentClientId) {
        url = `${API.clients}/${currentClientId}`;
        method = 'PUT';
      }
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(clientData)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      closeModal(clientModal);
      showMessage('success', `Клієнта успішно ${currentClientId ? 'оновлено' : 'створено'}!`);
      loadClients();
    } catch (error) {
      console.error('Помилка збереження клієнта:', error);
      showMessage('error', 'Не вдалося зберегти клієнта. Будь ласка, спробуйте пізніше.');
    }
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
}

// For direct loading of the file
document.addEventListener('DOMContentLoaded', () => {
  // Only initialize if this page is being shown directly (not via router)
  if (!window.router) {
    initClients();
  }
});