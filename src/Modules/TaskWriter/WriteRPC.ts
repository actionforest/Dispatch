/**
 * @file WriteRPC
 * @author Jim Bulkowski <jim.b@paperelectron.com>
 * @project Dispatch
 * @license MIT {@link http://opensource.org/licenses/MIT}
 */

import {RMQWriter} from "./RMQWriter";
import Bluebird from 'bluebird'
import {has} from 'lodash/fp'
import {defer} from './defer'
import {v4} from "uuid";

const isSuccess = has('rpc_auto_success')
const isFailure = has('rpc_auto_failure')

export class WriteRPC extends RMQWriter {
  queueAsserted: boolean
  RPCTimeout: number
  expireRemote: number
  replyQueue: any
  callbacks: Map<string, any>

  constructor(config, channel) {
    super(config, channel)
    this.queueAsserted = false
    this.RPCTimeout = config.RPC.defaultTimeout
    this.expireRemote = this.RPCTimeout + (this.RPCTimeout / 2)
    this.replyQueue = null
    this.callbacks = new Map()
  }

  rpc(msg, options: { timeout?: number } = {}): any {
    let localOptions = {
      expiration: options.timeout ? options.timeout + (options.timeout / 2) : this.expireRemote,
      correlationId: v4(),
      replyTo: this.replyQueue
    }
    let deferred = defer()

    this.callbacks.set(localOptions.correlationId, deferred)

    return this.write(msg, localOptions)
      .then(() => {

        setTimeout(() => {
          this.callbacks.delete(localOptions.correlationId)
          deferred.reject(new Error(`RPC with correlationId "${localOptions.correlationId} timed out.`))
        }, options.timeout || this.RPCTimeout)

        return deferred.promise
      })
  }

  reply(msg, options) {
    let replyTo = options.replyTo
    delete options.replyTo
    return this.writeToQueue(replyTo, msg, options)
  }

  initialize() {
    return Bluebird.props({
      replyQueue: this.channel.assertQueue('', {exclusive: true, autoDelete: true}),
      taskQueue: this.channel.assertQueue(this.queue, this.queueOptions)
    })
      .then((qs) => {
        this.queueAsserted = true
        this.replyQueue = qs.replyQueue.queue

        this.channel.consume(this.replyQueue, (msg) => {
          let correlationId = msg.properties.correlationId
          if (this.callbacks.has(correlationId)) {
            let p = this.callbacks.get(correlationId)
            this.callbacks.delete(correlationId)

            try {
              let messageContents = JSON.parse(msg.content.toString())
              if (isSuccess(messageContents)) {
                return p.resolve(messageContents.rpc_auto_success)
              }
              if (isFailure(messageContents)) {
                let wf = messageContents.rpc_auto_failure
                let e = new Error(wf.message || 'No Message in RPC Error.')
                let stack = wf.stack ? wf.stack : e.stack
                e.stack = stack
                return p.reject(e)
              }

              return p.resolve(messageContents)
            } catch (e) {
              return p.reject(e)
            }

          }
        }, {noAck: true})

        return qs

      })
  }
}