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
        Interface.add( this, exports.IFeatureProvider );
        this.IFeatureProvider.api( api );
        this.IFeatureProvider.feature( card );

        // add a status part
        exports.IStatus.add( instance, this.statusPart, this );
        // add a capability
        exports.ICapability.add( instance, 'pidUsage', this.pidUsage );

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
}
