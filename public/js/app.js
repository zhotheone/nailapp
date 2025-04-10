document.addEventListener('DOMContentLoaded', () => {
  // Initialize the router with all available routes
  router
    .register('/', 'appointments-page', initAppointmentsPage)
    .register('/index.html', 'appointments-page', initAppointmentsPage)
    .register('/clients', 'clients-page', initClientsPage)
    .register('/clients.html', 'clients-page', initClientsPage)
    .register('/procedures', 'procedures-page', initProceduresPage)
    .register('/procedures.html', 'procedures-page', initProceduresPage)
    .register('/stats', 'stats-page', initStatsPage)
    .register('/stats.html', 'stats-page', initStatsPage)
    .setDefault('/')
    .init();
    
  // Each page initialization function calls the main init function of that page module
  function initAppointmentsPage() {
    if (typeof initAppointments === 'function') {
      initAppointments();
    }
  }
  
  function initClientsPage() {
    if (typeof initClients === 'function') {
      initClients();
    }
  }
  
  function initProceduresPage() {
    if (typeof initProcedures === 'function') {
      initProcedures();
    }
  }
  
  function initStatsPage() {
    if (typeof initStats === 'function') {
      initStats();
    }
  }

  addLogoutButton();
});

/**
 * Handle user logout
 */
async function handleLogout() {
  try {
    const response = await fetch('/api/auth/logout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      // Redirect to login page after logout
      window.location.href = '/login';
    } else {
      console.error('Logout failed');
      showMessage('error', 'Не вдалося вийти з системи. Спробуйте знову.');
    }
  } catch (error) {
    console.error('Logout error:', error);
    showMessage('error', 'Помилка під час виходу з системи');
  }
}

// Add a logout button to the navigation if it doesn't exist already
function addLogoutButton() {
  const nav = document.querySelector('nav');
  if (nav) {
    const logoutBtn = document.createElement('button');
    logoutBtn.className = 'logout-btn';
    logoutBtn.innerHTML = '<i class="fas fa-sign-out-alt"></i> Вийти';
    logoutBtn.addEventListener('click', handleLogout);
    
    nav.appendChild(logoutBtn);
  }
}
