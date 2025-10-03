import { LifeCyclePhase } from "./lifecycle-events";
import *  as os from "os";
import * as process from "process";

interface Listener{
    fn: (...args: any[]) => any | Promise<any>;
    priority:number;
}

export class ApplicationLifeCycle {
    private listeners: Map<LifeCyclePhase, Listener[]> = new Map();
    private metricsInterval?: NodeJS.Timeout;
    private runners : { type: "ApplicationRunner" | "CommandLineRunner"; priority:number; fn:(args?:string[]) => any }[] = [];

    constructor() {}

    public on(event: LifeCyclePhase, Listener: (...args: any[]) => any | Promise<any>, priority = 0) {
    const list = this.listeners.get(event) || [];
    list.push({ fn: Listener, priority });
    this.listeners.set(event, list.sort((a, b) => b.priority - a.priority));
    }

    public registerRunner(fn: (args?:string[]) => any, type: "ApplicationRunner" | "CommandLineRunner" = "ApplicationRunner", priority = 0) {
        this.runners.push({ fn, type, priority});
        this.runners.sort((a,b) => b.priority - a.priority);
    }
    
    public async emit(event: LifeCyclePhase, payload?:any) {
        const list = this.listeners.get(event) || [];
        for (const { fn } of list) {
            await Promise.resolve(fn(payload));
        }
    }

    public async runRuners(type: "ApplicationRunner" | "CommandLineRunner") {
        for (const runner of this.runners.filter(r => r.type === type)) {
            await Promise.resolve(runner.fn(process.argv.slice(2)));
        }
    }

    public async boot(startFn: () => Promise<void>) {
       try{
            await this.emit("starting");
            await this.emit("environmentPrepared", { env: process.env, args: process.argv });
            await this.emit("contextPrepared");
            
            await this.emit("serverStarting");

            await startFn();

            await this.emit("serverStarted");

            this.metricsInterval = setInterval(async() => {
                await this.emit("memoryReport", process.memoryUsage());
                await this.emit("cpuReport",{
                    loadavg:os.loadavg(),
                    usage: process.cpuUsage()
                });
            }, 5000); //every minute
            
            await this.runRuners("ApplicationRunner");
            await this.emit("ready");
            await this.runRuners("CommandLineRunner");
        } catch (error){
            await this.emit("error", error);
            throw error;
        }
            
    }

    public async stop() {
        if(this.metricsInterval){
            clearInterval(this.metricsInterval);
          
        }
    }
}