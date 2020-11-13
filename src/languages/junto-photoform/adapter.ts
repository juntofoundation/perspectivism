import type Expression from "../../acai/Expression"
import type Address from '../../acai/Address'
import Agent from '../../acai/Agent'
import type { ExpressionAdapter, GetByAuthorAdapter, PublicSharing } from '../../acai/Language'
import type LanguageContext from '../../acai/LanguageContext'

const axios = require('axios').default;

//TODO implement get all adapter that can take a set of expression addresses and return the data for each of them

class PhotoFormPutAdapter implements PublicSharing {
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

    async createPublic(data: object): Promise<Address> {
        //@ts-ignore
        let obj = JSON.parse(data)

        let s3_data = {
            content_type: ".png",
            content_length: obj.size
        };

        console.log("Getting s3 upload url");

        let s3_upload_info = await axios.post(this.#url + "auth/s3", s3_data)
            .then(function (response) {
                return response.data
            })
            .catch(function (error) {
                log_error(error)
                throw error
            });

        console.log("S3 upload data: ", s3_upload_info);

        //Convert b64 string to array
        var u = obj.img.split(',')[1],
        binary = atob(u),
        array = [];
        for (var i = 0; i < binary.length; i++) {
            array.push(binary.charCodeAt(i));
        }
        var typedArray = new Uint8Array(array);

        //Make the upload to s3
        delete axios.defaults.headers.common["Authorization"];
        let s3_response = await axios.put(s3_upload_info.signed_url, typedArray, {
            headers: {
                "x-amz-acl": s3_upload_info.headers["x-amz-acl"],
                "x-amz-meta-user_id": s3_upload_info.headers["x-amz-meta-user_id"],
                "content-type": "image/png"
            }
        })
        .then(function (response) {
            return response.data
        })
        .catch(function (error) {
            log_error(error)
            throw error
        });

        console.log("got s3 response", s3_response);

        axios.defaults.headers.common['Authorization'] = this.#idToken
        const expressionPostData = {
            type: "PhotoForm",
            expression_data: {
                //@ts-ignore
                caption: obj.caption,
                image: s3_upload_info.key,
                thumbnail300: "",
                thumbnail600: ""
            },
            channels: [],
            context: this.#context
        }

        return axios.post(this.#url + "expressions", expressionPostData)
            .then(function (response) {
                return response.data.address
            })
            .catch(function (error) {
                log_error(error)
                throw error
            })
    }
}

export default class PhotoFormAdapter implements ExpressionAdapter {
    #agent: Agent
    #idToken: String
    #url: String = "http://localhost:8080/v0.3.0-alpha/"

    putAdapter: PublicSharing

    constructor(context: LanguageContext) {
        this.#agent = context.agent
        //@ts-ignore
        this.#idToken = context.customSettings.cognitoSession ? context.customSettings.cognitoSession.idToken : undefined;
        this.putAdapter = new PhotoFormPutAdapter(context)

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