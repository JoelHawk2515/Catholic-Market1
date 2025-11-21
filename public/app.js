// app.js

let userLocation = null; // { lat, lng } if geolocation succeeds
let map = null;
let boundsRect = null;
let markersLayer = null;

const heroEl = document.getElementById("hero");
const mainLayoutEl = document.getElementById("mainLayout");
const searchForm = document.getElementById("searchForm");
const locationInput = document.getElementById("locationInput");
const localButton = document.getElementById("localButton");
const statusMessage = document.getElementById("statusMessage");
const businessListEl = document.getElementById("businessList");
const topNav = document.getElementById("top-nav");
const addBusinessBtn = document.getElementById("addBusinessBtn");
const businessModal = document.getElementById("businessModal");
const closeModal = document.getElementById("closeModal");
const cancelBtn = document.getElementById("cancelBtn");
const businessForm = document.getElementById("businessForm");
const filterToggle = document.getElementById("filterToggle");
const filterDropdown = document.getElementById("filterDropdown");
const filterArrow = document.getElementById("filterArrow");
const tagsList = document.getElementById("tagsList");
const clearFiltersBtn = document.getElementById("clearFilters");
const sponsoredSection = document.getElementById("sponsoredSection");
const sponsoredRotator = document.getElementById("sponsoredRotator");
const popularSection = document.getElementById("popularSection");
const popularBusinesses = document.getElementById("popularBusinesses");

// Form elements for parish selection
const businessCityInput = document.getElementById("businessCity");
const businessParishSelect = document.getElementById("businessParish");

// Load sponsored businesses on page load
loadSponsoredBusinesses();

async function loadSponsoredBusinesses() {
  try {
    const res = await fetch('/api/businesses/sponsored');
    const sponsored = await res.json();
    
    console.log('Sponsored businesses loaded:', sponsored.length);
    console.log('Sponsored businesses:', sponsored);
    
    if (sponsored.length > 0) {
      sponsoredSection.style.display = 'block';
      sponsoredRotator.innerHTML = '';
      
      // Create all sponsor items
      sponsored.forEach((business, index) => {
        const item = document.createElement('a');
        item.className = 'sponsored-item';
        item.href = business.website || '#';
        item.target = business.website ? '_blank' : '_self';
        item.style.animationDelay = `${index * 0.1}s`;
        
        const img = document.createElement('img');
        img.className = 'sponsored-image';
        img.src = business.imageUrl || '/img/default-business.png';
        img.alt = business.name;
        img.onerror = () => { img.src = '/img/default-business.png'; };
        
        const name = document.createElement('div');
        name.className = 'sponsored-name';
        name.textContent = business.name;
        
        item.appendChild(img);
        item.appendChild(name);
        sponsoredRotator.appendChild(item);
      });
      
      // Check if scrolling is needed after images load
      setTimeout(() => {
        initSponsoredScroll();
      }, 500);
    }
  } catch (err) {
    console.error('Error loading sponsored businesses:', err);
  }
}

function initSponsoredScroll() {
  const container = sponsoredRotator.parentElement;
  const containerWidth = container.offsetWidth;
  const scrollWidth = sponsoredRotator.scrollWidth;
  
  // Only enable scrolling if content overflows
  if (scrollWidth > containerWidth) {
    // Duplicate items for seamless loop
    const items = Array.from(sponsoredRotator.children);
    items.forEach(item => {
      const clone = item.cloneNode(true);
      clone.style.animationDelay = '0s'; // Remove staggered fade for clones
      sponsoredRotator.appendChild(clone);
    });
    
    // Enable scrolling mode
    sponsoredRotator.classList.add('scrolling');
    
    let scrollPosition = 0;
    const scrollSpeed = 0.5; // pixels per frame
    let isPaused = false;
    
    // Pause on hover
    sponsoredRotator.addEventListener('mouseenter', () => {
      isPaused = true;
    });
    sponsoredRotator.addEventListener('mouseleave', () => {
      isPaused = false;
    });
    
    function animate() {
      if (!isPaused) {
        scrollPosition += scrollSpeed;
        
        // Reset position when we've scrolled past the original items
        const halfWidth = sponsoredRotator.scrollWidth / 2;
        if (scrollPosition >= halfWidth) {
          scrollPosition = 0;
        }
        
        sponsoredRotator.style.transform = `translateX(-${scrollPosition}px)`;
      }
      requestAnimationFrame(animate);
    }
    
    animate();
  }
}

async function loadPopularBusinesses() {
  // Only load if user has shared location
  if (!userLocation) {
    popularSection.style.display = 'none';
    return;
  }
  
  try {
    const res = await fetch(`/api/analytics/popular?lat=${userLocation.lat}&lng=${userLocation.lng}&radius=50`);
    const popular = await res.json();
    
    if (popular.length > 0) {
      popularSection.style.display = 'block';
      popularBusinesses.innerHTML = '';
      
      popular.forEach((business) => {
        const card = createPopularBusinessCard(business);
        popularBusinesses.appendChild(card);
      });
    } else {
      popularSection.style.display = 'none';
    }
  } catch (err) {
    console.error('Error loading popular businesses:', err);
    popularSection.style.display = 'none';
  }
}

function createPopularBusinessCard(b) {
  const card = document.createElement("div");
  card.className = "popular-card";
  
  // Verified badge
  if (b.verified) {
    const verifiedBadge = document.createElement("div");
    verifiedBadge.className = "verified-badge";
    verifiedBadge.innerHTML = "✓";
    verifiedBadge.title = "Verified Business";
    card.appendChild(verifiedBadge);
  }
  
  const img = document.createElement("img");
  img.className = "popular-image";
  img.src = b.imageUrl || DEFAULT_IMAGE;
  img.alt = b.name;
  img.onerror = () => { img.src = DEFAULT_IMAGE; };
  
  const info = document.createElement("div");
  info.className = "popular-info";
  
  const title = document.createElement("h3");
  title.textContent = b.name;
  
  const addr = document.createElement("p");
  addr.className = "popular-address";
  addr.textContent = b.address;
  
  const stats = document.createElement("div");
  stats.className = "popular-stats";
  stats.innerHTML = `
    <span class="popular-clicks">🔥 ${b.clickCount} ${b.clickCount === 1 ? 'click' : 'clicks'} this week</span>
    <span class="popular-distance">📍 ${b.distance.toFixed(1)} mi away</span>
  `;
  
  // Amenities icons
  if (b.hasWifi || b.familyFriendly || b.hasParking) {
    const amenitiesDiv = document.createElement("div");
    amenitiesDiv.className = "popular-amenities";
    
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
    
    info.appendChild(amenitiesDiv);
  }
  
  // Action buttons
  const actionsDiv = document.createElement("div");
  actionsDiv.className = "popular-actions";
  
  if (b.website) {
    const websiteBtn = document.createElement("a");
    websiteBtn.href = b.website;
    websiteBtn.target = "_blank";
    websiteBtn.rel = "noopener noreferrer";
    websiteBtn.className = "popular-btn popular-btn-website";
    websiteBtn.innerHTML = '<i class="fas fa-globe"></i> Website';
    websiteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      trackBusinessClick(b._id || b.id, b.name, 'website_click');
    });
    actionsDiv.appendChild(websiteBtn);
  }
  
  if (b.lat && b.lng) {
    const directionsBtn = document.createElement("button");
    directionsBtn.className = "popular-btn popular-btn-directions";
    directionsBtn.innerHTML = '<i class="fas fa-location-arrow"></i> Directions';
    directionsBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      trackBusinessClick(b._id || b.id, b.name, 'directions_click');
      openMapsApp(b.lat, b.lng, b.name);
    });
    actionsDiv.appendChild(directionsBtn);
  }
  
  info.appendChild(title);
  info.appendChild(addr);
  info.appendChild(stats);
  info.appendChild(actionsDiv);
  
  card.appendChild(img);
  card.appendChild(info);
  
  // Click card to view on map
  card.addEventListener('click', () => {
    trackBusinessClick(b._id || b.id, b.name, 'card_click');
    // Switch to map view and center on business
    heroEl.classList.add("hidden");
    mainLayoutEl.classList.remove("hidden");
    topNav.classList.remove("hidden");
    if (map && b.lat && b.lng) {
      map.setView([b.lat, b.lng], 15);
      // Trigger search to load businesses in that area
      searchByCoords(b.lat, b.lng);
    }
  });
  
  return card;
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

// Image upload handling
let selectedImageFile = null;

const imageUploadArea = document.getElementById("imageUploadArea");
const businessImageInput = document.getElementById("businessImage");
const uploadPlaceholder = document.getElementById("uploadPlaceholder");
const imagePreview = document.getElementById("imagePreview");
const previewImg = document.getElementById("previewImg");
const imageName = document.getElementById("imageName");
const removeImageBtn = document.getElementById("removeImageBtn");

// Click to upload
uploadPlaceholder.addEventListener("click", () => {
  businessImageInput.click();
});

// File input change
businessImageInput.addEventListener("change", (e) => {
  handleImageFile(e.target.files[0]);
});

// Drag and drop
uploadPlaceholder.addEventListener("dragover", (e) => {
  e.preventDefault();
  uploadPlaceholder.classList.add("drag-over");
});

uploadPlaceholder.addEventListener("dragleave", () => {
  uploadPlaceholder.classList.remove("drag-over");
});

uploadPlaceholder.addEventListener("drop", (e) => {
  e.preventDefault();
  uploadPlaceholder.classList.remove("drag-over");
  
  const file = e.dataTransfer.files[0];
  if (file && file.type.startsWith("image/")) {
    handleImageFile(file);
  } else {
    alert("Please drop an image file");
  }
});

// Remove image
removeImageBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  selectedImageFile = null;
  businessImageInput.value = "";
  uploadPlaceholder.style.display = "flex";
  imagePreview.style.display = "none";
});

// Handle image file
function handleImageFile(file) {
  if (!file) return;
  
  // Check file type
  if (!file.type.startsWith("image/")) {
    alert("Please select an image file");
    return;
  }
  
  // Check file size (5MB max)
  if (file.size > 5 * 1024 * 1024) {
    alert("Image file size must be less than 5MB");
    return;
  }
  
  selectedImageFile = file;
  
  // Show preview
  const reader = new FileReader();
  reader.onload = (e) => {
    previewImg.src = e.target.result;
    imageName.textContent = file.name;
    uploadPlaceholder.style.display = "none";
    imagePreview.style.display = "block";
  };
  reader.readAsDataURL(file);
}

// Modal handling
addBusinessBtn.addEventListener("click", () => {
  businessModal.classList.add("active");
  document.body.style.overflow = "hidden";
});

closeModal.addEventListener("click", () => {
  businessModal.classList.remove("active");
  document.body.style.overflow = "";
});

cancelBtn.addEventListener("click", () => {
  businessModal.classList.remove("active");
  document.body.style.overflow = "";
});

businessModal.addEventListener("click", (e) => {
  if (e.target === businessModal) {
    businessModal.classList.remove("active");
    document.body.style.overflow = "";
  }
});

// Business form submission
businessForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  
  // Create FormData for file upload
  const formData = new FormData();
  formData.append("name", document.getElementById("businessName").value);
  formData.append("address", document.getElementById("businessAddress").value);
  formData.append("street", document.getElementById("businessStreet").value);
  formData.append("city", document.getElementById("businessCity").value);
  formData.append("state", document.getElementById("businessState").value);
  formData.append("zip", document.getElementById("businessZip").value);
  formData.append("owner", document.getElementById("businessOwner").value);
  formData.append("phone", document.getElementById("businessPhone").value);
  formData.append("email", document.getElementById("businessEmail").value);
  formData.append("website", document.getElementById("businessWebsite").value);
  formData.append("category", document.getElementById("businessCategory").value);
  formData.append("description", document.getElementById("businessDescription").value);
  formData.append("parishId", document.getElementById("businessParish").value || "");
  formData.append("hasWifi", document.getElementById("hasWifi").checked);
  formData.append("familyFriendly", document.getElementById("familyFriendly").checked);
  formData.append("hasParking", document.getElementById("hasParking").checked);
  
  // Collect schedule data
  const schedule = {
    sunday: { 
      open: document.getElementById("sundayOpen").value || null, 
      close: document.getElementById("sundayClose").value || null 
    },
    monday: { 
      open: document.getElementById("mondayOpen").value || null, 
      close: document.getElementById("mondayClose").value || null 
    },
    tuesday: { 
      open: document.getElementById("tuesdayOpen").value || null, 
      close: document.getElementById("tuesdayClose").value || null 
    },
    wednesday: { 
      open: document.getElementById("wednesdayOpen").value || null, 
      close: document.getElementById("wednesdayClose").value || null 
    },
    thursday: { 
      open: document.getElementById("thursdayOpen").value || null, 
      close: document.getElementById("thursdayClose").value || null 
    },
    friday: { 
      open: document.getElementById("fridayOpen").value || null, 
      close: document.getElementById("fridayClose").value || null 
    },
    saturday: { 
      open: document.getElementById("saturdayOpen").value || null, 
      close: document.getElementById("saturdayClose").value || null 
    }
  };
  formData.append("schedule", JSON.stringify(schedule));
  
  // Add image file if selected
  if (selectedImageFile) {
    formData.append("image", selectedImageFile);
  }

  try {
    const res = await fetch("/api/submissions", {
      method: "POST",
      body: formData // Don't set Content-Type header, browser will set it with boundary
    });
    
    const data = await res.json();
    
    if (res.ok) {
      alert("Thank you! Your business has been submitted for review. Our team will verify the information and it will appear on the site once approved.");
      businessForm.reset();
      selectedImageFile = null;
      uploadPlaceholder.style.display = "flex";
      imagePreview.style.display = "none";
      businessParishSelect.innerHTML = '<option value="">-- Select a Parish --</option>';
      businessModal.classList.remove("active");
      document.body.style.overflow = "";
    } else {
      alert("Error submitting business: " + (data.error || "Please try again"));
    }
  } catch (err) {
    console.error(err);
    alert("Error submitting business. Please try again.");
  }
});

// Filter toggle
filterToggle.addEventListener("click", () => {
  filterDropdown.classList.toggle("hidden");
  filterToggle.classList.toggle("active");
});

// Clear filters
clearFiltersBtn.addEventListener("click", () => {
  selectedTags.clear();
  updateTagButtons();
  filterBusinesses();
});

// City input change - fetch parishes for that city
businessCityInput.addEventListener("input", debounce(async (e) => {
  const city = e.target.value.trim();
  if (city.length < 3) {
    businessParishSelect.innerHTML = '<option value="">-- Select a Parish --</option>';
    return;
  }
  
  try {
    const res = await fetch(`/api/parishes/city/${encodeURIComponent(city)}`);
    if (res.ok) {
      const parishes = await res.json();
      businessParishSelect.innerHTML = '<option value="">-- Select a Parish --</option>';
      parishes.forEach(p => {
        const option = document.createElement("option");
        option.value = p.id;
        option.textContent = p.name;
        businessParishSelect.appendChild(option);
      });
    }
  } catch (err) {
    console.error("Error fetching parishes:", err);
  }
}, 500));

// Debounce helper
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Helper function to get business status and schedule info
function getBusinessStatus(schedule) {
  if (!schedule) return null;
  
  const now = new Date();
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const currentDay = dayNames[now.getDay()];
  const currentTime = now.getHours() * 60 + now.getMinutes(); // minutes since midnight
  
  const todaySchedule = schedule[currentDay];
  if (!todaySchedule || !todaySchedule.open || !todaySchedule.close) {
    return { isOpen: false, message: 'Closed today' };
  }
  
  // Parse time strings (HH:MM format)
  const [openHour, openMin] = todaySchedule.open.split(':').map(Number);
  const [closeHour, closeMin] = todaySchedule.close.split(':').map(Number);
  const openTime = openHour * 60 + openMin;
  const closeTime = closeHour * 60 + closeMin;
  
  if (currentTime >= openTime && currentTime < closeTime) {
    // Open now - show closing time
    const closeStr = todaySchedule.close;
    return { isOpen: true, message: `Open now • Closes at ${formatTime(closeStr)}` };
  } else if (currentTime < openTime) {
    // Opens later today
    return { isOpen: false, message: `Opens at ${formatTime(todaySchedule.open)}` };
  } else {
    // Closed for today
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

// On load, try geolocation
document.addEventListener("DOMContentLoaded", () => {
  if ("geolocation" in navigator) {
    statusMessage.textContent = "Trying to detect your location...";
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        userLocation = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude
        };
        statusMessage.textContent =
          "Location detected. Click 'Click for Local' to use it.";
        localButton.style.display = "inline-block";
        
        // Load popular businesses near user
        loadPopularBusinesses();
      },
      (err) => {
        console.warn("Geolocation error:", err);
        statusMessage.textContent =
          "Could not access your location. You can search by city/state/zip instead.";
        localButton.style.display = "none";
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  } else {
    statusMessage.textContent =
      "Geolocation not supported. Please use the search box.";
  }
});

// Handle search by city/state/zip
searchForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const query = locationInput.value.trim();
  if (!query) return;

  statusMessage.textContent = "Searching location...";
  try {
    const data = await geocodePlace(query);
    if (!data || data.length === 0) {
      statusMessage.textContent = "Location not found. Please try again.";
      return;
    }

    const best = data[0];
    
    // Check if bounding box is too large (more than ~0.5 degrees in any direction)
    // If so, create a smaller custom box around the center point
    let south, north, west, east;
    
    if (best.boundingbox) {
      const bbox = best.boundingbox;
      south = parseFloat(bbox[0]);
      north = parseFloat(bbox[1]);
      west = parseFloat(bbox[2]);
      east = parseFloat(bbox[3]);
      
      const latSpan = north - south;
      const lngSpan = east - west;
      
      // If bounding box is too large, create a reasonable city-sized box
      if (latSpan > 0.5 || lngSpan > 0.5) {
        const centerLat = parseFloat(best.lat);
        const centerLng = parseFloat(best.lon);
        const delta = 0.15; // ~10 mile radius
        
        south = centerLat - delta;
        north = centerLat + delta;
        west = centerLng - delta;
        east = centerLng + delta;
      }
    } else {
      // No bounding box provided, create one around the center
      const centerLat = parseFloat(best.lat);
      const centerLng = parseFloat(best.lon);
      const delta = 0.15;
      
      south = centerLat - delta;
      north = centerLat + delta;
      west = centerLng - delta;
      east = centerLng + delta;
    }

    const displayName = best.display_name;

    showMapForBounds(
      [south, west],
      [north, east],
      displayName || query
    );
  } catch (err) {
    console.error(err);
    statusMessage.textContent = "Error searching location.";
  }
});

// Handle "Click for Local" (geolocation based)
localButton.addEventListener("click", async () => {
  if (!userLocation) return;

  statusMessage.textContent = "Finding your city...";
  try {
    const data = await reverseGeocode(userLocation.lat, userLocation.lng);
    if (!data) {
      statusMessage.textContent =
        "Could not determine city from your location. Try searching manually.";
      return;
    }

    const bbox = data.boundingbox || null;
    const displayName =
      data.address && (data.address.city || data.address.town || data.address.village)
        ? `${data.address.city || data.address.town || data.address.village}, ${
            data.address.state || ""
          }`
        : data.display_name;

    let south, north, west, east;

    if (bbox) {
      // bbox: [south, north, west, east]
      south = parseFloat(bbox[0]);
      north = parseFloat(bbox[1]);
      west = parseFloat(bbox[2]);
      east = parseFloat(bbox[3]);
    } else {
      // Fall back to a small box around the userLocation
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
    statusMessage.textContent =
      "Error determining city from your location. Try searching manually.";
  }
});

// Geocode using Nominatim: forward search
async function geocodePlace(query) {
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", query);
  url.searchParams.set("format", "json");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("limit", "5"); // Get multiple results to find best match
  url.searchParams.set("featuretype", "city"); // Prefer city-level results

  const res = await fetch(url, {
    headers: {
      "Accept-Language": "en"
    }
  });
  if (!res.ok) throw new Error("Geocoding failed");
  const results = await res.json();
  
  // Filter for city-level results (type: city, town, village)
  // and prefer smaller bounding boxes (more precise)
  const cityResults = results.filter(r => 
    r.type === 'city' || 
    r.type === 'town' || 
    r.type === 'village' ||
    r.class === 'place'
  );
  
  return cityResults.length > 0 ? cityResults : results;
}

// Reverse geocode: from lat/lng to city-ish
async function reverseGeocode(lat, lng) {
  const url = new URL("https://nominatim.openstreetmap.org/reverse");
  url.searchParams.set("lat", lat);
  url.searchParams.set("lon", lng);
  url.searchParams.set("format", "json");
  url.searchParams.set("zoom", "10"); // city-ish zoom
  url.searchParams.set("addressdetails", "1");

  const res = await fetch(url, {
    headers: {
      "Accept-Language": "en"
    }
  });
  if (!res.ok) throw new Error("Reverse geocoding failed");
  return res.json();
}

// Show map and businesses for bounding box
async function showMapForBounds(southWest, northEast, label) {
  // Hide hero, show main layout and top nav
  heroEl.classList.add("hidden");
  mainLayoutEl.classList.remove("hidden");
  topNav.classList.remove("hidden");
  document.body.style.overflow = "";

  // Initialize map if needed
  if (!map) {
    map = L.map("map");
    // OSM tiles
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    markersLayer = L.layerGroup().addTo(map);
  }

  const bounds = L.latLngBounds(southWest, northEast);

  // Fit map to bounds
  map.fitBounds(bounds);

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

  // Fetch businesses from backend that fall inside bounding box
  const minLat = bounds.getSouth();
  const maxLat = bounds.getNorth();
  const minLng = bounds.getWest();
  const maxLng = bounds.getEast();

  statusMessage.textContent = "Loading businesses and parishes...";
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
    console.log('First business:', businesses[0]);
    console.log('First parish:', parishes[0]);

    statusMessage.textContent = "";
    currentBusinesses = businesses;
    currentParishes = parishes;
    
    // Store parishes by ID for easy lookup
    parishesData = {};
    parishes.forEach(p => {
      parishesData[p.id] = p;
    });
    
    selectedTags.clear();
    populateTagFilters(businesses);
    
    // Clear all markers before rendering
    markersLayer.clearLayers();
    
    renderBusinesses(businesses, bounds);
    renderParishes(parishes);
  } catch (err) {
    console.error(err);
    statusMessage.textContent = "Error loading data.";
  }
}

// Populate tag filters from businesses
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

// Update tag filter buttons
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
        // Track tag click - find all businesses with this tag
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

// Filter businesses based on selected tags
function filterBusinesses() {
  if (selectedTags.size === 0) {
    // Show all businesses
    const cards = businessListEl.querySelectorAll(".business-card");
    cards.forEach(card => {
      card.style.display = "flex";
    });
    
    // Show all markers
    markersLayer.eachLayer(layer => {
      layer.setOpacity(1);
    });
  } else {
    // Filter businesses
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
    
    // Update markers visibility
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

// Render parish markers on map
function renderParishes(parishes) {
  console.log('renderParishes called with:', parishes.length, 'parishes');
  
  if (!parishes || parishes.length === 0) {
    console.log('No parishes to render');
    return;
  }
  
  const churchIcon = L.icon({
    iconUrl: churchIconUrl,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32]
  });
  
  parishes.forEach((p, index) => {
    console.log(`Parish ${index}:`, p.name, 'lat:', p.lat, 'lng:', p.lng);
    if (typeof p.lat === "number" && typeof p.lng === "number") {
      console.log('Adding parish marker for:', p.name);
      const marker = L.marker([p.lat, p.lng], { icon: churchIcon }).addTo(markersLayer);
      marker.bindPopup(
        `<div style="text-align: center;">
          <strong style="color: #8b45ff;">⛪ ${p.name}</strong><br>
          <span style="font-size: 0.85em;">${p.address || ""}</span>
          ${p.phone ? `<br><span style="font-size: 0.85em;">${p.phone}</span>` : ""}
        </div>`
      );
    } else {
      console.log('Parish missing coordinates:', p.name);
    }
  });
  
  console.log('Finished rendering parishes. Total markers in layer:', markersLayer.getLayers().length);
}

// Render business cards and markers
function renderBusinesses(businesses, bounds) {
  console.log('renderBusinesses called with:', businesses.length, 'businesses');
  
  // Clear sidebar
  businessListEl.innerHTML = "";

  // Don't clear markers here - they're cleared before both businesses and parishes are rendered

  if (!businesses || businesses.length === 0) {
    businessListEl.innerHTML =
      "<p>No businesses found in this area (using sample data). Add some to the DB!</p>";
    console.log('No businesses to render');
    return;
  }

  businesses.forEach((b, index) => {
    // Card
    const card = document.createElement("div");
    card.className = "business-card";

    // Verified badge if business is verified
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
    if (b.owner) {
      owner.textContent = `Owner: ${b.owner}`;
    }

    const phone = document.createElement("p");
    if (b.phone) {
      phone.textContent = `Phone: ${b.phone}`;
    }

    const category = document.createElement("p");
    if (b.category) {
      category.textContent = `Category: ${b.category}`;
    }

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
    if (b.description) {
      desc.textContent = b.description;
    }

    // Parish badge if business is associated with a parish
    let parishBadge = null;
    if (b.parishId && parishesData[b.parishId]) {
      parishBadge = document.createElement("div");
      parishBadge.className = "parish-badge";
      parishBadge.innerHTML = `<span class="church-icon">⛪</span><span>${parishesData[b.parishId].name}</span>`;
    }

    // Amenities icons
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

    // Business hours status
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
        // Continue without showing hours
      }
    }

    // Directions button
    const directionsBtn = document.createElement("button");
    directionsBtn.className = "directions-btn";
    directionsBtn.innerHTML = "📍 Get Directions";
    directionsBtn.addEventListener("click", (e) => {
      e.stopPropagation(); // Prevent card click from firing
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

    // Marker on map
    console.log(`Business ${index}:`, b.name, 'lat:', b.lat, 'lng:', b.lng, 'typeof lat:', typeof b.lat, 'typeof lng:', typeof b.lng);
    if (typeof b.lat === "number" && typeof b.lng === "number") {
      console.log('Adding business marker for:', b.name);
      const marker = L.marker([b.lat, b.lng]).addTo(markersLayer);
      marker.bindPopup(
        `<strong>${b.name}</strong><br>${b.address || ""}${
          b.website
            ? `<br><a href="${b.website}" target="_blank">Website</a>`
            : ""
        }`
      );

      // Clicking the card recenters and opens marker
      card.addEventListener("click", () => {
        // Track card click
        trackBusinessClick(b._id || b.id, b.name, 'card_click');
        
        map.setView([b.lat, b.lng], Math.max(map.getZoom(), 15));
        marker.openPopup();
      });
    } else {
      console.log('Business missing valid coordinates:', b.name, 'lat:', b.lat, 'lng:', b.lng);
    }
  });
  
  console.log('Finished rendering businesses. Total markers in layer:', markersLayer.getLayers().length);
}

// Track business interactions for analytics
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
        userLocation: userLocation // Will be null if not shared
      })
    });
  } catch (err) {
    console.error('Failed to track click:', err);
    // Fail silently - don't disrupt user experience
  }
}

// Open maps app with coordinates
function openMapsApp(lat, lng, name) {
  // Detect if user is on mobile
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  
  if (isMobile) {
    // Try to open native maps app
    // iOS will use Apple Maps, Android will use Google Maps
    window.location.href = `maps://?q=${lat},${lng}`;
    
    // Fallback to Google Maps web if native app doesn't open
    setTimeout(() => {
      window.open(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`, '_blank');
    }, 500);
  } else {
    // Desktop: open Google Maps in new tab
    window.open(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`, '_blank');
  }
}
