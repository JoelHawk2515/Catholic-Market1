// admin-login.js
const loginForm = document.getElementById("loginForm");
const loginError = document.getElementById("loginError");

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;
  
  loginError.classList.add("hidden");
  
  try {
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ username, password })
    });
    
    const data = await res.json();
    
    if (res.ok) {
      // Login successful, redirect to admin dashboard
      window.location.href = "/admin/dashboard.html";
    } else {
      // Show error
      loginError.textContent = data.error || "Invalid credentials";
      loginError.classList.remove("hidden");
    }
  } catch (err) {
    console.error(err);
    loginError.textContent = "Login failed. Please try again.";
    loginError.classList.remove("hidden");
  }
});
