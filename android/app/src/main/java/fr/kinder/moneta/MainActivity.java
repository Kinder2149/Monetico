package fr.kinder.moneta;

import android.os.Bundle;
import androidx.activity.OnBackPressedCallback;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    // Bouton retour du téléphone : on demande à l'appli de fermer son dernier panneau ou écran
    // secondaire ouvert (monetaRetour, dans Commun.jsx) ; s'il n'y en a aucun, on quitte comme d'habitude.
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        OnBackPressedCallback retour = new OnBackPressedCallback(true) {
            @Override
            public void handleOnBackPressed() {
                getBridge().getWebView().evaluateJavascript(
                    "window.monetaRetour ? window.monetaRetour() : false",
                    (reponse) -> {
                        if (!"true".equals(reponse)) {
                            setEnabled(false);
                            getOnBackPressedDispatcher().onBackPressed();
                            setEnabled(true);
                        }
                    }
                );
            }
        };
        getOnBackPressedDispatcher().addCallback(this, retour);
    }
}
