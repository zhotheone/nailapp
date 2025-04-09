document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const statsLoader = document.getElementById('stats-loader');
  const statsContent = document.getElementById('stats-content');
  const totalClientsEl = document.getElementById('total-clients');
  const totalProceduresEl = document.getElementById('total-procedures');
  const totalAppointmentsEl = document.getElementById('total-appointments');
  const totalRevenueEl = document.getElementById('total-revenue');
  const popularProceduresList = document.getElementById('popular-procedures-list');
  const frequentClientsList = document.getElementById('frequent-clients-list');
  
  // Chart contexts
  const statusChartCtx = document.getElementById('status-chart').getContext('2d');
  const revenueChartCtx = document.getElementById('revenue-chart').getContext('2d');
  const retentionChartCtx = document.getElementById('retention-chart').getContext('2d');
  
  // Charts
  let statusChart, revenueChart, retentionChart;
  
  // API endpoints
  const API = {
    stats: '/api/stats',
    monthlyRevenue: '/api/stats/monthly-revenue',
    clientRetention: '/api/stats/client-retention'
  };
  
  // Chart colors (Rose Pine color scheme)
  const chartColors = {
    base: '#191724',
    surface: '#1f1d2e',
    overlay: '#26233a',
    muted: '#6e6a86',
    subtle: '#908caa',
    text: '#e0def4',
    love: '#eb6f92',
    gold: '#f6c177',
    rose: '#ebbcba',
    pine: '#31748f',
    foam: '#9ccfd8',
    iris: '#c4a7e7'
  };
  
  // Initialize the page
  init();
  
  // Initialize function
  async function init() {
    try {
      // Load all the data
      const [stats, monthlyRevenue, clientRetention] = await Promise.all([
        fetchStats(),
        fetchMonthlyRevenue(),
        fetchClientRetention()
      ]);
      
      // Update the UI with the data
      updateSummaryStats(stats);
      createStatusChart(stats.appointments);
      createRevenueChart(monthlyRevenue);
      createRetentionChart(clientRetention);
      renderPopularProcedures(stats.popularProcedures);
      renderFrequentClients(stats.frequentClients);
      
      // Show the stats content
      hideLoader(statsLoader, statsContent);
      statsContent.style.display = 'block';
    } catch (error) {
      console.error('Помилка ініціалізації сторінки статистики:', error);
      showMessage('error', 'Не вдалося завантажити статистику. Будь ласка, спробуйте пізніше.');
    }
  }
  
  // Fetch overall stats
  async function fetchStats() {
    const response = await fetch(API.stats);
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    return await response.json();
  }
  
  // Fetch monthly revenue data
  async function fetchMonthlyRevenue() {
    const response = await fetch(API.monthlyRevenue);
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    return await response.json();
  }
  
  // Fetch client retention data
  async function fetchClientRetention() {
    const response = await fetch(API.clientRetention);
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    return await response.json();
  }
  
  // Update the summary statistics
  function updateSummaryStats(stats) {
    totalClientsEl.textContent = stats.totalClients;
    totalProceduresEl.textContent = stats.totalProcedures;
    totalAppointmentsEl.textContent = stats.appointments.total;
    totalRevenueEl.textContent = `₴${stats.revenue.total.toFixed(2)}`;
  }
  
  // Create the appointment status chart
  function createStatusChart(appointmentStats) {
    const data = {
      labels: ['Очікує', 'Підтверджено', 'Завершено', 'Скасовано'],
      datasets: [{
        data: [
          appointmentStats.pending,
          appointmentStats.confirmed || 0, // Handle if not provided
          appointmentStats.completed,
          appointmentStats.cancelled
        ],
        backgroundColor: [
          chartColors.gold,
          chartColors.foam,
          chartColors.pine,
          chartColors.love
        ],
        borderColor: chartColors.surface,
        borderWidth: 2
      }]
    };
    
    const config = {
      type: 'doughnut',
      data: data,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: chartColors.text,
              font: {
                family: 'Fira Code',
                size: 12
              }
            }
          },
          tooltip: {
            backgroundColor: chartColors.overlay,
            titleColor: chartColors.text,
            bodyColor: chartColors.text,
            bodyFont: {
              family: 'Fira Code'
            },
            titleFont: {
              family: 'Fira Code'
            }
          }
        }
      }
    };
    
    statusChart = new Chart(statusChartCtx, config);
  }
  
  // Create the monthly revenue chart
  function createRevenueChart(monthlyData) {
    // Process the data
    const labels = [];
    const revenues = [];
    
    // Sort by date ascending
    monthlyData.sort((a, b) => {
      if (a._id.year !== b._id.year) {
        return a._id.year - b._id.year;
      }
      return a._id.month - b._id.month;
    });
    
    monthlyData.forEach(item => {
      const monthNames = [
        'Січ', 'Лют', 'Бер', 'Кві', 'Тра', 'Чер',
        'Лип', 'Сер', 'Вер', 'Жов', 'Лис', 'Гру'
      ];
      
      labels.push(`${monthNames[item._id.month - 1]} ${item._id.year}`);
      revenues.push(item.totalRevenue);
    });
    
    const data = {
      labels: labels,
      datasets: [{
        label: 'Дохід',
        data: revenues,
        backgroundColor: chartColors.rose,
        borderColor: chartColors.rose,
        borderWidth: 2,
        tension: 0.3,
        fill: false
      }]
    };
    
    const config = {
      type: 'line',
      data: data,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              color: chartColors.text,
              font: {
                family: 'Fira Code'
              },
              callback: function(value) {
                return '₴' + value;
              }
            },
            grid: {
              color: chartColors.muted,
              drawBorder: false
            }
          },
          x: {
            ticks: {
              color: chartColors.text,
              font: {
                family: 'Fira Code'
              }
            },
            grid: {
              display: false
            }
          }
        },
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            backgroundColor: chartColors.overlay,
            titleColor: chartColors.text,
            bodyColor: chartColors.text,
            bodyFont: {
              family: 'Fira Code'
            },
            titleFont: {
              family: 'Fira Code'
            },
            callbacks: {
              label: function(context) {
                return '₴' + context.parsed.y;
              }
            }
          }
        }
      }
    };
    
    revenueChart = new Chart(revenueChartCtx, config);
  }
  
  // Create client retention chart
  function createRetentionChart(retentionData) {
    // Group clients by appointment count
    const countMap = {};
    retentionData.forEach(client => {
      const count = client.appointmentCount;
      if (!countMap[count]) {
        countMap[count] = 0;
      }
      countMap[count]++;
    });
    
    // Convert to arrays for chart
    const counts = Object.keys(countMap).sort((a, b) => parseInt(a) - parseInt(b));
    const clientCounts = counts.map(count => countMap[count]);
    
    const data = {
      labels: counts.map(count => `${count} візитів`),
      datasets: [{
        label: 'Кількість клієнтів',
        data: clientCounts,
        backgroundColor: chartColors.iris,
        borderColor: chartColors.iris,
        borderWidth: 1
      }]
    };
    
    const config = {
      type: 'bar',
      data: data,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              color: chartColors.text,
              font: {
                family: 'Fira Code'
              }
            },
            grid: {
              color: chartColors.muted,
              drawBorder: false
            }
          },
          x: {
            ticks: {
              color: chartColors.text,
              font: {
                family: 'Fira Code'
              }
            },
            grid: {
              display: false
            }
          }
        },
        plugins: {
          legend: {
            display: false
          },
          title: {
            display: true,
            text: 'Частота відвідувань клієнтів',
            color: chartColors.text,
            font: {
              family: 'Fira Code',
              size: 16
            }
          },
          tooltip: {
            backgroundColor: chartColors.overlay,
            titleColor: chartColors.text,
            bodyColor: chartColors.text,
            bodyFont: {
              family: 'Fira Code'
            },
            titleFont: {
              family: 'Fira Code'
            }
          }
        }
      }
    };
    
    retentionChart = new Chart(retentionChartCtx, config);
  }
  
  // Render popular procedures
  function renderPopularProcedures(procedures) {
    if (!procedures || procedures.length === 0) {
      popularProceduresList.innerHTML = '<div class="no-data">Дані про процедури ще недоступні.</div>';
      return;
    }
    
    popularProceduresList.innerHTML = '';
    
    procedures.forEach((procedure, index) => {
      const card = document.createElement('div');
      card.className = 'popular-procedure-card';
      
      card.innerHTML = `
        <div class="popular-procedure-info">
          <span class="popular-procedure-rank">#${index + 1}</span>
          <h3>${procedure.name}</h3>
          <div class="procedure-price">Ціна: ₴${procedure.price.toFixed(2)}</div>
        </div>
        <div class="procedure-count">${procedure.count} записів</div>
      `;
      
      popularProceduresList.appendChild(card);
    });
  }
  
  // Render frequent clients
  function renderFrequentClients(clients) {
    if (!clients || clients.length === 0) {
      frequentClientsList.innerHTML = '<div class="no-data">Дані про клієнтів ще недоступні.</div>';
      return;
    }
    
    frequentClientsList.innerHTML = '';
    
    clients.forEach((client, index) => {
      const card = document.createElement('div');
      card.className = 'frequent-client-card';
      
      // Generate star rating HTML for trustRating
      let starsHtml = '';
      for (let i = 1; i <= 5; i++) {
        if (i <= client.trustRating) {
          starsHtml += '<i class="fas fa-star"></i> ';
        } else {
          starsHtml += '<i class="far fa-star"></i> ';
        }
      }
      
      card.innerHTML = `
        <div class="frequent-client-info">
          <span class="frequent-client-rank">#${index + 1}</span>
          <h3>${client.name} ${client.surName}</h3>
          <div class="client-trust-rating">${starsHtml}</div>
        </div>
        <div class="client-visit-count">${client.count} візитів</div>
      `;
      
      frequentClientsList.appendChild(card);
    });
  }
});