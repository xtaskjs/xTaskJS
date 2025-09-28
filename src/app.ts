import {Bootstrap} from "@xtaskjs/core";
import { Logger } from "@xtaskjs/common";

async function main() {
    const kernel = await Bootstrap();
    const container = kernel.getContainer();
    const logger: Logger = container.get(Logger);
    logger.info(" 🚀Application has started.");
    // Destoy the container to trigger PreDestroy methods before exiting
    container.destroy();
}

main().catch(err => {
    console.error("Error starting the application:", err);
}); 