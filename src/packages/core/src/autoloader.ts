import "reflect-metadata";

import { Container } from "./di/container";
import { getComponentMetadata } from "./di/component";
import { readdirSync , statSync } from "fs";
import { join} from "path";
import { ManagedInstance } from "./di/managedinstance";
import { getPostConstructMethod, getPreDestroyMethod } from "./di/lifecycle";

export class LifeCycleContainer extends Container {
    private managedInstances: ManagedInstance[] = [];

    async autoload(baseDir = "./"){
        const files = await this.scanDir(join(process.cwd(), baseDir));
        
        for (const file of files) {

                const module = await import(file);
                
                for (const key in Object.keys(module)) {
                    const candidate = module[key];
                    if (typeof candidate !== "function") continue;
                    const metadata = getComponentMetadata(candidate);
                    if (!metadata || (metadata.condition && !metadata.condition())) continue;
                    const paramTypes: any[] = 
                        Reflect.getMetadata("design:paramtypes", candidate) || [];
                    const provider = () => {
                        const dependencies = paramTypes.map((dep) => this.get(dep));
                        const instance = new candidate(...dependencies);
                        
                        const postMethod = getPostConstructMethod(instance);
                        if (postMethod && typeof instance[postMethod] === "function") {
                            instance[postMethod]();
                        }
                        
                        const preMethod = getPreDestroyMethod(instance);
                        if (preMethod && typeof instance[preMethod] === "function") {
                            this.managedInstances.push({
                                instance,
                                preDestroy: () => instance[preMethod](),
                            });
                        }
                        
                        return instance;
                    };

                    const binding = this.bind(candidate).toProvider(provider);
                    if (metadata.scope !== "transient") binding.inSingletonScope();
                }
            }
        }
    
    destroy(){
        this.managedInstances.reverse().forEach((m) => m.preDestroy?.());
        this.managedInstances = [];
    }

    private async scanDir(dir:string): Promise<string[]> {
        let results: string[] = [];
        const list = readdirSync(dir);
        for (const file of list) {
            const filePath = join(dir, file);       
            const stat = statSync(filePath);
            if (stat && stat.isDirectory()) {
                const res = await this.scanDir(filePath);
                results = results.concat(res);
            } else if (/\.(ts|js)$/.test(file)) {
                    results.push(filePath);
                }
            }
        return results;
    }
}