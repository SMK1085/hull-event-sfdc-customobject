import _ from "lodash";
import IHullUserUpdateMessage from "../common/data/user-update-message";
import SyncAgent from "../core/sync-agent";
import IHullAccount from "../common/data/account";

const userUpdateHandlerFactory = (options: any = {}): (ctx: any, messages: IHullUserUpdateMessage[]) => Promise<any> => {
    const {
        flowControl = null,
        isBatch = false
    } = options;
    return function userUpdateHandler(ctx: any, messages: IHullUserUpdateMessage[]): Promise<any> {
        if (ctx.smartNotifierResponse && flowControl) {
            ctx.smartNotifierResponse.setFlowControl(flowControl);
        }
        
        const agent = new SyncAgent(ctx.client, ctx.ship, ctx.metric);
        const enrichedMessages = messages
            .map((m) => {
            if (!_.has(m.user, "account")) {
                (m.user as any).account = _.get(m, "account") as IHullAccount;
            }
            return m;
            });

        if (enrichedMessages.length > 0) {
            return agent.sendUserMessages(enrichedMessages, isBatch)
                        .catch(err => {
                            ctx.client.logger.error("outgoing.job.error", err)
                        });
        } 

        return Promise.resolve();
    };
}

export default userUpdateHandlerFactory;
