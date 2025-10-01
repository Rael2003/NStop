function getHostname() {
  return location.hostname;
}

let overlayEl = null;
function createOverlay(message, showClose) {
  removeOverlay();
  overlayEl = document.createElement('div');
  overlayEl.style.position = 'fixed';
  overlayEl.style.top = '0';
  overlayEl.style.left = '0';
  overlayEl.style.width = '100%';
  overlayEl.style.height = '100%';
  overlayEl.style.zIndex = '99999999';
  overlayEl.style.display = 'flex';
  overlayEl.style.alignItems = 'center';
  overlayEl.style.justifyContent = 'center';
  overlayEl.style.background = 'rgba(0,0,0,0.85)';
  overlayEl.style.color = 'white';
  overlayEl.style.fontFamily = 'Arial, sans-serif';
  overlayEl.style.textAlign = 'center';
  overlayEl.innerHTML = `
    <div style="max-width:720px;padding:24px;">
      <h2 style="margin:0 0 8px 0;">NStop</h2>
      <p style="margin:0 0 16px 0;">${message}</p>
      <div style="display:flex;gap:8px;justify-content:center;">
        ${showClose ? '<button id="hc-close" style="padding:8px 12px;border-radius:6px;border:none;cursor:pointer">Sair do site</button>' : ''}
        <button id="hc-dismiss" style="padding:8px 12px;border-radius:6px;border:none;cursor:pointer">Entendi</button>
      </div>
    </div>
  `;
  document.documentElement.appendChild(overlayEl);
  if (showClose) {
    document.getElementById('hc-close').addEventListener('click', () => {
      try { location.href = 'about:blank'; } catch {}
    });
  }
  document.getElementById('hc-dismiss').addEventListener('click', () => {
    removeOverlay();
  });
}

function removeOverlay() {
  if (overlayEl && overlayEl.parentNode) overlayEl.parentNode.removeChild(overlayEl);
  overlayEl = null;
}

function checkNow() {
  const hostname = getHostname();
  chrome.runtime.sendMessage({ type: 'check-hostname', hostname }, (resp) => {
    try {
      if (!resp || !resp.result) {
        removeOverlay();
        return;
      }
      const { block, rule } = resp.result;
      const msg = `Este site (${hostname}) está dentro do período bloqueado: ${rule.start} → ${rule.end}.`;
      if (block) {
        createOverlay(msg, true);
      } else {
        createOverlay(msg + ' (modo apenas alerta)', true);
      }
    } catch (e) {
      console.error('HoraCerta check error', e);
    }
  });
}

chrome.runtime.onMessage.addListener((m) => {
  if (m && m.type === 'recheck') {
    checkNow();
  }
});

checkNow();