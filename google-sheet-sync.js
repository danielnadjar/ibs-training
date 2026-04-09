// =====================================================================
// IBS Training - Google Apps Script pour synchronisation Google Sheet
// =====================================================================
// INSTRUCTIONS:
// 1. Créez un nouveau Google Sheet
// 2. Menu Extensions > Apps Script
// 3. Collez ce script entier
// 4. Cliquez Exécuter > syncAll (autorisez l'accès)
// 5. Optionnel: Ajouter un déclencheur (Triggers) pour sync automatique
// =====================================================================

var SUPABASE_URL = 'https://cbfypewsudbcuslhpkzx.supabase.co/rest/v1';
var SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNiZnlwZXdzdWRiY3VzbGhwa3p4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ4MTE4NDAsImV4cCI6MjA5MDM4Nzg0MH0.fhL3i5-gg2tPzI7Ezym4QO4YmPfHLsJgyyB65OGkZJg';

function supabaseGet(table, select, order) {
  var url = SUPABASE_URL + '/' + table + '?select=' + encodeURIComponent(select || '*');
  if (order) url += '&order=' + encodeURIComponent(order);
  var resp = UrlFetchApp.fetch(url, {
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': 'Bearer ' + SUPABASE_KEY
    }
  });
  return JSON.parse(resp.getContentText());
}

function writeSheet(name, headers, rows) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
  }
  sheet.clearContents();

  // Headers
  sheet.getRange(1, 1, 1, headers.length).setValues([headers])
    .setFontWeight('bold')
    .setBackground('#1a1a2e')
    .setFontColor('#FFD700');

  // Data
  if (rows.length > 0) {
    sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
  }

  // Auto-resize
  for (var i = 1; i <= headers.length; i++) {
    sheet.autoResizeColumn(i);
  }
}

function syncUtilisateurs() {
  var users = supabaseGet('ibs_users', '*', 'created_at.desc');
  var headers = ['ID', 'Prenom', 'Nom', 'Email', 'Telephone', 'Credits', 'Credits offerts', 'Date inscription'];
  var rows = users.map(function(u) {
    return [
      u.id || '',
      u.firstname || '',
      u.lastname || '',
      u.email || '',
      u.phone || '',
      u.credits || 0,
      u.free_credits_given ? 'Oui' : 'Non',
      u.created_at ? new Date(u.created_at) : ''
    ];
  });
  writeSheet('Utilisateurs', headers, rows);
  return users;
}

function syncTransactions(users) {
  var transactions = supabaseGet('ibs_credit_transactions', '*,ibs_users(firstname,lastname,email)', 'created_at.desc');
  var headers = ['Date', 'Utilisateur', 'Email', 'Type', 'Montant', 'Description', 'Stripe Session'];
  var rows = transactions.map(function(t) {
    var name = '-', email = '-';
    if (t.ibs_users) {
      name = (t.ibs_users.firstname || '') + ' ' + (t.ibs_users.lastname || '');
      email = t.ibs_users.email || '';
    }
    return [
      t.created_at ? new Date(t.created_at) : '',
      name.trim(),
      email,
      t.type || '',
      t.amount || 0,
      t.description || '',
      t.stripe_session_id || ''
    ];
  });
  writeSheet('Transactions', headers, rows);
  return transactions;
}

function syncRapports() {
  var reports = supabaseGet('ibs_reports', '*,ibs_users(firstname,lastname,email)', 'created_at.desc');
  var headers = ['Date', 'Utilisateur', 'Email', 'Outil', 'Nom outil', 'Texte entree', 'Rapport', 'Email envoye'];
  var rows = reports.map(function(r) {
    var name = '-', email = '-';
    if (r.ibs_users) {
      name = (r.ibs_users.firstname || '') + ' ' + (r.ibs_users.lastname || '');
      email = r.ibs_users.email || '';
    }
    return [
      r.created_at ? new Date(r.created_at) : '',
      name.trim(),
      email,
      r.tool_slug || '',
      r.tool_name || '',
      (r.input_text || '').substring(0, 500),
      (r.report_content || '').substring(0, 1000),
      r.emailed ? 'Oui' : 'Non'
    ];
  });
  writeSheet('Rapports', headers, rows);
  return reports;
}

function syncKPIs(users, transactions) {
  var totalUsers = users ? users.length : 0;

  var creditsSold = 0, caEstime = 0, creditsConsumed = 0, creditsGifted = 0;
  var packPrices = { 5: 4.99, 15: 9.99, 50: 24.99, 150: 59.99 };

  if (transactions) {
    transactions.forEach(function(t) {
      if (t.type === 'purchase') {
        creditsSold += (t.amount || 0);
        caEstime += (packPrices[t.amount] || 0);
      } else if (t.type === 'usage') {
        creditsConsumed += Math.abs(t.amount || 0);
      } else if (t.type === 'admin_add' || t.type === 'free') {
        creditsGifted += (t.amount || 0);
      }
    });
  }

  var headers = ['KPI', 'Valeur'];
  var rows = [
    ['Total utilisateurs', totalUsers],
    ['Credits vendus', creditsSold],
    ['CA estime (EUR)', caEstime.toFixed(2)],
    ['Credits consommes', creditsConsumed],
    ['Credits offerts', creditsGifted],
    ['Derniere sync', new Date()]
  ];
  writeSheet('KPIs', headers, rows);
}

// ===== MAIN SYNC =====
function syncAll() {
  var users = syncUtilisateurs();
  var transactions = syncTransactions(users);
  syncRapports();
  syncKPIs(users, transactions);
  SpreadsheetApp.getActiveSpreadsheet().toast('Synchronisation terminee !', 'IBS Sync', 5);
}

// ===== MENU =====
function onOpen() {
  SpreadsheetApp.getUi().createMenu('IBS Sync')
    .addItem('Synchroniser maintenant', 'syncAll')
    .addToUi();
}
