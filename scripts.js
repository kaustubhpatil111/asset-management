document.addEventListener("DOMContentLoaded", () => {
  const signUpForm = document.getElementById("signUpForm");
  const signInForm = document.getElementById("signInForm");
  const assetManagement = document.getElementById("assetManagement");
  const assetList = document.getElementById("assetList");
  const assetCategoryTitle = document.getElementById("assetCategoryTitle");
  const assetTableBody = document.getElementById("assetTableBody");
  const searchBar = document.getElementById("searchBar");

  // Show sign-up form and hide sign-in form
  window.showSignUp = function () {
    signUpForm.style.display = "block";
    signInForm.style.display = "none";
  };

  // Show sign-in form and hide sign-up form
  window.showSignIn = function () {
    signUpForm.style.display = "none";
    signInForm.style.display = "block";
  };

  // Sign-up handler
  const signupFormElement = document.getElementById("signup");
  if (signupFormElement) {
    signupFormElement.addEventListener("submit", async (e) => {
      e.preventDefault();
      const username = document.getElementById("signupUsername").value;
      const email = document.getElementById("signupEmail").value;
      const phoneNumber = document.getElementById("signupPhone").value;
      const password = document.getElementById("signupPassword").value;

      try {
        const response = await fetch("/api/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, email, phoneNumber, password }),
        });
        const result = await response.json();
        alert(result.message);
        if (response.ok) showSignIn();
      } catch (error) {
        alert("Error signing up.");
      }
    });
  }

  // Sign-in handler
  const signinFormElement = document.getElementById("signin");
  if (signinFormElement) {
    signinFormElement.addEventListener("submit", async (e) => {
      e.preventDefault();
      const username = document.getElementById("signinUsername").value;
      const password = document.getElementById("signinPassword").value;

      try {
        const response = await fetch("/api/signin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, password }),
        });
        const result = await response.json();
        alert(result.message);
        if (response.ok) {
          signInForm.style.display = "none";
          assetManagement.style.display = "block";
          document.getElementById('authContainer').style.display = 'none';
        }
      } catch (error) {
        alert("Error signing in.");
      }
    });
  }

  // Show assets of a specific category
  window.showAssets = function (category) {
    assetCategoryTitle.textContent = capitalizeFirstLetter(category) + "s";
    assetList.style.display = "block";
    loadAssets(category);
    showAddAssetModal(category);
  };

  // Helper function to capitalize the first letter
  function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }

  // Load assets from server, optionally filtered by category
  async function loadAssets(category = null) {
    try {
      let url = "/api/assets";
      if (category) {
        url += `?type=${category}`;
      }
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Failed to load assets");
      }
      const assets = await response.json();
      assetTableBody.innerHTML = "";

      if (assets.length === 0) {
        assetTableBody.innerHTML =
          "<tr><td colspan='7'>No assets available</td></tr>";
        return;
      }

      assets.forEach((asset) => {
        const row = `
          <tr>
            <td>${asset.name}</td>
            <td>${capitalizeFirstLetter(asset.type)}</td>
            <td>${asset.owner.username}</td>
            <td>${asset.macAddress || "N/A"}</td>
            <td>${new Date(asset.assignDate).toLocaleDateString()}</td>
            <td>${new Date(asset.expiryDate).toLocaleDateString()}</td>
            <td>
              <button class="btn-danger" onclick="deleteAsset('${asset._id}')">Delete</button>
            </td>
          </tr>
        `;
        assetTableBody.innerHTML += row;
      });
    } catch (error) {
      console.error("Error loading assets:", error);
      alert("Error loading assets.");
    }
  }

  // Delete asset
  window.deleteAsset = async function (assetId) {
    if (!confirm("Are you sure you want to delete this asset?")) return;

    try {
      const response = await fetch(`/api/assets/${assetId}`, {
        method: "DELETE",
      });
      if (response.status === 204) {
        alert("Asset deleted successfully");
        loadAssets(); // Reload assets after deletion
      } else {
        const result = await response.json();
        alert(result.message || "Error deleting asset.");
      }
    } catch (error) {
      alert("Error deleting asset.");
    }
  };

  // Search functionality
  if (searchBar) {
    searchBar.addEventListener("input", () => {
      const searchQuery = searchBar.value.toLowerCase();
      const rows = assetTableBody.querySelectorAll("tr");

      rows.forEach((row) => {
        const assetName = row.querySelector("td:first-child").textContent.toLowerCase();
        row.style.display = assetName.includes(searchQuery) ? "" : "none";
      });
    });
  }

  // Show Add Asset Modal
  window.showAddAssetModal = function (category) {
    const modal = document.getElementById("addAssetModal");
    modal.style.display = "block"; // Display the modal
    document.getElementById("addAssetCategory").value = category; // Set the category in the hidden input
  };

  // Handle Add Asset Form Submission
  document.getElementById("addAssetForm").addEventListener("submit", async function (event) {
    event.preventDefault();

    const name = document.getElementById("assetName").value;
    const type = document.getElementById("addAssetCategory").value; // Use the category from the modal
    const macAddress = document.getElementById("assetMac").value;
    const assignDate = document.getElementById("assetAssignDate").value;
    const expiryDate = document.getElementById("assetReturnDate").value;

    try {
      const response = await fetch("/api/assets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, type, macAddress, assignDate, expiryDate }),
      });

      if (response.ok) {
        const asset = await response.json();
        addAssetToList(asset); // Add the new asset dynamically to the list
        document.getElementById("addAssetModal").style.display = "none";
        this.reset(); // Reset the form after submission
      } else {
        alert("Error adding asset.");
      }
    } catch (error) {
      alert("Error adding asset.");
    }
  });

  // Add asset to the table dynamically
  function addAssetToList(asset) {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${asset.name}</td>
      <td>${capitalizeFirstLetter(asset.type)}</td>
      <td>${asset.owner.username}</td>
      <td>${asset.macAddress || "N/A"}</td>
      <td>${new Date(asset.assignDate).toLocaleDateString()}</td>
      <td>${new Date(asset.expiryDate).toLocaleDateString()}</td>
      <td>
        <button class="btn-danger" onclick="deleteAsset('${asset._id}')">Delete</button>
      </td>
    `;
    assetTableBody.appendChild(row);
  }

  // Close Add Asset Modal
  document.getElementById("closeAddAssetModal").addEventListener("click", function () {
    document.getElementById("addAssetModal").style.display = "none";
  });
});
