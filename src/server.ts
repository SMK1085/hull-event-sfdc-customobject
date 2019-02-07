import _ from "lodash";
import { Application } from "express";
import cors from "cors";
import { notifHandler, smartNotifierHandler } from "hull/lib/utils";
import actions from "./actions";

const server = (app: Application): Application => {
    // OAuth 2.0 Flow
    app.use("/auth", actions.oauth());
    // Hull platform handler endpoints
    app.post("/smart-notifier", smartNotifierHandler({
        handlers: {
          "user:update": actions.userUpdate({
            flowControl: {
              type: "next",
              size: parseInt(_.get(process.env.FLOW_CONTROL_SIZE, "200"), 10),
              in: parseInt(_.get(process.env.FLOW_CONTROL_IN, "5"), 10),
              in_time: parseInt(_.get(process.env.FLOW_CONTROL_IN_TIME, "60000"), 10)
            }
          })
        }
      }));
    
      app.post("/batch", notifHandler({
        userHandlerOptions: {
          maxSize: 200
        },
        handlers: {
          "user:update": actions.userUpdate({ isBatch: true })
        }
      }));

    // CORS enabled endpoints for manifest.json
    app.get("/schema/customobjects", cors(), actions.fetchCustomObjects);
    app.get("/schema/fields/reference", cors(), actions.fetchFieldsReference);
    app.get("/schema/fields/unique", cors(), actions.fetchFieldsUnique);
    app.get("/schema/fields/updateable", cors(), actions.fetchFieldsUpdateable);
    return app;
};

export default server;