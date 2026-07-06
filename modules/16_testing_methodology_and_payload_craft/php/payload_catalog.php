<?php

/**
 * payload_catalog.php
 *
 * Module 16: Testing Methodology & Payload Craft.
 *
 * PHP equivalent of node/payload_catalog.js -- identical eight entries.
 * See that file's header comment for the full rationale.
 *
 * Introduced in: Module 16.
 */

declare(strict_types=1);

function payload_catalog(): array
{
    return [
        ['name' => 'plain-text-control', 'payload' => 'hello world',
         'note' => 'Benign control case -- should pass through completely unmodified.'],
        ['name' => 'classic-script-tag', 'payload' => '<script>alert(1)</script>',
         'note' => 'The textbook payload (Module 05).'],
        ['name' => 'uppercase-script-tag', 'payload' => '<SCRIPT>alert(1)</SCRIPT>',
         'note' => 'Checks whether a filter is actually case-insensitive.'],
        ['name' => 'nested-script-bypass', 'payload' => '<scrscriptipt>alert(1)</scrscriptipt>',
         'note' => 'A single-pass removal of "script" leaves behind a working tag.'],
        ['name' => 'img-onerror', 'payload' => '<img src=x onerror=alert(1)>',
         'note' => 'No "<script>" tag at all (Module 07\'s Brain Exercise).'],
        ['name' => 'svg-onload', 'payload' => '<svg onload=alert(1)>',
         'note' => 'Another non-script-tag executor.'],
        ['name' => 'body-onload', 'payload' => '<body onload=alert(1)>',
         'note' => 'An event handler on a structural tag.'],
        ['name' => 'javascript-href', 'payload' => '<a href="javascript:alert(1)">click</a>',
         'note' => 'Dangerous URL scheme rather than an inline handler.'],
    ];
}
