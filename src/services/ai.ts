import { GoogleGenAI } from "@google/genai";

const API_KEY = process.env.GEMINI_API_KEY;

export const ai = API_KEY ? new GoogleGenAI({ apiKey: API_KEY }) : null;

export async function generateNursingNote(data: {
  patient: any,
  vitals: any[],
  io: any[],
  alerts: any[]
}) {
  if (!ai) return "AI Service not configured. Please add GEMINI_API_KEY.";

  const prompt = `
    Generate a professional nursing note for the following patient data:
    Patient: ${data.patient.name}, ${data.patient.age}y/o ${data.patient.gender}. Diagnosis: ${data.patient.diagnosis}.
    Latest Vitals: ${JSON.stringify(data.vitals[0])}
    Trends/Alerts: ${data.alerts.map(a => a.reason).join(", ")}
    Fluid Balance: ${JSON.stringify(data.io)}

    Format the note using standard clinical documentation style (SOAP or focused note).
    Include a disclaimer: "DRAFT - Requires nurse review and approval."
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });
    return response.text || "Failed to generate note.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Error generating AI note. Please draft manually.";
  }
}

export async function checkNoteCompleteness(note: string) {
  if (!ai) return [];

  const prompt = `
    Analyze the following nursing note for completeness and quality.
    Note: ${note}

    Identify if any of the following are missing or could be improved:
    - Pain score
    - Mental status
    - Response to interventions
    - Clarity on output
    - Specificity of observations

    Return a JSON array of strings, each being a short suggestion or "All good".
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: { responseMimeType: "application/json" }
    });
    const text = response.text || "[]";
    return JSON.parse(text);
  } catch (error) {
    return ["Note review unavailable."];
  }
}
