/**
 * Utility functions for the Saloon Booking System frontend.
 * All functions are attached to the global scope.
 */

/**
 * Format a date string (YYYY-MM-DD) to a readable format like "Mon, 25 Feb 2026".
 */
function formatDate(dateStr) {
  if (!dateStr) return '';
  var parts = dateStr.split('-');
  var date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
  var days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return days[date.getDay()] + ', ' + date.getDate() + ' ' + months[date.getMonth()] + ' ' + date.getFullYear();
}

/**
 * Format a time string (HH:MM:SS or HH:MM) to "2:30 PM" format.
 */
function formatTime(timeStr) {
  if (!timeStr) return '';
  var parts = timeStr.split(':');
  var hours = parseInt(parts[0], 10);
  var minutes = parts[1];
  var ampm = hours >= 12 ? 'PM' : 'AM';
  var displayHour = hours % 12;
  if (displayHour === 0) displayHour = 12;
  return displayHour + ':' + minutes + ' ' + ampm;
}

/**
 * Format a price number to Indian Rupee format like "₹300.00".
 */
function formatPrice(price) {
  if (price === null || price === undefined) return '';
  return '₹' + Number(price).toFixed(2);
}

/**
 * Show a Bootstrap-style alert at the top of the page.
 * @param {string} message - The alert message.
 * @param {string} type - One of: success, danger, warning, info. Defaults to 'info'.
 */
function showAlert(message, type) {
  type = type || 'info';
  var container = document.getElementById('alerts');
  if (!container) {
    container = document.createElement('div');
    container.id = 'alerts';
    container.style.position = 'fixed';
    container.style.top = '70px';
    container.style.left = '50%';
    container.style.transform = 'translateX(-50%)';
    container.style.zIndex = '9999';
    container.style.width = '90%';
    container.style.maxWidth = '600px';
    document.body.appendChild(container);
  }

  var alert = document.createElement('div');
  alert.className = 'alert alert-' + type;
  alert.innerHTML = '<span>' + message + '</span>' +
    '<button class="alert-close" onclick="this.parentElement.remove()">&times;</button>';

  container.appendChild(alert);

  setTimeout(function () {
    if (alert.parentElement) {
      alert.style.opacity = '0';
      alert.style.transform = 'translateY(-10px)';
      setTimeout(function () {
        if (alert.parentElement) alert.remove();
      }, 300);
    }
  }, 5000);
}

/**
 * Show a loading spinner inside the element matched by the given selector.
 */
function showLoading(selector) {
  var el = document.querySelector(selector);
  if (!el) return;
  el.setAttribute('data-prev-html', el.innerHTML);
  el.innerHTML = '<div class="loading-spinner-container">' +
    '<div class="loading-spinner"></div>' +
    '<p class="loading-text">Loading...</p>' +
    '</div>';
}

/**
 * Hide the loading spinner and restore previous content for the given selector.
 */
function hideLoading(selector) {
  var el = document.querySelector(selector);
  if (!el) return;
  var prev = el.getAttribute('data-prev-html');
  if (prev !== null) {
    el.innerHTML = prev;
    el.removeAttribute('data-prev-html');
  }
}

/**
 * Return the day name for a day number (0 = Sunday, 6 = Saturday).
 */
function getDayName(dayNum) {
  var days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[dayNum] || '';
}

/**
 * Get a URL query parameter value by name.
 */
function getQueryParam(name) {
  var params = new URLSearchParams(window.location.search);
  return params.get(name);
}
