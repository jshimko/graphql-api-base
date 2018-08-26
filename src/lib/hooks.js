import _ from 'lodash';

/**
 * @file Callback hooks to alter the behavior of common operations or trigger other things.
 *
 *
 * @namespace Hooks
 */
const Hooks = {};


/**
 * @method add
 * @summary Add a callback function to a hook
 * @memberof Hooks
 * @example Hooks.add('afterAccountsRemove', callback)
 * @param {String} name - The name of the hook
 * @param {Function} callback - The callback function
 * @return {Array} array of the currently defined hooks
 */
Hooks.add = (name, callback) => {
  // if callback array doesn't exist yet, initialize it
  if (typeof Hooks[name] === 'undefined') {
    Hooks[name] = [];
  }
  return Hooks[name].push(callback);
};


/**
 * @method remove
 * @summary Remove a callback from a hook
 * @memberof Hooks
 * @param {String} name - The name of the hook
 * @param {String} callbackName - The name of the function to remove
 * @return {Array} array of remaining callbacks
 */
Hooks.remove = (name, callbackName) => {
  Hooks[name] = _.reject(Hooks[name], (callback) => callback.name === callbackName);

  return Hooks;
};


/**
 * @method run
 * @summary Successively run all of a hook's callbacks on an item
 * @memberof Hooks
 * @example Hooks.run('beforeCoreInit');
 * @param {String} name - The name of the hook
 * @param {Object} item - The object, modifier, etc. on which to run the callbacks
 * @param {Object} [constant] - An optional constant that will be passed along to each callback
 * @return {Object} Returns the item after it has been through all callbacks for this hook
 */
Hooks.run = (name, item, constant) => {
  const callbacks = Hooks[name];

  // if the hook exists, and contains callbacks to run
  if (typeof callbacks !== 'undefined' && !!callbacks.length) {
    return callbacks.reduce((result, callback) => callback(result, constant), item);
  }
  return item;
};

export default Hooks;
