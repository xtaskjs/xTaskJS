import "reflect-metadata"
import { getComponentMetadata } from "./component";
import { getPostConstructMethod, getPreDestroyMethod } from "./lifecycle";  
import { readdirSync , statSync } from "fs";
import { join } from "path";
import { ManagedInstance } from "./managedinstance";


export class Container{
    private providers = new Map<any, () => any>();
    private singletons = new Map<any, any>();
    private managedInstances : ManagedInstance[] = [];

    async autoload(baseDir = "./"){
        const files = await this.scanDir(join(process.cwd(), baseDir));
    
        for (const file of files) {
            const module = await import(file);
            for ( const key in Object.keys(module)) {
                const candidate = module[key];
                if (typeof candidate !== "function") continue;

                const metadata = getComponentMetadata(candidate) | undefined = getComponentMetadata(candidate);
                if (!metadata || (metadata.condition && !metadata.condition())) continue;
                
                this.register(candidate, metadata);
            }
        }
    
    }
    
    private register(target: any, meta: ComponentMetada){
        const paramTypes: any[] =
            Reflect.getMetadata("design:paramtypes", target) || [];

        
        const provider = () => {
            //Resolve dependencies
            const dependencies = paramTypes.map((dep) => this.get(dep));
            const instance = new target(...dependencies);

            //PostConstruct
            const postMethod = getPostConstructMethod(instance);
            if (postMethod && typeof instance[postMethod] === "function") {
                instance[postMethod]();
            }

            //PreDestroy
            const preMethod = getPreDestroyMethod(instance);
            if (preMethod && typeof instance[preMethod] === "function") {
                this.managedInstances.push({
                    instance,
                    preDestroy: () => instance[preMethod](),
                });
            }
            
            return instance;
        }

        if (meta.scope === "transient") {
            this.providers.set(target, provider);
        } else { //singleton by default
            this.providers.set(target,()=> {
                if (!this.singletons.has(target)) {
                    const instance = provider();
                    this.singletons.set(target, instance);
                }

                return this.singletons.get(target);
            })
        }
    }

    // Get instance of class
    get<T>(target: new (...args: any[]) => T): T {
        const provider = this.providers.get(target);
        if (!provider) {
            throw new Error(`No provider found for ${target.name}`);
        }
        return provider();
    }

    // Execute all @PreDestroy in reverse order

    destroy() {
        this.managedInstances.reverse().forEach((m) => m.preDestroy?.());
        this.managedInstances = [];
        this.singletons.clear();
        this.providers.clear();
    }
    
    resolve<T>(name: string): T {
        const service = this.services.get(name);
        if (!service) {
            throw new Error(`No provider found for key: ${name}`);
        }
        return service;
    } 
    
    // Scan folder recursively for .ts or .js files
    private async scanDir(dir: string): Promise<string[]> {
        let results: string[] = [];
        for (const file of readdirSync(dir)) {
            const full = join (dir, file);
            const stat = statSync(full);
            if (stat && stat.isDirectory()) {
                const res = await this.scanDir(full);
                results = results.concat(res);
            } else if (/\.(ts|js)$/.test(file)) {
                results.push(full);
            }
        }
        return results;
    }
}