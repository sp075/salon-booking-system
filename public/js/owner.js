/**
 * Owner section JavaScript.
 * Handles all owner pages: dashboard, profile, schedule, bookings.
 */

var Owner = (function () {

  // ---------------------------------------------------------------
  // Dashboard
  // ---------------------------------------------------------------

  function loadDashboard() {
    // Load profile for welcome message and rating
    API.get('/owner/profile')
      .then(function (res) {
        var profile = res.data;
        var name = profile.salonName || 'Your Salon';
        $('#welcome-section h1').text('Welcome back, ' + name + '!');
        $('#welcome-section p').text('Here is an overview of your salon today.');

        var rating = parseFloat(profile.avgRating) || 0;
        var ratingDisplay = rating > 0
          ? rating.toFixed(1) + ' / 5'
          : 'No ratings';
        $('#stat-rating').text(ratingDisplay);
      })
      .catch(function () {
        $('#welcome-section p').text('Could not load profile data.');
      });

    // Load bookings for today stats + recent list
    var today = new Date().toISOString().slice(0, 10);

    API.get('/owner/bookings?date=' + today)
      .then(function (res) {
        var bookings = res.data || [];
        $('#stat-today').text(bookings.length);

        var pending = bookings.filter(function (b) { return b.status === 'pending'; });
        $('#stat-pending').text(pending.length);
      })
      .catch(function () {
        $('#stat-today').text('--');
        $('#stat-pending').text('--');
      });

    // Load all bookings (limited display to last 5)
    API.get('/owner/bookings')
      .then(function (res) {
        var bookings = res.data || [];
        renderRecentBookings(bookings.slice(0, 5));
      })
      .catch(function () {
        $('#recent-bookings').html(
          '<div class="empty-state"><p>Could not load recent bookings.</p></div>'
        );
      });
  }

  function renderRecentBookings(bookings) {
    var $container = $('#recent-bookings');

    if (!bookings.length) {
      $container.html(
        '<div class="empty-state">' +
        '<div class="empty-icon">&#128197;</div>' +
        '<p>No bookings yet.</p>' +
        '</div>'
      );
      return;
    }

    var html = '';
    bookings.forEach(function (b) {
      var customerName = b.customer
        ? b.customer.firstName + ' ' + b.customer.lastName
        : 'Unknown Customer';

      var services = '';
      if (b.bookingServices && b.bookingServices.length) {
        services = b.bookingServices.map(function (bs) {
          return bs.service ? bs.service.name : 'Service';
        }).join(', ');
      }

      html += '<div class="booking-row">' +
        '<div class="booking-info">' +
        '<span class="customer-name">' + escapeHtml(customerName) + '</span>' +
        '<span class="booking-detail">' + formatDate(b.bookingDate) + ' at ' + formatTime(b.startTime) + '</span>' +
        (services ? '<span class="booking-detail">' + escapeHtml(services) + '</span>' : '') +
        '</div>' +
        '<div>' +
        '<span class="badge badge-' + b.status + '">' + b.status + '</span>' +
        ' <span style="font-weight:600;color:var(--color-primary)">' + formatPrice(b.totalPrice) + '</span>' +
        '</div>' +
        '</div>';
    });

    $container.html(html);
  }

  // ---------------------------------------------------------------
  // Profile
  // ---------------------------------------------------------------

  function loadProfile() {
    API.get('/owner/profile')
      .then(function (res) {
        var profile = res.data;
        $('#salonName').val(profile.salonName || '');
        $('#address').val(profile.address || '');

        // Schedule fields (on profile page)
        if (profile.openTime) {
          $('#openTime').val(profile.openTime.substring(0, 5));
        }
        if (profile.closeTime) {
          $('#closeTime').val(profile.closeTime.substring(0, 5));
        }
        if (profile.dayOff !== null && profile.dayOff !== undefined) {
          $('#dayOff').val(String(profile.dayOff));
        }
      })
      .catch(function () {
        showAlert('Failed to load profile.', 'danger');
      });

    loadServices();
  }

  function saveProfile() {
    var salonName = $('#salonName').val().trim();
    var address = $('#address').val().trim();

    if (!salonName) {
      showAlert('Salon name is required.', 'warning');
      return;
    }

    var $btn = $('#save-profile-btn');
    $btn.prop('disabled', true).text('Saving...');

    API.put('/owner/profile', { salonName: salonName, address: address })
      .then(function () {
        showAlert('Salon details saved successfully.', 'success');
      })
      .catch(function (xhr) {
        var msg = (xhr.responseJSON && xhr.responseJSON.message)
          ? xhr.responseJSON.message
          : 'Failed to save profile.';
        showAlert(msg, 'danger');
      })
      .always(function () {
        $btn.prop('disabled', false).text('Save Details');
      });
  }

  function saveSchedule() {
    var openTime = $('#openTime').val();
    var closeTime = $('#closeTime').val();
    var dayOff = $('#dayOff').val();

    if (!openTime || !closeTime) {
      showAlert('Open time and close time are required.', 'warning');
      return;
    }

    var $btn = $('#save-schedule-btn');
    $btn.prop('disabled', true).text('Saving...');

    var data = {
      openTime: openTime,
      closeTime: closeTime,
      dayOff: dayOff !== '' ? parseInt(dayOff, 10) : null,
    };

    API.put('/owner/schedule', data)
      .then(function (res) {
        showAlert('Schedule saved successfully.', 'success');
        // Update schedule display on the schedule page
        updateScheduleDisplay(res.data);
      })
      .catch(function (xhr) {
        var msg = (xhr.responseJSON && xhr.responseJSON.message)
          ? xhr.responseJSON.message
          : 'Failed to save schedule.';
        showAlert(msg, 'danger');
      })
      .always(function () {
        $btn.prop('disabled', false).text('Save Schedule');
      });
  }

  // ---------------------------------------------------------------
  // Schedule page specific
  // ---------------------------------------------------------------

  function loadSchedule() {
    API.get('/owner/profile')
      .then(function (res) {
        var profile = res.data;

        // Populate form fields
        if (profile.openTime) {
          $('#openTime').val(profile.openTime.substring(0, 5));
        }
        if (profile.closeTime) {
          $('#closeTime').val(profile.closeTime.substring(0, 5));
        }
        if (profile.dayOff !== null && profile.dayOff !== undefined) {
          $('#dayOff').val(String(profile.dayOff));
        }

        // Update display cards
        updateScheduleDisplay(profile);
      })
      .catch(function () {
        showAlert('Failed to load schedule.', 'danger');
      });
  }

  function updateScheduleDisplay(profile) {
    if ($('#display-open-time').length) {
      $('#display-open-time').text(profile.openTime ? formatTime(profile.openTime) : '--:--');
      $('#display-close-time').text(profile.closeTime ? formatTime(profile.closeTime) : '--:--');
      var dayOffText = (profile.dayOff !== null && profile.dayOff !== undefined)
        ? getDayName(profile.dayOff)
        : 'None';
      $('#display-day-off').text(dayOffText);
    }
  }

  // ---------------------------------------------------------------
  // Services
  // ---------------------------------------------------------------

  function loadServices() {
    // Load all available services (public) and owner's current services
    $.when(
      API.get('/services'),
      API.get('/owner/services')
    ).then(function (allRes, ownerRes) {
      var allServices = allRes[0].data || [];
      var ownerServices = ownerRes[0].data || [];

      renderServices(allServices, ownerServices);
    }).catch(function () {
      $('#services-list').html(
        '<div class="empty-state"><p>Could not load services.</p></div>'
      );
    });
  }

  function renderServices(allServices, ownerServices) {
    var $container = $('#services-list');

    if (!allServices.length) {
      $container.html(
        '<div class="empty-state"><p>No services available in the system.</p></div>'
      );
      return;
    }

    // Build a lookup of owner services by serviceId
    var ownerMap = {};
    ownerServices.forEach(function (os) {
      ownerMap[os.serviceId] = os;
    });

    var html = '';
    allServices.forEach(function (svc) {
      var owned = ownerMap[svc.id];
      var isEnabled = !!owned;
      var customPrice = (owned && owned.customPrice) ? owned.customPrice : '';

      html += '<div class="service-item" data-service-id="' + svc.id + '">' +
        '<div class="service-info">' +
        '<div class="service-name">' + escapeHtml(svc.name) + '</div>' +
        '<div class="service-detail">Default: ' + formatPrice(svc.defaultPrice) +
        ' | Duration: ' + svc.durationMinutes + ' min</div>' +
        '</div>' +
        '<div class="service-controls">' +
        '<input type="number" class="price-input" placeholder="Custom price" ' +
        'step="0.01" min="0" value="' + customPrice + '" ' +
        'data-service-id="' + svc.id + '"' +
        (isEnabled ? '' : ' disabled') + '>' +
        '<label class="toggle-switch">' +
        '<input type="checkbox" class="service-toggle" data-service-id="' + svc.id + '"' +
        (isEnabled ? ' checked' : '') + '>' +
        '<span class="toggle-slider"></span>' +
        '</label>' +
        '</div>' +
        '</div>';
    });

    $container.html(html);
  }

  function toggleService(serviceId, enabled, customPrice) {
    if (enabled) {
      var data = { serviceId: serviceId };
      if (customPrice && !isNaN(parseFloat(customPrice))) {
        data.customPrice = parseFloat(customPrice);
      }
      API.post('/owner/services', data)
        .then(function () {
          showAlert('Service enabled.', 'success');
          // Enable the price input
          $('.price-input[data-service-id="' + serviceId + '"]').prop('disabled', false);
        })
        .catch(function (xhr) {
          var msg = (xhr.responseJSON && xhr.responseJSON.message)
            ? xhr.responseJSON.message
            : 'Failed to enable service.';
          showAlert(msg, 'danger');
          // Revert toggle
          $('.service-toggle[data-service-id="' + serviceId + '"]').prop('checked', false);
        });
    } else {
      API.delete('/owner/services/' + serviceId)
        .then(function () {
          showAlert('Service disabled.', 'info');
          // Disable and clear the price input
          var $price = $('.price-input[data-service-id="' + serviceId + '"]');
          $price.prop('disabled', true).val('');
        })
        .catch(function (xhr) {
          var msg = (xhr.responseJSON && xhr.responseJSON.message)
            ? xhr.responseJSON.message
            : 'Failed to disable service.';
          showAlert(msg, 'danger');
          // Revert toggle
          $('.service-toggle[data-service-id="' + serviceId + '"]').prop('checked', true);
        });
    }
  }

  function saveServicePrice(serviceId, customPrice) {
    var data = { serviceId: serviceId };
    if (customPrice && !isNaN(parseFloat(customPrice))) {
      data.customPrice = parseFloat(customPrice);
    } else {
      data.customPrice = null;
    }

    API.post('/owner/services', data)
      .then(function () {
        showAlert('Service price updated.', 'success');
      })
      .catch(function (xhr) {
        var msg = (xhr.responseJSON && xhr.responseJSON.message)
          ? xhr.responseJSON.message
          : 'Failed to update price.';
        showAlert(msg, 'danger');
      });
  }

  // ---------------------------------------------------------------
  // Bookings
  // ---------------------------------------------------------------

  function loadBookings(date, status) {
    var query = '';
    var params = [];
    if (date) params.push('date=' + date);
    if (status) params.push('status=' + status);
    if (params.length) query = '?' + params.join('&');

    $('#bookings-list').html(
      '<div class="loading-spinner-container">' +
      '<div class="loading-spinner"></div>' +
      '<p class="loading-text">Loading bookings...</p>' +
      '</div>'
    );

    API.get('/owner/bookings' + query)
      .then(function (res) {
        renderBookings(res.data || []);
      })
      .catch(function () {
        $('#bookings-list').html(
          '<div class="empty-state"><p>Could not load bookings.</p></div>'
        );
      });
  }

  function renderBookings(bookings) {
    var $container = $('#bookings-list');

    if (!bookings.length) {
      $container.html(
        '<div class="empty-state">' +
        '<div class="empty-icon">&#128197;</div>' +
        '<p>No bookings found matching your filters.</p>' +
        '</div>'
      );
      return;
    }

    var html = '';
    bookings.forEach(function (b) {
      var customerName = b.customer
        ? b.customer.firstName + ' ' + b.customer.lastName
        : 'Unknown Customer';

      var serviceNames = '';
      if (b.bookingServices && b.bookingServices.length) {
        serviceNames = b.bookingServices.map(function (bs) {
          return bs.service ? bs.service.name : 'Service';
        }).join(', ');
      }

      var actionButtons = '';
      if (b.status === 'pending') {
        actionButtons =
          '<button class="btn btn-success btn-sm confirm-booking-btn" data-id="' + b.id + '">Confirm</button>' +
          '<button class="btn btn-danger btn-sm reject-booking-btn" data-id="' + b.id + '">Reject</button>';
      } else if (b.status === 'confirmed') {
        actionButtons =
          '<button class="btn btn-danger btn-sm reject-booking-btn" data-id="' + b.id + '">Reject</button>';
      }

      html += '<div class="booking-card" data-booking-id="' + b.id + '">' +
        '<div class="booking-card-header">' +
        '<div class="booking-card-left">' +
        '<span class="booking-customer">' + escapeHtml(customerName) + '</span>' +
        '<span class="booking-datetime">' + formatDate(b.bookingDate) + ' at ' + formatTime(b.startTime) + ' - ' + formatTime(b.endTime) + '</span>' +
        '</div>' +
        '<div class="booking-card-right">' +
        '<span class="badge badge-' + b.status + '">' + b.status + '</span>' +
        '<span class="booking-price">' + formatPrice(b.totalPrice) + '</span>' +
        '</div>' +
        '</div>' +
        '<div class="booking-detail" id="detail-' + b.id + '">' +
        '<div class="booking-detail-row">' +
        '<span class="label">Customer Email</span>' +
        '<span class="value">' + (b.customer ? escapeHtml(b.customer.email) : '--') + '</span>' +
        '</div>' +
        '<div class="booking-detail-row">' +
        '<span class="label">Date</span>' +
        '<span class="value">' + formatDate(b.bookingDate) + '</span>' +
        '</div>' +
        '<div class="booking-detail-row">' +
        '<span class="label">Time</span>' +
        '<span class="value">' + formatTime(b.startTime) + ' - ' + formatTime(b.endTime) + '</span>' +
        '</div>' +
        '<div class="booking-detail-row">' +
        '<span class="label">Total Price</span>' +
        '<span class="value">' + formatPrice(b.totalPrice) + '</span>' +
        '</div>';

      if (b.bookingServices && b.bookingServices.length) {
        html += '<div class="booking-services-list">' +
          '<strong>Services:</strong><ul>';
        b.bookingServices.forEach(function (bs) {
          html += '<li>' + (bs.service ? escapeHtml(bs.service.name) : 'Service') + '</li>';
        });
        html += '</ul></div>';
      }

      if (actionButtons) {
        html += '<div class="booking-actions">' + actionButtons + '</div>';
      }

      html += '</div></div>';
    });

    $container.html(html);
  }

  function confirmBooking(bookingId) {
    var $btn = $('.confirm-booking-btn[data-id="' + bookingId + '"]');
    $btn.prop('disabled', true).text('Confirming...');

    API.put('/owner/bookings/' + bookingId + '/confirm')
      .then(function () {
        showAlert('Booking confirmed.', 'success');
        // Reload bookings with current filters
        var date = $('#filter-date').val();
        var status = $('#filter-status').val();
        loadBookings(date, status);
      })
      .catch(function (xhr) {
        var msg = (xhr.responseJSON && xhr.responseJSON.message)
          ? xhr.responseJSON.message
          : 'Failed to confirm booking.';
        showAlert(msg, 'danger');
        $btn.prop('disabled', false).text('Confirm');
      });
  }

  function rejectBooking(bookingId) {
    if (!confirm('Are you sure you want to reject this booking?')) return;

    var $btn = $('.reject-booking-btn[data-id="' + bookingId + '"]');
    $btn.prop('disabled', true).text('Rejecting...');

    API.put('/owner/bookings/' + bookingId + '/reject')
      .then(function () {
        showAlert('Booking rejected.', 'info');
        var date = $('#filter-date').val();
        var status = $('#filter-status').val();
        loadBookings(date, status);
      })
      .catch(function (xhr) {
        var msg = (xhr.responseJSON && xhr.responseJSON.message)
          ? xhr.responseJSON.message
          : 'Failed to reject booking.';
        showAlert(msg, 'danger');
        $btn.prop('disabled', false).text('Reject');
      });
  }

  // ---------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------

  function escapeHtml(str) {
    if (!str) return '';
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
  }

  // ---------------------------------------------------------------
  // Initialization - detect current page and bind events
  // ---------------------------------------------------------------

  function init() {
    // Common setup for all owner pages
    $('#navToggle').on('click', function () {
      $('#navLinks').toggleClass('open');
    });

    $(document).on('click', '#logout-btn', function (e) {
      e.preventDefault();
      Auth.logout();
    });

    // Auth check - redirect if not owner
    Auth.redirectIfNotRole('owner').then(function (user) {
      if (!user) return;
      Auth.updateNavbar();

      var page = window.location.pathname;

      // Dashboard
      if (page.indexOf('/owner/dashboard') !== -1) {
        loadDashboard();
      }

      // Profile
      if (page.indexOf('/owner/profile') !== -1) {
        loadProfile();

        $('#profile-form').on('submit', function (e) {
          e.preventDefault();
          saveProfile();
        });

        $('#schedule-form').on('submit', function (e) {
          e.preventDefault();
          saveSchedule();
        });

        // Service toggle handler
        $(document).on('change', '.service-toggle', function () {
          var serviceId = $(this).data('service-id');
          var enabled = $(this).is(':checked');
          var customPrice = $('.price-input[data-service-id="' + serviceId + '"]').val();
          toggleService(serviceId, enabled, customPrice);
        });

        // Service price change handler (save on blur)
        $(document).on('change', '.price-input', function () {
          var serviceId = $(this).data('service-id');
          var $toggle = $('.service-toggle[data-service-id="' + serviceId + '"]');
          // Only update price if service is enabled
          if ($toggle.is(':checked')) {
            var customPrice = $(this).val();
            saveServicePrice(serviceId, customPrice);
          }
        });
      }

      // Schedule
      if (page.indexOf('/owner/schedule') !== -1) {
        loadSchedule();

        $('#schedule-form').on('submit', function (e) {
          e.preventDefault();
          saveSchedule();
        });
      }

      // Bookings
      if (page.indexOf('/owner/bookings') !== -1) {
        // Set default date to today
        var today = new Date().toISOString().slice(0, 10);
        $('#filter-date').val(today);

        loadBookings(today, '');

        $('#filter-btn').on('click', function () {
          var date = $('#filter-date').val();
          var status = $('#filter-status').val();
          loadBookings(date, status);
        });

        $('#clear-filter-btn').on('click', function () {
          $('#filter-date').val('');
          $('#filter-status').val('');
          loadBookings('', '');
        });

        // Toggle booking detail expand/collapse
        $(document).on('click', '.booking-card-header', function () {
          var bookingId = $(this).closest('.booking-card').data('booking-id');
          $('#detail-' + bookingId).toggleClass('open');
        });

        // Confirm booking
        $(document).on('click', '.confirm-booking-btn', function (e) {
          e.stopPropagation();
          var bookingId = $(this).data('id');
          confirmBooking(bookingId);
        });

        // Reject booking
        $(document).on('click', '.reject-booking-btn', function (e) {
          e.stopPropagation();
          var bookingId = $(this).data('id');
          rejectBooking(bookingId);
        });
      }
    });
  }

  // Public API
  return {
    init: init,
    loadDashboard: loadDashboard,
    loadProfile: loadProfile,
    saveProfile: saveProfile,
    saveSchedule: saveSchedule,
    loadServices: loadServices,
    toggleService: toggleService,
    saveServicePrice: saveServicePrice,
    loadBookings: loadBookings,
    confirmBooking: confirmBooking,
    rejectBooking: rejectBooking,
  };

})();

// Auto-initialize when DOM is ready
$(function () {
  Owner.init();
});
