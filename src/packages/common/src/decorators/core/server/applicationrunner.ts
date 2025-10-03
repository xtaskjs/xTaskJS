import { RunnerMeta } from '@xtaskjs/core';

const HANDLERS_KEY = Symbol("eventHandlers");
const RUNNERS_KEY = Symbol("runners");

export function ApplicationRunner(priority = 0): MethodDecorator {
  return (target, propertyKey) => {
    const runners: RunnerMeta[] = Reflect.getMetadata(RUNNERS_KEY, target.constructor) || [];
    runners.push({ type: "ApplicationRunner", method: propertyKey, priority });
    Reflect.defineMetadata(RUNNERS_KEY, runners, target.constructor);
  };
}
