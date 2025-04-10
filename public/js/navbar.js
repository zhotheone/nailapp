document.addEventListener('DOMContentLoaded', () => {
  const burger = document.querySelector('.burger');
  const nav = document.querySelector('.nav-links');
  const navLinks = document.querySelectorAll('.nav-links li');
  
  // Toggle navigation menu - only if burger exists (desktop mode doesn't have it)
  if (burger) {
    burger.addEventListener('click', () => {
      // Toggle navigation
      nav.classList.toggle('nav-active');
      
      // Animate links
      navLinks.forEach((link, index) => {
        if (link.style.animation) {
          link.style.animation = '';
        } else {
          link.style.animation = `navLinkFade 0.5s ease forwards ${index / 7 + 0.3}s`;
        }
      });
      
      // Burger animation
      burger.classList.toggle('toggle');
    });
  }

  // Close menu when clicking outside - only if nav exists
  if (nav) {
    document.addEventListener('click', (e) => {
      if (nav.classList.contains('nav-active') && 
          !nav.contains(e.target) && 
          burger && !burger.contains(e.target)) {
        nav.classList.remove('nav-active');
        if (burger) burger.classList.remove('toggle');
        
        navLinks.forEach(link => {
          link.style.animation = '';
        });
      }
    });
  }
  
  // Set active nav link - managed by router now for SPA
  // No need to set active nav link here as the router handles it
  
  // FAB functionality
  const fabMain = document.querySelector('.fab-main');
  const fabOptions = document.querySelector('.fab-options');
  const fabOptionButtons = document.querySelectorAll('.fab-option');
  
  if (fabMain) {
    fabMain.addEventListener('click', () => {
      fabMain.classList.toggle('active');
      fabOptions.classList.toggle('active');
    });
    
    // Close FAB when clicking outside
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.fab-container') && 
          fabOptions.classList.contains('active')) {
        fabMain.classList.remove('active');
        fabOptions.classList.remove('active');
      }
    });
    
    // Configure primary FAB action based on current route
    updateFabActions();
  }
  
  // Update FAB actions based on current route
  function updateFabActions() {
    const currentRoute = window.router ? window.router.currentRoute : window.location.pathname;
    const primaryFabOption = document.querySelector('.fab-option-primary');
    
    if (primaryFabOption) {
      const primaryIcon = primaryFabOption.querySelector('i');
      const primaryLabel = primaryFabOption.querySelector('.fab-option-label');
      
      if (currentRoute.includes('/clients')) {
        primaryIcon.className = 'fas fa-user-plus';
        primaryLabel.textContent = 'Новий клієнт';
        primaryFabOption.addEventListener('click', openNewClientModal);
      } else if (currentRoute.includes('/procedures')) {
        primaryIcon.className = 'fas fa-spa';
        primaryLabel.textContent = 'Нова процедура';
        primaryFabOption.addEventListener('click', openNewProcedureModal);
      } else {
        // Default to appointments
        primaryIcon.className = 'fas fa-calendar-plus';
        primaryLabel.textContent = 'Новий запис';
        primaryFabOption.addEventListener('click', openNewAppointmentModal);
      }
    }
  }
  
  // Helper functions for opening modals
  function openNewAppointmentModal(clientId, procedureId) {
    const modal = document.getElementById('appointment-modal');
    if (modal) {
      document.getElementById('modal-title').textContent = 'Новий запис';
      // Reset the form
      document.getElementById('appointment-form').reset();
      // Set default date to today
      const today = new Date().toISOString().split('T')[0];
      document.getElementById('appointment-date').value = today;
      
      // Pre-select client if client ID is provided
      if (clientId && document.getElementById('client')) {
        document.getElementById('client').value = clientId;
      }
      
      // Pre-select procedure if procedure ID is provided
      if (procedureId && document.getElementById('procedure')) {
        const procedureSelect = document.getElementById('procedure');
        procedureSelect.value = procedureId;
        
        // Auto-fill price if procedure is selected
        const selectedOption = procedureSelect.options[procedureSelect.selectedIndex];
        if (selectedOption && selectedOption.dataset.price && document.getElementById('price')) {
          document.getElementById('price').value = selectedOption.dataset.price;
        }
      }
      
      // Show the modal
      openModal(modal);
    } else {
      if (window.router) {
        window.router.navigateTo('/');
        // Store parameters in sessionStorage for later use
        if (clientId) sessionStorage.setItem('selectedClientId', clientId);
        if (procedureId) sessionStorage.setItem('selectedProcedureId', procedureId);
        sessionStorage.setItem('createNewAppointment', 'true');
      } else {
        let url = '/?new=true';
        if (clientId) url += `&client=${clientId}`;
        if (procedureId) url += `&procedure=${procedureId}`;
        window.location.href = url;
      }
    }
  }
  
  function openNewClientModal() {
    const modal = document.getElementById('client-modal');
    if (modal) {
      document.getElementById('client-modal-title').textContent = 'Новий клієнт';
      document.getElementById('client-form').reset();
      openModal(modal);
    } else {
      if (window.router) {
        window.router.navigateTo('/clients');
        setTimeout(() => openNewClientModal(), 100);
      } else {
        window.location.href = '/clients.html?new=true';
      }
    }
  }
  
  function openNewProcedureModal() {
    const modal = document.getElementById('procedure-modal');
    if (modal) {
      document.getElementById('procedure-modal-title').textContent = 'Нова процедура';
      document.getElementById('procedure-form').reset();
      openModal(modal);
    } else {
      if (window.router) {
        window.router.navigateTo('/procedures');
        setTimeout(() => openNewProcedureModal(), 100);
      } else {
        window.location.href = '/procedures.html?new=true';
      }
    }
  }
  
  // Listen for route changes to update FAB
  if (window.router) {
    document.addEventListener('route-changed', updateFabActions);
  }
});
