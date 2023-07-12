import * as Immutable from 'immutable';
import { GainNodeDesc, OscillatorNodeDesc, ParamDesc, PinkNoiseNodeDesc, RampDesc, SoundDesc } from './sound_desc';

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
    return new SoundDesc(
        'Chirp',
        0.2,
        Immutable.List([
            new OscillatorNodeDesc(
                'sine',
                new ParamDesc(
                    frequency,
                    Immutable.List([
                        new RampDesc('exponential', frequency / 4, 0.2),
                    ])),
                Immutable.Set([1])),
            new GainNodeDesc(
                new ParamDesc(
                    minGain,
                    Immutable.List([
                        new RampDesc('exponential', maxGain, 0.01),
                        new RampDesc('linear', minGain, 0.2),
                    ])),
                Immutable.Set([-1])),
        ]));
}

function createSweep(): SoundDesc {
    const maxGain = 0.5;
    const minGain = 1e-3;
    const f = 440;
    return new SoundDesc(
        'Sweep',
        0.25,
        Immutable.List([
            new OscillatorNodeDesc(
                'square',
                new ParamDesc(
                    f,
                    Immutable.List([
                        new RampDesc('instantaneous', 2 * f, 0.05),
                        new RampDesc('instantaneous', 4 * f, 0.10),
                        new RampDesc('instantaneous', 8 * f, 0.15),
                        new RampDesc('instantaneous', 16 * f, 0.20),
                    ])),
                Immutable.Set([1])),
            new GainNodeDesc(
                new ParamDesc(
                    minGain,
                    Immutable.List([
                        new RampDesc('exponential', maxGain, 0.01),
                        new RampDesc('linear', minGain, 0.25),
                    ])),
                Immutable.Set([-1])),
        ]));
}

function createShieldRechargeSound(startFraction: number, duration: number): SoundDesc {
    const maxGain = 0.5;
    const minGain = 1e-3;
    const minFreq = 55;
    const maxFreq = minFreq * Math.pow(2, 0.75);
    return new SoundDesc(
        'Shield Recharge',
        duration + 1,
        Immutable.List([
            new OscillatorNodeDesc(
                'triangle',
                new ParamDesc(
                    minFreq + startFraction * (maxFreq - minFreq),
                    Immutable.List([
                        new RampDesc('exponential', maxFreq, duration),
                    ])),
                Immutable.Set([1])),
            new GainNodeDesc(
                new ParamDesc(
                    minGain,
                    Immutable.List([
                        new RampDesc('exponential', maxGain, 0.01),
                        new RampDesc('exponential', maxGain, duration),
                        new RampDesc('linear', minGain, duration + 1),
                    ])),
                Immutable.Set([-1])),
        ]));
}

function createNoisePulse(): SoundDesc {
    const maxGain = 0.5;
    const minGain = 1e-3;
    return new SoundDesc(
        'Noise Pulse',
        0.1,
        Immutable.List([
            new PinkNoiseNodeDesc(Immutable.Set([1])),
            new GainNodeDesc(
                new ParamDesc(
                    minGain,
                    Immutable.List([
                        new RampDesc('exponential', maxGain, 0.01),
                        new RampDesc('linear', minGain, 0.1),
                    ])),
                Immutable.Set([-1])),
        ]));
}
