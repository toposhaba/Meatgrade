export const BEEF_DEGREES = [
  "Practically Devoid",
  "Traces",
  "Slight",
  "Small",
  "Modest",
  "Moderate",
  "Slightly Abundant",
  "Moderately Abundant",
  "Abundant",
  "Very Abundant",
];

export const LAMB_STREAKING = [
  "Practically Devoid",
  "Traces",
  "Slight",
  "Small",
  "Modest",
  "Moderate",
  "Slightly Abundant",
];

const CAMERA_BANDS = [
  { min: 15, degree: "Abundant" },
  { min: 12, degree: "Moderately Abundant" },
  { min: 10, degree: "Slightly Abundant" },
  { min: 7.5, degree: "Moderate" },
  { min: 6, degree: "Modest" },
  { min: 4.9, degree: "Small" },
  { min: 3.4, degree: "Slight" },
  { min: 2.3, degree: "Traces" },
  { min: 0, degree: "Practically Devoid" },
];

export function classifyPixel(r, g, b) {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  const chroma = max - min;
  if (luma < 35) {
    return "ignore";
  }
  if (g > r + 12 && g > b + 12) {
    return "ignore";
  }
  if (b > r + 8 && b > g) {
    return "ignore";
  }
  if (chroma < 32 && luma > 145) {
    return "fat";
  }
  if (r > 165 && g > 145 && b > 120 && chroma < 55) {
    return "fat";
  }
  if (r > g + 18 && r > b + 12 && r > 70 && luma < 200) {
    return "lean";
  }
  if (chroma < 26 && luma > 120) {
    return "fat";
  }
  return "ignore";
}

export function analyzeRgba(data) {
  let fat = 0;
  let lean = 0;
  let leanLuma = 0;
  const pixels = data.length / 4;
  for (let i = 0; i < data.length; i += 4) {
    const kind = classifyPixel(data[i], data[i + 1], data[i + 2]);
    if (kind === "fat") {
      fat += 1;
    } else if (kind === "lean") {
      lean += 1;
      leanLuma += 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
    }
  }
  const meat = fat + lean;
  const marblingPercent = meat === 0 ? null : (fat / meat) * 100;
  return {
    fatPixels: fat,
    leanPixels: lean,
    meatPixelPercent: pixels === 0 ? 0 : (meat / pixels) * 100,
    marblingPercent,
    meanLeanLuma: lean === 0 ? null : leanLuma / lean,
    suggestedDegree: suggestDegree(marblingPercent),
    suggestedPorkColor: suggestPorkColor(lean === 0 ? null : leanLuma / lean),
    suggestedPorkMarbling: suggestPorkMarbling(marblingPercent),
    enoughTissue: meat >= 500,
  };
}

export function suggestDegree(marblingPercent) {
  if (marblingPercent == null || Number.isNaN(Number(marblingPercent))) {
    return null;
  }
  const value = Number(marblingPercent);
  for (const band of CAMERA_BANDS) {
    if (value >= band.min) {
      return band.degree;
    }
  }
  return "Practically Devoid";
}

export function suggestPorkColor(meanLeanLuma) {
  if (meanLeanLuma == null || Number.isNaN(Number(meanLeanLuma))) {
    return null;
  }
  const luma = Number(meanLeanLuma);
  if (luma >= 175) return 1;
  if (luma >= 155) return 2;
  if (luma >= 130) return 3;
  if (luma >= 105) return 4;
  if (luma >= 80) return 5;
  return 6;
}

export function suggestPorkMarbling(marblingPercent) {
  if (marblingPercent == null || Number.isNaN(Number(marblingPercent))) {
    return null;
  }
  return clamp(Math.round(Number(marblingPercent) / 1.5), 1, 10);
}

export function degreeAtLeast(degree, minimum) {
  const left = BEEF_DEGREES.indexOf(degree);
  const right = BEEF_DEGREES.indexOf(minimum);
  if (left < 0 || right < 0) {
    return false;
  }
  return left >= right;
}

export function gradeSession(input) {
  const species = input.species;
  const review = [];
  let qualityGrade = null;
  let plantCall = null;

  if (species === "Beef") {
    const decision = gradeBeef(input);
    qualityGrade = decision.qualityGrade;
    review.push(...decision.review);
    const yieldDecision = beefYield(input);
    review.push(...yieldDecision.review);
    return finish(qualityGrade, plantCall, yieldDecision, review);
  }
  if (species === "Pork") {
    const decision = gradePork(input);
    plantCall = decision.plantCall;
    review.push(...decision.review);
    return finish(qualityGrade, plantCall, { yieldGrade: null, yieldScore: null }, review);
  }
  if (species === "Lamb") {
    const decision = gradeLamb(input);
    plantCall = decision.plantCall;
    review.push(...decision.review);
    return finish(qualityGrade, plantCall, { yieldGrade: null, yieldScore: null }, review);
  }
  review.push("Choose a species.");
  return finish(null, null, { yieldGrade: null, yieldScore: null }, review);
}

function finish(qualityGrade, plantCall, yieldDecision, review) {
  return {
    qualityGrade,
    plantCall,
    yieldGrade: yieldDecision.yieldGrade,
    yieldScore: yieldDecision.yieldScore,
    requiresReview: review.length > 0,
    reviewReason: review.join(" "),
  };
}

export function gradeBeef(input) {
  const review = [];
  const degree = input.marblingDegree;
  const maturity = input.maturity;
  const sexClass = input.sexClass;
  const darkCutter = Boolean(input.darkCutter);

  if (!degree) {
    return { qualityGrade: null, review: ["Enter a marbling degree."] };
  }
  if (!["A", "B", "C", "D", "E"].includes(maturity)) {
    return { qualityGrade: null, review: ["Enter a maturity group."] };
  }
  if (sexClass === "Bullock" && maturity !== "A") {
    return {
      qualityGrade: null,
      review: ["Bullock beef is quality graded only in A maturity."],
    };
  }

  let qualityGrade = beefGradeFor(degree, maturity);
  if (maturity === "B" && degree === "Slightly Abundant") {
    review.push(
      "B maturity at Slightly Abundant sits on the Prime line. A grader needs to place it inside that degree.",
    );
  }
  if (maturity === "D") {
    review.push(
      "D maturity is interpolated between the published groups. A grader needs to confirm it.",
    );
  }
  if (sexClass === "Cow" && qualityGrade === "Prime") {
    qualityGrade = "Choice";
    review.push("Cow beef is not eligible for Prime. The grade was set to Choice.");
  }
  if (darkCutter && qualityGrade) {
    if (qualityGrade === "Prime" || qualityGrade === "Choice" || qualityGrade === "Select") {
      qualityGrade = lowerFullGrade(qualityGrade, maturity);
      review.push("Dark cutter lowered an eligible grade by one full grade.");
    } else if (qualityGrade === "Standard" || qualityGrade === "Commercial") {
      review.push(
        "Dark cutter can lower this grade by as much as half a grade. A grader needs to finish the call.",
      );
    }
  }
  return { qualityGrade, review };
}

function beefGradeFor(degree, maturity) {
  if (maturity === "A") {
    if (degreeAtLeast(degree, "Slightly Abundant")) return "Prime";
    if (degreeAtLeast(degree, "Small")) return "Choice";
    if (degreeAtLeast(degree, "Slight")) return "Select";
    if (degreeAtLeast(degree, "Practically Devoid")) return "Standard";
    return "Utility";
  }
  if (maturity === "B") {
    if (degreeAtLeast(degree, "Slightly Abundant")) return "Prime";
    if (degreeAtLeast(degree, "Modest")) return "Choice";
    if (degreeAtLeast(degree, "Practically Devoid")) return "Standard";
    return "Utility";
  }
  if (maturity === "C") {
    if (degreeAtLeast(degree, "Small")) return "Commercial";
    if (degreeAtLeast(degree, "Practically Devoid")) return "Utility";
    return "Cutter";
  }
  if (maturity === "D") {
    if (degreeAtLeast(degree, "Modest")) return "Commercial";
    if (degreeAtLeast(degree, "Traces")) return "Utility";
    if (degreeAtLeast(degree, "Practically Devoid")) return "Cutter";
    return "Canner";
  }
  if (degreeAtLeast(degree, "Moderate")) return "Commercial";
  if (degreeAtLeast(degree, "Slight")) return "Utility";
  if (degreeAtLeast(degree, "Practically Devoid")) return "Cutter";
  return "Canner";
}

function lowerFullGrade(grade, maturity) {
  if (grade === "Prime") return "Choice";
  if (grade === "Choice") return maturity === "A" ? "Select" : "Standard";
  if (grade === "Select") return "Standard";
  return grade;
}

export function beefYield(input) {
  const fat = num(input.fatThickness);
  const rea = num(input.ribeyeArea);
  const hcw = num(input.hotCarcassWeight);
  const kph = num(input.kphPercent);
  const values = [fat, rea, hcw, kph];
  const present = values.filter((value) => value != null);
  if (present.length === 0) {
    return { yieldGrade: null, yieldScore: null, review: [] };
  }
  if (present.length < 4) {
    return {
      yieldGrade: null,
      yieldScore: null,
      review: [
        "Yield grade needs fat thickness, ribeye area, hot carcass weight, and kidney, pelvic, and heart fat.",
      ],
    };
  }
  if (fat < 0 || fat > 2 || rea < 4 || rea > 30 || hcw < 200 || hcw > 1500 || kph < 0 || kph > 10) {
    return {
      yieldGrade: null,
      yieldScore: null,
      review: ["A yield measurement is outside the range this chart will score."],
    };
  }
  const raw = 2.5 + 2.5 * fat + 0.2 * kph + 0.0038 * hcw - 0.32 * rea;
  const group = clamp(Math.trunc(raw), 1, 5);
  return {
    yieldGrade: group,
    yieldScore: Math.round((raw + Number.EPSILON) * 100) / 100,
    review: [],
  };
}

function gradePork(input) {
  const color = num(input.colorScore);
  const marbling = num(input.porkMarblingScore);
  if (color == null || marbling == null) {
    return { plantCall: null, review: ["Enter color and marbling scores."] };
  }
  if (color < 1 || color > 6 || marbling < 1 || marbling > 10) {
    return { plantCall: null, review: ["Pork scores stay between color 1 to 6 and marbling 1 to 10."] };
  }
  const preferred = color >= 3 && color <= 5 && marbling >= 2;
  return {
    plantCall: preferred ? "Preferred" : "Review",
    review: preferred ? [] : ["Pork color or marbling is outside the preferred sort."],
  };
}

function gradeLamb(input) {
  const streaking = input.flankStreaking;
  if (!streaking) {
    return { plantCall: null, review: ["Enter flank streaking."] };
  }
  if (degreeAtLeast(streaking, "Modest")) {
    return { plantCall: "Prime sort", review: [] };
  }
  if (degreeAtLeast(streaking, "Small")) {
    return { plantCall: "Choice sort", review: [] };
  }
  if (degreeAtLeast(streaking, "Slight")) {
    return { plantCall: "Good sort", review: [] };
  }
  return { plantCall: "Utility sort", review: ["Lamb flank streaking is below the Good sort."] };
}

function num(value) {
  if (value == null || value === "") {
    return null;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function buildSampleCut(fatRatio = 0.055) {
  const width = 360;
  const height = 270;
  const data = new Uint8ClampedArray(width * height * 4);
  const ratio = Math.min(0.7, Math.max(0, fatRatio));
  const centerX = width / 2;
  const centerY = height / 2;
  const radiusX = width * 0.44;
  const radiusY = height * 0.42;
  const lean = new Uint8Array(width * height);
  let leanCount = 0;
  let seed = 7;
  const random = () => {
    seed = (seed * 1103515245 + 12345) % 2147483648;
    return seed / 2147483648;
  };

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const dx = (x - centerX) / radiusX;
      const dy = (y - centerY) / radiusY;
      const wobble = 1 + 0.04 * Math.sin(x / 23) + 0.03 * Math.cos(y / 17);
      const inside = dx * dx + dy * dy < wobble;
      const offset = (y * width + x) * 4;
      if (inside) {
        lean[y * width + x] = 1;
        leanCount += 1;
        const shade = Math.round(random() * 14) - 7 + Math.round(dy * 8);
        data[offset] = 148 + shade;
        data[offset + 1] = 46 + shade;
        data[offset + 2] = 42 + shade;
      } else {
        data[offset] = 22;
        data[offset + 1] = 20;
        data[offset + 2] = 19;
      }
      data[offset + 3] = 255;
    }
  }

  const target = Math.round((ratio / (1 - ratio)) * leanCount);
  let fat = 0;
  let guard = 0;
  while (fat < target && guard < 20000) {
    guard += 1;
    const cx = Math.floor(random() * width);
    const cy = Math.floor(random() * height);
    if (!lean[cy * width + cx]) {
      continue;
    }
    const rx = 1 + random() * 3.2;
    const ry = 0.8 + random() * 1.6;
    for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y += 1) {
      for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x += 1) {
        if (x < 0 || y < 0 || x >= width || y >= height) continue;
        const index = y * width + x;
        if (lean[index] !== 1) continue;
        const ex = (x - cx) / rx;
        const ey = (y - cy) / ry;
        if (ex * ex + ey * ey > 1) continue;
        lean[index] = 2;
        fat += 1;
        const offset = index * 4;
        data[offset] = 236;
        data[offset + 1] = 226;
        data[offset + 2] = 208;
      }
    }
  }
  return { data, width, height };
}
