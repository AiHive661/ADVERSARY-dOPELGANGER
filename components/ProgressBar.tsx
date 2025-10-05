
import React from 'react';
import { SimulationStep } from '../types';

interface ProgressBarProps {
    steps: SimulationStep[];
    currentStepId: string;
}

const getStepStatus = (steps: SimulationStep[], stepId: string, currentStepId: string) => {
    const currentIndex = steps.findIndex(s => s.id === currentStepId);
    const stepIndex = steps.findIndex(s => s.id === stepId);

    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'current';
    return 'pending';
};


export const ProgressBar: React.FC<ProgressBarProps> = ({ steps, currentStepId }) => {
    return (
        <div className="bg-gray-800 p-6 rounded-lg shadow-2xl border border-gray-700">
            <h2 className="text-2xl font-semibold mb-4 text-cyan-300">2. Orchestration Progress</h2>
            <div className="flex flex-col space-y-3">
                {steps.map((step) => {
                    const status = getStepStatus(steps, step.id, currentStepId);
                    const isCompleted = status === 'completed';
                    const isCurrent = status === 'current';

                    return (
                        <div key={step.id} className="flex items-center space-x-3 text-sm">
                            <div className={`flex items-center justify-center w-6 h-6 rounded-full ${
                                isCompleted ? 'bg-green-500' : isCurrent ? 'bg-cyan-500 animate-pulse' : 'bg-gray-600'
                            }`}>
                                {isCompleted ? (
                                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                                ) : (
                                   <div className={`w-2 h-2 rounded-full ${isCurrent ? 'bg-white' : 'bg-gray-400'}`}></div>
                                )}
                            </div>
                            <span className={`${
                                isCompleted ? 'text-gray-400 line-through' : isCurrent ? 'text-cyan-300 font-bold' : 'text-gray-500'
                            }`}>
                                {step.name}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
