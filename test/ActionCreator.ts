/**
 * @file ActionCreator
 * @author Jim Bulkowski <jim.b@paperelectron.com>
 * @project Dispatch
 * @license MIT {@link http://opensource.org/licenses/MIT}
 */

import {ActionCreator} from "../src/Modules/ActionCreator";

describe('ActionCreator', () => {

  test('Proper Format', () => {
    let A = new ActionCreator()
      .name('bob')
      .addState('count', 20)
      .addState('awesome', {stuff: {inside: 'also'}})
      .build()

    expect(A).toEqual(expect.objectContaining({
      state: { count: 20, awesome: { stuff: {inside: 'also'} } },
      metadata: { name: 'bob' } }
    ))
  })
})