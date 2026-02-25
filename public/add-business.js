// add-business.js - Form handling for the dedicated Add Business page

// DOM Elements
const businessForm = document.getElementById("businessForm");
const submitBtn = document.getElementById("submitBtn");
const errorMessage = document.getElementById("errorMessage");
const successMessage = document.getElementById("successMessage");

// Image upload elements
const uploadPlaceholder = document.getElementById("uploadPlaceholder");
const businessImageInput = document.getElementById("businessImage");
const imagePreview = document.getElementById("imagePreview");
const previewImg = document.getElementById("previewImg");
const imageName = document.getElementById("imageName");
const removeImageBtn = document.getElementById("removeImageBtn");

// Parish lookup
const businessCityInput = document.getElementById("businessCity");
const businessParishSelect = document.getElementById("businessParish");

let selectedImageFile = null;

// ==========================================
// IMAGE UPLOAD HANDLING
// ==========================================

uploadPlaceholder.addEventListener("click", () => {
    businessImageInput.click();
});

businessImageInput.addEventListener("change", (e) => {
    handleImageFile(e.target.files[0]);
});

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
        showError("Please drop an image file.");
    }
});

removeImageBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    selectedImageFile = null;
    businessImageInput.value = "";
    uploadPlaceholder.style.display = "flex";
    imagePreview.style.display = "none";
});

function handleImageFile(file) {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
        showError("Please select an image file.");
        return;
    }

    if (file.size > 5 * 1024 * 1024) {
        showError("Image file size must be less than 5MB.");
        return;
    }

    selectedImageFile = file;

    const reader = new FileReader();
    reader.onload = (e) => {
        previewImg.src = e.target.result;
        imageName.textContent = file.name;
        uploadPlaceholder.style.display = "none";
        imagePreview.style.display = "block";
    };
    reader.readAsDataURL(file);
}

// ==========================================
// PARISH LOOKUP (on city input)
// ==========================================

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

// ==========================================
// FORM SUBMISSION
// ==========================================

businessForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    hideError();

    // Validate required fields
    const name = document.getElementById("businessName").value.trim();
    const address = document.getElementById("businessAddress").value.trim();
    const city = document.getElementById("businessCity").value.trim();

    if (!name) {
        showError("Business name is required.");
        return;
    }
    if (!address) {
        showError("Full address is required.");
        return;
    }
    if (!city) {
        showError("City is required.");
        return;
    }

    // Disable button and show loading state
    submitBtn.disabled = true;
    submitBtn.classList.add("loading");
    submitBtn.innerHTML = '<i class="fas fa-spinner"></i> Submitting...';

    try {
        const formData = new FormData();
        formData.append("name", name);
        formData.append("address", address);
        formData.append("street", document.getElementById("businessStreet").value.trim());
        formData.append("city", city);
        formData.append("state", document.getElementById("businessState").value.trim());
        formData.append("zip", document.getElementById("businessZip").value.trim());
        formData.append("owner", document.getElementById("businessOwner").value.trim());
        formData.append("phone", document.getElementById("businessPhone").value.trim());
        formData.append("email", document.getElementById("businessEmail").value.trim());
        formData.append("website", document.getElementById("businessWebsite").value.trim());
        formData.append("category", document.getElementById("businessCategory").value.trim());
        formData.append("tags", document.getElementById("businessTags").value.trim());
        formData.append("description", document.getElementById("businessDescription").value.trim());

        // Parish
        const parishSelect = document.getElementById("businessParish");
        formData.append("parishId", parishSelect.value || "");
        const selectedParish = parishSelect.options[parishSelect.selectedIndex];
        formData.append("parishName", selectedParish && selectedParish.value ? selectedParish.textContent : "");

        // Amenities
        formData.append("hasWifi", document.getElementById("hasWifi").checked);
        formData.append("familyFriendly", document.getElementById("familyFriendly").checked);
        formData.append("hasParking", document.getElementById("hasParking").checked);

        // Schedule
        const schedule = {
            sunday: { open: document.getElementById("sundayOpen").value || null, close: document.getElementById("sundayClose").value || null },
            monday: { open: document.getElementById("mondayOpen").value || null, close: document.getElementById("mondayClose").value || null },
            tuesday: { open: document.getElementById("tuesdayOpen").value || null, close: document.getElementById("tuesdayClose").value || null },
            wednesday: { open: document.getElementById("wednesdayOpen").value || null, close: document.getElementById("wednesdayClose").value || null },
            thursday: { open: document.getElementById("thursdayOpen").value || null, close: document.getElementById("thursdayClose").value || null },
            friday: { open: document.getElementById("fridayOpen").value || null, close: document.getElementById("fridayClose").value || null },
            saturday: { open: document.getElementById("saturdayOpen").value || null, close: document.getElementById("saturdayClose").value || null }
        };
        formData.append("schedule", JSON.stringify(schedule));

        // Image
        if (selectedImageFile) {
            formData.append("image", selectedImageFile);
        }

        const res = await fetch("/api/submissions", {
            method: "POST",
            body: formData
        });

        const data = await res.json();

        if (res.ok) {
            // Show success message, hide form
            businessForm.style.display = "none";
            successMessage.style.display = "block";
            window.scrollTo({ top: 0, behavior: "smooth" });
        } else {
            showError(data.error || "Failed to submit business. Please try again.");
            resetSubmitBtn();
        }
    } catch (err) {
        console.error("Submission error:", err);
        showError("An error occurred. Please check your connection and try again.");
        resetSubmitBtn();
    }
});

function resetSubmitBtn() {
    submitBtn.disabled = false;
    submitBtn.classList.remove("loading");
    submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Submit Business';
}

function showError(msg) {
    errorMessage.textContent = msg;
    errorMessage.style.display = "flex";
    errorMessage.scrollIntoView({ behavior: "smooth", block: "center" });
}

function hideError() {
    errorMessage.style.display = "none";
}
