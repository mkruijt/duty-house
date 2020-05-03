import * as React from 'react';

export interface IRadioControlComponentProps {
    name: string,
    options: { name: string, value: string }[],
    currentValue: string,
    onChange: () => {}
}

export const RadioControlComponent = (props: IRadioControlProps) => {
    const form = React.createRef();
    return <form
        onChange={() => props.onChange ? props.onChange(form.current[props.name].value) : null}
        ref={form}
        className="radio-control">
        {props.options.map((e, i) => {
            const id = e.name.toLowerCase().trim().replace(/ /g, '-');
            return <div className="form-control" key={`${props.name}-${i}`}>
                <input
                    id={id}
                    tabIndex={i}
                    defaultChecked={props.currentValue === e.value}
                    name={props.name} type="radio" value={e.value} />
                <label htmlFor={id}>{e.name}</label>
            </div>;
        })}
    </form>
};
