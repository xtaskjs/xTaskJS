import "reflect-metadata";
import { Logger } from "@xtaskjs/common";
import { Container } from "./di";

export class Kernel {
 
    private container:Container;
    private logger:Logger;
   

    constructor(){
        
    }

 
    async boot(): Promise<void> {
        // Bootstrapping logic here
        this.container = new Container();
        await this.container.autoload("packages/common/src/logger");
    
        //this.container.register(Logger, { scope: "singleton" }); // Pass an empty object or valid ComponentMetadata properties
         this.logger = await this.container.get(Logger);
        // Simulate some async operation
        await new Promise((resolve) => setTimeout(resolve, 1000));
        this.logger.info("🚀 Kernel started successfully.");
    }

     getContainer(): Container {
        return this.container;
    }
}