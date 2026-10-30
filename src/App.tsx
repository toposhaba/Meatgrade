import { useEffect, useMemo, useState } from "react";
import { BEEF_DEGREES, gradeSession, LAMB_STREAKING } from "../shared/grading.js";
import { captureFile, captureSample } from "./photo";
import {
  emptyDraft,
  formatWhen,
  loadSessions,
  saveSessions,
  type Draft,
  type SavedSession,
  type Species,
} from "./storage";

export function App() {
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [sessions, setSessions] = useState<SavedSession[]>([]);
  const [photoMessage, setPhotoMessage] = useState("");
  const [saveMessage, setSaveMessage] = useState("");
  const [degreeLocked, setDegreeLocked] = useState(false);

  useEffect(() => {
    setSessions(loadSessions());
  }, []);

  const decision = useMemo(
    () =>
      gradeSession({
        species: draft.species,
        maturity: draft.maturity,
        sexClass: draft.sexClass,
        darkCutter: draft.darkCutter,
        marblingDegree: draft.marblingDegree || null,
        fatThickness: draft.fatThickness,
        ribeyeArea: draft.ribeyeArea,
        hotCarcassWeight: draft.hotCarcassWeight,
        kphPercent: draft.kphPercent,
        colorScore: draft.colorScore,
        porkMarblingScore: draft.porkMarblingScore,
        flankStreaking: draft.flankStreaking || null,
      }),
    [draft],
  );

  const call = decision.qualityGrade ?? decision.plantCall;
  const canSave = draft.carcassId.trim().length > 0 && Boolean(call);

  function patch(partial: Partial<Draft>) {
    setSaveMessage("");
    setDraft((current) => ({ ...current, ...partial }));
  }

  function applyPhoto(photo: ReturnType<typeof captureSample>) {
    setPhotoMessage(
      photo.analysis.enoughTissue
        ? ""
        : "Not enough lean or fat in the frame. Move closer to the ribeye face.",
    );
    patch({
      photoDataUrl: photo.dataUrl,
      estimatedMarblingPercent: photo.analysis.marblingPercent,
      meatPixelPercent: photo.analysis.meatPixelPercent,
      enoughTissue: photo.analysis.enoughTissue,
      ...(draft.species === "Beef" && !degreeLocked && photo.analysis.suggestedDegree
        ? { marblingDegree: photo.analysis.suggestedDegree }
        : {}),
      ...(draft.species === "Pork" && photo.analysis.suggestedPorkColor
        ? {
            colorScore: String(photo.analysis.suggestedPorkColor),
            porkMarblingScore:
              photo.analysis.suggestedPorkMarbling == null
                ? draft.porkMarblingScore
                : String(photo.analysis.suggestedPorkMarbling),
          }
        : {}),
      ...(draft.species === "Lamb" && !degreeLocked && photo.analysis.suggestedDegree
        ? { flankStreaking: mapLambStreaking(photo.analysis.suggestedDegree) }
        : {}),
    });
  }

  async function onFile(file: File | undefined) {
    if (!file) {
      return;
    }
    try {
      applyPhoto(await captureFile(file));
    } catch (error) {
      setPhotoMessage(error instanceof Error ? error.message : "That photo could not be opened.");
    }
  }

  function onSave() {
    if (!draft.carcassId.trim()) {
      setSaveMessage("Add the carcass ID before saving.");
      return;
    }
    if (!call) {
      setSaveMessage("Finish the grade before saving.");
      return;
    }
    const next: SavedSession = {
      ...draft,
      carcassId: draft.carcassId.trim(),
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      qualityGrade: decision.qualityGrade,
      plantCall: decision.plantCall,
      yieldGrade: decision.yieldGrade,
      yieldScore: decision.yieldScore,
      requiresReview: decision.requiresReview,
      reviewReason: decision.reviewReason,
    };
    try {
      const stored = [next, ...sessions];
      saveSessions(stored);
      setSessions(stored);
    } catch {
      const withoutPhoto = [stripPhoto(next), ...sessions.map(stripPhoto)];
      try {
        saveSessions(withoutPhoto);
        setSessions(withoutPhoto);
        setSaveMessage("Saved without the photo. This device is out of storage room.");
        resetForm();
        return;
      } catch {
        setSaveMessage("This device could not store the grade.");
        return;
      }
    }
    setSaveMessage(`Saved ${next.carcassId}.`);
    resetForm();
  }

  function resetForm() {
    setDraft(emptyDraft());
    setDegreeLocked(false);
    setPhotoMessage("");
  }

  function removeSession(id: string) {
    const stored = sessions.filter((session) => session.id !== id);
    saveSessions(stored);
    setSessions(stored);
  }

  return (
    <div className="app">
      <header className="top">
        <div>
          <p className="eyebrow">Floor sheet</p>
          <h1>Meatgrade</h1>
        </div>
        <p className="lede">
          The camera suggests marbling. You confirm the degree. Beef quality follows the carcass
          beef standard for each whole maturity group. A USDA grader still assigns the official grade.
        </p>
      </header>

      <div className="layout">
        <section className="sheet" aria-label="Grade a carcass">
          <div className="species" role="group" aria-label="Species">
            {(["Beef", "Pork", "Lamb"] as Species[]).map((species) => (
              <button
                key={species}
                type="button"
                aria-pressed={draft.species === species}
                onClick={() => {
                  setDegreeLocked(false);
                  patch({ species });
                }}
              >
                {species}
              </button>
            ))}
          </div>

          <label>
            Carcass ID
            <input
              value={draft.carcassId}
              onChange={(event) => patch({ carcassId: event.target.value })}
              autoComplete="off"
              maxLength={40}
              placeholder="Lot or carcass number"
            />
          </label>

          <div className="photo-box">
            {draft.photoDataUrl ? (
              <img src={draft.photoDataUrl} alt="Ribeye or cut used for this grade" />
            ) : (
              <p>Photograph the ribeye face, between the 12th and 13th ribs for beef.</p>
            )}
            <div className="photo-actions">
              <label className="file">
                Take photo
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={(event) => {
                    void onFile(event.target.files?.[0]);
                    event.target.value = "";
                  }}
                />
              </label>
              <button
                type="button"
                className="secondary"
                onClick={() => applyPhoto(captureSample(0.055))}
              >
                Load sample cut
              </button>
            </div>
            {photoMessage ? (
              <p className="alert" role="alert">
                {photoMessage}
              </p>
            ) : null}
            {draft.estimatedMarblingPercent != null ? (
              <p className="hint">
                Camera estimate {draft.estimatedMarblingPercent.toFixed(1)}% fat in the meat pixels.
                That suggestion is not a USDA measurement.
              </p>
            ) : null}
          </div>

          {draft.species === "Beef" ? <BeefFields draft={draft} patch={patch} lockDegree={() => setDegreeLocked(true)} /> : null}
          {draft.species === "Pork" ? <PorkFields draft={draft} patch={patch} /> : null}
          {draft.species === "Lamb" ? (
            <LambFields draft={draft} patch={patch} lockDegree={() => setDegreeLocked(true)} />
          ) : null}

          <label>
            Notes
            <textarea
              value={draft.graderNotes}
              onChange={(event) => patch({ graderNotes: event.target.value })}
              rows={2}
              maxLength={2000}
            />
          </label>

          <div className="sticky-call">
            <GradeReadout decision={decision} />
            <div className="save-row">
              <button type="button" className="primary" onClick={onSave} disabled={!canSave}>
                Save grade
              </button>
              <button
                type="button"
                className="secondary"
                onClick={() => {
                  resetForm();
                  setSaveMessage("");
                }}
              >
                Clear
              </button>
            </div>
            {saveMessage ? <p className="hint">{saveMessage}</p> : null}
            {!draft.carcassId.trim() ? <p className="hint">Add the carcass ID to save.</p> : null}
          </div>
        </section>

        <section className="history" aria-label="Saved grades">
          <h2>On this device</h2>
          {sessions.length === 0 ? (
            <p className="hint">No carcasses graded on this device yet.</p>
          ) : (
            <ul>
              {sessions.map((session) => (
                <li key={session.id}>
                  <article>
                    <header>
                      <strong>{session.carcassId}</strong>
                      <span>{formatWhen(session.createdAt)}</span>
                    </header>
                    <p className="call">{session.qualityGrade ?? session.plantCall}</p>
                    <p className="meta">
                      {session.species}
                      {session.species === "Beef"
                        ? ` · ${session.marblingDegree} · ${session.maturity}`
                        : ""}
                      {session.yieldGrade != null ? ` · Yield ${session.yieldGrade}` : ""}
                      {session.requiresReview ? " · Review" : ""}
                    </p>
                    {session.reviewReason ? <p className="hint">{session.reviewReason}</p> : null}
                    <button type="button" className="text" onClick={() => removeSession(session.id)}>
                      Remove
                    </button>
                  </article>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

function BeefFields({
  draft,
  patch,
  lockDegree,
}: {
  draft: Draft;
  patch: (partial: Partial<Draft>) => void;
  lockDegree: () => void;
}) {
  return (
    <>
      <div className="grid-2">
        <label>
          Maturity
          <select
            value={draft.maturity}
            onChange={(event) => patch({ maturity: event.target.value as Draft["maturity"] })}
          >
            {["A", "B", "C", "D", "E"].map((group) => (
              <option key={group} value={group}>
                {group}
              </option>
            ))}
          </select>
        </label>
        <label>
          Sex class
          <select
            value={draft.sexClass}
            onChange={(event) => patch({ sexClass: event.target.value as Draft["sexClass"] })}
          >
            {["Steer", "Heifer", "Cow", "Bullock"].map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label>
        Marbling degree
        <select
          value={draft.marblingDegree}
          onChange={(event) => {
            lockDegree();
            patch({ marblingDegree: event.target.value });
          }}
        >
          <option value="">Confirm a degree</option>
          {BEEF_DEGREES.map((degree) => (
            <option key={degree} value={degree}>
              {degree}
            </option>
          ))}
        </select>
      </label>
      <label className="check">
        <input
          type="checkbox"
          checked={draft.darkCutter}
          onChange={(event) => patch({ darkCutter: event.target.checked })}
        />
        Dark cutter
      </label>
      <fieldset>
        <legend>Yield grade</legend>
        <div className="grid-2">
          <NumberField
            label="Fat thickness (in)"
            value={draft.fatThickness}
            onChange={(fatThickness) => patch({ fatThickness })}
            step="0.1"
          />
          <NumberField
            label="Ribeye area (sq in)"
            value={draft.ribeyeArea}
            onChange={(ribeyeArea) => patch({ ribeyeArea })}
            step="0.1"
          />
          <NumberField
            label="Hot carcass weight (lb)"
            value={draft.hotCarcassWeight}
            onChange={(hotCarcassWeight) => patch({ hotCarcassWeight })}
            step="1"
          />
          <NumberField
            label="Kidney, pelvic, heart fat (%)"
            value={draft.kphPercent}
            onChange={(kphPercent) => patch({ kphPercent })}
            step="0.1"
          />
        </div>
      </fieldset>
    </>
  );
}

function PorkFields({
  draft,
  patch,
}: {
  draft: Draft;
  patch: (partial: Partial<Draft>) => void;
}) {
  return (
    <div className="grid-2">
      <NumberField
        label="Color score (1–6)"
        value={draft.colorScore}
        onChange={(colorScore) => patch({ colorScore })}
        step="1"
      />
      <NumberField
        label="Marbling score (1–10)"
        value={draft.porkMarblingScore}
        onChange={(porkMarblingScore) => patch({ porkMarblingScore })}
        step="1"
      />
    </div>
  );
}

function LambFields({
  draft,
  patch,
  lockDegree,
}: {
  draft: Draft;
  patch: (partial: Partial<Draft>) => void;
  lockDegree: () => void;
}) {
  return (
    <label>
      Flank streaking
      <select
        value={draft.flankStreaking}
        onChange={(event) => {
          lockDegree();
          patch({ flankStreaking: event.target.value });
        }}
      >
        <option value="">Confirm streaking</option>
        {LAMB_STREAKING.map((degree) => (
          <option key={degree} value={degree}>
            {degree}
          </option>
        ))}
      </select>
    </label>
  );
}

function NumberField({
  label,
  value,
  onChange,
  step,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  step: string;
}) {
  return (
    <label>
      {label}
      <input
        inputMode="decimal"
        value={value}
        step={step}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function GradeReadout({
  decision,
}: {
  decision: ReturnType<typeof gradeSession>;
}) {
  const call = decision.qualityGrade ?? decision.plantCall;
  const waiting = !call && decision.reviewReason.startsWith("Enter");
  return (
    <div className="readout" aria-live="polite">
      <p className="eyebrow">{decision.qualityGrade ? "Quality grade" : "Plant sort"}</p>
      <p className={`grade ${decision.requiresReview && !waiting ? "review" : ""}`}>{call ?? "—"}</p>
      {decision.yieldGrade != null ? (
        <p>
          Yield grade {decision.yieldGrade}
          {decision.yieldScore != null ? ` from ${decision.yieldScore.toFixed(2)}` : ""}. The
          standard drops the fraction.
        </p>
      ) : null}
      {decision.requiresReview ? (
        <p className={waiting ? "hint" : "alert"}>{decision.reviewReason}</p>
      ) : null}
    </div>
  );
}

function mapLambStreaking(degree: string) {
  if (LAMB_STREAKING.includes(degree)) {
    return degree;
  }
  if (degree === "Moderately Abundant" || degree === "Abundant" || degree === "Very Abundant") {
    return "Slightly Abundant";
  }
  return "";
}

function stripPhoto(session: SavedSession): SavedSession {
  return { ...session, photoDataUrl: null };
}
