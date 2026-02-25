const Auth = {
  user: null,

  async checkAuth() {
    try {
      const res = await API.get('/auth/me');
      this.user = res.data;
      window.currentUser = this.user;
      return this.user;
    } catch (e) {
      this.user = null;
      window.currentUser = null;
      return null;
    }
  },

  async redirectIfNotLoggedIn() {
    const user = await this.checkAuth();
    if (!user) {
      window.location.href = '/login.html';
      return null;
    }
    return user;
  },

  async redirectIfNotRole(role) {
    const user = await this.redirectIfNotLoggedIn();
    if (!user) return null;
    if (user.role !== role) {
      window.location.href = user.role === 'owner'
        ? '/owner/dashboard.html'
        : '/customer/dashboard.html';
      return null;
    }
    return user;
  },

  async logout() {
    try { await API.post('/auth/logout'); } catch (e) {}
    window.location.href = '/login.html';
  },

  updateNavbar() {
    if (this.user) {
      $('.nav-auth').hide();
      $('.nav-user').show();
      $('#nav-user-name').text(this.user.firstName + ' ' + this.user.lastName);
      if (this.user.role === 'owner') {
        $('.nav-owner').show();
        $('.nav-customer').hide();
      } else {
        $('.nav-customer').show();
        $('.nav-owner').hide();
      }
    } else {
      $('.nav-auth').show();
      $('.nav-user').hide();
      $('.nav-owner').hide();
      $('.nav-customer').hide();
    }
  }
};
