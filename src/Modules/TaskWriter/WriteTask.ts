/**
 * @file WriteTask
 * @author Jim Bulkowski <jim.b@paperelectron.com>
 * @project Dispatch
 * @license MIT {@link http://opensource.org/licenses/MIT}
 */

import Bluebird from 'bluebird'

import {RMQWriter} from "./RMQWriter";

export class WriteTask extends RMQWriter {
  queueAsserted: boolean
  constructor(config, channel){
    super(config, channel)
    this.queueAsserted = false
  }

  initialize(){
    return Bluebird.try(() => {
      if(this.queueAsserted) {
        throw new Error('This Method has already been called.')
      }
      return this.channel.assertQueue(this.queue, this.queueOptions)
    })
      .then((q) => {
        this.queueAsserted = true
        return q
      })

  }

}