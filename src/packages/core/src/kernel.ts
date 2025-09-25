import { Logger } from "@xtaskjs/common";

export class Kernel {
 
    private logger: Logger;

    constructor(){
        this.logger = new Logger();
    }

 
    async boot(): Promise<void> {
        // Bootstrapping logic here
        console.log("Kernel is booting...");
        // Simulate some async operation
        await new Promise((resolve) => setTimeout(resolve, 1000));
        console.log("Kernel has booted.");
    }
   
     getLogger() { return this.logger; }
}