import type Expression from "../../acai/Expression";
import type Address from '../../acai/Address';
import Agent from '../../acai/Agent';
import type { ExpressionAdapter, GetByAuthorAdapter, PublicSharing } from '../../acai/Language';
import type LanguageContext from '../../acai/LanguageContext';

const axios = require('axios').default;

export default class PerspectiveGetByAuthorAdapter implements GetByAuthorAdapter {
    #agent: Agent
    #idToken: String
    #url: String = "http://localhost:8080/v0.3.0-alpha/"
    #context: String

    constructor(context: LanguageContext) {
        this.#agent = context.agent
        //@ts-ignore
        this.#idToken = context.customSettings.cognitoSession ? context.customSettings.cognitoSession.idToken : undefined;
        //@ts-ignore
        this.#context = context.customSettings.context ? this.customSettings.context : "Collective";

        axios.defaults.headers.common['Authorization'] = this.#idToken
        axios.defaults.headers.common['Content-Type'] = "application/json"
    }

    ///NOTE: here we cannot actually use pagination on this endpoint as the Junto-API requires that we send a last_timestamp parameter to the endpoint.
    ///Here we can see its not actually possible to do this.
    ///Get expressions authored by a given Agent/Identity
    async getByAuthor(author: Agent, count: number, page: number): Promise<void | Expression[]> {
        const expressions = await axios.get(this.#url + "users/" + author.did + "/perspectives")
            .then(function (response) {
                return response.data
            })
            .catch(function (error) {
                log_error(error)
                throw error
            })
        expressions.result.forEach(function(part, index, expressionsArray) {
            expressionsArray[index] = {
                author: new Agent(expressionsArray[index].creator),
                timestamp: expressionsArray[index].created_at,
                data: expressionsArray[index]
            };
        });
        return expressions
    }
}

function log_error(error) {
    if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.log(error.response.data);
        console.log(error.response.status);
        console.log(error.response.headers);
    } else if (error.request) {
        // The request was made but no response was received
        // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
        // http.ClientRequest in node.js
        console.log(error.request);
    } else {
        // Something happened in setting up the request that triggered an Error
        console.log('Error', error.message);
    }
        console.log(error.config);
}