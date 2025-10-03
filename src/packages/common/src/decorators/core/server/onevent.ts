import { LifeCyclePhase , EventHandlerMeta } from  "@xtaskjs/core"; 


const HANDLERS_KEY = Symbol("eventHandlers");
const RUNNERS_KEY = Symbol("runners");

export function OnEvent(phase: LifeCyclePhase, priority = 0): MethodDecorator {
  return (target, propertyKey) => {
    const handlers: EventHandlerMeta[] = Reflect.getMetadata(HANDLERS_KEY, target.constructor) || [];
    handlers.push({ phase, method: propertyKey, priority });
    Reflect.defineMetadata(HANDLERS_KEY, handlers, target.constructor);
  };
}
