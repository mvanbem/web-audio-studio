export interface SoundDesc {
    name: string;
    duration: number;
    nodes: NodeDesc[];
}

export type NodeDesc = GainNodeDesc | OscillatorNodeDesc | PinkNoiseNodeDesc;

export interface NodeDescCommon {
    connections: Set<number>;
}

export interface GainNodeDesc extends NodeDescCommon {
    type: 'gain';
    gain: ParamDesc;
}

export interface OscillatorNodeDesc extends NodeDescCommon {
    type: 'oscillator';
    oscillatorType: OscillatorTypeDesc;
    frequency: ParamDesc;
}

export type OscillatorTypeDesc = 'sawtooth' | 'sine' | 'square' | 'triangle';

export interface PinkNoiseNodeDesc extends NodeDescCommon {
    type: 'pink-noise',
}

export interface ParamDesc {
    initialValue: number;
    ramps: RampDesc[];
}

export interface RampDesc {
    type: 'exponential' | 'instantaneous' | 'linear';
    value: number;
    endTime: number;
}

export function setupSound(
    ctx: BaseAudioContext,
    pinkNoiseBuffer: any,
    desc: SoundDesc,
) {
    function setupParam(param: AudioParam, desc: ParamDesc) {
        param.setValueAtTime(desc.initialValue, 0);
        for (let ramp of desc.ramps) {
            switch (ramp.type) {
                case 'exponential':
                    param.exponentialRampToValueAtTime(ramp.value, ramp.endTime);
                    break;
                case 'instantaneous':
                    param.setValueAtTime(ramp.value, ramp.endTime);
                    break;
                case 'linear':
                    param.linearRampToValueAtTime(ramp.value, ramp.endTime);
                    break;
            }
        }
    }

    let nodes = desc.nodes.map((desc, index) => {
        switch (desc.type) {
            case 'gain': {
                const gain = ctx.createGain();
                setupParam(gain.gain, desc.gain);
                return gain;
            }
            case 'oscillator': {
                const oscillator = ctx.createOscillator();
                oscillator.type = desc.oscillatorType;
                setupParam(oscillator.frequency, desc.frequency);
                oscillator.start();
                return oscillator;
            }
            case 'pink-noise': {
                const bufferSource = ctx.createBufferSource();
                bufferSource.buffer = pinkNoiseBuffer;
                bufferSource.loop = true;
                bufferSource.start();
                return bufferSource;
            }
        }
    });

    desc.nodes.forEach((desc, srcIndex) => {
        let src = nodes[srcIndex]!;
        for (let dstIndex of desc.connections) {
            let dst = (dstIndex == -1) ? ctx.destination : nodes[dstIndex]!;
            src.connect(dst);
        }
    });
}
