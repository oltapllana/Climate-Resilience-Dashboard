// Convert degrees to compass direction (16-point compass)
export function degreesToDirection(degrees) {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round(degrees / 22.5) % 16;
  return directions[index];
}

// Speed ranges for wind rose (m/s) - smooth gradient blue→green→yellow→orange→red
export const SPEED_RANGES = [
  { min: 0, max: 0.5, label: "0 - 0.5", color: "#0040aa" },
  { min: 0.5, max: 1.0, label: "0.5 - 1.0", color: "#0066dd" },
  { min: 1.0, max: 3.0, label: "1.0 - 3.0", color: "#00bb44" },
  { min: 3.0, max: 5.0, label: "3.0 - 5.0", color: "#ffdd00" },
  { min: 5.0, max: 7.0, label: "5.0 - 7.0", color: "#ff9900" },
  { min: 7.0, max: 10.0, label: "7.0 - 10.0", color: "#ff5500" },
  { min: 10.0, max: Infinity, label: "> 10.0", color: "#dd0000" },
];

export function getSpeedRange(speed) {
  return SPEED_RANGES.find(r => speed >= r.min && speed < r.max);
}

// Process wind data to create wind rose structure
export function processWindData(directionData, speedData) {
  if (!directionData?.daily?.length || !speedData?.daily?.length) return null;

  // Create a map of date -> speed for quick lookup
  const speedMap = {};
  speedData.daily.forEach(d => {
    speedMap[d.d] = d.v;
  });

  // Initialize direction bins
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const windRose = {};
  const directionStats = {}; // Store counts and speeds per direction

  directions.forEach(dir => {
    windRose[dir] = {};
    directionStats[dir] = { count: 0, speedSum: 0, speedMax: 0 };
    SPEED_RANGES.forEach(range => {
      windRose[dir][range.label] = 0;
    });
  });

  // Process each daily record
  let totalRecords = 0;
  let calmCount = 0;
  let speedSum = 0;
  let speedMax = 0;

  directionData.daily.forEach(dirEntry => {
    const speed = speedMap[dirEntry.d];
    if (speed == null) return;

    const direction = degreesToDirection(dirEntry.v);
    const speedRange = getSpeedRange(speed);

    if (speedRange) {
      windRose[direction][speedRange.label]++;
      directionStats[direction].count++;
      directionStats[direction].speedSum += speed;
      directionStats[direction].speedMax = Math.max(directionStats[direction].speedMax, speed);

      totalRecords++;
      speedSum += speed;
      speedMax = Math.max(speedMax, speed);

      if (speed < 0.5) calmCount++;
    }
  });

  // Get date range from data
  const dates = directionData.daily.map(d => new Date(d.d));
  const minDate = new Date(Math.min(...dates));
  const maxDate = new Date(Math.max(...dates));

  const formatDate = (date) => {
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'];
    return `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
  };

  // Calculate statistics
  const stats = {
    totalRecords,
    calmCount,
    calmPercentage: totalRecords > 0 ? (calmCount / totalRecords * 100).toFixed(2) : 0,
    meanSpeed: totalRecords > 0 ? (speedSum / totalRecords).toFixed(2) : 0,
    maxSpeed: speedMax.toFixed(1),
    minSpeed: 0,
    dateRange: `${formatDate(minDate)} – ${formatDate(maxDate)}`,
  };

  // Convert counts to percentages
  const windRosePercent = {};
  directions.forEach(dir => {
    windRosePercent[dir] = {};
    SPEED_RANGES.forEach(range => {
      const count = windRose[dir][range.label];
      windRosePercent[dir][range.label] = totalRecords > 0 ? (count / totalRecords * 100).toFixed(2) : 0;
    });
  });

  // Calculate mean speed per direction
  const directionMeanSpeeds = {};
  directions.forEach(dir => {
    if (directionStats[dir].count > 0) {
      directionMeanSpeeds[dir] = (directionStats[dir].speedSum / directionStats[dir].count).toFixed(2);
    }
  });

  return {
    windRose: windRosePercent,
    stats,
    directions,
    speedRanges: SPEED_RANGES,
    directionStats,
    directionMeanSpeeds,
  };
}

// Process wind data for hourly risk heatmap (hour of day vs month)
export function processWindRiskHeatmap(speedData) {
  if (!speedData?.hourly?.length) return null;

  const monthNames = ['Jan', 'Shk', 'Mar', 'Pri', 'Maj', 'Qer', 'Kor', 'Gus', 'Sht', 'Tet', 'Nën', 'Dhj'];
  const HIGH_WIND_THRESHOLD = 10.8; // m/s - Beaufort Scale Bf 6 (Strong wind)

  // Initialize data structure: [month][hour]
  const heatmapData = {};
  monthNames.forEach(month => {
    heatmapData[month] = {};
    for (let hour = 0; hour < 24; hour++) {
      heatmapData[month][hour] = { count: 0, highRiskCount: 0 };
    }
  });

  // Process each hourly record - format is YYYY-MM-DDTHH:00
  speedData.hourly.forEach(entry => {
    const dateStr = entry.d; // format: "2021-04-06T10:00"
    const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):/);
    if (!match) return;

    const month = parseInt(match[2]) - 1; // 0-based month
    const hour = parseInt(match[4]);
    const speed = entry.v;

    const monthName = monthNames[month];
    if (heatmapData[monthName] && heatmapData[monthName][hour] !== undefined) {
      heatmapData[monthName][hour].count++;
      if (speed >= HIGH_WIND_THRESHOLD) {
        heatmapData[monthName][hour].highRiskCount++;
      }
    }
  });

  // Convert to percentages
  const heatmapPercent = {};
  monthNames.forEach(month => {
    heatmapPercent[month] = {};
    for (let hour = 0; hour < 24; hour++) {
      const data = heatmapData[month][hour];
      heatmapPercent[month][hour] = data.count > 0
        ? (data.highRiskCount / data.count * 100).toFixed(2)
        : 0;
    }
  });

  return {
    heatmapData: heatmapPercent,
    months: monthNames,
    highWindThreshold: HIGH_WIND_THRESHOLD,
  };
}
