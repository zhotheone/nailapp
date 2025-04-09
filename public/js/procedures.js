document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const proceduresList = document.getElementById('procedures-list');
  const proceduresLoader = document.getElementById('procedures-loader');
  const procedureModal = document.getElementById('procedure-modal');
  const procedureForm = document.getElementById('procedure-form');
  const modalTitle = document.getElementById('procedure-modal-title');
  const closeModal = document.querySelector('.close-modal');
  const closeBtn = document.querySelector('.close-btn');
  const procedureSearch = document.getElementById('procedure-search');
  const priceFilter = document.getElementById('price-filter');
  const clearFiltersBtn = document.getElementById('clear-procedure-filters');
  
  // Global variables
  let currentProcedures = [];
  let currentProcedureId = null;
  
  // API endpoint
  const API = {
    procedures: '/api/procedures'
  };
  
  // Initialize the page
  init();
  
  // Initialize function
  async function init() {
    try {
      await loadProcedures();
      setupEventListeners();
    } catch (error) {
      console.error('Initialization error:', error);
      showMessage('error', 'Failed to initialize the application. Please try again later.');
    }
  }
  
  // Load procedures from API
  async function loadProcedures(filters = {}) {
    showLoader();
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
      console.error('Error loading procedures:', error);
      showMessage('error', 'Failed to load procedures. Please try again later.');
    } finally {
      hideLoader();
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
      proceduresList.innerHTML = '<div class="no-data">No procedures found. Create a new procedure to get started.</div>';
      return;
    }
    
    proceduresList.innerHTML = '';
    
    procedures.forEach(procedure => {
      const card = document.createElement('div');
      card.className = 'data-card procedure-card';
      
      // Format time as hours and minutes
      const hours = Math.floor(procedure.timeToComplete / 60);
      const minutes = procedure.timeToComplete % 60;
      let timeString = '';
      
      if (hours > 0) {
        timeString += `${hours} hour${hours > 1 ? 's' : ''}`;
      }
      
      if (minutes > 0) {
        timeString += `${hours > 0 ? ' ' : ''}${minutes} minute${minutes > 1 ? 's' : ''}`;
      }
      
      card.innerHTML = `
        <div class="data-info">
          <div class="procedure-name">
            <h3>${procedure.name}</h3>
          </div>
          <div class="procedure-details">
            <div class="procedure-price"><i class="fas fa-tag"></i> $${procedure.price.toFixed(2)}</div>
            <div class="procedure-time"><i class="far fa-clock"></i> ${timeString}</div>
          </div>
        </div>
        <div class="data-actions">
          <button class="btn btn-secondary btn-sm edit-btn" data-id="${procedure._id}">Edit</button>
          <button class="btn btn-danger btn-sm delete-btn" data-id="${procedure._id}">Delete</button>
        </div>
      `;
      
      // Add event listeners
      card.querySelector('.edit-btn').addEventListener('click', () => {
        editProcedure(procedure._id);
      });
      
      card.querySelector('.delete-btn').addEventListener('click', () => {
        deleteProcedure(procedure._id);
      });
      
      proceduresList.appendChild(card);
    });
  }
  
  // Set up event listeners
  function setupEventListeners() {
    // Close modal buttons
    closeModal.addEventListener('click', closeModalHandler);
    closeBtn.addEventListener('click', closeModalHandler);
    
    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
      if (e.target === procedureModal) {
        closeModalHandler();
      }
    });
    
    // Form submission
    procedureForm.addEventListener('submit', handleFormSubmit);
    
    // Filter changes
    procedureSearch.addEventListener('input', debounce(() => {
      applyFilters();
    }, 300));
    
    priceFilter.addEventListener('change', applyFilters);
    clearFiltersBtn.addEventListener('click', clearFilters);
    
    // Modal open from FAB is handled in navbar.js
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
  
  // Edit procedure
  async function editProcedure(id) {
    try {
      const response = await fetch(`${API.procedures}/${id}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const procedure = await response.json();
      
      modalTitle.textContent = 'Edit Procedure';
      currentProcedureId = id;
      
      // Fill form with procedure data
      document.getElementById('procedure-name').value = procedure.name;
      document.getElementById('procedure-price').value = procedure.price;
      document.getElementById('procedure-time').value = procedure.timeToComplete;
      
      openModal();
    } catch (error) {
      console.error('Error editing procedure:', error);
      showMessage('error', 'Failed to edit procedure. Please try again later.');
    }
  }
  
  // Delete procedure
  async function deleteProcedure(id) {
    if (!confirm('Are you sure you want to delete this procedure? This will also affect any appointments using this procedure.')) {
      return;
    }
    
    try {
      const response = await fetch(`${API.procedures}/${id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      showMessage('success', 'Procedure deleted successfully!');
      loadProcedures();
    } catch (error) {
      console.error('Error deleting procedure:', error);
      showMessage('error', 'Failed to delete procedure. Please try again later.');
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
      
      closeModalHandler();
      showMessage('success', `Procedure ${currentProcedureId ? 'updated' : 'created'} successfully!`);
      loadProcedures();
    } catch (error) {
      console.error('Error saving procedure:', error);
      showMessage('error', 'Failed to save procedure. Please try again later.');
    }
  }
  
  // Helper functions
  function showLoader() {
    proceduresLoader.style.display = 'flex';
    proceduresList.style.display = 'none';
  }
  
  function hideLoader() {
    proceduresLoader.style.display = 'none';
    proceduresList.style.display = 'block';
  }
  
  function openModal() {
    procedureModal.style.display = 'block';
    document.body.style.overflow = 'hidden';
  }
  
  function closeModalHandler() {
    procedureModal.style.display = 'none';
    document.body.style.overflow = 'auto';
    procedureForm.reset();
    currentProcedureId = null;
  }
  
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
  
  // Debounce function for search input
  function debounce(func, delay) {
    let timeout;
    return function() {
      const context = this;
      const args = arguments;
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(context, args), delay);
    };
  }
});
