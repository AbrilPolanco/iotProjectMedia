function parseCSV1(csvText) {
  const rows = csvText.trim().split("\n"); // skip header
  return rows.map((row) => {
    const [ts, a, b, c] = row.split(",").map(Number);
    return { timestamp: ts, a, b, c };
  });
}

function linearRegression(data, key) {
  const n = data.length;
  const x = data.map((_, i) => i); // using index as x
  const y = data.map((d) => d[key]);

  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((acc, xi, i) => acc + xi * y[i], 0);
  const sumX2 = x.reduce((acc, xi) => acc + xi * xi, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  return (futureIndex) => Math.round(intercept + slope * futureIndex);
}

let P_CHART = null;

function doPredict() {
  if(!simPredict) return;
  fetch(SITE_PREFIX + "/get_whole_history")
    .then((r) => r.text())
    .then((d) => {
      const origData = parseCSV1(d);
      const predictA = linearRegression(origData, "a");
      const predictB = linearRegression(origData, "b");
      const predictC = linearRegression(origData, "c");

      const amnt_pred = 360;
      let newData = "";

      let last_real = Number(
        d.trim().split("\n")[origData.length - 1].split(",")[0]
      );
      for (let i = origData.length; i < origData.length + amnt_pred; i++) {
        newData += `${last_real + (i - origData.length) * 10},${predictA(
          i
        )},${predictB(i)},${predictC(i)}\n`;
      }
      // console.log(`Next ${amnt_pred} predictions (A, B, C):`);
      // console.log(newData);

      //   new chart

      if (P_CHART != null) {
        P_CHART.destroy();
      }

      const lines = newData.split("\n");
      const data = lines.map((line) => line.split(",").map(Number));

      // Group by 10-minute intervals (600 seconds)
      const grouped = {};

      for (const row of data) {
        const ts = row[0];
        const val1 = row[1];
        const val2 = row[2];
        const val3 = row[3];

        const interval = Math.floor(ts / 600) * 600; // floor to nearest 10-minute mark

        if (!grouped[interval]) {
          grouped[interval] = { val1: 0, val2: 0, val3: 0 };
        }

        grouped[interval].val1 += val1;
        grouped[interval].val2 += val2;
        grouped[interval].val3 += val3;
      }

      // Prepare data for chart
      const sortedTimestamps = Object.keys(grouped)
        .map(Number)
        .sort((a, b) => a - b);

      const labels = sortedTimestamps.map((ts) =>
        new Date(ts * 1000).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })
      );

      const sum1 = sortedTimestamps.map((ts) => grouped[ts].val1);
      const sum2 = sortedTimestamps.map((ts) => grouped[ts].val2);
      const sum3 = sortedTimestamps.map((ts) => grouped[ts].val3);

      const ctx = document.getElementById("predictChart").getContext("2d");
      P_CHART = new Chart(ctx, {
        type: "line",
        data: {
          labels: labels,
          datasets: [
            {
              label: "Total",
              data: sum1,
              borderColor: "red",
              fill: false,
              tension: 0.1,
            },
            {
              label: "Linea 1",
              data: sum2,
              borderColor: "blue",
              fill: false,
              tension: 0.1,
            },
            {
              label: "Linea 2",
              data: sum3,
              borderColor: "green",
              fill: false,
              tension: 0.1,
            },
          ],
        },
        options: {
          responsive: true,
          plugins: {
          },
          scales: {
            x: {
              title: { display: true, text: "Hora" },
            },
            y: {
              beginAtZero: true,
              title: { display: true, text: "Suma de vehículos" },
            },
          },
        },
      });
    });
}

doPredict();
setInterval(() => {
  doPredict();
}, updateTimes.prediction);