// bulk-upload.js — Admin CSV Bulk Upload (Business + Parish)

// ==========================================
// FIELD DEFINITIONS
// ==========================================

const CONFIGS = {
    business: {
        allFields: [
            'name', 'address', 'street', 'city', 'state', 'zip',
            'owner', 'phone', 'email', 'website', 'category',
            'description', 'tags', 'hasWifi', 'familyFriendly', 'hasParking'
        ],
        requiredFields: ['name', 'address', 'city'],
        endpoint: '/api/admin/bulk-upload',
        bodyKey: 'businesses',
        templateFilename: 'catholic-market-business-template.csv',
        templateSample: [
            ["St. Joseph's Coffee", "123 Main St, Wichita, KS 67202", "123 Main St", "Wichita", "KS", "67202", "John Doe", "(316) 555-0100", "info@sjcoffee.com", "https://sjcoffee.com", "Coffee Shop", "Parish coffee house", "coffee;food", "true", "true", "true"],
            ["Mary's Flowers", "789 Elm St, Wichita, KS 67203", "789 Elm St", "Wichita", "KS", "67203", "Mary Smith", "(316) 555-0200", "mary@flowers.com", "https://marysflowers.com", "Florist", "Beautiful arrangements", "flowers;gifts", "false", "true", "true"]
        ]
    },
    parish: {
        allFields: ['name', 'address', 'street', 'city', 'state', 'zip', 'phone', 'website', 'lat', 'lng'],
        requiredFields: ['name', 'address', 'city', 'state'],
        endpoint: '/api/admin/bulk-upload-parishes',
        bodyKey: 'parishes',
        templateFilename: 'catholic-market-parish-template.csv',
        templateSample: [
            ["Cathedral of the Immaculate Conception", "424 N Broadway, Wichita, KS 67202", "424 N Broadway", "Wichita", "KS", "67202", "(316) 262-1641", "https://catholicdioceseofwichita.org", "37.6922", "-97.3364"],
            ["St. Francis of Assisi", "861 N Socora, Wichita, KS 67212", "861 N Socora", "Wichita", "KS", "67212", "(316) 722-4404", "", "", ""]
        ]
    }
};

// ==========================================
// DOM REFERENCES (per type)
// ==========================================

function getDom(type) {
    const prefix = type;
    return {
        csvInput: document.getElementById(`${prefix}CsvInput`),
        uploadContent: document.getElementById(`${prefix}UploadContent`),
        fileSelected: document.getElementById(`${prefix}FileSelected`),
        fileName: document.getElementById(`${prefix}FileName`),
        fileSize: document.getElementById(`${prefix}FileSize`),
        removeFile: document.getElementById(`${prefix}RemoveFile`),
        preview: document.getElementById(`${prefix}Preview`),
        rowCount: document.getElementById(`${prefix}RowCount`),
        validCount: document.getElementById(`${prefix}ValidCount`),
        invalidCount: document.getElementById(`${prefix}InvalidCount`),
        previewHead: document.getElementById(`${prefix}PreviewHead`),
        previewBody: document.getElementById(`${prefix}PreviewBody`),
        uploadBtn: document.getElementById(`${prefix}UploadBtn`),
        results: document.getElementById(`${prefix}Results`),
        resultsMsg: document.getElementById(`${prefix}ResultsMsg`),
        uploadAnother: document.getElementById(`${prefix}UploadAnother`),
    };
}

// State per type
const state = {
    business: { parsedRows: [], validRows: [] },
    parish: { parsedRows: [], validRows: [] }
};

// ==========================================
// AUTH CHECK
// ==========================================

async function checkAuth() {
    try {
        const res = await fetch('/api/admin/submissions/pending');
        if (res.status === 401) window.location.href = '/admin/login.html';
    } catch { window.location.href = '/admin/login.html'; }
}
checkAuth();

document.getElementById('logoutBtn').addEventListener('click', async () => {
    try { await fetch('/api/admin/logout', { method: 'POST' }); } catch { }
    window.location.href = '/admin/login.html';
});

// ==========================================
// TAB SWITCHING
// ==========================================

document.querySelectorAll('.upload-tab').forEach(tab => {
    tab.addEventListener('click', () => {
        document.querySelectorAll('.upload-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.upload-panel').forEach(p => p.classList.remove('active'));
        tab.classList.add('active');
        const type = tab.dataset.type;
        document.getElementById(`${type}Panel`).classList.add('active');
    });
});

// ==========================================
// TEMPLATE DOWNLOAD
// ==========================================

document.getElementById('downloadBusinessTemplate').addEventListener('click', () => downloadTemplate('business'));
document.getElementById('downloadParishTemplate').addEventListener('click', () => downloadTemplate('parish'));

function downloadTemplate(type) {
    const cfg = CONFIGS[type];
    const header = cfg.allFields.join(',');
    const sampleRows = cfg.templateSample.map(row => row.map(v => `"${v}"`).join(',')).join('\n');
    const csv = `${header}\n${sampleRows}\n`;
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = cfg.templateFilename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// ==========================================
// GENERIC FILE HANDLING (wired per type)
// ==========================================

['business', 'parish'].forEach(type => {
    const dom = getDom(type);
    const cfg = CONFIGS[type];

    // Click to browse
    dom.uploadContent.addEventListener('click', () => dom.csvInput.click());

    // Drag events
    dom.uploadContent.addEventListener('dragover', (e) => {
        e.preventDefault();
        dom.uploadContent.classList.add('drag-over');
    });
    dom.uploadContent.addEventListener('dragleave', () => dom.uploadContent.classList.remove('drag-over'));
    dom.uploadContent.addEventListener('drop', (e) => {
        e.preventDefault();
        dom.uploadContent.classList.remove('drag-over');
        const file = e.dataTransfer.files[0];
        if (file && file.name.endsWith('.csv')) selectCSV(type, file);
    });

    // File input change
    dom.csvInput.addEventListener('change', (e) => {
        if (e.target.files[0]) selectCSV(type, e.target.files[0]);
    });

    // Remove file
    dom.removeFile.addEventListener('click', () => resetUploader(type));

    // Upload button
    dom.uploadBtn.addEventListener('click', () => doUpload(type));

    // Upload another
    dom.uploadAnother.addEventListener('click', () => resetUploader(type));
});

function selectCSV(type, file) {
    const dom = getDom(type);
    dom.fileName.textContent = file.name;
    dom.fileSize.textContent = formatFileSize(file.size);
    dom.uploadContent.style.display = 'none';
    dom.fileSelected.style.display = 'flex';
    dom.results.style.display = 'none';
    parseCSV(type, file);
}

function resetUploader(type) {
    const dom = getDom(type);
    dom.csvInput.value = '';
    state[type].parsedRows = [];
    state[type].validRows = [];
    dom.uploadContent.style.display = 'flex';
    dom.fileSelected.style.display = 'none';
    dom.preview.style.display = 'none';
    dom.results.style.display = 'none';
    resetUploadBtn(type);
}

function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
}

// ==========================================
// CSV PARSING
// ==========================================

function parseCSV(type, file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        const text = e.target.result;
        const rows = parseCSVText(text);
        const cfg = CONFIGS[type];

        if (rows.length < 2) { alert('CSV is empty or has no data rows.'); return; }

        const headers = rows[0].map(h => h.trim().toLowerCase());
        const dataRows = rows.slice(1).filter(r => r.some(cell => cell.trim()));

        const fieldMap = {};
        cfg.allFields.forEach(f => {
            const idx = headers.indexOf(f.toLowerCase());
            if (idx !== -1) fieldMap[f] = idx;
        });

        state[type].parsedRows = dataRows.map(row => {
            const obj = {};
            cfg.allFields.forEach(f => {
                obj[f] = fieldMap[f] !== undefined ? (row[fieldMap[f]] || '').trim() : '';
            });
            return obj;
        });

        validateAndPreview(type);
    };
    reader.readAsText(file);
}

function parseCSVText(text) {
    const rows = [];
    let current = [];
    let cell = '';
    let inQuotes = false;
    const chars = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

    for (let i = 0; i < chars.length; i++) {
        const c = chars[i];
        if (inQuotes) {
            if (c === '"') {
                if (i + 1 < chars.length && chars[i + 1] === '"') { cell += '"'; i++; }
                else inQuotes = false;
            } else { cell += c; }
        } else {
            if (c === '"') inQuotes = true;
            else if (c === ',') { current.push(cell); cell = ''; }
            else if (c === '\n') { current.push(cell); rows.push(current); current = []; cell = ''; }
            else cell += c;
        }
    }
    if (cell || current.length > 0) { current.push(cell); rows.push(current); }
    return rows;
}

// ==========================================
// VALIDATION & PREVIEW
// ==========================================

function validateAndPreview(type) {
    const cfg = CONFIGS[type];
    const dom = getDom(type);
    const parsed = state[type].parsedRows;
    let numValid = 0, numInvalid = 0;
    state[type].validRows = [];

    dom.previewHead.innerHTML = '<th>#</th>' + cfg.allFields.map(f =>
        `<th>${f}${cfg.requiredFields.includes(f) ? ' <span style="color:#ff6b6b;">*</span>' : ''}</th>`
    ).join('');

    dom.previewBody.innerHTML = '';

    parsed.forEach((row, idx) => {
        const errors = [];
        cfg.requiredFields.forEach(f => { if (!row[f]) errors.push(f); });

        const isValid = errors.length === 0;
        if (isValid) { numValid++; state[type].validRows.push(row); }
        else numInvalid++;

        const tr = document.createElement('tr');
        tr.className = isValid ? 'row-valid' : 'row-invalid';

        const numTd = document.createElement('td');
        numTd.textContent = idx + 1;
        numTd.style.color = '#6b7394';
        tr.appendChild(numTd);

        cfg.allFields.forEach(f => {
            const td = document.createElement('td');
            td.textContent = row[f] || '';
            if (errors.includes(f)) { td.className = 'cell-error'; td.textContent = row[f] || '(missing)'; }
            tr.appendChild(td);
        });

        dom.previewBody.appendChild(tr);
    });

    dom.rowCount.textContent = parsed.length;
    dom.validCount.textContent = numValid;
    dom.invalidCount.textContent = numInvalid;
    dom.uploadBtn.disabled = numValid === 0;
    dom.preview.style.display = 'block';
}

// ==========================================
// UPLOAD
// ==========================================

async function doUpload(type) {
    const cfg = CONFIGS[type];
    const dom = getDom(type);
    const rows = state[type].validRows;
    if (rows.length === 0) return;

    dom.uploadBtn.disabled = true;
    dom.uploadBtn.classList.add('loading');
    dom.uploadBtn.innerHTML = '<i class="fas fa-spinner"></i> Uploading...';

    try {
        const body = {};
        body[cfg.bodyKey] = rows;

        const res = await fetch(cfg.endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        const data = await res.json();

        if (res.ok) {
            dom.preview.style.display = 'none';
            dom.results.style.display = 'block';
            dom.resultsMsg.innerHTML = `
        <strong>${data.created}</strong> ${type === 'parish' ? 'parishes' : 'businesses'} created successfully.
        ${data.failed > 0 ? `<br><span style="color:#ff6b6b;">${data.failed} rows failed.</span>` : ''}
        ${data.errors && data.errors.length > 0 ? `<br><br><strong>Errors:</strong><br>${data.errors.map(e => `Row ${e.row}: ${e.error}`).join('<br>')}` : ''}
      `;
        } else {
            alert(data.error || 'Upload failed.');
            resetUploadBtn(type);
        }
    } catch (err) {
        console.error('Bulk upload error:', err);
        alert('An error occurred during upload.');
        resetUploadBtn(type);
    }
}

function resetUploadBtn(type) {
    const dom = getDom(type);
    dom.uploadBtn.disabled = state[type].validRows.length === 0;
    dom.uploadBtn.classList.remove('loading');
    dom.uploadBtn.innerHTML = '<i class="fas fa-cloud-upload-alt"></i> Upload All Valid Rows';
}
