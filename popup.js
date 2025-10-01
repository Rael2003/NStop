const domainInput = document.getElementById('domain');
const startInput = document.getElementById('start');
const endInput = document.getElementById('end');
const addBtn = document.getElementById('addBtn');
const rulesList = document.getElementById('rulesList');
const blockModeCheckbox = document.getElementById('blockMode');

function normalizeDomain(d) {
  return d.trim().replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0].toLowerCase();
}

function loadRulesToUI(rules) {
  rulesList.innerHTML = '';
  const keys = Object.keys(rules || {});
  if (keys.length === 0) {
    rulesList.innerHTML = '<div class="small">Nenhuma regra salva.</div>';
    return;
  }
  keys.forEach(domain => {
    (rules[domain] || []).forEach((rule, idx) => {
      const div = document.createElement('div');
      div.className = 'rule';
      div.innerHTML = `
        <div><strong>${domain}</strong> <span class="small">(${rule.block ? 'Bloquear' : 'Apenas alertar'})</span></div>
        <div class="small">De ${rule.start} até ${rule.end}</div>
        <div style="margin-top:6px;"><button data-domain="${domain}" data-idx="${idx}" class="remove">Remover</button></div>
      `;
      rulesList.appendChild(div);
    });
  });
  document.querySelectorAll('.remove').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const domain = e.target.dataset.domain;
      const idx = Number(e.target.dataset.idx);
      const stored = await chrome.storage.local.get('rules');
      const rules = stored.rules || {};
      if (!rules[domain]) return;
      rules[domain].splice(idx, 1);
      if (rules[domain].length === 0) delete rules[domain];
      await chrome.storage.local.set({ rules });
      loadRulesToUI(rules);
      chrome.runtime.sendMessage({ type: 'rules-updated' });
    });
  });
}

async function load() {
  const stored = await chrome.storage.local.get('rules');
  loadRulesToUI(stored.rules || {});
}

addBtn.addEventListener('click', async () => {
  const domainRaw = domainInput.value;
  const start = startInput.value.trim();
  const end = endInput.value.trim();
  const block = blockModeCheckbox.checked;

  if (!domainRaw || !start || !end) {
    alert('Preencha domínio, início e fim.');
    return;
  }
  const domain = normalizeDomain(domainRaw);
  if (!/^\d{1,2}:\d{2}$/.test(start) || !/^\d{1,2}:\d{2}$/.test(end)) {
    alert('Use formato HH:MM (ex: 09:00).');
    return;
  }

  const stored = await chrome.storage.local.get('rules');
  const rules = stored.rules || {};
  rules[domain] = rules[domain] || [];
  rules[domain].push({ start, end, block });
  await chrome.storage.local.set({ rules });
  loadRulesToUI(rules);
  domainInput.value = '';
  startInput.value = '';
  endInput.value = '';
  chrome.runtime.sendMessage({ type: 'rules-updated' });
});

load();