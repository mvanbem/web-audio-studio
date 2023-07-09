import * as React from 'react';

export type ParseResult<T> = ParseResultOk<T> | ParseResultError;

export interface ParseResultOk<T> {
    value: T;
    error: null;
}

export interface ParseResultError {
    value: null;
    error: React.ReactNode;
}

export function MappedTextInput<T>({
    value,
    render,
    parse,
    onChange,
}: {
    value: T,
    render: (value: T) => string,
    parse: (text: string) => ParseResult<T>,
    onChange: (value: T) => void,
}) {
    const [text, setText] = React.useState('');

    React.useLayoutEffect(() => {
        setText(render(value));
    }, [value]);

    const parseResult = parse(text);

    function update() {
        if (parseResult.value !== null && parseResult.value !== value) {
            onChange(parseResult.value);
        } else {
            setText(render(value));
        }
    }

    return (
        <>
            <input
                type='text'
                value={text}
                onChange={e => setText(e.target.value)}
                onBlur={() => update()}
            />
            {parseResult.error && (<div className='validation-error'>{parseResult.error}</div>)}
        </>
    );
}
