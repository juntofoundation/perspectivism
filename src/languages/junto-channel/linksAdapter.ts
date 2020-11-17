import Expression from "../../acai/Expression";
import type { LinksAdapter, NewLinksObserver } from "../../acai/Language";
import type { LinkQuery } from "../../acai/Links";
import Agent from "../../acai/Agent";
import type LanguageContext from "../../acai/LanguageContext";
import type ExpressionRef from "../../acai/ExpressionRef";

const axios = require('axios').default;

/// This link language is used to represent the links for a given channel of communication on Junto.
///
/// How can this link language be used to represent multiple channels? Ontologically a perspective/linklanguage should represent one social space
/// but on the API its possible to query by multiple channels at once, can we represent that here? Perhaps we need a link language for each number/combination
/// of channel queries. i.e junto-channel, junto-two-channel, ... junto-n-channel?
///
/// Inside the constructor I am also allowing the passing of a context so we can make channel queries for any given context using this language. 
///
/// Again we also have the same problem as with other languages where I am unable to pass pagination data inside; solution might be to create some custom
/// string syntax for the predicate 

export class JuntoChannelAdapter implements LinksAdapter {
    #agent: Agent
    #idToken: String
    #url: String = "http://localhost:8080/v0.3.0-alpha/"
    #context: String
    #represents: Expression | undefined
    #contextType: String | undefined

    constructor(context: LanguageContext) {
        this.#agent = context.agent
        //@ts-ignore
        this.#idToken = context.customSettings.cognitoSession ? context.customSettings.cognitoSession.idToken : undefined;
        //@ts-ignore
        this.#represents = context.customSettings.represents ? context.customSettings.represents : undefined;
        //@ts-ignore
        this.#context = context.customSettings.context ? context.customSettings.context : undefined;
        //@ts-ignore
        this.#contextType = context.customSettings.contextType ? context.customSettings.contextType : "";

        axios.defaults.headers.common['Authorization'] = this.#idToken
        axios.defaults.headers.common['Content-Type'] = "application/json"
    }

    writable() {
        return true
    }

    public() {
        return true
    }

    others() {
        //Essentially sharing with one other "agent" which is the Junto backend; this is not in DID format just yet
        //return [new Agent("https://api.junto.foundation")]
        return []
    }

    async addLink(link: Expression) {
        throw Error("You can not add links to this link language!")
    }

    async updateLink(oldLinkExpression: Expression, newLinkExpression: Expression) {
        throw Error("You cannot update a link on this link language")
    }

    async removeLink(link: Expression) {
        throw Error("You cannot remove links from this language")
    }

    async getLinks(query: LinkQuery): Promise<Expression[]> {
        let out: Array<Expression> = [] as Expression[];

        //@ts-ignore
        let results = await axios.get(this.#url + "/expressions?pagination_arguments=0&context=" + this.#context + "&channel1=" + query.predicate + "&context_type" + this.#contextType)
            .then(function (response) {
                return response.data
            })
            .catch(function (error) {
                log_error(error)
                throw error
            });
        results.results.forEach(element => {
            let exp = new Expression()
            exp.author = new Agent("api.junto.foundation");
            exp.timestamp = element.created_at;
            exp.data = element;
            out.push(exp);
        });

        return out
    }

    addCallback(callback: NewLinksObserver) {
        //throw Error("No callbacks can be added to this link language")
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