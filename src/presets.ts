import { SoundDesc } from './sound_desc.js';

export function createPresets(): SoundDesc[] {
    return [
        createChirp(1000),
        createSweep(),
        createShieldRechargeSound(0, 2),
        createNoisePulse(),
    ];
}

function createChirp(frequency: number): SoundDesc {
    const maxGain = 0.5;
    const minGain = 1e-3;
    return {
        name: 'Chirp',
        duration: 0.2,
        nodes: [
            {
                type: 'oscillator',
                connections: new Set([1]),
                oscillatorType: 'sine',
                frequency: {
                    initialValue: frequency,
                    ramps: [
                        {
                            type: 'exponential',
                            value: frequency / 4,
                            endTime: 0.2,
                        }
                    ],
                },
            },
            {
                type: 'gain',
                connections: new Set([-1]),
                gain: {
                    initialValue: minGain,
                    ramps: [
                        {
                            type: 'exponential',
                            value: maxGain,
                            endTime: 0.01,
                        },
                        {
                            type: 'linear',
                            value: minGain,
                            endTime: 0.2,
                        },
                    ],
                },
            },
        ],
    };
}

function createSweep(): SoundDesc {
    const maxGain = 0.5;
    const minGain = 1e-3;
    const f = 440;
    return {
        name: 'Sweep',
        duration: 0.25,
        nodes: [
            {
                type: 'oscillator',
                connections: new Set([1]),
                oscillatorType: 'square',
                frequency: {
                    initialValue: f,
                    ramps: [
                        { type: 'instantaneous', value: 2 * f, endTime: 0.05 },
                        { type: 'instantaneous', value: 4 * f, endTime: 0.10 },
                        { type: 'instantaneous', value: 8 * f, endTime: 0.15 },
                        { type: 'instantaneous', value: 16 * f, endTime: 0.20 },
                    ],
                },
            },
            {
                type: 'gain',
                connections: new Set([-1]),
                gain: {
                    initialValue: minGain,
                    ramps: [
                        { type: 'exponential', value: maxGain, endTime: 0.01, },
                        { type: 'linear', value: minGain, endTime: 0.25, },
                    ],
                },
            },
        ],
    };
}

function createShieldRechargeSound(startFraction: number, duration: number): SoundDesc {
    const maxGain = 0.5;
    const minGain = 1e-3;
    const minFreq = 55;
    const maxFreq = minFreq * Math.pow(2, 0.75);
    return {
        name: 'Shield Recharge',
        duration: duration + 1,
        nodes: [
            {
                type: 'oscillator',
                connections: new Set([1]),
                oscillatorType: 'triangle',
                frequency: {
                    initialValue: minFreq + startFraction * (maxFreq - minFreq),
                    ramps: [
                        { type: 'exponential', value: maxFreq, endTime: duration },
                    ],
                },
            },
            {
                type: 'gain',
                connections: new Set([-1]),
                gain: {
                    initialValue: minGain,
                    ramps: [
                        { type: 'exponential', value: maxGain, endTime: 0.01, },
                        { type: 'exponential', value: maxGain, endTime: duration, },
                        { type: 'linear', value: minGain, endTime: duration + 1, },
                    ],
                },
            },
        ],
    };
}

function createNoisePulse(): SoundDesc {
    const maxGain = 0.5;
    const minGain = 1e-3;
    return {
        name: 'Noise Pulse',
        duration: 0.1,
        nodes: [
            {
                type: 'pink-noise',
                connections: new Set([1]),
            },
            {
                type: 'gain',
                connections: new Set([-1]),
                gain: {
                    initialValue: minGain,
                    ramps: [
                        { type: 'exponential', value: maxGain, endTime: 0.01, },
                        { type: 'linear', value: minGain, endTime: 0.1, },
                    ],
                },
            },
        ],
    };
}
