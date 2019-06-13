/**
 * @file RPCReply
 * @author Jim Bulkowski <jim.b@paperelectron.com>
 * @project Dispatch
 * @license MIT {@link http://opensource.org/licenses/MIT}
 */

import Bluebird from 'bluebird'
import {has, get, isNull} from 'lodash/fp'

export const RpcReply = (channel) => (msg, options) => {
  return Bluebird.try(()=>{
    if(!has('correlationId', options) || isNull(get('correlationId', options))){
      throw new Error('Reply metadata missing correlationId.')
    }
    if(!has('replyTo',options) || isNull(get('correlationId', options))){
      throw new Error('Reply metadata missing replyTo.')
    }
    let replyTo = options.replyTo
    let o = {correlationId: options.correlationId}
    let strung = JSON.stringify(msg)
    let buf = Buffer.from(strung)

    return channel.sendToQueue(replyTo, buf, o)
  })
}