import { Kernel} from "@xtaskjs/core";

export async function bootstrap(): Promise<Kernel> {
    const kernel = new Kernel();
    await kernel.boot();
    return kernel;
}