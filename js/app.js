const IPIntelApp = (() => {
  const state = { isLoading: false, abortController: null };

  const dom = {
    fab: document.getElementById('fab-refresh'),
    statusDot: document.getElementById('main-status'),
    connectionType: document.getElementById('connection-type'),
    skeletons: {
      v4: document.getElementById('sk-v4'),
      v6: document.getElementById('sk-v6'),
      flag: document.getElementById('sk-flag'),
      country: document.getElementById('sk-country'),
      isp: document.getElementById('sk-isp'),
      city: document.getElementById('sk-city')
    },
    values: {
      v4: document.getElementById('val-v4'),
      v6: document.getElementById('val-v6'),
      flagImg: document.getElementById('img-flag'),
      country: document.getElementById('val-country'),
      isp: document.getElementById('val-isp'),
      city: document.getElementById('val-city'),
      debug: document.getElementById('debug-output')
    },
    toast: document.getElementById('toast')
  };

  async function handleRefresh() {
    if (state.isLoading) return;
    setLoading(true);

    if (state.abortController) state.abortController.abort();
    state.abortController = new AbortController();
    const { signal } = state.abortController;

    try {
      const [v4, v6] = await Promise.allSettled([
        fetch('https://api.ipify.org?format=json', { signal }).then(r => r.json()),
        fetch('https://api64.ipify.org?format=json', { signal }).then(r => r.json())
      ]);

      const ipv4 = v4.status === 'fulfilled' ? v4.value.ip : 'Unavailable';
      const ipv6 = v6.status === 'fulfilled' ? v6.value.ip : 'Not Detected';
      renderValue('v4', ipv4);
      renderValue('v6', ipv6);

      if (ipv4 && ipv4 !== 'Unavailable') {
        const geoRes = await fetch(`https://ipapi.co/${ipv4}/json/`, { signal });
        const geoData = await geoRes.json();
        renderGeo(geoData);
        updateStatusIndicator(geoData.org);
      } else {
        updateStatusIndicator(null);
      }
    } catch (err) {
      if (err.name !== 'AbortError') showToast("Network Error. Try again.");
    } finally {
      setLoading(false);
    }
  }

  function setLoading(loading) {
    state.isLoading = loading;
    dom.fab.disabled = loading;
    dom.fab.classList.toggle('loading', loading);

    Object.values(dom.skeletons).forEach(el => el.classList.toggle('hidden', !loading));
    Object.values(dom.values).forEach(el => {
      if (el.tagName !== 'PRE') el.classList.toggle('hidden', loading);
    });

    if (loading) {
      dom.statusDot.className = 'status-dot';
      dom.connectionType.querySelector('span').innerText = "DETECTING...";
    }
  }

  function renderValue(key, text) {
    const skeleton = dom.skeletons[key];
    const value = dom.values[key];
    if (skeleton) skeleton.classList.add('hidden');
    if (value) {
      value.textContent = text;
      value.classList.remove('hidden');
    }
  }

  function renderGeo(data) {
    renderValue('country', data.country_name || 'Unknown');
    if (data.country_code) {
      dom.values.flagImg.src = `https://flagcdn.com/w80/${data.country_code.toLowerCase()}.png`;
      dom.values.flagImg.classList.remove('hidden');
      dom.skeletons.flag.classList.add('hidden');
    }
    renderValue('isp', data.org || 'Unknown ISP');
    renderValue('city', data.city ? `${data.city}, ${data.region_code || ''}` : 'Unknown');
    dom.values.debug.textContent = JSON.stringify(data, null, 2);
  }

  function updateStatusIndicator(org) {
    const secure = /vpn|proxy|hosting|datacenter|cloud/i.test(org || '');
    dom.statusDot.className = `status-dot ${secure ? 'active' : 'warning'}`;
    dom.connectionType.querySelector('span').innerText = secure ? "SECURE / MASKED" : "DIRECT EXPOSURE";
    dom.connectionType.style.color = secure ? "var(--success)" : "var(--primary)";
  }

  function showToast(msg) {
    dom.toast.textContent = msg;
    dom.toast.classList.add('show');
    setTimeout(() => dom.toast.classList.remove('show'), 2000);
  }

  function copyToClipboard(id) {
    const text = document.getElementById(id)?.innerText;
    if (text && !text.includes('...')) {
      navigator.clipboard.writeText(text).then(() => showToast("Copied to Clipboard"));
    }
  }

  function toggleDebug() {
    dom.values.debug.classList.toggle('hidden');
  }

  dom.fab.addEventListener('click', handleRefresh);
  document.addEventListener('DOMContentLoaded', handleRefresh);

  return { copyToClipboard, toggleDebug };
})();
