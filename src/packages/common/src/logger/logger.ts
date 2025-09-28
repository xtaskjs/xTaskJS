import { Service } from '../../../core/src/di/stereotypes';
export class Logger {

    constructor() {}
    
    info(message: string): void {
        console.log(`INFO: ${message}`);
    }

    warn(message: string): void {
        console.warn(`WARN: ${message}`);
    }

    error(message: string): void {
        console.error(`ERROR: ${message}`);
    }
}