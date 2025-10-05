import React, { useState, useCallback } from 'react';
import { InputForm } from './components/InputForm';
import { ProgressBar } from './components/ProgressBar';
import { ResultsDisplay } from './components/ResultsDisplay';
import { buildPersona, composeCampaign, generateLure, createHoneydoc, mapDetections, generateAAR, generateSmsLure, simulateHoneydocAccess, performSafetyCheck } from './services/geminiService';
import { SimulationInput, SimulationStep, SimulationResult, Persona, Artifact, DetectionRule, SimulatedEventLog, AAR, SafetyCheckResult, Honeydoc } from './types';
import { SIMULATION_STEPS } from './constants';

const App: React.FC = () => {
    const [inputJson, setInputJson] = useState<string>(
        JSON.stringify(
            {
                target_description: "A mid-sized financial technology company specializing in cloud-based payment processing solutions.",
                safety_consent: true,
                languages: ["en"],
                aggressiveness: "low",
                numberOfLures: 2,
                numberOfHoneydocs: 1
            },
            null,
            2
        )
    );
    const [isRunning, setIsRunning] = useState<boolean>(false);
    const [currentStep, setCurrentStep] = useState<SimulationStep | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [results, setResults] = useState<SimulationResult | null>(null);

    const handleRunSimulation = useCallback(async () => {
        setIsRunning(true);
        setError(null);
        setResults(null);
        setCurrentStep(SIMULATION_STEPS[0]);

        let config: SimulationInput;
        try {
            config = JSON.parse(inputJson);
        } catch (e) {
            setError("Invalid JSON input.");
            setIsRunning(false);
            setCurrentStep(null);
            return;
        }

        if (config.safety_consent !== true) {
            setError("Safety consent must be true to proceed.");
            setIsRunning(false);
            setCurrentStep(null);
            return;
        }

        const numberOfLures = config.numberOfLures ?? 3;
        const numberOfHoneydocs = config.numberOfHoneydocs ?? 1;


        try {
            // 0. Perform Safety Check
            setCurrentStep(SIMULATION_STEPS.find(s => s.id === 'safety')!);
            const safety_check: SafetyCheckResult = await performSafetyCheck(config.safety_consent);

            // 1. Build Persona
            setCurrentStep(SIMULATION_STEPS.find(s => s.id === 'persona')!);
            const persona: Persona = await buildPersona(config.target_description);

            // 2. Compose Campaign
            setCurrentStep(SIMULATION_STEPS.find(s => s.id === 'campaign')!);
            const campaign = await composeCampaign(persona, config.target_description);

            // 3. Generate Artifacts (Lures & Honeydocs)
            const artifacts: Artifact[] = [];
            for (const phase of campaign.phases) {
                setCurrentStep(SIMULATION_STEPS.find(s => s.id === 'lures')!);
                const language = config.languages[0] || 'en';
                const lures = await generateLure(persona, phase, language, numberOfLures);
                const smsLures = await generateSmsLure(persona, phase, language, numberOfLures);
                
                setCurrentStep(SIMULATION_STEPS.find(s => s.id === 'honeydocs')!);
                const honeydocs: Honeydoc[] = [];
                for (let i = 0; i < numberOfHoneydocs; i++) {
                    const honeydoc = await createHoneydoc(persona, phase);
                    honeydocs.push(honeydoc);
                }

                artifacts.push({
                    phase: phase.phase_name,
                    lures: lures,
                    sms_lures: smsLures,
                    honeydocs: honeydocs,
                });
            }

            // 4. Map Detections
            setCurrentStep(SIMULATION_STEPS.find(s => s.id === 'detections')!);
            const detection_rules = await mapDetections(campaign, artifacts);
            
            // 5. Simulate Access & Generate Logs
            setCurrentStep(SIMULATION_STEPS.find(s => s.id === 'simulation')!);
            const simulation_logs: SimulatedEventLog[] = [];
            for (const artifact of artifacts) {
                 for (const honeydoc of artifact.honeydocs) {
                    const logEntry = await simulateHoneydocAccess(honeydoc);
                    simulation_logs.push(logEntry);
                }
            }

            // 6. Generate After-Action Report
            setCurrentStep(SIMULATION_STEPS.find(s => s.id === 'aar')!);
            const aar: AAR = await generateAAR(persona, campaign, artifacts, simulation_logs, detection_rules);

            // 7. Finalize
            setCurrentStep(SIMULATION_STEPS.find(s => s.id === 'complete')!);
            const finalResult: SimulationResult = {
                safety_check,
                persona,
                campaign,
                artifacts,
                detection_rules,
                simulation_logs,
                aar,
            };
            setResults(finalResult);

        } catch (err) {
            console.error(err);
            const errorMessage = err instanceof Error ? err.message : "An unknown error occurred during the simulation.";
            setError(`Error during step '${currentStep?.name || 'unknown'}': ${errorMessage}`);
        } finally {
            setIsRunning(false);
            if (!results) { // If it fails, don't keep the "Complete" step active
               setCurrentStep(null);
            }
        }

    }, [inputJson, results, currentStep]);


    return (
        <div className="min-h-screen bg-gray-900 text-gray-200 font-sans p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
                <header className="text-center mb-8">
                    <h1 className="text-4xl sm:text-5xl font-bold text-cyan-400">Adversary Doppelgänger</h1>
                    <p className="mt-2 text-lg text-gray-400">Authorized Defensive Simulation Orchestrator</p>
                </header>

                <main className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="flex flex-col space-y-6">
                        <InputForm
                            inputJson={inputJson}
                            setInputJson={setInputJson}
                            onRunSimulation={handleRunSimulation}
                            isRunning={isRunning}
                        />
                        {isRunning && <ProgressBar steps={SIMULATION_STEPS} currentStepId={currentStep?.id ?? ''} />}
                        {error && (
                            <div className="bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded-lg" role="alert">
                                <strong className="font-bold">Error: </strong>
                                <span className="block sm:inline">{error}</span>
                            </div>
                        )}
                    </div>
                    
                    <div className="bg-gray-800 p-6 rounded-lg shadow-2xl border border-gray-700 max-h-[80vh] overflow-y-auto">
                      <ResultsDisplay results={results} isLoading={isRunning && !results} />
                    </div>
                </main>
            </div>
        </div>
    );
};

export default App;