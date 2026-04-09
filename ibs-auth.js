// =====================================================================
// IBS Auth & Credits System - Shared between training and estimation
// =====================================================================

var IBS = (function() {

  // ===== CONFIG =====
  var SUPABASE_URL = 'https://cbfypewsudbcuslhpkzx.supabase.co/functions/v1';
  var CREDITS_API = SUPABASE_URL + '/ibs-credits-api';
  var STRIPE_CHECKOUT_API = SUPABASE_URL + '/stripe-checkout';
  var STRIPE_PUBLISHABLE_KEY = ''; // Set your pk_live_xxx or pk_test_xxx here
  var FREE_CREDITS_DEFAULT = 3;

  // ===== STATE =====
  var userProfile = null; // { id, firstname, lastname, email, phone, credits }
  var _onLoginCallbacks = [];
  var _configCache = null;

  // ===== LOCAL STORAGE HELPERS =====
  function _save() {
    if (userProfile) {
      localStorage.setItem('ibs_user_profile', JSON.stringify(userProfile));
    }
  }

  function _clear() {
    userProfile = null;
    localStorage.removeItem('ibs_user_profile');
  }

  // ===== API CALLS =====
  async function _api(data) {
    var resp = await fetch(CREDITS_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return await resp.json();
  }

  // ===== PUBLIC: REGISTER =====
  async function register(firstname, lastname, email, phone) {
    var result = await _api({
      action: 'register',
      firstname: firstname,
      lastname: lastname,
      email: email,
      phone: phone
    });

    if (result.user) {
      userProfile = {
        id: result.user.id,
        firstname: result.user.firstname,
        lastname: result.user.lastname,
        email: result.user.email,
        phone: result.user.phone,
        credits: result.user.credits
      };
      _save();
      _fireLogin();
      return { success: true, user: userProfile, free_credits: result.free_credits, message: result.message };
    }
    return { success: false, error: result.error || 'Erreur inconnue' };
  }

  // ===== PUBLIC: SYNC (refresh credits from server) =====
  async function sync() {
    if (!userProfile || !userProfile.email) return false;
    var result = await _api({ action: 'get_user', email: userProfile.email });
    if (result.user) {
      userProfile.credits = result.user.credits;
      userProfile.id = result.user.id;
      _save();
      return true;
    }
    return false;
  }

  // ===== PUBLIC: USE CREDIT =====
  async function useCredit(toolSlug, toolName, amount) {
    if (!userProfile) return { success: false, error: 'Non connecté' };
    var cost = amount || 1;

    var result = await _api({
      action: 'use_credit',
      email: userProfile.email,
      tool_slug: toolSlug,
      tool_name: toolName,
      amount: cost
    });

    if (result.credits !== undefined) {
      userProfile.credits = result.credits;
      _save();
      return { success: true, credits: result.credits };
    }
    return { success: false, error: result.error || 'Erreur' };
  }

  // ===== PUBLIC: SAVE REPORT =====
  async function saveReport(toolSlug, toolName, inputText, reportContent) {
    if (!userProfile) return;
    await _api({
      action: 'save_report',
      email: userProfile.email,
      tool_slug: toolSlug,
      tool_name: toolName,
      input_text: inputText,
      report_content: reportContent
    });
  }

  // ===== PUBLIC: BUY CREDITS (Stripe) =====
  async function buyCredits(packIndex) {
    if (!userProfile) return { success: false, error: 'Non connecté' };

    // Determine which page we're on for return URLs
    var currentPage = window.location.href.split('?')[0];
    var packCredits = [5, 15, 50, 150];
    var credits = packCredits[packIndex] || 5;

    try {
      var resp = await fetch(STRIPE_CHECKOUT_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pack_index: packIndex,
          email: userProfile.email,
          success_url: currentPage + '?payment=success&credits=' + credits,
          cancel_url: currentPage + '?payment=cancel'
        })
      });
      var data = await resp.json();

      if (data.url) {
        // Redirect to Stripe Checkout
        window.location.href = data.url;
        return { success: true, redirecting: true };
      } else if (data.session_id && STRIPE_PUBLISHABLE_KEY) {
        var stripe = Stripe(STRIPE_PUBLISHABLE_KEY);
        await stripe.redirectToCheckout({ sessionId: data.session_id });
        return { success: true, redirecting: true };
      } else {
        return { success: false, error: data.error || 'Erreur Stripe' };
      }
    } catch(e) {
      return { success: false, error: 'Erreur de connexion' };
    }
  }

  // ===== PUBLIC: CHECK PAYMENT RETURN =====
  async function checkPaymentReturn() {
    var params = new URLSearchParams(window.location.search);
    if (params.get('payment') === 'success') {
      // Sync credits from server (webhook should have added them)
      if (userProfile) {
        // Wait a bit for webhook to process
        await new Promise(function(r) { setTimeout(r, 2000); });
        await sync();
      }
      window.history.replaceState({}, '', window.location.pathname);
      return { paid: true, credits: parseInt(params.get('credits') || '0') };
    }
    if (params.get('payment') === 'cancel') {
      window.history.replaceState({}, '', window.location.pathname);
      return { cancelled: true };
    }
    return null;
  }

  // ===== PUBLIC: GET CONFIG =====
  async function getConfig() {
    if (_configCache) return _configCache;
    var result = await _api({ action: 'get_config' });
    if (result.config) {
      _configCache = result.config;
      return result.config;
    }
    return { free_credits: String(FREE_CREDITS_DEFAULT) };
  }

  // ===== PUBLIC: LOAD PROFILE =====
  function loadProfile() {
    var saved = localStorage.getItem('ibs_user_profile');
    if (saved) {
      try {
        userProfile = JSON.parse(saved);
        // Verify user exists server-side and sync
        _verifyAndSync();
        return true;
      } catch(e) { return false; }
    }
    return false;
  }

  // Verify local profile exists in Supabase, force re-register if not
  async function _verifyAndSync() {
    if (!userProfile || !userProfile.email) return;
    try {
      var result = await _api({ action: 'get_user', email: userProfile.email });
      if (result.user) {
        // User exists in Supabase - sync credits
        userProfile.id = result.user.id;
        userProfile.credits = result.user.credits;
        userProfile.firstname = result.user.firstname;
        userProfile.lastname = result.user.lastname;
        _save();
      } else {
        // User NOT in Supabase - try to auto-migrate
        var regResult = await _api({
          action: 'register',
          firstname: userProfile.firstname || 'Utilisateur',
          lastname: userProfile.lastname || '',
          email: userProfile.email,
          phone: userProfile.phone || ''
        });
        if (regResult.user) {
          userProfile.id = regResult.user.id;
          userProfile.credits = regResult.user.credits;
          _save();
        } else {
          // Can't migrate - force logout to re-register properly
          _clear();
        }
      }
    } catch(e) {
      // Network error - keep local profile, will retry next time
    }
  }

  // ===== PUBLIC: LOGOUT =====
  function logout() {
    _clear();
  }

  // ===== PUBLIC: GETTERS =====
  function getUser() { return userProfile; }
  function getCredits() { return userProfile ? (userProfile.credits || 0) : 0; }
  function isLoggedIn() { return !!userProfile; }

  // ===== CALLBACKS =====
  function onLogin(cb) { _onLoginCallbacks.push(cb); }
  function _fireLogin() {
    for (var i = 0; i < _onLoginCallbacks.length; i++) {
      try { _onLoginCallbacks[i](userProfile); } catch(e) {}
    }
  }

  // ===== ADMIN (console) =====
  async function adminAddCredits(email, amount, reason) {
    return await _api({
      action: 'admin_add_credits',
      admin_key: 'coachdaniel2024',
      email: email,
      amount: amount,
      reason: reason || 'Ajout manuel'
    });
  }

  async function adminSetFreeCredits(amount) {
    return await _api({
      action: 'admin_set_free_credits',
      admin_key: 'coachdaniel2024',
      amount: amount
    });
  }

  async function adminListUsers() {
    return await _api({
      action: 'admin_list_users',
      admin_key: 'coachdaniel2024'
    });
  }

  // ===== EXPOSE =====
  return {
    register: register,
    sync: sync,
    useCredit: useCredit,
    saveReport: saveReport,
    buyCredits: buyCredits,
    checkPaymentReturn: checkPaymentReturn,
    getConfig: getConfig,
    loadProfile: loadProfile,
    logout: logout,
    getUser: getUser,
    getCredits: getCredits,
    isLoggedIn: isLoggedIn,
    onLogin: onLogin,
    // Admin
    adminAddCredits: adminAddCredits,
    adminSetFreeCredits: adminSetFreeCredits,
    adminListUsers: adminListUsers
  };

})();
