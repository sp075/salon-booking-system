const API = {
  baseUrl: '/api',

  request(method, url, data) {
    return $.ajax({
      url: this.baseUrl + url,
      method: method,
      contentType: 'application/json',
      data: data ? JSON.stringify(data) : undefined,
      xhrFields: { withCredentials: true },
    });
  },

  get(url) { return this.request('GET', url); },
  post(url, data) { return this.request('POST', url, data); },
  put(url, data) { return this.request('PUT', url, data); },
  delete(url) { return this.request('DELETE', url); },
};
