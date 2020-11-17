import Expression from "../../acai/Expression";
import type { LinksAdapter, NewLinksObserver } from "../../acai/Language";
import type { LinkQuery } from "../../acai/Links";
import Agent from "../../acai/Agent";
import type LanguageContext from "../../acai/LanguageContext";
import type ExpressionRef from "../../acai/ExpressionRef";

const axios = require('axios').default;

/// This link language is used to represent the links for a SINGLE group; language should be replicated for each junto-group that it should represent

export class JuntoGroupLinkAdapter implements LinksAdapter {
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
        if (this.#represents != undefined) {
            //@ts-ignore
            return axios.get(this.#url + "/groups/" + this.#represents.data.address + "/members?pagination_position=0")
            .then(function (response) {
                let out = [];
                response.data.results.forEach(element => {
                    out.push(new Agent(element.user.address));
                });
                return out
            })
            .catch(function (error) {
                log_error(error)
                throw error
            });
        } else {
            throw Error("group-expression that this link langauge represents should be init'd")
        }
    }

    async addLink(link: Expression) {
        //If the link data contains permissions data then its likely trying to add a user to the group
        if ("permissions" in link.data) {
            //For now we will just assume that the Agent string is not actually a DID but instead just a UUID of agent
            //When this is a DID we will have to extract the uuid from the string
            let target_agent = link.author;
            if (this.#represents != undefined) {
                //@ts-ignore
                await axios.post(this.#url + "/groups/" + this.#represents.data.address + "/members", [{
                    user_address: target_agent,
                    //@ts-ignore
                    permissions: link.data.permissions
                }])
                    .then(function (response) {
                        return response.data
                    })
                    .catch(function (error) {
                        log_error(error)
                        throw error
                    });
            } else {
                throw Error("group-expression that this link langauge represents should be init'd")
            }
        } else if ("expression_data" in link.data) {
            if (this.#represents != undefined) {
                //@ts-ignore
                link.data.context = this.#represents.data.address;

                await axios.post(this.#url + "/expressions", link.data).then(function (response) {
                    return response.data
                })
                .catch(function (error) {
                    log_error(error)
                    throw error
                });
            } else {
                throw Error("group-expression that this link langauge represents should be init'd") 
            }
        } else if ("group_type" in link.data){
            //group metadata is being added to this link-lang for future reference
            //Should this actually be here? 
            this.#represents = link;
        } else {
            throw Error("You can only add agents & group-expression to this link-language!")
        }
    }

    async updateLink(oldLinkExpression: Expression, newLinkExpression: Expression) {
        if ("group_type" in oldLinkExpression.data) {
            if ("group_type" in newLinkExpression.data) {
                this.#represents = newLinkExpression;
            } else {
                throw Error("Expected newLinkExpression to be an expression of junto-group-expression")
            }
        } else {
            throw Error("Expected oldLinkExpression to be an expression of junto-group-expression")
        }
    }

    async removeLink(link: Expression) {
        if (Object.keys(link.data).length === 0) {
            //For now we will just assume that the Agent string is not actually a DID but instead just a UUID of agent
            //When this is a DID we will have to extract the uuid from the string
            let target_agent = link.author;
            if (this.#represents != undefined) {
                //@ts-ignore
                await axios.delete(this.#url + "/groups/" + this.#represents.data.address + "/members", [{
                    user_address: target_agent
                }]).then(function (response) {
                    return response.data
                })
                .catch(function (error) {
                    log_error(error)
                    throw error
                });
            } else {
                throw Error("group-expression that this link langauge represents should be init'd")
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
                let data = await axios.get(this.#url + "/groups/" + query.source + "/members?pagination_position=0")
                .then(function (response) {
                    return response.data
                })
                .catch(function (error) {
                    log_error(error)
                    throw error
                });

                data.forEach(element => {
                    let exp = new Expression()
                    exp.author = new Agent(element.user.address);
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
                let data = await axios.get(this.#url + "/expressions?context" + query.source + "&context_type=Group&pagination_position=0")
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