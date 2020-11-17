import Expression from "../../acai/Expression";
import type { LinksAdapter, NewLinksObserver } from "../../acai/Language";
import type { LinkQuery } from "../../acai/Links";
import Agent from "../../acai/Agent";
import type LanguageContext from "../../acai/LanguageContext";
import type ExpressionRef from "../../acai/ExpressionRef";

const axios = require('axios').default;

/// This link language is used to represent the links for a SINGLE group; language should be replicated for each junto-group that it should represent

/// Right now in this link language and many others we are using some keys inside the expression to determine what kind of operation fn caller is trying to make.
/// Might be more wise to try and convert incoming Expression or object into some set of interfaces as to provide a more structured interface over link languages 
/// that can be used internally.

export class JuntoCommentLinkAdapter implements LinksAdapter {
    #agent: Agent
    #idToken: String
    #url: String = "http://localhost:8080/v0.3.0-alpha/"
    #context: String
    #represents: Expression | undefined

    constructor(context: LanguageContext) {
        this.#agent = context.agent
        //@ts-ignore
        this.#idToken = context.customSettings.cognitoSession ? context.customSettings.cognitoSession.idToken : undefined;
        //@ts-ignore
        this.#represents = context.customSettings.represents ? this.customSettings.represents : undefined;

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

    //Should this be where comments are being created? Or should this be done in comment expression languages
    async addLink(link: Expression) {
        if ("expression_type" in link.data) {
            //@ts-ignore
            await axios.post(this.#url + "/expressions/" + link.data.address + "/comments", link.data)
            .then(function (response) {
                return response.data
            })
            .catch(function (error) {
                log_error(error)
                throw error
            });
        } else {
            throw Error("You can only expressions to this link language")
        }
    }

    async updateLink(oldLinkExpression: Expression, newLinkExpression: Expression) {
        if ("expression_type" in oldLinkExpression.data) {
            if ("expression_type" in newLinkExpression.data) {
                this.#represents = newLinkExpression;
            } else {
                throw Error("Expected newLinkExpression to be an expression of junto-group-expression")
            }
        } else {
            throw Error("Expected oldLinkExpression to be an expression of junto-group-expression")
        }
    }

    async removeLink(link: Expression) {
        if ("address" in link.data) {
            //@ts-ignore
            await axios.delete(this.#url + "/expressions/" + link.data.address + "/comments/" + this.#represents.data.address)
            .then(function (response) {
                return response.data
            })
            .catch(function (error) {
                log_error(error)
                throw error
            });
        } else {
            throw Error("Only expressions can be removed from this link-language")
        }
    }

    async getLinks(query: LinkQuery): Promise<Expression[]> {
        if (query.source == undefined) {
            throw Error("source for link query must be supplied");
        };
        let out: Array<Expression> = [] as Expression[];
        if (query.predicate != undefined) {
            if (query.predicate == "expressions") {
                //Again here not able to specify any pagination data
                //@ts-ignore
                let data = await axios.get(this.#url + "/expressions/" + query.source + "/comments?pagination_position=0")
                .then(function (response) {
                    return response.data
                })
                .catch(function (error) {
                    log_error(error)
                    throw error
                });
                data.results.forEach(element => {
                    let exp = new Expression()
                    exp.author = new Agent(element.creator.address);
                    exp.timestamp = element.created_at;
                    exp.data = element;
                    out.push(exp);
                });
            }
        } else {
            throw Error("Predicate required on getLinks query")
        }

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