document.addEventListener('DOMContentLoaded', () => {
  const themeToggleBtn = document.getElementById('theme-toggle');
  const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');
  
  // Check for saved theme preference or use the system preference
  const currentTheme = localStorage.getItem('theme') || 
                      (prefersDarkScheme.matches ? 'dark' : 'light');
  
  // Set initial theme
  document.documentElement.setAttribute('data-theme', currentTheme);
  updateToggleButton(currentTheme);
  
  // Toggle theme when button is clicked
  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      let switchToTheme = document.documentElement.getAttribute('data-theme') === 'light' 
        ? 'dark' 
        : 'light';
      
      document.documentElement.setAttribute('data-theme', switchToTheme);
      localStorage.setItem('theme', switchToTheme);
      updateToggleButton(switchToTheme);
    });
  }
  
  // Update toggle button icon and text
  function updateToggleButton(theme) {
    if (!themeToggleBtn) return;
    
    if (theme === 'dark') {
      themeToggleBtn.innerHTML = '<i class="fas fa-sun"></i>';
      themeToggleBtn.title = 'Переключити на світлу тему';
    } else {
      themeToggleBtn.innerHTML = '<i class="fas fa-moon"></i>';
      themeToggleBtn.title = 'Переключити на темну тему';
    }
  }
});
