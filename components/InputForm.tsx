
import React from 'react';

interface InputFormProps {
    inputJson: string;
    setInputJson: (value: string) => void;
    onRunSimulation: () => void;
    isRunning: boolean;
}

export const InputForm: React.FC<InputFormProps> = ({ inputJson, setInputJson, onRunSimulation, isRunning }) => {
    return (
        <div className="bg-gray-800 p-6 rounded-lg shadow-2xl border border-gray-700">
            <h2 className="text-2xl font-semibold mb-4 text-cyan-300">1. Simulation Configuration</h2>
            <p className="text-gray-400 mb-4">
                Define the simulation parameters in JSON format. The orchestrator will use this to generate a tailored scenario.
            </p>
            <textarea
                value={inputJson}
                onChange={(e) => setInputJson(e.target.value)}
                className="w-full h-64 p-3 bg-gray-900 text-gray-200 border border-gray-600 rounded-md focus:ring-2 focus:ring-cyan-500 focus:outline-none font-mono text-sm"
                placeholder="Enter simulation JSON here..."
                spellCheck="false"
                disabled={isRunning}
            />
            <button
                onClick={onRunSimulation}
                disabled={isRunning}
                className="mt-4 w-full bg-cyan-600 text-white font-bold py-3 px-4 rounded-md hover:bg-cyan-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors duration-300 flex items-center justify-center"
            >
                {isRunning ? (
                    <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Running Simulation...
                    </>
                ) : 'Run Simulation'}
            </button>
        </div>
    );
};
