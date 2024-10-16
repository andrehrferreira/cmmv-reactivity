const evalCache: Record<string, Function> = Object.create(null);

export const evaluate = (scope: any, exp: string, el?: Node) =>
  execute(scope, `return(${exp})`, el)
  
export const execute = (scope: any, exp: string, el?: Node) => {
    const fn = evalCache[exp] || (evalCache[exp] = toFunction(exp));

    try {
        return fn(scope, el);
    } catch (e) {
        return () => {};
    }
}
  
export const toFunction = (exp: string): Function => {
    try {
        return new Function(`$data`, `$el`, `with($data){${exp}}`);
    } catch (e) {
        return () => {};
    }
}
  