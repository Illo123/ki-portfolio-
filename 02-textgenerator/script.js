// ===========================
// LEHRERBRIEF — INTERACTIONS
// ===========================

const generateBtn   = document.getElementById('generateBtn');
const resultBox     = document.getElementById('resultBox');
const resultText    = document.getElementById('resultText');
const resultMeta    = document.getElementById('resultMeta');
const resultActions = document.getElementById('resultActions');
const emptyState    = document.getElementById('emptyState');
const wordCount     = document.getElementById('wordCount');
const copyBtn       = document.getElementById('copyBtn');
const newBtn        = document.getElementById('newBtn');
const typeList      = document.getElementById('typeList');

let selectedEmpfänger = 'eltern';
let selectedType      = '';
let fullText          = '';

// Vorlagen pro Empfänger
const VORLAGEN = {
  eltern: [
    { value: 'elternbrief',            label: 'Allgemeiner Elternbrief' },
    { value: 'elterngespräch',         label: 'Einladung zum Elterngespräch' },
    { value: 'verhaltensauffälligkeit',label: 'Verhaltensauffälligkeit' },
    { value: 'leistungsrückgang',      label: 'Leistungsrückgang' },
    { value: 'klassenfahrt',           label: 'Klassenfahrt / Schulausflug' },
    { value: 'fehlzeiten',             label: 'Unentschuldigte Fehlzeiten' },
    { value: 'lob',                    label: 'Lob & positive Rückmeldung' },
  ],
  schulleitung: [
    { value: 'krankmeldung',       label: 'Krankmeldung' },
    { value: 'urlaubsantrag',      label: 'Urlaubsantrag' },
    { value: 'vorfallsbericht',    label: 'Vorfallsbericht' },
    { value: 'anschaffungsantrag', label: 'Anschaffungsantrag' },
    { value: 'bericht',            label: 'Allgemeiner Bericht' },
  ],
  kollegen: [
    { value: 'vertretung',      label: 'Vertretungsanfrage' },
    { value: 'besprechung',     label: 'Einladung zur Besprechung' },
    { value: 'info',            label: 'Information ans Kollegium' },
    { value: 'aufgabenübergabe',label: 'Aufgabenübergabe bei Abwesenheit' },
    { value: 'danke',           label: 'Dankesnachricht' },
  ],
};

// ===========================
// EMPFÄNGER WECHSELN
// ===========================
document.querySelectorAll('.recipient-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.recipient-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    selectedEmpfänger = btn.dataset.value;
    renderTypeList();
  });
});

function renderTypeList() {
  const vorlagen = VORLAGEN[selectedEmpfänger] || [];
  typeList.innerHTML = '';
  selectedType = vorlagen[0]?.value || '';

  vorlagen.forEach((v, i) => {
    const btn = document.createElement('button');
    btn.className = 'type-btn' + (i === 0 ? ' active' : '');
    btn.dataset.value = v.value;
    btn.textContent = v.label;
    btn.addEventListener('click', () => {
      document.querySelectorAll('.type-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedType = v.value;
    });
    typeList.appendChild(btn);
  });
}

// Initial rendern
renderTypeList();

// ===========================
// GENERIEREN
// ===========================
generateBtn.addEventListener('click', generieren);

async function generieren() {
  const details  = document.getElementById('details').value.trim();
  const klasse   = document.getElementById('klasse').value.trim();
  const ton      = document.getElementById('ton').value;
  const absender = document.getElementById('absender').value.trim();

  if (!details) {
    const ta = document.getElementById('details');
    ta.style.borderColor = 'rgba(134,44,53,0.7)';
    ta.focus();
    setTimeout(() => ta.style.borderColor = '', 1800);
    return;
  }

  // UI: Laden
  generateBtn.disabled = true;
  generateBtn.classList.add('loading');
  generateBtn.querySelector('.btn-text').textContent = 'Wird geschrieben…';

  emptyState.style.display   = 'none';
  resultActions.style.display = 'none';
  resultBox.style.display    = 'flex';
  resultText.className       = 'result-text streaming';
  resultText.textContent     = '';
  wordCount.textContent      = '';

  // Meta-Tags
  const empfängerLabel = { eltern: '👨‍👩‍👧 Eltern', schulleitung: '🏫 Schulleitung', kollegen: '👥 Kollegen' };
  const tonLabel       = { freundlich: '😊 Freundlich', formell: '🎩 Formell', sachlich: '📋 Sachlich' };
  const typLabel       = VORLAGEN[selectedEmpfänger]?.find(v => v.value === selectedType)?.label || '';

  resultMeta.innerHTML = `
    <span class="meta-tag highlight">${empfängerLabel[selectedEmpfänger]}</span>
    <span class="meta-tag">${typLabel}</span>
    <span class="meta-tag">${tonLabel[ton]}</span>
  `;

  // API-Anfrage
  try {
    const response = await fetch('/generieren', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ empfänger: selectedEmpfänger, texttyp: selectedType, details, ton, absender, klasse }),
    });

    const reader  = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    fullText = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop();

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const payload = line.slice(6);
        if (payload === '[DONE]') break;
        try {
          const { text } = JSON.parse(payload);
          fullText += text;
          resultText.textContent = fullText;
        } catch {}
      }
    }

    resultText.className = 'result-text';
    const wörter = fullText.trim().split(/\s+/).length;
    wordCount.textContent   = `${wörter} Wörter · Direkt kopieren und anpassen`;
    resultActions.style.display = 'flex';

  } catch {
    resultText.className   = 'result-text';
    resultText.textContent = '⚠️ Fehler. Ist der Server gestartet?';
  }

  generateBtn.disabled = false;
  generateBtn.classList.remove('loading');
  generateBtn.querySelector('.btn-text').textContent = 'Brief generieren';
}

// ===========================
// KOPIEREN
// ===========================
copyBtn.addEventListener('click', async () => {
  if (!fullText) return;
  await navigator.clipboard.writeText(fullText);
  copyBtn.classList.add('copied');
  copyBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:13px;height:13px"><path d="M20 6L9 17l-5-5"/></svg> Kopiert!`;
  setTimeout(() => {
    copyBtn.classList.remove('copied');
    copyBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="width:13px;height:13px"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg> Kopieren`;
  }, 2500);
});

// ===========================
// NEU GENERIEREN
// ===========================
newBtn.addEventListener('click', generieren);
