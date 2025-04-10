/**
 * Simple client-side router for single page application
 */

class Router {
  constructor() {
    this.routes = {};
    this.currentRoute = '';
    this.defaultRoute = '';
    this.contentContainers = {};
    
    // Handle forward/back browser navigation
    window.addEventListener('popstate', (e) => {
      if (e.state?.route) {
        this.navigateTo(e.state.route, false);
      }
    });
  }
  
  // Register a route and its associated content container
  register(route, contentId, initFunction) {
    this.routes[route] = {
      contentId: contentId,
      init: initFunction || (() => {})
    };
    
    // Store the container element reference
    const container = document.getElementById(contentId);
    if (container) {
      this.contentContainers[contentId] = container;
    } else {
      console.warn(`Container with ID ${contentId} not found for route ${route}`);
    }
    
    // Set first registered route as default
    if (!this.defaultRoute) {
      this.defaultRoute = route;
    }
    
    return this;
  }
  
  // Set a default route
  setDefault(route) {
    this.defaultRoute = route;
    return this;
  }
  
  // Navigate to a specific route
  navigateTo(route, updateHistory = true) {
    if (!this.routes[route]) {
      console.error(`Route not found: ${route}`);
      route = this.defaultRoute;
    }
    
    const targetRoute = this.routes[route];
    
    // Hide all content containers
    Object.values(this.contentContainers).forEach(container => {
      container.style.display = 'none';
    });
    
    // Show the target container
    if (this.contentContainers[targetRoute.contentId]) {
      this.contentContainers[targetRoute.contentId].style.display = 'block';
    } else {
      console.error(`Container with ID ${targetRoute.contentId} not found`);
      return this;
    }
    
    // Update active class in navigation
    this.updateNavigation(route);
    
    // Update browser history
    if (updateHistory) {
      window.history.pushState({ route }, '', route);
    }
    
    // Run initialization function if provided
    if (targetRoute.init && typeof targetRoute.init === 'function') {
      try {
        targetRoute.init();
      } catch (error) {
        console.error(`Error initializing route ${route}:`, error);
      }
    }
    
    this.currentRoute = route;
    
    // Dispatch a custom event
    document.dispatchEvent(new CustomEvent('route-changed', { 
      detail: { route, previousRoute: this.currentRoute } 
    }));
    
    return this;
  }
  
  // Update navigation active states
  updateNavigation(route) {
    const navLinks = document.querySelectorAll('.nav-links a');
    
    navLinks.forEach(link => {
      // Remove active class from all links
      link.classList.remove('active');
      
      // Get route from data attribute or href
      const linkRoute = link.getAttribute('data-route') || link.getAttribute('href');
      
      // Add active class to current route link
      if (linkRoute === route) {
        link.classList.add('active');
      }
    });
  }
  
  // Initialize the router
  init() {
    // Get current path or use default
    const currentPath = window.location.pathname;
    const routeExists = this.routes[currentPath];
    
    // Add click event listener to navigation links
    document.querySelectorAll('a[data-route]').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const route = link.getAttribute('data-route');
        this.navigateTo(route);
      });
    });
    
    // Navigate to current path or default route
    this.navigateTo(routeExists ? currentPath : this.defaultRoute);
    
    // Check for sessionStorage params that might have been set during navigation
    this.checkSessionParams();
    
    return this;
  }
  
  // Check for parameters stored in sessionStorage
  checkSessionParams() {
    const createNewAppointment = sessionStorage.getItem('createNewAppointment');
    
    if (createNewAppointment === 'true') {
      // Clear the flag to prevent repeated actions
      sessionStorage.removeItem('createNewAppointment');
      
      // Get any associated IDs
      const clientId = sessionStorage.getItem('selectedClientId');
      const procedureId = sessionStorage.getItem('selectedProcedureId');
      
      // Clean up session storage
      if (clientId) sessionStorage.removeItem('selectedClientId');
      if (procedureId) sessionStorage.removeItem('selectedProcedureId');
      
      // Call the appropriate function with a delay to ensure the page is ready
      setTimeout(() => {
        if (typeof openNewAppointmentModal === 'function') {
          openNewAppointmentModal(clientId, procedureId);
        }
      }, 500);
    }
  }
}

// Create and export router instance
const router = new Router();

// Handle URL parameters for specific views
document.addEventListener('DOMContentLoaded', () => {
  // Add click handler to all internal links that should use the router
  document.querySelectorAll('a[data-route]').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const route = link.getAttribute('data-route');
      router.navigateTo(route);
    });
  });
  
  // Parse URL query parameters (for direct links with parameters)
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.has('new') && urlParams.get('new') === 'true') {
    // Handle new appointment/client/procedure based on current page
    const currentRoute = router.currentRoute;
    
    setTimeout(() => {
      if (currentRoute === '/' || currentRoute === '/index.html') {
        if (typeof openNewAppointmentModal === 'function') {
          const clientId = urlParams.get('client');
          const procedureId = urlParams.get('procedure');
          openNewAppointmentModal(clientId, procedureId);
        }
      } else if (currentRoute === '/clients.html' || currentRoute === '/clients') {
        if (typeof openNewClientModal === 'function') {
          openNewClientModal();
        }
      } else if (currentRoute === '/procedures.html' || currentRoute === '/procedures') {
        if (typeof openNewProcedureModal === 'function') {
          openNewProcedureModal();
        }
      }
    }, 500);
  }
});

window.router = router; // Make router globally available
