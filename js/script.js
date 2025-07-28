// Select DOM elements
const form = document.querySelector(".top-banner form");
const input = document.querySelector(".top-banner input");
const msg = document.querySelector(".msg");
const list = document.querySelector(".ajax-section .cities");

const apiKey = "066b15f336a0080427a5950cb47ed66b";

form.addEventListener("submit", async e => {
  e.preventDefault();
  let inputVal = input.value.trim();

  // Prevent empty input
  if (!inputVal) {
    msg.textContent = "Please enter a city name.";
    form.reset();
    input.focus();
    return;
  }

  // Check for duplicate city
  const listItems = list.querySelectorAll(".city");
  const listItemsArray = Array.from(listItems);
  const filteredArray = listItemsArray.filter(el => {
    let content = "";
    // Handle city,country
    if (inputVal.includes(",")) {
      if (inputVal.split(",")[1].length > 2) {
        inputVal = inputVal.split(",")[0];
      }
      content = el.querySelector(".city-name").dataset.name.toLowerCase();
    } else {
      content = el.querySelector(".city-name span").textContent.toLowerCase();
    }
    return content === inputVal.toLowerCase();
  });
  if (filteredArray.length > 0) {
    msg.textContent = `You already know the weather for ${filteredArray[0].querySelector(".city-name span").textContent} ...otherwise be more specific by providing the country code as well.`;
    form.reset();
    input.focus();
    return;
  }

  // 1. Get lat/lon from Geocoding API
  const geoUrl = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(inputVal)}&limit=1&appid=${apiKey}`;
  try {
    const geoRes = await fetch(geoUrl);
    if (!geoRes.ok) throw new Error();
    const geoData = await geoRes.json();
    if (!geoData.length) throw new Error();
    const { lat, lon, name, country, state } = geoData[0];

    // 2. Get weather from One Call API 3.0
    const oneCallUrl = `https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`;
    const weatherRes = await fetch(oneCallUrl);
    if (!weatherRes.ok) throw new Error();
    const weatherData = await weatherRes.json();
    const { current, timezone } = weatherData;
    if (!current || !current.weather || !current.weather.length) throw new Error();
    const iconCode = current.weather[0]["icon"]; // e.g., "01d"
    const iconPath = `./icons/${iconCode}.svg`; // path to your custom icon
    const markup = `
      <h2 class="city-name" data-name="${name},${country}">
        <span>${name}${state ? ', ' + state : ''}</span>
        <sup>${country}</sup>
      </h2>
      <div class="city-temp">${Math.round(current.temp)}<sup>°C</sup></div>
      <figure>
        <img class="city-icon" src="${iconPath}" alt="${current.weather[0]["main"]}">
        <figcaption>${current.weather[0]["description"]}</figcaption>
      </figure>
      <div class="timezone">${timezone}</div>
    `;
    const li = document.createElement("li");
    li.classList.add("city");
    li.innerHTML = markup;
    list.appendChild(li);
    msg.textContent = "";
  } catch {
    msg.textContent = "Please search for a valid city 😩";
  }

  form.reset();
  input.focus();
});