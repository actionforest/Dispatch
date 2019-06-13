/**
 * @file defer
 * @author Jim Bulkowski <jim.b@paperelectron.com>
 * @project Dispatch
 * @license MIT {@link http://opensource.org/licenses/MIT}
 */

import Bluebird from 'bluebird'

export const defer = () => {
  let resolve, reject
  let promise = new Bluebird((_resolve, _reject) => {
    resolve = _resolve
    reject = _reject
  })
  return {
    resolve,
    reject,
    promise
  }
}