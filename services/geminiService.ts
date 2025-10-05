import { GoogleGenAI, Type } from "@google/genai";
import { Campaign, CampaignPhase, Honeydoc, LureTemplate, Artifact, Persona, SmsLureTemplate, DetectionRule, SimulatedEventLog, AAR, SafetyCheckResult } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const model = 'gemini-2.5-flash';

const generateAndParseJSON = async <T,>(prompt: string, schema: any): Promise<T> => {
    const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: schema,
        },
    });
    
    try {
        const jsonText = response.text.trim();
        return JSON.parse(jsonText) as T;
    } catch (e) {
        console.error("Failed to parse JSON response:", response.text);
        throw new Error("Could not parse AI model's JSON response.");
    }
};

export const buildPersona = async (targetDescription: string): Promise<Persona> => {
    const prompt = `You are an intelligence analyst producing a synthetic adversary persona for *authorized defensive simulation only*. Input: "${targetDescription}". Return strict JSON only with the keys specified in the schema. Keep all fields high-level and non-actionable. Use concise values. Output only valid JSON.`;
    
    const schema = {
        type: Type.OBJECT,
        properties: {
            name: { type: Type.STRING, description: "A plausible persona handle, non-identifying" },
            origin_country: { type: Type.STRING, description: "A country or region" },
            motivation: { type: Type.STRING, description: "Brief motivation: espionage/financial/ideological/social engineering" },
            primary_channels: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
            },
            linguistic_style: {
                type: Type.OBJECT,
                properties: {
                    tone: { type: Type.STRING, description: "e.g., urgent, formal, casual" },
                    common_phrases: { type: Type.ARRAY, items: { type: Type.STRING } },
                    typical_sentence_length: { type: Type.STRING, description: "short|medium|long" },
                },
                required: ["tone", "common_phrases", "typical_sentence_length"]
            },
            pretext_templates: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        id: { type: Type.STRING },
                        description: { type: Type.STRING, description: "one-sentence pretext summary" }
                    },
                    required: ["id", "description"]
                }
            },
            likely_tools_high_level: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
            },
            opsec_notes: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
            }
        },
        required: [
            "name", "origin_country", "motivation", "primary_channels", 
            "linguistic_style", "pretext_templates", "likely_tools_high_level", "opsec_notes"
        ],
    };

    return generateAndParseJSON<Persona>(prompt, schema);
};


export const composeCampaign = async (persona: Persona, targetSummary: string): Promise<Campaign> => {
    const prompt = `You are a defensive campaign planner. Given this adversary persona: ${JSON.stringify(persona, null, 2)} and this target summary: "${targetSummary}", create a 3-5 phase campaign plan. The phases should be high-level and safe for simulation (e.g., Reconnaissance, Engagement, etc.). Return a JSON object with a single key "phases". Each phase in the array should match the provided schema. Keep descriptions concise and non-actionable.`;
    const schema = {
        type: Type.OBJECT,
        properties: {
            phases: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        phase_id: { type: Type.STRING },
                        phase_name: { type: Type.STRING },
                        objective: { type: Type.STRING },
                        methods_high_level: {
                            type: Type.ARRAY,
                            items: { type: Type.STRING }
                        },
                        duration_days: { type: Type.INTEGER },
                        expected_outcome: { type: Type.STRING }
                    },
                    required: ["phase_id", "phase_name", "objective", "methods_high_level", "duration_days", "expected_outcome"]
                }
            }
        },
        required: ["phases"]
    };
    return generateAndParseJSON<Campaign>(prompt, schema);
};

export const performSafetyCheck = async (consentStatus: boolean): Promise<SafetyCheckResult> => {
    const prompt = `You are a safety officer for an authorized defensive simulation. Your role is to confirm that safety protocols are in place. The user's consent status is: ${consentStatus}. 
    
    Generate a JSON report according to the schema. 
    - The boolean flags 'authorized_only', 'sandbox_required', and 'no_exploit_code' must always be true.
    - For the 'consent_recorded' field, since consent is granted (true), generate a unique, non-guessable consent_id string (e.g., "sim-consent-a1b2c3d4-e5f6-7890-g1h2-i3j4k5l6m7n8").
    
    Output only the valid JSON object.`;

    const schema = {
        type: Type.OBJECT,
        properties: {
            safety: {
                type: Type.OBJECT,
                properties: {
                    authorized_only: { type: Type.BOOLEAN },
                    sandbox_required: { type: Type.BOOLEAN },
                    no_exploit_code: { type: Type.BOOLEAN },
                    consent_recorded: { type: Type.STRING }
                },
                required: ["authorized_only", "sandbox_required", "no_exploit_code", "consent_recorded"]
            }
        },
        required: ["safety"]
    };

    return generateAndParseJSON<SafetyCheckResult>(prompt, schema);
};

export const generateLure = async (persona: Persona, phase: CampaignPhase, language: string, count: number): Promise<LureTemplate[]> => {
    const prompt = `You are a red-team content writer generating *training* phishing email templates for authorized exercises only.
Input persona: ${JSON.stringify(persona, null, 2)}
Campaign phase: "${phase.phase_name}" with objective "${phase.objective}"
Language: "${language}"

Return JSON with a single key "templates" which is an array of ${count} distinct template objects. Each object must conform to the provided schema. Ensure the body includes a '{{TOKEN}}' placeholder. Output JSON only.`;

    const templateSchema = {
        type: Type.OBJECT,
        properties: {
            template_id: { type: Type.STRING },
            subject: { type: Type.STRING },
            preheader: { type: Type.STRING },
            body_plaintext: { type: Type.STRING, description: "email body with {{TOKEN}} placeholder where unique tracking token should be embedded" },
            call_to_action_text: { type: Type.STRING },
            persuasion_vectors: { type: Type.ARRAY, items: { type: Type.STRING } },
            translation_notes: { type: Type.STRING },
            safety_notes: { type: Type.STRING, description: "This template is for sandbox training only." },
        },
        required: ["template_id", "subject", "preheader", "body_plaintext", "call_to_action_text", "persuasion_vectors", "translation_notes", "safety_notes"]
    };

    const schema = {
        type: Type.OBJECT,
        properties: {
            templates: {
                type: Type.ARRAY,
                items: templateSchema
            }
        },
        required: ["templates"]
    };

    const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: schema,
            temperature: 0.6,
        },
    });

    try {
        const jsonText = response.text.trim();
        const result = JSON.parse(jsonText) as { templates: LureTemplate[] };
        if (!result.templates || !Array.isArray(result.templates)) {
            throw new Error("Invalid response structure from AI model for lure templates.");
        }
        return result.templates;
    } catch (e) {
        console.error("Failed to parse JSON response for lure templates:", response.text);
        throw new Error("Could not parse AI model's JSON response for lure templates.");
    }
};

export const generateSmsLure = async (persona: Persona, phase: CampaignPhase, language: string, count: number): Promise<SmsLureTemplate[]> => {
    const prompt = `You are a red-team content writer generating *training* SMS/text message lure templates for authorized exercises only.
Input persona: ${JSON.stringify(persona, null, 2)}
Campaign phase: "${phase.phase_name}" with objective "${phase.objective}"
Language: "${language}"

Generate ${count} concise SMS lure variants for training. The body must be short and suitable for an SMS message.
Insert a '{{TOKEN}}' placeholder for a tracking link/URL.
Return JSON with a single key "templates" which is an array of ${count} distinct template objects. Each object must conform to the provided schema. Output JSON only.`;

    const templateSchema = {
        type: Type.OBJECT,
        properties: {
            template_id: { type: Type.STRING },
            body_short: { type: Type.STRING, description: "SMS body with {{TOKEN}} placeholder for tracking link." },
            persuasion_vectors: { type: Type.ARRAY, items: { type: Type.STRING } },
            safety_notes: { type: Type.STRING, description: "This template is for sandbox training only." },
        },
        required: ["template_id", "body_short", "persuasion_vectors", "safety_notes"]
    };

    const schema = {
        type: Type.OBJECT,
        properties: {
            templates: {
                type: Type.ARRAY,
                items: templateSchema
            }
        },
        required: ["templates"]
    };

    const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: schema,
            temperature: 0.6,
        },
    });

    try {
        const jsonText = response.text.trim();
        const result = JSON.parse(jsonText) as { templates: SmsLureTemplate[] };
        if (!result.templates || !Array.isArray(result.templates)) {
            throw new Error("Invalid response structure from AI model for SMS lure templates.");
        }
        return result.templates;
    } catch (e) {
        console.error("Failed to parse JSON response for SMS lure templates:", response.text);
        throw new Error("Could not parse AI model's JSON response for SMS lure templates.");
    }
};


export const createHoneydoc = async (persona: Persona, phase: CampaignPhase): Promise<Honeydoc> => {
    const prompt = `Create a benign honey document used for defensive deception. 
Input persona: ${JSON.stringify(persona, null, 2)}
Intent (from campaign phase "${phase.phase_name}"): "${phase.objective}"

Return a single JSON object that strictly follows the provided schema. The body_text must contain a visible {{TOKEN}} link placeholder.`;

    const schema = {
        type: Type.OBJECT,
        properties: {
            doc_id: { type: Type.STRING },
            title: { type: Type.STRING, description: "A plausible document title" },
            author: { type: Type.STRING, description: "A plausible author string" },
            body_text: { type: Type.STRING, description: "Realistic but non-sensitive internal memo text with a visible {{TOKEN}} link placeholder" },
            metadata: {
                type: Type.OBJECT,
                properties: {
                    last_modified_hint: { type: Type.STRING },
                    department: { type: Type.STRING }
                },
                required: ["last_modified_hint", "department"]
            },
            metadata_notes: { type: Type.STRING, description: "Explain why these metadata fields increase plausibility" },
            safety_notes: { type: Type.STRING, description: "For sandbox only; do not deploy externally." }
        },
        required: ["doc_id", "title", "author", "body_text", "metadata", "metadata_notes", "safety_notes"],
    };
    return generateAndParseJSON<Honeydoc>(prompt, schema);
};

export const simulateHoneydocAccess = async (honeydoc: Honeydoc): Promise<SimulatedEventLog> => {
    const prompt = `This endpoint simulates a SAFE post-exploitation sequence following a honeydoc access in a sandbox.
Input Honeydoc: { "doc_id":"${honeydoc.doc_id}", "title": "${honeydoc.title}" }.
Generate a simulated log entry for an attacker accessing this document.
The simulation must include a series of *safe, non-executable, illustrative* command-line actions in the 'attack_steps' array.
These commands are for logging and detection simulation only and must not be real exploit code. Use placeholders like <TARGET_IP> or C:\\Users\\...
Each step must have a command, a description of the attacker's intent, and a relevant MITRE ATT&CK ID.
Return a single JSON object that strictly follows the schema. Output JSON only.`;

    const schema = {
        type: Type.OBJECT,
        properties: {
            event_id: { type: Type.STRING },
            timestamp: { type: Type.STRING, description: "ISO 8601 format" },
            doc_id: { type: Type.STRING },
            event_type: { type: Type.STRING, description: "e.g., 'honeydoc_exploitation_simulation'" },
            user_agent: { type: Type.STRING, description: "A simulated but plausible User-Agent string" },
            ip: { type: Type.STRING, description: "A simulated external IP address" },
            attack_steps: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        command: { type: Type.STRING, description: "A safe, simulated command-line entry. Use placeholders." },
                        description: { type: Type.STRING, description: "Explanation of what the command does from an attacker's perspective." },
                        technique_id: { type: Type.STRING, description: "Relevant MITRE ATT&CK technique ID, e.g., T1059.003" }
                    },
                    required: ["command", "description", "technique_id"]
                }
            },
            notes: { type: Type.STRING, description: "sandbox-only simulated event summary" },
        },
        required: ["event_id", "timestamp", "doc_id", "event_type", "user_agent", "ip", "attack_steps", "notes"],
    };
    return generateAndParseJSON<SimulatedEventLog>(prompt, schema);
};

export const mapDetections = async (campaign: Campaign, artifacts: Artifact[]): Promise<DetectionRule[]> => {
    const prompt = `You are a detection engineer producing high-level detection rules for defensive use.
Input campaign: ${JSON.stringify(campaign, null, 2)}
Input artifacts: ${JSON.stringify(artifacts, null, 2)}
Return JSON with a key "rules": an array of up to 7 items. Each item must follow the schema.
Keep logic high-level—no exploitation steps. Output JSON only.`;

    const ruleSchema = {
        type: Type.OBJECT,
        properties: {
            id: { type: Type.STRING },
            name: { type: Type.STRING },
            description: { type: Type.STRING },
            detection_logic_high_level: { type: Type.STRING },
            suggested_data_sources: { type: Type.ARRAY, items: { type: Type.STRING } },
            confidence: { type: Type.STRING },
            mapped_artifacts: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ["id", "name", "description", "detection_logic_high_level", "suggested_data_sources", "confidence", "mapped_artifacts"]
    };

    const schema = {
        type: Type.OBJECT,
        properties: {
            rules: {
                type: Type.ARRAY,
                items: ruleSchema
            }
        },
        required: ["rules"]
    };

    try {
        const result = await generateAndParseJSON<{ rules: DetectionRule[] }>(prompt, schema);
        if (!result.rules || !Array.isArray(result.rules)) {
            throw new Error("Invalid response structure from AI model for detection rules.");
        }
        return result.rules;
    } catch (e) {
        console.error("Failed to parse JSON response for detection rules:", e);
        throw new Error("Could not parse AI model's JSON response for detection rules.");
    }
};

export const generateAAR = async (
    persona: Persona,
    campaign: Campaign,
    artifacts: Artifact[],
    logs: SimulatedEventLog[],
    detections: DetectionRule[]
): Promise<AAR> => {
    const prompt = `
You are an incident analyst generating an After Action Report for an authorized simulation.
Based on the following simulation data:
Persona: ${JSON.stringify(persona)}
Campaign: ${JSON.stringify(campaign)}
Artifacts: ${JSON.stringify(artifacts)}
Detection Rules: ${JSON.stringify(detections)}
Simulation Logs: ${JSON.stringify(logs)}

Return a JSON object that strictly adheres to the provided schema.
The report is for executives; avoid technical exploit details.
"what_worked" and "missed" should contain rule IDs that fired or were missed, with a short rationale.
The timeline should be constructed from the simulated logs.
Output JSON only.`;

    const schema = {
        type: Type.OBJECT,
        properties: {
            executive_summary: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Three concise bullet points summarizing the simulation."
            },
            timeline: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        time: { type: Type.STRING, description: "ISO format timestamp" },
                        event: { type: Type.STRING, description: "Description of the event" }
                    },
                    required: ["time", "event"]
                }
            },
            what_worked: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Rule IDs that fired and a short rationale."
            },
            missed: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Rule IDs that were missed and a short rationale."
            },
            recommendations: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        priority: { type: Type.STRING, description: "e.g., P1, P2" },
                        action: { type: Type.STRING, description: "A one-line recommended action." }
                    },
                    required: ["priority", "action"]
                }
            },
            confidence: {
                type: Type.STRING,
                description: "high|medium|low"
            }
        },
        required: ["executive_summary", "timeline", "what_worked", "missed", "recommendations", "confidence"]
    };

    return generateAndParseJSON<AAR>(prompt, schema);
};