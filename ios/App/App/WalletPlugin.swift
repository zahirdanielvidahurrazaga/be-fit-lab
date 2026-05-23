import Capacitor
import PassKit

@objc(WalletPlugin)
public class WalletPlugin: CAPPlugin {

    @objc func addPass(_ call: CAPPluginCall) {
        guard let urlString = call.getString("url"),
              let url = URL(string: urlString) else {
            call.reject("URL inválida")
            return
        }

        URLSession.shared.dataTask(with: url) { [weak self] data, _, error in
            guard let self = self else { return }

            if let error = error {
                call.reject("Error de red: \(error.localizedDescription)")
                return
            }

            guard let data = data else {
                call.reject("Sin datos del pase")
                return
            }

            let pass: PKPass
            do {
                pass = try PKPass(data: data)
            } catch {
                call.reject("Pase inválido: \(error.localizedDescription)")
                return
            }

            DispatchQueue.main.async {
                guard PKAddPassesViewController.canAddPasses() else {
                    call.reject("Wallet no disponible en este dispositivo")
                    return
                }

                guard let vc = PKAddPassesViewController(pass: pass) else {
                    call.reject("No se pudo inicializar la vista de Wallet")
                    return
                }

                self.bridge?.viewController?.present(vc, animated: true)
                call.resolve(["success": true])
            }
        }.resume()
    }
}
