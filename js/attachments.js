// Attachments and Links Module

function openLightbox(url) {
  const lightbox = document.getElementById('image-lightbox');
  const img = document.getElementById('lightbox-img');
  if (lightbox && img) {
    img.src = url;
    lightbox.style.display = 'flex';
  }
}

function closeLightbox() {
  const lightbox = document.getElementById('image-lightbox');
  const img = document.getElementById('lightbox-img');
  if (lightbox && img) {
    lightbox.style.display = 'none';
    img.src = '';
  }
}

function generateAttachmentId() {
  return 'att_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
}

function renderAttachmentsListHtml(attachments, onRemoveCode) {
  if (!attachments || attachments.length === 0) return '<p class="text-xs text-slate-500">No attachments yet.</p>';
  return attachments.map((att, idx) => {
    const icon = att.type === 'link' ? '🔗' : '🖼️';
    const isImage = att.type === 'image';
    const linkStr = isImage
      ? `<button type="button" class="text-blue-600 underline text-left" onclick="openLightbox('${att.value}')">${escapeHtmlText(att.name)}</button>`
      : `<a href="${att.value}" target="_blank" class="text-blue-600 underline">${escapeHtmlText(att.name)}</a>`;
    return `
      <div class="flex justify-between items-center bg-slate-50 border border-slate-200 rounded px-2 py-1 text-sm">
        <div class="flex items-center gap-2 overflow-hidden whitespace-nowrap">
          <span>${icon}</span>
          ${linkStr}
        </div>
        <button type="button" class="text-red-500 hover:text-red-700 ml-2" onclick="${onRemoveCode}(${idx})">✖</button>
      </div>
    `;
  }).join('');
}

function renderAttachmentsPillsHtml(attachments) {
  if (!attachments || attachments.length === 0) return '';
  return attachments.map(att => {
    const icon = att.type === 'link' ? '🔗' : '🖼️';
    const isImage = att.type === 'image';
    if (isImage) {
      return `<button type="button" class="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 border border-slate-200 rounded text-xs text-slate-700 hover:bg-slate-200 transition-colors" onclick="event.stopPropagation(); openLightbox('${att.value}')" title="${escapeHtmlText(att.name)}">
        <span>${icon}</span> <span class="max-w-[100px] truncate">${escapeHtmlText(att.name)}</span>
      </button>`;
    } else {
      return `<a href="${att.value}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 border border-slate-200 rounded text-xs text-slate-700 hover:bg-slate-200 transition-colors" onclick="event.stopPropagation();" title="${escapeHtmlText(att.name)}">
        <span>${icon}</span> <span class="max-w-[100px] truncate">${escapeHtmlText(att.name)}</span>
      </a>`;
    }
  }).join(' ');
}

function readImageFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = (e) => reject(e);
    reader.readAsDataURL(file);
  });
}

window._currentAttachments = [];

function promptAddJourneyLink() {
  const url = prompt('Enter URL (e.g. https://...):');
  if (!url) return;
  const label = prompt('Enter label (e.g. Boarding Pass, Booking Link):') || 'Link';
  window._currentAttachments.push({ id: generateAttachmentId(), type: 'link', name: label, value: url });
  renderJourneyAttachmentsList();
}

async function handleJourneyImageUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  try {
    const base64 = await readImageFile(file);
    const label = prompt('Enter label (e.g. Ticket Screenshot):') || file.name;
    window._currentAttachments.push({ id: generateAttachmentId(), type: 'image', name: label, value: base64 });
    renderJourneyAttachmentsList();
  } catch (e) {
    alert('Failed to read image.');
  }
  event.target.value = '';
}

function renderJourneyAttachmentsList() {
  const container = document.getElementById('journeyAttachmentsList');
  if (container) {
    container.innerHTML = renderAttachmentsListHtml(window._currentAttachments, 'removeJourneyAttachment');
  }
}

function removeJourneyAttachment(index) {
  window._currentAttachments.splice(index, 1);
  renderJourneyAttachmentsList();
}

function promptAddStayLink() {
  const url = prompt('Enter URL (e.g. https://...):');
  if (!url) return;
  const label = prompt('Enter label (e.g. Airbnb Link, Receipt):') || 'Link';
  window._currentAttachments.push({ id: generateAttachmentId(), type: 'link', name: label, value: url });
  renderStayAttachmentsList();
}

async function handleStayImageUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  try {
    const base64 = await readImageFile(file);
    const label = prompt('Enter label (e.g. Receipt Screenshot):') || file.name;
    window._currentAttachments.push({ id: generateAttachmentId(), type: 'image', name: label, value: base64 });
    renderStayAttachmentsList();
  } catch (e) {
    alert('Failed to read image.');
  }
  event.target.value = '';
}

function renderStayAttachmentsList() {
  const container = document.getElementById('stayAttachmentsList');
  if (container) {
    container.innerHTML = renderAttachmentsListHtml(window._currentAttachments, 'removeStayAttachment');
  }
}

function removeStayAttachment(index) {
  window._currentAttachments.splice(index, 1);
  renderStayAttachmentsList();
}
