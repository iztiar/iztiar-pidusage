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

        Msg.debug( 'pidUsagePlugin instanciation' );
        this._instance = instance;

        // must implement the IFeatureProvider
        //  should implement that first so that we can install the engineApi and the featureCard as soon as possible
        Interface.add( this, exports.IFeatureProvider, {
            v_featureInitialized: this.ifeatureproviderFeatureInitialized
        });
        this.IFeatureProvider.api( api );
        this.IFeatureProvider.feature( card );

        let _promise = this._fillConfig()
            .then(() => { return Promise.resolve( this ); });

        return _promise;
    }

    /*
     * @returns {Promise} which resolves to the filled configuration for the service
     */
    _fillConfig(){
        if( !this.IFeatureProvider ){
            throw new Error( 'IFeatureProvider is expected to have been instanciated before calling this function' );
        }
        const exports = this.IFeatureProvider.api().exports();
        exports.Msg.debug( 'pidUsagePlugin.fillConfig()' );
        const feature = this.IFeatureProvider.feature();
        let _filled = { ...feature.config() };
        return this.IFeatureProvider.fillConfig( _filled ).then(( c ) => { return feature.config( c ); });
    }

    /*
     * Called on each and every loaded add-on when the main hosting feature has terminated with its initialization
     * Time, for example, to increment all interfaces we are now sure they are actually implemented
     * note:
     *  we have to wait until the end of main feature initialization to be sure that all interfaces are actually
     *  implemented - even if IStatus and ICapability are tolerant an able to auto-implement, ITcpServer requires
     *  that the implementation provide a configuration and so cannot be auto-implemented.
     */
    ifeatureproviderFeatureInitialized(){
        const exports = this.IFeatureProvider.api().exports();
        exports.Msg.debug( 'pidUsagePlugin.ifeatureproviderInitialized()', this.IFeatureProvider.feature().name());

        // add a status part
        //  this is the feature this plugin is planned for
        exports.IStatus.add( this._instance, this.statusPart, this );

        // some other POCs - all tested OK, but unneeded here
        //  add a capability
        //exports.ICapability.add( this._instance, 'pidUsage', this.pidUsage );
        // add a tcp command + args
        //exports.ITcpServer.add( this._instance, 'pidUsage', 'Display the resources usage', this.displayUsage, false, 'another', 'arg' );
    }

    // TCP Server command
    // @param {Object} instance the implementation instance
    // @param {pidUsagePlugin} self this instance
    // @returns {Promise} which resolves to the PID usage
    displayUsage( instance, reply ){
        const exports = instance.IFeatureProvider.api().exports();
        let _args = [ ...arguments ];
        _args.splice( 0, 2 );
        reply.answer = _args;
        exports.Msg.debug( 'pidUsagePlugin.displayUsage() replying', reply );
        return Promise.resolve( reply );
    }

    /*
     * @returns {Promise} which must resolve to an object conform to check-status.schema.json
     */
    pidUsage( instance, cap ){
        const exports = instance.IFeatureProvider.api().exports();
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

    // @param {Object} instance the implementation instance
    // @param {pidUsagePlugin} self this instance
    // @returns {Promise} which resolves to the PID usage
    statusPart( instance, self ){
        const exports = instance.IFeatureProvider.api().exports();
        exports.Msg.debug( 'pidUsagePlugin.statusPart()', self.IFeatureProvider.feature().name());
        return self.pidUsage( instance, 'cap', self )
            .then(( res ) => {
                const name = self.IFeatureProvider.feature().name().split( '/' )[1];
                let o = {};
                o[name] = res;
                //exports.Msg.debug( 'pidUsagePlugin.statusPart()', 'pidUsage', o );
                return Promise.resolve( o );
            });
    }
}
