document.addEventListener('DOMContentLoaded', () => {
  // Check authentication status first
  checkAuthentication();
  
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
 * Check if user is authenticated
 */
async function checkAuthentication() {
  // Don't check on login page
  if (window.location.pathname === '/login') {
    return;
  }
  
  try {
    const response = await fetch('/api/auth/status');
    
    if (response.status === 401 || !response.ok) {
      // Redirect to login if not authenticated
      window.location.href = '/login';
      return;
    }
    
    const data = await response.json();
    if (!data.authenticated) {
      window.location.href = '/login';
    }
  } catch (error) {
    console.error('Authentication check failed:', error);
    // On error, redirect to login as a safety measure
    window.location.href = '/login';
  }
}

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
