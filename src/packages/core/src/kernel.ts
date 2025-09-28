import { Logger } from "@xtaskjs/common";
import { Container } from "./di";

export class Kernel {
 
    private container:Container;
    private logger:Logger;
   

    constructor(){
        
    }

 
    async boot(): Promise<void> {
        // Bootstrapping logic here
        console.log("Kernel is booting...");
        const container = new Container();
        container.autoload("packages");
        this.logger = container.get(Logger);
        // Simulate some async operation
        await new Promise((resolve) => setTimeout(resolve, 1000));
        console.log("Kernel has booted.");
        container.destroy();
    }
   
     getLogger() { return this.logger; }
}