import type Address from '../../acai/Address'
import Agent from '../../acai/Agent'
import type Expression from '../../acai/Expression'
import type { ExpressionAdapter, GetByAuthorAdapter, PublicSharing } from '../../acai/Language'
import type LanguageContext from '../../acai/LanguageContext'

const axios = require('axios').default;

//TODO implement get all adapter that can take a set of expression addresses and return the data for each of them

class ShortFormPutAdapter implements PublicSharing {
    #agent: Agent
    #idToken: String
    #url: String = "http://3.22.168.239/v0.2.3-alpha/"
    #context: String

    constructor(context: LanguageContext) {
        this.#agent = context.agent
        //@ts-ignore
        this.#idToken = context.customSettings.cognitoSession ? context.customSettings.cognitoSession.idToken : undefined;
        //@ts-ignore
        this.#context = context.customSettings.context ? this.customSettigs.context : "Collective";

        axios.defaults.headers.common['Authorization'] = this.#idToken
        axios.defaults.headers.common['Content-Type'] = "application/json"
    }

    async createPublic(shortForm: object): Promise<Address> {
        const expressionPostData = {
            type: "ShortForm",
            expression_data: {
                background: [],
                body: shortForm
            },
            channels: [],
            context: this.#context
        }

        //Todo post the actual data
        return axios.post(this.#url + "expressions", expressionPostData)
            .then(function (response) {
                return response.data.address
            })
            .catch(function (error) {
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
                throw error
              })
    }
}

export default class ShortFormAdapter implements ExpressionAdapter {
    #agent: Agent
    #idToken: String
    #url: String = "http://3.22.168.239/v0.2.3-alpha/"

    putAdapter: PublicSharing

    constructor(context: LanguageContext) {
        this.#agent = context.agent
        //@ts-ignore
        this.#idToken = context.customSettings.cognitoSession ? context.customSettings.cognitoSession.idToken : undefined;
        this.putAdapter = new ShortFormPutAdapter(context)

        axios.defaults.headers.common['Authorization'] = this.#idToken
        axios.defaults.headers.common['Content-Type'] = "application/json"
    }

    async get(address: Address): Promise<void | Expression> {
        console.log("getting exp", address);
        const expression = await axios.get(this.#url + "expressions/" + address)
            .then(function (response) {
                return response.data
            })
            .catch(function (error) {
                log_error(error)
                throw error
            })
        console.log("got", expression);

        return {
            author: new Agent(expression.creator.address),
            timestamp: expression.created_at,
            data: expression.expression_data
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