import type { SettingsUI } from "../../acai/Language";
import SettingsIcon from './build/SettingsIcon.js';
import type LanguageContext from '../../acai/LanguageContext'

import {
	CognitoUserPool,
	CognitoUserAttribute,
    CognitoUser,
    AuthenticationDetails
} from 'amazon-cognito-identity-js';

export class JuntoSettingsUI implements SettingsUI {
    #userpool: CognitoUserPool;
    #poolData = {
        UserPoolId: 'us-east-2_Cd8BaNB2i', // Your user pool id here
        ClientId: '1b9479kq91gbc6vs6i0g3c2c3a', // Your client id here
    };
    #context: LanguageContext;

    constructor(context: LanguageContext) {
        this.#userpool = new CognitoUserPool(this.#poolData);
        this.#context = context;

        //AWS.config.region = '<region>';
        //@ts-ignore
        //this.#context.customSettings.awsConfig = AWS.config;
    }

    signIn(username: string, password: string) {
        var authenticationData = {
            Username: username,
            Password: password,
        };
        var authenticationDetails = new AuthenticationDetails(
            authenticationData
        );
        var userData = {
            Username: username,
            Pool: this.#userpool,
        };
        var cognitoUser = new CognitoUser(userData);

        cognitoUser.authenticateUser(authenticationDetails, {
            onSuccess: function(result) {
                this.signInSuccess(result)
            },
         
            onFailure: function(err) {
                alert(err.message || JSON.stringify(err));
            },
        });
    }

    signInSuccess(result) {
        //@ts-ignore
        this.#context.customSettings.cognitoSession = {
            accessToken: result.getAccessToken().getJwtToken(),
            idToken: result.getIdToken().getJwtToken(),
            refreshToken: result.getRefreshToken().getToken()
        };
    }

    settingsIcon(): string {
        return SettingsIcon
    }
}