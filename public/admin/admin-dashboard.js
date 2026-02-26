// admin-dashboard.js

// Check if logged in
async function checkAuth() {
  try {
    const res = await fetch("/api/admin/check");
    if (!res.ok) {
      window.location.href = "/admin/login.html";
    }
  } catch (err) {
    window.location.href = "/admin/login.html";
  }
}

checkAuth();

const logoutBtn = document.getElementById("logoutBtn");
const pendingList = document.getElementById("pendingList");
const approvedList = document.getElementById("approvedList");
const parishesList = document.getElementById("parishesList");
const refreshPendingBtn = document.getElementById("refreshPendingBtn");
const mapCoordinatesBtn = document.getElementById("mapCoordinatesBtn");
const addBusinessBtn = document.getElementById("addBusinessBtn");
const addParishBtn = document.getElementById("addParishBtn");

// Tab functionality is handled by switchTab() in the HTML.
// We just need to populate KPI cards after data loads.

function updateKPIs(pendingCount, businessCount, parishCount, spotlightCount) {
  const kpiPending = document.getElementById('kpiPending');
  const kpiBusinesses = document.getElementById('kpiBusinesses');
  const kpiParishes = document.getElementById('kpiParishes');
  const kpiSpotlight = document.getElementById('kpiSpotlight');
  if (kpiPending) kpiPending.textContent = pendingCount ?? '–';
  if (kpiBusinesses) kpiBusinesses.textContent = businessCount ?? '–';
  if (kpiParishes) kpiParishes.textContent = parishCount ?? '–';
  if (kpiSpotlight) kpiSpotlight.textContent = spotlightCount ?? '–';
}

// Refresh pending button
refreshPendingBtn.addEventListener("click", () => {
  loadPending();
});

// Map Coordinates button
mapCoordinatesBtn.addEventListener("click", async () => {
  if (!confirm("This will geocode all businesses and parishes that don't have coordinates yet. This may take a while. Continue?")) {
    return;
  }

  mapCoordinatesBtn.disabled = true;
  mapCoordinatesBtn.textContent = "🔄 Geocoding...";

  try {
    const res = await fetch("/api/admin/geocode-all", {
      method: "POST"
    });

    const result = await res.json();

    if (res.ok) {
      alert(`Geocoding complete!\nBusinesses updated: ${result.businessesUpdated}\nParishes updated: ${result.parishesUpdated}`);
      loadApproved();
      loadParishes();
    } else {
      alert(`Geocoding failed: ${result.error}`);
    }
  } catch (err) {
    console.error(err);
    alert("Error during geocoding");
  } finally {
    mapCoordinatesBtn.disabled = false;
    mapCoordinatesBtn.textContent = "🗺️ Map Coordinates";
  }
});

// Add Business button
addBusinessBtn.addEventListener("click", () => {
  showAddBusinessModal();
});

// Add Parish button
addParishBtn.addEventListener("click", () => {
  showAddParishModal();
});

logoutBtn.addEventListener("click", async () => {
  await fetch("/api/admin/logout", { method: "POST" });
  window.location.href = "/admin/login.html";
});

// Load pending submissions
async function loadPending() {
  try {
    const res = await fetch("/api/admin/submissions/pending");
    const submissions = await res.json();

    if (submissions.length === 0) {
      pendingList.innerHTML = '<p style="color: #a7b0ce;">No pending submissions</p>';
      return;
    }

    pendingList.innerHTML = "";
    submissions.forEach(sub => {
      const card = createSubmissionCard(sub);
      pendingList.appendChild(card);
    });
  } catch (err) {
    console.error(err);
    pendingList.innerHTML = '<p style="color: #ff6b6b;">Error loading submissions</p>';
  }
}

// Load approved businesses
async function loadApproved() {
  try {
    const res = await fetch("/api/admin/businesses/approved");
    const businesses = await res.json();

    if (businesses.length === 0) {
      approvedList.innerHTML = '<p style="color: #a7b0ce;">No approved businesses yet</p>';
      return;
    }

    approvedList.innerHTML = "";
    businesses.forEach(biz => {
      const card = createApprovedCard(biz);
      approvedList.appendChild(card);
    });
  } catch (err) {
    console.error(err);
  }
}

function createSubmissionCard(sub) {
  const card = document.createElement("div");
  card.className = "admin-submission-card";

  card.innerHTML = `
    <div class="admin-card-header">
      <h3>${sub.name}</h3>
      <span class="badge-pending">Pending</span>
    </div>
    <div class="admin-card-body">
      ${sub.imageUrl ? `<div style="margin-bottom: 1rem;"><img src="${sub.imageUrl}" alt="${sub.name}" style="max-width: 100%; max-height: 200px; border-radius: 8px; object-fit: cover;" /></div>` : ''}
      <p><strong>Address:</strong> ${sub.address}</p>
      ${sub.city ? `<p><strong>City:</strong> ${sub.city}</p>` : ''}
      ${sub.owner ? `<p><strong>Owner:</strong> ${sub.owner}</p>` : ''}
      ${sub.phone ? `<p><strong>Phone:</strong> ${sub.phone}</p>` : ''}
      ${sub.email ? `<p><strong>Email:</strong> ${sub.email}</p>` : ''}
      ${sub.website ? `<p><strong>Website:</strong> <a href="${sub.website}" target="_blank">${sub.website}</a></p>` : ''}
      ${sub.category ? `<p><strong>Category:</strong> ${sub.category}</p>` : ''}
      ${sub.tags ? `<p><strong>Tags:</strong> ${sub.tags}</p>` : ''}
      ${sub.parishName ? `<p><strong>Parish:</strong> ${sub.parishName}</p>` : ''}
      ${sub.description ? `<p><strong>Description:</strong> ${sub.description}</p>` : ''}
      <p style="font-size: 0.8rem; color: #8f96b4; margin-top: 1rem;">Submitted: ${new Date(sub.submittedAt).toLocaleString()}</p>
    </div>
    <div class="admin-card-actions">
      <button class="btn-approve" onclick="approveSubmission('${sub.id}', true)">✓ Approve & Verify</button>
      <button class="btn-approve-only" onclick="approveSubmission('${sub.id}', false)">Approve Only</button>
      <button class="btn-reject" onclick="rejectSubmission('${sub.id}')">✗ Reject</button>
    </div>
  `;

  return card;
}

function createApprovedCard(biz) {
  const card = document.createElement("div");
  card.className = "admin-approved-card";
  const bizId = biz.id || biz._id;
  card.dataset.businessId = bizId;

  const imageUrl = biz.imageUrl || '/img/default-business.png';

  card.innerHTML = `
    <div class="admin-card-wrapper">
      <div class="admin-card-content">
        <div class="admin-card-header">
          <h3>${biz.name}</h3>
          <div style="display: flex; gap: 0.5rem; align-items: center;">
            ${biz.verified ? '<span class="badge-verified">✓ Verified</span>' : '<span class="badge-unverified">Unverified</span>'}
            ${biz.sponsored ? '<span style="background: #f59e0b; color: white; padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.75rem; font-weight: 600;">⭐ Sponsored</span>' : ''}
          </div>
        </div>
        <div class="admin-card-body">
          <p><strong>Address:</strong> ${biz.address}</p>
          ${biz.owner ? `<p><strong>Owner:</strong> ${biz.owner}</p>` : ''}
          ${biz.phone ? `<p><strong>Phone:</strong> ${biz.phone}</p>` : ''}
          ${biz.email ? `<p><strong>Email:</strong> ${biz.email}</p>` : ''}
          ${biz.website ? `<p><strong>Website:</strong> <a href="${biz.website}" target="_blank">${biz.website}</a></p>` : ''}
          ${biz.category ? `<p><strong>Category:</strong> ${biz.category}</p>` : ''}
          ${biz.tags ? `<p><strong>Tags:</strong> ${biz.tags}</p>` : ''}
          ${biz.description ? `<p><strong>Description:</strong> ${biz.description}</p>` : ''}
        </div>
        <div class="admin-card-actions">
          <button class="btn-edit" onclick="editBusiness('${bizId}')">✏️ Edit</button>
          <button class="btn-verify" onclick="toggleVerified('${bizId}', ${!biz.verified})">${biz.verified ? 'Unverify' : 'Verify'}</button>
          ${biz.verified ? `<button class="btn-sponsored" onclick="toggleSponsored('${bizId}', ${!biz.sponsored})" style="background: ${biz.sponsored ? '#9ca3af' : '#f59e0b'};">${biz.sponsored ? '⭐ Remove Sponsor' : '⭐ Make Sponsor'}</button>` : ''}
          <button class="btn-spotlight" onclick="sendSpotlight('${bizId}', '${biz.name.replace(/'/g, "\\'")}')"
            style="background: linear-gradient(135deg, #8b5cf6, #6366f1); color: white; border: none; padding: 0.4rem 0.75rem; border-radius: 6px; cursor: pointer; font-size: 0.8rem; font-weight: 600;">🔔 Spotlight</button>
          <button class="btn-spotlight-queue" onclick="enqueueSpotlight('${bizId}')"
            style="background: linear-gradient(135deg, #4f46e5, #3b82f6); color: white; border: none; padding: 0.4rem 0.75rem; border-radius: 6px; cursor: pointer; font-size: 0.8rem; font-weight: 600;">📅 Queue</button>
          <button class="btn-delete" onclick="deleteBusiness('${bizId}')">Delete</button>
        </div>
      </div>
      <div class="admin-card-thumbnail">
        <img src="${imageUrl}" alt="${biz.name}" onerror="this.src='/img/default-business.png'" />
      </div>
    </div>
  `;

  return card;
}

async function approveSubmission(id, verified = true) {
  if (!confirm(`${verified ? 'Approve & verify' : 'Approve'} this business?`)) return;

  try {
    const res = await fetch(`/api/admin/submissions/${id}/approve`, {
      method: "POST",
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ verified })
    });

    if (res.ok) {
      alert(`Business ${verified ? 'approved and verified' : 'approved'}!`);
      loadPending();
      loadApproved();
    } else {
      alert("Failed to approve submission");
    }
  } catch (err) {
    console.error(err);
    alert("Error approving submission");
  }
}

async function rejectSubmission(id) {
  if (!confirm("Reject this submission?")) return;

  try {
    const res = await fetch(`/api/admin/submissions/${id}/reject`, {
      method: "POST"
    });

    if (res.ok) {
      loadPending();
    } else {
      alert("Failed to reject submission");
    }
  } catch (err) {
    console.error(err);
    alert("Error rejecting submission");
  }
}

async function toggleVerified(id, setVerified) {
  try {
    const res = await fetch(`/api/admin/businesses/${id}/verify`, {
      method: "POST",
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ verified: setVerified })
    });

    if (res.ok) {
      loadApproved();
    } else {
      alert("Failed to toggle verification");
    }
  } catch (err) {
    console.error(err);
    alert("Error toggling verification");
  }
}

async function toggleSponsored(id, setSponsored) {
  try {
    const res = await fetch(`/api/admin/businesses/${id}/sponsor`, {
      method: "POST",
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sponsored: setSponsored })
    });

    if (res.ok) {
      loadApproved();
    } else {
      alert("Failed to toggle sponsor status");
    }
  } catch (err) {
    console.error(err);
    alert("Error toggling sponsor status");
  }
}

async function editBusiness(id) {
  // Get current business data
  try {
    const res = await fetch('/api/admin/businesses/approved');
    const businesses = await res.json();
    const business = businesses.find(b => b.id === id || b._id === id);

    if (!business) {
      alert('Business not found');
      return;
    }

    let selectedEditImageFile = null;

    // Create edit modal
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'flex';

    const currentImageUrl = business.imageUrl || '/img/default-business.png';

    modal.innerHTML = `
      <div class="modal-content" style="max-width: 600px;">
        <button class="close-modal" aria-label="Close modal" onclick="this.closest('.modal').remove()"><i class="fas fa-times"></i></button>
        <h2>Edit Business</h2>
        <p class="subtitle">Update the details for ${business.name}</p>
        <form id="editBusinessForm" style="display: flex; flex-direction: column; gap: 0.5rem;">
          <div class="form-group">
            <label>Business Name *</label>
            <input type="text" name="name" value="${business.name || ''}" required>
          </div>
          
          <div class="form-group">
            <label>Address *</label>
            <input type="text" name="address" value="${business.address || ''}" required>
          </div>
          
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
            <div class="form-group" style="margin-bottom: 0;">
              <label>Street</label>
              <input type="text" name="street" value="${business.street || ''}" placeholder="e.g., 123 Main St">
            </div>
            
            <div class="form-group" style="margin-bottom: 0;">
              <label>City</label>
              <input type="text" name="city" value="${business.city || ''}">
            </div>
            
            <div class="form-group" style="margin-bottom: 0;">
              <label>State</label>
              <input type="text" name="state" value="${business.state || ''}" placeholder="e.g., KS">
            </div>
            
            <div class="form-group" style="margin-bottom: 0;">
              <label>ZIP Code</label>
              <input type="text" name="zip" value="${business.zip || ''}" placeholder="e.g., 67202">
            </div>
          </div>
          
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-top: 0.5rem;">
            <div class="form-group" style="margin-bottom: 0;">
              <label>Latitude</label>
              <input type="number" step="any" name="lat" value="${business.lat || ''}" placeholder="e.g., 37.6922" style="width: 100%; border-radius: var(--radius-sm); border: 1px solid var(--border); background: rgba(12, 14, 20, 0.9); color: var(--text-primary); padding: 0.75rem;">
            </div>
            
            <div class="form-group" style="margin-bottom: 0;">
              <label>Longitude</label>
              <input type="number" step="any" name="lng" value="${business.lng || ''}" placeholder="e.g., -97.3375" style="width: 100%; border-radius: var(--radius-sm); border: 1px solid var(--border); background: rgba(12, 14, 20, 0.9); color: var(--text-primary); padding: 0.75rem;">
            </div>
          </div>
          
          <div class="form-group">
            <button type="button" class="btn-action" id="editAutoFillCoordsBtn" style="width: 100%; justify-content: center;">
              <i class="fas fa-map-marker-alt"></i> Auto-fill Coordinates from Address
            </button>
          </div>
          
          <div class="form-group">
            <label>Owner</label>
            <input type="text" name="owner" value="${business.owner || ''}">
          </div>
          
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
            <div class="form-group" style="margin-bottom: 0;">
              <label>Phone</label>
              <input type="tel" name="phone" value="${business.phone || ''}">
            </div>
            
            <div class="form-group" style="margin-bottom: 0;">
              <label>Email</label>
              <input type="email" name="email" value="${business.email || ''}">
            </div>
          </div>
          
          <div class="form-group">
            <label>Website</label>
            <input type="url" name="website" value="${business.website || ''}">
          </div>
          
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
            <div class="form-group" style="margin-bottom: 0;">
              <label>Category</label>
              <input type="text" name="category" value="${business.category || ''}">
            </div>
            
            <div class="form-group" style="margin-bottom: 0;">
              <label>Tags <span style="font-size: 0.8rem; color: var(--text-muted);">(comma-separated)</span></label>
              <input type="text" name="tags" value="${business.tags || ''}" placeholder="e.g., cafe, bakery, family">
            </div>
          </div>
          
          <div class="form-group">
            <label>Description</label>
            <textarea name="description" rows="4" style="resize: vertical;">${business.description || ''}</textarea>
          </div>
          
          <div class="form-group">
            <label>Amenities</label>
            <div class="amenities-checkboxes" style="display: flex; flex-wrap: wrap; gap: 1.5rem; margin-top: 0.5rem;">
              <label style="display: flex; align-items: center; gap: 0.5rem; color: var(--text-primary); cursor: pointer; font-size: var(--fs-sm);">
                <input type="checkbox" name="isOpen247" ${business.isOpen247 ? 'checked' : ''} style="width: 18px; height: 18px; accent-color: var(--accent-primary);">
                <i class="fas fa-clock" style="color: var(--accent-primary);"></i> <span>Open 24/7</span>
              </label>
              <label style="display: flex; align-items: center; gap: 0.5rem; color: var(--text-primary); cursor: pointer; font-size: var(--fs-sm);">
                <input type="checkbox" name="hasWifi" ${business.hasWifi ? 'checked' : ''} style="width: 18px; height: 18px; accent-color: var(--accent-primary);">
                <i class="fas fa-wifi" style="color: var(--accent-primary);"></i> <span>Free WiFi</span>
              </label>
              <label style="display: flex; align-items: center; gap: 0.5rem; color: var(--text-primary); cursor: pointer; font-size: var(--fs-sm);">
                <input type="checkbox" name="familyFriendly" ${business.familyFriendly ? 'checked' : ''} style="width: 18px; height: 18px; accent-color: var(--accent-primary);">
                <i class="fas fa-users" style="color: var(--accent-primary);"></i> <span>Family Friendly</span>
              </label>
              <label style="display: flex; align-items: center; gap: 0.5rem; color: var(--text-primary); cursor: pointer; font-size: var(--fs-sm);">
                <input type="checkbox" name="hasParking" ${business.hasParking ? 'checked' : ''} style="width: 18px; height: 18px; accent-color: var(--accent-primary);">
                <i class="fas fa-square-parking" style="color: var(--accent-primary);"></i> <span>Parking Available</span>
              </label>
            </div>
          </div>
          
          <div class="form-group">
            <label>Business Hours</label>
            <div style="display: flex; flex-direction: column; gap: 0.75rem; background: var(--bg-base); padding: 1rem; border-radius: var(--radius-md); border: 1px solid var(--border);">
              ${['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'].map(day => `
                <div style="display: grid; grid-template-columns: 100px 1fr auto 1fr; align-items: center; gap: 0.5rem;">
                  <label style="color: var(--text-secondary); font-size: 0.9rem; text-transform: capitalize; margin: 0;">${day}</label>
                  <input type="time" name="${day}Open" value="${business.schedule?.[day]?.open || ''}" style="padding: 0.5rem; border-radius: var(--radius-sm); border: 1px solid var(--border); background: var(--bg-surface); color: var(--text-primary);">
                  <span style="color: var(--text-muted); font-size: 0.85rem;">to</span>
                  <input type="time" name="${day}Close" value="${business.schedule?.[day]?.close || ''}" style="padding: 0.5rem; border-radius: var(--radius-sm); border: 1px solid var(--border); background: var(--bg-surface); color: var(--text-primary);">
                </div>
              `).join('')}
            </div>
          </div>
          
          <div class="form-group">
            <label>Business Image</label>
            <div class="image-upload-area" id="editImageUploadArea" style="min-height: 120px;">
              <input type="file" id="editBusinessImage" accept="image/*" style="display: none;" />
              <div class="upload-placeholder" id="editUploadPlaceholder" style="display: none; min-height: 120px;">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: var(--accent-primary);">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="17 8 12 3 7 8"></polyline>
                  <line x1="12" y1="3" x2="12" y2="15"></line>
                </svg>
                <p>Click to change image</p>
              </div>
              <div class="image-preview" id="editImagePreview" style="display: block;">
                <img id="editPreviewImg" src="${currentImageUrl}" alt="Preview" style="border-radius: var(--radius-sm);" />
                <button type="button" class="remove-image-btn" id="editRemoveImageBtn" style="display: none;">✕</button>
                <p class="image-name" id="editImageName"></p>
                <button type="button" class="btn-action" style="margin-top: 0.5rem;" onclick="document.getElementById('editBusinessImage').click()">Change Image</button>
              </div>
            </div>
          </div>
          
          <div style="display: flex; gap: 1rem; margin-top: 1.5rem; padding-top: 1.5rem; border-top: 1px solid var(--border);">
            <button type="button" class="btn-secondary" onclick="this.closest('.modal').remove()" style="flex: 1; justify-content: center;">Cancel</button>
            <button type="submit" class="btn-primary" style="flex: 1; justify-content: center;">Save Changes</button>
          </div>
        </form>
      </div>
    `;

    document.body.appendChild(modal);

    // Image upload handling
    const editImageInput = document.getElementById('editBusinessImage');
    const editPreviewImg = document.getElementById('editPreviewImg');
    const editImageName = document.getElementById('editImageName');
    const editRemoveImageBtn = document.getElementById('editRemoveImageBtn');

    editImageInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;

      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        alert('Image file size must be less than 5MB');
        return;
      }

      selectedEditImageFile = file;

      const reader = new FileReader();
      reader.onload = (e) => {
        editPreviewImg.src = e.target.result;
        editImageName.textContent = file.name;
        editRemoveImageBtn.style.display = 'flex';
      };
      reader.readAsDataURL(file);
    });

    editRemoveImageBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      selectedEditImageFile = null;
      editImageInput.value = '';
      editPreviewImg.src = currentImageUrl;
      editImageName.textContent = '';
      editRemoveImageBtn.style.display = 'none';
    });

    // Auto-fill coordinates button
    document.getElementById('editAutoFillCoordsBtn').addEventListener('click', async () => {
      const form = document.getElementById('editBusinessForm');
      const address = form.querySelector('[name="address"]').value;
      const city = form.querySelector('[name="city"]').value;
      const state = form.querySelector('[name="state"]').value;
      const zip = form.querySelector('[name="zip"]').value;

      if (!address) {
        alert('Please enter an address first');
        return;
      }

      const btn = document.getElementById('editAutoFillCoordsBtn');
      const originalText = btn.innerHTML;
      btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Looking up coordinates...';
      btn.disabled = true;

      try {
        // Build full address string
        const parts = [address];
        if (city) parts.push(city);
        if (state) parts.push(state);
        if (zip) parts.push(zip);
        const fullAddress = parts.join(', ');

        const url = new URL('https://nominatim.openstreetmap.org/search');
        url.searchParams.append('q', fullAddress);
        url.searchParams.append('format', 'json');
        url.searchParams.append('limit', '1');

        const response = await fetch(url.toString(), {
          headers: { 'User-Agent': 'CatholicMarket/1.0' }
        });
        const data = await response.json();

        if (data && data.length > 0) {
          const lat = parseFloat(data[0].lat);
          const lng = parseFloat(data[0].lon);
          form.querySelector('[name="lat"]').value = lat;
          form.querySelector('[name="lng"]').value = lng;
          btn.innerHTML = '<i class="fas fa-check"></i> Coordinates filled!';
          btn.style.background = 'linear-gradient(135deg, #22c55e, #16a34a)';
          setTimeout(() => {
            btn.innerHTML = originalText;
            btn.style.background = 'linear-gradient(135deg, #10b981, #059669)';
          }, 2000);
        } else {
          alert('Could not find coordinates for this address. Try adding more details (city, state, zip).');
          btn.innerHTML = originalText;
        }
      } catch (err) {
        console.error('Geocoding error:', err);
        alert('Error looking up coordinates. Please try again.');
        btn.innerHTML = originalText;
      }

      btn.disabled = false;
    });

    // Handle form submission
    document.getElementById('editBusinessForm').addEventListener('submit', async (e) => {
      e.preventDefault();

      const businessId = business.id || business._id;

      // If image was changed, upload it first
      if (selectedEditImageFile) {
        const imageFormData = new FormData();
        imageFormData.append('image', selectedEditImageFile);
        imageFormData.append('businessId', businessId);

        try {
          const imageRes = await fetch(`/api/admin/businesses/${businessId}/image`, {
            method: 'POST',
            body: imageFormData
          });

          if (!imageRes.ok) {
            alert('Failed to upload image');
            return;
          }
        } catch (err) {
          console.error(err);
          alert('Error uploading image');
          return;
        }
      }

      // Update text fields
      const formData = new FormData(e.target);

      // Collect schedule data
      const schedule = {
        sunday: { open: formData.get('sundayOpen') || null, close: formData.get('sundayClose') || null },
        monday: { open: formData.get('mondayOpen') || null, close: formData.get('mondayClose') || null },
        tuesday: { open: formData.get('tuesdayOpen') || null, close: formData.get('tuesdayClose') || null },
        wednesday: { open: formData.get('wednesdayOpen') || null, close: formData.get('wednesdayClose') || null },
        thursday: { open: formData.get('thursdayOpen') || null, close: formData.get('thursdayClose') || null },
        friday: { open: formData.get('fridayOpen') || null, close: formData.get('fridayClose') || null },
        saturday: { open: formData.get('saturdayOpen') || null, close: formData.get('saturdayClose') || null }
      };

      const updates = {
        name: formData.get('name'),
        address: formData.get('address'),
        street: formData.get('street') || null,
        city: formData.get('city') || null,
        state: formData.get('state') || null,
        zip: formData.get('zip') || null,
        lat: formData.get('lat') ? parseFloat(formData.get('lat')) : null,
        lng: formData.get('lng') ? parseFloat(formData.get('lng')) : null,
        owner: formData.get('owner') || null,
        phone: formData.get('phone') || null,
        email: formData.get('email') || null,
        website: formData.get('website') || null,
        category: formData.get('category') || null,
        description: formData.get('description') || null,
        tags: formData.get('tags') ? formData.get('tags').split(',').map(t => t.trim()).filter(t => t.length > 0) : [],
        isOpen247: formData.get('isOpen247') === 'on',
        hasWifi: formData.get('hasWifi') === 'on',
        familyFriendly: formData.get('familyFriendly') === 'on',
        hasParking: formData.get('hasParking') === 'on',
        schedule: schedule
      };

      try {
        const res = await fetch(`/api/admin/businesses/${businessId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates)
        });

        if (res.ok) {
          alert('Business updated successfully!');
          modal.remove();
          loadApproved();
        } else {
          alert('Failed to update business');
        }
      } catch (err) {
        console.error(err);
        alert('Error updating business');
      }
    });

  } catch (err) {
    console.error(err);
    alert('Error loading business data');
  }
}

async function verifyBusiness(id) {
  try {
    const res = await fetch(`/api/admin/businesses/${id}/verify`, {
      method: "POST"
    });

    if (res.ok) {
      loadApproved();
    } else {
      alert("Failed to verify business");
    }
  } catch (err) {
    console.error(err);
    alert("Error verifying business");
  }
}

async function deleteBusiness(id) {
  if (!confirm("Are you sure you want to delete this business? This cannot be undone.")) return;

  try {
    const res = await fetch(`/api/admin/businesses/${id}`, { method: "DELETE" });
    if (res.ok) {
      loadApproved();
    } else {
      const data = await res.json();
      alert(data.error || "Failed to delete");
    }
  } catch (err) {
    console.error("Delete error:", err);
    alert("Failed to delete business");
  }
}

// Send spotlight push notification
async function sendSpotlight(businessId, businessName) {
  if (!confirm(`Send a "Business Spotlight of the Week" push notification for "${businessName}" to all subscribers?`)) return;

  try {
    const res = await fetch('/api/admin/spotlight', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ businessId })
    });

    const data = await res.json();

    if (res.ok) {
      if (data.sent === 0 && data.failed === 0) {
        alert(`No subscribers yet. The notification will be sent once users subscribe.`);
      } else {
        alert(`🔔 Spotlight sent for "${data.businessName}"!\n\nSent: ${data.sent}\nFailed: ${data.failed}`);
      }
    } else {
      alert(data.error || 'Failed to send spotlight');
    }
  } catch (err) {
    console.error('Spotlight error:', err);
    alert('Failed to send spotlight notification');
  }
}

// Load parishes
async function loadParishes() {
  try {
    const res = await fetch("/api/admin/parishes");
    const parishes = await res.json();

    if (parishes.length === 0) {
      parishesList.innerHTML = '<p style="color: #a7b0ce;">No parishes yet</p>';
      return;
    }

    parishesList.innerHTML = "";
    parishes.forEach(parish => {
      const card = createParishCard(parish);
      parishesList.appendChild(card);
    });
  } catch (err) {
    console.error(err);
  }
}

function createParishCard(parish) {
  const card = document.createElement("div");
  card.className = "admin-approved-card";
  const parishId = parish.id || parish._id;
  card.dataset.parishId = parishId;

  card.innerHTML = `
    <div class="admin-card-header">
      <h3>⛪ ${parish.name}</h3>
    </div>
    <div class="admin-card-body">
      <p><strong>Address:</strong> ${parish.address}</p>
      <p><strong>City:</strong> ${parish.city}, ${parish.state}</p>
      ${parish.phone ? `<p><strong>Phone:</strong> ${parish.phone}</p>` : ''}
      ${parish.website ? `<p><strong>Website:</strong> <a href="${parish.website}" target="_blank">${parish.website}</a></p>` : ''}
      <p><strong>Coordinates:</strong> ${parish.lat}, ${parish.lng}</p>
    </div>
    <div class="admin-card-actions">
      <button class="btn-edit" onclick="editParish('${parishId}')">✏️ Edit</button>
      <button class="btn-delete" onclick="deleteParish('${parishId}')">Delete</button>
    </div>
  `;

  return card;
}

async function editParish(id) {
  try {
    const res = await fetch('/api/admin/parishes');
    const parishes = await res.json();
    const parish = parishes.find(p => p.id === id || p._id === id);

    if (!parish) {
      alert('Parish not found');
      return;
    }

    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'flex';

    modal.innerHTML = `
      <div class="modal-content" style="max-width: 600px;">
        <button class="close-modal" aria-label="Close modal" onclick="this.closest('.modal').remove()"><i class="fas fa-times"></i></button>
        <h2>Edit Parish</h2>
        <p class="subtitle">Update the details for ${parish.name}</p>
        <form id="editParishForm" style="display: flex; flex-direction: column; gap: 0.5rem;">
          <div class="form-group">
            <label>Parish Name *</label>
            <input type="text" name="name" value="${parish.name || ''}" required>
          </div>
          
          <div class="form-group">
            <label>Address *</label>
            <input type="text" name="address" value="${parish.address || ''}" required>
          </div>
          
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
            <div class="form-group" style="margin-bottom: 0;">
              <label>Street</label>
              <input type="text" name="street" value="${parish.street || ''}">
            </div>
            
            <div class="form-group" style="margin-bottom: 0;">
              <label>City *</label>
              <input type="text" name="city" value="${parish.city || ''}" required>
            </div>
            
            <div class="form-group" style="margin-bottom: 0;">
              <label>State *</label>
              <input type="text" name="state" value="${parish.state || ''}" required>
            </div>
            
            <div class="form-group" style="margin-bottom: 0;">
              <label>ZIP</label>
              <input type="text" name="zip" value="${parish.zip || ''}">
            </div>
          </div>
          
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-top: 0.5rem;">
            <div class="form-group" style="margin-bottom: 0;">
              <label>Phone</label>
              <input type="tel" name="phone" value="${parish.phone || ''}">
            </div>
            
            <div class="form-group" style="margin-bottom: 0;">
              <label>Website</label>
              <input type="url" name="website" value="${parish.website || ''}">
            </div>
          </div>
          
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-top: 0.5rem;">
            <div class="form-group" style="margin-bottom: 0;">
              <label>Latitude *</label>
              <input type="number" step="any" name="lat" value="${parish.lat || ''}" required style="width: 100%; border-radius: var(--radius-sm); border: 1px solid var(--border); background: rgba(12, 14, 20, 0.9); color: var(--text-primary); padding: 0.75rem;">
            </div>
            <div class="form-group" style="margin-bottom: 0;">
              <label>Longitude *</label>
              <input type="number" step="any" name="lng" value="${parish.lng || ''}" required style="width: 100%; border-radius: var(--radius-sm); border: 1px solid var(--border); background: rgba(12, 14, 20, 0.9); color: var(--text-primary); padding: 0.75rem;">
            </div>
          </div>
          
          <div style="display: flex; gap: 1rem; margin-top: 1.5rem; padding-top: 1.5rem; border-top: 1px solid var(--border);">
            <button type="button" class="btn-secondary" onclick="this.closest('.modal').remove()" style="flex: 1; justify-content: center;">Cancel</button>
            <button type="submit" class="btn-primary" style="flex: 1; justify-content: center;">Save Changes</button>
          </div>
        </form>
      </div>
    `;

    document.body.appendChild(modal);

    document.getElementById('editParishForm').addEventListener('submit', async (e) => {
      e.preventDefault();

      const formData = new FormData(e.target);
      const updates = {
        name: formData.get('name'),
        address: formData.get('address'),
        street: formData.get('street') || null,
        city: formData.get('city'),
        state: formData.get('state'),
        zip: formData.get('zip') || null,
        phone: formData.get('phone') || null,
        website: formData.get('website') || null,
        lat: parseFloat(formData.get('lat')),
        lng: parseFloat(formData.get('lng'))
      };

      try {
        const parishId = parish.id || parish._id;
        const res = await fetch(`/api/admin/parishes/${parishId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates)
        });

        if (res.ok) {
          alert('Parish updated successfully!');
          modal.remove();
          loadParishes();
        } else {
          alert('Failed to update parish');
        }
      } catch (err) {
        console.error(err);
        alert('Error updating parish');
      }
    });

  } catch (err) {
    console.error(err);
    alert('Error loading parish data');
  }
}

async function deleteParish(id) {
  if (!confirm("Delete this parish? This cannot be undone.")) return;

  try {
    const res = await fetch(`/api/admin/parishes/${id}`, {
      method: "DELETE"
    });

    if (res.ok) {
      loadParishes();
    } else {
      alert("Failed to delete parish");
    }
  } catch (err) {
    console.error(err);
    alert("Error deleting parish");
  }
}

// Load data on page load
loadPending();
loadApproved();

// Add Business Modal
function showAddBusinessModal() {
  let selectedImageFile = null;

  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.style.display = 'flex';

  modal.innerHTML = `
    <div class="modal-content" style="max-width: 600px;">
      <button class="close-modal" aria-label="Close modal" onclick="this.closest('.modal').remove()"><i class="fas fa-times"></i></button>
      <h2>Add New Business</h2>
        <p class="subtitle">Fill out the details to add a new business to the system</p>
        <form id="addBusinessForm" style="display: flex; flex-direction: column; gap: 0.5rem;">
          <div class="form-group">
            <label>Business Name *</label>
            <input type="text" name="name" required>
          </div>
          
          <div class="form-group">
            <label>Address *</label>
            <input type="text" name="address" required>
          </div>
          
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
            <div class="form-group" style="margin-bottom: 0;">
              <label>Street</label>
              <input type="text" name="street" placeholder="e.g., 123 Main St">
            </div>
            
            <div class="form-group" style="margin-bottom: 0;">
              <label>City</label>
              <input type="text" name="city">
            </div>
            
            <div class="form-group" style="margin-bottom: 0;">
              <label>State</label>
              <input type="text" name="state" placeholder="e.g., KS">
            </div>
            
            <div class="form-group" style="margin-bottom: 0;">
              <label>ZIP Code</label>
              <input type="text" name="zip" placeholder="e.g., 67202">
            </div>
          </div>
          
          <div class="form-group">
            <label>Owner</label>
            <input type="text" name="owner">
          </div>
          
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
            <div class="form-group" style="margin-bottom: 0;">
              <label>Phone</label>
              <input type="tel" name="phone">
            </div>
            
            <div class="form-group" style="margin-bottom: 0;">
              <label>Email</label>
              <input type="email" name="email">
            </div>
          </div>
          
          <div class="form-group">
            <label>Website</label>
            <input type="url" name="website">
          </div>
          
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
            <div class="form-group" style="margin-bottom: 0;">
              <label>Category</label>
              <input type="text" name="category">
            </div>
            
            <div class="form-group" style="margin-bottom: 0;">
              <label>Tags <span style="font-size: 0.8rem; color: var(--text-muted);">(comma-separated)</span></label>
              <input type="text" name="tags" placeholder="e.g., cafe, bakery, family">
            </div>
          </div>
          
          <div class="form-group">
            <label>Description</label>
            <textarea name="description" rows="4" style="resize: vertical;"></textarea>
          </div>
          
          <div class="form-group">
            <label>Business Image</label>
            <div class="image-upload-area" id="addBusinessImageUploadArea" style="min-height: 120px;">
              <input type="file" id="addBusinessImageInput" accept="image/*" style="display: none;" />
              <div class="upload-placeholder" id="addBusinessUploadPlaceholder">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: var(--accent-primary);">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="17 8 12 3 7 8"></polyline>
                  <line x1="12" y1="3" x2="12" y2="15"></line>
                </svg>
                <p>Click or drag image here</p>
              </div>
              <div class="image-preview" id="addBusinessImagePreview" style="display: none;">
                <img id="addBusinessPreviewImg" alt="Preview" style="border-radius: var(--radius-sm);" />
                <button type="button" class="remove-image-btn" id="addBusinessRemoveImageBtn">✕</button>
                <p class="image-name" id="addBusinessImageName"></p>
                <button type="button" class="btn-action" style="margin-top: 0.5rem;" onclick="document.getElementById('addBusinessImageInput').click()">Change Image</button>
              </div>
            </div>
          </div>
          
          <div class="form-group">
            <label>Amenities</label>
            <div class="amenities-checkboxes" style="display: flex; flex-wrap: wrap; gap: 1.5rem; margin-top: 0.5rem;">
              <label style="display: flex; align-items: center; gap: 0.5rem; color: var(--text-primary); cursor: pointer; font-size: var(--fs-sm);">
                <input type="checkbox" name="isOpen247" style="width: 18px; height: 18px; accent-color: var(--accent-primary);">
                <i class="fas fa-clock" style="color: var(--accent-primary);"></i> <span>Open 24/7</span>
              </label>
              <label style="display: flex; align-items: center; gap: 0.5rem; color: var(--text-primary); cursor: pointer; font-size: var(--fs-sm);">
                <input type="checkbox" name="hasWifi" style="width: 18px; height: 18px; accent-color: var(--accent-primary);">
                <i class="fas fa-wifi" style="color: var(--accent-primary);"></i> <span>Free WiFi</span>
              </label>
              <label style="display: flex; align-items: center; gap: 0.5rem; color: var(--text-primary); cursor: pointer; font-size: var(--fs-sm);">
                <input type="checkbox" name="familyFriendly" style="width: 18px; height: 18px; accent-color: var(--accent-primary);">
                <i class="fas fa-users" style="color: var(--accent-primary);"></i> <span>Family Friendly</span>
              </label>
              <label style="display: flex; align-items: center; gap: 0.5rem; color: var(--text-primary); cursor: pointer; font-size: var(--fs-sm);">
                <input type="checkbox" name="hasParking" style="width: 18px; height: 18px; accent-color: var(--accent-primary);">
                <i class="fas fa-square-parking" style="color: var(--accent-primary);"></i> <span>Parking Available</span>
              </label>
            </div>
          </div>
          
          <div class="form-group">
            <label>Business Hours</label>
            <div style="display: flex; flex-direction: column; gap: 0.75rem; background: var(--bg-base); padding: 1rem; border-radius: var(--radius-md); border: 1px solid var(--border);">
              ${['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'].map(day => `
                <div style="display: grid; grid-template-columns: 100px 1fr auto 1fr; align-items: center; gap: 0.5rem;">
                  <label style="color: var(--text-secondary); font-size: 0.9rem; text-transform: capitalize; margin: 0;">${day}</label>
                  <input type="time" name="${day}Open" style="padding: 0.5rem; border-radius: var(--radius-sm); border: 1px solid var(--border); background: var(--bg-surface); color: var(--text-primary);">
                  <span style="color: var(--text-muted); font-size: 0.85rem;">to</span>
                  <input type="time" name="${day}Close" style="padding: 0.5rem; border-radius: var(--radius-sm); border: 1px solid var(--border); background: var(--bg-surface); color: var(--text-primary);">
                </div>
              `).join('')}
            </div>
          </div>
          
          <div class="form-group">
            <label style="display: flex; align-items: center; gap: 0.5rem; color: var(--text-primary); cursor: pointer; font-size: var(--fs-sm);">
              <input type="checkbox" name="verified" checked style="width: 18px; height: 18px; accent-color: var(--accent-primary);">
              <span>Mark as Verified (will appear immediately on map)</span>
            </label>
          </div>
          
          <div style="display: flex; gap: 1rem; margin-top: 1.5rem; padding-top: 1.5rem; border-top: 1px solid var(--border);">
            <button type="button" class="btn-secondary" onclick="this.closest('.modal').remove()" style="flex: 1; justify-content: center;">Cancel</button>
            <button type="submit" class="btn-primary" style="flex: 1; justify-content: center;">Add Business</button>
          </div>
        </form>
      </div>
    `;

  document.body.appendChild(modal);

  // Image upload handling
  const imageInput = document.getElementById('addBusinessImageInput');
  const uploadArea = document.getElementById('addBusinessImageUploadArea');
  const placeholder = document.getElementById('addBusinessUploadPlaceholder');
  const preview = document.getElementById('addBusinessImagePreview');
  const previewImg = document.getElementById('addBusinessPreviewImg');
  const imageName = document.getElementById('addBusinessImageName');
  const removeBtn = document.getElementById('addBusinessRemoveImageBtn');

  uploadArea.addEventListener('click', () => imageInput.click());

  uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.classList.add('drag-over');
  });

  uploadArea.addEventListener('dragleave', () => {
    uploadArea.classList.remove('drag-over');
  });

  uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    if (file) handleImageFile(file);
  });

  imageInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) handleImageFile(file);
  });

  removeBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    selectedImageFile = null;
    imageInput.value = '';
    placeholder.style.display = 'flex';
    preview.style.display = 'none';
  });

  function handleImageFile(file) {
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Image file size must be less than 5MB');
      return;
    }

    selectedImageFile = file;

    const reader = new FileReader();
    reader.onload = (e) => {
      previewImg.src = e.target.result;
      imageName.textContent = file.name;
      placeholder.style.display = 'none';
      preview.style.display = 'flex';
    };
    reader.readAsDataURL(file);
  }

  // Form submission
  document.getElementById('addBusinessForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = new FormData(e.target);

    // Add image if selected
    if (selectedImageFile) {
      formData.append('image', selectedImageFile);
    }

    // Convert checkboxes to boolean
    formData.set('verified', formData.get('verified') === 'on');
    formData.set('isOpen247', formData.get('isOpen247') === 'on');
    formData.set('hasWifi', formData.get('hasWifi') === 'on');
    formData.set('familyFriendly', formData.get('familyFriendly') === 'on');
    formData.set('hasParking', formData.get('hasParking') === 'on');

    // Collect schedule data
    const schedule = {
      sunday: { open: formData.get('sundayOpen') || null, close: formData.get('sundayClose') || null },
      monday: { open: formData.get('mondayOpen') || null, close: formData.get('mondayClose') || null },
      tuesday: { open: formData.get('tuesdayOpen') || null, close: formData.get('tuesdayClose') || null },
      wednesday: { open: formData.get('wednesdayOpen') || null, close: formData.get('wednesdayClose') || null },
      thursday: { open: formData.get('thursdayOpen') || null, close: formData.get('thursdayClose') || null },
      friday: { open: formData.get('fridayOpen') || null, close: formData.get('fridayClose') || null },
      saturday: { open: formData.get('saturdayOpen') || null, close: formData.get('saturdayClose') || null }
    };
    formData.set('schedule', JSON.stringify(schedule));

    try {
      const res = await fetch('/api/admin/businesses', {
        method: 'POST',
        body: formData
      });

      if (res.ok) {
        alert('Business added successfully!');
        modal.remove();
        loadApproved();
      } else {
        const error = await res.json();
        alert(`Failed to add business: ${error.error || 'Unknown error'}`);
      }
    } catch (err) {
      console.error(err);
      alert('Error adding business');
    }
  });
}

// Add Parish Modal
function showAddParishModal() {
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.style.display = 'flex';

  modal.innerHTML = `
      <div class="modal-content" style="max-width: 600px;">
        <button class="close-modal" aria-label="Close modal" onclick="this.closest('.modal').remove()"><i class="fas fa-times"></i></button>
        <h2>Add New Parish</h2>
        <p class="subtitle">Enter the details for the new parish</p>
        <form id="addParishForm" style="display: flex; flex-direction: column; gap: 0.5rem;">
          <div class="form-group">
            <label>Parish Name *</label>
            <input type="text" name="name" required>
          </div>
          
          <div class="form-group">
            <label>Address *</label>
            <input type="text" name="address" required>
          </div>
          
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
            <div class="form-group" style="margin-bottom: 0;">
              <label>Street</label>
              <input type="text" name="street" placeholder="e.g., 123 Main St">
            </div>
            
            <div class="form-group" style="margin-bottom: 0;">
              <label>City</label>
              <input type="text" name="city">
            </div>
            
            <div class="form-group" style="margin-bottom: 0;">
              <label>State</label>
              <input type="text" name="state" placeholder="e.g., KS">
            </div>
            
            <div class="form-group" style="margin-bottom: 0;">
              <label>ZIP Code</label>
              <input type="text" name="zip" placeholder="e.g., 67202">
            </div>
          </div>
          
          <div class="form-group">
            <label>Website</label>
            <input type="url" name="website">
          </div>
          
          <div class="form-group">
            <label>Mass Times</label>
            <textarea name="massTimes" rows="3" style="resize: vertical;"></textarea>
          </div>
          
          <div style="display: flex; gap: 1rem; margin-top: 1.5rem; padding-top: 1.5rem; border-top: 1px solid var(--border);">
            <button type="button" class="btn-secondary" onclick="this.closest('.modal').remove()" style="flex: 1; justify-content: center;">Cancel</button>
            <button type="submit" class="btn-primary" style="flex: 1; justify-content: center;">Add Parish</button>
          </div>
        </form>
      </div>
    `;

  document.body.appendChild(modal);

  // Form submission
  document.getElementById('addParishForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = new FormData(e.target);
    const parishData = {
      name: formData.get('name'),
      address: formData.get('address'),
      street: formData.get('street') || null,
      city: formData.get('city') || null,
      state: formData.get('state') || null,
      zip: formData.get('zip') || null,
      website: formData.get('website') || null,
      massTimes: formData.get('massTimes') || null
    };

    try {
      const res = await fetch('/api/admin/parishes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parishData)
      });

      if (res.ok) {
        alert('Parish added successfully!');
        modal.remove();
        loadParishes();
      } else {
        const error = await res.json();
        alert(`Failed to add parish: ${error.error || 'Unknown error'}`);
      }
    } catch (err) {
      console.error(err);
      alert('Error adding parish');
    }
  });
}

// =====================================
// SPOTLIGHT QUEUE & CONFIG LOGIC
// =====================================

// Load Configuration and Queue on tab click
const spotlightTabBtn = document.querySelector('.admin-tab[data-tab="spotlight"]');
if (spotlightTabBtn) {
  spotlightTabBtn.addEventListener('click', () => {
    loadSpotlightConfig();
    loadSpotlightQueue();
  });
}

async function loadSpotlightConfig() {
  try {
    const res = await fetch('/api/admin/spotlight-queue/config');
    if (!res.ok) return;
    const config = await res.json();
    document.getElementById('spotlightDay').value = config.dayOfWeek || 0;
    document.getElementById('spotlightTime').value = config.timeOfDay || '12:00';
    document.getElementById('spotlightActive').checked = config.isActive;
  } catch (err) {
    console.error('Failed to load spotlight config:', err);
  }
}

document.getElementById('saveSpotlightConfigBtn').addEventListener('click', async () => {
  const dayOfWeek = parseInt(document.getElementById('spotlightDay').value, 10);
  const timeOfDay = document.getElementById('spotlightTime').value;
  const isActive = document.getElementById('spotlightActive').checked;

  try {
    const res = await fetch('/api/admin/spotlight-queue/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dayOfWeek, timeOfDay, isActive })
    });
    if (res.ok) {
      alert("Spotlight schedule saved successfully.");
    } else {
      alert("Failed to save spotlight schedule.");
    }
  } catch (err) {
    alert("Error saving schedule.");
  }
});

async function enqueueSpotlight(businessId) {
  try {
    const res = await fetch('/api/admin/spotlight-queue', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ businessId })
    });

    if (res.ok) {
      alert("Business added to the end of the Spotlight Queue!");
      loadSpotlightQueue();
    } else {
      const data = await res.json();
      alert(data.error || "Failed to add to queue.");
    }
  } catch (err) {
    alert("Error adding to queue.");
  }
}

async function removeSpotlightQueueItem(queueId) {
  if (!confirm("Remove this business from the queue?")) return;
  try {
    const res = await fetch(`/api/admin/spotlight-queue/${queueId}`, { method: 'DELETE' });
    if (res.ok) {
      loadSpotlightQueue();
    } else {
      alert("Failed to remove item from queue.");
    }
  } catch (err) {
    alert("Error removing from queue.");
  }
}

async function loadSpotlightQueue() {
  const queueListEl = document.getElementById('spotlightQueueList');
  try {
    const res = await fetch('/api/admin/spotlight-queue');
    const queue = await res.json();

    if (!queue || queue.length === 0) {
      queueListEl.innerHTML = '<p style="color: #a7b0ce;">Spotlight Queue is empty.</p>';
      return;
    }

    // Sortable JS container
    queueListEl.innerHTML = '';
    const listContainer = document.createElement('div');
    listContainer.className = 'spotlight-sortable-list';
    listContainer.style.display = 'flex';
    listContainer.style.flexDirection = 'column';
    listContainer.style.gap = '0.75rem';

    // Calculate scheduled dates manually
    const dayOfWeek = parseInt(document.getElementById('spotlightDay').value, 10) || 1;
    const timeOfDay = document.getElementById('spotlightTime').value || '12:00';
    const [hh, mm] = timeOfDay.split(':').map(Number);

    let baseDate = new Date();
    // Move to the *next* occurrence of 'dayOfWeek'
    let distanceToNext = (dayOfWeek + 7 - baseDate.getDay()) % 7;
    // If today is the day, but time has passed, add 7 days
    if (distanceToNext === 0) {
      if (baseDate.getHours() > hh || (baseDate.getHours() === hh && baseDate.getMinutes() >= mm)) {
        distanceToNext = 7;
      }
    }

    baseDate.setDate(baseDate.getDate() + distanceToNext);
    baseDate.setHours(hh, mm, 0, 0);

    queue.forEach((item, index) => {
      // Clone date and add index * 7 days
      let scheduledDate = new Date(baseDate.getTime() + (index * 7 * 24 * 60 * 60 * 1000));
      let dateString = scheduledDate.toLocaleDateString() + ' ' + scheduledDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      const row = document.createElement('div');
      row.className = 'queue-row';
      row.dataset.id = item.id;
      row.style.background = '#1a1f35';
      row.style.padding = '1rem';
      row.style.borderRadius = '8px';
      row.style.border = '1px solid #323854';
      row.style.display = 'flex';
      row.style.justifyContent = 'space-between';
      row.style.alignItems = 'center';
      row.style.cursor = 'grab';

      row.innerHTML = `
        <div style="display: flex; gap: 1rem; align-items: center;">
          <i class="fas fa-bars" style="color: #6366f1; cursor: grab;"></i>
          <div>
            <h4 style="margin: 0; color: #f5f7ff; font-size: 1rem;">${item.businessName}</h4>
            <span style="color: #a7b0ce; font-size: 0.8rem;"><i class="fas fa-map-marker-alt"></i> ${item.businessCity}</span>
          </div>
        </div>
        <div style="display: flex; gap: 1rem; align-items: center;">
      <div style="text-align: right; margin-right: 1rem;">
        <p style="margin: 0; font-size: 0.75rem; color: #8b45ff; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px;">Scheduled For</p>
        <p style="margin: 0; color: #f5f7ff; font-size: 0.9rem;">${dateString}</p>
      </div>
      <button onclick="removeSpotlightQueueItem('${item.id}')" style="background: #e11d48; color: white; border: none; padding: 0.5rem; border-radius: 6px; cursor: pointer;"><i class="fas fa-trash"></i></button>
    </div>
  `;
      listContainer.appendChild(row);
    });

    queueListEl.appendChild(listContainer);

    // Initialize Sortable
    if (window.Sortable) {
      Sortable.create(listContainer, {
        animation: 150,
        handle: '.fas.fa-bars',
        onEnd: async function () {
          // Send new order to server
          const rows = listContainer.querySelectorAll('.queue-row');
          const orderedIds = Array.from(rows).map(r => r.dataset.id);

          try {
            await fetch('/api/admin/spotlight-queue/reorder', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ orderedIds })
            });
            // Reload to recalculate dates visually
            loadSpotlightQueue();
          } catch (e) {
            console.error('Failed to save new order:', e);
          }
        }
      });
    }

  } catch (err) {
    queueListEl.innerHTML = '<p style="color: #e11d48;">Error loading queue.</p>';
  }
}

// ==========================================
// INITIALIZATION
// ==========================================

async function initDashboard() {
  try {
    // Load all data in parallel
    const [pendingRes, approvedRes, parishesRes] = await Promise.all([
      fetch("/api/admin/submissions/pending"),
      fetch("/api/admin/businesses/approved"),
      fetch("/api/admin/parishes")
    ]);

    const pendingData = pendingRes.ok ? await pendingRes.json() : [];
    const approvedData = approvedRes.ok ? await approvedRes.json() : [];
    const parishesData = parishesRes.ok ? await parishesRes.json() : [];

    // Render pending
    if (pendingData.length === 0) {
      pendingList.innerHTML = '<p style="color: var(--text-secondary, #9ba3c0);">No pending submissions</p>';
    } else {
      pendingList.innerHTML = "";
      pendingData.forEach(sub => {
        pendingList.appendChild(createSubmissionCard(sub));
      });
    }

    // Render approved businesses
    if (approvedData.length === 0) {
      approvedList.innerHTML = '<p style="color: var(--text-secondary, #9ba3c0);">No approved businesses yet</p>';
    } else {
      approvedList.innerHTML = "";
      approvedData.forEach(biz => {
        approvedList.appendChild(createApprovedCard(biz));
      });
    }

    // Render parishes
    if (parishesData.length === 0) {
      parishesList.innerHTML = '<p style="color: var(--text-secondary, #9ba3c0);">No parishes yet</p>';
    } else {
      parishesList.innerHTML = "";
      parishesData.forEach(parish => {
        parishesList.appendChild(createParishCard(parish));
      });
    }

    // Load spotlight queue separately (has its own complex rendering)
    let spotlightCount = 0;
    try {
      const qRes = await fetch('/api/admin/spotlight-queue');
      if (qRes.ok) {
        const qData = await qRes.json();
        spotlightCount = qData.queue ? qData.queue.length : 0;
      }
    } catch (e) { /* ignore */ }

    // Load spotlight queue UI
    if (typeof loadSpotlightQueue === 'function') {
      loadSpotlightQueue();
    }

    // Update KPI cards
    updateKPIs(pendingData.length, approvedData.length, parishesData.length, spotlightCount);

  } catch (err) {
    console.error("Dashboard initialization error:", err);
  }
}

initDashboard();
