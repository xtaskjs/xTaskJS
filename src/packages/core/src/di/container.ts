import "reflect-metadata"
import { ComponentMetadata, getComponentMetadata } from "./component";
import { getPostConstructMethod, getPreDestroyMethod } from "./lifecycle";  
import { readdirSync , statSync } from "fs";
import { join } from "path";
import { ManagedInstance } from "./managedinstance";


export class Container{
    private providers = new Map<any, () => any>();
    private singletons = new Map<any, any>();
    public managedInstances : ManagedInstance[] = [];

    // SCAN FOLDER BASE DIR FOR @Service() AND @Component()

    async autoload(baseDir = "packages"){
        const files = await this.scanDir(join(process.cwd(), baseDir));
    
        for (const file of files) {
             const name = file.toString();
            console.log("Importing:", name);
            name.includes("test") && console.log("Skipping test file:", name);
            if (name.includes("test")) continue; //skip test files
            const module = await import(file);
            for ( const key in Object.keys(module)) {
                const candidate = module[key];
                console.log("Candidate:", candidate);
                if (typeof candidate !== "function") continue;

                const meta: ComponentMetadata | undefined = getComponentMetadata(candidate);
                if (!meta || (meta.condition && !meta.condition())) continue;
                
                this.register(candidate, meta);
            }
        }
    
    }

    // Register aa class with the container
    
    private register(target: any, meta: ComponentMetadata){
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
    
    // Scan folder recursively for .ts or .js files
    public async scanDir(dir: string): Promise<string[]> {
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