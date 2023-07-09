import * as React from 'react';

export function DeferredTextInput({
    value,
    onChange,
}: {
    value: string,
    onChange: (value: string) => void,
}) {
    const [text, setText] = React.useState('');

    React.useLayoutEffect(() => {
        setText(value);
    }, [value]);

    function update() {
        if (text !== value) {
            onChange(text);
        }
    }

    return <input
        type='text'
        value={text}
        onChange={e => setText(e.target.value)}
        onBlur={() => update()}
    />;
}
