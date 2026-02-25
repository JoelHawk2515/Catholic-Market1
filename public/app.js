// app.js - Catholic Market (Map Page)

let userLocation = null; // { lat, lng } if geolocation succeeds
let map = null;
let boundsRect = null;
let markersLayer = null;

// Default location: Wichita, KS
const DEFAULT_LOCATION = { name: "Wichita, KS", lat: 37.6872, lng: -97.3301 };

// DOM elements
const mainLayoutEl = document.getElementById("mainLayout");
const searchForm = document.getElementById("searchForm");
const locationInput = document.getElementById("locationInput");
const myLocationBtn = document.getElementById("myLocationBtn");
const businessListEl = document.getElementById("businessList");
const topNav = document.getElementById("top-nav");
const filterToggle = document.getElementById("filterToggle");
const filterDropdown = document.getElementById("filterDropdown");
const filterArrow = document.getElementById("filterArrow");
const tagsList = document.getElementById("tagsList");
const clearFiltersBtn = document.getElementById("clearFilters");
const sponsoredPanel = document.getElementById("sponsoredPanel");
const sponsoredGrid = document.getElementById("sponsoredGrid");

// Mobile Search Elements
const mobileSearchOpenBtn = document.getElementById("mobileSearchOpenBtn");
const mobileSearchCloseBtn = document.getElementById("mobileSearchCloseBtn");

if (mobileSearchOpenBtn && mobileSearchCloseBtn) {
  mobileSearchOpenBtn.addEventListener("click", () => {
    topNav.classList.add("mobile-search-active");
    locationInput.focus();
  });
  mobileSearchCloseBtn.addEventListener("click", () => {
    topNav.classList.remove("mobile-search-active");
  });
}

// Default image if business has none
const DEFAULT_IMAGE = "/img/default-business.png";

// Store current businesses and filters
let currentBusinesses = [];
let currentParishes = [];
let selectedTags = new Set();
let allAvailableTags = new Set();
let parishesData = {}; // Store parish data by ID

// Church icon for parishes (using SVG data URL for custom marker)
const churchIconUrl = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMiIgaGVpZ2h0PSIzMiIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSIjOGI0NWZmIj48cGF0aCBkPSJNMTIgMmwtMSAxdjJIOXYyaDJ2MmgtMnYyaDJ2MWgtMXY4aDR2LThoLTF2LTFoMnYtMmgtMlY3aDJWNWgtMlYzbC0xLTF6TTcgMTBoLTJ2Mmgydi0yek0xNyAxMGgydjJoLTJ2LTJ6Ii8+PC9zdmc+';

// ==========================================
// INITIALIZATION - Auto-load Wichita, KS
// ==========================================

document.addEventListener("DOMContentLoaded", async () => {
  // Load sponsored businesses into sidebar
  loadSponsoredBusinesses();

  // Try to detect user location in the background (for "My Location" button)
  if ("geolocation" in navigator) {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        userLocation = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude
        };
        // Show a subtle indicator that location is available
        myLocationBtn.classList.add("location-available");
      },
      (err) => {
        console.warn("Geolocation error:", err);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  // Auto-load the default location (Wichita, KS)
  try {
    const data = await geocodePlace(DEFAULT_LOCATION.name);
    if (data && data.length > 0) {
      const best = data[0];
      let south, north, west, east;

      if (best.boundingbox) {
        const bbox = best.boundingbox;
        south = parseFloat(bbox[0]);
        north = parseFloat(bbox[1]);
        west = parseFloat(bbox[2]);
        east = parseFloat(bbox[3]);

        const latSpan = north - south;
        const lngSpan = east - west;

        if (latSpan > 0.5 || lngSpan > 0.5) {
          const centerLat = parseFloat(best.lat);
          const centerLng = parseFloat(best.lon);
          const delta = 0.15;
          south = centerLat - delta;
          north = centerLat + delta;
          west = centerLng - delta;
          east = centerLng + delta;
        }
      } else {
        const delta = 0.15;
        south = DEFAULT_LOCATION.lat - delta;
        north = DEFAULT_LOCATION.lat + delta;
        west = DEFAULT_LOCATION.lng - delta;
        east = DEFAULT_LOCATION.lng + delta;
      }

      showMapForBounds(
        [south, west],
        [north, east],
        best.display_name || DEFAULT_LOCATION.name
      );
    } else {
      // Fallback if geocoding fails
      const delta = 0.15;
      showMapForBounds(
        [DEFAULT_LOCATION.lat - delta, DEFAULT_LOCATION.lng - delta],
        [DEFAULT_LOCATION.lat + delta, DEFAULT_LOCATION.lng + delta],
        DEFAULT_LOCATION.name
      );
    }
  } catch (err) {
    console.error("Error loading default location:", err);
    // Fallback
    const delta = 0.15;
    showMapForBounds(
      [DEFAULT_LOCATION.lat - delta, DEFAULT_LOCATION.lng - delta],
      [DEFAULT_LOCATION.lat + delta, DEFAULT_LOCATION.lng + delta],
      DEFAULT_LOCATION.name
    );
  }
});

// ==========================================
// SPONSORED BUSINESSES - Sidebar Panel
// ==========================================

async function loadSponsoredBusinesses() {
  try {
    const res = await fetch('/api/businesses/sponsored');
    const sponsored = await res.json();

    console.log('Sponsored businesses loaded:', sponsored.length);

    if (sponsored.length > 0) {
      sponsoredPanel.style.display = 'block';
      sponsoredGrid.innerHTML = '';

      sponsored.forEach((business) => {
        const card = document.createElement('a');
        card.className = 'sponsored-card';
        card.href = business.website || '#';
        card.target = business.website ? '_blank' : '_self';
        card.rel = 'noopener noreferrer';

        const img = document.createElement('img');
        img.className = 'sponsored-card-img';
        img.src = business.imageUrl || '/img/default-business.png';
        img.alt = business.name;
        img.onerror = () => { img.src = '/img/default-business.png'; };

        const info = document.createElement('div');
        info.className = 'sponsored-card-info';

        const name = document.createElement('span');
        name.className = 'sponsored-card-name';
        name.textContent = business.name;

        const badge = document.createElement('span');
        badge.className = 'sponsored-badge';
        badge.textContent = 'Sponsored';

        info.appendChild(name);
        info.appendChild(badge);

        card.appendChild(img);
        card.appendChild(info);
        sponsoredGrid.appendChild(card);
      });
    }
  } catch (err) {
    console.error('Error loading sponsored businesses:', err);
  }
}

// ==========================================
// FILTER HANDLING
// ==========================================

filterToggle.addEventListener("click", () => {
  filterDropdown.classList.toggle("hidden");
  filterToggle.classList.toggle("active");
});

clearFiltersBtn.addEventListener("click", () => {
  selectedTags.clear();
  updateTagButtons();
  filterBusinesses();
});

// ==========================================
// BUSINESS HOURS HELPERS
// ==========================================

function getBusinessStatus(schedule) {
  if (!schedule) return null;

  const now = new Date();
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const currentDay = dayNames[now.getDay()];
  const currentTime = now.getHours() * 60 + now.getMinutes();

  const todaySchedule = schedule[currentDay];
  if (!todaySchedule || !todaySchedule.open || !todaySchedule.close) {
    return { isOpen: false, message: 'Closed today' };
  }

  const [openHour, openMin] = todaySchedule.open.split(':').map(Number);
  const [closeHour, closeMin] = todaySchedule.close.split(':').map(Number);
  const openTime = openHour * 60 + openMin;
  const closeTime = closeHour * 60 + closeMin;

  if (currentTime >= openTime && currentTime < closeTime) {
    return { isOpen: true, message: `Open now • Closes at ${formatTime(todaySchedule.close)}` };
  } else if (currentTime < openTime) {
    return { isOpen: false, message: `Opens at ${formatTime(todaySchedule.open)}` };
  } else {
    return { isOpen: false, message: 'Closed' };
  }
}

function formatTime(timeStr) {
  if (!timeStr) return '';
  const [hour, min] = timeStr.split(':').map(Number);
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${min.toString().padStart(2, '0')} ${period}`;
}

// ==========================================
// SEARCH HANDLING
// ==========================================

searchForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const query = locationInput.value.trim();
  if (!query) return;

  try {
    const data = await geocodePlace(query);
    if (!data || data.length === 0) {
      alert("Location not found. Please try again.");
      return;
    }

    const best = data[0];
    let south, north, west, east;

    if (best.boundingbox) {
      const bbox = best.boundingbox;
      south = parseFloat(bbox[0]);
      north = parseFloat(bbox[1]);
      west = parseFloat(bbox[2]);
      east = parseFloat(bbox[3]);

      const latSpan = north - south;
      const lngSpan = east - west;

      if (latSpan > 0.5 || lngSpan > 0.5) {
        const centerLat = parseFloat(best.lat);
        const centerLng = parseFloat(best.lon);
        const delta = 0.15;
        south = centerLat - delta;
        north = centerLat + delta;
        west = centerLng - delta;
        east = centerLng + delta;
      }
    } else {
      const centerLat = parseFloat(best.lat);
      const centerLng = parseFloat(best.lon);
      const delta = 0.15;
      south = centerLat - delta;
      north = centerLat + delta;
      west = centerLng - delta;
      east = centerLng + delta;
    }

    showMapForBounds(
      [south, west],
      [north, east],
      best.display_name || query
    );
    topNav.classList.remove("mobile-search-active");
  } catch (err) {
    console.error(err);
    alert("Error searching location.");
  }
});

// ==========================================
// MY LOCATION BUTTON
// ==========================================

myLocationBtn.addEventListener("click", async () => {
  if (!userLocation) {
    // Try to get location now
    if ("geolocation" in navigator) {
      myLocationBtn.classList.add("loading");
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          userLocation = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude
          };
          myLocationBtn.classList.remove("loading");
          myLocationBtn.classList.add("location-available");
          await goToUserLocation();
        },
        (err) => {
          myLocationBtn.classList.remove("loading");
          alert("Could not access your location. Please search by city/state/zip instead.");
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      alert("Geolocation not supported. Please use the search box.");
    }
    return;
  }

  await goToUserLocation();
});

async function goToUserLocation() {
  try {
    const data = await reverseGeocode(userLocation.lat, userLocation.lng);
    if (!data) {
      alert("Could not determine city from your location. Try searching manually.");
      return;
    }

    const bbox = data.boundingbox || null;
    const displayName =
      data.address && (data.address.city || data.address.town || data.address.village)
        ? `${data.address.city || data.address.town || data.address.village}, ${data.address.state || ""}`
        : data.display_name;

    let south, north, west, east;

    if (bbox) {
      south = parseFloat(bbox[0]);
      north = parseFloat(bbox[1]);
      west = parseFloat(bbox[2]);
      east = parseFloat(bbox[3]);
    } else {
      const delta = 0.05;
      south = userLocation.lat - delta;
      north = userLocation.lat + delta;
      west = userLocation.lng - delta;
      east = userLocation.lng + delta;
    }

    showMapForBounds(
      [south, west],
      [north, east],
      displayName || "Your local area"
    );
  } catch (err) {
    console.error(err);
    alert("Error determining city from your location. Try searching manually.");
  }
}

// ==========================================
// GEOCODING
// ==========================================

async function geocodePlace(query) {
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", query);
  url.searchParams.set("format", "json");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("limit", "5");
  url.searchParams.set("featuretype", "city");

  const res = await fetch(url, {
    headers: { "Accept-Language": "en" }
  });
  if (!res.ok) throw new Error("Geocoding failed");
  const results = await res.json();

  const cityResults = results.filter(r =>
    r.type === 'city' ||
    r.type === 'town' ||
    r.type === 'village' ||
    r.class === 'place'
  );

  return cityResults.length > 0 ? cityResults : results;
}

async function reverseGeocode(lat, lng) {
  const url = new URL("https://nominatim.openstreetmap.org/reverse");
  url.searchParams.set("lat", lat);
  url.searchParams.set("lon", lng);
  url.searchParams.set("format", "json");
  url.searchParams.set("zoom", "10");
  url.searchParams.set("addressdetails", "1");

  const res = await fetch(url, {
    headers: { "Accept-Language": "en" }
  });
  if (!res.ok) throw new Error("Reverse geocoding failed");
  return res.json();
}

// ==========================================
// MAP & BUSINESS RENDERING
// ==========================================

async function showMapForBounds(southWest, northEast, label) {
  // Initialize map if needed
  if (!map) {
    map = L.map("map");
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    markersLayer = L.layerGroup().addTo(map);
  }

  const bounds = L.latLngBounds(southWest, northEast);
  map.fitBounds(bounds);
  // Ensure Leaflet recalculates tiles for CSS aspect-ratio containers
  setTimeout(() => map.invalidateSize(), 100);

  // Draw rectangle outline for area
  if (boundsRect) {
    map.removeLayer(boundsRect);
  }
  boundsRect = L.rectangle(bounds, {
    color: "#0074d9",
    weight: 2,
    fill: false
  }).addTo(map);

  // Update sidebar title
  const sidebarTitle = document.getElementById("sidebarTitle");
  sidebarTitle.textContent = `Local Businesses in ${label}`;

  // Fetch businesses and parishes
  const minLat = bounds.getSouth();
  const maxLat = bounds.getNorth();
  const minLng = bounds.getWest();
  const maxLng = bounds.getEast();

  const businessUrl = `/api/businesses?minLat=${minLat}&minLng=${minLng}&maxLat=${maxLat}&maxLng=${maxLng}`;
  const parishUrl = `/api/parishes?minLat=${minLat}&minLng=${minLng}&maxLat=${maxLat}&maxLng=${maxLng}`;

  try {
    const [businessRes, parishRes] = await Promise.all([
      fetch(businessUrl),
      fetch(parishUrl)
    ]);

    if (!businessRes.ok) throw new Error("Failed to load businesses");
    if (!parishRes.ok) throw new Error("Failed to load parishes");

    const businesses = await businessRes.json();
    const parishes = await parishRes.json();

    console.log('=== DATA LOADED ===');
    console.log('Businesses:', businesses.length);
    console.log('Parishes:', parishes.length);

    currentBusinesses = businesses;
    currentParishes = parishes;

    parishesData = {};
    parishes.forEach(p => {
      parishesData[p.id] = p;
    });

    selectedTags.clear();
    populateTagFilters(businesses);

    markersLayer.clearLayers();

    renderBusinesses(businesses, bounds);
    renderParishes(parishes);
  } catch (err) {
    console.error(err);
  }
}

function searchByCoords(lat, lng) {
  const delta = 0.15;
  showMapForBounds(
    [lat - delta, lng - delta],
    [lat + delta, lng + delta],
    "Selected area"
  );
}

// ==========================================
// TAG FILTERS
// ==========================================

function populateTagFilters(businesses) {
  allAvailableTags.clear();

  businesses.forEach(b => {
    if (b.tags) {
      const tags = b.tags.split(',').map(t => t.trim().toLowerCase());
      tags.forEach(tag => allAvailableTags.add(tag));
    }
  });

  updateTagButtons();
}

function updateTagButtons() {
  tagsList.innerHTML = "";

  const sortedTags = Array.from(allAvailableTags).sort();

  sortedTags.forEach(tag => {
    const tagBtn = document.createElement("button");
    tagBtn.className = "tag-filter";
    tagBtn.textContent = tag;

    if (selectedTags.has(tag)) {
      tagBtn.classList.add("active");
    }

    tagBtn.addEventListener("click", () => {
      if (selectedTags.has(tag)) {
        selectedTags.delete(tag);
      } else {
        selectedTags.add(tag);
        currentBusinesses.forEach(b => {
          if (b.tags && b.tags.includes(tag)) {
            trackBusinessClick(b._id || b.id, b.name, 'tag_click', tag);
          }
        });
      }
      updateTagButtons();
      filterBusinesses();
    });

    tagsList.appendChild(tagBtn);
  });
}

function filterBusinesses() {
  if (selectedTags.size === 0) {
    const cards = businessListEl.querySelectorAll(".business-card");
    cards.forEach(card => {
      card.style.display = "flex";
    });

    markersLayer.eachLayer(layer => {
      layer.setOpacity(1);
    });
  } else {
    const cards = businessListEl.querySelectorAll(".business-card");
    cards.forEach((card, index) => {
      const business = currentBusinesses[index];
      if (business && business.tags) {
        const businessTags = business.tags.split(',').map(t => t.trim().toLowerCase());
        const hasMatch = Array.from(selectedTags).some(selectedTag =>
          businessTags.includes(selectedTag)
        );
        card.style.display = hasMatch ? "flex" : "none";
      } else {
        card.style.display = "none";
      }
    });

    let markerIndex = 0;
    markersLayer.eachLayer(layer => {
      const business = currentBusinesses[markerIndex];
      if (business && business.tags) {
        const businessTags = business.tags.split(',').map(t => t.trim().toLowerCase());
        const hasMatch = Array.from(selectedTags).some(selectedTag =>
          businessTags.includes(selectedTag)
        );
        layer.setOpacity(hasMatch ? 1 : 0.2);
      } else {
        layer.setOpacity(0.2);
      }
      markerIndex++;
    });
  }
}

// ==========================================
// PARISH RENDERING
// ==========================================

function renderParishes(parishes) {
  console.log('renderParishes called with:', parishes.length, 'parishes');

  if (!parishes || parishes.length === 0) return;

  const churchIcon = L.icon({
    iconUrl: churchIconUrl,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32]
  });

  parishes.forEach((p) => {
    if (typeof p.lat === "number" && typeof p.lng === "number") {
      const marker = L.marker([p.lat, p.lng], { icon: churchIcon }).addTo(markersLayer);
      marker.bindPopup(
        `<div style="text-align: center;">
          <strong style="color: #8b45ff;">⛪ ${p.name}</strong><br>
          <span style="font-size: 0.85em;">${p.address || ""}</span>
          ${p.phone ? `<br><span style="font-size: 0.85em;">${p.phone}</span>` : ""}
        </div>`
      );
    }
  });
}

// ==========================================
// BUSINESS RENDERING
// ==========================================

function renderBusinesses(businesses, bounds) {
  console.log('renderBusinesses called with:', businesses.length, 'businesses');

  businessListEl.innerHTML = "";

  if (!businesses || businesses.length === 0) {
    businessListEl.innerHTML =
      "<p>No businesses found in this area. Add some to the DB!</p>";
    return;
  }

  businesses.forEach((b, index) => {
    const card = document.createElement("div");
    card.className = "business-card";
    card.setAttribute("data-business-id", b.id);

    if (b.verified) {
      const verifiedBadge = document.createElement("div");
      verifiedBadge.className = "verified-badge";
      verifiedBadge.innerHTML = "✓";
      verifiedBadge.title = "Verified Business";
      card.appendChild(verifiedBadge);
    }

    const img = document.createElement("img");
    img.className = "business-image";
    img.src = b.imageUrl || DEFAULT_IMAGE;
    img.alt = b.name;

    const info = document.createElement("div");
    info.className = "business-info";

    const title = document.createElement("h3");
    title.textContent = b.name;

    const addr = document.createElement("p");
    addr.textContent = b.address;

    const owner = document.createElement("p");
    if (b.owner) owner.textContent = `Owner: ${b.owner}`;

    const phone = document.createElement("p");
    if (b.phone) phone.textContent = `Phone: ${b.phone}`;

    const category = document.createElement("p");
    if (b.category) category.textContent = `Category: ${b.category}`;

    const website = document.createElement("p");
    if (b.website) {
      const a = document.createElement("a");
      a.href = b.website;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      a.textContent = "Website";
      website.appendChild(a);
    }

    const email = document.createElement("p");
    if (b.email) {
      const a = document.createElement("a");
      a.href = `mailto:${b.email}`;
      a.textContent = b.email;
      email.appendChild(a);
    }

    const desc = document.createElement("p");
    if (b.description) desc.textContent = b.description;

    let parishBadge = null;
    if (b.parishId && parishesData[b.parishId]) {
      parishBadge = document.createElement("div");
      parishBadge.className = "parish-badge";
      parishBadge.innerHTML = `<span class="church-icon">⛪</span><span>${parishesData[b.parishId].name}</span>`;
    }

    let amenitiesDiv = null;
    if (b.hasWifi || b.familyFriendly || b.hasParking) {
      amenitiesDiv = document.createElement("div");
      amenitiesDiv.className = "amenities-icons";

      if (b.hasWifi) {
        const wifiIcon = document.createElement("span");
        wifiIcon.className = "amenity-icon wifi-icon";
        wifiIcon.innerHTML = '<i class="fas fa-wifi"></i>';
        wifiIcon.title = "Free WiFi";
        amenitiesDiv.appendChild(wifiIcon);
      }

      if (b.familyFriendly) {
        const familyIcon = document.createElement("span");
        familyIcon.className = "amenity-icon family-icon";
        familyIcon.innerHTML = '<i class="fas fa-users"></i>';
        familyIcon.title = "Family Friendly";
        amenitiesDiv.appendChild(familyIcon);
      }

      if (b.hasParking) {
        const parkingIcon = document.createElement("span");
        parkingIcon.className = "amenity-icon parking-icon";
        parkingIcon.innerHTML = '<i class="fas fa-square-parking"></i>';
        parkingIcon.title = "Parking Available";
        amenitiesDiv.appendChild(parkingIcon);
      }
    }

    let hoursDiv = null;
    if (b.schedule) {
      try {
        const status = getBusinessStatus(b.schedule);
        if (status) {
          hoursDiv = document.createElement("div");
          hoursDiv.className = `business-hours ${status.isOpen ? 'open' : 'closed'}`;
          hoursDiv.innerHTML = `<i class="fas fa-clock"></i> ${status.message}`;
        }
      } catch (err) {
        console.error('Error processing schedule for business:', b.name, err);
      }
    }

    const directionsBtn = document.createElement("button");
    directionsBtn.className = "directions-btn";
    directionsBtn.innerHTML = "📍 Get Directions";
    directionsBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      trackBusinessClick(b._id || b.id, b.name, 'directions_click');
      openMapsApp(b.lat, b.lng, b.name);
    });

    info.appendChild(title);
    info.appendChild(addr);
    if (owner.textContent) info.appendChild(owner);
    if (phone.textContent) info.appendChild(phone);
    if (category.textContent) info.appendChild(category);
    if (website.innerHTML) info.appendChild(website);
    if (email.innerHTML) info.appendChild(email);
    if (desc.textContent) info.appendChild(desc);
    if (parishBadge) info.appendChild(parishBadge);
    if (amenitiesDiv) info.appendChild(amenitiesDiv);
    if (hoursDiv) info.appendChild(hoursDiv);
    if (typeof b.lat === "number" && typeof b.lng === "number") {
      info.appendChild(directionsBtn);
    }

    card.appendChild(img);
    card.appendChild(info);
    businessListEl.appendChild(card);

    if (typeof b.lat === "number" && typeof b.lng === "number") {
      const marker = L.marker([b.lat, b.lng]).addTo(markersLayer);
      marker.bindPopup(
        `<strong>${b.name}</strong><br>${b.address || ""}${b.website
          ? `<br><a href="${b.website}" target="_blank">Website</a>`
          : ""
        }`
      );

      card.addEventListener("click", () => {
        trackBusinessClick(b._id || b.id, b.name, 'card_click');
        map.setView([b.lat, b.lng], Math.max(map.getZoom(), 15));
        marker.openPopup();
      });
    }
  });
}

// ==========================================
// ANALYTICS & UTILITIES
// ==========================================

async function trackBusinessClick(businessId, businessName, eventType, tag = null) {
  try {
    await fetch('/api/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        businessId,
        businessName,
        eventType,
        tag,
        userLocation: userLocation
      })
    });
  } catch (err) {
    console.error('Failed to track click:', err);
  }
}

function openMapsApp(lat, lng, name) {
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  if (isMobile) {
    window.location.href = `maps://?q=${lat},${lng}`;
    setTimeout(() => {
      window.open(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`, '_blank');
    }, 500);
  } else {
    window.open(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`, '_blank');
  }
}
