import * as React from 'react';
import { DeferredTextInput } from './deferred_text_input';
import { GainNodeDesc, NodeDesc, OscillatorNodeDesc, OscillatorTypeDesc, ParamDesc, PinkNoiseNodeDesc, RampDesc, RampTypeDesc, SoundDesc } from './sound_desc';
import { ParseResult, MappedTextInput } from './mapped_text_input';
import * as Immutable from 'immutable';

export function SoundEditor({
    sound,
    onChange,
}: {
    sound: SoundDesc,
    onChange: (value: SoundDesc) => void,
}) {
    return (
        <div className='sound-editor'>
            <SoundPropertiesEditor
                name={sound.name}
                duration={sound.duration}
                onChangeName={name => onChange(sound.withName(name))}
                onChangeDuration={duration => onChange(sound.withDuration(duration))}
            />
            <NodeListEditor
                nodes={sound.nodes}
                onChange={nodes => onChange(sound.withNodes(nodes))}
            />
        </div>
    );
}

export function SoundPropertiesEditor({
    name,
    duration,
    onChangeName,
    onChangeDuration,
}: {
    name: string,
    duration: number,
    onChangeName: (value: string) => void,
    onChangeDuration: (value: number) => void,
}) {
    function parseDuration(text: string): ParseResult<number> {
        let duration = parseFloat(text);
        if (typeof (duration) != 'number') {
            return {
                value: null,
                error: <div className='validation-error'>Must be a number</div>,
            };
        }

        if (!Number.isFinite(duration) || duration <= 0 || duration > 60) {
            return {
                value: null,
                error: <div className='validation-error'>
                    Must be greater than zero and at most 60 seconds
                </div>,
            };
        }

        return {
            value: duration,
            error: null,
        };
    }

    return (
        <div className='props'>
            <div className='title'>Sound Properties</div>
            <div>Sound name</div>
            <DeferredTextInput
                value={name}
                onChange={onChangeName}
            />
            <div>Duration</div>
            <div className='spaced'>
                <MappedTextInput
                    value={duration}
                    render={value => value.toString()}
                    parse={parseDuration}
                    onChange={onChangeDuration}
                />
                seconds
            </div>
        </div>
    );
}

export function NodeListEditor({
    nodes,
    onChange
}: {
    nodes: Immutable.List<NodeDesc>,
    onChange: (value: Immutable.List<NodeDesc>) => void,
}) {
    function addNode() {
        onChange(nodes.push(new OscillatorNodeDesc(
            'sine',
            new ParamDesc(1000, Immutable.List()),
            Immutable.Set())));
    }

    const nodeEditors = nodes.map((node, nodeIndex) => {
        const eligibleConnections = new Set([-1]);
        nodes.forEach((dstNode, dstNodeIndex) => {
            if (dstNodeIndex != nodeIndex && dstNode.hasInputs()) {
                eligibleConnections.add(dstNodeIndex);
            }
        });
        return (
            <NodeEditor
                key={nodeIndex}
                node={node}
                nodeIndex={nodeIndex}
                eligibleConnections={eligibleConnections}
                onChange={node => onChange(nodes.set(nodeIndex, node))}
                onRemove={() => onChange(SoundDesc.removeNode(nodes, nodeIndex))}
            />
        );
    });

    return <>
        {nodeEditors}
        <button onClick={addNode}>Add Node</button>
    </>;
}

export function NodeEditor({
    node,
    nodeIndex,
    eligibleConnections,
    onChange,
    onRemove,
}: {
    node: NodeDesc,
    nodeIndex: number,
    eligibleConnections: Set<number>,
    onChange: (value: NodeDesc) => void,
    onRemove: () => void,
}) {
    function makeConnection(dstNodeIndex: number, connected: boolean) {
        return (
            <label key={dstNodeIndex}>
                <input
                    type='checkbox'
                    checked={connected}
                    onChange={e => updateConnection(dstNodeIndex, e.target.checked)}
                />
                {dstNodeIndex == -1 ? 'Output' : '#' + (dstNodeIndex + 1)}
            </label>
        );
    }

    const connections = [];
    for (let dstNodeIndex of eligibleConnections) {
        connections.push(makeConnection(
            dstNodeIndex,
            node.connections.has(dstNodeIndex),
        ));
    }

    function updateConnection(dstNodeIndex: number, connected: boolean) {
        onChange(node.withConnections(connected
            ? node.connections.add(dstNodeIndex)
            : node.connections.remove(dstNodeIndex)));
    }

    const more = (() => {
        switch (node.type) {
            case 'gain':
                return <>
                    <div>Gain</div>
                    <ParamEditor
                        param={node.gain}
                        onChange={param => onChange(node.withGain(param))}
                    />
                </>;
            case 'oscillator':
                return <>
                    <div>Oscillator Type</div>
                    <select
                        value={node.oscillatorType}
                        onChange={e => onChange(node.withOscillatorType(
                            e.target.value as OscillatorTypeDesc,
                        ))}
                    >
                        <option value='sawtooth'>Sawtooth</option>
                        <option value='sine'>Sine</option>
                        <option value='square'>Square</option>
                        <option value='triangle'>Triangle</option>
                    </select >
                    <div>Frequency</div>
                    <ParamEditor
                        param={node.frequency}
                        onChange={param => onChange(node.withFrequency(param))}
                    />
                </>;
            case 'pink-noise':
                return null;
        }
    })();

    function updateType(type: string) {
        switch (type) {
            case 'gain':
                onChange(new GainNodeDesc(
                    new ParamDesc(0.5, Immutable.List()),
                    node.connections));
                break;
            case 'oscillator':
                onChange(new OscillatorNodeDesc(
                    'sine',
                    new ParamDesc(1000, Immutable.List()),
                    node.connections));
                break;
            case 'pink-noise':
                onChange(new PinkNoiseNodeDesc(node.connections));
                break;
        }
    }

    return (
        <div className='props' key={nodeIndex}>
            <div className='title'>Node #{nodeIndex + 1}</div>
            <div>Node Type</div>
            <select value={node.type} onChange={e => updateType(e.target.value)}>
                <optgroup label='Sources'>
                    <option value='oscillator'>Oscillator</option>
                    <option value='pink-noise'>Pink noise</option>
                </optgroup>
                <optgroup label='Modifiers'>
                    <option value='gain'>Gain</option>
                </optgroup>
            </select>
            {more}
            <div>Connections</div>
            <div className='spaced'>{connections}</div>
            <button onClick={onRemove}>Remove Node</button>
        </div>
    );
}

export function ParamEditor({
    param,
    onChange,
}: {
    param: ParamDesc,
    onChange: (value: ParamDesc) => void,
}) {
    function parseInitialValue(text: string): ParseResult<number> {
        let initialValue = parseFloat(text);
        if (typeof (initialValue) != 'number') {
            return {
                value: null,
                error: <div className='validation-error'>Must be a number</div>,
            };
        }

        // TODO: Enforce ranges for some kinds of parameter!
        if (!Number.isFinite(initialValue)) {
            return {
                value: null,
                error: <div className='validation-error'>
                    Must be a finite number.
                </div>,
            };
        }

        return {
            value: initialValue,
            error: null,
        };
    }

    const ramps = param.ramps.map((ramp, rampIndex) => {
        return <RampEditor
            key={rampIndex}
            ramp={ramp}
            onChange={ramp => onChange(param.withRamps(param.ramps.set(rampIndex, ramp)))}
            onRemove={() => onChange(param.withRamps(param.ramps.remove(rampIndex)))}
        />;
    });

    function addRamp() {
        onChange(param.withRamps(param.ramps.push(new RampDesc(
            'exponential', param.lastValue(), param.lastEndTime() + 0.25))));
    }

    return (
        <div className='props'>
            <div>Initial Value</div>
            <MappedTextInput
                value={param.initialValue}
                render={value => value.toString()}
                parse={parseInitialValue}
                onChange={initialValue => onChange(param.withInitialValue(initialValue))}
            />
            <div className='ramps'>
                {ramps}
                <button onClick={addRamp}>Add Ramp</button>
            </div>
        </div>
    );
}

export function RampEditor({
    ramp,
    onChange,
    onRemove,
}: {
    ramp: RampDesc,
    onChange: (value: RampDesc) => void,
    onRemove: () => void,
}) {
    function parseValue(text: string) {
        let parsed = parseFloat(text);
        if (!Number.isFinite(parsed)) {
            return {
                value: null,
                error: <div className='validation-error'>Must be a finite number.</div>,
            };
        } else {
            return {
                value: parsed,
                error: null,
            };
        }
    }

    function parseEndTime(text: string) {
        let parsed = parseFloat(text);
        if (!Number.isFinite(parsed)) {
            return {
                value: null,
                error: <div className='validation-error'>Must be a finite number.</div>,
            };
        } else {
            return {
                value: parsed,
                error: null,
            };
        }
    }

    return (
        <div className='props'>
            <div>Ramp Type</div>
            <select
                value={ramp.type}
                onChange={e => onChange(ramp.withType(e.target.value as RampTypeDesc))}
            >
                <option value='exponential'>Exponential</option>
                <option value='instantaneous'>Instantaneous</option>
                <option value='linear'>Linear</option>
            </select>
            <div>Value</div>
            <MappedTextInput<number>
                value={ramp.value}
                render={x => x.toString()}
                parse={parseValue}
                onChange={value => onChange(ramp.withValue(value))}
            />
            <div>End Time</div>
            <div className='spaced'>
                <MappedTextInput<number>
                    value={ramp.endTime}
                    render={x => x.toString()}
                    parse={parseEndTime}
                    onChange={endTime => onChange(ramp.withEndTime(endTime))}
                />
                seconds
            </div>
            <button onClick={onRemove}>Remove Ramp</button>
        </div>
    );
}
