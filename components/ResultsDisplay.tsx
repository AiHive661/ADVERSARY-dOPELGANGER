import React, { useState } from 'react';
import { AAR, SimulationResult, SimulatedEventLog } from '../types';

interface ResultsDisplayProps {
    results: SimulationResult | null;
    isLoading: boolean;
}

const ResultSection: React.FC<{ title: string; isExpanded: boolean; onToggle: () => void; children: React.ReactNode }> = ({ title, children, isExpanded, onToggle }) => (
    <div className="border-b border-gray-700 last:border-b-0 py-2">
        <h3 id={`section-header-${title.replace(/\s+/g, '-')}`}>
            <button
                onClick={onToggle}
                className="w-full flex justify-between items-center text-left p-2 rounded-md hover:bg-gray-700/50 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                aria-expanded={isExpanded}
                aria-controls={`section-content-${title.replace(/\s+/g, '-')}`}
            >
                <span className="text-xl font-semibold text-cyan-300">{title}</span>
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className={`h-5 w-5 text-gray-400 transform transition-transform duration-200 ${
                        isExpanded ? 'rotate-90' : ''
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
            </button>
        </h3>
        {isExpanded && (
            <div id={`section-content-${title.replace(/\s+/g, '-')}`} role="region" aria-labelledby={`section-header-${title.replace(/\s+/g, '-')}`} className="pt-2 pl-4">
                {children}
            </div>
        )}
    </div>
);


const CodeBlock: React.FC<{ data: object | string }> = ({ data }) => {
    const jsonString = typeof data === 'string' ? data : JSON.stringify(data, null, 2);

    const syntaxHighlight = (json: string) => {
        if (!json) return '';
        json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)/g, (match) => {
            let cls = 'text-amber-300'; // number by default
            if (/^"/.test(match)) {
                if (/:$/.test(match)) {
                    cls = 'text-cyan-400'; // key
                } else {
                    cls = 'text-green-300'; // string value
                }
            } else if (/true|false/.test(match)) {
                cls = 'text-purple-400'; // boolean
            } else if (/null/.test(match)) {
                cls = 'text-gray-500'; // null
            }
            return `<span class="${cls}">${match}</span>`;
        });
    };

    return (
        <pre className="bg-gray-900 rounded-md p-4 my-2 text-sm text-gray-300 overflow-x-auto border border-gray-700">
            <code dangerouslySetInnerHTML={{ __html: syntaxHighlight(jsonString) }} />
        </pre>
    );
};

const AARDisplay: React.FC<{ aar: AAR }> = ({ aar }) => {
    const priorityColor: { [key: string]: string } = {
        'P1': 'bg-red-500 text-red-100',
        'P2': 'bg-orange-500 text-orange-100',
        'P3': 'bg-yellow-500 text-yellow-100',
        'P4': 'bg-blue-500 text-blue-100',
    };

    return (
        <div className="space-y-4 text-gray-300 py-2">
            <div>
                <h4 className="font-semibold text-gray-100 mb-2">Executive Summary</h4>
                <ul className="list-disc list-inside space-y-1 pl-2">
                    {aar.executive_summary.map((item, index) => <li key={index}>{item}</li>)}
                </ul>
            </div>
            <div>
                <h4 className="font-semibold text-gray-100 mb-2">Timeline</h4>
                <ul className="list-disc list-inside space-y-1 pl-2">
                    {aar.timeline.map((item, index) => <li key={index}><span className="font-mono text-cyan-400">{new Date(item.time).toLocaleString()}</span>: {item.event}</li>)}
                </ul>
            </div>
            <div>
                <h4 className="font-semibold text-gray-100 mb-2">What Worked</h4>
                <ul className="list-disc list-inside space-y-1 pl-2 text-green-300">
                    {aar.what_worked.map((item, index) => <li key={index}>{item}</li>)}
                </ul>
            </div>
            <div>
                <h4 className="font-semibold text-gray-100 mb-2">What Was Missed</h4>
                 <ul className="list-disc list-inside space-y-1 pl-2 text-yellow-300">
                    {aar.missed.map((item, index) => <li key={index}>{item}</li>)}
                </ul>
            </div>
            <div>
                <h4 className="font-semibold text-gray-100 mb-2">Recommendations</h4>
                <div className="space-y-2">
                    {aar.recommendations.map((rec, index) => (
                        <div key={index} className="flex items-start space-x-3 bg-gray-900 p-2 rounded-md">
                            <span className={`px-2 py-1 text-xs font-bold rounded-md ${priorityColor[rec.priority] ?? 'bg-gray-500'}`}>{rec.priority}</span>
                            <span>{rec.action}</span>
                        </div>
                    ))}
                </div>
            </div>
             <div>
                <h4 className="font-semibold text-gray-100">Confidence: <span className="font-normal text-cyan-400 capitalize">{aar.confidence}</span></h4>
            </div>
        </div>
    );
};

const SimulationLogsDisplay: React.FC<{ logs: SimulatedEventLog[] }> = ({ logs }) => {
    const [copiedCommand, setCopiedCommand] = useState<string | null>(null);

    const handleCopy = (command: string, eventId: string, stepIndex: number) => {
        const uniqueId = `${eventId}-${stepIndex}`;
        navigator.clipboard.writeText(command);
        setCopiedCommand(uniqueId);
        setTimeout(() => setCopiedCommand(null), 2000);
    };

    return (
        <div className="space-y-6 py-2">
            {logs.map(log => (
                <div key={log.event_id} className="bg-gray-900/50 rounded-lg p-4 border border-gray-700">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1 text-sm mb-4 border-b border-gray-700 pb-3">
                        <div><strong>Event ID:</strong> <span className="font-mono text-gray-400">{log.event_id}</span></div>
                        <div><strong>Timestamp:</strong> <span className="font-mono text-gray-400">{new Date(log.timestamp).toLocaleString()}</span></div>
                        <div><strong>Source IP:</strong> <span className="font-mono text-gray-400">{log.ip}</span></div>
                        <div><strong>Honeydoc ID:</strong> <span className="font-mono text-gray-400">{log.doc_id}</span></div>
                        <div className="md:col-span-2"><strong>User Agent:</strong> <span className="font-mono text-gray-400">{log.user_agent}</span></div>
                    </div>

                    <h4 className="font-semibold text-gray-100 mb-3">Simulated Attack Steps:</h4>
                    <div className="space-y-4">
                        {log.attack_steps.map((step, index) => {
                            const uniqueId = `${log.event_id}-${index}`;
                            const isCopied = copiedCommand === uniqueId;
                            return (
                                <div key={index} className="bg-gray-900 p-3 rounded-md">
                                    <p className="text-gray-300 mb-2"><strong className="text-cyan-400">Description:</strong> {step.description}</p>
                                    <p className="text-gray-400 text-xs mb-2"><strong className="text-cyan-500">MITRE ATT&CK®:</strong> {step.technique_id}</p>
                                    <div className="relative bg-black rounded-md">
                                        <pre className="p-3 pr-12 text-sm text-green-300 overflow-x-auto font-mono">
                                            <code>{step.command}</code>
                                        </pre>
                                        <button
                                            onClick={() => handleCopy(step.command, log.event_id, index)}
                                            className="absolute top-2 right-2 p-1.5 bg-gray-700/50 rounded-md text-gray-400 hover:bg-gray-600 hover:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all duration-200"
                                            aria-label="Copy command"
                                        >
                                            {isCopied ? (
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                </svg>
                                            ) : (
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                                </svg>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ))}
        </div>
    );
};


export const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ results, isLoading }) => {
    const [expandedSections, setExpandedSections] = useState<Set<string>>(() => new Set(['After-Action Report']));

    const toggleSection = (title: string) => {
        setExpandedSections(prev => {
            const newSet = new Set(prev);
            if (newSet.has(title)) {
                newSet.delete(title);
            } else {
                newSet.add(title);
            }
            return newSet;
        });
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
                 <svg className="animate-spin h-10 w-10 text-cyan-500 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <h2 className="text-2xl font-semibold text-cyan-300">Generating Simulation Report...</h2>
                <p>This may take a moment.</p>
            </div>
        );
    }

    if (!results) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h2 className="text-2xl font-semibold">Simulation Results</h2>
                <p>Run a simulation to see the generated report here.</p>
            </div>
        );
    }
    
    const sections = [
        { title: "Safety Check", data: results.safety_check, customDisplay: false },
        { title: "Adversary Persona", data: results.persona, customDisplay: false },
        { title: "Campaign Plan", data: results.campaign, customDisplay: false },
        { title: "Generated Artifacts", data: results.artifacts, customDisplay: false },
        { title: "Detection Rules", data: results.detection_rules, customDisplay: false },
        { title: "Simulation Logs", data: results.simulation_logs, customDisplay: true },
    ];
    
    return (
        <div>
            <h2 className="text-2xl font-semibold mb-4 text-white">Simulation Report</h2>

            <div className="divide-y divide-gray-700">
                <ResultSection 
                    title="After-Action Report"
                    isExpanded={expandedSections.has("After-Action Report")}
                    onToggle={() => toggleSection("After-Action Report")}
                >
                    <AARDisplay aar={results.aar} />
                </ResultSection>

                {sections.map(section => (
                    <ResultSection 
                        key={section.title}
                        title={section.title}
                        isExpanded={expandedSections.has(section.title)}
                        onToggle={() => toggleSection(section.title)}
                    >
                         {section.customDisplay ? (
                            <SimulationLogsDisplay logs={results.simulation_logs} />
                         ) : (
                            <CodeBlock data={section.data} />
                         )}
                    </ResultSection>
                ))}
            </div>
        </div>
    );
};