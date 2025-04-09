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
  
  // Set active nav link
  const currentPath = window.location.pathname;
  const navItems = document.querySelectorAll('.nav-links a');
  
  navItems.forEach(item => {
    const itemPath = item.getAttribute('href');
    if (currentPath === itemPath || 
        (currentPath === '/' && itemPath === '/') || 
        (currentPath.includes(itemPath) && itemPath !== '/')) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });

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
    
    // Configure primary FAB action based on current page
    const currentPage = window.location.pathname;
    const primaryFabOption = document.querySelector('.fab-option-primary');
    
    if (primaryFabOption) {
      const primaryIcon = primaryFabOption.querySelector('i');
      const primaryLabel = primaryFabOption.querySelector('.fab-option-label');
      
      if (currentPage.includes('/clients.html')) {
        primaryIcon.className = 'fas fa-user-plus';
        primaryLabel.textContent = 'New Client';
        primaryFabOption.addEventListener('click', () => {
          openNewClientModal();
        });
      } else if (currentPage.includes('/procedures.html')) {
        primaryIcon.className = 'fas fa-spa';
        primaryLabel.textContent = 'New Procedure';
        primaryFabOption.addEventListener('click', () => {
          openNewProcedureModal();
        });
      } else {
        // Default to appointments
        primaryIcon.className = 'fas fa-calendar-plus';
        primaryLabel.textContent = 'New Appointment';
        primaryFabOption.addEventListener('click', () => {
          openNewAppointmentModal();
        });
      }
    }
    
    // Setup secondary FAB actions
    const clientFabOption = document.querySelector('.fab-option-client');
    if (clientFabOption) {
      clientFabOption.addEventListener('click', () => {
        window.location.href = '/clients.html?new=true';
      });
    }
    
    const procedureFabOption = document.querySelector('.fab-option-procedure');
    if (procedureFabOption) {
      procedureFabOption.addEventListener('click', () => {
        window.location.href = '/procedures.html?new=true';
      });
    }
  }
  
  // Helper functions for opening modals
  function openNewAppointmentModal() {
    const modal = document.getElementById('appointment-modal');
    if (modal) {
      document.getElementById('modal-title').textContent = 'New Appointment';
      // Reset the form
      document.getElementById('appointment-form').reset();
      // Set default date to today
      const today = new Date().toISOString().split('T')[0];
      document.getElementById('appointment-date').value = today;
      // Show the modal
      modal.style.display = 'block';
      document.body.style.overflow = 'hidden';
    } else {
      window.location.href = '/?new=true';
    }
  }
  
  function openNewClientModal() {
    const modal = document.getElementById('client-modal');
    if (modal) {
      document.getElementById('client-modal-title').textContent = 'New Client';
      document.getElementById('client-form').reset();
      modal.style.display = 'block';
      document.body.style.overflow = 'hidden';
    } else {
      window.location.href = '/clients.html?new=true';
    }
  }
  
  function openNewProcedureModal() {
    const modal = document.getElementById('procedure-modal');
    if (modal) {
      document.getElementById('procedure-modal-title').textContent = 'New Procedure';
      document.getElementById('procedure-form').reset();
      modal.style.display = 'block';
      document.body.style.overflow = 'hidden';
    } else {
      window.location.href = '/procedures.html?new=true';
    }
  }
  
  // Check URL params to see if we should open a modal
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('new') === 'true') {
    const currentPage = window.location.pathname;
    
    if (currentPage.includes('/clients.html')) {
      setTimeout(openNewClientModal, 500);
    } else if (currentPage.includes('/procedures.html')) {
      setTimeout(openNewProcedureModal, 500);
    } else if (currentPage === '/' || currentPage.includes('/index.html')) {
      setTimeout(openNewAppointmentModal, 500);
    }
  }
});
