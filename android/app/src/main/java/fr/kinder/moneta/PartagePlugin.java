package fr.kinder.moneta;

import android.content.Intent;
import android.net.Uri;
import androidx.core.content.FileProvider;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.File;
import java.io.FileOutputStream;
import java.nio.charset.StandardCharsets;

// Export Money Lover (D40) : écrit le fichier dans le cache de l'appli, puis ouvre le menu
// « Partager » d'Android (Drive, Fichiers, e-mail…) ; c'est l'utilisateur qui choisit où il va.
@CapacitorPlugin(name = "Partage")
public class PartagePlugin extends Plugin {

    // partager({ nom, texte, type })
    @PluginMethod
    public void partager(PluginCall appel) {
        String nom = appel.getString("nom", "export.csv");
        String texte = appel.getString("texte", "");
        String type = appel.getString("type", "text/csv");
        try {
            File dossier = new File(getContext().getCacheDir(), "exports");
            dossier.mkdirs();
            File fichier = new File(dossier, nom);
            try (FileOutputStream sortie = new FileOutputStream(fichier)) {
                sortie.write(texte.getBytes(StandardCharsets.UTF_8));
            }
            Uri adresse = FileProvider.getUriForFile(
                getContext(), getContext().getPackageName() + ".fileprovider", fichier);
            Intent envoi = new Intent(Intent.ACTION_SEND);
            envoi.setType(type);
            envoi.putExtra(Intent.EXTRA_STREAM, adresse);
            envoi.putExtra(Intent.EXTRA_TITLE, nom);
            envoi.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
            getActivity().startActivity(Intent.createChooser(envoi, nom));
            appel.resolve();
        } catch (Exception erreur) {
            appel.reject("Export impossible : " + erreur.getMessage());
        }
    }
}
