import {bootstrap} from "@xtaskjs/core";

async function main() {
    const kernel = await bootstrap();
    const logger = kernel.getLogger();
    logger.info("🚀 Application xTaskJS started successfully.");
}

main().catch(err => {
    console.error("Error starting the application:", err);
}); 