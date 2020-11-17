import Expression from "../../acai/Expression";
import type { LinksAdapter, NewLinksObserver } from "../../acai/Language";
import type { LinkQuery } from "../../acai/Links";
import Agent from "../../acai/Agent";
import type LanguageContext from "../../acai/LanguageContext";
import type ExpressionRef from "../../acai/ExpressionRef";

const axios = require('axios').default;

/// This link language is used to represent the links for a SINGLE perspective; language should be replicated for each junto-perspective that it should represent

/// Current points of doubt
/// Right now the "expression" metadata for this Junto-perspective is stored in another expression language and then referenced here by making it a property on the object. 
/// Something about this feels off but I cant figure out any other clean way to have this link-lang know what junto perspective is is supposed to represent

/// Getting links via the predicate is also feeling a little messy. Below I mention having some type that allow us to go from type -> predicate string -> type. 
/// That should ensure there are no mistakes made to predicate "syntax" when calling the getLinks function. This should help make things a little cleaner but still feels hacky.

export class JuntoPerspectiveLinksAdapter implements LinksAdapter {
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
        return false
    }

    others() {
        //Essentially sharing with one other "agent" which is the Junto backend; this is not in DID format just yet
        return [new Agent("https://api.junto.foundation")]
    }

    async addLink(link: Expression) {
        //If the link data as no data; then we know an agent is to be added to this perspective
        if (Object.keys(link.data).length === 0) {
            //For now we will just assume that the Agent string is not actually a DID but instead just a UUID of agent
            //When this is a DID we will have to extract the uuid from the string
            let target_agent = link.author;
            if (this.#represents != undefined) {
                //@ts-ignore
                await axios.post(this.#url + "/perspectives/" + this.#represents.data.address + "/users", [{
                    user_address: target_agent
                }]).then(function (response) {
                    return response.data
                })
                .catch(function (error) {
                    log_error(error)
                    throw error
                });
            } else {
                throw Error("Perspective-expression that this link langauge represents should be init'd")
            }
        } else if ("perspective_type" in link.data){
            //Perspective metadata is being added to this link-lang for future reference
            //Should this actually be here? 
            this.#represents = link;
        } else {
            throw Error("You can only add agents & perspective-expression to this link-language!")
        }
    }

    async updateLink(oldLinkExpression: Expression, newLinkExpression: Expression) {
        if ("perspective_type" in oldLinkExpression.data) {
            if ("perspective_type" in newLinkExpression.data) {
                this.#represents = newLinkExpression;
            } else {
                throw Error("Expected newLinkExpression to be an expression of junto-perspective-expression")
            }
        } else {
            throw Error("Expected oldLinkExpression to be an expression of junto-perspective-expression")
        }
    }

    async removeLink(link: Expression) {
        if (Object.keys(link.data).length === 0) {
            //For now we will just assume that the Agent string is not actually a DID but instead just a UUID of agent
            //When this is a DID we will have to extract the uuid from the string
            let target_agent = link.author;
            if (this.#represents != undefined) {
                //@ts-ignore
                await axios.delete(this.#url + "/perspectives/" + this.#represents.data.address + "/users", [{
                    user_address: target_agent
                }]).then(function (response) {
                    return response.data
                })
                .catch(function (error) {
                    log_error(error)
                    throw error
                });
            } else {
                throw Error("Perspective-expression that this link langauge represents should be init'd")
            }
        } else {
            throw Error("Only agents can be removed from this link-language")
        }
    }

    async getLinks(query: LinkQuery): Promise<Expression[]> {
        if (query.source == undefined) {
            throw Error("source for link query must be supplied");
        };
        let out: Array<Expression> = [] as Expression[];
        if (query.predicate != undefined) {
            if (query.predicate == "users") {
                //@ts-ignore
                let data = await axios.get(this.#url + "/perspectives/" + query.source + "/users")
                .then(function (response) {
                    return response.data
                })
                .catch(function (error) {
                    log_error(error)
                    throw error
                });

                data.forEach(element => {
                    let exp = new Expression()
                    exp.author = new Agent(element.address);
                    exp.timestamp = element.created_at;
                    exp.data = element;
                    out.push(exp);
                });
                
            } else if (query.predicate == "expressions") {
                //Right now predicate is just containing "expression" for querying over expressions; we would actually also want to somehow query using channels here also
                //Also want someway to specify pagination data here also
                //As to ensure the right query format we might want some adapter/type
                //which can be used to add type-safe query information which is then deserialize/serialized to and from a predicate query string
                //@ts-ignore
                let data = await axios.get(this.#url + "/expressions?context" + query.source + "&context_type=" + this.#represents.data.perspective_type 
                    + "&pagination_position=0")
                .then(function (response) {
                    return response.data
                })
                .catch(function (error) {
                    log_error(error)
                    throw error
                });
                data.results.forEach(element => {
                    let exp = new Expression()
                    exp.author = element.creator.address;
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