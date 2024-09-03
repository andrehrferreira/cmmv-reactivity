export type EffectFn = () => void;
export type SubscribeFn = (newValue: any, oldValue: any) => void;

export let activeEffect: EffectFn | null = null;

const targetMap = new WeakMap<any, Map<any, Set<EffectFn>>>();
const subscribeMap = new WeakMap<any, Map<any, SubscribeFn[]>>();

function track(target: any, key: any) {
    if (!activeEffect) return;

    let depsMap = targetMap.get(target);

    if (!depsMap) {
        depsMap = new Map();
        targetMap.set(target, depsMap);
    }

    let dep = depsMap.get(key);

    if (!dep) {
        dep = new Set();
        depsMap.set(key, dep);
    }

    dep.add(activeEffect);
}

function trigger(target: any, key: any) {
    const depsMap = targetMap.get(target);

    if (!depsMap) return;

    const dep = depsMap.get(key);

    if (dep) {
        dep.forEach((effect) => {
            if (effect !== activeEffect) {
                effect();
            }
        });
    }

    const subMap = subscribeMap.get(target);
    if (subMap) {
        const subs = subMap.get(key);
        if (subs) {
            subs.forEach(sub => sub(target[key], target[key])); 
        }
    }
}

export function reactive<T extends object>(target: T): any {
    const proxy = new Proxy(target, {
        get(target, key, receiver) {
            const result = Reflect.get(target, key, receiver);

            if (typeof result === 'function') 
                return result.bind(receiver); 
            
            track(target, key);
            return (typeof result === 'object' && result !== null) ? reactive(result) : result;
        },

        set(target, key, value, receiver) {
            const oldValue = target[key as keyof T];
            
            if (typeof value === 'function') 
                return Reflect.set(target, key, value.bind(receiver), receiver);
                    
            const result = Reflect.set(target, key, value, receiver);
        
            if (oldValue !== value) 
                trigger(target, key);
            
            return result;
        }        
    });

    return proxy;
}

export function effect(fn: EffectFn) {
    let executingEffect = false;

    activeEffect = () => {
        if (!executingEffect) {
            executingEffect = true;
            try {
                fn();
            } finally {
                executingEffect = false;
            }
        }
    };
    activeEffect();
    activeEffect = null;
}

export function ref<T>(value: T) {
    return reactive({ value });
}

export function subscribe<T extends object>(
    target: T,
    key: keyof T,
    callback: SubscribeFn
) {
      let subMap = subscribeMap.get(target);
  
      if (!subMap) {
          subMap = new Map();
          subscribeMap.set(target, subMap);
      }
  
      let subs = subMap.get(key);
  
      if (!subs) {
          subs = [];
          subMap.set(key, subs);
      }
  
      subs.push(callback);
}