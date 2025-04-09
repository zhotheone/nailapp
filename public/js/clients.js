document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const clientsList = document.getElementById('clients-list');
  const clientsLoader = document.getElementById('clients-loader');
  const clientModal = document.getElementById('client-modal');
  const clientForm = document.getElementById('client-form');
  const modalTitle = document.getElementById('client-modal-title');
  const closeModal = document.querySelector('.close-modal');
  const closeBtn = document.querySelector('.close-btn');
  const clientSearch = document.getElementById('client-search');
  const ratingFilter = document.getElementById('rating-filter');
  const clearFiltersBtn = document.getElementById('clear-client-filters');
  
  // Global variables
  let currentClients = [];
  let currentClientId = null;
  
  // API endpoint
  const API = {
    clients: '/api/clients'
  };
  
  // Initialize the page
  init();
  
  // Initialize function
  async function init() {
    try {
      await loadClients();
      setupEventListeners();
    } catch (error) {
      console.error('Initialization error:', error);
      showMessage('error', 'Failed to initialize the application. Please try again later.');
    }
  }
  
  // Load clients from API
  async function loadClients(filters = {}) {
    showLoader();
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
      
      // If we have filters but API doesn't support them, filter locally
      if (filters.search || (filters.rating && filters.rating !== 'all')) {
        filterClients(filters);
      } else {
        renderClients(currentClients);
      }
    } catch (error) {
      console.error('Error loading clients:', error);
      showMessage('error', 'Failed to load clients. Please try again later.');
    } finally {
      hideLoader();
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
      clientsList.innerHTML = '<div class="no-data">No clients found. Create a new client to get started.</div>';
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
          <button class="btn btn-secondary btn-sm edit-btn" data-id="${client._id}">Edit</button>
          <button class="btn btn-danger btn-sm delete-btn" data-id="${client._id}">Delete</button>
        </div>
      `;
      
      // Add event listeners
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
    // Close modal buttons
    closeModal.addEventListener('click', closeModalHandler);
    closeBtn.addEventListener('click', closeModalHandler);
    
    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
      if (e.target === clientModal) {
        closeModalHandler();
      }
    });
    
    // Form submission
    clientForm.addEventListener('submit', handleFormSubmit);
    
    // Filter changes
    clientSearch.addEventListener('input', debounce(() => {
      applyFilters();
    }, 300));
    
    ratingFilter.addEventListener('change', applyFilters);
    clearFiltersBtn.addEventListener('click', clearFilters);
    
    // Modal open from FAB is handled in navbar.js
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
  
  // Edit client
  async function editClient(id) {
    try {
      const response = await fetch(`${API.clients}/${id}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const client = await response.json();
      
      modalTitle.textContent = 'Edit Client';
      currentClientId = id;
      
      // Fill form with client data
      document.getElementById('client-name').value = client.name;
      document.getElementById('client-surname').value = client.surName;
      document.getElementById('client-phone').value = client.phoneNum;
      document.getElementById('client-instagram').value = client.instagram || '';
      document.getElementById('client-trust-rating').value = client.trustRating;
      
      openModal();
    } catch (error) {
      console.error('Error editing client:', error);
      showMessage('error', 'Failed to edit client. Please try again later.');
    }
  }
  
  // Delete client
  async function deleteClient(id) {
    if (!confirm('Are you sure you want to delete this client? This will also delete all associated appointments.')) {
      return;
    }
    
    try {
      const response = await fetch(`${API.clients}/${id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      showMessage('success', 'Client deleted successfully!');
      loadClients();
    } catch (error) {
      console.error('Error deleting client:', error);
      showMessage('error', 'Failed to delete client. Please try again later.');
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
      
      closeModalHandler();
      showMessage('success', `Client ${currentClientId ? 'updated' : 'created'} successfully!`);
      loadClients();
    } catch (error) {
      console.error('Error saving client:', error);
      showMessage('error', 'Failed to save client. Please try again later.');
    }
  }
  
  // Helper functions
  function showLoader() {
    clientsLoader.style.display = 'flex';
    clientsList.style.display = 'none';
  }
  
  function hideLoader() {
    clientsLoader.style.display = 'none';
    clientsList.style.display = 'block';
  }
  
  function openModal() {
    clientModal.style.display = 'block';
    document.body.style.overflow = 'hidden';
  }
  
  function closeModalHandler() {
    clientModal.style.display = 'none';
    document.body.style.overflow = 'auto';
    clientForm.reset();
    currentClientId = null;
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
