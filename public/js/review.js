(function() {
  const ReviewPage = {
    bookingId: null,
    rating: 0,

    async init() {
      const user = await Auth.redirectIfNotRole('customer');
      if (!user) return;
      Auth.updateNavbar();

      $('#navToggle').on('click', function() { $('#navLinks').toggleClass('active'); });
      $('#logout-btn').on('click', function(e) { e.preventDefault(); Auth.logout(); });

      this.bookingId = getQueryParam('bookingId');
      if (!this.bookingId) {
        showAlert('No booking specified', 'danger');
        return;
      }

      await this.loadBookingDetails();
      this.bindEvents();
    },

    async loadBookingDetails() {
      try {
        const res = await API.get('/customer/bookings');
        const booking = res.data.find(b => b.id === this.bookingId);
        if (!booking) {
          showAlert('Booking not found', 'danger');
          return;
        }

        if (booking.status !== 'completed') {
          showAlert('You can only review completed bookings', 'warning');
          $('#submit-review-btn').prop('disabled', true);
        }

        if (booking.review) {
          showAlert('You have already reviewed this booking', 'info');
          $('#submit-review-btn').prop('disabled', true);
          $('#star-rating').css('pointer-events', 'none');
          $('#comment').prop('disabled', true);
        }

        const profile = booking.ownerProfile || {};
        const services = (booking.bookingServices || []).map(bs => bs.service ? bs.service.name : '').join(', ');

        $('#booking-summary').html(`
          <h4>${this.escapeHtml(profile.salonName || 'Salon')}</h4>
          <p><strong>Date:</strong> ${formatDate(booking.bookingDate)}</p>
          <p><strong>Time:</strong> ${formatTime(booking.startTime)} - ${formatTime(booking.endTime)}</p>
          <p><strong>Services:</strong> ${this.escapeHtml(services)}</p>
          <p><strong>Total:</strong> ${formatPrice(booking.totalPrice)}</p>
        `);
      } catch (e) {
        showAlert('Failed to load booking details', 'danger');
      }
    },

    bindEvents() {
      const self = this;

      // Star rating - hover and click
      $('#star-rating .star').on('mouseenter', function() {
        const val = parseInt($(this).data('rating'));
        self.highlightStars(val);
      });

      $('#star-rating').on('mouseleave', function() {
        self.highlightStars(self.rating);
      });

      $('#star-rating .star').on('click', function() {
        self.rating = parseInt($(this).data('rating'));
        $('#rating-value').val(self.rating);
        self.highlightStars(self.rating);
        $('#submit-review-btn').prop('disabled', false);
      });

      $('#submit-review-btn').on('click', () => this.submitReview());
    },

    highlightStars(count) {
      $('#star-rating .star').each(function() {
        const val = parseInt($(this).data('rating'));
        $(this).toggleClass('active', val <= count);
      });
    },

    async submitReview() {
      if (this.rating === 0) {
        showAlert('Please select a rating', 'warning');
        return;
      }

      const btn = $('#submit-review-btn');
      btn.prop('disabled', true).text('Submitting...');

      try {
        await API.post('/customer/reviews', {
          bookingId: this.bookingId,
          rating: this.rating,
          comment: $('#comment').val().trim() || null,
        });

        showAlert('Review submitted successfully!', 'success');
        setTimeout(() => {
          window.location.href = '/customer/my-bookings.html';
        }, 1500);
      } catch (e) {
        btn.prop('disabled', false).text('Submit Review');
        showAlert(e.responseJSON?.message || 'Failed to submit review', 'danger');
      }
    },

    escapeHtml(str) {
      if (!str) return '';
      const div = document.createElement('div');
      div.textContent = str;
      return div.innerHTML;
    }
  };

  $(function() { ReviewPage.init(); });
})();
