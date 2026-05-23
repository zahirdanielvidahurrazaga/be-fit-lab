import UIKit
import Capacitor

class ViewController: CAPBridgeViewController {

    override func viewWillAppear(_ animated: Bool) {
        super.viewWillAppear(animated)
        // Iguala el color del scrollView al fondo de la app para eliminar la línea blanca
        // en el área del notch (safe area top) en modo oscuro y claro.
        let appBg = UIColor { traits in
            traits.userInterfaceStyle == .dark
                ? UIColor(red: 13/255, green: 13/255, blue: 12/255, alpha: 1)
                : UIColor(red: 252/255, green: 249/255, blue: 245/255, alpha: 1)
        }
        view.backgroundColor = appBg
        webView?.scrollView.backgroundColor = appBg
    }

    override func capacitorDidLoad() {
        bridge?.registerPluginInstance(WalletPlugin())
    }
}
