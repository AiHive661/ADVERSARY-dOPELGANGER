import { SimulationStep } from './types';

export const SIMULATION_STEPS: SimulationStep[] = [
    { id: 'start', name: 'Initiating Simulation' },
    { id: 'safety', name: 'Performing Safety Check' },
    { id: 'persona', name: 'Building Persona' },
    { id: 'campaign', name: 'Composing Campaign' },
    { id: 'lures', name: 'Generating Lures' },
    { id: 'honeydocs', name: 'Creating Honeydocs' },
    { id: 'detections', name: 'Mapping Detections' },
    { id: 'simulation', name: 'Running Simulation' },
    { id: 'aar', name: 'Generating Report' },
    { id: 'complete', name: 'Complete' },
];