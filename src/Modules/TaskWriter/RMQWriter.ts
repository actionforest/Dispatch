/**
 * @file RMQWriter
 * @author Jim Bulkowski <jim.b@paperelectron.com>
 * @project Dispatch
 * @license MIT {@link http://opensource.org/licenses/MIT}
 */

import Bluebird from 'bluebird'

export class RMQWriter {
  channel: any
  propName: any
  queue: any
  type: any
  queueOptions: any
  msgOptions: any

  constructor(config, channel){
    this.channel = channel
    this.propName = config.propName
    this.queue = config.queueName
    this.type = config.type
    this.queueOptions = config.queueOptions || null
    this.msgOptions = config.msgOptions || null
  }

  getType(){
    return this.type
  }
  getQueueName(){
    return this.queue
  }
  rpc(msg, options){
    return Bluebird.reject(new Error('The .call method can only be called from a RPC enabled queue.'))
  }

  writeToQueue(queuename, msg, options){
    return Bluebird.try(() => {
      let strung = JSON.stringify(msg)
      let buf = Buffer.from(strung)
      let localOptions = options || this.msgOptions
      return this.channel.sendToQueue(queuename, buf, localOptions)
    })
  }

  write(msg, options){
    return this.writeToQueue(this.queue, msg, options)
  }
}