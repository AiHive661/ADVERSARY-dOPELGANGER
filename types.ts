export interface SafetyCheck {
    authorized_only: boolean;
    sandbox_required: boolean;
    no_exploit_code: boolean;
    consent_recorded: string;
}

export interface SafetyCheckResult {
    safety: SafetyCheck;
}

export interface SimulationInput {
    target_description: string;
    safety_consent: boolean;
    languages: string[];
    aggressiveness: 'low' | 'medium' | 'high';
    numberOfLures?: number;
    numberOfHoneydocs?: number;
}

export interface SimulationStep {
    id: string;
    name: string;
}

export interface CampaignPhase {
    phase_id: string;
    phase_name: string;
    objective: string;
    methods_high_level: string[];
    duration_days: number;
    expected_outcome: string;
}


export interface Campaign {
    phases: CampaignPhase[];
}

export interface LureTemplate {
  template_id: string;
  subject: string;
  preheader: string;
  body_plaintext: string;
  call_to_action_text: string;
  persuasion_vectors: string[];
  translation_notes: string;
  safety_notes: string;
}

export interface SmsLureTemplate {
  template_id: string;
  body_short: string;
  persuasion_vectors: string[];
  safety_notes: string;
}

export interface Honeydoc {
    doc_id: string;
    title: string;
    author: string;
    body_text: string;
    metadata: {
        last_modified_hint: string;
        department: string;
    };
    metadata_notes: string;
    safety_notes: string;
}

export interface Artifact {
    phase: string;
    lures: LureTemplate[];
    sms_lures: SmsLureTemplate[];
    honeydocs: Honeydoc[];
}

export interface AttackCommand {
    command: string;
    description: string;
    technique_id: string;
}

export interface SimulatedEventLog {
    event_id: string;
    timestamp: string;
    doc_id: string;
    event_type: string;
    user_agent: string;
    ip: string;
    attack_steps: AttackCommand[];
    notes: string;
}


export interface DetectionRule {
    id: string;
    name: string;
    description: string;
    detection_logic_high_level: string;
    suggested_data_sources: string[];
    confidence: 'high' | 'medium' | 'low';
    mapped_artifacts: string[];
}

// New Persona-related types
export interface LinguisticStyle {
    tone: string;
    common_phrases: string[];
    typical_sentence_length: 'short' | 'medium' | 'long';
}

export interface PretextTemplate {
    id: string;
    description: string;
}

export interface Persona {
    name: string;
    origin_country: string;
    motivation: string;
    primary_channels: string[];
    linguistic_style: LinguisticStyle;
    pretext_templates: PretextTemplate[];
    likely_tools_high_level: string[];
    opsec_notes: string[];
}

// New AAR types
export interface AARRecommendation {
    priority: 'P1' | 'P2' | 'P3' | 'P4';
    action: string;
}

export interface AARTimelineEvent {
    time: string;
    event: string;
}

export interface AAR {
    executive_summary: string[];
    timeline: AARTimelineEvent[];
    what_worked: string[];
    missed: string[];
    recommendations: AARRecommendation[];
    confidence: 'high' | 'medium' | 'low';
}


export interface SimulationResult {
    safety_check: SafetyCheckResult;
    persona: Persona;
    campaign: Campaign;
    artifacts: Artifact[];
    detection_rules: DetectionRule[];
    simulation_logs: SimulatedEventLog[];
    aar: AAR;
}