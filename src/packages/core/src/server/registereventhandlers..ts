import "reflect-metadata";
import { ApplicationLifeCycle } from "./application-lifecycle";
import { EventHandlerMeta } from "./eventhandlermeta";
import { RunnerMeta } from "./runnermeta";

const HANDLERS_KEY = Symbol("eventHandlers");
const RUNNERS_KEY = Symbol("runners");

export function registerEventHandlers(instance: any, app:ApplicationLifeCycle) {
  const handlers: EventHandlerMeta[] = Reflect.getMetadata(HANDLERS_KEY, instance.constructor) || [];
  for (const { phase, method, priority } of handlers.sort((a, b) => b.priority - a.priority)) {
    app.on(phase, async (...args) => (instance as any)[method](...args), priority);
  }

  const runners: RunnerMeta[] = Reflect.getMetadata(RUNNERS_KEY, instance.constructor) || [];
  for (const { type, method, priority } of runners.sort((a, b) => b.priority - a.priority)) {
    app.registerRunner((args) => (instance as any)[method](...args), type, priority);
  }
}