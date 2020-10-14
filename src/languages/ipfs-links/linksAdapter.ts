import type Expression from "../../acai/Expression";
import type { LinksAdapter, NewLinksObserver } from "../../acai/Language";
import { hashLinkExpression } from "../../acai/Links";
import type LanguageContext from "../../acai/LanguageContext";
import { SHA3 } from "sha3";
import type ExpressionRef from "../../acai/ExpressionRef";
import Room from 'ipfs-pubsub-room'
import path from 'path'
import fs from 'fs'
import { Mutex } from 'async-mutex'

const _appendBuffer = (buffer1, buffer2) => {
    const tmp = new Uint8Array(buffer1.byteLength + buffer2.byteLength);
    tmp.set(new Uint8Array(buffer1), 0);
    tmp.set(new Uint8Array(buffer2), buffer1.byteLength);
    return tmp.buffer;
};

const uint8ArrayConcat = (chunks) => {
    return chunks.reduce(_appendBuffer)
}


const example = {
    links: [{author:"", ts: "", data: {source:""}}],
    rootLinks: [1, 5]
}

function debug(...args) {
    console.debug("IPFS-LINKS|", ...args)
}

export class IpfsLinksAdapter implements LinksAdapter {
    #callbacks: NewLinksObserver[];
    #IPFS: any
    #storage: string
    #roomName: string
    #key: any
    #initialized: Promise<void>
    #room: any
    #peerList: object
    #mutex: Mutex

    constructor(context: LanguageContext) {
        this.#callbacks = []
        this.#IPFS = context.IPFS
        this.#storage = context.storageDirectory
        this.#mutex = new Mutex()
        //@ts-ignore
        this.#roomName = context.customSettings.roomName ? context.customSettings.roomName : 'acai-ipfs-links-default-room'
        this.#room = new Room(this.#IPFS, this.#roomName)
        this.#room.on('message', message => this.handlePubSubMessage(message))
        this.#room.on('peer joined', peer => this.handlePubSubPeerJoined(peer))
        this.#initialized = this.init()
        
    }

    async init(): Promise<void> {
        return new Promise(async (resolve) => {
            // Get/initialize IPNS key
            const keys = await this.#IPFS.key.list()
            this.#key = keys.find(e => e.name == this.#roomName)
            if(!this.#key) {
                console.log(this.#IPFS)
                this.#key = await this.#IPFS.key.gen(this.#roomName)
            }

            // Read/initialized peer list
            this.#peerList = {}
            if(fs.existsSync(this.paths().peers)) {
                this.#peerList = JSON.parse(fs.readFileSync(this.paths().peers).toString())
            }

            resolve()
        })
    }

    private async getLinksOfPeer(peer, cid): Promise<void | object> {
        debug(`getLinksOfPeer(${peer}, ${cid}) called`)
        let result = undefined
        try {
            cid = cid.toString()

            const chunks = []
            // @ts-ignore
            for await (const chunk of this.#IPFS.cat(cid)) {
                chunks.push(chunk)
            }
            result = JSON.parse(uint8ArrayConcat(chunks).toString());
        } catch(e) {
            console.error("IPFS LINKS| Error while retrieving links of peer", peer, " via IPNS CID", cid,":\n", e)
        }

        //debug(`getLinksOfPeer() returning:`, result)
        return result
    }

    private rememberPeer(peer, ipns) {
        debug("remember peer:", peer, ipns)
        if(this.#peerList[peer.toString()] != ipns) {
            debug("new peer!")
            this.#peerList[peer.toString()] = ipns
            fs.writeFileSync(this.paths().peers, JSON.stringify(this.#peerList))
        }
    }

    private paths() {
        return {
            peers: path.join(this.#storage, 'peers.json'),
            myLatestHash: path.join(this.#storage, 'myLatestHash.json')
        }
    }

    private myLatestHash(): void|string {
        if(!fs.existsSync(this.paths().myLatestHash))
            return null
        return JSON.parse(fs.readFileSync(this.paths().myLatestHash).toString())
    }

    private handlePubSubMessage(message) {
        const { from, data } = message
        console.log("IPFS-LINKS| PubSub message from", from, data)
        try {
            const op = JSON.parse(data)
            if(typeof(op.removeLink) === 'object') {
                this.#callbacks.forEach(cb => cb([], [op.removeLink]))    
                return 
            } 
        } catch(e) {

        }

        const cid = data.toString()
        this.rememberPeer(from, cid)
        this.notify(from)
    }

    private handlePubSubPeerJoined(peer) {
        debug("Peer joind:", peer, "Sending my latest hash...")
        const myHash = this.myLatestHash()
        if(!myHash) {
            debug("Nothing to send :/")
        } else {
            this.#room.broadcast(myHash)
        }
        
    }

    private async notify(peer) {
        debug(`notify(${peer}`)
        //const cid = await this.resolveIPNS(this.#peerList[peer])
        const cid = this.#peerList[peer]
        const linksOfPeer = await this.getLinksOfPeer(peer, cid)
        debug(`links=${linksOfPeer}`)
        if(linksOfPeer) {
            //@ts-ignore
            this.#callbacks.forEach(cb => cb(Object.values(linksOfPeer.links)))
        }
    }

    private async publish(links: object): Promise<string>{
        const content = JSON.stringify(links)
        const result = await this.#IPFS.add(content)
        console.log("IPFS-LINKS| published:", result, content)
        //const publishResult = await this.#IPFS.name.publish(result.cid, {key: this.#key.name})
        //console.log("IPFS-LINKS: updated IPNS:", publishResult)
        fs.writeFileSync(this.paths().myLatestHash, JSON.stringify(result.cid.toString()))
        this.#room.broadcast(result.cid.toString())
        return result.cid
    }

    private async resolveIPNS(ipns: string): Promise<string> {
        let resolved
        for await (const name of this.#IPFS.name.resolve(ipns)) {
            resolved = name
        }
        return resolved
    }

    private async myResolvedIPNSObject(): Promise<string> {
        let resolved
        try {
            debug("resolving #key:", this.#key)
            resolved = this.resolveIPNS(this.#key.id)
        } catch(e) {
            debug("Couldn't get resolve my IPNS name. Publishing...")
            resolved = await this.publish({links:[], rootLinks:[]})
        }

        return resolved
    }

    writable() {
        return true
    }

    public() {
        return true
    }

    others() {
        return []
    }

    async getRootLinks(): Promise<Expression[]> {
        await this.#initialized

        //const resolved = await this.myResolvedIPNSObject()
        //let requestList = [{peer: 'me', cid: resolved}]
        let requestList = []

        Object.keys(this.#peerList).forEach(peer => {
            requestList.push({peer, cid: this.#peerList[peer]})
        })
            
        const allLinksOfallPeers = await Promise.all(
            requestList.map(r => {
                return this.getLinksOfPeer(r.peer, r.cid)
            })
        )

        console.log("IPFS-LINKS| getRootLinks - allLinksOfAllPeers =", allLinksOfallPeers)

        //@ts-ignore
        const merged = [].concat.apply([], allLinksOfallPeers.map(e => Object.values(e.links)))
        return merged
    }

    async addRootLink(link: Expression) {
        await this._addLink(link, true)
    }

    async addLink(link: Expression) {
        await this._addLink(link, false)
    }

    private async getMyLinks(): Promise<object> {
        let linksObject
        let myHash = this.myLatestHash()
        if(myHash) {
            linksObject = await this.getLinksOfPeer("me", myHash)
        } 
        //@ts-ignore
        if(!linksObject || !linksObject.links || !linksObject.rootLinks) {
            linksObject = {
                links: {},
                rootLinks: []
            }
        }
        return linksObject
    }

    private async _addLink(link: Expression, root: boolean) {
        await this.#initialized

        const release = await this.#mutex.acquire()
        const linksObject = await this.getMyLinks()
        const linkHash = hashLinkExpression(link)
        //@ts-ignore
        linksObject.links[linkHash] = link
        if(root) {
            //@ts-ignore
            linksObject.rootLinks.push(linkHash)
        }
        await this.publish(linksObject)
        release()
    }

    async updateLink(oldLinkExpression: Expression, newLinkExpression: Expression) {
        await this.#initialized

        const release = await this.#mutex.acquire()
        const linksObject = await this.getMyLinks()
        const oldLinkHash = hashLinkExpression(oldLinkExpression)
        const newLinkHash = hashLinkExpression(newLinkExpression)

        //@ts-ignore
        if(!linksObject.links[oldLinkHash]) {
            throw new Error("Can't update link. Not found in my links.\nMy links: "+JSON.stringify(linksObject))
        }

        //@ts-ignore
        linksObject.links[newLinkHash] = newLinkExpression

        //@ts-ignore
        const index = linksObject.rootLinks.findIndex(e => e === oldLinkHash)
        if(-1 != index) {
            //@ts-ignore
            linksObject.rootLinks.splice(index, 1)
            //@ts-ignore
            linksObject.rootLinks.push(newLinkHash)
        }

        //@ts-ignore
        delete linksObject.links[oldLinkHash]

        this.#room.broadcast(JSON.stringify({
            removeLink: oldLinkExpression
        }))
        await this.publish(linksObject)
        release()
    }

    async getLinksFrom(source: ExpressionRef): Promise<Expression[]> {
        return []
    }

    async getLinksTo(target: ExpressionRef): Promise<Expression[]>{
        return []
    }

    addCallback(callback: NewLinksObserver) {
        this.#callbacks.push(callback)
    }
}