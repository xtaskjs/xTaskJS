export class Container{
    private services = new Map<string, any>();
    
    register<T>(name: string, service: T): void {
        this.services.set(name, service);
    }

    resolve<T>(name: string): T {
        const service = this.services.get(name);
        if (!service) {
            throw new Error(`No provider found for key: ${name}`);
        }
        return service;
    }   
}