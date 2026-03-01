const IPIntelApp = (() => {
  const state = { loading: false, controller: null };
  const el = {
    fab: document.getElementById('fab-refresh'),
    toast: document.getElementById('toast'),
    debug: document.getElementById('debug-output')
  };

  async function fetchData() {
    if (state.loading) return;
    setLoading(true);

    try {
      const ipv4 = await fetchJSON('https://api.ipify.org?format=json');
      const ipv6 = await fetchJSON('https://api64.ipify.org?format=json');
      const geo = await fetchJSON(`https://ipapi.co/${ipv4.ip}/json/`);
      renderData(ipv4, ipv6, geo);
    } catch (e) {
      showToast('Network error');
    } finally {
      setLoading(false);
    }
  }

  async function fetchJSON(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error('Fetch failed');
    return res.json();
  }

  function renderData(ipv4, ipv6, geo) {
    el.debug.textContent = JSON.stringify({ ipv4, ipv6, geo }, null, 2);
  }

  function showToast(msg) {
    el.toast.textContent = msg;
    el.toast.classList.add('show');
    setTimeout(() => el.toast.classList.remove('show'), 2000);
  }

  function setLoading(on) {
    state.loading = on;
    el.fab.disabled = on;
    el.fab.classList.toggle('loading', on);
  }

  document.addEventListener('DOMContentLoaded', fetchData);
  el.fab.addEventListener('click', fetchData);
})();
