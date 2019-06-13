/**
 * @file ActionCreator
 * @author Jim Bulkowski <jim.b@paperelectron.com>
 * @project Dispatch
 * @license MIT {@link http://opensource.org/licenses/MIT}
 */

import {isString} from "lodash/fp";

const builder: WeakMap<ActionCreator, any> = new WeakMap()


class PrivateAction {
  metadata: {name?: string} | null
  state: {[index: string]: any} | null
  constructor(){
    this.metadata = {}
    this.state = {}
  }
  setName(name: string){
    this.metadata.name = name
  }

  setState(val: any) {
    this.state = val
  }
  addState(prop: string, val: any){
    this.state[prop] = val
  }

  build(){
    return {state: this.state, metadata: this.metadata}
  }

}

const priv = (thisArg: ActionCreator): PrivateAction => {
  if (!builder.has(thisArg)) {
    let p = new PrivateAction()
    builder.set(thisArg, p);
    return p
  }
  return builder.get(thisArg);
}

/**
 * @class TaskBuilder
 * @example
 *
 * let Task = new TaskBuilder()
 *   .task('my.awesome.task)
 *   .payloadProp('level', 'Awesome')
 *   .build()
 */
export class ActionCreator {

  private actionNameSet = false
  private stateSet = false
  constructor(){
    priv(this)
  }

  /**
   * Sets the task name that this creator will target.
   * @param {string} actionName - the actionName to build
   * @returns {TaskBuilder}
   */
  name(actionName: string){
    if(!actionName) throw new Error('Requires an action name, e.g. my.awesome.task.')
    if(!isString(actionName)) throw new Error('actionName name must be a string.')

    let b = priv(this).setName(actionName)

    this.actionNameSet = true
    return this
  }

  setState(val: {[key: string]: any}){
    priv(this).setState(val)
    this.stateSet = true
    return this
  }
  addState(prop: string, val: any){
    priv(this).addState(prop, val)
    this.stateSet = true
    return this
  }

  build(){
    if(!this.actionNameSet) throw new Error('Action name is not set.')
    if(!this.stateSet) throw new Error('State has not been set for this creator')

    return priv(this).build()
  }

}