import { LightningElement } from "lwc";
import saveSession from "@salesforce/apex/GradingSessionService.saveSession";
import { BEEF_DEGREES, LAMB_STREAKING, analyzeRgba, gradeSession } from "./grading";

export default class MeatGradeCapture extends LightningElement {
  species = "Beef";
  carcassId = "";
  maturity = "A";
  sexClass = "Steer";
  darkCutter = false;
  marblingDegree = "";
  fatThickness = "";
  ribeyeArea = "";
  hotCarcassWeight = "";
  kphPercent = "";
  colorScore = "";
  porkMarblingScore = "";
  flankStreaking = "";
  notes = "";
  estimatedMarblingPercent = null;
  photoCaptured = false;
  enoughTissue = true;
  degreeLocked = false;
  decision = gradeSession({ species: "Beef", maturity: "A", sexClass: "Steer" });
  error = "";
  savedLabel = "";

  get isBeef() {
    return this.species === "Beef";
  }

  get isPork() {
    return this.species === "Pork";
  }

  get isLamb() {
    return this.species === "Lamb";
  }

  get beefVariant() {
    return this.species === "Beef" ? "brand" : "neutral";
  }

  get porkVariant() {
    return this.species === "Pork" ? "brand" : "neutral";
  }

  get lambVariant() {
    return this.species === "Lamb" ? "brand" : "neutral";
  }

  get requiresReview() {
    return Boolean(this.decision.requiresReview);
  }

  get degreeOptions() {
    return BEEF_DEGREES.map((value) => ({ value, label: value }));
  }

  get streakingOptions() {
    return LAMB_STREAKING.map((value) => ({ value, label: value }));
  }

  get maturityOptions() {
    return ["A", "B", "C", "D", "E"].map((value) => ({ value, label: value }));
  }

  get sexOptions() {
    return ["Steer", "Heifer", "Cow", "Bullock"].map((value) => ({ value, label: value }));
  }

  get gradeCall() {
    return this.decision.qualityGrade || this.decision.plantCall || "—";
  }

  get estimateLabel() {
    if (this.estimatedMarblingPercent == null) {
      return "";
    }
    return `Camera estimate ${Number(this.estimatedMarblingPercent).toFixed(1)}% fat in the meat pixels.`;
  }

  get yieldLabel() {
    if (this.decision.yieldGrade == null) {
      return "";
    }
    const score =
      this.decision.yieldScore == null ? "" : ` from ${Number(this.decision.yieldScore).toFixed(2)}`;
    return `Yield grade ${this.decision.yieldGrade}${score}. The standard drops the fraction.`;
  }

  handleSpecies(event) {
    this.species = event.currentTarget.dataset.species;
    this.degreeLocked = false;
    this.refresh();
  }

  handleInput(event) {
    const field = event.target.dataset.field;
    this[field] = event.target.type === "checkbox" ? event.target.checked : event.target.value;
    if (field === "marblingDegree" || field === "flankStreaking") {
      this.degreeLocked = true;
    }
    this.refresh();
  }

  handleFile(event) {
    const file = event.target.files && event.target.files[0];
    event.target.value = "";
    if (!file) {
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const image = new Image();
      image.onload = () => {
        const canvas = this.template.querySelector("canvas");
        const scale = Math.min(1, 480 / Math.max(image.width, image.height));
        canvas.width = Math.max(1, Math.round(image.width * scale));
        canvas.height = Math.max(1, Math.round(image.height * scale));
        const context = canvas.getContext("2d", { willReadFrequently: true });
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        const analysis = analyzeRgba(context.getImageData(0, 0, canvas.width, canvas.height).data);
        this.estimatedMarblingPercent = analysis.marblingPercent;
        this.enoughTissue = analysis.enoughTissue;
        this.photoCaptured = true;
        if (!analysis.enoughTissue) {
          this.error = "Not enough lean or fat in the frame. Move closer to the ribeye face.";
        } else {
          this.error = "";
        }
        if (this.species === "Beef" && analysis.suggestedDegree && !this.degreeLocked) {
          this.marblingDegree = analysis.suggestedDegree;
        }
        if (this.species === "Pork") {
          if (analysis.suggestedPorkColor) {
            this.colorScore = String(analysis.suggestedPorkColor);
          }
          if (analysis.suggestedPorkMarbling) {
            this.porkMarblingScore = String(analysis.suggestedPorkMarbling);
          }
        }
        if (this.species === "Lamb" && analysis.suggestedDegree && !this.degreeLocked) {
          this.flankStreaking = LAMB_STREAKING.includes(analysis.suggestedDegree)
            ? analysis.suggestedDegree
            : "Slightly Abundant";
        }
        this.refresh();
      };
      image.src = reader.result;
    };
    reader.readAsDataURL(file);
  }

  async handleSave() {
    this.error = "";
    this.savedLabel = "";
    if (!this.carcassId.trim()) {
      this.error = "Add the carcass ID before saving.";
      return;
    }
    try {
      const saved = await saveSession({
        draft: {
          Species__c: this.species,
          Carcass_Id__c: this.carcassId.trim(),
          Maturity__c: this.maturity,
          Sex_Class__c: this.sexClass,
          Dark_Cutter__c: this.darkCutter,
          Marbling_Degree__c: this.marblingDegree,
          Estimated_Marbling_Percent__c: this.estimatedMarblingPercent,
          Fat_Thickness_In__c: this.fatThickness,
          Ribeye_Area_Sq_In__c: this.ribeyeArea,
          Hot_Carcass_Weight_Lb__c: this.hotCarcassWeight,
          Kidney_Pelvic_Heart_Pct__c: this.kphPercent,
          Color_Score__c: this.colorScore,
          Pork_Marbling_Score__c: this.porkMarblingScore,
          Flank_Streaking__c: this.flankStreaking,
          Photo_Captured__c: this.photoCaptured,
          Grader_Notes__c: this.notes,
        },
      });
      this.savedLabel = `${saved.Carcass_Id__c} saved as ${saved.Quality_Grade__c || saved.Plant_Call__c}.`;
    } catch (error) {
      this.error = error?.body?.message || "The grade could not be saved.";
    }
  }

  refresh() {
    this.decision = gradeSession({
      species: this.species,
      maturity: this.maturity,
      sexClass: this.sexClass,
      darkCutter: this.darkCutter,
      marblingDegree: this.marblingDegree,
      fatThickness: this.fatThickness,
      ribeyeArea: this.ribeyeArea,
      hotCarcassWeight: this.hotCarcassWeight,
      kphPercent: this.kphPercent,
      colorScore: this.colorScore,
      porkMarblingScore: this.porkMarblingScore,
      flankStreaking: this.flankStreaking,
    });
  }
}
