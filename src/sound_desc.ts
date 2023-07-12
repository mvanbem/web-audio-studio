import * as Immutable from 'immutable';

export class SoundDesc {
    readonly name: string;
    readonly duration: number;
    readonly nodes: Immutable.List<NodeDesc>;

    constructor(name: string, duration: number, nodes: Immutable.List<NodeDesc>) {
        this.name = name;
        this.duration = duration;
        this.nodes = nodes.map(node => node.filterConnections(dstNodeIndex => {
            return dstNodeIndex == -1
                || (dstNodeIndex >= 0 && dstNodeIndex < nodes.size && nodes.get(dstNodeIndex)!.hasInputs())
        }));
    }

    withName(name: string) {
        return new SoundDesc(
            name,
            this.duration,
            this.nodes);
    }

    withDuration(duration: number) {
        return new SoundDesc(
            this.name,
            duration,
            this.nodes);
    }

    withNodes(nodes: Immutable.List<NodeDesc>) {
        return new SoundDesc(
            this.name,
            this.duration,
            nodes);
    }

    /// Returns a new node list with the given node removed and all connections updated to match.
    static removeNode(nodes: Immutable.List<NodeDesc>, nodeIndex: number) {
        return nodes
            .remove(nodeIndex)
            .map(node => node.mapConnections(dstNodeIndex => {
                if (dstNodeIndex < nodeIndex) {
                    return dstNodeIndex;
                } else if (dstNodeIndex == nodeIndex) {
                    return null;
                } else {
                    return dstNodeIndex - 1;
                }
            }));
    }

    setup(
        ctx: BaseAudioContext,
        pinkNoiseBuffer: any,
    ) {
        let nodes = this.nodes.map(node => node.setup(ctx, pinkNoiseBuffer));

        this.nodes.forEach((node, srcIndex) => {
            let src = nodes.get(srcIndex)!;
            for (let dstIndex of node.connections) {
                src.connect((dstIndex == -1)
                    ? ctx.destination
                    : nodes.get(dstIndex)!);
            }
        });
    }
}

export type NodeDesc = GainNodeDesc | OscillatorNodeDesc | PinkNoiseNodeDesc;

abstract class BaseNodeDesc<Self> {
    abstract readonly type: string;
    readonly connections: Immutable.Set<number>;

    constructor(connections: Immutable.Set<number>) {
        this.connections = connections;
    }

    abstract hasInputs(): boolean;
    abstract withConnections(connections: Immutable.Set<number>): Self;
    abstract setup(ctx: BaseAudioContext, pinkNoiseBuffer: AudioBuffer): AudioNode;

    filterConnections(filter: (dstNodeIndex: number) => boolean) {
        return this.withConnections(this.connections.filter(filter))
    }

    mapConnections(map: (dstNodeIndex: number) => number | null) {
        const connections = Immutable.Set<number>().asMutable();
        for (let dstNodeIndex of this.connections) {
            if (dstNodeIndex == -1) {
                connections.add(dstNodeIndex);
            } else {
                let mapped = map(dstNodeIndex);
                if (mapped !== null) {
                    connections.add(mapped);
                }
            }
        }
        return this.withConnections(connections.asImmutable());
    }
}

export class GainNodeDesc extends BaseNodeDesc<GainNodeDesc> {
    readonly type = 'gain';
    readonly gain: ParamDesc;

    constructor(gain: ParamDesc, connections: Immutable.Set<number>) {
        super(connections);
        this.gain = gain;
    }

    hasInputs() { return true; }

    withGain(gain: ParamDesc) {
        return new GainNodeDesc(gain, this.connections);
    }

    withConnections(connections: Immutable.Set<number>) {
        return new GainNodeDesc(this.gain, connections);
    }

    setup(ctx: BaseAudioContext, pinkNoiseBuffer: AudioBuffer) {
        const node = ctx.createGain();
        this.gain.setup(node.gain);
        return node;
    }
}

export class OscillatorNodeDesc extends BaseNodeDesc<OscillatorNodeDesc> {
    readonly type = 'oscillator';
    readonly oscillatorType: OscillatorTypeDesc;
    readonly frequency: ParamDesc;

    constructor(
        oscillatorType: OscillatorTypeDesc,
        frequency: ParamDesc,
        connections: Immutable.Set<number>,
    ) {
        super(connections);
        this.oscillatorType = oscillatorType;
        this.frequency = frequency;
    }

    hasInputs() { return false; }

    withOscillatorType(oscillatorType: OscillatorTypeDesc) {
        return new OscillatorNodeDesc(oscillatorType, this.frequency, this.connections);
    }

    withFrequency(frequency: ParamDesc) {
        return new OscillatorNodeDesc(this.oscillatorType, frequency, this.connections);
    }

    withConnections(connections: Immutable.Set<number>) {
        return new OscillatorNodeDesc(this.oscillatorType, this.frequency, connections);
    }

    setup(ctx: BaseAudioContext, pinkNoiseBuffer: AudioBuffer) {
        const node = ctx.createOscillator();
        node.type = this.oscillatorType;
        this.frequency.setup(node.frequency);
        node.start();
        return node;
    }
}

export type OscillatorTypeDesc = 'sawtooth' | 'sine' | 'square' | 'triangle';

export class PinkNoiseNodeDesc extends BaseNodeDesc<PinkNoiseNodeDesc> {
    readonly type = 'pink-noise';

    constructor(connections: Immutable.Set<number>) {
        super(connections);
    }

    hasInputs() { return false; }

    withConnections(connections: Immutable.Set<number>): PinkNoiseNodeDesc {
        return new PinkNoiseNodeDesc(connections);
    }

    setup(ctx: BaseAudioContext, pinkNoiseBuffer: AudioBuffer) {
        const node = ctx.createBufferSource();
        node.buffer = pinkNoiseBuffer;
        node.loop = true;
        node.start();
        return node;
    }
}

export class ParamDesc {
    readonly initialValue: number;
    readonly ramps: Immutable.List<RampDesc>;

    constructor(initialValue: number, ramps: Immutable.List<RampDesc>) {
        this.initialValue = initialValue;
        this.ramps = ParamDesc.sortRamps(ramps);
    }

    withInitialValue(initialValue: number) {
        return new ParamDesc(initialValue, this.ramps);
    }

    withRamps(ramps: Immutable.List<RampDesc>) {
        return new ParamDesc(this.initialValue, ramps);
    }

    private static sortRamps(ramps: Immutable.List<RampDesc>) {
        return ramps.sortBy(ramp => ramp.endTime);
    }

    lastValue() {
        return this.ramps.size > 0
            ? this.ramps.last()!.value
            : this.initialValue;
    }

    lastEndTime() {
        return this.ramps.size > 0
            ? this.ramps.last()!.endTime
            : 0;
    }

    setup(param: AudioParam) {
        param.setValueAtTime(this.initialValue, 0);
        for (let ramp of this.ramps) {
            ramp.setup(param);
        }
    }
}

export class RampDesc {
    readonly type: RampTypeDesc;
    readonly value: number;
    readonly endTime: number;

    constructor(type: RampTypeDesc, value: number, endTime: number) {
        this.type = type;
        this.value = value;
        this.endTime = endTime;
    }

    withType(type: RampTypeDesc) {
        return new RampDesc(type, this.value, this.endTime);
    }

    withValue(value: number) {
        return new RampDesc(this.type, value, this.endTime);
    }

    withEndTime(endTime: number) {
        return new RampDesc(this.type, this.value, endTime);
    }

    setup(param: AudioParam) {
        switch (this.type) {
            case 'exponential':
                param.exponentialRampToValueAtTime(this.value, this.endTime);
                break;
            case 'instantaneous':
                param.setValueAtTime(this.value, this.endTime);
                break;
            case 'linear':
                param.linearRampToValueAtTime(this.value, this.endTime);
                break;
        }
    }
}

export type RampTypeDesc = 'exponential' | 'instantaneous' | 'linear';
