package fr.kinder.moneta;

import android.app.Activity;
import android.app.PendingIntent;
import androidx.activity.result.ActivityResult;
import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.IntentSenderRequest;
import androidx.activity.result.contract.ActivityResultContracts;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.google.android.gms.auth.api.identity.AuthorizationRequest;
import com.google.android.gms.auth.api.identity.AuthorizationResult;
import com.google.android.gms.auth.api.identity.Identity;
import com.google.android.gms.common.api.ApiException;
import com.google.android.gms.common.api.Scope;
import java.util.Collections;

// Pont vers la bibliothèque officielle Google (D33) : obtient l'autorisation d'accéder
// aux seuls fichiers créés par Moneta dans le Drive, et renvoie un jeton d'accès.
// L'envoi et la lecture de la sauvegarde se font ensuite côté appli (src/donnees/sauvegarde.js).
@CapacitorPlugin(name = "GoogleDrive")
public class GoogleDrivePlugin extends Plugin {

    private static final String PORTEE = "https://www.googleapis.com/auth/drive.file";

    private ActivityResultLauncher<IntentSenderRequest> lanceur;
    private PluginCall appelEnAttente;

    @Override
    public void load() {
        // L'écran de choix du compte Google renvoie son résultat ici.
        lanceur = getActivity().registerForActivityResult(
            new ActivityResultContracts.StartIntentSenderForResult(),
            this::retourDuChoix
        );
    }

    // autoriser({ interactif }) : sans interaction, échoue si Kinder n'a encore jamais accepté.
    @PluginMethod
    public void autoriser(PluginCall appel) {
        boolean interactif = Boolean.TRUE.equals(appel.getBoolean("interactif", false));
        AuthorizationRequest demande = AuthorizationRequest.builder()
            .setRequestedScopes(Collections.singletonList(new Scope(PORTEE)))
            .build();
        Identity.getAuthorizationClient(getActivity())
            .authorize(demande)
            .addOnSuccessListener(resultat -> {
                if (!resultat.hasResolution()) {
                    repondre(appel, resultat);
                } else if (!interactif) {
                    appel.reject("Connexion Google nécessaire", "non_autorise");
                } else {
                    PendingIntent choix = resultat.getPendingIntent();
                    appelEnAttente = appel;
                    lanceur.launch(new IntentSenderRequest.Builder(choix.getIntentSender()).build());
                }
            })
            .addOnFailureListener(erreur -> appel.reject(erreur.getMessage(), "echec"));
    }

    private void retourDuChoix(ActivityResult retour) {
        PluginCall appel = appelEnAttente;
        appelEnAttente = null;
        if (appel == null) return;
        if (retour.getResultCode() != Activity.RESULT_OK) {
            appel.reject("Connexion annulée", "annule");
            return;
        }
        try {
            AuthorizationResult resultat = Identity.getAuthorizationClient(getActivity())
                .getAuthorizationResultFromIntent(retour.getData());
            repondre(appel, resultat);
        } catch (ApiException erreur) {
            appel.reject(erreur.getMessage(), "echec");
        }
    }

    private void repondre(PluginCall appel, AuthorizationResult resultat) {
        JSObject reponse = new JSObject();
        reponse.put("jeton", resultat.getAccessToken());
        appel.resolve(reponse);
    }
}
