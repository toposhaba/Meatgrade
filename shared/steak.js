export const CUTS = [
  "Ribeye",
  "Strip",
  "Sirloin",
  "Tenderloin",
  "T-bone",
  "Chuck",
  "Round",
  "Other",
];

export const LEAN_CUTS = new Set(["Sirloin", "Tenderloin", "Round"]);

const DEGREE_BANDS = [
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

const GRADE_FOR_DEGREE = {
  Abundant: "Prime",
  "Moderately Abundant": "Prime",
  "Slightly Abundant": "Prime",
  Moderate: "Upper Choice",
  Modest: "Upper Choice",
  Small: "Choice",
  Slight: "Select",
  Traces: "Below Select",
  "Practically Devoid": "Below Select",
};

const RATING_FOR_GRADE = {
  Prime: 5,
  "Upper Choice": 4,
  Choice: 3,
  Select: 2,
  "Below Select": 1,
};

export function classifyPixel(r, g, b) {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  const chroma = max - min;
  if (luma < 35) return "ignore";
  if (g > r + 12 && g > b + 12) return "ignore";
  if (b > r + 8 && b > g) return "ignore";
  if (chroma < 32 && luma > 145) return "fat";
  if (r > 165 && g > 145 && b > 120 && chroma < 55) return "fat";
  if (r > g + 18 && r > b + 12 && r > 70 && luma < 200) return "lean";
  if (chroma < 26 && luma > 120) return "fat";
  return "ignore";
}

export function analyzeRgba(data) {
  let fat = 0;
  let lean = 0;
  let sumR = 0;
  let sumG = 0;
  let sumB = 0;
  const pixels = data.length / 4;
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const kind = classifyPixel(r, g, b);
    if (kind === "fat") {
      fat += 1;
    } else if (kind === "lean") {
      lean += 1;
      sumR += r;
      sumG += g;
      sumB += b;
    }
  }
  const meat = fat + lean;
  return {
    fatPixels: fat,
    leanPixels: lean,
    meatPixelPercent: pixels === 0 ? 0 : (meat / pixels) * 100,
    marblingPercent: meat === 0 ? null : (fat / meat) * 100,
    meanLean:
      lean === 0
        ? null
        : { r: Math.round(sumR / lean), g: Math.round(sumG / lean), b: Math.round(sumB / lean) },
    enoughTissue: meat >= 500 && (pixels === 0 || meat / pixels >= 0.12),
  };
}

export function degreeFor(marblingPercent) {
  if (marblingPercent == null || !Number.isFinite(Number(marblingPercent))) return null;
  const value = Number(marblingPercent);
  for (const band of DEGREE_BANDS) {
    if (value >= band.min) return band.degree;
  }
  return "Practically Devoid";
}

export function leanColor(meanLean) {
  if (!meanLean) return null;
  const { r, g, b } = meanLean;
  const redness = r - Math.max(g, b);
  if (b > g + 12 && r < 130) {
    return {
      tone: "purple",
      label: "Deep purple-red",
      note: "Normal for vacuum-sealed beef. It brightens to red once the pack is opened.",
      concern: false,
    };
  }
  if (redness < 45 || (g > 70 && b > 55 && r < 150)) {
    return {
      tone: "brown",
      label: "Brown or grey patches",
      note: "Beef browns as it sits. It can still be safe, but check the sell-by date and smell it when you open it.",
      concern: true,
    };
  }
  if (r < 115) {
    return {
      tone: "dark",
      label: "Dark red",
      note: "Darker lean usually means an older animal or dry-aged beef. Flavor is stronger; tenderness varies.",
      concern: false,
    };
  }
  return {
    tone: "bright",
    label: "Bright cherry red",
    note: "What fresh beef looks like after the pack is opened.",
    concern: false,
  };
}

export function assessSteak(analysis, cut = "Other") {
  if (!analysis || !analysis.enoughTissue || analysis.marblingPercent == null) {
    return {
      status: "no_meat",
      headline: "Couldn't find the steak",
      summary: "Fill the frame with the red of the meat. Skip the label and the tray.",
      rating: null,
      likelyGrade: null,
      degree: null,
      marblingPercent: null,
      color: null,
      cutNote: null,
      cookTip: null,
    };
  }
  if (analysis.marblingPercent > 35) {
    return {
      status: "mostly_fat",
      headline: "Mostly fat or glare in the frame",
      summary:
        "That's a fat cap, a label, or a reflection off the wrap. Point at the red face of the steak and try again.",
      rating: null,
      likelyGrade: null,
      degree: null,
      marblingPercent: Math.round(analysis.marblingPercent * 10) / 10,
      color: leanColor(analysis.meanLean),
      cutNote: null,
      cookTip: null,
    };
  }

  const degree = degreeFor(analysis.marblingPercent);
  const likelyGrade = GRADE_FOR_DEGREE[degree];
  const rating = RATING_FOR_GRADE[likelyGrade];
  const color = leanColor(analysis.meanLean);
  const leanCut = LEAN_CUTS.has(cut);

  return {
    status: "ok",
    headline: headlineFor(rating, leanCut),
    summary: summaryFor(likelyGrade, leanCut),
    rating,
    likelyGrade,
    degree,
    marblingPercent: Math.round(analysis.marblingPercent * 10) / 10,
    color,
    cutNote: cutNoteFor(cut, likelyGrade),
    cookTip: cookTipFor(likelyGrade, cut),
  };
}

function headlineFor(rating, leanCut) {
  if (rating >= 5) return "Excellent steak";
  if (rating === 4) return "Very good steak";
  if (rating === 3) return "Good steak";
  if (rating === 2) return leanCut ? "Lean, as expected for this cut" : "Lean steak";
  return "Very lean";
}

function summaryFor(grade, leanCut) {
  switch (grade) {
    case "Prime":
      return "Heavy marbling. Expect a rich, juicy steak that forgives a little overcooking.";
    case "Upper Choice":
      return "Plenty of marbling, more than typical Choice. Juicy and full-flavored.";
    case "Choice":
      return "Standard Choice marbling. A solid steak with good flavor when cooked to medium-rare or medium.";
    case "Select":
      return leanCut
        ? "Light marbling, which is normal here. Tenderness comes from the cut, not the fat."
        : "Light marbling. Less juicy and less forgiving. Fine for marinating or slicing thin.";
    default:
      return "Almost no marbling. Likely ungraded or sold as a store brand. Best marinated, braised, or ground.";
  }
}

function cutNoteFor(cut, grade) {
  switch (cut) {
    case "Ribeye":
      return "Ribeye lives on marbling. The more flecks across the eye, the better it eats.";
    case "Strip":
      return "Strip is firmer than ribeye, so marbling matters for juiciness. Look for an even scatter, not one fat seam.";
    case "Sirloin":
      return grade === "Prime" || grade === "Upper Choice"
        ? "Well-marbled sirloin is a real find at this price point."
        : "Sirloin runs lean by nature. Choice sirloin is a good everyday buy.";
    case "Tenderloin":
      return "Tenderloin is tender no matter the marbling. Don't pay a Prime premium for flecks you won't taste much.";
    case "T-bone":
      return "Judge the larger strip side. The small tenderloin side is tender either way.";
    case "Chuck":
      return grade === "Prime" || grade === "Upper Choice"
        ? "A well-marbled chuck eye can eat like a cheap ribeye."
        : "Chuck has big flavor but connective tissue. Braise it or grind it unless it's well marbled.";
    case "Round":
      return "Round is lean and chewy. Marinate it and slice it thin across the grain.";
    default:
      return "Marbling is the white flecks inside the red. More flecks, more flavor and juice.";
  }
}

function cookTipFor(grade, cut) {
  if (cut === "Chuck" && grade !== "Prime" && grade !== "Upper Choice") {
    return "Low and slow. Braise two to three hours, or grind for burgers.";
  }
  if (cut === "Round") {
    return "Marinate for a few hours, sear hot, pull at medium-rare, slice thin.";
  }
  switch (grade) {
    case "Prime":
      return "Salt it, sear it hot, and keep the seasoning simple. Medium-rare to medium is the sweet spot.";
    case "Upper Choice":
      return "Hot pan or grill, medium-rare to medium. Rest five minutes before cutting.";
    case "Choice":
      return "Cook to medium-rare. Past medium it starts to dry out.";
    case "Select":
      return "Marinate or salt an hour ahead, cook fast to medium-rare, and slice against the grain.";
    default:
      return "Marinate overnight or braise. It won't make a good quick-seared steak.";
  }
}

export function rankScans(scans) {
  const rated = scans.filter((scan) => scan.assessment && scan.assessment.rating != null);
  if (rated.length === 0) {
    return { bestMarbling: null, bestValue: null };
  }
  const bestMarbling = rated.reduce((best, scan) =>
    scan.assessment.marblingPercent > best.assessment.marblingPercent ? scan : best,
  );
  const priced = rated.filter((scan) => Number(scan.pricePerLb) > 0);
  const bestValue =
    priced.length === 0
      ? null
      : priced.reduce((best, scan) =>
          scan.assessment.rating / Number(scan.pricePerLb) >
          best.assessment.rating / Number(best.pricePerLb)
            ? scan
            : best,
        );
  return { bestMarbling, bestValue };
}

export function buildSampleSteak(fatRatio = 0.055, seedStart = 7) {
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
  let seed = seedStart;
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
    if (!lean[cy * width + cx]) continue;
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
