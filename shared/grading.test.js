import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  analyzeRgba,
  beefYield,
  buildSampleCut,
  gradeSession,
  suggestDegree,
} from "./grading.js";

const lwcCopy = new URL(
  "../force-app/main/default/lwc/meatGradeCapture/grading.js",
  import.meta.url,
);

describe("camera suggestion", () => {
  it("maps marbling percent to a degree band", () => {
    expect(suggestDegree(1.5)).toBe("Practically Devoid");
    expect(suggestDegree(2.3)).toBe("Traces");
    expect(suggestDegree(4)).toBe("Slight");
    expect(suggestDegree(5.5)).toBe("Small");
    expect(suggestDegree(7)).toBe("Modest");
    expect(suggestDegree(8)).toBe("Moderate");
    expect(suggestDegree(11)).toBe("Slightly Abundant");
    expect(suggestDegree(13)).toBe("Moderately Abundant");
    expect(suggestDegree(16)).toBe("Abundant");
  });

  it("reads a synthetic ribeye as Small marbling", () => {
    const sample = buildSampleCut(0.055);
    const analysis = analyzeRgba(sample.data);
    expect(analysis.enoughTissue).toBe(true);
    expect(analysis.marblingPercent).toBeGreaterThan(5);
    expect(analysis.marblingPercent).toBeLessThan(6);
    expect(analysis.suggestedDegree).toBe("Small");
  });

  it("ignores a dark frame", () => {
    const data = new Uint8ClampedArray(40 * 40 * 4);
    const analysis = analyzeRgba(data);
    expect(analysis.enoughTissue).toBe(false);
    expect(analysis.suggestedDegree).toBeNull();
  });
});

describe("beef quality chart", () => {
  it("grades A maturity from the standard minimums", () => {
    expect(beef("Slightly Abundant", "A").qualityGrade).toBe("Prime");
    expect(beef("Moderate", "A").qualityGrade).toBe("Choice");
    expect(beef("Small", "A").qualityGrade).toBe("Choice");
    expect(beef("Slight", "A").qualityGrade).toBe("Select");
    expect(beef("Traces", "A").qualityGrade).toBe("Standard");
  });

  it("keeps Select in A maturity and raises the Choice line for B", () => {
    expect(beef("Slight", "B").qualityGrade).toBe("Standard");
    expect(beef("Small", "B").qualityGrade).toBe("Standard");
    expect(beef("Modest", "B").qualityGrade).toBe("Choice");
    expect(beef("Slightly Abundant", "B").qualityGrade).toBe("Prime");
    expect(beef("Slightly Abundant", "B").requiresReview).toBe(true);
  });

  it("moves mature carcasses onto Commercial and the lower grades", () => {
    expect(beef("Small", "C").qualityGrade).toBe("Commercial");
    expect(beef("Traces", "C").qualityGrade).toBe("Utility");
    expect(beef("Moderate", "E").qualityGrade).toBe("Commercial");
    expect(beef("Slight", "E").qualityGrade).toBe("Utility");
    expect(beef("Practically Devoid", "E").qualityGrade).toBe("Cutter");
    expect(beef("Modest", "D").requiresReview).toBe(true);
  });

  it("blocks Prime on cow beef and quality grades on older bullocks", () => {
    const cow = gradeSession({
      species: "Beef",
      marblingDegree: "Slightly Abundant",
      maturity: "A",
      sexClass: "Cow",
    });
    expect(cow.qualityGrade).toBe("Choice");
    expect(cow.reviewReason).toContain("Cow beef is not eligible for Prime");

    const bullock = gradeSession({
      species: "Beef",
      marblingDegree: "Slightly Abundant",
      maturity: "B",
      sexClass: "Bullock",
    });
    expect(bullock.qualityGrade).toBeNull();
    expect(bullock.requiresReview).toBe(true);
  });

  it("lowers Prime, Choice, and Select a full grade for a dark cutter", () => {
    expect(beef("Slightly Abundant", "A", { darkCutter: true }).qualityGrade).toBe("Choice");
    expect(beef("Small", "A", { darkCutter: true }).qualityGrade).toBe("Select");
    expect(beef("Modest", "B", { darkCutter: true }).qualityGrade).toBe("Standard");
    expect(beef("Slight", "A", { darkCutter: true }).qualityGrade).toBe("Standard");
    expect(beef("Traces", "A", { darkCutter: true }).qualityGrade).toBe("Standard");
    expect(beef("Traces", "A", { darkCutter: true }).requiresReview).toBe(true);
  });
});

describe("yield grade", () => {
  it("drops the fraction on the NDSU carcass example", () => {
    const result = beefYield({
      fatThickness: 0.4,
      kphPercent: 2.5,
      hotCarcassWeight: 750,
      ribeyeArea: 12.8,
    });
    expect(result.yieldScore).toBe(2.75);
    expect(result.yieldGrade).toBe(2);
  });

  it("keeps a 3.38 score in yield grade 3", () => {
    const result = beefYield({
      fatThickness: 0.6,
      kphPercent: 2.5,
      hotCarcassWeight: 800,
      ribeyeArea: 13,
    });
    expect(result.yieldScore).toBe(3.38);
    expect(result.yieldGrade).toBe(3);
  });

  it("asks for the missing yield factors", () => {
    const result = gradeSession({
      species: "Beef",
      marblingDegree: "Small",
      maturity: "A",
      sexClass: "Steer",
      fatThickness: 0.4,
    });
    expect(result.yieldGrade).toBeNull();
    expect(result.reviewReason).toContain("Yield grade needs");
  });
});

describe("pork and lamb sorts", () => {
  it("prefers pork in the middle colors with some marbling", () => {
    expect(
      gradeSession({ species: "Pork", colorScore: 4, porkMarblingScore: 3 }).plantCall,
    ).toBe("Preferred");
    expect(
      gradeSession({ species: "Pork", colorScore: 1, porkMarblingScore: 3 }).plantCall,
    ).toBe("Review");
  });

  it("sorts lamb from flank streaking", () => {
    expect(gradeSession({ species: "Lamb", flankStreaking: "Modest" }).plantCall).toBe(
      "Prime sort",
    );
    expect(gradeSession({ species: "Lamb", flankStreaking: "Small" }).plantCall).toBe(
      "Choice sort",
    );
    expect(gradeSession({ species: "Lamb", flankStreaking: "Slight" }).plantCall).toBe(
      "Good sort",
    );
    expect(
      gradeSession({ species: "Lamb", flankStreaking: "Traces" }).plantCall,
    ).toBe("Utility sort");
  });
});

describe("package copy", () => {
  it("keeps the Lightning module on the same chart", () => {
    const source = readFileSync(new URL("./grading.js", import.meta.url), "utf8");
    const copy = readFileSync(lwcCopy, "utf8");
    expect(copy).toBe(source);
  });
});

function beef(degree, maturity, extra = {}) {
  return gradeSession({
    species: "Beef",
    marblingDegree: degree,
    maturity,
    sexClass: "Steer",
    ...extra,
  });
}
