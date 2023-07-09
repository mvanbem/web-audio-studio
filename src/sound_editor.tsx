import * as React from 'react';
import { DeferredTextInput } from './deferred_text_input';
import { NodeDesc, OscillatorNodeDesc, OscillatorTypeDesc, ParamDesc, RampDesc, SoundDesc } from './sound_desc';
import { ParseResult, MappedTextInput } from './mapped_text_input';

export function SoundEditor({
    sound,
    onSoundChange,
}: {
    sound: SoundDesc,
    onSoundChange: (value: SoundDesc) => void,
}) {
    function updateName(name: string) {
        if (name != sound.name) {
            onSoundChange({
                ...sound,
                name,
            });
        }
    }

    function updateDuration(duration: number) {
        if (duration !== null && duration != sound.duration) {
            onSoundChange({
                ...sound,
                duration,
            });
        }
    }

    function updateNodes(nodes: NodeDesc[]) {
        if (nodes !== sound.nodes) {
            onSoundChange({
                ...sound,
                nodes,
            });
        }
    }

    return (
        <div className='sound-editor'>
            <SoundPropertiesEditor
                name={sound.name}
                duration={sound.duration}
                onNameChange={updateName}
                onDurationChange={updateDuration}
            />
            <NodeListEditor
                nodes={sound.nodes}
                onChange={updateNodes}
            />
        </div>
    );
}

export function SoundPropertiesEditor({
    name,
    duration,
    onNameChange,
    onDurationChange,
}: {
    name: string,
    duration: number,
    onNameChange: (value: string) => void,
    onDurationChange: (value: number) => void,
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
                onChange={onNameChange}
            />
            <div>Duration</div>
            <div className='spaced'>
                <MappedTextInput
                    value={duration}
                    render={value => value.toString()}
                    parse={parseDuration}
                    onChange={onDurationChange}
                />
                seconds
            </div>
        </div>
    );
}

export function NodeListEditor({
    nodes,
    onChange,
}: {
    nodes: NodeDesc[],
    onChange: (value: NodeDesc[]) => void,
}) {
    function updateNode(node: NodeDesc, nodeIndex: number) {
        if (node !== nodes[nodeIndex]) {
            onChange(nodes.map((oldNode, oldNodeIndex) => {
                return (oldNodeIndex == nodeIndex) ? node : oldNode;
            }));
        }
    }

    const nodeEditors = nodes.map((node, nodeIndex) => {
        return (
            <NodeEditor
                key={nodeIndex}
                nodeCount={nodes.length}
                node={node}
                nodeIndex={nodeIndex}
                onChange={node => updateNode(node, nodeIndex)}
            />
        );
    });

    return <>
        {nodeEditors}
        <button>Add Node</button>
    </>;
}

export function NodeEditor({
    nodeCount,
    node,
    nodeIndex,
    onChange,
}: {
    nodeCount: number,
    node: NodeDesc,
    nodeIndex: number,
    onChange: (value: NodeDesc) => void,
}) {
    function makeConnection(name: string, checked: boolean) {
        return (
            <label key={name}>
                <input
                    type='checkbox'
                    checked={checked}
                    readOnly
                />
                {name}
            </label>
        );
    }

    const connections = [];
    for (let dstIndex = -1; dstIndex < nodeCount; ++dstIndex) {
        connections.push(makeConnection(
            dstIndex == -1 ? 'Output' : '#' + (dstIndex + 1),
            node.connections.has(dstIndex),
        ));
    }

    const more = (() => {
        switch (node.type) {
            case 'gain':
                return <>
                    <div>Gain</div>
                    <ParamEditor
                        param={node.gain}
                        onChange={param => updateProperty(node, 'gain', param)}
                    />
                </>;
            case 'oscillator':
                return <>
                    <div>Oscillator Type</div>
                    <select
                        value={node.oscillatorType}
                        onChange={e => updateProperty(
                            node,
                            'oscillatorType',
                            e.target.value as OscillatorTypeDesc,
                        )}
                    >
                        <option value='sawtooth'>Sawtooth</option>
                        <option value='sine'>Sine</option>
                        <option value='square'>Square</option>
                        <option value='triangle'>Triangle</option>
                    </select >
                    <div>Frequency</div>
                    <ParamEditor
                        param={node.frequency}
                        onChange={param => updateProperty(node, 'frequency', param)}
                    />
                </>;
            case 'pink-noise':
                return null;
        }
    })();

    function updateType(type: string) {
        switch (type) {
            case 'gain':
                onChange({
                    type,
                    connections: node.connections,
                    gain: { initialValue: 0.5, ramps: [] },
                });
                break;
            case 'oscillator':
                onChange({
                    type,
                    connections: node.connections,
                    oscillatorType: 'sine',
                    frequency: { initialValue: 1000, ramps: [] },
                });
                break;
            case 'pink-noise':
                onChange({
                    type,
                    connections: node.connections,
                });
                break;
        }
    }

    function updateProperty<
        T extends NodeDesc,
        K extends keyof T,
        V extends T[K],
    >(node: T, name: K, value: V) {
        if (value !== node[name]) {
            onChange({
                ...node,
                [name]: value,
            });
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
            <div>Connections</div>
            <div className='spaced'>{connections}</div>
            {more}
            <button>Delete</button>
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
        return RampEditor({ ramp, rampIndex });
    });

    function updateInitialValue(initialValue: number) {
        onChange({
            ...param,
            initialValue: initialValue,
        });
    }

    return (
        <div className='props'>
            <div>Initial Value</div>
            <MappedTextInput
                value={param.initialValue}
                render={value => value.toString()}
                parse={parseInitialValue}
                onChange={updateInitialValue}
            />
            <div className='ramps'>
                {ramps}
                <button>Add Ramp</button>
            </div>
        </div>
    );
}

export function RampEditor({
    ramp,
    rampIndex,
}: {
    ramp: RampDesc,
    rampIndex: number,
}) {
    return (
        <div className='props' key={rampIndex}>
            <div>Ramp Type</div>
            <select value={ramp.type} disabled>
                <option value='exponential'>Exponential</option>
                <option value='instantaneous'>Instantaneous</option>
                <option value='linear'>Linear</option>
            </select>
            <div>Value</div>
            <input type='text' value={ramp.value} readOnly />
            <div>End Time</div>
            <div className='spaced'>
                <input type='text' value={ramp.endTime} readOnly />
                seconds
            </div>
            <button>Delete</button>
        </div>
    );
}
