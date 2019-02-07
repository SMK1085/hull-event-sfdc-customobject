import { oAuthHandler } from "hull/lib/utils";
import { Strategy } from "passport-forcedotcom";
import { Request, Response, NextFunction } from "express";
import _ from "lodash";

const DEFAULT_OAUTHURL = "https://login.salesforce.com";

const oauthAction = () => {
    return (request: Request, response: Response, next: NextFunction) => {
        const oAuthUrl: string = _.get(request, "hull.ship.private_settings.salesforce_oauth_url", DEFAULT_OAUTHURL);
        oAuthHandler({
            name: "Salesforce",
            Strategy,
            tokenInUrl: true,
            options: {
                clientID: _.get(request, "hull.ship.private_settings.client_id", ""),
                clientSecret: _.get(request, "hull.ship.private_settings.client_secret", ""),
                authorizationURL: `${oAuthUrl}/services/oauth2/authorize`,
                tokenURL: `${oAuthUrl}/services/oauth2/token`,
                scope: ["refresh_token", "api"] // App Scope
            },
            isSetup: ({ query, hull }: any) => {
                if (query.reset) return Promise.reject();
                // tslint:disable-next-line:variable-name
                const access_token = _.get(hull, "ship.private_settings.access_token", null);
                // tslint:disable-next-line:variable-name
                const refresh_token = _.get(hull, "ship.private_settings.refresh_token", null);
                // tslint:disable-next-line:variable-name
                const instance_url = _.get(hull, "ship.private_settings.instance_url", null);
                
                if (access_token && refresh_token && instance_url) {
                    return Promise.resolve(hull.ship);
                }
                return Promise.reject();
            },
            onLogin: (req: Request) => {
                (req as any).authParams = _.merge({}, req.body, req.query);
                return Promise.resolve((req as any).authParams);
            },
            onAuthorize: (req: Request) => {
                const { helpers } = (req as any).hull;
                const refreshToken = _.get(req, "account.refreshToken", null);
                // tslint:disable-next-line:variable-name
                const access_token = _.get(req, "account.params.access_token", null);
                // tslint:disable-next-line:variable-name
                const instance_url = _.get(req, "account.params.instance_url", null);
                // tslint:disable-next-line:variable-name
                const salesforce_login = _.get(req, "account.profile._raw.username");
                return helpers.updateSettings({
                  refresh_token: refreshToken,
                  access_token,
                  instance_url,
                  salesforce_login
                });
            },
            views: {
                login: "login.html",
                home: "home.html",
                failure: "failure.html",
                success: "success.html"
            }
        })(request, response, next);
    };
}

export default oauthAction;