# Oi-7 Entreprise

Application web de devis et factures pour artisans et petites entreprises françaises.
Démo portfolio : React + Vite, PDF généré dans le navigateur (jsPDF), données enregistrées
dans le navigateur (localStorage). Aucun serveur, aucun compte.

## Lancer en local (Windows)

```powershell
cd A:\Projets\devis-factures
npm install      # une seule fois
npm run dev      # ouvre http://localhost:5173
```

Prérequis : Node.js 20 ou plus récent (`node -v` pour vérifier).

## Mode d'emploi

1. **Entreprise** : renseignez nom, SIRET, adresse, contact, N° de TVA, IBAN et logo. Ces informations figurent sur chaque PDF.
2. **Nouveau devis** : le numéro (DEV-AAAA-001) est attribué automatiquement.
3. Choisissez ou saisissez le client, puis ajoutez les lignes (description, quantité, prix unitaire HT, TVA, remise).
   Les totaux se calculent seuls. Une remise globale (% ou €) et des notes sont possibles.
4. **Aperçu** ou **Télécharger le PDF** pour l'envoyer au client.
5. Client d'accord : passez le statut sur « Accepté », puis **Transformer en facture** (numéro FAC-AAAA-001).
6. Suivez tout depuis **Accueil** : chiffre d'affaires, encaissé, à encaisser, en retard, devis en attente.

Une facture « Envoyée » dont l'échéance est dépassée passe automatiquement en « En retard ».

## Où sont mes données ?

Dans le navigateur de cet appareil (localStorage), rien n'est envoyé sur internet.
Vider les données du site efface tous les documents. Un autre navigateur ou appareil ne voit pas ces données.

## Déployer gratuitement

**Vercel** : importer le dépôt, aucune configuration à changer (Vite est détecté, `vercel.json` fourni).
**Netlify** : commande de build `npm run build`, dossier de publication `dist`.
