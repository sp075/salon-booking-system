(function() {
  const Customer = {
    salons: [],
    bookings: [],

    async init() {
      const user = await Auth.redirectIfNotRole('customer');
      if (!user) return;
      Auth.updateNavbar();

      // Nav toggle
      $('#navToggle').on('click', function() { $('#navLinks').toggleClass('active'); });
      $('#logout-btn').on('click', function(e) { e.preventDefault(); Auth.logout(); });

      const path = window.location.pathname;
      if (path.includes('/customer/dashboard.html')) {
        this.initDashboard();
      } else if (path.includes('/customer/owner-detail.html')) {
        this.initOwnerDetail();
      } else if (path.includes('/customer/my-bookings.html')) {
        this.initMyBookings();
      }
    },

    // === Dashboard ===
    async initDashboard() {
      await this.loadServices();
      await this.loadSalons();

      $('#search-btn').on('click', () => this.filterSalons());
      $('#service-filter').on('change', () => this.filterSalons());
      $('#search-input').on('keypress', (e) => {
        if (e.key === 'Enter') this.filterSalons();
      });
    },

    async loadServices() {
      try {
        const res = await API.get('/services');
        const services = res.data;
        const $filter = $('#service-filter');
        services.forEach(s => {
          $filter.append(`<option value="${s.name}">${s.name}</option>`);
        });
      } catch (e) {
        console.error('Failed to load services', e);
      }
    },

    async loadSalons(serviceFilter) {
      try {
        let url = '/customer/owners';
        if (serviceFilter) url += '?service=' + encodeURIComponent(serviceFilter);
        const res = await API.get(url);
        this.salons = res.data;
        this.renderSalonCards(this.salons);
      } catch (e) {
        showAlert('Failed to load salons', 'danger');
      }
    },

    renderSalonCards(salons) {
      const $container = $('#salons-container');
      $container.empty();

      if (!salons || salons.length === 0) {
        $container.hide();
        $('#no-results').show();
        return;
      }

      $('#no-results').hide();
      $container.show();

      salons.forEach(salon => {
        const user = salon.user || {};
        const name = salon.salonName || (user.firstName + ' ' + user.lastName + "'s Salon");
        const rating = parseFloat(salon.avgRating) || 0;
        const stars = '&#9733;'.repeat(Math.round(rating)) + '&#9734;'.repeat(5 - Math.round(rating));
        const services = (salon.ownerServices || [])
          .filter(os => os.isActive)
          .map(os => os.service ? os.service.name : '')
          .filter(Boolean)
          .join(', ');

        $container.append(`
          <div class="col col-4">
            <div class="card mb-2">
              <div class="card-body">
                <h3>${this.escapeHtml(name)}</h3>
                <p class="text-muted">${this.escapeHtml(salon.address || 'No address set')}</p>
                <div class="mb-1">
                  <span style="color:#f5a623">${stars}</span>
                  <span class="text-muted">(${salon.totalReviews || 0} reviews)</span>
                </div>
                <p class="text-muted" style="font-size:14px">${this.escapeHtml(services || 'No services listed')}</p>
                <a href="/customer/owner-detail.html?id=${salon.id}" class="btn btn-primary btn-sm">View Details</a>
              </div>
            </div>
          </div>
        `);
      });
    },

    filterSalons() {
      const search = $('#search-input').val().toLowerCase().trim();
      const serviceFilter = $('#service-filter').val();

      if (serviceFilter) {
        this.loadSalons(serviceFilter);
        return;
      }

      let filtered = this.salons;
      if (search) {
        filtered = this.salons.filter(s => {
          const name = (s.salonName || '').toLowerCase();
          const addr = (s.address || '').toLowerCase();
          return name.includes(search) || addr.includes(search);
        });
      }
      this.renderSalonCards(filtered);
    },

    // === Owner Detail ===
    async initOwnerDetail() {
      const ownerId = getQueryParam('id');
      if (!ownerId) {
        showAlert('No salon specified', 'danger');
        return;
      }
      await this.loadOwnerDetail(ownerId);
    },

    async loadOwnerDetail(ownerId) {
      try {
        const res = await API.get('/customer/owners/' + ownerId);
        const owner = res.data;
        $('#owner-detail').hide();
        $('#salon-info').show();

        const user = owner.user || {};
        const name = owner.salonName || (user.firstName + "'s Salon");
        $('#salon-name').text(name);
        $('#salon-address').text(owner.address || 'No address');
        const rating = parseFloat(owner.avgRating) || 0;
        $('#salon-rating').text(rating.toFixed(1) + ' / 5.0');
        $('#salon-reviews').text('(' + (owner.totalReviews || 0) + ' reviews)');
        $('#salon-hours').text(
          (owner.openTime ? formatTime(owner.openTime) : 'N/A') + ' - ' +
          (owner.closeTime ? formatTime(owner.closeTime) : 'N/A')
        );
        $('#salon-dayoff').text(owner.dayOff !== null ? getDayName(owner.dayOff) : 'None');
        $('#book-now-btn').attr('href', '/customer/booking.html?ownerId=' + ownerId);

        this.renderOwnerServices(owner.ownerServices || []);
        this.renderReviews(owner.reviews || []);
      } catch (e) {
        showAlert('Failed to load salon details', 'danger');
      }
    },

    renderOwnerServices(ownerServices) {
      const $list = $('#services-list');
      $list.empty();
      const active = ownerServices.filter(os => os.isActive);

      if (active.length === 0) {
        $list.html('<p class="text-muted">No services available</p>');
        return;
      }

      active.forEach(os => {
        const service = os.service || {};
        const price = os.customPrice || service.defaultPrice || 0;
        $list.append(`
          <div class="row mb-1" style="padding:10px;border-bottom:1px solid var(--color-border)">
            <div class="col">
              <strong>${this.escapeHtml(service.name)}</strong>
              <span class="text-muted ml-1">${service.durationMinutes || 30} min</span>
            </div>
            <div class="col text-right" style="flex:0;min-width:100px">
              <strong>${formatPrice(price)}</strong>
            </div>
          </div>
        `);
      });
    },

    renderReviews(reviews) {
      const $list = $('#reviews-list');
      $list.empty();

      if (!reviews || reviews.length === 0) {
        $('#no-reviews').show();
        return;
      }

      reviews.forEach(r => {
        const customer = r.customer || {};
        const name = (customer.firstName || '') + ' ' + (customer.lastName || '');
        const stars = '&#9733;'.repeat(r.rating) + '&#9734;'.repeat(5 - r.rating);
        $list.append(`
          <div class="mb-2" style="padding:12px;border-bottom:1px solid var(--color-border)">
            <div class="row">
              <div class="col">
                <strong>${this.escapeHtml(name)}</strong>
                <span style="color:#f5a623;margin-left:8px">${stars}</span>
              </div>
              <div class="col text-right" style="flex:0;white-space:nowrap">
                <span class="text-muted">${r.createdAt ? formatDate(r.createdAt.split('T')[0]) : ''}</span>
              </div>
            </div>
            ${r.comment ? '<p class="mt-1 text-muted">' + this.escapeHtml(r.comment) + '</p>' : ''}
          </div>
        `);
      });
    },

    // === My Bookings ===
    async initMyBookings() {
      await this.loadMyBookings();
      $('#status-filter').on('change', () => this.filterBookings());
      $(document).on('click', '.cancel-booking-btn', (e) => {
        const id = $(e.currentTarget).data('id');
        this.cancelBooking(id);
      });
    },

    async loadMyBookings() {
      try {
        const res = await API.get('/customer/bookings');
        this.bookings = res.data;
        this.renderBookings(this.bookings);
      } catch (e) {
        showAlert('Failed to load bookings', 'danger');
      }
    },

    renderBookings(bookings) {
      const $container = $('#bookings-container');
      $container.empty();

      if (!bookings || bookings.length === 0) {
        $container.hide();
        $('#no-bookings').show();
        return;
      }

      $('#no-bookings').hide();
      $container.show();

      bookings.forEach(b => {
        const profile = b.ownerProfile || {};
        const salonName = profile.salonName || 'Unknown Salon';
        const services = (b.bookingServices || []).map(bs => bs.service ? bs.service.name : '').join(', ');
        const hasReview = b.review !== null && b.review !== undefined;
        const canCancel = b.status === 'pending' || b.status === 'confirmed';
        const canReview = b.status === 'completed' && !hasReview;

        let actions = '';
        if (canCancel) {
          actions += `<button class="btn btn-danger btn-sm cancel-booking-btn" data-id="${b.id}">Cancel</button> `;
        }
        if (canReview) {
          actions += `<a href="/customer/review.html?bookingId=${b.id}" class="btn btn-primary btn-sm">Leave Review</a>`;
        }
        if (hasReview) {
          actions += `<span class="badge badge-success">Reviewed</span>`;
        }

        $container.append(`
          <div class="card mb-2">
            <div class="card-body">
              <div class="row">
                <div class="col">
                  <h3>${this.escapeHtml(salonName)}</h3>
                  <p class="text-muted">${formatDate(b.bookingDate)} | ${formatTime(b.startTime)} - ${formatTime(b.endTime)}</p>
                  <p class="text-muted" style="font-size:14px">${this.escapeHtml(services)}</p>
                </div>
                <div class="col text-right" style="flex:0;min-width:180px">
                  <span class="badge badge-${this.getStatusClass(b.status)}">${b.status}</span>
                  <p class="mt-1"><strong>${formatPrice(b.totalPrice)}</strong></p>
                  <div class="mt-1">${actions}</div>
                </div>
              </div>
            </div>
          </div>
        `);
      });
    },

    filterBookings() {
      const status = $('#status-filter').val();
      if (!status) {
        this.renderBookings(this.bookings);
      } else {
        this.renderBookings(this.bookings.filter(b => b.status === status));
      }
    },

    async cancelBooking(id) {
      if (!confirm('Are you sure you want to cancel this booking?')) return;
      try {
        await API.put('/customer/bookings/' + id + '/cancel');
        showAlert('Booking cancelled successfully', 'success');
        await this.loadMyBookings();
      } catch (e) {
        showAlert(e.responseJSON?.message || 'Failed to cancel booking', 'danger');
      }
    },

    getStatusClass(status) {
      const map = { pending: 'warning', confirmed: 'success', completed: 'info', cancelled: 'danger', rejected: 'danger', abandoned: 'danger' };
      return map[status] || 'info';
    },

    escapeHtml(str) {
      if (!str) return '';
      const div = document.createElement('div');
      div.textContent = str;
      return div.innerHTML;
    }
  };

  $(function() { Customer.init(); });
})();
