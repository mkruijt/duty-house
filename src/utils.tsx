
export const caseSwitch = (param: string, cases: {}) => cases[param] || cases['default'] || null;
