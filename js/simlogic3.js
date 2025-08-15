let allSim = (simPredict = simHistogram = simTotals = true);

function toggleAllSim() {
  allSim = !allSim;
  const btn = document.getElementById("simAll");
  btn.classList.remove("active-sim");
  btn.classList.remove("btn-secondary");
  if (allSim) btn.classList.add("active-sim");
  else btn.classList.add("btn-secondary");
}

function toggleSimHistogram() {
  simHistogram = !simHistogram;
  const btn = document.getElementById("simHistogram");
  btn.classList.remove("active-histogram");
  btn.classList.remove("btn-secondary");
  if (simHistogram) btn.classList.add("active-histogram");
  else btn.classList.add("btn-secondary");
}

function toggleSimTotals() {
  simTotals = !simTotals;
  const btn = document.getElementById("simTotals");
  btn.classList.remove("active-totals");
  btn.classList.remove("btn-secondary");
  if (simTotals) btn.classList.add("active-totals");
  else btn.classList.add("btn-secondary");
}
function toggleSimPredict() {
  simPredict = !simPredict;
  const btn = document.getElementById("simPredict");
  btn.classList.remove("active-predict");
  btn.classList.remove("btn-secondary");
  if (simPredict) btn.classList.add("active-predict");
  else btn.classList.add("btn-secondary");
}

// Global car reference array
let carElements = [[], []]; // carElements[lane][position]

function paintOneStreet(street_type, alert_level) {
  // console.log(`Painting street ${street_type} with level ${alert_level}`);
  const obj = document.createElement("img");
  if (alert_level == 0) {
    return;
  } else if (alert_level == 1) {
    obj.src = `https://raw.githubusercontent.com/AbrilPolanco/iotProjectMedia/main/media/yellow_bg.png`;
  } else {
    obj.src = `https://raw.githubusercontent.com/AbrilPolanco/iotProjectMedia/main/media/red_bg.png`;
  }
  obj.alt = `Street alert`;
  obj.classList.add("street_alert");

  // === Positioning ===
  obj.style.position = "absolute";
  obj.style.zIndex = 5;

  if (street_type === 0) {
    // Horizontal lane
    obj.style.top = "32%";
    obj.style.left = "0%";
    obj.style.width = "48.4%";
    obj.style.height = "11.75%";
  } else {
    // Vertical lane
    obj.style.top = "45.1%";
    obj.style.left = "50.4%";
    obj.style.width = "16%";
    obj.style.height = "55.1%";
  }

  document.getElementById("street-container").appendChild(obj);

  if (street_type === 0) V_ALERT = obj;
  else H_ALERT = obj;
  setTimeout(() => {
    obj.remove();
  }, updateTimes.clearMap);
}

function paintStreets(cars_h, cars_v) {
  // console.log(`V: ${cars_v} | H: ${cars_h}`);
  paintOneStreet(0, cars_v >= 4 ? 2 : cars_v > 2 ? 1 : 0);
  paintOneStreet(1, cars_h >= 4 ? 2 : cars_h > 2 ? 1 : 0);
}

function createCar(laneIndex, posIndex) {
  const car = document.createElement("img");

  // === Choose image based on lane ===
  const horizontalVariants = 1; // change this if you have more
  const verticalVariants = 1;

  let folder = "";
  let variant = 1;

  if (laneIndex === 0) {
    folder = "horizontalCars";
    variant = Math.floor(Math.random() * horizontalVariants) + 1;
  } else if (laneIndex === 1) {
    folder = "verticalCars";
    variant = Math.floor(Math.random() * verticalVariants) + 1;
  }

  car.src = `https://raw.githubusercontent.com/AbrilPolanco/iotProjectMedia/main/media/${folder}/auto${variant}.png`;
  car.alt = `Car ${laneIndex}.${posIndex}`;
  car.classList.add("overlay");

  // === Positioning ===
  car.style.position = "absolute";
  car.style.zIndex = 10;

  if (laneIndex === 0) {
    // Horizontal lane
    car.style.top = "33.6%";
    car.style.left = 1 + posIndex * 10 + "%";
  } else {
    // Vertical lane
    car.style.left = "53%";
    car.style.top = 50 + posIndex * 10 + "%";
  }

  // === ID and data attributes ===
  car.id = `car${laneIndex}.${posIndex}`;
  car.dataset.lane = laneIndex;
  car.dataset.pos = posIndex;

  // === Store and append ===
  carElements[laneIndex][posIndex] = car;
  document.getElementById("street-container").appendChild(car);

  // === Auto-remove after 2 seconds ===
  setTimeout(() => {
    if (carElements[laneIndex][posIndex]) {
      carElements[laneIndex][posIndex].remove();
      carElements[laneIndex][posIndex] = null;
    }
  }, updateTimes.clearMap);
}

function getCars() {
  if (!allSim) return;
  fetch(SITE_PREFIX + "/get_traffic")
    .then((r) => r.text())
    .then((text_data) => {
      // console.log("Traffic data (raw):", text_data);

      let data = [[], []];
      let half = Math.floor(text_data.length / 2);

      for (let i = 0; i < half; i++) {
        data[0].push(parseInt(text_data.charAt(i)));
      }
      for (let i = half; i < text_data.length; i++) {
        data[1].push(parseInt(text_data.charAt(i)));
      }

      // === Clear previous cars ===
      document.querySelectorAll(".overlay").forEach((el) => el.remove());
      carElements = [[], []]; // reset reference array
      let carsv = 0;
      let carsh = 0;
      // === Create new cars from data ===
      data.forEach((lane, laneIndex) => {
        lane.forEach((value, posIndex) => {
          if (value === 1) {
            if (laneIndex === 1) {
              carsh++;
            } else {
              carsv++;
            }
            createCar(laneIndex, posIndex);
          } else {
            carElements[laneIndex][posIndex] = null;
          }
        });
      });
      paintStreets(carsh, carsv);
    })
    .catch((err) => console.error("Fetch error for get_traffic:", err));
}

function getLights() {
  if (!allSim) return;
  fetch(SITE_PREFIX + "/get_lights")
    .then((r) => r.text())
    .then((data) => {
      // console.log(`Lights data: ${data}`);
      // console.log(`v${data[0]}`);
      // console.log(`h${data[1]}`);

      // === Clear previous lights ===
      document
        .querySelectorAll(".lightItem")
        .forEach((el) => (el.style.display = "none"));
      document.getElementById(`v${data[0]}`).style.display = "block";
      document.getElementById(`h${data[1]}`).style.display = "block";
      setTimeout(() => {
        document.getElementById(`v${data[0]}`).style.display = "none";
        document.getElementById(`h${data[1]}`).style.display = "none";
      }, updateTimes.clearMap);
    })
    .catch((err) => console.error("Fetch error for get_lights:", err));
}

function getTotals() {
  if (!simTotals) return;
  fetch(SITE_PREFIX + "/get_totals")
    .then((r) => r.text())
    .then((data) => {
      const [tt, th, tv] = data.split(",");
      document.getElementById("totalT").innerText = tt;
      document.getElementById("totalV").innerText = tv;
      document.getElementById("totalH").innerText = th;
    })
    .catch((err) => console.error("Fetch error for get_totals:", err));
}

function updateMap() {
  getCars();
  getLights();
}

updateMap();
getTotals();
setInterval(updateMap, updateTimes.map);
setInterval(getTotals, updateTimes.totals);
