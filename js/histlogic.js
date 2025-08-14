let H_CHART = null;

function updateHistory() {
  if (!simHistogram) return;
  fetch(SITE_PREFIX + "/get_whole_history")
    .then((r) => r.text())
    .then((history_d) => {
      if (H_CHART != null) {
        H_CHART.destroy();
      }
      const rawData = history_d.trim();

      // Parse CSV
      const lines = rawData.split("\n");
      const headers = lines[0].split(",");
      const data = lines.slice(1).map((line) => line.split(",").map(Number));

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

      const ctx = document.getElementById("lineChart").getContext("2d");
      H_CHART = new Chart(ctx, {
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
updateHistory();
setInterval(() => {
  updateHistory();
}, updateTimes.histogram);
