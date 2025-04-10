/**
 * Calendar Export Module
 * This module creates and exports a monthly calendar as a PNG image.
 * Using Rose Pine Moon color scheme for a beautiful dark-mode aesthetic.
 */

// Make it work both as a module and as a direct script
(function(global) {
  /**
   * Main export function - Creates and downloads a PNG of the monthly schedule
   */
  function exportMonthlySchedule(options) {
    const {
      selectedDate = new Date(),
      appointments = [],
      schedules = [],
      showMessage,
      getMonthName = defaultGetMonthName,
      getDayName = defaultGetDayName,
      isSameDay = defaultIsSameDay
    } = options;
    
    // Show loading message
    if (showMessage) showMessage('info', 'Генерація розкладу...');
    
    try {
      // Initialize calendar data
      const calendarData = initializeCalendarData(selectedDate, getMonthName, getDayName, isSameDay);
      
      // Create and prepare canvas
      const canvas = createCanvas(calendarData);
      const ctx = canvas.getContext('2d');
      const colors = getRosePineColors();
      
      // Draw calendar
      drawCalendar(ctx, canvas, calendarData, colors, schedules, appointments, { isSameDay });
      
      // Export as PNG and trigger download
      downloadCalendarImage(canvas, calendarData.monthName, calendarData.year);
      
      // Clean up
      if (document.body.contains(canvas)) {
        document.body.removeChild(canvas);
      }
      
      if (showMessage) showMessage('success', 'Календар успішно експортовано!');
    } catch (error) {
      console.error('Error exporting calendar:', error);
      if (showMessage) showMessage('error', 'Помилка експорту календаря. Спробуйте ще раз.');
    }
  }

  /**
   * Initializes all calendar data required for rendering
   */
  function initializeCalendarData(selectedDate, getMonthName, getDayName, isSameDay) {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    const monthName = getMonthName(month);
    
    // Layout configuration with adjusted spacing
    const layout = {
      headerHeight: 120,
      cardWidth: 360,  // Slightly wider
      cardHeight: 380, // Slightly reduced height
      cardMargin: 12,  // Adjusted for tighter layout
      cardsPerRow: 7
    };
    
    // Generate organized weeks array with all days
    const weeks = generateCalendarWeeks(year, month, getDayName, isSameDay);
    
    return {
      year,
      month, 
      monthName,
      weeks,
      layout,
      rowsNeeded: weeks.length
    };
  }

  /**
   * Creates and initializes the canvas element
   */
  function createCanvas(calendarData) {
    const { layout, rowsNeeded } = calendarData;
    const { headerHeight, cardWidth, cardHeight, cardMargin, cardsPerRow } = layout;
    
    // Calculate optimal canvas dimensions
    const canvasWidth = Math.max(
      (cardWidth * cardsPerRow) + (cardMargin * (cardsPerRow - 1)) + 100,
      2400
    );
    
    // Initial height (will be recalculated after first drawing)
    const startY = headerHeight + 40;
    const canvasHeight = startY + (rowsNeeded * (cardHeight + cardMargin)) + 100;
    
    // Create canvas
    const canvas = document.createElement('canvas');
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    document.body.appendChild(canvas);
    
    return canvas;
  }

  /**
   * Generates calendar weeks with proper data structure
   */
  function generateCalendarWeeks(year, month, getDayName, isSameDay) {
    const today = new Date();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const firstDayOffset = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1; // Convert to Monday-based
    
    const weeks = [];
    let currentWeek = Array(7).fill(null);
    
    // Fill previous month days
    if (firstDayOffset > 0) {
      const prevMonth = month === 0 ? 11 : month - 1;
      const prevMonthYear = month === 0 ? year - 1 : year;
      const daysInPrevMonth = new Date(prevMonthYear, prevMonth + 1, 0).getDate();
      
      for (let i = 0; i < firstDayOffset; i++) {
        const prevMonthDay = daysInPrevMonth - firstDayOffset + i + 1;
        const date = new Date(prevMonthYear, prevMonth, prevMonthDay);
        currentWeek[i] = createDayObject(date, getDayName, isSameDay, today, false);
      }
    }
    
    // Fill current month days
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month, i);
      const dayOfWeek = date.getDay();
      const weekDayIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Convert to Monday-based
      
      currentWeek[weekDayIndex] = createDayObject(date, getDayName, isSameDay, today, true);
      
      // If week is complete or end of month, start a new week
      if (weekDayIndex === 6 || i === daysInMonth) {
        weeks.push([...currentWeek]);
        
        if (i !== daysInMonth) {
          currentWeek = Array(7).fill(null);
        }
      }
    }
    
    // Fill next month days
    const lastWeek = weeks[weeks.length - 1];
    for (let i = 0; i < 7; i++) {
      if (lastWeek[i] === null) {
        const nextMonth = month === 11 ? 0 : month + 1;
        const nextMonthYear = month === 11 ? year + 1 : year;
        
        // Calculate the correct day for next month
        let nextMonthDay = 1;
        for (let j = 0; j < i; j++) {
          if (lastWeek[j] === null) {
            nextMonthDay++;
          }
        }
        
        const date = new Date(nextMonthYear, nextMonth, nextMonthDay);
        lastWeek[i] = createDayObject(date, getDayName, isSameDay, today, false);
      }
    }
    
    return weeks;
  }

  /**
   * Creates a standardized day object for calendar
   */
  function createDayObject(date, getDayName, isSameDay, today, isCurrentMonth) {
    // Get day name but don't repeat the full name in each card
    const dayName = getDayName(date);
    // Use abbreviated day names for less clutter
    const shortDayName = dayName.substring(0, 3);
    
    return {
      date,
      dayNum: date.getDate(),
      dayOfWeek: date.getDay(),
      dayName: shortDayName, // Use short day name
      isToday: isSameDay(date, today),
      isCurrentMonth
    };
  }

  /**
   * Main calendar drawing function
   */
  function drawCalendar(ctx, canvas, calendarData, colors, schedules, appointments, helpers) {
    const { months, weeks, layout, monthName, year } = calendarData;
    const { headerHeight, cardWidth, cardHeight, cardMargin, cardsPerRow } = layout;
    
    // Clear canvas with background color
    fillCanvas(ctx, canvas, colors.background);
    
    // Draw header
    drawHeader(ctx, canvas.width, headerHeight, monthName, year, colors);
    
    // Calculate start positions
    const startY = headerHeight + 40;
    const totalCardsWidth = (cardsPerRow * cardWidth) + ((cardsPerRow - 1) * cardMargin);
    const startX = (canvas.width - totalCardsWidth) / 2;
    
    // Draw weekday labels
    drawWeekdayLabels(ctx, startX, headerHeight + 25, cardWidth, cardMargin, colors);
    
    // Draw each week
    weeks.forEach((week, weekIndex) => {
      const rowY = startY + weekIndex * (cardHeight + cardMargin);
          
      // Draw each day in the week
      week.forEach((day, dayIndex) => {
        // Only draw days from current month (skip previous/next month)
        if (day !== null && day.isCurrentMonth) {
          const x = startX + dayIndex * (cardWidth + cardMargin);
          drawDayCard(ctx, day, x, rowY, cardWidth, cardHeight, colors, schedules, appointments, helpers);
        }
      });
    });
    
    // Add finishing touches
    drawWatermark(ctx, canvas, colors);
    drawFooterDecoration(ctx, canvas, colors);
  }

  /**
   * Fills the entire canvas with a background color
   */
  function fillCanvas(ctx, canvas, color) {
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  /**
   * Draws the calendar header with month and year
   */
  function drawHeader(ctx, width, height, monthName, year, colors) {
    // Draw gradient header background
    const gradient = ctx.createLinearGradient(0, 0, width, 0);
    gradient.addColorStop(0, colors.surface);
    gradient.addColorStop(1, colors.overlay);
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    
    // Add decorative top border
    const borderGradient = ctx.createLinearGradient(0, 0, width, 0);
    borderGradient.addColorStop(0, colors.iris);
    borderGradient.addColorStop(0.5, colors.rose);
    borderGradient.addColorStop(1, colors.gold);
    
    ctx.fillStyle = borderGradient;
    ctx.fillRect(0, 0, width, 6);
    
    // Draw title - changed to Fira Code
    ctx.fillStyle = colors.text;
    ctx.font = 'bold 50px "Fira Code", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`${monthName} ${year}`, width / 2, 75);
  }

  /**
   * Draws the weekday labels (Mon-Sun)
   */
  function drawWeekdayLabels(ctx, startX, labelY, cardWidth, cardMargin, colors) {
    const weekdayLabels = ['Понеділок', 'Вівторок', 'Середа', 'Четвер', "П'ятниця", 'Субота', 'Неділя'];
    
    weekdayLabels.forEach((label, index) => {
      const x = startX + (index * (cardWidth + cardMargin)) + (cardWidth / 2);
      
      ctx.fillStyle = colors.subtle;
      ctx.font = '20px "Fira Code", monospace'; // Changed to Fira Code
      ctx.textAlign = 'center';
      ctx.fillText(label, x, labelY);
    });
  }

  /**
   * Draws a single day card
   */
  function drawDayCard(ctx, day, x, y, width, height, colors, schedules, appointments, helpers) {
    const { isSameDay } = helpers;
    
    // Draw card background with shadow
    drawCardBackground(ctx, day, x, y, width, height, colors);
    
    // Get day's schedule information
    const daySchedule = schedules.find(s => s.dayOfWeek === day.dayOfWeek);
    const isWeekend = daySchedule ? daySchedule.isWeekend : (day.dayOfWeek === 0 || day.dayOfWeek === 6);
    
    // Draw header section
    const headerHeight = 60;
    drawCardHeader(ctx, day, x, y, width, headerHeight, colors, isWeekend);
    
    // Draw content section
    if (isWeekend) {
      drawWeekendInfo(ctx, x, y, width, height, headerHeight, colors);
    } else {
      drawTimeSlots(ctx, day, x, y, width, height, headerHeight, colors, daySchedule, appointments, isSameDay);
    }
  }

  /**
   * Draws the card background and border
   */
  function drawCardBackground(ctx, day, x, y, width, height, colors) {
    // Apply shadow for card
    ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
    ctx.shadowBlur = 15;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 5;
    
    // Draw background - adjust for weekends
    const isWeekend = day.dayOfWeek === 0 || day.dayOfWeek === 6;
    const bgColor = day.isCurrentMonth 
      ? (isWeekend ? adjustColor(colors.surface, 0.96) : colors.surface)
      : (isWeekend ? adjustColor(colors.base, 0.96) : colors.base);
    
    ctx.fillStyle = bgColor;
    roundedRect(ctx, x, y, width, height, 12);
    
    // Reset shadow
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    
    // Add highlight for today
    if (day.isToday) {
      ctx.strokeStyle = colors.rose;
      ctx.lineWidth = 4;
      roundedRectStroke(ctx, x, y, width, height, 12);
    } else if (isWeekend) {
      // Subtle weekend highlight 
      ctx.strokeStyle = colors.gold;
      ctx.lineWidth = 2;
      ctx.globalAlpha = 0.3;
      roundedRectStroke(ctx, x, y, width, height, 12);
      ctx.globalAlpha = 1.0;
    }
  }

  /**
   * Helper to adjust color brightness
   */
  function adjustColor(color, factor) {
    // Simple utility to darken/lighten hex colors
    if (color.startsWith('#')) {
      let r = parseInt(color.substr(1, 2), 16);
      let g = parseInt(color.substr(3, 2), 16);
      let b = parseInt(color.substr(5, 2), 16);
      
      r = Math.min(255, Math.floor(r * factor));
      g = Math.min(255, Math.floor(g * factor));
      b = Math.min(255, Math.floor(b * factor));
      
      return `rgb(${r}, ${g}, ${b})`;
    }
    return color;
  }

  /**
   * Draws the header section of the day card
   */
  function drawCardHeader(ctx, day, x, y, width, headerHeight, colors, isWeekend) {
    // Draw header background with improved gradient for weekends
    const headerGradient = ctx.createLinearGradient(x, y, x + width, y);
    
    if (isWeekend) {
      headerGradient.addColorStop(0, colors.overlay);
      headerGradient.addColorStop(0.7, 'rgba(246, 193, 119, 0.3)');
      headerGradient.addColorStop(1, 'rgba(246, 193, 119, 0.2)');
    } else {
      headerGradient.addColorStop(0, colors.overlay);
      headerGradient.addColorStop(1, colors.surface);
    }
    
    ctx.fillStyle = headerGradient;
    roundedRectTop(ctx, x, y, width, headerHeight, 12);
    
    // Draw day number larger and more prominent
    ctx.fillStyle = day.isToday ? colors.rose : (isWeekend ? colors.gold : colors.text);
    ctx.font = 'bold 34px "Fira Code", monospace'; // Changed to Fira Code
    ctx.textAlign = 'left';
    ctx.fillText(`${day.dayNum}`, x + 20, y + 42);
    
    // Draw shortened day name as a badge
    const dayNameWidth = ctx.measureText(day.dayName).width + 16;
    const badgeX = x + width - dayNameWidth - 12;
    const badgeY = y + 16;
    const badgeHeight = 26;
    
    // Draw day name badge background
    ctx.fillStyle = day.isCurrentMonth 
      ? (isWeekend ? 'rgba(246, 193, 119, 0.2)' : 'rgba(196, 167, 231, 0.15)')
      : 'rgba(110, 106, 134, 0.2)';
    roundedRect(ctx, badgeX, badgeY, dayNameWidth, badgeHeight, badgeHeight / 2);
    
    // Draw day name
    ctx.fillStyle = day.isCurrentMonth ? (isWeekend ? colors.gold : colors.iris) : colors.muted;
    ctx.font = '14px "Fira Code", monospace'; // Changed to Fira Code
    ctx.textAlign = 'center';
    ctx.fillText(day.dayName, badgeX + dayNameWidth/2, badgeY + 18);
    
    // Add indicator for days outside current month
    if (!day.isCurrentMonth) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.fillRect(x, y + headerHeight, width, 2);
    }
  }

  /**
   * Draws weekend information
   */
  function drawWeekendInfo(ctx, x, y, width, height, headerHeight, colors) {
    const alertY = y + headerHeight + 70; // Adjusted position
    
    // Create a gradient background for weekend message
    const gradientBg = ctx.createRadialGradient(
      x + width/2, y + height/2, 10, 
      x + width/2, y + height/2, width/1.5
    );
    gradientBg.addColorStop(0, 'rgba(246, 193, 119, 0.2)');
    gradientBg.addColorStop(1, 'rgba(246, 193, 119, 0.05)');
    
    // Fill entire content area with gradient
    ctx.fillStyle = gradientBg;
    ctx.fillRect(x, y + headerHeight, width, height - headerHeight);
    
    // Draw decorative elements
    ctx.fillStyle = colors.gold;
    ctx.font = 'italic 24px "Fira Code", monospace'; // Changed to Fira Code
    ctx.textAlign = 'center';
    ctx.fillText('✨ Вихідний ✨', x + width/2, alertY);
    
    // Weekend icon with enhanced styling
    ctx.font = '52px "Fira Code", monospace'; // Changed to Fira Code
    ctx.fillText('🏖️', x + width/2, alertY + 65);
    
    // Add decorative dots in the corners
    const dotPositions = [
      {x: x + 25, y: y + headerHeight + 25},
      {x: x + width - 25, y: y + headerHeight + 25},
      {x: x + 25, y: y + height - 25},
      {x: x + width - 25, y: y + height - 25}
    ];
    
    dotPositions.forEach(pos => {
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, 4, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(246, 193, 119, 0.3)';
      ctx.fill();
    });
  }

  /**
   * Draws time slots for a day
   */
  function drawTimeSlots(ctx, day, x, y, width, height, headerHeight, colors, daySchedule, appointments, isSameDay) {
    const contentX = x + 14; // Reduced padding
    const contentY = y + headerHeight + 12; // Reduced padding
    const contentWidth = width - 28; // Adjusted to match reduced padding
    
    // Check if schedule exists
    if (!daySchedule || !daySchedule.timeTable) {
      drawNoScheduleMessage(ctx, x, contentY, width, colors);
      return;
    }
    
    // Get time slots and sort them
    const timeSlots = Object.values(daySchedule.timeTable).filter(Boolean);
    timeSlots.sort();
    
    if (timeSlots.length === 0) {
      drawNoTimeSlotsMessage(ctx, x, contentY, width, colors);
      return;
    }
    
    // Draw subtle section title
    ctx.fillStyle = 'rgba(224, 222, 244, 0.7)'; // More subtle title
    ctx.font = 'bold 15px "Fira Code", monospace'; // Changed to Fira Code
    ctx.textAlign = 'left';
    ctx.fillText('Розклад:', contentX, contentY + 16);
    
    // Prepare for drawing slots - adjust spacing for better fit
    const maxSlots = 4; // Limit to 4 slots
    const displaySlots = timeSlots.slice(0, maxSlots);
    const availableHeight = height - headerHeight - 50; // Height minus header and margins
    const slotSpacing = 8; // Reduced spacing
    const slotHeight = Math.min(62, Math.floor(availableHeight / maxSlots) - slotSpacing);
    const totalSlotHeight = slotHeight + slotSpacing;
    const slotsStartY = contentY + 32; // Start lower to make room for title
    
    // Draw each slot
    displaySlots.forEach((timeSlot, index) => {
      drawTimeSlot(
        ctx, 
        timeSlot, 
        contentX, 
        slotsStartY + (index * totalSlotHeight), 
        contentWidth, 
        slotHeight, 
        colors, 
        day.date, 
        appointments, 
        isSameDay
      );
    });
    
    // Show indicator for more slots if needed
    if (timeSlots.length > maxSlots) {
      const moreY = slotsStartY + (displaySlots.length * totalSlotHeight) + 12; // Adjusted position
      drawMoreSlotsIndicator(
        ctx, 
        contentX, 
        contentWidth, 
        moreY, 
        colors, 
        timeSlots.length - maxSlots,
        x + width/2
      );
    }
  }

  /**
   * Draws an individual time slot
   */
  function drawTimeSlot(ctx, timeSlot, x, y, width, height, colors, date, appointments, isSameDay) {
    // Check if slot is booked
    const [hours, minutes] = timeSlot.split(':');
    const slotDate = new Date(date);
    slotDate.setHours(parseInt(hours), parseInt(minutes));
    
    const isBooked = appointments.some(a => {
      const appTime = new Date(a.time);
      return isSameDay(appTime, date) && 
            appTime.getHours() === parseInt(hours) && 
            appTime.getMinutes() === parseInt(minutes);
    });
    
    // Draw slot background
    ctx.fillStyle = isBooked ? colors.love : colors.foam;
    ctx.globalAlpha = 0.15;
    roundedRect(ctx, x, y, width, height, 8);
    ctx.globalAlpha = 1.0;
    
    // Draw left accent bar
    ctx.fillStyle = isBooked ? colors.love : colors.foam;
    ctx.fillRect(x, y, 4, height);
    
    // Draw time
    ctx.fillStyle = colors.text;
    ctx.font = 'bold 20px "Fira Code", monospace'; // Changed to Fira Code
    ctx.textAlign = 'left';
    ctx.fillText(`${timeSlot}`, x + 20, y + height/2 + 6);
    
    // Draw status
    ctx.textAlign = 'right';
    ctx.fillStyle = isBooked ? colors.love : colors.foam;
    ctx.font = '16px "Fira Code", monospace'; // Changed to Fira Code
    ctx.fillText(
      isBooked ? '⚫ Заброньовано' : '⚪ Доступно', 
      x + width - 15, 
      y + height/2 + 6
    );
  }

  /**
   * Draws message when no schedule is available
   */
  function drawNoScheduleMessage(ctx, x, y, width, colors) {
    ctx.fillStyle = colors.muted;
    ctx.font = 'italic 20px "Fira Code", monospace'; // Changed to Fira Code
    ctx.textAlign = 'center';
    ctx.fillText('Розклад не налаштовано', x + width/2, y + 60);
  }

  /**
   * Draws message when no time slots are available
   */
  function drawNoTimeSlotsMessage(ctx, x, y, width, colors) {
    ctx.fillStyle = colors.muted;
    ctx.font = 'italic 20px "Fira Code", monospace'; // Changed to Fira Code
    ctx.textAlign = 'center';
    ctx.fillText('Немає доступних часів', x + width/2, y + 60);
  }

  /**
   * Draws indicator for additional time slots
   */
  function drawMoreSlotsIndicator(ctx, x, width, y, colors, moreCount, centerX) {
    ctx.fillStyle = colors.muted;
    ctx.globalAlpha = 0.2;
    roundedRect(ctx, x + 40, y - 20, width - 80, 50, 25);
    ctx.globalAlpha = 1.0;
    
    ctx.fillStyle = colors.subtle;
    ctx.font = '16px "Fira Code", monospace'; // Changed to Fira Code
    ctx.textAlign = 'center';
    ctx.fillText(
      `+ ще ${moreCount} час${getUkrainianPlural(moreCount)}`, 
      centerX, 
      y + 10
    );
  }

  /**
   * Draws watermark on the calendar
   */
  function drawWatermark(ctx, canvas, colors) {
    ctx.font = 'italic 28px "Fira Code", monospace'; // Changed to Fira Code
    ctx.fillStyle = 'rgba(224, 222, 244, 0.2)'; // Increased opacity from 0.07 to 0.2
    ctx.textAlign = 'center';
    ctx.fillText('@savika_nail', canvas.width / 2, canvas.height - 40);
  }

  /**
   * Draws decorative footer at the bottom of the calendar
   */
  function drawFooterDecoration(ctx, canvas, colors) {
    const gradient = ctx.createLinearGradient(0, canvas.height - 16, canvas.width, canvas.height - 16);
    gradient.addColorStop(0, colors.love);
    gradient.addColorStop(0.3, colors.rose);
    gradient.addColorStop(0.5, colors.iris);
    gradient.addColorStop(0.7, colors.pine);
    gradient.addColorStop(1, colors.foam);
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, canvas.height - 16, canvas.width, 16);
  }

  /**
   * Triggers download of the calendar as PNG
   */
  function downloadCalendarImage(canvas, monthName, year) {
    try {
      // Get data URL with error handling
      let dataUrl;
      try {
        dataUrl = canvas.toDataURL('image/png');
      } catch (e) {
        console.error('Error generating data URL:', e);
        throw new Error('Не вдалося створити зображення календаря');
      }
      
      // Create a safe filename
      const filename = `savika-calendar-${monthName}-${year}.png`
        .replace(/[^\w\s.-]/g, '') // Remove invalid filename characters
        .replace(/\s+/g, '-');     // Replace spaces with hyphens
      
      // Create download link with fallback behavior
      const downloadLink = document.createElement('a');
      downloadLink.href = dataUrl;
      downloadLink.download = filename;
      downloadLink.style.display = 'none';
      
      // Add to DOM, click, and clean up
      document.body.appendChild(downloadLink);
      
      // Use a timeout to ensure the link is properly added to the DOM
      setTimeout(() => {
        try {
          // Try to click the link programmatically
          downloadLink.click();
        } catch (err) {
          console.error('Error triggering download:', err);
          
          // Fallback: open in new tab
          window.open(dataUrl, '_blank');
        } finally {
          // Clean up after a delay to ensure the download has started
          setTimeout(() => {
            if (document.body.contains(downloadLink)) {
              document.body.removeChild(downloadLink);
            }
          }, 100);
        }
      }, 0);
    } catch (error) {
      console.error('Error in downloadCalendarImage:', error);
      throw error;
    }
  }

  /**
   * Helper for Ukrainian pluralization
   */
  function getUkrainianPlural(number) {
    const lastDigit = number % 10;
    const lastTwoDigits = number % 100;
    
    if (lastDigit === 1 && lastTwoDigits !== 11) {
      return '';  // 1 час
    } else if ([2, 3, 4].includes(lastDigit) && ![12, 13, 14].includes(lastTwoDigits)) {
      return 'и';  // 2, 3, 4 години
    } else {
      return 'ів';  // 5+ часів
    }
  }

  /**
   * Draw a rounded rectangle with only top corners rounded
   */
  function roundedRectTop(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height);
    ctx.lineTo(x, y + height);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    ctx.fill();
  }

  /**
   * Draw a stroked rounded rectangle (for borders)
   */
  function roundedRectStroke(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    ctx.stroke();
  }

  /**
   * Draw a filled rounded rectangle
   */
  function roundedRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    ctx.fill();
  }

  /**
   * Get Rose Pine Moon color scheme
   */
  function getRosePineColors() {
    const rosePine = {
      base: '#232136',        // Dark background
      surface: '#2a273f',     // Slightly lighter background
      overlay: '#393552',     // For overlays and borders
      muted: '#6e6a86',       // Muted text
      subtle: '#908caa',      // Subtle elements
      text: '#e0def4',        // Main text color
      love: '#eb6f92',        // Accent pink/red (for booked)
      gold: '#f6c177',        // Gold for special elements
      rose: '#ea9a97',        // Softer pink
      pine: '#3e8fb0',        // Blue-green
      foam: '#9ccfd8',        // Teal (for available)
      iris: '#c4a7e7'         // Purple for highlights
    };
    
    return {
      background: rosePine.base,
      primary: rosePine.iris,
      secondary: rosePine.foam,
      cardBg: rosePine.surface,
      cardHeaderBg: rosePine.overlay,
      text: rosePine.text,
      mutedText: rosePine.muted,
      subtle: rosePine.subtle,
      border: rosePine.overlay,
      highlight: rosePine.iris,
      weekend: rosePine.gold,
      available: rosePine.foam,
      booked: rosePine.love,
      todayBorder: rosePine.rose,
      ...rosePine
    };
  }

  /**
   * Default month name getter
   */
  function defaultGetMonthName(month) {
    const monthNames = [
      'Січень', 'Лютий', 'Березень', 'Квітень', 'Травень', 'Червень',
      'Липень', 'Серпень', 'Вересень', 'Жовтень', 'Листопад', 'Грудень'
    ];
    return monthNames[month];
  }

  /**
   * Default day name getter
   */
  function defaultGetDayName(date) {
    const dayNames = ['Неділя', 'Понеділок', 'Вівторок', 'Середа', 'Четвер', 'П\'ятниця', 'Субота'];
    return dayNames[date.getDay()];
  }

  /**
   * Get short month name
   */
  function getShortMonthName(month) {
    const monthShortNames = ['Січ', 'Лют', 'Бер', 'Кві', 'Тра', 'Чер', 'Лип', 'Сер', 'Вер', 'Жов', 'Лис', 'Гру'];
    return monthShortNames[month];
  }

  /**
   * Default isSameDay implementation
   */
  function defaultIsSameDay(date1, date2) {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
  }

  // Expose the functionality
  // As a module export if supported
  if (typeof exports !== 'undefined') {
    exports.exportMonthlySchedule = exportMonthlySchedule;
  } 
  // As a global function
  global.exportMonthlySchedule = exportMonthlySchedule;
  
  // Also expose through a namespace to avoid conflicts
  global.calendarExport = {
    exportMonthlySchedule: exportMonthlySchedule
  };

})(typeof window !== 'undefined' ? window : this);
