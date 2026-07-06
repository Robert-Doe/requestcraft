<?php

/**
 * test_runner.php
 *
 * Module 16: Testing Methodology & Payload Craft.
 *
 * PHP CLI equivalent of node/test_runner.js. Run with `php test_runner.php`
 * while target.php is running via `php -S localhost:8000 target.php`.
 *
 * Introduced in: Module 16.
 * Prerequisite concepts: every prior XSS module.
 */

declare(strict_types=1);

require __DIR__ . '/payload_catalog.php';

const TARGET = 'http://localhost:8000';

/*
 * fetch_text -- GETs a URL and returns the response body as a string.
 *
 * url: full URL to fetch
 * returns: response body text
 */
function fetch_text(string $url): string
{
    $result = file_get_contents($url);
    return $result === false ? '' : $result;
}

/*
 * extract_reflection -- pulls the reflected value out of target.php's
 * known response template.
 */
function extract_reflection(string $body): string
{
    if (preg_match('/You searched for: (.*?)<\/p>/s', $body, $m)) {
        return $m[1];
    }
    return '';
}

/*
 * classify -- identical methodology to the Node version's classify().
 * See that file for the full rationale of each branch.
 */
function classify(string $original, string $reflected): string
{
    if ($reflected === $original) {
        return 'RAW REFLECTION -- payload came back byte-for-byte unchanged. Almost certainly executes.';
    }

    $encodedVersion = htmlspecialchars($original, ENT_QUOTES, 'UTF-8');
    if ($reflected === $encodedVersion) {
        return 'ENCODED -- payload was HTML-entity encoded. Safe against THIS sink.';
    }

    if (preg_match('/<[a-z]/i', $reflected) === 1) {
        return "MODIFIED, BUT STILL CONTAINS A RAW TAG -- \"$reflected\" -- filtering happened, sanitization did not. Verify manually.";
    }

    if (trim($reflected) === '') {
        return 'NOT REFLECTED -- payload produced no visible output.';
    }

    return "MODIFIED, no raw tag detected -- \"$reflected\" -- likely safe, but confirm by hand.";
}

$catalog = payload_catalog();
echo 'Sweeping ' . count($catalog) . ' payloads against ' . TARGET . "/search ...\n\n";

foreach ($catalog as $entry) {
    $url = TARGET . '/search?q=' . urlencode($entry['payload']);
    $body = fetch_text($url);
    $reflected = extract_reflection($body);
    $verdict = classify($entry['payload'], $reflected);

    echo "[{$entry['name']}]\n";
    echo "  sent:      {$entry['payload']}\n";
    echo "  reflected: $reflected\n";
    echo "  verdict:   $verdict\n";
    echo "  (why this payload is in the catalog: {$entry['note']})\n\n";
}
