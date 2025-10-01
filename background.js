chrome.runtime.onInstalled.addListener(() => {
  console.log('NStop instalado');
  chrome.storage.local.get('rules', (res) => {
    if (!res.rules) chrome.storage.local.set({ rules: {} });
  });
});

function hhmmToMinutes(hhmm) {
  const [h, m] = hhmm.split(':').map(x => parseInt(x, 10));
  return h * 60 + m;
}

function isNowInInterval(start, end) {
  const now = new Date();
  const minutesNow = now.getHours() * 60 + now.getMinutes();
  const s = hhmmToMinutes(start);
  const e = hhmmToMinutes(end);
  if (s <= e) {
    return minutesNow >= s && minutesNow < e;
  } else {
    return minutesNow >= s || minutesNow < e;
  }
}

async function shouldBlockHostname(hostname) {
  const stored = await chrome.storage.local.get('rules');
  const rules = stored.rules || {};
  const parts = hostname.split('.');
  for (let i = 0; i < parts.length - 1; i++) {
    const domain = parts.slice(i).join('.');
    if (rules[domain]) {
      for (const rule of rules[domain]) {
        if (isNowInInterval(rule.start, rule.end)) {
          return { block: rule.block, rule };
        }
      }
    }
  }
  return null;
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg && msg.type === 'check-hostname') {
    const hostname = msg.hostname;
    shouldBlockHostname(hostname).then(result => {
      sendResponse({ result });
      if (result && result.block) {
        chrome.notifications.create({
          type: 'basic',
          iconUrl: 'icons/icon48.png',
          title: 'NStop',
          message: `Volta a trabalhar seu moço(a).`
        });
      }
    });
    return true;
  }

  if (msg && msg.type === 'rules-updated') {
    chrome.tabs.query({}, (tabs) => {
      for (const t of tabs) {
        if (t.id) chrome.tabs.sendMessage(t.id, { type: 'recheck' }, () => {});
      }
    });
  }
});