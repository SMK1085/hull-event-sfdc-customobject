import { Application } from "express";
import cors from "cors";
import actions from "./actions";

const server = (app: Application): Application => {
    app.use("/auth", actions.oauth());
    // CORS enabled endpoints for manifest.json
    app.get("/schema/customobjects", cors(), actions.fetchCustomObjects);
    app.get("/schema/fields/reference", cors(), actions.fetchFieldsReference);
    app.get("/schema/fields/unique", cors(), actions.fetchFieldsUnique);
    app.get("/schema/fields/updateable", cors(), actions.fetchFieldsUpdateable);
    return app;
};

export default server;