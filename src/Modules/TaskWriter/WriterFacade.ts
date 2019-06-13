/**
 * @file WriterFacade
 * @author Jim Bulkowski <jim.b@paperelectron.com>
 * @project Dispatch
 * @license MIT {@link http://opensource.org/licenses/MIT}
 */

import Bluebird from 'bluebird'
import {WriteRPC} from "./WriteRPC";
import {WriteTask} from "./WriteTask";
import {each, has, isObject} from 'lodash/fp'

const WeakWriters = new WeakMap()

function deferErrorToPromise(param){
  return () => {
    return Bluebird.reject(new Error(`Parameter or queuename "${param}" not found in DispatchAction.to('${param}').`))
  }
}

export class WriterFacade {
  channel: any
  Logger: any
  initialized: boolean
  qmap: Map<string, any>
  pmap: Map<string, any>

  constructor(queueList, channel, Logger){
    this.channel = channel
    this.Logger = Logger
    this.initialized = false

    this.qmap = new Map() //keyed by queuename
    this.pmap = new Map() //keyed by config propName

    each((q) => {
      if(this.qmap.has(q.queueName)){
        throw new Error(`Duplicate Queuename "${q.queueName}" in AddTask queues configuration.`)
      }
      if(this.pmap.has(q.propName)){
        throw new Error(`Duplicate PropName "${q.propName}" in AddTask queues configuration.`)
      }
      this.qmap.set(q.queueName, q)
      this.pmap.set(q.propName, q)
      this.addWriter(q)
    }, queueList)
  }

  addWriter(config){
    let writer
    if(!has('queueName',config) || !has('propName',config) || !has('type',config)){
      throw new Error('Provided config must include propName, queueName and type.')
    }
    if(config.RPC.enabled){
      writer = new WriteRPC(config, this.channel)
      this.Logger.log(`Queue: '${writer.queue}', Param: '${writer.propName}', loading. RPC: enabled`)
    } else {
      writer = new WriteTask(config, this.channel)
      this.Logger.log(`Queue: '${writer.queue}', Param: '${writer.propName}', loading. RPC: disabled`)
    }
    WeakWriters.set(config, writer)
    return this
  }

  initialize(){
    return Bluebird
      .map(this.pmap.values(), (c) => {
        return WeakWriters.get(c)
      })
      .filter((w) => {
        return !w.queueAsserted
      })
      .map((w) => {
        this.Logger.log(`Asserting queue - '${w.queue}' on param '${w.propName}'.`)
        return w.initialize()
      })
      .then((w) => {
        each((l) => {

          if(isObject(l.taskQueue)){
            this.Logger.log(`Queue - '${l.taskQueue.queue}' ready for messages.`)
            this.Logger.log(`RPC Queue - '${l.replyQueue.queue}' listening for replies.`)
            return
          }

          this.Logger.log(`Queue - '${l.queue}' ready for messages.`)
        }, w)
        return this
      })

  }

  to(param: string){
    if(this.pmap.has(param)){
      return WeakWriters.get(this.pmap.get(param))
    }
    if(this.qmap.has(param)){
      return WeakWriters.get(this.qmap.get(param))
    }
    let detp = deferErrorToPromise(param)
    return {
      call: detp,
      write: detp
    }
  }
}