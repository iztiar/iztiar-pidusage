/*
 * Plugin class
 *
 *  Add a pidUsage object to a feature of type 'service':
 *  - available via the IStatus interface
 *  - also available as a ICapability
 */
import pidUsage from 'pidusage';

export class pidUsagePlugin {

    // the hosting instance
    _instance = null;

    /**
     * @param {engineApi} api the engine API as described in engine-api.schema.json
     * @param {featureCard} card a description of this feature
     * @param {Object} instance the implementation instance
     * @returns {Promise} which resolves to a pidUsagePlug instance
     */
    constructor( api, card, instance ){
        const exports = api.exports();
        const Interface = exports.Interface;
        const Msg = exports.Msg;

        Interface.extends( this, exports.featureProvider, api, card );
        Msg.debug( 'pidUsagePlugin instanciation' );
        this._instance = instance;

        let _promise = this.fillConfig()
            .then(() => { return Promise.resolve( this ); });

        return _promise;
    }

    // TCP Server command
    // @param {Object} instance the implementation instance
    // @param {pidUsagePlugin} self this instance
    // @returns {Promise} which resolves to the PID usage
    displayUsage( instance, reply ){
        const exports = instance.api().exports();
        let _args = [ ...arguments ];
        _args.splice( 0, 2 );
        reply.answer = _args;
        exports.Msg.debug( 'pidUsagePlugin.displayUsage() replying', reply );
        return Promise.resolve( reply );
    }

    /*
     * @returns {Promise} which resolves to the filled configuration for the add-on feature
     *  Happens that this add-on feature doesn't have any configuration at the moment
     */
    fillConfig(){
        const exports = this.api().exports();
        exports.Msg.debug( 'pidUsagePlugin.fillConfig()' );
        let _promise = super.fillConfig();
        return _promise;
    }

    /*
     * @returns {Promise} which must resolve to an object conform to check-status.schema.json
     */
    pidUsage( instance, cap ){
        const exports = instance.api().exports();
        return pidUsage( process.pid )
            .then(( res ) => {
                const o = {
                    cpu: res.cpu,
                    memory: res.memory,
                    ctime: res.ctime,
                    elapsed: res.elapsed
                };
                exports.Msg.debug( 'pidUsagePlugin.pidUsage()', o );
                return Promise.resolve( o );
            });
    }

    /*
     * Called on each and every loaded add-on when the main hosting feature has terminated with its initialization
     * Time, for example, to increment all interfaces we are now sure they are actually implemented
     * note:
     *  we have to wait until the end of main feature initialization to be sure that all interfaces are actually
     *  implemented - even if IStatus and ICapability are tolerant and able to auto-implement themselves,
     *  ITcpServer requires that the implementation provide a configuration and so cannot be auto-implemented.
     */
    ready(){
        const exports = this.api().exports();
        exports.Msg.debug( 'pidUsagePlugin.ready()', this.feature().name());

        // add a status part
        //  this is the feature this plugin is planned for
        exports.IStatus.add( this._instance, this.statusPart, this );

        // some other POCs - all tested OK, but unneeded here
        //  add a capability
        //exports.ICapability.add( this._instance, 'pidUsage', this.pidUsage );
        // add a tcp command + args
        //exports.ITcpServer.add( this._instance, 'pidUsage', 'Display the resources usage', this.displayUsage, false, 'another', 'arg' );
    }

    // @param {Object} instance the implementation instance
    // @param {pidUsagePlugin} self this instance
    // @returns {Promise} which resolves to the PID usage
    statusPart( instance, self ){
        const exports = instance.api().exports();
        exports.Msg.debug( 'pidUsagePlugin.statusPart()', self.feature().name());
        return self.pidUsage( instance, 'cap', self )
            .then(( res ) => {
                const name = self.feature().name().split( '/' )[1];
                let o = {};
                o[name] = res;
                //exports.Msg.debug( 'pidUsagePlugin.statusPart()', 'pidUsage', o );
                return Promise.resolve( o );
            });
    }
}
