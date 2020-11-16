import type Expression from "../../acai/Expression"
import type Address from '../../acai/Address'
import Agent from '../../acai/Agent'
import type { ExpressionAdapter, GetByAuthorAdapter, PublicSharing } from '../../acai/Language'
import type LanguageContext from '../../acai/LanguageContext'

const axios = require('axios').default;

//TODO implement get all adapter that can take a set of expression addresses and return the data for each of them

class ProfilePutAdapter implements PublicSharing {
    #agent: Agent
    #idToken: String
    #url: String = "http://localhost:8080/v0.3.0-alpha/"
    #context: String

    constructor(context: LanguageContext) {
        this.#agent = context.agent
        //@ts-ignore
        this.#idToken = context.customSettings.cognitoSession ? context.customSettings.cognitoSession.idToken : undefined;

        axios.defaults.headers.common['Authorization'] = this.#idToken
        axios.defaults.headers.common['Content-Type'] = "application/json"
    }

    async createPublic(data: object): Promise<Address> {
        //@ts-ignore
        let obj = JSON.parse(data)

        axios.defaults.headers.common['Authorization'] = obj.cognitoToken;

        return axios.post(this.#url + "users", obj)
            .then(function (response) {
                return response.data.user.address
            })
            .catch(function (error) {
                log_error(error)
                throw error
            })
    }
}

export default class ProfileAdapter implements ExpressionAdapter {
    #agent: Agent
    #idToken: String
    #url: String = "http://localhost:8080/v0.3.0-alpha/"

    putAdapter: PublicSharing

    constructor(context: LanguageContext) {
        this.#agent = context.agent
        //@ts-ignore
        this.#idToken = context.customSettings.cognitoSession ? context.customSettings.cognitoSession.idToken : undefined;
        this.putAdapter = new ProfilePutAdapter(context)

        axios.defaults.headers.common['Authorization'] = this.#idToken
        axios.defaults.headers.common['Content-Type'] = "application/json"
    }

    async get(address: Address): Promise<void | Expression> {
        const expression = await axios.get(this.#url + "users/" + address)
            .then(function (response) {
                return response.data
            })
            .catch(function (error) {
                log_error(error)
                throw error
            })

        return {
            author: new Agent(expression.user.address),
            timestamp: expression.user.created_at,
            data: expression.user
        }

    }

    /// Send an expression to someone privately p2p
    send_private(to: Agent, content: object) {
        console.log("send_private not implemented for junto")
    }

    /// Get private expressions sent to you
    async inbox(): Promise<Expression[]> {
        return []
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