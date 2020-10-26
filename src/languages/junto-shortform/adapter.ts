import type Address from '../../acai/Address'
import Agent from '../../acai/Agent'
import type Expression from '../../acai/Expression'
import type { ExpressionAdapter, GetByAuthorAdapter, PublicSharing } from '../../acai/Language'
import type LanguageContext from '../../acai/LanguageContext'

import axios from 'axios'

//TODO implement get all adapter that can take a set of expression addresses and return the data for each of them

class ShortFormPutAdapter implements PublicSharing {
    #agent: Agent
    #accessToken: String
    #url: String = "https://api.junto.foundation/v0.2.2-alpha/"

    constructor(context: LanguageContext) {
        this.#agent = context.agent
        //@ts-ignore
        this.#accessToken = context.customSettings.cognitoSession ? context.customSettings.cogntioSession.accessToken : undefined;

        axios.defaults.headers.common['authorization'] = this.#accessToken
        axios.defaults.headers.common['host'] = this.#url
    }

    async createPublic(shortForm: object): Promise<Address> {
        const expression = {
            author: this.#agent.did,
            timestamp: new Date().toString(),
            data: shortForm,
        }

        //Todo post the actual data
        return axios.post(this.#url + "expressions")
            .then(function (response) {
                return response.data.address
            })
    }
}

export default class ShortFormAdapter implements ExpressionAdapter {
    #agent: Agent
    #accessToken: String
    #url: String = "https://api.junto.foundation/v0.2.2-alpha/"

    putAdapter: PublicSharing

    constructor(context: LanguageContext) {
        this.#agent = context.agent
        //@ts-ignore
        this.#accessToken = context.customSettings.cognitoSession ? context.customSettings.cogntioSession.accessToken : undefined;
        this.putAdapter = new ShortFormPutAdapter(context)

        axios.defaults.headers.common['authorization'] = this.#accessToken
        axios.defaults.headers.common['host'] = this.#url
    }

    async get(address: Address): Promise<void | Expression> {
        const expression = await axios.get(this.#url + "expressions/" + address)
            .then(function (response) {
                return response.data
            })

        return {
            author: new Agent(expression.creator.address),
            timestamp: expression.created_at,
            data: expression.expression_data
        }

    }

    /// Get expressions authored by a given Agent/Identity
    async get_by_author(author: Agent, count: number, page: number): Promise<void | Expression> {
        const expressions = await axios.get(this.#url + "users/" + author.did + "?pagination_position=" + page.toString)
            .then(function (response) {
                return response.data
            })
        expressions.result.forEach(function(part, index, expressionsArray) {
            expressionsArray[index] = {
                author: new Agent(expressionsArray[index].creator.address),
                timestamp: expressionsArray[index].created_at,
                data: expressionsArray[index].expression_data
            };
        });
        return expressions
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