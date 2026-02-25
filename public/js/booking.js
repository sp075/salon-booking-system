(function() {
  const Booking = {
    ownerId: null,
    ownerData: null,
    selectedServices: [],
    selectedDate: null,
    selectedSlot: null,
    availableSlots: [],
    bookingId: null,
    timerInterval: null,
    timerSeconds: 600, // 10 minutes

    async init() {
      const user = await Auth.redirectIfNotRole('customer');
      if (!user) return;
      Auth.updateNavbar();

      $('#navToggle').on('click', function() { $('#navLinks').toggleClass('active'); });
      $('#logout-btn').on('click', function(e) { e.preventDefault(); Auth.logout(); });

      this.ownerId = getQueryParam('ownerId');
      if (!this.ownerId) {
        showAlert('No salon specified', 'danger');
        return;
      }

      $('#back-link').attr('href', '/customer/owner-detail.html?id=' + this.ownerId);
      await this.loadOwnerData();
      this.bindEvents();
    },

    async loadOwnerData() {
      try {
        const res = await API.get('/customer/owners/' + this.ownerId);
        this.ownerData = res.data;
        const name = this.ownerData.salonName || 'Salon';
        $('#salon-name-display').text(name);
        this.renderServices();
      } catch (e) {
        showAlert('Failed to load salon data', 'danger');
      }
    },

    renderServices() {
      const $list = $('#services-list');
      $list.empty();
      const services = (this.ownerData.ownerServices || []).filter(os => os.isActive);

      if (services.length === 0) {
        $list.html('<p class="text-muted">No services available</p>');
        return;
      }

      services.forEach(os => {
        const svc = os.service || {};
        const price = os.customPrice || svc.defaultPrice || 0;
        $list.append(`
          <div class="service-option" data-service-id="${svc.id}" data-price="${price}" data-name="${this.escapeHtml(svc.name)}">
            <div>
              <input type="checkbox" id="svc-${svc.id}">
              <label for="svc-${svc.id}">
                <strong>${this.escapeHtml(svc.name)}</strong>
                <span class="text-muted ml-1">(${svc.durationMinutes || 30} min)</span>
              </label>
            </div>
            <div><strong>${formatPrice(price)}</strong></div>
          </div>
        `);
      });
    },

    bindEvents() {
      const self = this;

      // Service selection
      $(document).on('click', '.service-option', function(e) {
        if ($(e.target).is('input')) return;
        const $cb = $(this).find('input[type="checkbox"]');
        $cb.prop('checked', !$cb.prop('checked'));
        $(this).toggleClass('selected', $cb.prop('checked'));
        self.updateServiceSelection();
      });

      $(document).on('change', '.service-option input[type="checkbox"]', function() {
        $(this).closest('.service-option').toggleClass('selected', this.checked);
        self.updateServiceSelection();
      });

      // Step navigation
      $('#to-step-2').on('click', () => this.showStep(2));
      $('#to-step-1').on('click', () => this.showStep(1));
      $('#to-step-3').on('click', () => this.showStep(3));
      $('#to-step-2-back').on('click', () => this.showStep(2));

      // Date change
      $('#booking-date').on('change', () => this.onDateChange());

      // Create & confirm
      $('#create-booking-btn').on('click', () => this.createBooking());
      $('#confirm-booking-btn').on('click', () => this.confirmBooking());
      $('#cancel-hold-btn').on('click', () => this.cancelHold());

      // Set min date to today
      const today = new Date().toISOString().split('T')[0];
      $('#booking-date').attr('min', today).val(today);
    },

    updateServiceSelection() {
      this.selectedServices = [];
      $('.service-option.selected').each((_, el) => {
        this.selectedServices.push({
          id: parseInt($(el).data('service-id')),
          price: parseFloat($(el).data('price')),
          name: $(el).data('name'),
        });
      });

      const total = this.selectedServices.reduce((sum, s) => sum + s.price, 0);
      $('#step1-total').text(formatPrice(total));
      $('#to-step-2').prop('disabled', this.selectedServices.length === 0);
    },

    showStep(step) {
      $('.booking-step').hide();
      $(`#step-${step}`).show();
      $('.progress-step').removeClass('active done');
      for (let i = 1; i <= 3; i++) {
        const $s = $(`.progress-step[data-step="${i}"]`);
        if (i < step) $s.addClass('done');
        if (i === step) $s.addClass('active');
      }

      if (step === 2) this.onDateChange();
      if (step === 3) this.renderSummary();
    },

    async onDateChange() {
      const date = $('#booking-date').val();
      if (!date) return;

      this.selectedDate = date;
      this.selectedSlot = null;
      $('#to-step-3').prop('disabled', true);

      // Check day off
      if (this.ownerData && this.ownerData.dayOff !== null) {
        const dayOfWeek = new Date(date + 'T00:00:00').getDay();
        if (dayOfWeek === this.ownerData.dayOff) {
          $('#day-off-msg').show();
          $('#slots-container').html('<p class="text-muted">Salon is closed on this day</p>');
          return;
        }
      }
      $('#day-off-msg').hide();

      const serviceIds = this.selectedServices.map(s => s.id).join(',');
      try {
        $('#slots-container').html('<div class="loading-spinner"></div>');
        const res = await API.get(`/customer/owners/${this.ownerId}/slots?date=${date}&services=${serviceIds}`);
        this.availableSlots = res.data;
        this.renderSlotGrid();
      } catch (e) {
        $('#slots-container').html('<p class="text-danger">Failed to load available slots</p>');
      }
    },

    renderSlotGrid() {
      const $container = $('#slots-container');
      $container.empty();

      if (!this.availableSlots || this.availableSlots.length === 0) {
        $container.html('<div class="no-slots-message"><p>No available slots for this date</p></div>');
        return;
      }

      const $grid = $('<div class="slot-grid"></div>');
      this.availableSlots.forEach(slot => {
        const time = slot.start || slot;
        $grid.append(`
          <div class="slot-item available" data-time="${time}">
            ${formatTime(time)}
          </div>
        `);
      });

      $container.append($grid);

      const self = this;
      $container.on('click', '.slot-item.available', function() {
        $('.slot-item').removeClass('selected');
        $(this).addClass('selected');
        self.selectedSlot = $(this).data('time');
        $('#to-step-3').prop('disabled', false);
      });
    },

    renderSummary() {
      const $summary = $('#booking-summary');
      let servicesHtml = this.selectedServices.map(s =>
        `<div class="row mb-1"><div class="col">${this.escapeHtml(s.name)}</div><div class="col text-right" style="flex:0;min-width:100px">${formatPrice(s.price)}</div></div>`
      ).join('');

      const total = this.selectedServices.reduce((sum, s) => sum + s.price, 0);
      const numSlots = this.selectedServices.length;
      const endMinutes = this.timeToMinutes(this.selectedSlot) + (numSlots * 30);
      const endTime = this.minutesToTimeStr(endMinutes);

      $summary.html(`
        <div class="mb-2">
          <h4>${this.escapeHtml(this.ownerData.salonName || 'Salon')}</h4>
          <p><strong>Date:</strong> ${formatDate(this.selectedDate)}</p>
          <p><strong>Time:</strong> ${formatTime(this.selectedSlot)} - ${formatTime(endTime)}</p>
        </div>
        <div class="divider"></div>
        <h4 class="mb-1">Services</h4>
        ${servicesHtml}
        <div class="divider"></div>
        <div class="row"><div class="col"><strong>Total</strong></div><div class="col text-right" style="flex:0;min-width:100px"><strong>${formatPrice(total)}</strong></div></div>
      `);
    },

    async createBooking() {
      const btn = $('#create-booking-btn');
      btn.prop('disabled', true).text('Creating...');

      try {
        const res = await API.post('/customer/bookings', {
          ownerProfileId: this.ownerId,
          bookingDate: this.selectedDate,
          startTime: this.selectedSlot,
          serviceIds: this.selectedServices.map(s => s.id),
        });

        this.bookingId = res.data.id;
        this.showConfirmStep(res.data);
      } catch (e) {
        btn.prop('disabled', false).text('Create Booking');
        showAlert(e.responseJSON?.message || 'Failed to create booking', 'danger');
      }
    },

    showConfirmStep(booking) {
      $('.booking-step').hide();
      $('#step-4').show();

      const total = this.selectedServices.reduce((sum, s) => sum + s.price, 0);
      const numSlots = this.selectedServices.length;
      const endMinutes = this.timeToMinutes(this.selectedSlot) + (numSlots * 30);
      const endTime = this.minutesToTimeStr(endMinutes);

      $('#confirm-summary').html(`
        <p><strong>Salon:</strong> ${this.escapeHtml(this.ownerData.salonName || 'Salon')}</p>
        <p><strong>Date:</strong> ${formatDate(this.selectedDate)}</p>
        <p><strong>Time:</strong> ${formatTime(this.selectedSlot)} - ${formatTime(endTime)}</p>
        <p><strong>Services:</strong> ${this.selectedServices.map(s => s.name).join(', ')}</p>
        <p><strong>Total:</strong> ${formatPrice(total)}</p>
      `);

      this.startTimer();
    },

    startTimer() {
      this.timerSeconds = 600;
      this.updateTimerDisplay();
      this.timerInterval = setInterval(() => {
        this.timerSeconds--;
        this.updateTimerDisplay();
        if (this.timerSeconds <= 0) {
          clearInterval(this.timerInterval);
          showAlert('Booking hold expired. Please try again.', 'danger');
          setTimeout(() => { window.location.reload(); }, 2000);
        }
      }, 1000);
    },

    updateTimerDisplay() {
      const min = Math.floor(this.timerSeconds / 60);
      const sec = this.timerSeconds % 60;
      $('#countdown-timer').text(
        String(min).padStart(2, '0') + ':' + String(sec).padStart(2, '0')
      );
      if (this.timerSeconds <= 60) {
        $('#countdown-timer').css('color', 'var(--color-danger)');
      }
    },

    async confirmBooking() {
      const btn = $('#confirm-booking-btn');
      btn.prop('disabled', true).text('Confirming...');

      try {
        await API.put('/customer/bookings/' + this.bookingId + '/confirm');
        clearInterval(this.timerInterval);

        $('.booking-step').hide();
        $('#step-success').show();
        $('#success-details').html(`
          <p><strong>Date:</strong> ${formatDate(this.selectedDate)}</p>
          <p><strong>Time:</strong> ${formatTime(this.selectedSlot)}</p>
          <p><strong>Services:</strong> ${this.selectedServices.map(s => s.name).join(', ')}</p>
        `);
      } catch (e) {
        btn.prop('disabled', false).text('Confirm Booking');
        showAlert(e.responseJSON?.message || 'Failed to confirm booking', 'danger');
      }
    },

    async cancelHold() {
      if (!confirm('Cancel this booking?')) return;
      try {
        await API.put('/customer/bookings/' + this.bookingId + '/cancel');
        clearInterval(this.timerInterval);
        showAlert('Booking cancelled', 'info');
        setTimeout(() => {
          window.location.href = '/customer/owner-detail.html?id=' + this.ownerId;
        }, 1500);
      } catch (e) {
        showAlert('Failed to cancel', 'danger');
      }
    },

    timeToMinutes(timeStr) {
      if (!timeStr) return 0;
      const parts = timeStr.split(':');
      return parseInt(parts[0]) * 60 + parseInt(parts[1]);
    },

    minutesToTimeStr(minutes) {
      const h = String(Math.floor(minutes / 60)).padStart(2, '0');
      const m = String(minutes % 60).padStart(2, '0');
      return h + ':' + m;
    },

    escapeHtml(str) {
      if (!str) return '';
      const div = document.createElement('div');
      div.textContent = str;
      return div.innerHTML;
    }
  };

  $(function() { Booking.init(); });
})();
