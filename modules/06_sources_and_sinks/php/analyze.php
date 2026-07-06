<?php

/**
 * analyze.php
 *
 * Module 06: Sources & Sinks.
 *
 * PHP CLI equivalent of node/analyze.js -- same sample snippets, same
 * classification logic, same output shape. Run with `php analyze.php`.
 *
 * Introduced in: Module 06.
 * Previous module's equivalent: none -- first analysis tool in the course.
 * Prerequisite concepts: Module 05 (Reflected XSS via GET).
 */

declare(strict_types=1);

// SOURCES -- places untrusted data can enter an application
$sources = [
    ['label' => 'GET query string ($_GET / req.query)', 'pattern' => '/\$_GET|req\.query/'],
    ['label' => 'POST body ($_POST / req.body)', 'pattern' => '/\$_POST|req\.body/'],
    ['label' => 'URL fragment (location.hash)', 'pattern' => '/location\.hash/'],
    ['label' => 'Referrer header (document.referrer)', 'pattern' => '/document\.referrer/'],
];

// SINKS -- places that can turn a plain string into executable HTML/JS
$sinks = [
    ['label' => 'innerHTML assignment', 'pattern' => '/\.innerHTML\s*=/'],
    ['label' => 'document.write()', 'pattern' => '/document\.write\(/'],
    ['label' => 'eval()', 'pattern' => '/\beval\(/'],
    ['label' => 'insertAdjacentHTML()', 'pattern' => '/insertAdjacentHTML\(/'],
    ['label' => 'PHP echo/print of HTML', 'pattern' => '/\becho\b/'], // \b not ^\s* -- must match even when echo isn't the first statement on the line
];

const ESCAPE_MARKERS = '/htmlspecialchars\(|encodeURIComponent\(|escapeHtml\(/';

// Same ten samples as the Node version, verbatim -- see that file's
// header comment for why each one was chosen
$samples = [
    'echo "<p>You searched for: {$_GET[\'q\']}</p>";',
    'echo "<p>You searched for: " . htmlspecialchars($_GET[\'q\']) . "</p>";',
    'element.innerHTML = location.hash.substring(1);',
    'element.textContent = location.hash.substring(1);',
    '$stmt->bindParam(\':q\', $_GET[\'q\']);',
    'console.log(req.body.message);',
    'document.write(\'<div>\' + document.referrer + \'</div>\');',
    'eval(location.hash.slice(1));',
    '<img src="/logo.png">',
    '$name = htmlspecialchars($_POST[\'name\']); echo "<p>Hi, $name</p>";',
];

/*
 * find_match -- returns the first source/sink whose pattern matches the line.
 *
 * $rules: array of ['label' => string, 'pattern' => string] entries
 * $line: the code snippet being tested
 * returns: the matching rule's label, or null if nothing matched
 */
function find_match(array $rules, string $line): ?string
{
    foreach ($rules as $rule) {
        if (preg_match($rule['pattern'], $line) === 1) {
            return $rule['label'];
        }
    }
    return null;
}

/*
 * classify -- labels one code snippet as DANGEROUS, SAFE, or informational.
 *
 * line: a single line of code to analyze
 * sources: source rules to check
 * sinks: sink rules to check
 * returns: an array with 'verdict', 'source', 'sink' keys
 *
 * Assumes: source and sink both need to appear on the SAME line to be
 *          flagged DANGEROUS -- see DECISIONS.md #2 for this tool's
 *          named limitation.
 */
function classify(string $line, array $sources, array $sinks): array
{
    $source = find_match($sources, $line);
    $sink = find_match($sinks, $line);
    $escaped = preg_match(ESCAPE_MARKERS, $line) === 1;

    if ($source !== null && $sink !== null && $escaped) {
        $verdict = 'SAFE (source reaches a sink, but passes through an escaping call first)';
    } elseif ($source !== null && $sink !== null) {
        $verdict = 'DANGEROUS (untrusted source flows directly into a sink, unescaped)';
    } elseif ($source !== null) {
        $verdict = 'source only -- no dangerous sink matched on this line (likely fine here)';
    } elseif ($sink !== null) {
        $verdict = 'sink only -- no untrusted source matched on this line (likely fine here)';
    } else {
        $verdict = 'no source/sink pattern matched -- nothing to flag';
    }

    return ['verdict' => $verdict, 'source' => $source, 'sink' => $sink];
}

echo "=== Module 06: Sources & Sinks -- static analysis demo (PHP) ===\n\n";

foreach ($samples as $line) {
    $result = classify($line, $sources, $sinks);
    echo "LINE:    $line\n";
    if ($result['source'] !== null) echo "SOURCE:  {$result['source']}\n";
    if ($result['sink'] !== null) echo "SINK:    {$result['sink']}\n";
    echo "VERDICT: {$result['verdict']}\n";
    echo "---\n";
}
