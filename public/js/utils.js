/**
 * Утиліти та спільні функції для використання в усьому додатку
 */

// Показати повідомлення користувачу
function showMessage(type, message) {
    // Перевірка, чи існує контейнер повідомлень
    let messageContainer = document.querySelector('.message-container');
    
    // Створюємо, якщо не існує
    if (!messageContainer) {
      messageContainer = document.createElement('div');
      messageContainer.className = 'message-container';
      document.body.appendChild(messageContainer);
    }
    
    // Створення елемента повідомлення
    const messageElement = document.createElement('div');
    messageElement.className = `message message-${type}`;
    messageElement.textContent = message;
    
    // Додавання кнопки закриття
    const closeButton = document.createElement('span');
    closeButton.className = 'message-close';
    closeButton.innerHTML = '&times;';
    closeButton.addEventListener('click', () => {
      messageElement.remove();
    });
    
    messageElement.appendChild(closeButton);
    messageContainer.appendChild(messageElement);
    
    // Автоматичне видалення через 5 секунд
    setTimeout(() => {
      if (messageElement.parentNode) {
        messageElement.remove();
      }
    }, 5000);
  }
  
  // Відкриття модального вікна (узагальнено для будь-якого модального вікна)
  function openModal(modal) {
    if (!modal) return;
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
  }
  
  // Обробник закриття модального вікна (узагальнено для будь-якого модального вікна)
  function closeModal(modal) {
    if (!modal) return;
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
  }
  
  // Функція для відстрочки виконання (корисно для пошуку)
  function debounce(func, delay) {
    let timeout;
    return function() {
      const context = this;
      const args = arguments;
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(context, args), delay);
    };
  }
  
  // Показати анімацію завантаження для елемента
  function showLoader(loaderElement, contentElement) {
    if (loaderElement) {
      loaderElement.style.display = 'flex';
    }
    if (contentElement) {
      contentElement.style.display = 'none';
    }
  }
  
  // Сховати анімацію завантаження
  function hideLoader(loaderElement, contentElement) {
    if (loaderElement) {
      loaderElement.style.display = 'none';
    }
    if (contentElement) {
      contentElement.style.display = 'block';
    }
  }
  
  // Форматування дати для відображення
  function formatDate(date) {
    const options = { day: 'numeric', month: 'short', year: 'numeric' };
    return date.toLocaleDateString('uk-UA', options);
  }
  
  // Форматування часу для відображення
  function formatTime(date) {
    return date.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' });
  }
  
  // Отримання ISO формату дати (YYYY-MM-DD)
  function formatISODate(date) {
    return date.toISOString().split('T')[0];
  }
  
  // Отримання назви дня тижня
  function getDayName(date) {
    return date.toLocaleDateString('uk-UA', { weekday: 'long' });
  }
  
  // Отримання назви місяця
  function getMonthName(month) {
    const date = new Date();
    date.setMonth(month);
    return date.toLocaleDateString('uk-UA', { month: 'long' });
  }
  
  // Перевірка, чи дві дати представляють один і той самий день
  function isSameDay(date1, date2) {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
  }
  
  // Ініціалізація FAB (Плаваючої кнопки дій)
  function initFAB() {
    const fabMain = document.querySelector('.fab-main');
    const fabOptions = document.querySelector('.fab-options');
    
    if (fabMain && fabOptions) {
      // Додаємо обробник кліку на головну кнопку FAB
      fabMain.addEventListener('click', (e) => {
        e.stopPropagation(); // Запобігаємо поширенню події
        fabMain.classList.toggle('active');
        fabOptions.classList.toggle('active');
      });
      
      // Закривати FAB при кліку поза ним
      document.addEventListener('click', (e) => {
        if (!e.target.closest('.fab-container') && 
            fabOptions.classList.contains('active')) {
          fabMain.classList.remove('active');
          fabOptions.classList.remove('active');
        }
      });
      
      // Анімація показу опцій
      const fabOptionElements = document.querySelectorAll('.fab-option');
      fabOptionElements.forEach((option, index) => {
        option.addEventListener('click', (e) => {
          e.stopPropagation(); // Запобігаємо поширенню події
        });
      });
    }
  }
  
  // Активація кнопок модальних вікон в FAB
  function setupFABActions() {
    const currentPage = window.location.pathname;
    
    // Налаштування відкриття відповідного модального вікна для нового призначення
    const appointmentButton = document.querySelector('.fab-option-primary');
    if (appointmentButton && (currentPage === '/' || currentPage.includes('/index.html'))) {
      appointmentButton.addEventListener('click', () => {
        const modal = document.getElementById('appointment-modal');
        if (modal) {
          document.getElementById('modal-title').textContent = 'Новий запис';
          // Очищаємо форму
          document.getElementById('appointment-form').reset();
          // Встановлюємо сьогоднішню дату за замовчуванням
          const today = new Date().toISOString().split('T')[0];
          document.getElementById('appointment-date').value = today;
          // Показуємо модальне вікно
          openModal(modal);
        }
      });
    }
    
    // Налаштування відкриття відповідного модального вікна для нового клієнта
    const clientButton = document.querySelector('.fab-option-client');
    if (clientButton && currentPage.includes('/clients.html')) {
      clientButton.addEventListener('click', () => {
        const modal = document.getElementById('client-modal');
        if (modal) {
          document.getElementById('client-modal-title').textContent = 'Новий клієнт';
          document.getElementById('client-form').reset();
          openModal(modal);
        }
      });
    }
    
    // Налаштування відкриття відповідного модального вікна для нової процедури
    const procedureButton = document.querySelector('.fab-option-procedure');
    if (procedureButton && currentPage.includes('/procedures.html')) {
      procedureButton.addEventListener('click', () => {
        const modal = document.getElementById('procedure-modal');
        if (modal) {
          document.getElementById('procedure-modal-title').textContent = 'Нова процедура';
          document.getElementById('procedure-form').reset();
          openModal(modal);
        }
      });
    }
  
    // Налаштування перенаправлення на сторінки для опцій, які не на поточній сторінці
    const allFabOptions = document.querySelectorAll('.fab-option');
    allFabOptions.forEach(option => {
      if (!option.classList.contains('fab-option-primary')) {
        if (option.classList.contains('fab-option-client') && !currentPage.includes('/clients.html')) {
          option.addEventListener('click', () => {
            window.location.href = '/clients.html?new=true';
          });
        } else if (option.classList.contains('fab-option-procedure') && !currentPage.includes('/procedures.html')) {
          option.addEventListener('click', () => {
            window.location.href = '/procedures.html?new=true';
          });
        } else if ((!option.classList.contains('fab-option-client') && !option.classList.contains('fab-option-procedure')) 
                  && !(currentPage === '/' || currentPage.includes('/index.html'))) {
          option.addEventListener('click', () => {
            window.location.href = '/?new=true';
          });
        }
      }
    });
  }
  
  // Ініціалізація закриття модальних вікон
  function initModalClose() {
    // Закриття модальних вікон при кліку на кнопку закриття
    const closeModalButtons = document.querySelectorAll('.close-modal');
    closeModalButtons.forEach(button => {
      button.addEventListener('click', function() {
        const modal = this.closest('.modal');
        closeModal(modal);
      });
    });
    
    // Закриття модальних вікон при кліку на кнопку "Скасувати"
    const closeButtons = document.querySelectorAll('.close-btn');
    closeButtons.forEach(button => {
      button.addEventListener('click', function() {
        const modal = this.closest('.modal');
        closeModal(modal);
      });
    });
    
    // Закриття модальних вікон при кліку на задній фон
    window.addEventListener('click', (e) => {
      if (e.target.classList.contains('modal')) {
        closeModal(e.target);
      }
    });
  }
  
  // Ініціалізація спільних функцій при завантаженні документа
  document.addEventListener('DOMContentLoaded', () => {
    initFAB();
    setupFABActions();
    initModalClose();
    
    // Перевірка URL параметрів для відкриття модальних вікон
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('new') === 'true') {
      const currentPage = window.location.pathname;
      
      setTimeout(() => {
        if (currentPage.includes('/clients.html')) {
          const modal = document.getElementById('client-modal');
          if (modal) {
            document.getElementById('client-modal-title').textContent = 'Новий клієнт';
            document.getElementById('client-form').reset();
            openModal(modal);
          }
        } else if (currentPage.includes('/procedures.html')) {
          const modal = document.getElementById('procedure-modal');
          if (modal) {
            document.getElementById('procedure-modal-title').textContent = 'Нова процедура';
            document.getElementById('procedure-form').reset();
            openModal(modal);
          }
        } else if (currentPage === '/' || currentPage.includes('/index.html')) {
          const modal = document.getElementById('appointment-modal');
          if (modal) {
            document.getElementById('modal-title').textContent = 'Новий запис';
            document.getElementById('appointment-form').reset();
            const today = new Date().toISOString().split('T')[0];
            document.getElementById('appointment-date').value = today;
            openModal(modal);
          }
        }
      }, 500);
    }
  });