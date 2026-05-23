#import <Capacitor/Capacitor.h>

CAP_PLUGIN(WalletPlugin, "WalletPlugin",
    CAP_PLUGIN_METHOD(addPass, CAPPluginReturnPromise);
)
