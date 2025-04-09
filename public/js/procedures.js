document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const proceduresList = document.getElementById('procedures-list');
  const proceduresLoader = document.getElementById('procedures-loader');
  const procedureModal = document.getElementById('procedure-modal');
  const procedureForm = document.getElementById('procedure-form');
  const procedureDetailModal = document.getElementById('procedure-detail-modal');
  const procedureDetails = document.getElementById('procedure-details');
  const procedureUsage = document.getElementById('procedure-usage');
  const modalTitle = document.getElementById('procedure-modal-title');
  const procedureSearch = document.getElementById('procedure-search');
  const priceFilter = document.getElementById('price-filter');
  const clearFiltersBtn = document.getElementById('clear-procedure-filters');
  
  // Action buttons for procedure detail
  const editProcedureBtn = document.getElementById('edit-procedure-btn');
  const newAppointmentForProcedureBtn = document.getElementById('new-appointment-for-procedure-btn');
  const deleteProcedureBtn = document.getElementById('delete-procedure-btn');
  
  // Global variables
  let currentProcedures = [];
  let currentProcedureId = null;
  let selectedProcedure = null;
  
  // API endpoint
  const API = {
    procedures: '/api/procedures',
    appointments: '/api/appointments'
  };
  
  // Initialize the page
  init();
  
  // Initialize function
  async function init() {
    try {
      await loadProcedures();
      setupEventListeners();
    } catch (error) {
      console.error('Помилка ініціалізації:', error);
      showMessage('error', 'Не вдалося ініціалізувати додаток. Будь ласка, спробуйте пізніше.');
    }
  }
  
  // Load procedures from API
  async function loadProcedures(filters = {}) {
    showLoader(proceduresLoader, proceduresList);
    try {
      let url = API.procedures;
      
      // Add query parameters for filters if implemented on backend
      if (Object.keys(filters).length > 0) {
        const params = new URLSearchParams();
        
        if (filters.search) {
          params.append('search', filters.search);
        }
        
        if (filters.maxPrice) {
          params.append('maxPrice', filters.maxPrice);
        }
        
        url += `?${params.toString()}`;
      }
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const data = await response.json();
      currentProcedures = data;
      
      // If we have filters but API doesn't support them, filter locally
      if (filters.search || filters.maxPrice) {
        filterProcedures(filters);
      } else {
        renderProcedures(currentProcedures);
      }
    } catch (error) {
      console.error('Помилка завантаження процедур:', error);
      showMessage('error', 'Не вдалося завантажити процедури. Будь ласка, спробуйте пізніше.');
    } finally {
      hideLoader(proceduresLoader, proceduresList);
    }
  }
  
  // Filter procedures locally
  function filterProcedures(filters) {
    let filteredProcedures = [...currentProcedures];
    
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filteredProcedures = filteredProcedures.filter(procedure => 
        procedure.name.toLowerCase().includes(searchTerm)
      );
    }
    
    if (filters.maxPrice) {
      const maxPrice = parseFloat(filters.maxPrice);
      filteredProcedures = filteredProcedures.filter(procedure => 
        procedure.price <= maxPrice
      );
    }
    
    renderProcedures(filteredProcedures);
  }
  
  // Render procedures to the DOM
  function renderProcedures(procedures) {
    if (procedures.length === 0) {
      proceduresList.innerHTML = '<div class="no-data">Процедур не знайдено. Створіть нову процедуру, щоб почати.</div>';
      return;
    }
    
    proceduresList.innerHTML = '';
    
    procedures.forEach(procedure => {
      const card = document.createElement('div');
      card.className = 'data-card procedure-card';
      
      // Format time as hours and minutes
      const timeString = formatProcedureTime(procedure.timeToComplete);
      
      card.innerHTML = `
        <div class="data-info">
          <div class="procedure-name">
            <h3>${procedure.name}</h3>
          </div>
          <div class="procedure-details">
            <div class="procedure-price"><i class="fas fa-hryvnia"></i> ${procedure.price.toFixed(2)} грн</div>
            <div class="procedure-time"><i class="far fa-clock"></i> ${timeString}</div>
          </div>
        </div>
        <div class="data-actions">
          <button class="btn btn-secondary btn-sm view-btn" data-id="${procedure._id}"><i class="fas fa-eye"></i></button>
          <button class="btn btn-secondary btn-sm edit-btn" data-id="${procedure._id}"><i class="fas fa-edit"></i></button>
          <button class="btn btn-danger btn-sm delete-btn" data-id="${procedure._id}"><i class="fas fa-trash"></i></button>
        </div>
      `;
      
      // Add event listeners
      card.querySelector('.view-btn').addEventListener('click', () => {
        viewProcedureDetails(procedure._id);
      });
      
      card.querySelector('.edit-btn').addEventListener('click', () => {
        editProcedure(procedure._id);
      });
      
      card.querySelector('.delete-btn').addEventListener('click', () => {
        deleteProcedure(procedure._id);
      });
      
      proceduresList.appendChild(card);
    });
  }
  
  // Format procedure time
  function formatProcedureTime(minutes) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    let timeString = '';
    
    if (hours > 0) {
      timeString += `${hours} год.${hours > 1 ? '' : ''}`;
    }
    
    if (mins > 0) {
      timeString += `${hours > 0 ? ' ' : ''}${mins} хв.${mins > 1 ? '' : ''}`;
    }
    
    return timeString;
  }
  
  // Set up event listeners
  function setupEventListeners() {
    // Form submission
    procedureForm.addEventListener('submit', handleFormSubmit);
    
    // Filter changes
    procedureSearch.addEventListener('input', debounce(() => {
      applyFilters();
    }, 300));
    
    priceFilter.addEventListener('change', applyFilters);
    clearFiltersBtn.addEventListener('click', clearFilters);
    
    // Procedure detail action buttons
    if (editProcedureBtn) {
      editProcedureBtn.addEventListener('click', () => {
        if (selectedProcedure) {
          editProcedure(selectedProcedure._id);
          closeModal(procedureDetailModal);
        }
      });
    }
    
    if (newAppointmentForProcedureBtn) {
      newAppointmentForProcedureBtn.addEventListener('click', () => {
        if (selectedProcedure) {
          // Redirect to appointments page with procedure pre-selected
          window.location.href = `/?new=true&procedure=${selectedProcedure._id}`;
        }
      });
    }
    
    if (deleteProcedureBtn) {
      deleteProcedureBtn.addEventListener('click', () => {
        if (selectedProcedure) {
          deleteProcedure(selectedProcedure._id);
          closeModal(procedureDetailModal);
        }
      });
    }
  }
  
  // Apply filters
  function applyFilters() {
    const filters = {
      search: procedureSearch.value,
      maxPrice: priceFilter.value ? parseFloat(priceFilter.value) : null
    };
    
    loadProcedures(filters);
  }
  
  // Clear filters
  function clearFilters() {
    procedureSearch.value = '';
    priceFilter.value = '';
    loadProcedures();
  }
  
  // View procedure details
  async function viewProcedureDetails(id) {
    try {
      const [procedureResponse, appointmentsResponse] = await Promise.all([
        fetch(`${API.procedures}/${id}`),
        fetch(`${API.appointments}?procedureId=${id}`)
      ]);
      
      if (!procedureResponse.ok || !appointmentsResponse.ok) {
        throw new Error(`HTTP error! Status: ${procedureResponse.status || appointmentsResponse.status}`);
      }
      
      const procedure = await procedureResponse.json();
      const appointments = await appointmentsResponse.json();
      
      selectedProcedure = procedure;
      
      // Format time as hours and minutes
      const timeString = formatProcedureTime(procedure.timeToComplete);
      
      // Populate procedure details
      procedureDetails.innerHTML = `
        <div class="detail-row">
          <div class="detail-label">Назва:</div>
          <div class="detail-value">${procedure.name}</div>
        </div>
        <div class="detail-row">
          <div class="detail-label">Ціна:</div>
          <div class="detail-value">💰 ${procedure.price.toFixed(2)} грн</div>
        </div>
        <div class="detail-row">
          <div class="detail-label">Час виконання:</div>
          <div class="detail-value">⏱️ ${timeString}</div>
        </div>
        <div class="detail-row">
          <div class="detail-label">Кількість записів:</div>
          <div class="detail-value">📅 ${appointments.length}</div>
        </div>
      `;
      
      // Populate appointment history
      if (appointments.length === 0) {
        procedureUsage.innerHTML = '<div class="no-data">Історії використання ще немає.</div>';
      } else {
        procedureUsage.innerHTML = '';
        
        // Sort appointments by date (newest first)
        appointments.sort((a, b) => new Date(b.time) - new Date(a.time));
        
        appointments.forEach(appointment => {
          const client = appointment.clientId && typeof appointment.clientId === 'object'
            ? `${appointment.clientId.name} ${appointment.clientId.surName}`
            : 'Клієнт';
          
          const appDate = new Date(appointment.time);
          
          const usageItem = document.createElement('div');
          usageItem.className = 'usage-item';
          usageItem.innerHTML = `
            <div class="usage-date">${formatDate(appDate)} - ${formatTime(appDate)}</div>
            <div class="usage-client">${client}</div>
            <div class="usage-price">💰 ${appointment.finalPrice || appointment.price} грн</div>
            <div class="appointment-status status-${appointment.status}">
              ${getStatusEmoji(appointment.status)} ${getStatusText(appointment.status)}
            </div>
          `;
          
          procedureUsage.appendChild(usageItem);
        });
      }
      
      openModal(procedureDetailModal);
    } catch (error) {
      console.error('Помилка перегляду деталей процедури:', error);
      showMessage('error', 'Не вдалося завантажити деталі процедури. Будь ласка, спробуйте пізніше.');
    }
  }
  
  // Edit procedure
  async function editProcedure(id) {
    try {
      const response = await fetch(`${API.procedures}/${id}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const procedure = await response.json();
      
      modalTitle.textContent = 'Редагувати процедуру';
      currentProcedureId = id;
      
      // Fill form with procedure data
      document.getElementById('procedure-name').value = procedure.name;
      document.getElementById('procedure-price').value = procedure.price;
      document.getElementById('procedure-time').value = procedure.timeToComplete;
      
      openModal(procedureModal);
    } catch (error) {
      console.error('Помилка редагування процедури:', error);
      showMessage('error', 'Не вдалося редагувати процедуру. Будь ласка, спробуйте пізніше.');
    }
  }
  
  // Delete procedure
  async function deleteProcedure(id) {
    if (!confirm('Ви впевнені, що хочете видалити цю процедуру? Це також вплине на записи, які використовують цю процедуру.')) {
      return;
    }
    
    try {
      const response = await fetch(`${API.procedures}/${id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      showMessage('success', 'Процедуру успішно видалено!');
      loadProcedures();
    } catch (error) {
      console.error('Помилка видалення процедури:', error);
      showMessage('error', 'Не вдалося видалити процедуру. Будь ласка, спробуйте пізніше.');
    }
  }
  
  // Handle form submission
  async function handleFormSubmit(e) {
    e.preventDefault();
    
    try {
      const formData = new FormData(procedureForm);
      const procedureData = {
        name: formData.get('name'),
        price: parseFloat(formData.get('price')),
        timeToComplete: parseInt(formData.get('timeToComplete'))
      };
      
      let url = API.procedures;
      let method = 'POST';
      
      // If editing an existing procedure
      if (currentProcedureId) {
        url = `${API.procedures}/${currentProcedureId}`;
        method = 'PUT';
      }
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(procedureData)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      closeModal(procedureModal);
      showMessage('success', `Процедуру успішно ${currentProcedureId ? 'оновлено' : 'створено'}!`);
      loadProcedures();
    } catch (error) {
      console.error('Помилка збереження процедури:', error);
      showMessage('error', 'Не вдалося зберегти процедуру. Будь ласка, спробуйте пізніше.');
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
});