/*
 * main.js
 *
 *  This is the default export of the module.
 *  This is also the Iztiar initialization entry point as this default export is identified in the 'main' key of package.json
 */
import { pidUsagePlugin } from './imports.js';

/**
 * @param {engineApi} api the engine API as described in engine-api.schema.json
 * @param {featureCard} card a description of this feature
 * @param {featureProvider} instance the implementation instance
 * @returns {Promise} which must resolves to the add-on featureProvider instance
 */
export default ( api, card, instance ) => {
    return new pidUsagePlugin( api, card, instance );
}
