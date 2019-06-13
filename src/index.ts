/**
 * @file index
 * @author Jim Bulkowski <jim.b@paperelectron.com>
 * @project Dispatch
 * @license MIT {@link http://opensource.org/licenses/MIT}
 */

import {some} from 'lodash/fp'
import {CreatePlugin, compositeValue} from "@pomegranate/plugin-tools";
import {WriterFacade} from "./Modules/TaskWriter/WriterFacade";
import {RpcReply} from "./Modules/RPCReply";
import {ActionCreator} from "./Modules/ActionCreator";

export const Plugin = CreatePlugin('composite')
  .configuration({
    name: 'Dispatch',
    optional: ['@pomofficial/RabbitMQ']
  })
  .variables({
    loadRpcReply: false,
    queues: [{
      propName: 'local',
      queueName: 'my.task.queue',
      type: 'queue' ,
      RPC: { enabled: false, defaultTimeout: 1000 },
      msgOptions: {persistent: true},
      queueOptions: {}
    }]
  })
  .hooks({
    load: async (Injector, PluginVariables, PluginFiles, PluginLogger,PluginLateError, RabbitMQ, PluginStore) => {
      let plugins: compositeValue[] = [
        {injectableParam: 'ActionCreator', load: ActionCreator}
      ]
      if(RabbitMQ && PluginVariables.queues && PluginVariables.queues.length){
        let channel = await RabbitMQ.createChannel()

        channel.on('error', (error) => {
          PluginLateError(error)
        })

        PluginStore.channel = channel

        if(PluginVariables.loadRpcReply || some({RPC: {enabled: true}},PluginVariables.queues)){
          PluginLogger.log("RPC enabled queues found, will load - 'RpcReply'.")
          let rpcr = RpcReply(channel)
          plugins.push({injectableParam: 'ActionReply', load: rpcr})
        }

        let wf = new WriterFacade(PluginVariables.queues, channel, PluginLogger)
        let initialized = await wf.initialize()
        plugins.push({injectableParam: 'DispatchAction', load: initialized})

        return plugins

      }
      return plugins
    },
    stop: (PluginStore, PluginLogger) => {
      if(PluginStore.channel){
        return PluginStore.channel.close().then(() => {
          PluginLogger.log('Closed RabbitMQ channel')
          return null
        })
      }
    }
  })
