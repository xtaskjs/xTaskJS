import "reflect-metadata";

const AUTOWIRED_KEY = Symbol("xtaskjs:autowired");
const AUTOWIRED_PROPS_KEY = Symbol("xtaskjs:autowired_props");

export interface AutoWiredMetaData {
    type: any;
    required: boolean;
    quilifier?: string;
}

export function AutoWired(options: { required?: boolean; quilifier?: string } = {}) {
    return function (target: any, propertyKey: string | symbol) {
        const type = Reflect.getMetadata("design:type", target, propertyKey);
        const metaData: AutoWiredMetaData = {
            type,
            required: options.required ?? true,
            quilifier: options.quilifier,
        };

        // Store metadata for the property
        Reflect.defineMetadata(AUTOWIRED_KEY, metaData, target, propertyKey);

        // Store list of autowired properties on the class prototype
        const existingProps= 
            Reflect.getMetadata(AUTOWIRED_PROPS_KEY, target.constructor) || [];
        if (!existingProps.includes(propertyKey)) {
            existingProps.push(propertyKey);
            Reflect.defineMetadata(AUTOWIRED_PROPS_KEY, existingProps, target.constructor);
        }
    };
}

export function getAutoWiredProperties(target: any): Map<string | symbol, AutoWiredMetaData>{

    const properties = new Map<string | symbol, AutoWiredMetaData>();
    let currentClass = target.contructor;

    while (currentClass && currentClass !== Object) {
        const autowiredProps = Reflect.getMetadata(AUTOWIRED_PROPS_KEY, currentClass) || [];
        const prototype = currentClass.prototype;

        autowiredProps.forEach((prop: string | symbol) => {
                const metaData = Reflect.getMetadata(AUTOWIRED_KEY, prototype, prop);
                if (metaData && !properties.has(prop)) {
                    properties.set(prop, metaData);
                }
            });

        currentClass = Object.getPrototypeOf(currentClass);
          
    }

    return properties;
    
}