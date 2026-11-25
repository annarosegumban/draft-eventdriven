
const $ = id => document.getElementById(id);

const state = {
  origin: null,
  destination: null,
  map: null,
  routeLayer: null,
  markers: [],
  searchTimers: {}
};

// VEHICLE INFORMATION
const vehicles = {
  "42": {
    name: "Yamaha Sniper 155 Motorcycle",
    efficiency: 42
  },
  "12": {
    name: "Four-Wheel Sedan Car",
    efficiency: 12
  }
};

// SUGGESTED SUNSET DESTINATIONS
const destinations = [
  {
    name: "White Island",
    area: "Camiguin, Philippines",
    query: "White Island, Mambajao, Camiguin, Philippines",
    emoji: "🏝️",
    description: "Beautiful island and sea views"
  },
  {
    name: "Dahilayan",
    area: "Bukidnon, Philippines",
    query: "Dahilayan Adventure Park, Bukidnon, Philippines",
    emoji: "⛰️",
    description: "Mountain scenery"
  },
  {
    name: "Seven Seas",
    area: "Opol, Philippines",
    query: "Seven Seas Waterpark, Opol, Philippines",
    emoji: "🌊",
    description: "Coastal getaway"
  },
  {
    name: "Panglao Island",
    area: "Bohol, Philippines",
    query: "Panglao Island, Bohol, Philippines",
    emoji: "🐚",
    description: "Island beaches"
  },
  {
    name: "Boracay",
    area: "Aklan, Philippines",
    query: "White Beach, Boracay, Philippines",
    emoji: "🌅",
    description: "White sand beach"
  },
  {
    name: "Cloud 9",
    area: "Siargao, Philippines",
    query: "Cloud 9, General Luna, Siargao, Philippines",
    emoji: "🏄",
    description: "Surfing and ocean views"
  },
  {
    name: "Rizal Park",
    area: "Manila, Philippines",
    query: "Rizal Park, Manila, Philippines",
    emoji: "🌇",
    description: "City landmark"
  },
  {
    name: "Samal Island",
    area: "Davao, Philippines",
    query: "Samal Island, Davao del Norte, Philippines",
    emoji: "🌴",
    description: "Island destination"
  },
  {
    name: "Lake Sebu",
    area: "South Cotabato, Philippines",
    query: "Lake Sebu, South Cotabato, Philippines",
    emoji: "🛶",
    description: "Lake and mountain views"
  },
  {
    name: "Chocolate Hills",
    area: "Bohol, Philippines",
    query: "Chocolate Hills, Bohol, Philippines",
    emoji: "🌄",
    description: "Beautiful rolling hills"
  },
  {
    name: "Mayon Volcano",
    area: "Albay, Philippines",
    query: "Mayon Volcano, Albay, Philippines",
    emoji: "🌋",
    description: "Volcano scenery"
  },
  {
    name: "La Union",
    area: "San Juan, La Union, Philippines",
    query: "San Juan, La Union, Philippines",
    emoji: "🏖️",
    description: "Beach and surfing"
  }
];

// STATUS MESSAGE
function setStatus(message, error = false) {
  const status = $("status-message");

  status.textContent = message;
  status.classList.toggle("error", error);
}

// SAFE TEXT
function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

// DISPLAY SUGGESTED PLACES
function renderDestinations() {

  $("destination-grid").innerHTML =
    destinations.map((place, index) => `
      <button
        class="destination-card"
        type="button"
        data-index="${index}">

        <span class="destination-visual">
          ${place.emoji}
        </span>

        <span class="destination-info">
          <strong>${escapeHTML(place.name)}</strong>
          <small>
            ${escapeHTML(place.area)}<br>
            ${escapeHTML(place.description)}
          </small>
        </span>

      </button>
    `).join("");

  $("destination-grid").addEventListener("click", async event => {

    const card = event.target.closest("[data-index]");

    if (!card) return;

    const place = destinations[Number(card.dataset.index)];

    $("destination-input").value = place.query;
    state.destination = null;

    setStatus("Finding your selected destination...");

    try {

      const location = await geocode(place.query);

      state.destination = location;

      $("destination-input").value = location.displayName;

      setStatus(
        `${place.name} selected! Enter your starting location.`
      );

    } catch (error) {

      setStatus(error.message, true);

    }

    $("trip-form").scrollIntoView({
      behavior: "smooth",
      block: "center"
    });

  });
}

// SEARCH A LOCATION
async function geocode(query) {

  const url = new URL(
    "https://nominatim.openstreetmap.org/search"
  );

  url.search = new URLSearchParams({
    q: query,
    format: "jsonv2",
    limit: "1",
    addressdetails: "1"
  });

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("Location search is unavailable. Try again.");
  }

  const results = await response.json();

  if (!results.length) {
    throw new Error("Location not found. Please check your address.");
  }

  return normalizePlace(results[0]);
}

// FORMAT LOCATION
function normalizePlace(item) {

  return {
    lat: Number(item.lat),
    lon: Number(item.lon),
    displayName: item.display_name || item.name
  };

}

// LOCATION AUTOCOMPLETE
function setupAutocomplete(inputId, listId, stateKey) {

  const input = $(inputId);
  const list = $(listId);

  input.addEventListener("input", () => {

    clearTimeout(state.searchTimers[stateKey]);

    state[stateKey] = null;

    const query = input.value.trim();

    if (query.length < 3) {
      list.classList.remove("open");
      list.innerHTML = "";
      return;
    }

    state.searchTimers[stateKey] = setTimeout(async () => {

      try {

        const url = new URL(
          "https://nominatim.openstreetmap.org/search"
        );

        url.search = new URLSearchParams({
          q: query,
          format: "jsonv2",
          limit: "5",
          addressdetails: "1"
        });

        const response = await fetch(url);

        if (!response.ok) {
          throw new Error("Search unavailable");
        }

        const results = await response.json();

        list.innerHTML = "";

        if (!results.length) {

          list.innerHTML =
            '<div class="suggestion-item">No matching places found.</div>';

        } else {

          results.forEach(item => {

            const place = normalizePlace(item);

            const button = document.createElement("button");

            button.type = "button";
            button.className = "suggestion-item";

            button.innerHTML = `
              ${escapeHTML(item.name || place.displayName)}
              <small>${escapeHTML(place.displayName)}</small>
            `;

            button.addEventListener("click", () => {

              input.value = place.displayName;

              state[stateKey] = place;

              list.classList.remove("open");
              list.innerHTML = "";

            });

            list.appendChild(button);

          });

        }

        list.classList.add("open");

      } catch (error) {

        list.innerHTML =
          '<div class="suggestion-item">Search unavailable. Try again.</div>';

        list.classList.add("open");

      }

    }, 800);

  });

  input.addEventListener("keydown", event => {

    if (event.key === "Escape") {
      list.classList.remove("open");
    }

    if (event.key === "Enter" && list.classList.contains("open")) {

      const first = list.querySelector("button");

      if (first) {
        event.preventDefault();
        first.click();
      }

    }

  });

  document.addEventListener("click", event => {

    if (
      !event.target.closest(`#${inputId}`) &&
      !event.target.closest(`#${listId}`)
    ) {
      list.classList.remove("open");
    }

  });

}

// GET EXACT SELECTED LOCATION
async function resolvePlace(inputId, stateKey) {

  const typed = $(inputId).value.trim();

  if (!typed) {
    throw new Error("Please enter your starting location and destination.");
  }

  if (
    state[stateKey] &&
    state[stateKey].displayName === typed
  ) {
    return state[stateKey];
  }

  const place = await geocode(typed);

  state[stateKey] = place;

  $(inputId).value = place.displayName;

  return place;

}

// INITIALIZE MAP
function initMap() {

  if (state.map) return;

  state.map = L.map("route-map", {
    zoomControl: true,
    scrollWheelZoom: true
  }).setView([12.5, 122.5], 5);

  L.tileLayer(
    "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    {
      maxZoom: 19,

      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }
  ).addTo(state.map);

  $("zoom-in").addEventListener("click", () => {
    state.map.zoomIn();
  });

  $("zoom-out").addEventListener("click", () => {
    state.map.zoomOut();
  });

  $("fit-route").addEventListener("click", fitRoute);

}

// FIT MAP TO ROUTE
function fitRoute() {

  if (state.routeLayer && state.map) {

    state.map.fitBounds(
      state.routeLayer.getBounds(),
      {
        padding: [40, 40]
      }
    );

  }

}

// GET DRIVING ROUTE
async function getRoute(origin, destination) {

  const url =
    `https://router.project-osrm.org/route/v1/driving/` +
    `${origin.lon},${origin.lat};${destination.lon},${destination.lat}` +
    `?overview=full&geometries=geojson&steps=false`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("Unable to calculate the driving route.");
  }

  const data = await response.json();

  if (data.code !== "Ok" || !data.routes.length) {
    throw new Error("No driving route was found for these locations.");
  }

  return data.routes[0];

}

// DISPLAY ROUTE ON MAP
function drawRoute(origin, destination, route) {

  initMap();

  if (state.routeLayer) {
    state.map.removeLayer(state.routeLayer);
  }

  state.markers.forEach(marker => {
    state.map.removeLayer(marker);
  });

  state.markers = [];

  const coordinates = route.geometry.coordinates.map(
    ([lon, lat]) => [lat, lon]
  );

  state.routeLayer = L.polyline(coordinates, {
    color: "#f59e0b",
    weight: 6,
    opacity: 0.9
  }).addTo(state.map);

  const startMarker = L.marker([
    origin.lat,
    origin.lon
  ])
    .bindPopup(
      `<strong>Starting Location</strong><br>${escapeHTML(origin.displayName)}`
    )
    .addTo(state.map);

  const destinationMarker = L.marker([
    destination.lat,
    destination.lon
  ])
    .bindPopup(
      `<strong>Sunset Destination</strong><br>${escapeHTML(destination.displayName)}`
    )
    .addTo(state.map);

  state.markers.push(startMarker, destinationMarker);

  fitRoute();

  setTimeout(() => {
    state.map.invalidateSize();
    fitRoute();
  }, 150);

}

// SUNRISE AND SUNSET
async function getSunTimes(place) {

  const url = new URL(
    "https://api.sunrise-sunset.org/json"
  );

  url.search = new URLSearchParams({
    lat: place.lat,
    lng: place.lon,
    formatted: "0"
  });

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("Sunset information unavailable.");
  }

  const data = await response.json();

  if (data.status !== "OK") {
    throw new Error("Sunset information unavailable.");
  }

  return data.results;

}

// FORMAT SUNSET TIME
function formatTime(value) {

  if (!value) return "Unavailable";

  return new Intl.DateTimeFormat("en-PH", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "UTC",
    timeZoneName: "short"
  }).format(new Date(value));

}

// SHOW SUNSET INFORMATION
function showSunTimes(times, cloudCover) {

  $("sunrise-output").textContent =
    formatTime(times.sunrise);

  $("sunset-output").textContent =
    formatTime(times.sunset);

  const minutes = Math.round(
    new Date(times.day_length * 1000).getTime() / 60000
  );

  $("daylight-output").textContent =
    `${Math.floor(minutes / 60)}h ${minutes % 60}m`;

  const score = Math.max(
    0,
    Math.min(
      100,
      Math.round(100 - Math.abs(cloudCover - 25) * 1.35)
    )
  );

  $("sunset-score").textContent = score;

  if (cloudCover <= 20) {

    $("sky-verdict").textContent =
      "Mostly clear sky estimate. The sunset may be clearly visible.";

  } else if (cloudCover <= 55) {

    $("sky-verdict").textContent =
      "Some clouds may create beautiful sunset colors.";

  } else {

    $("sky-verdict").textContent =
      "Heavy cloud cover may hide the sunset. Check the local weather.";

  }

}

// AUTOMATIC GASOLINE CALCULATION
function calculateFuel(distanceKm) {

  const vehicleValue = $("vehicle-select").value;

  const vehicle = vehicles[vehicleValue];

  const gasPrice = Number($("gas-price").value);

  if (!vehicle) {
    throw new Error("Please select a valid vehicle.");
  }

  if (!Number.isFinite(gasPrice) || gasPrice <= 0) {
    throw new Error("Please enter a valid gasoline price.");
  }

  // DISTANCE DIVIDED BY KM PER LITER
  const litersUsed = distanceKm / vehicle.efficiency;

  // LITERS MULTIPLIED BY GASOLINE PRICE
  const totalCost = litersUsed * gasPrice;

  $("vehicle-output").textContent = vehicle.name;

  $("distance-output").textContent =
    `${distanceKm.toFixed(2)} km`;

  $("liters-output").textContent =
    `${litersUsed.toFixed(2)} liters`;

  $("price-output").textContent =
    `₱${gasPrice.toFixed(2)}`;

  $("cost-output").textContent =
    new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP"
    }).format(totalCost);

  $("route-warning").textContent =
    `Estimated fuel consumption is based on ${vehicle.efficiency} km/L. Actual consumption may vary depending on traffic, road conditions, speed, and vehicle condition.`;

}

// MAIN CALCULATION
async function calculateTrip(event) {

  event.preventDefault();

  const button = $("calculate-button");

  button.disabled = true;

  $("results").hidden = true;

  setStatus("Calculating your journey. Please wait...");

  try {

    // GET STARTING POINT AND DESTINATION
    const [origin, destination] = await Promise.all([

      resolvePlace("origin-input", "origin"),

      resolvePlace("destination-input", "destination")

    ]);

    // GET ACTUAL DRIVING ROUTE
    const route = await getRoute(origin, destination);

    // ROUTE DISTANCE IN KILOMETERS
    const distanceKm = route.distance / 1000;

    // SHOW RESULTS FIRST SO THE MAP HAS A VISIBLE CONTAINER
    $("results").hidden = false;

    $("result-title").textContent =
      destination.displayName.split(",").slice(0, 2).join(",");

    $("result-subtitle").textContent =
      `${origin.displayName} → ${destination.displayName}`;

    // AUTOMATICALLY COMPUTE FUEL
    calculateFuel(distanceKm);

    // DRAW INTERACTIVE MAP
    drawRoute(origin, destination, route);

    // GET SUNSET INFORMATION
    try {

      const times = await getSunTimes(destination);

      showSunTimes(
        times,
        Number($("cloud-slider").value)
      );

    } catch (error) {

      $("sunrise-output").textContent = "Unavailable";
      $("sunset-output").textContent = "Unavailable";
      $("daylight-output").textContent = "Unavailable";
      $("sunset-score").textContent = "--";

      $("sky-verdict").textContent =
        "Sunset information could not be loaded.";

    }

    setStatus("Your route and gasoline computation are ready!");

    $("results").scrollIntoView({
      behavior: "smooth",
      block: "start"
    });

  } catch (error) {

    $("results").hidden = true;

    setStatus(error.message, true);

  } finally {

    button.disabled = false;

  }

}

// USE CURRENT LOCATION
function useMyLocation() {

  if (!navigator.geolocation) {

    setStatus("Your browser does not support location services.", true);
    return;

  }

  setStatus("Getting your current location...");

  navigator.geolocation.getCurrentPosition(

    async position => {

      const lat = position.coords.latitude;
      const lon = position.coords.longitude;

      state.origin = {
        lat,
        lon,
        displayName: `${lat.toFixed(6)}, ${lon.toFixed(6)}`
      };

      try {

        const url = new URL(
          "https://nominatim.openstreetmap.org/reverse"
        );

        url.search = new URLSearchParams({
          lat,
          lon,
          format: "jsonv2"
        });

        const response = await fetch(url);

        if (response.ok) {

          const data = await response.json();

          state.origin.displayName =
            data.display_name || state.origin.displayName;

        }

      } catch (error) {
        // Coordinates can still be used.
      }

      $("origin-input").value =
        state.origin.displayName;

      setStatus("Your current location is now your starting point.");

    },

    () => {

      setStatus(
        "Location permission denied. Please enter your starting location manually.",
        true
      );

    },

    {
      enableHighAccuracy: true,
      timeout: 10000
    }

  );

}

// CLOUD COVER SLIDER
$("cloud-slider").addEventListener("input", event => {

  $("cloud-value").textContent =
    `${event.target.value}%`;

});

// FORM SUBMISSION
$("trip-form").addEventListener(
  "submit",
  calculateTrip
);

// CURRENT LOCATION BUTTON
$("use-location").addEventListener(
  "click",
  useMyLocation
);

// START WEBSITE
renderDestinations();

setupAutocomplete(
  "origin-input",
  "origin-suggestions",
  "origin"
);

setupAutocomplete(
  "destination-input",
  "destination-suggestions",
  "destination"
);
